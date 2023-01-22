//
//  File.swift
//  
//
//  Created by Patrick Quinn-Graham on 17/1/2023.
//

import AWSLambdaEvents
import AWSLambdaRuntime

import SotoCore
import SotoDynamoDB
import SotoS3

import Foundation

extension AssetsHandlers {
  static func Get(_ event: APIGatewayV2Request, context: LambdaContext) async throws -> APIGatewayV2Response {
      guard let assetTableName = Environment["ART_ASSET_TABLE_NAME"],
            let bucketName = Environment["ART_ASSET_BUCKET_NAME"],
            let bucketRegion = Environment["ART_ASSET_BUCKET_REGION"] else {
        print("One of our environment variables was not set.")
        return try Response.internalServerError()
      }
      
      guard let owner = event.context.authorizer?.jwt.claims?["sub"] else {
        return try Response.forbidden()
      }

      guard let assetId = event.pathParameters?["assetId"], assetId.count > 0 else {
        return try Response.notFound()
      }
      
      //      const dynamo = captureAWSClient(new DynamoDB());
      let client = AWSClient(httpClientProvider: .createNew)
      defer { try? client.syncShutdown() }

      let dynamoS = SotoDynamoDB.DynamoDB(client: client)
      let db = DB(dynamo: dynamoS)
      let assets = db.assets(tableName: assetTableName)
      let s3 = SotoS3.S3(client: client)
          
      do {
        
        guard let asset = try await assets.getAsset(owner: owner, assetId: assetId) else {
          return try Response.notFound()
        }
                          
        let key = "\(owner)/\(assetId)/\(asset.FileName)"

        guard let s3URL = URL(string: "https://s3.\(bucketRegion).amazonaws.com/\(bucketName)/\(key)") else {
          // TODO: Actually do this properly
          throw Errors.cannotGenerateS3URL
        }
        let signedURL = try await s3.signURL(url: s3URL, httpMethod: .GET, expires: .minutes(60))
        
        struct GetAssetResponse: Encodable {
          let asset: Asset
          let singedURL: String
        }
                  
        return try Response.ok(GetAssetResponse(asset: asset, singedURL: signedURL.absoluteString))
      } catch {
        // TODO: Um, errors?
        print("Uh... \(error)")
        return try Response.internalServerError()
      }
  }
}

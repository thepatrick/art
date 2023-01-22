//
//  File.swift
//
//
//  Created by Patrick Quinn-Graham on 17/1/2023.
//

import Foundation
import SotoDynamoDB

struct Asset: Codable {
  let Owner: String
  let AssetId: String
  let Created: Int32
  let LastUpdated: Int32
  let Status: String // TODO: should actually be an enum that is "New" or "Uploaded"
  let FileSize: Int32?
  let FileName: String
  let Name: String?
  let Artist: String?
  let Source: String?
  let Notes: String?

  static func getAsset(dynamo: DynamoDB, tableName assetTableName: String, owner: String, assetId: String) async throws -> Asset? {
    let assetGet = try await dynamo.getItem(DynamoDB.GetItemInput(key: ["Owner": .s(owner), "AssetId": .s(assetId)], tableName: assetTableName), type: Asset.self)

    guard let asset = assetGet.item else {
      return nil
    }
    return asset
  }

}

struct DB {
  let dynamo: DynamoDB
  
  func assets(tableName: String) -> Assets {
    return Assets(dynamo: dynamo, assetTableName: tableName)
  }
  
  struct Assets {
    let dynamo: DynamoDB
    let assetTableName: String

    func getAsset(owner: String, assetId: String) async throws -> Asset? {
      let get = try await dynamo.getItem(DynamoDB.GetItemInput(key: ["Owner": .s(owner), "AssetId": .s(assetId)], tableName: self.assetTableName), type: Asset.self)

      return get.item
    }
  }
}

import AWSLambdaEvents
import AWSLambdaRuntime

import SotoCore
import SotoDynamoDB
import SotoS3

import Foundation

enum Errors: Error {
  case cannotGenerateS3URL
}

@main
struct ArtAPI: SimpleLambdaHandler {
  func handle(_ event: APIGatewayV2Request, context: LambdaContext) async throws -> APIGatewayV2Response {
    switch event.routeKey {
    case "GET /asset/{assetId}":
      return try await AssetsHandlers.Get(event, context: context)
    default:
      return try Response.notFound()
    }
  }
}


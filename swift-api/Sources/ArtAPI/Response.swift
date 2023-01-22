//
//  File.swift
//  
//
//  Created by Patrick Quinn-Graham on 17/1/2023.
//

import Foundation
import AWSLambdaEvents
import AWSLambdaRuntime

enum Response {
  static func r(_ body: Encodable, headers userHeaders: AWSLambdaEvents.HTTPHeaders = [:], statusCode: AWSLambdaEvents.HTTPResponseStatus) throws -> APIGatewayV2Response {
    let headers: AWSLambdaEvents.HTTPHeaders = ["content-type": "application/json"].merging(userHeaders) { $1 }
    
    let e = JSONEncoder()
    let result = try e.encode(body)
    
    return APIGatewayV2Response(statusCode: statusCode, headers: headers, body: String(data: result, encoding: .utf8))
  }

  
  struct ErrorResponse: Encodable {
    let error: String
    let message: String?
  }
  
  static func ok(_ body: Encodable, headers userHeaders: AWSLambdaEvents.HTTPHeaders = [:]) throws -> APIGatewayV2Response {
    return try r(body, headers: userHeaders, statusCode: .ok)
  }

  static func internalServerError(error: String = "Something went wrong :(", message: String? = nil) throws -> APIGatewayV2Response {
    return try r(ErrorResponse(error: error, message: message), headers: [:], statusCode: .internalServerError)
  }
  
  static func notFound(error: String = "Not found", message: String? = nil) throws -> APIGatewayV2Response {
    return try r(ErrorResponse(error: error, message: message), headers: [:], statusCode: .notFound)
  }
  
  static func forbidden(error: String = "Denied", message: String? = nil) throws -> APIGatewayV2Response {
    return try r(ErrorResponse(error: error, message: message), headers: [:], statusCode: .forbidden)
  }
}

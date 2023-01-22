// swift-tools-version: 5.7
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
  name: "ArtAPI",
  platforms: [
    .macOS(.v12),
  ],
  products: [
    .executable(name: "ArtAPI", targets: ["ArtAPI"]),
  ],
  dependencies: [
    // Dependencies declare other packages that this package depends on.
    // .package(url: /* package url */, from: "1.0.0"),
    .package(
      url: "https://github.com/swift-server/swift-aws-lambda-runtime.git", from: "1.0.0-alpha"
    ),
    .package(url: "https://github.com/swift-server/swift-aws-lambda-events.git", branch: "main"),
    .package(url: "https://github.com/soto-project/soto.git", .upToNextMajor(from: "6.0.0")),
  ],
  targets: [
    // Targets are the basic building blocks of a package. A target can define a module or a test suite.
    // Targets can depend on other targets in this package, and on products in packages this package depends on.
    .executableTarget(
      name: "ArtAPI",
      dependencies: [
        .product(name: "AWSLambdaRuntime", package: "swift-aws-lambda-runtime"),
        .product(name: "AWSLambdaEvents", package: "swift-aws-lambda-events"),
        .product(name: "SotoS3", package: "soto"),
        .product(name: "SotoDynamoDB", package: "soto"),
      ]
    ),
    .testTarget(
      name: "swift-apiTests",
      dependencies: ["ArtAPI"]
    ),
  ]
)

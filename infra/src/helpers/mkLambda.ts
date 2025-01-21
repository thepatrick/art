import { iam, lambda, s3 } from "@pulumi/aws";
import { region } from "@pulumi/aws/config";
import { Input } from "@pulumi/pulumi";
import {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyStructuredResultV2,
  S3Event
} from "aws-lambda";
import { betterLambdaName } from "./betterLambdaName";

const bucket = new s3.Bucket("art-lambdas", {
  bucket: betterLambdaName("lambdas")
});

new s3.BucketPublicAccessBlock(
  "art-lambdas/no-public",
  {
    bucket: bucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true
  },
  { parent: bucket }
);

export const mkSwiftLambda = (
  name: string,
  s3Bucket: string,
  s3Key: string,
  role: iam.Role,
  handler: string,
  architecture: "arm64" | "amd64" = "arm64",
  memorySize?: Input<number>,
  environment?: Input<{ [key: string]: Input<string> }>
) =>
  new lambda.Function(name, {
    name: betterLambdaName(name),
    s3Bucket,
    s3Key,
    architectures: [architecture],
    role: role.arn,
    memorySize: memorySize,
    runtime: "provided.al2",
    handler,
    environment
  });

export const mkLambda = (
  name: string,
  callback: lambda.Callback<
    APIGatewayProxyEventV2WithJWTAuthorizer,
    APIGatewayProxyStructuredResultV2
  >,
  role: iam.Role,
  architecture: "arm64" | "amd64" = "arm64"
) =>
  new lambda.CallbackFunction(name, {
    name: betterLambdaName(name),
    callback,
    architectures: ["arm64"],
    role,
    tracingConfig: {
      mode: "Active"
    },
    layers: [
      `arn:aws:lambda:${region}:901920570463:layer:aws-otel-nodejs-${architecture}-ver-1-7-0:2`
    ]
    // s3Bucket: bucket.bucket
  });

export const mkS3NotificationLambda = (
  name: string,
  callback: lambda.Callback<S3Event, void>,
  role: iam.Role,
  architecture: "arm64" | "amd64" = "arm64"
) =>
  new lambda.CallbackFunction(name, {
    name: betterLambdaName(name),
    callback,
    architectures: ["arm64"],
    role,
    tracingConfig: {
      mode: "Active"
    },
    layers: [
      `arn:aws:lambda:${region}:901920570463:layer:aws-otel-nodejs-${architecture}-ver-1-7-0:2`
    ]
  });

export interface Headers {
  [header: string]: boolean | number | string;
}

export const r = (
  statusCode: number,
  headers: Headers = {},
  body?: unknown
) => ({
  statusCode,
  headers: { "content-type": "application/json", ...headers },
  body: body !== null ? JSON.stringify(body) : undefined
});

export const internalServerError = (notes: string, error: unknown) => {
  console.log(`Error from ${notes}`, error);
  return r(500, {}, { error: "Internal server error" });
};

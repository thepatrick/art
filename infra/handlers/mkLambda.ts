import { iam, lambda, s3 } from "@pulumi/aws";
import { region } from "@pulumi/aws/config";
import { getProject, getStack } from "@pulumi/pulumi";
import {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyStructuredResultV2
} from "aws-lambda";

const betterLambdaName = (namePrefix: string) =>
  `${getProject()}-${getStack()}-${namePrefix
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

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

import { lambda, s3, sns } from "@pulumi/aws";
import { getPolicyDocumentOutput } from "@pulumi/aws/iam/getPolicyDocument";
import { interpolate } from "@pulumi/pulumi";
import { betterLambdaName } from "../helpers/betterLambdaName";
import { processAsset } from "../routes/handlers/processAsset";

export const assetsBucket = new s3.Bucket("art-assets", {
  bucket: betterLambdaName("assets")
});

new s3.BucketPublicAccessBlock(
  "art-assets/no-public",
  {
    bucket: assetsBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true
  },
  { parent: assetsBucket }
);

const allowBucket = new lambda.Permission("art-asssets/new-file", {
  statementIdPrefix: "new-file",
  action: "lambda:InvokeFunction",
  function: processAsset.arn,
  principal: "s3.amazonaws.com",
  sourceArn: assetsBucket.arn
});

// new s3.BucketNotification(
//   "art-assets",
//   {
//     bucket: assetsBucket.id,
//     lambdaFunctions: [
//       {
//         lambdaFunctionArn: processAsset.arn,
//         events: ["s3:ObjectCreated:*"]
//       }
//     ]
//   },
//   { dependsOn: [assetsBucket, processAsset] }
// );

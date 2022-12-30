import { lambdaRole } from "../../../roles/lambdaRole";
import { mkLambda } from "../../../helpers/mkLambda";
import { DynamoDB, S3 } from "aws-sdk";
import { captureAWSClient, getSegment, Segment } from "aws-xray-sdk-core";
import { Asset, assetsTable } from "../../../tables/assetsTable";
import { all } from "@pulumi/pulumi";
import { assetsBucket } from "../../../buckets/assets";

export const getAsset = all([
  assetsTable.name,
  assetsBucket.bucket,
  assetsBucket.region
]).apply(([tableName, bucketName, bucketRegion]) =>
  mkLambda(
    "getAsset",
    async (ev, ctx) => {
      const owner = ev.requestContext.authorizer.jwt.claims.sub;

      if (typeof owner !== "string") {
        return {
          statusCode: 403,
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ error: "Nope" })
        };
      }

      (getSegment() as Segment).setUser(owner);

      const assetId = ev.pathParameters?.assetId;
      if (assetId === undefined || assetId.length === 0) {
        return {
          statusCode: 404,
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ error: "Asset not found" })
        };
      }

      const dynamo = captureAWSClient(new DynamoDB());

      try {
        const assetGet = await dynamo
          .getItem({
            TableName: tableName,
            Key: DynamoDB.Converter.marshall({
              Owner: owner,
              AssetId: assetId
            })
          })
          .promise();

        const assetRaw = assetGet.Item;

        if (assetRaw == null) {
          return {
            statusCode: 404,
            headers: {
              "content-type": "application/json"
            },
            body: JSON.stringify({
              error: "Surface not found",
              responseError: JSON.stringify(assetGet.$response.error)
            })
          };
        }

        const asset = DynamoDB.Converter.unmarshall(assetRaw) as Asset;

        const key = `${owner}/${assetId}/${asset.FileName}`;

        const s3 = new S3({ signatureVersion: "v4", region: bucketRegion });

        const signedURL = await s3.getSignedUrlPromise("getObject", {
          Bucket: bucketName,
          Key: key,
          Expires: 30 * 60
        });

        return {
          statusCode: 200,
          headers: { "content-type": "application/json " },
          body: JSON.stringify({ asset, signedURL })
        };
      } catch (err) {
        console.log(`Error processing in dynamo: ${err}`, err);
        return {
          statusCode: 500,
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ error: "Something went wrong :(" })
        };
      }
    },
    lambdaRole
  )
);

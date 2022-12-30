import { lambdaRole } from "../../../roles/lambdaRole";
import { mkLambda } from "../../../helpers/mkLambda";
import { DynamoDB, S3 } from "aws-sdk";
import { captureAWSClient, getSegment, Segment } from "aws-xray-sdk-core";
import { assetsTable } from "../../../tables/assetsTable";
import { all } from "@pulumi/pulumi";
import { assetsBucket } from "../../../buckets/assets";

interface AssetInfoBody {
  filename?: string;
}

export const listAssets = all([
  assetsTable.name,
  assetsBucket.bucket,
  assetsBucket.region
]).apply(([tableName, bucketName, bucketRegion]) =>
  mkLambda(
    "listAssets",
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

      (getSegment() as Segment).setUser(`${owner}`);

      const dynamo = captureAWSClient(new DynamoDB());

      try {
        const items = await dynamo
          .query({
            TableName: tableName,
            KeyConditionExpression: "#owner_id = :owner",
            ExpressionAttributeNames: {
              "#owner_id": "Owner"
            },
            ExpressionAttributeValues: {
              ":owner": {
                S: owner
              }
            }
          })
          .promise();

        const returnable = items.Items?.map((item) =>
          DynamoDB.Converter.unmarshall(item)
        );

        return {
          statusCode: 200,
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ items: returnable })
        };
      } catch (error) {
        console.log("Error", error);
        return {
          statusCode: 200,
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            error: "Nope",
            // TODO: Remove this (leaking error message)
            message: (error as Error).message
          })
        };
      }
    },
    lambdaRole
  )
);

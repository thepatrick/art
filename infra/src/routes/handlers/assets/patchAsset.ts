import { lambdaRole } from "../../../roles/lambdaRole";
import { mkLambda } from "../../../helpers/mkLambda";
import { DynamoDB } from "aws-sdk";
import { captureAWSClient, getSegment, Segment } from "aws-xray-sdk-core";
import { assetsTable } from "../../../tables/assetsTable";
import { all } from "@pulumi/pulumi";
import {
  ExpressionAttributeNameMap,
  ExpressionAttributeValueMap
} from "aws-sdk/clients/dynamodb";

interface PatchAssetInfoBody {
  Name?: string;
  Artist?: string;
  Source?: string;
  Notes?: string;
}

export const patchAsset = all([assetsTable.name]).apply(([tableName]) =>
  mkLambda(
    "patchAsset",
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

      const { body } = ev;
      if (body == null) {
        return {
          statusCode: 400,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ error: "Invalid body" })
        };
      }
      var assetInfo: PatchAssetInfoBody;
      try {
        assetInfo = JSON.parse(body) as PatchAssetInfoBody;
        // TODO: type checking on this
        if (assetInfo == null || typeof assetInfo !== "object") {
          throw new Error("Invalid body");
        }
      } catch (err) {
        return {
          statusCode: 400,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ error: "Invalid body" })
        };
      }

      try {
        let updateExpressionParts = [];
        let expressionAttributeNames: ExpressionAttributeNameMap = {};
        let expressionAttributeValues: ExpressionAttributeValueMap = {};

        for (const key of ["Name", "Artist", "Source", "Notes"]) {
          if (Object.prototype.hasOwnProperty.call(assetInfo, key)) {
            updateExpressionParts.push(`#${key} = :${key}`);
            expressionAttributeNames[`#${key}`] = key;
            expressionAttributeValues[`:${key}`] = DynamoDB.Converter.input(
              assetInfo[key as keyof PatchAssetInfoBody]
            );
          }
        }

        if (updateExpressionParts.length !== 0) {
          await dynamo
            .updateItem({
              TableName: tableName,
              Key: DynamoDB.Converter.marshall({
                Owner: owner,
                AssetId: assetId
              }),
              ConditionExpression: "#Owner = :Owner AND AssetId = :AssetId",
              UpdateExpression: `SET ${updateExpressionParts.join(", ")}`,
              ExpressionAttributeNames: {
                ...expressionAttributeNames,
                "#Owner": "Owner"
              },
              ExpressionAttributeValues: {
                ...expressionAttributeValues,
                ":Owner": DynamoDB.Converter.input(owner),
                ":AssetId": DynamoDB.Converter.input(assetId)
              }
            })
            .promise();
        }

        const assetGet = await dynamo
          .getItem({
            TableName: tableName,
            Key: DynamoDB.Converter.marshall({
              Owner: owner,
              AssetId: assetId
            })
          })
          .promise();

        const item = assetGet.Item;

        if (item == null) {
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

        return {
          statusCode: 200,
          headers: { "content-type": "application/json " },
          body: JSON.stringify({ asset: DynamoDB.Converter.unmarshall(item) })
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

import { lambdaRole } from "../../../roles/lambdaRole";
import { internalServerError, mkLambda, r } from "../../../helpers/mkLambda";
import { DynamoDB } from "aws-sdk";
import { captureAWSClient, getSegment, Segment } from "aws-xray-sdk-core";
import { assetsTable } from "../../../tables/assetsTable";
import { all } from "@pulumi/pulumi";
import {
  ExpressionAttributeNameMap,
  ExpressionAttributeValueMap
} from "aws-sdk/clients/dynamodb";
import { Surface, surfaceTable } from "../../../tables/surfaceTable";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";

interface PatchSurfaceBody {
  Name?: string;
  Rotation?: number;
}
export const patchSurface = all([surfaceTable.name]).apply(
  ([surfaceTableName]) =>
    mkLambda(
      "patchSurface",
      async (ev, ctx) => {
        const owner = ev.requestContext.authorizer.jwt.claims.sub;
        if (typeof owner !== "string") {
          return r(403, {}, { error: "Nope" });
        }

        (getSegment() as Segment).setUser(owner);

        const surfaceId = ev.pathParameters?.surfaceId;
        if (surfaceId === undefined || surfaceId.length === 0) {
          return r(404, {}, { error: "Surface not found" });
        }

        const dynamo = captureAWSClient(new DynamoDB());

        const { body } = ev;
        if (body == null) {
          return r(400, {}, { error: "Invalid body" });
        }

        var surfaceInfo: PatchSurfaceBody;
        try {
          surfaceInfo = JSON.parse(body) as PatchSurfaceBody;
          // TODO: type checking on this
          if (surfaceInfo == null || typeof surfaceInfo !== "object") {
            throw new Error("Invalid body");
          }
        } catch (err) {
          return r(400, {}, { error: "Invalid body" });
        }

        try {
          let updateExpressionParts: string[] = [
            "#LastUpdated = :NewLastUpdated"
          ];
          let expressionAttributeNames: ExpressionAttributeNameMap = {};
          let expressionAttributeValues: { [key: string]: unknown } = {};

          for (const key of ["Name", "Rotation"]) {
            if (Object.prototype.hasOwnProperty.call(surfaceInfo, key)) {
              updateExpressionParts.push(`#${key} = :${key}`);
              expressionAttributeNames[`#${key}`] = key;
              expressionAttributeValues[`:${key}`] =
                surfaceInfo[key as keyof PatchSurfaceBody];
            }
          }

          try {
            await dynamo
              .updateItem({
                TableName: surfaceTableName,
                Key: DynamoDB.Converter.marshall({
                  Owner: owner,
                  SurfaceId: surfaceId
                }),
                ConditionExpression:
                  "#Owner = :Owner AND SurfaceId = :SurfaceId",
                UpdateExpression: `SET ${updateExpressionParts.join(", ")}`,
                ExpressionAttributeNames: {
                  ...expressionAttributeNames,
                  "#Owner": "Owner",
                  "#LastUpdated": "LastUpdated"
                },
                ExpressionAttributeValues: DynamoDB.Converter.marshall({
                  ...expressionAttributeValues,
                  ":Owner": owner,
                  ":SurfaceId": surfaceId,
                  ":NewLastUpdated": Date.now()
                })
              })
              .promise();
          } catch (err) {
            if (err instanceof ConditionalCheckFailedException) {
              return r(404, {}, { error: "Surface not found" });
            } else {
              throw err;
            }
          }

          const updatedSurfaceGet = await dynamo
            .getItem({
              TableName: surfaceTableName,
              Key: DynamoDB.Converter.marshall({
                Owner: owner,
                SurfaceId: surfaceId
              })
            })
            .promise();
          const updatedSurfaceRaw = updatedSurfaceGet.Item;
          if (updatedSurfaceRaw == null) {
            console.log(
              "Failed to get playlist after updating, this is... weird",
              updatedSurfaceGet.$response.error
            );
            return r(404, {}, { error: "Surface not found" });
          }

          const updatedSurface = DynamoDB.Converter.unmarshall(
            updatedSurfaceRaw
          ) as Surface;

          return r(200, {}, { surface: updatedSurface });
        } catch (err) {
          return internalServerError("patchSurface", err);
        }
      },
      lambdaRole
    )
);

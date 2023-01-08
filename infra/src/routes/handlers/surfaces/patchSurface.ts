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
import {
  ConditionalCheckFailedException,
  ReturnValue
} from "@aws-sdk/client-dynamodb";
import { playlistsTable } from "../../../tables/playlistsTable";

interface PatchSurfaceBody {
  Name?: string;
  Rotation?: number;
  PlaylistId?: string | null;
}

export const patchSurface = all([surfaceTable.name, playlistsTable.name]).apply(
  ([surfaceTableName, playlistTableName]) =>
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
          let removeExpressionParts: string[] = [];
          let expressionAttributeNames: ExpressionAttributeNameMap = {};
          let expressionAttributeValues: { [key: string]: unknown } = {};

          const playlistId = surfaceInfo.PlaylistId;
          if (playlistId != null) {
            // verify this playlist exists
            const playlistGet = await dynamo
              .getItem({
                TableName: playlistTableName,
                Key: DynamoDB.Converter.marshall({
                  Owner: owner,
                  PlaylistId: playlistId
                }),
                ProjectionExpression: "PlaylistId"
              })
              .promise();

            const item = playlistGet.Item;

            if (item == undefined) {
              return r(
                422,
                {},
                {
                  error:
                    "Playlist ID must exist (use null to clear current PlaylistId)"
                }
              );
            }
          }

          for (const key of ["Name", "Rotation", "PlaylistId"]) {
            if (Object.prototype.hasOwnProperty.call(surfaceInfo, key)) {
              const value = surfaceInfo[key as keyof PatchSurfaceBody];
              expressionAttributeNames[`#${key}`] = key;
              if (value !== null) {
                updateExpressionParts.push(`#${key} = :${key}`);
                expressionAttributeValues[`:${key}`] = value;
              } else {
                removeExpressionParts.push(`#${key}`);
              }
            }
          }
          let setStatement = `SET ${updateExpressionParts.join(", ")}`;
          let removeStatement =
            removeExpressionParts.length > 0
              ? ` REMOVE ${removeExpressionParts.join(", ")}`
              : "";

          try {
            const updatedSurfaceRequest = await dynamo
              .updateItem({
                TableName: surfaceTableName,
                Key: DynamoDB.Converter.marshall({
                  Owner: owner,
                  SurfaceId: surfaceId
                }),
                ConditionExpression:
                  "#Owner = :Owner AND SurfaceId = :SurfaceId",
                UpdateExpression: `${setStatement}${removeStatement}`,
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
                }),
                ReturnValues: "ALL_NEW"
              })
              .promise();

            const updatedSurfaceRaw = updatedSurfaceRequest.Attributes;
            if (updatedSurfaceRaw == null) {
              console.log(
                "Failed to get surface after updating, this is... weird",
                updatedSurfaceRequest.$response.error
              );
              return r(404, {}, { error: "Surface not found" });
            }

            const updatedSurface = DynamoDB.Converter.unmarshall(
              updatedSurfaceRaw
            ) as Surface;

            return r(200, {}, { surface: updatedSurface });
          } catch (err) {
            if (err instanceof ConditionalCheckFailedException) {
              return r(404, {}, { error: "Surface not found" });
            } else {
              throw err;
            }
          }
        } catch (err) {
          return internalServerError("patchSurface", err);
        }
      },
      lambdaRole
    )
);

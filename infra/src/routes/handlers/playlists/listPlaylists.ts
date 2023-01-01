import { lambdaRole } from "../../../roles/lambdaRole";
import { mkLambda } from "../../../helpers/mkLambda";
import { DynamoDB } from "aws-sdk";
import {
  captureAWSClient,
  getSegment,
  Segment,
  captureAsyncFunc
} from "aws-xray-sdk-core";
import { playlistsTable, Playlist } from "../../../tables/playlistsTable";

export const listPlaylists = playlistsTable.name.apply((tableName) =>
  mkLambda(
    "listPlaylists",
    async (ev, ctx) => {
      const owner = ev.requestContext.authorizer.jwt.claims.sub;
      if (typeof owner !== "string") {
        return {
          statusCode: 403,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ error: "Nope" })
        };
      }

      (getSegment() as Segment).setUser(owner);

      const dynamo = captureAWSClient(new DynamoDB());

      try {
        const items = await dynamo
          .query({
            TableName: tableName,
            KeyConditionExpression: "#owner_id = :owner",
            ExpressionAttributeNames: {
              "#owner_id": "Owner",
              "#name": "Name,"
            },
            ExpressionAttributeValues: {
              ":owner": { S: owner }
            },
            ProjectionExpression:
              "#owner_id, PlaylistId, Created, LastUpdated, #name"
          })
          .promise();

        const returnable = items.Items?.map((item) =>
          DynamoDB.Converter.unmarshall(item)
        );

        return {
          statusCode: 200,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ playlists: returnable })
        };
      } catch (error) {
        console.log("Error", error);
        return {
          statusCode: 200,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            error: "Internal server error"
          })
        };
      }
    },
    lambdaRole
  )
);

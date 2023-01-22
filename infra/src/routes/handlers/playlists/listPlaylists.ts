import { lambdaRole } from "../../../roles/lambdaRole";
import { mkLambda, mkResponses } from "../../../helpers/mkLambda";
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
      const r = mkResponses();

      const owner = ev.requestContext.authorizer.jwt.claims.sub;
      if (typeof owner !== "string") {
        return r.forbidden({}, { error: "Nope" });
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

        return r.ok({}, { playlists: returnable });
      } catch (error) {
        return r.internalServerError("Error", error);
      }
    },
    lambdaRole
  )
);

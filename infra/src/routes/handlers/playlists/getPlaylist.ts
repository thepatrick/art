import { lambdaRole } from "../../../roles/lambdaRole";
import { mkLambda } from "../../../helpers/mkLambda";
import { DynamoDB } from "aws-sdk";
import { captureAWSClient, getSegment, Segment } from "aws-xray-sdk-core";
import { playlistsTable, Playlist } from "../../../tables/playlistsTable";

interface Headers {
  [header: string]: boolean | number | string;
}

export const getPlaylist = playlistsTable.name.apply((tableName) =>
  mkLambda(
    "getPlaylist",
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

      const playlistId = ev.pathParameters?.playlistId;
      if (playlistId === undefined || playlistId.length === 0) {
        return {
          statusCode: 404,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ error: "Asset not found" })
        };
      }

      const ifMatch = ev.headers["if-match"]
        ?.split(",")
        .map((ifM) => ifM.trim().slice(1, -1));

      const dynamo = captureAWSClient(new DynamoDB());

      try {
        const playlistGet = await dynamo
          .getItem({
            TableName: tableName,
            Key: DynamoDB.Converter.marshall({
              Owner: owner,
              PlaylistId: playlistId
            })
          })
          .promise();

        const playlistRaw = playlistGet.Item;

        if (playlistRaw == null) {
          return {
            statusCode: 404,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              error: "Surface not found",
              responseError: JSON.stringify(playlistGet.$response.error)
            })
          };
        }

        const playlist = DynamoDB.Converter.unmarshall(playlistRaw) as Playlist;

        const etag = `${playlistId}-${playlist.LastUpdated}`;

        if (ifMatch?.includes(etag)) {
          return { statusCode: 304 };
        }

        return {
          statusCode: 200,
          headers: {
            "content-type": "application/json",
            etag: `"${etag}"`
          } as Headers, // otherwise typescript complains about etag?: undefined which... no?
          body: JSON.stringify({ playlist })
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

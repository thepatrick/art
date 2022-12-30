import { lambdaRole } from "../../../roles/lambdaRole";
import { mkLambda } from "../../../helpers/mkLambda";
import { DynamoDB } from "aws-sdk";
import { nanoid } from "nanoid";
import {
  captureAWSClient,
  getSegment,
  Segment,
  captureAsyncFunc
} from "aws-xray-sdk-core";
import { playlistsTable, Playlist } from "../../../tables/playlistsTable";

interface CreatePlaylistBody {
  Name: string;
}

export const createPlaylist = playlistsTable.name.apply((tableName) =>
  mkLambda(
    "createPlaylist",
    async (ev, ctx) => {
      const owner = ev.requestContext.authorizer.jwt.claims.sub;
      (getSegment() as Segment).setUser(`${owner}`);

      const dynamo = captureAWSClient(new DynamoDB());

      const id = nanoid();

      const { body } = ev;
      if (body == null) {
        return {
          statusCode: 400,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ error: "Invalid body" })
        };
      }
      var playlistBody: CreatePlaylistBody;
      try {
        playlistBody = JSON.parse(body) as CreatePlaylistBody;
        // TODO: type checking on this
        if (playlistBody == null || typeof playlistBody !== "object") {
          throw new Error("Invalid body");
        }
      } catch (err) {
        return {
          statusCode: 400,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ error: "Invalid body" })
        };
      }

      let name = playlistBody.Name.trim();

      if (name === "") {
        name = `Untitled Playlist (${id})`;
      }

      const playlist: Playlist = {
        Owner: `${owner}`,
        PlaylistId: id,
        Created: Date.now(),
        LastUpdated: Date.now(),
        Name: name,
        Scenes: []
      };

      try {
        await dynamo
          .putItem({
            TableName: tableName,
            Item: DynamoDB.Converter.marshall(playlist)
          })
          .promise();
      } catch (error) {
        console.log("Error", error);
        return {
          statusCode: 200,
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ error: "Nope" })
        };
      }

      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ id, owner })
      };
    },
    lambdaRole
  )
);

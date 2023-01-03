import { lambdaRole } from "../../../roles/lambdaRole";
import { mkLambda } from "../../../helpers/mkLambda";
import { AWSError, DynamoDB } from "aws-sdk";
import { captureAWSClient, getSegment, Segment } from "aws-xray-sdk-core";
import {
  playlistsTable,
  Playlist,
  PlaylistScene
} from "../../../tables/playlistsTable";
import {
  ExpressionAttributeNameMap,
  ExpressionAttributeValueMap
} from "aws-sdk/clients/dynamodb";
import { before } from "node:test";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";

interface Headers {
  [header: string]: boolean | number | string;
}

interface PatchAssetInfoBodySceneChangeAdd {
  Change: "Add";
  Assets: { AssetId: string }[];
  Duration: number;
  Before?: number;
}
interface PatchAssetInfoBodySceneChangeRemove {
  Change: "Remove";
  Scene: number;
}

type PatchAssetInfoBodySceneChange =
  | PatchAssetInfoBodySceneChangeAdd
  | PatchAssetInfoBodySceneChangeRemove;

interface PatchPlaylistInfoBody {
  Name?: string;
  SceneChanges?: PatchAssetInfoBodySceneChange[];
}

const r = (statusCode: number, headers: Headers = {}, body?: unknown) => ({
  statusCode,
  headers: { "content-type": "application/json", ...headers },
  body: body !== null ? JSON.stringify(body) : undefined
});

export const patchPlaylist = playlistsTable.name.apply((tableName) =>
  mkLambda(
    "patchPlaylist",
    async (ev, ctx) => {
      const owner = ev.requestContext.authorizer.jwt.claims.sub;
      if (typeof owner !== "string") {
        return r(403, {}, { error: "Nope" });
      }

      (getSegment() as Segment).setUser(owner);

      const playlistId = ev.pathParameters?.playlistId;
      if (playlistId === undefined || playlistId.length === 0) {
        return r(404, {}, { error: "Asset not found" });
      }

      const ifMatch = ev.headers["if-match"]
        ?.split(",")
        .map((ifM) => ifM.trim().slice(1, -1));

      const possibleEtag = ifMatch?.[0].split("-");

      if (possibleEtag == null || ifMatch?.length !== 1) {
        return r(
          400,
          {},
          { error: "Invalid If-Match - either none or more than one provided" }
        );
      }

      const [etagPlaylistId, etagLastUpdatedRaw] = possibleEtag;
      if (etagPlaylistId !== playlistId || etagLastUpdatedRaw == null) {
        return r(400, {}, { error: "Invalid If-Match" });
      }

      const etagLastUpdated = parseInt(etagLastUpdatedRaw, 10);
      if (isNaN(etagLastUpdated)) {
        return r(400, {}, { error: "Invalid If-Match" });
      }

      const dynamo = captureAWSClient(new DynamoDB());

      const { body } = ev;
      if (body == null) {
        return r(400, {}, { error: "Invalid body" });
      }

      var playlistInfo: PatchPlaylistInfoBody;
      try {
        playlistInfo = JSON.parse(body) as PatchPlaylistInfoBody;
        // TODO: type checking on this
        if (playlistInfo == null || typeof playlistInfo !== "object") {
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

        const existingPlaylistGet = await dynamo
          .getItem({
            TableName: tableName,
            Key: DynamoDB.Converter.marshall({
              Owner: owner,
              PlaylistId: playlistId
            }),
            ProjectionExpression: "LastUpdated, Scenes"
          })
          .promise();

        const existingPlaylistRaw = existingPlaylistGet.Item;

        if (existingPlaylistRaw == null) {
          console.log(
            "Failed to get playlist",
            existingPlaylistGet.$response.error
          );
          return r(404, {}, { error: "Surface not found" });
        }
        const existingPlaylist = DynamoDB.Converter.unmarshall(
          existingPlaylistRaw
        ) as Pick<Playlist, "LastUpdated" | "Scenes">;

        if (existingPlaylist.LastUpdated !== etagLastUpdated) {
          return r(412, {}, { error: "Incorrect etag" });
        }

        const sceneChanges = playlistInfo.SceneChanges;
        if (sceneChanges != null && sceneChanges.length > 0) {
          const newScenes = sceneChanges.reduce((prev, curr) => {
            switch (curr.Change) {
              case "Add":
                const assets = curr.Assets.map(({ AssetId }) => ({ AssetId }));
                // we need to validate all these assets...

                const newScene: PlaylistScene = {
                  Duration: curr.Duration,
                  Assets: assets
                };
                const before = curr.Before;
                if (before === undefined) {
                  return [...prev, newScene];
                } else {
                  return [
                    ...prev.slice(0, before),
                    newScene,
                    ...prev.slice(before)
                  ];
                }
              case "Remove":
                return [
                  ...prev.slice(0, curr.Scene),
                  ...prev.slice(curr.Scene + 1)
                ];
                break;
            }
            return prev;
          }, existingPlaylist.Scenes);

          updateExpressionParts.push("#Scenes = :Scenes");
          expressionAttributeNames["#Scenes"] = "Scenes";
          expressionAttributeValues[":Scenes"] = newScenes;
        }

        for (const key of ["Name"]) {
          if (Object.prototype.hasOwnProperty.call(playlistInfo, key)) {
            updateExpressionParts.push(`#${key} = :${key}`);
            expressionAttributeNames[`#${key}`] = key;
            expressionAttributeValues[`:${key}`] =
              playlistInfo[key as keyof PatchPlaylistInfoBody];
          }
        }

        try {
          await dynamo
            .updateItem({
              TableName: tableName,
              Key: DynamoDB.Converter.marshall({
                Owner: owner,
                PlaylistId: playlistId
              }),
              ConditionExpression:
                "#Owner = :Owner AND PlaylistId = :PlaylistId AND #LastUpdated = :PreviousLastUpdated",
              UpdateExpression: `SET ${updateExpressionParts.join(", ")}`,
              ExpressionAttributeNames: {
                ...expressionAttributeNames,
                "#Owner": "Owner",
                "#LastUpdated": "LastUpdated"
              },
              ExpressionAttributeValues: DynamoDB.Converter.marshall({
                ...expressionAttributeValues,
                ":Owner": owner,
                ":PlaylistId": playlistId,
                ":NewLastUpdated": Date.now(),
                ":PreviousLastUpdated": etagLastUpdated
              })
            })
            .promise();
        } catch (err) {
          if (err instanceof ConditionalCheckFailedException) {
            return r(
              412,
              {},
              { error: "Item has been modified or no longer exists" }
            );
          } else {
            throw err;
          }
        }

        const updatedPlaylistGet = await dynamo
          .getItem({
            TableName: tableName,
            Key: DynamoDB.Converter.marshall({
              Owner: owner,
              PlaylistId: playlistId
            })
          })
          .promise();

        const updatedPlaylistRaw = updatedPlaylistGet.Item;

        if (updatedPlaylistRaw == null) {
          console.log(
            "Failed to get playlist",
            updatedPlaylistGet.$response.error
          );
          return r(404, {}, { error: "Surface not found" });
        }

        const updatedPlaylist = DynamoDB.Converter.unmarshall(
          updatedPlaylistRaw
        ) as Playlist;

        const etag = `${playlistId}-${updatedPlaylist.LastUpdated}`;

        return r(200, { etag: `"${etag}"` }, { playlist: updatedPlaylist });
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

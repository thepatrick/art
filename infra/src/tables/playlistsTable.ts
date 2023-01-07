import { dynamodb } from "@pulumi/aws";
import { getProject, getStack } from "@pulumi/pulumi";
import { betterLambdaName } from "../helpers/betterLambdaName";

export const playlistsTable = new dynamodb.Table("playlists", {
  name: betterLambdaName("playlists"),
  attributes: [
    { name: "Owner", type: "S" },
    { name: "PlaylistId", type: "S" }
  ],
  billingMode: "PAY_PER_REQUEST",
  hashKey: "Owner",
  rangeKey: "PlaylistId",
  tags: {
    project: getProject(),
    stack: getStack()
  }
});

interface PlaylistSceneAsset {
  AssetId: string;
}

export interface PlaylistScene {
  Assets: PlaylistSceneAsset[];
  Duration: number;
}

export interface Playlist {
  Owner: string;
  PlaylistId: string;
  Created: number;
  LastUpdated: number;
  Name: string;
  Scenes: PlaylistScene[];
}

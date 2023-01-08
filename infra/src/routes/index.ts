import { LambdaRouteInfo } from "../helpers/LambdaRoute";
import { registerSurface } from "./handlers/registerSurface";
import { listSurfaces } from "./handlers/listSurfaces";
import { testAuth } from "./handlers/testAuth";
import { helloSurface } from "./handlers/surfaces/helloSurface";
import { uploadAsset } from "./handlers/uploadAsset";
import { listAssets } from "./handlers/assets/listAssets";
import { patchAsset } from "./handlers/assets/patchAsset";
import { getAsset } from "./handlers/assets/getAsset";
import { createPlaylist } from "./handlers/playlists/createPlaylist";
import { listPlaylists } from "./handlers/playlists/listPlaylists";
import { getPlaylist } from "./handlers/playlists/getPlaylist";
import { patchPlaylist } from "./handlers/playlists/patchPlaylist";
import { patchSurface } from "./handlers/surfaces/patchSurface";

export const routes: LambdaRouteInfo[] = [
  {
    method: "GET",
    path: "/test",
    lambda: testAuth,
    scopes: ["surface"],
    description: "Test authentication"
  },
  {
    method: "POST",
    path: "/surface/register",
    lambda: registerSurface,
    scopes: ["surface"],
    description: "Used by surfaces to self-register"
  },
  {
    method: "GET",
    path: "/surface",
    lambda: listSurfaces,
    scopes: ["surface"],
    description: "List user's surfaces"
  },
  {
    method: "PATCH",
    path: "/surface/{surfaceId}",
    lambda: patchSurface,
    scopes: ["surface"],
    description: "Update existing surfaces"
  },
  {
    method: "GET",
    path: "/surface/{surfaceId}/hello",
    lambda: helloSurface,
    scopes: ["surface"],
    description: "Initialisation information for a given surface"
  },
  {
    method: "POST",
    path: "/asset",
    lambda: uploadAsset,
    scopes: ["asset:write"],
    description: "Upload assets"
  },
  {
    method: "GET",
    path: "/asset",
    lambda: listAssets,
    scopes: ["asset:write"],
    description: "List my assets"
  },
  {
    method: "PATCH",
    path: "/asset/{assetId}",
    lambda: patchAsset,
    scopes: ["asset:write"],
    description: "Update asset metadata"
  },
  {
    method: "GET",
    path: "/asset/{assetId}",
    lambda: getAsset,
    scopes: ["asset:write"],
    description: "Update asset metadata"
  },
  {
    method: "POST",
    path: "/playlist",
    lambda: createPlaylist,
    scopes: ["asset:write"],
    description: "Create a playlist"
  },
  {
    method: "GET",
    path: "/playlist",
    lambda: listPlaylists,
    scopes: ["asset:write"],
    description: "List playlists"
  },
  {
    method: "GET",
    path: "/playlist/{playlistId}",
    lambda: getPlaylist,
    scopes: ["asset:write"],
    description: "Get single playlist"
  },
  {
    method: "PATCH",
    path: "/playlist/{playlistId}",
    lambda: patchPlaylist,
    scopes: ["asset:write"],
    description: "Update playlist"
  }
];

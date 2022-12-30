import { LambdaRouteInfo } from "../helpers/LambdaRoute";
import { registerSurface } from "./handlers/registerSurface";
import { listSurfaces } from "./handlers/listSurfaces";
import { testAuth } from "./handlers/testAuth";
import { helloSurface } from "./handlers/helloSurface";
import { uploadAsset } from "./handlers/uploadAsset";
import { listAssets } from "./handlers/assets/listAssets";
import { patchAsset } from "./handlers/assets/patchAsset";
import { getAsset } from "./handlers/assets/getAsset";
import { createPlaylist } from "./handlers/playlists/createPlaylist";

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
  }
];

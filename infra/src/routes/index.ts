import { LambdaRouteInfo } from "../helpers/LambdaRoute";
import { registerSurface } from "./handlers/registerSurface";
import { listSurfaces } from "./handlers/listSurfaces";
import { testAuth } from "./handlers/testAuth";
import { helloSurface } from "./handlers/helloSurface";
import { uploadAsset } from "./handlers/uploadAsset";
import { listAssets } from "./handlers/assets/listAssets";

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
  }
];

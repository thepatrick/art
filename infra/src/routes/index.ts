import { LambdaRouteInfo } from "../helpers/LambdaRoute";
import { registerSurface } from "./handlers/registerSurface";
import { listSurfaces } from "./handlers/listSurfaces";
import { testAuth } from "./handlers/testAuth";

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
  }
];

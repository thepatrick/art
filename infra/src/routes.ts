import { lambda } from "@pulumi/aws";
import { listSurfaces, registerSurface } from "../handlers/registerScreen";
import { testAuth } from "../handlers/testAuth";

interface LambdaRoute {
  method: "GET" | "POST";
  path: string;
  lambda: lambda.Function;
  scopes: string[];
  description: string;
}

export const routes: LambdaRoute[] = [
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

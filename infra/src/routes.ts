import { testAuth } from "../handlers/testAuth";

export const routes = [
  {
    method: "GET",
    path: "/test",
    lambda: testAuth,
    scopes: ["surface"],
    description: "Test authentication"
  }
];

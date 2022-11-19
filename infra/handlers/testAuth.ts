import { lambdaRole } from "../roles/lambdaRole";
import { mkLambda } from "./mkLambda";

export const testAuth = mkLambda(
  "testAuth",
  async (ev, ctx) => {
    return {
      statusCode: 200,
      body: `Hello ${ev.requestContext.authorizer.jwt.claims.sub}`
    };
  },
  lambdaRole
);

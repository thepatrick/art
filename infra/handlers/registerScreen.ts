import { lambdaRole } from "../roles/lambdaRole";
import { mkLambda } from "./mkLambda";

export const registerSurface = mkLambda(
  "registerSurface",
  async (ev, ctx) => {
    return {
      statusCode: 200,
      body: JSON.stringify(ev)
    };
  },
  lambdaRole
);

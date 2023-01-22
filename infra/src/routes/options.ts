import { lambdaRole } from "../roles/lambdaRole";
import { mkLambda, r } from "../helpers/mkLambda";
import { optionsHeaders } from "./optionsHeaders";

export const options = mkLambda(
  "options",
  async (ev, ctx) => {
    const origin = ev.headers.origin;

    return r(
      204,
      {
        ...optionsHeaders(origin),
        vary: "accept-encoding, origin"
      },
      null
    );
  },
  lambdaRole
);

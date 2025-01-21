import { lambdaRole } from "../../roles/lambdaRole";
import { mkSwiftLambda } from "../../helpers/mkLambda";
import { lambdaBucket, lambdaObject } from "../../swiftLambda";
import { surfaceTable } from "../../tables/surfaceTable";


export const artLambdaTests = mkSwiftLambda(
  "artLambdaTests",
  lambdaBucket,
  lambdaObject,
  lambdaRole,
  "ArtLambdaTests",
  'arm64',
  128,
  {
    SURFACE_TABLE: surfaceTable.name
  }
);

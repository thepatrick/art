import { lambda } from "@pulumi/aws";
import { getProject, getStack } from "@pulumi/pulumi";
import { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { betterLambdaName } from "../roles/betterRoleName";
import { lambdaRole } from "../roles/lambdaRole";

export const testAuth = new lambda.CallbackFunction("testAuth", {
  name: betterLambdaName(`${getProject()}-${getStack()}-test-auth`),
  callback: async (ev: APIGatewayProxyEventV2WithJWTAuthorizer, ctx) => {
    return {
      statusCode: 200,
      body: JSON.stringify(ev)
    };
  },
  architectures: ["arm64"],
  role: lambdaRole
});

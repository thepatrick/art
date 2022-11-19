import { iam, lambda } from "@pulumi/aws";
import { getProject, getStack } from "@pulumi/pulumi";
import { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";

const betterLambdaName = (namePrefix: string) =>
  `${getProject()}-${getStack()}-${namePrefix
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

export const mkLambda = <R>(
  name: string,
  callback: lambda.Callback<APIGatewayProxyEventV2WithJWTAuthorizer, R>,
  role: iam.Role
) =>
  new lambda.CallbackFunction(name, {
    name: betterLambdaName(name),
    callback,
    architectures: ["arm64"],
    role
  });

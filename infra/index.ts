// import * as pulumi from "@pulumi/pulumi";
import { apigatewayv2, iam, lambda } from "@pulumi/aws";
import { getProject, getStack } from "@pulumi/pulumi";
import { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { apiRole } from "./roles/apiRole";
import { lambdaRole } from "./roles/lambdaRole";
import { LambdaRoute } from "./Route";

const testAuth = new lambda.CallbackFunction("testAuth", {
  callback: async (ev: APIGatewayProxyEventV2WithJWTAuthorizer, ctx) => {
    return {
      statusCode: 200,
      body: JSON.stringify(ev)
    };
  },
  role: lambdaRole
});

const api = new apigatewayv2.Api("art-apigw", {
  protocolType: "HTTP",
  description: `${getProject()} ${getStack()} API`,
  name: `${getProject()}-${getStack()}`,
  corsConfiguration: {
    allowCredentials: true,
    allowHeaders: ["authorization", "content-type"],
    allowMethods: ["GET", "POST"],
    allowOrigins: ["http://localhost:1234"]
  }
});

const authorizer = new apigatewayv2.Authorizer("art-apigw/authorizer", {
  name: "auth0",
  apiId: api.id,
  authorizerType: "JWT",
  identitySources: ["$request.header.Authorization"],
  jwtConfiguration: {
    audiences: ["https://artprojector.p2.network/"],
    issuer: "https://twopats.au.auth0.com/"
  }
});

const lambdaAccess: iam.PolicyDocument = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: "lambda:*",
      Resource: [testAuth.arn]
    }
  ]
};

new iam.RolePolicy("art-apigw/lambda-access", {
  namePrefix: "LambdaAccess",
  policy: lambdaAccess,
  role: apiRole.name
});

const whoami = new LambdaRoute("art-apigw/whoami", {
  api,
  description: "Whoami?",
  apiRole,
  lambda: testAuth,
  routeKey: "GET /echo",
  authorization: {
    scopes: ["surface"],
    id: authorizer.id,
    type: "JWT"
  }
});

const apiDeployment = new apigatewayv2.Deployment(
  "art-apigw/deployment",
  {
    description: `${getProject()}-${getStack()} API`,
    apiId: api.id
  },
  { dependsOn: [whoami.route] }
);

const apiStage = new apigatewayv2.Stage("art-apigw/stage", {
  deploymentId: apiDeployment.id,
  description: `${getProject()}-${getStack()} API`,
  apiId: api.id,
  name: "v1",
  autoDeploy: true
});

export const url = apiStage.invokeUrl;

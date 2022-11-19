// import * as pulumi from "@pulumi/pulumi";
import { apigatewayv2, iam } from "@pulumi/aws";
import { getProject, getStack, output } from "@pulumi/pulumi";
import { apiRole } from "./roles/apiRole";
import { mkRoutes } from "./helpers/LambdaRoute";
import { routes } from "./routes";

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

const routesOutput = mkRoutes(routes, api, apiRole, authorizer);

const apiDeployment = new apigatewayv2.Deployment(
  "art-apigw/deployment",
  {
    description: `${getProject()}-${getStack()} API`,
    apiId: api.id
  },
  { dependsOn: routesOutput.dependRoutes }
);

new iam.RolePolicy("art-apigw/lambda-access", {
  name: "LambdaAccess",
  policy: {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: "lambda:*",
        Resource: routesOutput.lambdas.map((lambda) => lambda.arn)
      }
    ]
  },
  role: apiRole.name
});

const apiStage = new apigatewayv2.Stage("art-apigw/stage", {
  deploymentId: apiDeployment.id,
  description: `${getProject()}-${getStack()} API`,
  apiId: api.id,
  name: "v1",
  autoDeploy: true
});

export const url = apiStage.invokeUrl;

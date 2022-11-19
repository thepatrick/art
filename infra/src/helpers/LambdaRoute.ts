import { apigatewayv2, iam, lambda } from "@pulumi/aws";
import { Role } from "@pulumi/aws/iam";
import {
  ComponentResource,
  ComponentResourceOptions,
  Input,
  interpolate,
  Output,
  output
} from "@pulumi/pulumi";

interface RouteArgs {
  api: apigatewayv2.Api;
  description: string;
  connectionType?: "INTERNET" | "VPC_LINK";
  apiRole: Role;
  passthroughBehavior?: "WHEN_NO_MATCH" | "WHEN_NO_TEMPLATES" | "NEVER";
  timeoutMilliseconds?: number; // default: 29000,
  lambda: Input<lambda.Function>;
  routeKey: string;
  authorization?: {
    scopes: string[];
    id: Input<string>;
    type: "JWT";
  };
}

export class LambdaRoute extends ComponentResource {
  route: apigatewayv2.Route;

  constructor(
    name: string,
    {
      api,
      description,
      connectionType,
      apiRole,
      passthroughBehavior,
      timeoutMilliseconds,
      lambda,
      routeKey,
      authorization
    }: RouteArgs,
    opts?: ComponentResourceOptions
  ) {
    super("p2-network:apigw:Route", name, {}, opts);

    const integration = new apigatewayv2.Integration(
      `${name}/integration`,
      {
        apiId: api.id,
        description,
        connectionType: connectionType ?? "INTERNET",
        credentialsArn: apiRole.arn,
        passthroughBehavior,
        timeoutMilliseconds,
        integrationType: "AWS_PROXY",
        integrationMethod: "POST",
        payloadFormatVersion: "2.0",
        integrationUri: output(lambda).invokeArn
      },
      { parent: this }
    );

    const routeAuthorization = authorization
      ? {
          authorizationScopes: authorization.scopes,
          authorizerId: authorization.id,
          authorizationType: authorization.type
        }
      : undefined;

    const route = new apigatewayv2.Route(
      `${name}/route`,
      {
        apiId: api.id,
        routeKey,
        target: interpolate`integrations/${integration.id}`,
        ...routeAuthorization
      },
      { parent: this }
    );

    this.registerOutputs({
      integration,
      route
    });

    this.route = route;
  }
}

export interface LambdaRouteInfo {
  method: "GET" | "POST";
  path: string;
  lambda: Input<lambda.Function>;
  scopes: string[];
  description: string;
}

interface LearnedRoutes {
  lambdas: Output<lambda.Function>[];
  dependRoutes: apigatewayv2.Route[];
}

export const mkRoutes = (
  routes: LambdaRouteInfo[],
  api: apigatewayv2.Api,
  apiRole: iam.Role,
  authorizer: apigatewayv2.Authorizer
) => {
  const base: LearnedRoutes = {
    lambdas: [],
    dependRoutes: []
  };

  return routes.reduce((prev, curr) => {
    const lambdaRoute = new LambdaRoute(
      `art-apigw/${curr.method}${curr.path}`,
      {
        api,
        description: curr.description,
        apiRole,
        lambda: curr.lambda,
        routeKey: `${curr.method} ${curr.path}`,
        authorization: {
          scopes: curr.scopes,
          id: authorizer.id,
          type: "JWT"
        }
      }
    );

    return {
      lambdas: [...prev.lambdas, output(curr.lambda)],
      dependRoutes: [...prev.dependRoutes, lambdaRoute.route]
    };
  }, base);
};

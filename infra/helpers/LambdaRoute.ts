import { apigatewayv2, lambda } from "@pulumi/aws";
import { Role } from "@pulumi/aws/iam";
import {
  ComponentResource,
  ComponentResourceOptions,
  Input,
  interpolate,
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

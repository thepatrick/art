import { iam } from "@pulumi/aws";
import { getProject, getStack } from "@pulumi/pulumi";
import { betterRoleName } from "./betterRoleName";

export const apiRole = new iam.Role("art-apigw", {
  path: `/project/${getProject()}/${getStack()}/`,
  name: betterRoleName(`${getProject()}-${getStack()}-APIGateway`),

  assumeRolePolicy: {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: {
          Service: "apigateway.amazonaws.com"
        },
        Action: "sts:AssumeRole"
      }
    ]
  }
});

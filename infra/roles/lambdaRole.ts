import { iam } from "@pulumi/aws";
import { getProject, getStack } from "@pulumi/pulumi";
import { surfaceTable } from "../handlers/surfaceTable";
import { assumeRolePolicy } from "./assumeRolePolicy";
import { betterRoleName } from "./betterRoleName";

export const lambdaRole = new iam.Role("art-lambda", {
  path: `/project/${getProject()}/${getStack()}/`,
  name: betterRoleName(`${getProject()}-${getStack()}-Lambdas`),
  managedPolicyArns: [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
  ],
  assumeRolePolicy: assumeRolePolicy.lambda
});

new iam.RolePolicy("art-lambda/dynaodb", {
  name: "Databases",
  policy: {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: ["dynamodb:Get*", "dynamodb:Put*"],
        Resource: surfaceTable.arn
      }
    ]
  },
  role: lambdaRole.name
});

import { iam } from "@pulumi/aws";
import { getProject, getStack } from "@pulumi/pulumi";
import { assumeRolePolicy } from "./assumeRolePolicy";
import { betterRoleName } from "./betterRoleName";

export const lambdaRole = new iam.Role("art-lambda", {
  path: `/project/${getProject()}/${getStack()}/`,
  name: betterRoleName(`${getProject()}-${getStack()}-Lambdas`),
  managedPolicyArns: [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  ],
  assumeRolePolicy: assumeRolePolicy.lambda
});

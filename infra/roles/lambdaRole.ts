import { iam } from "@pulumi/aws";
import { assumeRolePolicy } from "./assumeRolePolicy";

export const lambdaRole = new iam.Role("art-lambda", {
  path: "/project/art/",
  namePrefix: "Lambda",
  managedPolicyArns: [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  ],
  assumeRolePolicy: assumeRolePolicy.lambda
});

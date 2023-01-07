import { iam } from "@pulumi/aws";
import { getProject, getStack, interpolate } from "@pulumi/pulumi";
import { assetsBucket } from "../buckets/assets";
import { assetsTable } from "../tables/assetsTable";
import { playlistsTable } from "../tables/playlistsTable";
import { surfaceTable } from "../tables/surfaceTable";
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
        Action: [
          "dynamodb:BatchGetItem",
          "dynamodb:Get*",
          "dynamodb:Put*",
          "dynamodb:Update*",
          "dynamodb:Query*"
        ],
        Resource: [surfaceTable.arn, assetsTable.arn, playlistsTable.arn]
      }
    ]
  },
  role: lambdaRole.name
});

new iam.RolePolicy("art-lambda/s3", {
  name: "S3",
  policy: {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: ["s3:Put*", "s3:Get*"],
        Resource: interpolate`${assetsBucket.arn}/*`
      }
    ]
  },
  role: lambdaRole.name
});

import { iam } from "@pulumi/aws";

export const apiRole = new iam.Role("art-apigw", {
  path: "/project/art/",
  namePrefix: "APIGW",
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

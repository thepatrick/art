import { iam } from "@pulumi/aws";

export const assumeRolePolicy: { lambda: iam.PolicyDocument } = {
  lambda: {
    Version: "2012-10-17",
    Statement: [
      {
        Principal: {
          Service: "lambda.amazonaws.com"
        },
        Action: "sts:AssumeRole",
        Effect: "Allow"
      }
    ]
  }
};

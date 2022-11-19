import { dynamodb } from "@pulumi/aws";
import { getProject, getStack } from "@pulumi/pulumi";

export const surfaceTable = new dynamodb.Table("surfaces", {
  attributes: [
    { name: "Owner", type: "S" },
    { name: "SurfaceId", type: "S" }
  ],
  billingMode: "PAY_PER_REQUEST",
  hashKey: "Owner",
  rangeKey: "SurfaceId",
  tags: {
    project: getProject(),
    stack: getStack()
  }
});

export interface Surface {
  Owner: string;
  SurfaceId: string;
  Created: number;
  LastUpdated: number;
}

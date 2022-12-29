import { dynamodb } from "@pulumi/aws";
import { getProject, getStack } from "@pulumi/pulumi";
import { betterLambdaName } from "../helpers/betterLambdaName";

export const assetsTable = new dynamodb.Table("assets", {
  name: betterLambdaName("assets"),
  attributes: [
    { name: "Owner", type: "S" },
    { name: "AssetId", type: "S" }
  ],
  billingMode: "PAY_PER_REQUEST",
  hashKey: "Owner",
  rangeKey: "AssetId",
  tags: {
    project: getProject(),
    stack: getStack()
  }
});

export enum AssetStatus {
  New = "New",
  Uploaded = "Uploaded"
}

export interface Asset {
  Owner: string;
  AssetId: string;
  Created: number;
  LastUpdated: number;
  Status: AssetStatus;
  FileSize?: Number;
  FileName: String;
}

import { lambdaRole } from "../../roles/lambdaRole";
import { mkLambda, mkS3NotificationLambda } from "../../helpers/mkLambda";
import { DynamoDB, S3 } from "aws-sdk";
import { nanoid } from "nanoid";
import { captureAWSClient, getSegment, Segment } from "aws-xray-sdk-core";
import { Asset, assetsTable, AssetStatus } from "../../tables/assetsTable";
import { all, asset } from "@pulumi/pulumi";
import { assetsBucket } from "../../buckets/assets";
import { basename, extname } from "path";

// TODO:
// 1. also set ContentType: .whatever
// 2. (stretch) analyse

interface AssetInfoBody {
  filename?: string;
}

export const processAsset = all([assetsTable.name]).apply(([tableName]) =>
  mkS3NotificationLambda(
    "processAsset",
    async (ev, ctx) => {
      for (const record of ev.Records) {
        const object = record.s3.object;

        // github%7C7331/LhU2-GnypDLarMt-_YlR9/02-4k..jpg

        const [ownerFromKey, assetIdFromKey, fileName] = object.key.split("/");

        const owner = decodeURIComponent(ownerFromKey);
        const assetId = decodeURIComponent(assetIdFromKey);

        console.log(`Look up Owner ${owner}, AssetId ${assetId}...`);

        if (ownerFromKey == null || assetId == null) {
          console.log("Something fishy going on, skipping");
          continue;
        }

        (getSegment() as Segment).setUser(`${owner}`);

        const dynamo = captureAWSClient(new DynamoDB());

        try {
          const assetGet = await dynamo
            .getItem({
              TableName: tableName,
              Key: DynamoDB.Converter.marshall({
                Owner: owner,
                AssetId: assetId
              })
            })
            .promise();

          const assetRaw = assetGet.Item;

          if (assetRaw == null) {
            console.log(
              "This item does not exist, should probably auto cleanup s3 or something..."
            );
            continue;
          }

          const asset = DynamoDB.Converter.unmarshall(assetRaw) as Asset;

          if (asset.Status !== AssetStatus.New) {
            console.log(
              `This asset is not in the new state, ignoring (it is ${asset.Status})`
            );
            continue;
          }

          await dynamo
            .updateItem({
              TableName: tableName,
              Key: DynamoDB.Converter.marshall({
                Owner: owner,
                AssetId: assetId
              }),
              UpdateExpression:
                "SET #filesize = :filesize, #status = :status, #lastupdated = :lastupdated",
              ExpressionAttributeNames: {
                "#filesize": "FileSize",
                "#status": "Status",
                "#lastupdated": "LastUpdated"
              },
              ExpressionAttributeValues: DynamoDB.Converter.marshall({
                ":filesize": object.size,
                ":status": AssetStatus.Uploaded,
                ":lastupdated": Date.now()
              })
            })
            .promise();

          console.log("Completed, on to the next!");

          // const asset
        } catch (err) {
          console.log(`Error processing in dynamo: ${err}`, err);
          continue;
        }

        console.log(
          `we got notified about ${object.key} (size: ${
            object.size
          }), ${JSON.stringify(record)}`
        );
      }
    },
    lambdaRole
  )
);

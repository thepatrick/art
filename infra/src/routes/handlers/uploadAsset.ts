import { lambdaRole } from "../../roles/lambdaRole";
import { mkLambda } from "../../helpers/mkLambda";
import { DynamoDB, S3 } from "aws-sdk";
import { nanoid } from "nanoid";
import { captureAWSClient, getSegment, Segment } from "aws-xray-sdk-core";
import { Asset, assetsTable, AssetStatus } from "../../tables/assetsTable";
import { all } from "@pulumi/pulumi";
import { assetsBucket } from "../../buckets/assets";
import { basename, extname } from "path";

interface AssetInfoBody {
  filename?: string;
}

export const uploadAsset = all([
  assetsTable.name,
  assetsBucket.bucket,
  assetsBucket.region
]).apply(([tableName, bucketName, bucketRegion]) =>
  mkLambda(
    "uploadAsset",
    async (ev, ctx) => {
      const owner = ev.requestContext.authorizer.jwt.claims.sub;
      (getSegment() as Segment).setUser(`${owner}`);

      const dynamo = captureAWSClient(new DynamoDB());

      const id = nanoid();

      const { body } = ev;
      if (body == null) {
        return {
          statusCode: 400,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ error: "Invalid body" })
        };
      }
      var assetInfo: AssetInfoBody;
      try {
        assetInfo = JSON.parse(body) as AssetInfoBody;
        // TODO: type checking on this
        if (assetInfo == null || typeof assetInfo !== "object") {
          throw new Error("Invalid body");
        }
      } catch (err) {
        return {
          statusCode: 400,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ error: "Invalid body" })
        };
      }

      const userFileName = assetInfo.filename;

      if (
        userFileName == null ||
        userFileName.length === 0 ||
        !userFileName.includes(".")
      ) {
        return {
          statusCode: 400,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ error: "Invalid filename" })
        };
      }

      const userExtension = extname(userFileName);
      const userBase = basename(userFileName, userExtension);

      const fileName =
        userBase
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLocaleLowerCase()
          .replace(/[^a-z0-9]+/g, "-") + userExtension;

      const item: Asset = {
        Owner: `${owner}`,
        AssetId: id,
        Created: Date.now(),
        LastUpdated: Date.now(),
        Status: AssetStatus.New,
        FileName: fileName
      };

      try {
        await dynamo
          .putItem({
            TableName: tableName,
            Item: DynamoDB.Converter.marshall(item)
          })
          .promise();
      } catch (error) {
        console.log("Error", error);
        return {
          statusCode: 500,
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ error: "Nope" })
        };
      }

      const client = new S3({
        signatureVersion: "v4",
        region: bucketRegion
        // endpoint: new Endpoint(`${bucket}.s3-accelerate.amazonaws.com`),
        // useAccelerateEndpoint: true,
      });

      const key = `${owner}/${id}/${fileName}`;

      const signedURL = await client.getSignedUrlPromise("putObject", {
        Bucket: bucketName,
        Key: key,
        Expires: 30 * 60
        // UploadId: decodedToken.sub,
        // PartNumber: body.partNumber + 1,
      });

      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ id, owner, signedURL })
      };
    },
    lambdaRole
  )
);

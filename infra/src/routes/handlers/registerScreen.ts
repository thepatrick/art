import { lambdaRole } from "../../roles/lambdaRole";
import { mkLambda } from "../../helpers/mkLambda";
import { DynamoDB } from "aws-sdk";
import { nanoid } from "nanoid";
import { Surface, surfaceTable } from "../../tables/surfaceTable";
import {
  captureAWSClient,
  getSegment,
  Segment,
  captureAsyncFunc
} from "aws-xray-sdk-core";

export const registerSurface = surfaceTable.name.apply((tableName) =>
  mkLambda(
    "registerSurface",
    async (ev, ctx) => {
      const owner = ev.requestContext.authorizer.jwt.claims.sub;
      (getSegment() as Segment).setUser(`${owner}`);

      const dynamo = captureAWSClient(new DynamoDB());

      const id = nanoid();

      const item: Surface = {
        Owner: `${owner}`,
        SurfaceId: id,
        Created: Date.now(),
        LastUpdated: Date.now()
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
          statusCode: 200,
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ error: "Nope" })
        };
      }

      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ id, owner })
      };
    },
    lambdaRole
  )
);

export const listSurfaces = surfaceTable.name.apply((tableName) =>
  mkLambda(
    "listSurfaces",
    async (ev, ctx) => {
      const owner = ev.requestContext.authorizer.jwt.claims.sub;

      if (typeof owner !== "string") {
        return {
          statusCode: 403,
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ error: "Nope" })
        };
      }

      (getSegment() as Segment).setUser(`${owner}`);

      const dynamo = captureAWSClient(new DynamoDB());

      try {
        const items = await dynamo
          .query({
            TableName: tableName,
            KeyConditionExpression: "Owner = :owner",
            ExpressionAttributeValues: {
              owner: {
                S: owner
              }
            }
          })
          .promise();

        const returnable = items.Items?.map((item) =>
          DynamoDB.Converter.unmarshall(item)
        );

        return {
          statusCode: 200,
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ items: returnable })
        };
      } catch (error) {
        console.log("Error", error);
        return {
          statusCode: 200,
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ error: "Nope" })
        };
      }
    },
    lambdaRole
  )
);

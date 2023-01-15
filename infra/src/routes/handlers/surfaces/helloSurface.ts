import { lambdaRole } from "../../../roles/lambdaRole";
import { mkLambda } from "../../../helpers/mkLambda";
import { DynamoDB } from "aws-sdk";
import { Surface, surfaceTable } from "../../../tables/surfaceTable";
import { captureAWSClient, getSegment, Segment } from "aws-xray-sdk-core";

export const helloSurface = surfaceTable.name.apply((tableName) =>
  mkLambda(
    "helloSurface",
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

      const surfaceId = ev.pathParameters?.surfaceId;
      if (surfaceId === undefined || surfaceId.length === 0) {
        return {
          statusCode: 404,
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ error: "Surface not found" })
        };
      }

      const dynamo = captureAWSClient(new DynamoDB());

      try {
        const screen = await dynamo
          .getItem({
            TableName: tableName,
            Key: DynamoDB.Converter.marshall({
              Owner: owner,
              SurfaceId: surfaceId
            }),
            ExpressionAttributeNames: {
              "#Name": "Name"
            },
            ProjectionExpression: "Rotation, #Name, PlaylistId"
          })
          .promise();

        const item = screen.Item;

        if (item == null) {
          return {
            statusCode: 404,
            headers: {
              "content-type": "application/json"
            },
            body: JSON.stringify({
              error: "Surface not found",
              responseError: JSON.stringify(screen.$response.error)
            })
          };
        }

        const returnable = DynamoDB.Converter.unmarshall(item) as Pick<
          Surface,
          "Rotation" | "Name" | "PlaylistId"
        >;

        return {
          statusCode: 200,
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ surface: returnable })
        };
      } catch (error) {
        console.log("Error", error);
        return {
          statusCode: 200,
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            error: "Nope",
            message: (error as Error).message
          })
        };
      }
    },
    lambdaRole
  )
);

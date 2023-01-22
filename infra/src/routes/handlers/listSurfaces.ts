import { lambdaRole } from "../../roles/lambdaRole";
import { mkLambda, mkResponses } from "../../helpers/mkLambda";
import { DynamoDB } from "aws-sdk";
import { surfaceTable } from "../../tables/surfaceTable";
import { captureAWSClient, getSegment, Segment } from "aws-xray-sdk-core";
import { optionsHeaders } from "../optionsHeaders";

export const listSurfaces = surfaceTable.name.apply((tableName) =>
  mkLambda(
    "listSurfaces",
    async (ev, ctx) => {
      const owner = ev.requestContext.authorizer.jwt.claims.sub;

      const r = mkResponses();

      if (typeof owner !== "string") {
        return r.forbidden({}, { error: "Nope" });
      }

      (getSegment() as Segment).setUser(`${owner}`);

      const dynamo = captureAWSClient(new DynamoDB());

      try {
        const items = await dynamo
          .query({
            TableName: tableName,
            KeyConditionExpression: "#owner_id = :owner",
            ExpressionAttributeNames: {
              "#owner_id": "Owner"
            },
            ExpressionAttributeValues: {
              ":owner": {
                S: owner
              }
            }
          })
          .promise();

        const returnable = items.Items?.map((item) =>
          DynamoDB.Converter.unmarshall(item)
        );

        return r.ok({}, { items: returnable });
      } catch (error) {
        return r.internalServerError("List surfaces error:", error);
      }
    },
    lambdaRole
  )
);

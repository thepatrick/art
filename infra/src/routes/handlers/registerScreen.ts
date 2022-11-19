import { lambdaRole } from "../../roles/lambdaRole";
import { mkLambda } from "../../helpers/mkLambda";
import { DynamoDB } from "aws-sdk";
import { nanoid } from "nanoid";
import { Surface, surfaceTable } from "../../tables/surfaceTable";

export const registerSurface = surfaceTable.name.apply((tableName) =>
  mkLambda(
    "registerSurface",
    async (ev, ctx) => {
      const dynamo = new DynamoDB();

      const owner = ev.requestContext.authorizer.jwt.claims.sub;
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

export const listSurfaces = mkLambda(
  "listSurfaces",
  async (ev, ctx) => {
    return {
      statusCode: 200,
      body: JSON.stringify(ev)
    };
  },
  lambdaRole
);

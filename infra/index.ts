// import * as pulumi from "@pulumi/pulumi";
import { lambda } from "@pulumi/aws";
import { RestAPI } from "@pulumi/aws-apigateway";

// A Lambda function to invoke
const fn = new lambda.CallbackFunction("fn", {
    callback: async (ev, ctx) => {
        return {
            statusCode: 200,
            body: new Date().toISOString(),
        };
    }
})

// A REST API to route requests to HTML content and the Lambda function
const api = new RestAPI("api", {
    stageName: 'v1',
    routes: [
        { path: "/", localPath: "www"},
        { path: "/date", method: "GET", eventHandler: fn },
    ]
});

// The URL at which the REST API will be served.
export const url = api.url;

import { Config } from "@pulumi/pulumi";

const config = new Config("aws");
export const region = config.require("region");

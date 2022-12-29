import { getProject, getStack } from "@pulumi/pulumi";

export const betterLambdaName = (namePrefix: string) =>
  `${getProject()}-${getStack()}-${namePrefix
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

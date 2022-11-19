import { RandomPet } from "@pulumi/random";

export const betterRoleName = (namePrefix: string) =>
  new RandomPet(`betterName:role:${namePrefix}:PET`, {
    prefix: `${namePrefix.replace(/[^a-zA-Z0-9]+/g, "-")}`
  }).id;

export const betterLambdaName = (namePrefix: string) =>
  new RandomPet(`betterName:lambda:${namePrefix}:PET`, {
    prefix: `${namePrefix.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-")}`
  }).id;

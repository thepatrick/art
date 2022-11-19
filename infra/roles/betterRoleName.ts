import { RandomPet } from "@pulumi/random";

export const betterRoleName = (namePrefix: string) =>
  new RandomPet(`betterName:role:${namePrefix}:PET`, {
    prefix: `${namePrefix.replace(/[^a-zA-Z0-9]+/g, "-")}`
  }).id;

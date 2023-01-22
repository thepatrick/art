import { corsConfiguration } from "../api-gateway";

export const optionsHeaders = (origin: string | undefined) => {
  if (!corsConfiguration.allowCredentials) {
    return undefined;
  }

  if (!origin) {
    return undefined;
  }

  const allowed = corsConfiguration.allowOrigins.find(
    (allowedOrigin) => allowedOrigin === origin
  );

  if (allowed == null) {
    return undefined;
  }

  return {
    "access-control-allow-origin": allowed,
    "access-control-allow-methods": corsConfiguration.allowMethods.join(", "),
    "access-control-allow-headers": corsConfiguration.allowHeaders.join(", ")
  };
};

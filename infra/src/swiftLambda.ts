
const getEnv = (key: string) => {
  const value = process.env[key];
  if (value == null || value.length === 0) {
    throw new Error(`Environment variable ${key} not set`);
  }

  return value;
};

export const lambdaBucket = getEnv("LAMBDA_BUCKET");
export const lambdaObject = getEnv("LAMBDA_OBJECT");

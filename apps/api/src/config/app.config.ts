// src/config/app.config.ts — env validation and typed config.
export const appConfig = () => {
  const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];
  const missingVars = requiredEnvVars.filter((name) => !process.env[name]);
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}\n` +
        "Please check your .env / .env.local file.",
    );
  }

  const jwtSecret = process.env.JWT_SECRET as string;
  if (jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }

  return {
    port: parseInt(process.env.PORT ?? "4000", 10),
    webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3004",
    appUrl: process.env.APP_URL ?? "http://localhost:4000",
    jwt: {
      secret: jwtSecret,
      accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
      refreshExpiresInDays: parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS ?? "30", 10),
    },
    storage: {
      endpoint: process.env.STORAGE_ENDPOINT ?? "",
      region: process.env.STORAGE_REGION ?? "us-east-1",
      bucket: process.env.STORAGE_BUCKET ?? "nibash-storage",
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? "",
      forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === "true",
      publicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL ?? "",
    },
  };
};

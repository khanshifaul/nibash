// prisma.config.ts — Prisma 7 config: connection URL and migration settings.
import { resolve } from "path";
import { defineConfig, env } from "prisma/config";

try {
  const { config } = await import("dotenv");
  config({ path: resolve(__dirname, ".env.local") });
} catch {
  // dotenv optional in containers where env vars are provided
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "bun run prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});

import "dotenv/config";
import { z } from "zod";

const localDatabaseUrl =
  "postgresql://app:change_me_dev_only@localhost:5432/appointment_saas?schema=public";
const devJwtSecret = "dev_only_insecure_jwt_secret_change_me_0123456789";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:5173"),
  DATABASE_URL: z.string().url().optional(),
  DIRECT_URL: z.string().url().optional(),
  JWT_ACCESS_SECRET: z.string().min(32).optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default("1d"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`Invalid environment configuration: ${parsedEnv.error.message}`);
}

if (parsedEnv.data.NODE_ENV === "production" && !parsedEnv.data.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set when NODE_ENV=production");
}

if (parsedEnv.data.NODE_ENV === "production" && !parsedEnv.data.JWT_ACCESS_SECRET) {
  throw new Error("JWT_ACCESS_SECRET must be set when NODE_ENV=production");
}

const databaseUrl = parsedEnv.data.DATABASE_URL ?? localDatabaseUrl;
const directUrl = parsedEnv.data.DIRECT_URL ?? databaseUrl;
process.env.DATABASE_URL = databaseUrl;
process.env.DIRECT_URL = directUrl;

export const env = {
  ...parsedEnv.data,
  DATABASE_URL: databaseUrl,
  DIRECT_URL: directUrl,
  JWT_ACCESS_SECRET: parsedEnv.data.JWT_ACCESS_SECRET ?? devJwtSecret,
  CORS_ORIGINS: parsedEnv.data.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};

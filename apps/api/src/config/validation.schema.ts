// src/config/validation.schema.ts — Joi env validation (boot-time).
import * as Joi from "joi";

const optionalStr = () => Joi.string().empty("");

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().default(4000),
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: optionalStr(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
  JWT_REFRESH_EXPIRES_DAYS: Joi.number().integer().min(1).default(30),
  WEB_ORIGIN: Joi.string().default("http://localhost:3004"),
  APP_URL: Joi.string().default("http://localhost:4000"),

  // Storage (S3-compatible: R2/S3/Backblaze/MinIO)
  STORAGE_ENDPOINT: optionalStr(),
  STORAGE_REGION: Joi.string().default("us-east-1"),
  STORAGE_BUCKET: Joi.string().default("nibash-storage"),
  STORAGE_ACCESS_KEY_ID: optionalStr(),
  STORAGE_SECRET_ACCESS_KEY: optionalStr(),
  STORAGE_FORCE_PATH_STYLE: Joi.boolean().default(false),
  STORAGE_PUBLIC_BASE_URL: optionalStr(),

  // Email — Resend (preferred) or SMTP fallback; optional for dev stub
  RESEND_API_KEY: optionalStr(),
  MAIL_FROM: optionalStr(),
  SMTP_HOST: optionalStr(),
  SMTP_PORT: Joi.number().integer().default(587),
  SMTP_USER: optionalStr(),
  SMTP_PASS: optionalStr(),
  SMTP_FROM: optionalStr(),

  // Google OAuth
  GOOGLE_CLIENT_ID: optionalStr(),
  GOOGLE_CLIENT_SECRET: optionalStr(),
  GOOGLE_CALLBACK_URL: optionalStr(),

  // Web Push (VAPID)
  VAPID_PUBLIC_KEY: optionalStr(),
  VAPID_PRIVATE_KEY: optionalStr(),
  VAPID_SUBJECT: Joi.string().default("mailto:support@nibash.local"),
}).unknown(true);

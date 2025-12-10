import "dotenv/config";

type RequiredEnv = "DATABASE_URL" | "MAILTRAP_HOST" | "MAILTRAP_PORT" | "MAILTRAP_USER" | "MAILTRAP_PASS";

const requireEnv = (key: RequiredEnv): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var ${key}`);
  }
  return value;
};

export const env = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl: requireEnv("DATABASE_URL"),
  mailFrom: process.env.MAIL_FROM || "Patient Registration <noreply@example.com>",
  mailtrap: {
    host: requireEnv("MAILTRAP_HOST"),
    port: Number(requireEnv("MAILTRAP_PORT")),
    user: requireEnv("MAILTRAP_USER"),
    pass: requireEnv("MAILTRAP_PASS"),
  },
};

export default env;

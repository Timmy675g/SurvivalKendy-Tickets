import dotenv from "dotenv";

dotenv.config();

const numberFromEnv = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
};

const booleanFromEnv = (name, fallback = false) => {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

export const config = {
  env: process.env.NODE_ENV || "development",
  frontendPort: numberFromEnv("FRONTEND_PORT", 5006),
  backendPort: numberFromEnv("BACKEND_PORT", 5007),
  frontendOrigin: process.env.FRONTEND_ORIGIN || `http://localhost:${numberFromEnv("FRONTEND_PORT", 5006)}`,
  sessionSecret: process.env.SESSION_SECRET || "change-me-in-production",
  adminUsername: process.env.ADMIN_USERNAME || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || "",
  workerAiUrl: process.env.WORKER_AI_URL || "",
  workerSecret: process.env.WORKER_SECRET || "",
  datadogApiKey: process.env.DATADOG_API_KEY || "",
  datadogAppKey: process.env.DATADOG_APP_KEY || "",
  datadogOncallTeam: process.env.DATADOG_ONCALL_TEAM || "",
  datadogSite: process.env.DATADOG_SITE || "us5.datadoghq.com",
  datadogWorkflowWebhookUrl: process.env.DATADOG_WORKFLOW_WEBHOOK_URL || "",
  datadogNotificationMode: process.env.DATADOG_NOTIFICATION_MODE || "direct",
  datadogNotificationDebug: booleanFromEnv("DATADOG_NOTIFICATION_DEBUG"),
  db: {
    host: process.env.DB_HOST || "localhost",
    port: numberFromEnv("DB_PORT", 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "survivalkendy_tickets",
    waitForConnections: true,
    connectionLimit: numberFromEnv("DB_CONNECTION_LIMIT", 10),
    namedPlaceholders: true
  }
};

export const isProduction = config.env === "production";

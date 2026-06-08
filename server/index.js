import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config, isProduction } from "./config.js";

const app = express();

app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
app.use(
  cors({
    origin: config.frontendOrigin,
    credentials: true,
    methods: ["GET", "POST", "PATCH"],
    allowedHeaders: ["Content-Type"]
  })
);
app.use(express.json({ limit: "64kb" }));

const archiveResponse = {
  error: "SurvivalKendy Tickets is archived. Ticket submission, admin actions, AI classification, and notifications are disabled."
};

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    archived: true,
    service: "survivalkendy-tickets-api",
    disabledSystems: ["ticket-submission", "admin-actions", "cloudflare-worker-classification", "discord-notifications", "datadog-paging"]
  });
});

app.use("/api", (_req, res) => {
  res.status(410).json(archiveResponse);
});

app.use((error, _req, res, _next) => {
  void _next;
  console.error(error);
  res.status(500).json({
    error: "Something went wrong.",
    ...(isProduction ? {} : { detail: error.message })
  });
});

app.listen(config.backendPort, () => {
  console.log(`SurvivalKendy Tickets archive API listening on ${config.backendPort}`);
});

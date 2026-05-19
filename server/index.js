import crypto from "node:crypto";
import cookieSession from "cookie-session";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { classifyTicketSeverity } from "./classifier.js";
import { config, isProduction } from "./config.js";
import {
  addAdminNote,
  createTicket,
  getTicketById,
  listTickets,
  updateTicketPriorityOverride,
  updateTicketStatus
} from "./db.js";
import { sendTicketNotifications } from "./notifications.js";
import {
  filterSchema,
  loginSchema,
  noteSchema,
  priorityOverrideSchema,
  publicTicket,
  statusUpdateSchema,
  ticketSchema
} from "./validation.js";

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
app.use(
  cookieSession({
    name: "sk_admin",
    secret: config.sessionSecret,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 8
  })
);

const ticketLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many ticket submissions. Try again soon." }
});

function isAdmin(req) {
  return Boolean(req.session?.admin);
}

function requireAdmin(req, res, next) {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: "Admin login required." });
  }
  return next();
}

function safeEqual(a, b) {
  const left = Buffer.from(a || "");
  const right = Buffer.from(b || "");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "survivalkendy-tickets-api" });
});

app.post("/api/tickets", ticketLimiter, async (req, res, next) => {
  try {
    const parsed = ticketSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Check the highlighted fields and try again.", issues: parsed.error.flatten() });
    }

    if (parsed.data.website) {
      return res.status(204).end();
    }

    const classification = await classifyTicketSeverity(parsed.data);
    const ticket = await createTicket(parsed.data, classification);
    sendTicketNotifications(ticket).catch((error) => console.error("Notification dispatch failed:", error.message));

    return res.status(201).json({ ticket: publicTicket(ticket) });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/admin/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success || !config.adminUsername || !config.adminPassword) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const valid =
    safeEqual(parsed.data.username, config.adminUsername) && safeEqual(parsed.data.password, config.adminPassword);

  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  req.session.admin = { username: config.adminUsername, loggedInAt: Date.now() };
  return res.json({ admin: { username: config.adminUsername } });
});

app.post("/api/admin/logout", (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

app.get("/api/admin/session", (req, res) => {
  res.json({ admin: isAdmin(req) ? { username: req.session.admin.username } : null });
});

app.get("/api/admin/tickets", requireAdmin, async (req, res, next) => {
  try {
    const parsed = filterSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid filters." });
    }

    const tickets = await listTickets(parsed.data);
    return res.json({ tickets });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/admin/tickets/:ticketId", requireAdmin, async (req, res, next) => {
  try {
    const ticket = await getTicketById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ error: "Ticket not found." });
    return res.json({ ticket });
  } catch (error) {
    return next(error);
  }
});

app.patch("/api/admin/tickets/:ticketId/status", requireAdmin, async (req, res, next) => {
  try {
    const parsed = statusUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid status." });
    }

    const updated = await updateTicketStatus(req.params.ticketId, parsed.data.status);
    if (!updated) return res.status(404).json({ error: "Ticket not found." });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

app.patch("/api/admin/tickets/:ticketId/priority", requireAdmin, async (req, res, next) => {
  try {
    const parsed = priorityOverrideSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid priority override." });
    }

    const updated = await updateTicketPriorityOverride(req.params.ticketId, parsed.data.priority || null);
    if (!updated) return res.status(404).json({ error: "Ticket not found." });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/admin/tickets/:ticketId/notes", requireAdmin, async (req, res, next) => {
  try {
    const parsed = noteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Note cannot be empty." });
    }

    const note = await addAdminNote(req.params.ticketId, parsed.data.note, req.session.admin.username);
    if (!note) return res.status(404).json({ error: "Ticket not found." });
    return res.status(201).json({ note });
  } catch (error) {
    return next(error);
  }
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
  console.log(`SurvivalKendy Tickets API listening on ${config.backendPort}`);
});

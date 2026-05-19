import { z } from "zod";

export const categories = ["Bug", "Lag / Performance", "Lost Items", "Player Report", "Appeal", "Suggestion", "Other"];
export const priorities = ["Low", "Medium", "High", "Critical"];
export const impacts = ["Just me", "Multiple players", "Whole server"];
export const urgencies = ["Can wait", "Annoying but playable", "Blocking gameplay", "Server is unusable"];
export const statuses = ["Open", "In Progress", "Resolved"];

const trimString = (max) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .transform((value) => value.replace(/\s+/g, " "));

export const ticketSchema = z.object({
  minecraft_username: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_]{3,16}$/, "Use a valid Minecraft username."),
  title: trimString(120),
  category: z.enum(categories),
  user_impact: z.enum(impacts),
  user_urgency: z.enum(urgencies),
  description: z.string().trim().min(20).max(5000),
  evidence_link: z.preprocess(
    (value) => (value === null || value === undefined ? "" : value),
    z
      .string()
      .trim()
      .max(500)
      .refine((value) => {
        if (!value) return true;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      }, "Use a valid URL for evidence.")
      .transform((value) => value || null)
  ),
  website: z.string().optional()
});

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(200)
});

export const filterSchema = z.object({
  status: z.enum(["All", ...statuses]).optional().default("All"),
  priority: z.enum(["All", ...priorities]).optional().default("All"),
  category: z.enum(["All", ...categories]).optional().default("All")
});

export const statusUpdateSchema = z.object({
  status: z.enum(statuses)
});

export const priorityOverrideSchema = z.object({
  priority: z.union([z.enum(priorities), z.literal("")]).nullable()
});

export const noteSchema = z.object({
  note: z.string().trim().min(1).max(2000)
});

export function publicTicket(ticket) {
  return {
    ticketId: ticket.ticket_id,
    status: ticket.status,
    severity: ticket.ai_severity || ticket.priority,
    category: ticket.category,
    title: ticket.title,
    createdAt: ticket.created_at
  };
}

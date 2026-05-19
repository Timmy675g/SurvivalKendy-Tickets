import { z } from "zod";

export const categories = ["Bug", "Lag / Performance", "Lost Items", "Player Report", "Appeal", "Suggestion", "Other"];
export const priorities = ["Low", "Medium", "High", "Critical"];
export const statuses = ["Open", "In Progress", "Resolved"];

const trimString = (max) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .transform((value) => value.replace(/\s+/g, " "));

export const ticketSchema = z.object({
  minecraftUsername: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_]{3,16}$/, "Use a valid Minecraft username."),
  title: trimString(120),
  category: z.enum(categories),
  priority: z.enum(priorities),
  description: z.string().trim().min(20).max(5000),
  evidenceLink: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => value || "")
    .pipe(z.union([z.literal(""), z.string().url("Use a valid URL for evidence.")])),
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

export const noteSchema = z.object({
  note: z.string().trim().min(1).max(2000)
});

export function publicTicket(ticket) {
  return {
    ticketId: ticket.ticket_id,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    title: ticket.title,
    createdAt: ticket.created_at
  };
}

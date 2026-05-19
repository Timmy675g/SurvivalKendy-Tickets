import crypto from "node:crypto";
import mysql from "mysql2/promise";
import { config } from "./config.js";

export const pool = mysql.createPool(config.db);

export async function createTicket(ticket, classification) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO tickets
        (
          ticket_id,
          minecraft_username,
          title,
          category,
          priority,
          user_impact,
          user_urgency,
          ai_severity,
          ai_confidence,
          ai_reason,
          description,
          evidence_link
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `PENDING-${crypto.randomUUID()}`,
        ticket.minecraft_username,
        ticket.title,
        ticket.category,
        classification.severity,
        ticket.user_impact,
        ticket.user_urgency,
        classification.severity,
        classification.confidence,
        classification.reason,
        ticket.description,
        ticket.evidence_link || null
      ]
    );

    const year = new Date().getFullYear();
    const readableId = `SK-${year}-${String(result.insertId).padStart(4, "0")}`;

    await connection.execute("UPDATE tickets SET ticket_id = ? WHERE id = ?", [readableId, result.insertId]);
    await connection.commit();

    const [rows] = await connection.execute("SELECT * FROM tickets WHERE id = ?", [result.insertId]);
    return rows[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function listTickets(filters) {
  const clauses = [];
  const params = [];

  for (const key of ["status", "category"]) {
    if (filters[key] && filters[key] !== "All") {
      clauses.push(`${key} = ?`);
      params.push(filters[key]);
    }
  }

  if (filters.priority && filters.priority !== "All") {
    clauses.push("COALESCE(admin_priority_override, ai_severity, priority) = ?");
    params.push(filters.priority);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const [rows] = await pool.execute(
    `SELECT *
     FROM tickets
     ${where}
     ORDER BY
       FIELD(priority, 'Critical', 'High', 'Medium', 'Low'),
       FIELD(status, 'Open', 'In Progress', 'Resolved'),
       created_at DESC
     LIMIT 250`,
    params
  );

  return rows;
}

export async function getTicketById(ticketId) {
  const [tickets] = await pool.execute("SELECT * FROM tickets WHERE ticket_id = ?", [ticketId]);
  if (!tickets[0]) return null;

  const [notes] = await pool.execute(
    "SELECT id, note, created_by, created_at FROM admin_notes WHERE ticket_id = ? ORDER BY created_at DESC",
    [tickets[0].id]
  );

  return { ...tickets[0], notes };
}

export async function updateTicketStatus(ticketId, status) {
  const [result] = await pool.execute("UPDATE tickets SET status = ? WHERE ticket_id = ?", [status, ticketId]);
  return result.affectedRows > 0;
}

export async function updateTicketPriorityOverride(ticketId, priority) {
  const [result] = await pool.execute(
    `UPDATE tickets
     SET admin_priority_override = ?,
         priority = COALESCE(?, ai_severity, priority)
     WHERE ticket_id = ?`,
    [priority || null, priority || null, ticketId]
  );
  return result.affectedRows > 0;
}

export async function addAdminNote(ticketId, note, createdBy) {
  const [tickets] = await pool.execute("SELECT id FROM tickets WHERE ticket_id = ?", [ticketId]);
  if (!tickets[0]) return null;

  const [result] = await pool.execute(
    "INSERT INTO admin_notes (ticket_id, note, created_by) VALUES (?, ?, ?)",
    [tickets[0].id, note, createdBy]
  );

  const [rows] = await pool.execute("SELECT id, note, created_by, created_at FROM admin_notes WHERE id = ?", [
    result.insertId
  ]);
  return rows[0];
}

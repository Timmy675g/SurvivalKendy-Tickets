import { config } from "./config.js";
import { priorities } from "./validation.js";

const fallbackClassification = {
  severity: "Medium",
  confidence: 0,
  reason: "AI classifier unavailable; defaulted to Medium."
};

function workerEndpoint(rawUrl) {
  const url = new URL(rawUrl);
  if (!url.pathname || url.pathname === "/") {
    url.pathname = "/classify";
  }
  return url;
}

function safeUrlForLog(url) {
  const safeUrl = new URL(url.href);
  safeUrl.username = "";
  safeUrl.password = "";

  for (const key of safeUrl.searchParams.keys()) {
    if (/key|secret|token|password|signature/i.test(key)) {
      safeUrl.searchParams.set(key, "[redacted]");
    }
  }

  return safeUrl.toString();
}

function safeBodyForLog(body) {
  const secrets = [config.workerSecret].filter(Boolean);
  let safeBody = body;

  for (const secret of secrets) {
    safeBody = safeBody.replaceAll(secret, "[redacted]");
  }

  return safeBody.slice(0, 1000);
}

function normalizeClassification(payload) {
  const severity = priorities.includes(payload?.severity) ? payload.severity : fallbackClassification.severity;
  const confidence = Number(payload?.confidence);
  const reason = typeof payload?.reason === "string" && payload.reason.trim() ? payload.reason.trim() : "No classifier reason provided.";

  return {
    severity,
    confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : fallbackClassification.confidence,
    reason: reason.slice(0, 500)
  };
}

export async function classifyTicketSeverity(ticket) {
  if (!config.workerAiUrl || !config.workerSecret) return fallbackClassification;

  let endpoint;

  try {
    endpoint = workerEndpoint(config.workerAiUrl);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SURVIVALKENDY-WORKER-SECRET": config.workerSecret
      },
      body: JSON.stringify({
        minecraft_username: ticket.minecraft_username,
        title: ticket.title,
        category: ticket.category,
        user_impact: ticket.user_impact,
        user_urgency: ticket.user_urgency,
        description: ticket.description,
        evidence_link: ticket.evidence_link || ""
      })
    });

    if (!response.ok) {
      const responseBody = await response.text().catch(() => "[unavailable]");
      console.error("AI severity Worker request failed:", {
        method: "POST",
        url: safeUrlForLog(endpoint),
        status: response.status,
        responseBody: safeBodyForLog(responseBody)
      });
      return fallbackClassification;
    }

    return normalizeClassification(await response.json());
  } catch (error) {
    console.error("AI severity classification failed:", {
      method: "POST",
      url: endpoint ? safeUrlForLog(endpoint) : "[invalid WORKER_AI_URL]",
      message: error.message
    });
    return fallbackClassification;
  }
}

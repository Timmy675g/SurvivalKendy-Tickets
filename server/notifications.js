import { config } from "./config.js";

const datadogSiteHosts = {
  "datadoghq.com": "https://saffron.oncall.datadoghq.com",
  "us3.datadoghq.com": "https://lava.oncall.datadoghq.com",
  "us5.datadoghq.com": "https://navy.oncall.datadoghq.com",
  "datadoghq.eu": "https://beige.oncall.datadoghq.eu",
  "ap1.datadoghq.com": "https://teal.oncall.datadoghq.com",
  "ap2.datadoghq.com": "https://coral.oncall.datadoghq.com"
};

function summary(text) {
  return text.length > 260 ? `${text.slice(0, 257)}...` : text;
}

function datadogBaseUrl() {
  if (config.datadogSite.startsWith("http")) {
    return config.datadogSite.replace(/\/$/, "");
  }

  return datadogSiteHosts[config.datadogSite] || datadogSiteHosts["datadoghq.com"];
}

function safeUrlForLog(rawUrl) {
  const url = new URL(rawUrl);
  url.username = "";
  url.password = "";

  if (url.hostname === "discord.com" && url.pathname.startsWith("/api/webhooks/")) {
    url.pathname = "/api/webhooks/[redacted]";
  }

  if (config.datadogWorkflowWebhookUrl && rawUrl === config.datadogWorkflowWebhookUrl) {
    url.pathname = "/[redacted-workflow-webhook]";
    url.search = "";
  }

  for (const key of url.searchParams.keys()) {
    if (/key|secret|token|password|signature/i.test(key)) {
      url.searchParams.set(key, "[redacted]");
    }
  }

  return url.toString();
}

function safeBodyForLog(body) {
  const secrets = [
    config.discordWebhookUrl,
    config.datadogApiKey,
    config.datadogAppKey,
    config.datadogWorkflowWebhookUrl,
    ...workflowWebhookSecretParts()
  ].filter(Boolean);
  let safeBody = body;

  for (const secret of secrets) {
    safeBody = safeBody.replaceAll(secret, "[redacted]");
  }

  return safeBody.slice(0, 1000);
}

function workflowWebhookSecretParts() {
  if (!config.datadogWorkflowWebhookUrl) return [];

  try {
    const url = new URL(config.datadogWorkflowWebhookUrl);
    return [
      ...url.pathname.split("/").filter((part) => part.length >= 8),
      ...Array.from(url.searchParams.values()).filter((value) => value.length >= 4)
    ];
  } catch {
    return [];
  }
}

function safePayloadForLog(payload) {
  return safeBodyForLog(JSON.stringify(payload));
}

function datadogOnCallTeamHandle() {
  return config.datadogOncallTeam.replace(/^@/, "").replace(/^oncall-/, "");
}

function safeHeaderDebug(headers) {
  const apiKey = headers["DD-API-KEY"] || "";
  const appKey = headers["DD-APPLICATION-KEY"] || "";

  return {
    "DD-API-KEY": apiKey ? "present" : "missing",
    "DD-APPLICATION-KEY": appKey ? "present" : "missing",
    "Content-Type": headers["Content-Type"] || "missing",
    apiKeyLength: apiKey.length,
    appKeyLength: appKey.length
  };
}

function isDatadogUrl(url) {
  const hostname = new URL(url).hostname;
  return hostname.includes("datadoghq.com");
}

function hasDatadogAuthHeaders(headers) {
  return "DD-API-KEY" in headers || "DD-APPLICATION-KEY" in headers;
}

function isDatadogWorkflowInstanceUrl(url) {
  const parsed = new URL(url);
  return parsed.hostname.includes("datadoghq.com") && /^\/api\/v2\/workflows\/[^/]+\/instances\/?$/.test(parsed.pathname);
}

export async function sendTicketNotifications(ticket) {
  if (["Low", "Medium", "High"].includes(ticket.ai_severity)) {
    await sendDiscordNotification(ticket);
    return;
  }

  if (ticket.ai_severity === "Critical") {
    if (config.datadogNotificationMode === "workflow") {
      await sendDatadogWorkflowNotification(ticket);
      return;
    }

    await sendDatadogPage(ticket);
  }
}

async function sendDiscordNotification(ticket) {
  if (!config.discordWebhookUrl) return;

  const body = {
    username: "SurvivalKendy Tickets",
    embeds: [
      {
        title: `${ticket.ticket_id} - ${ticket.title}`,
        color: ticket.ai_severity === "High" ? 15158332 : ticket.ai_severity === "Medium" ? 16776960 : 5763719,
        fields: [
          { name: "Username", value: ticket.minecraft_username, inline: true },
          { name: "Category", value: ticket.category, inline: true },
          { name: "Impact", value: ticket.user_impact, inline: true },
          { name: "Urgency", value: ticket.user_urgency, inline: true },
          { name: "AI Severity", value: ticket.ai_severity, inline: true },
          { name: "AI Confidence", value: String(ticket.ai_confidence), inline: true },
          { name: "AI Reason", value: summary(ticket.ai_reason || "No classifier reason provided.") },
          { name: "Summary", value: summary(ticket.description) }
        ],
        timestamp: new Date().toISOString()
      }
    ]
  };

  await postJson(config.discordWebhookUrl, body);
}

async function sendDatadogPage(ticket) {
  if (!config.datadogApiKey || !config.datadogAppKey) {
    console.warn("Datadog paging skipped because required keys are missing:", {
      "DD-API-KEY": config.datadogApiKey ? "present" : "missing",
      "DD-APPLICATION-KEY": config.datadogAppKey ? "present" : "missing",
      apiKeyLength: config.datadogApiKey.length,
      appKeyLength: config.datadogAppKey.length
    });
    return;
  }

  if (!config.datadogOncallTeam) return;

  const payload = {
    data: {
      type: "pages",
      attributes: {
        target: {
          type: "team_handle",
          identifier: datadogOnCallTeamHandle()
        },
        title: `Critical SurvivalKendy ticket ${ticket.ticket_id}: ${ticket.title}`,
        urgency: "high",
        description: [
          `Ticket: ${ticket.ticket_id}`,
          `Minecraft username: ${ticket.minecraft_username}`,
          `Category: ${ticket.category}`,
          `Impact: ${ticket.user_impact}`,
          `Urgency: ${ticket.user_urgency}`,
          `AI severity: ${ticket.ai_severity}`,
          `AI confidence: ${ticket.ai_confidence}`,
          `AI reason: ${ticket.ai_reason}`,
          `Summary: ${summary(ticket.description)}`
        ].join("\n")
      }
    }
  };

  await postJson(
    `${datadogBaseUrl()}/api/v2/on-call/pages`,
    payload,
    {
      "Accept": "application/json",
      "DD-API-KEY": config.datadogApiKey,
      "DD-APPLICATION-KEY": config.datadogAppKey
    }
  );
}

async function sendDatadogWorkflowNotification(ticket) {
  if (!config.datadogWorkflowWebhookUrl) {
    console.warn("Datadog workflow notification skipped because DATADOG_WORKFLOW_WEBHOOK_URL is missing.");
    return;
  }

  const ticketPayload = {
    ticket_id: ticket.ticket_id,
    title: ticket.title,
    minecraft_username: ticket.minecraft_username,
    category: ticket.category,
    impact: ticket.user_impact,
    urgency: ticket.user_urgency,
    ai_severity: ticket.ai_severity,
    ai_confidence: String(ticket.ai_confidence ?? ""),
    ai_reason: ticket.ai_reason,
    description: ticket.description
  };

  if (isDatadogWorkflowInstanceUrl(config.datadogWorkflowWebhookUrl)) {
    if (!config.datadogApiKey || !config.datadogAppKey) {
      console.warn("Datadog workflow API notification skipped because required keys are missing:", {
        "DD-API-KEY": config.datadogApiKey ? "present" : "missing",
        "DD-APPLICATION-KEY": config.datadogAppKey ? "present" : "missing",
        apiKeyLength: config.datadogApiKey.length,
        appKeyLength: config.datadogAppKey.length
      });
      return;
    }

    await postJson(
      config.datadogWorkflowWebhookUrl,
      { meta: { payload: ticketPayload } },
      {
        "Accept": "application/json",
        "DD-API-KEY": config.datadogApiKey,
        "DD-APPLICATION-KEY": config.datadogAppKey
      }
    );
    return;
  }

  await postJson(config.datadogWorkflowWebhookUrl, ticketPayload);
}

async function postJson(url, body, headers = {}) {
  try {
    const requestHeaders = {
      "Content-Type": "application/json",
      ...headers
    };

    if (config.datadogNotificationDebug) {
      console.info("Notification request debug:", {
        method: "POST",
        url: safeUrlForLog(url),
        ...(isDatadogUrl(url) && hasDatadogAuthHeaders(requestHeaders)
          ? { requestHeaders: safeHeaderDebug(requestHeaders) }
          : {}),
        requestPayload: safePayloadForLog(body)
      });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(body)
    });

    const responseBody = await response.text().catch(() => "[unavailable]");

    if (config.datadogNotificationDebug) {
      console.info("Notification response debug:", {
        method: "POST",
        url: safeUrlForLog(url),
        status: response.status,
        responseBody: safeBodyForLog(responseBody)
      });
    }

    if (!response.ok) {
      console.error("Notification failed:", {
        method: "POST",
        url: safeUrlForLog(url),
        status: response.status,
        responseBody: safeBodyForLog(responseBody),
        requestPayload: safePayloadForLog(body)
      });
    }
  } catch (error) {
    console.error("Notification request failed:", {
      method: "POST",
      url: safeUrlForLog(url),
      message: error.message,
      requestPayload: safePayloadForLog(body)
    });
  }
}

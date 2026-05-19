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

export async function sendTicketNotifications(ticket) {
  if (["Low", "Medium", "High"].includes(ticket.priority)) {
    await sendDiscordNotification(ticket);
    return;
  }

  if (ticket.priority === "Critical") {
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
        color: ticket.priority === "High" ? 15158332 : ticket.priority === "Medium" ? 16776960 : 5763719,
        fields: [
          { name: "Username", value: ticket.minecraft_username, inline: true },
          { name: "Category", value: ticket.category, inline: true },
          { name: "Priority", value: ticket.priority, inline: true },
          { name: "Summary", value: summary(ticket.description) }
        ],
        timestamp: new Date().toISOString()
      }
    ]
  };

  await postJson(config.discordWebhookUrl, body);
}

async function sendDatadogPage(ticket) {
  if (!config.datadogApiKey || !config.datadogAppKey || !config.datadogOncallTeam) return;

  const baseUrl = config.datadogSite.startsWith("http")
    ? config.datadogSite.replace(/\/$/, "")
    : datadogSiteHosts[config.datadogSite] || datadogSiteHosts["datadoghq.com"];

  await postJson(
    `${baseUrl}/api/v2/on-call/pages`,
    {
      data: {
        type: "pages",
        attributes: {
          target: {
            type: "team",
            identifier: config.datadogOncallTeam
          },
          title: `Critical SurvivalKendy ticket ${ticket.ticket_id}: ${ticket.title}`,
          urgency: "high",
          body: [
            `Ticket: ${ticket.ticket_id}`,
            `Minecraft username: ${ticket.minecraft_username}`,
            `Category: ${ticket.category}`,
            `Priority: ${ticket.priority}`,
            `Summary: ${summary(ticket.description)}`
          ].join("\n")
        }
      }
    },
    {
      "DD-API-KEY": config.datadogApiKey,
      "DD-APPLICATION-KEY": config.datadogAppKey
    }
  );
}

async function postJson(url, body, headers = {}) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const details = await response.text();
      console.error(`Notification failed with ${response.status}: ${details.slice(0, 300)}`);
    }
  } catch (error) {
    console.error("Notification request failed:", error.message);
  }
}

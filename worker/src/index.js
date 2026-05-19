const allowedSeverities = new Set(["Low", "Medium", "High", "Critical"]);

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function clampConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(1, Math.max(0, number));
}

function parseClassification(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI response did not include JSON.");

  const parsed = JSON.parse(match[0]);
  if (!allowedSeverities.has(parsed.severity)) throw new Error("AI response included invalid severity.");

  return {
    severity: parsed.severity,
    confidence: clampConfidence(parsed.confidence),
    reason: String(parsed.reason || "No reason provided.").slice(0, 500)
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    const isClassificationPath = pathname === "/" || pathname === "/classify";

    if (!isClassificationPath) {
      return jsonResponse({ error: "Not found." }, 404);
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed." }), {
        status: 405,
        headers: {
          "Allow": "POST",
          "Content-Type": "application/json"
        }
      });
    }

    if (!env.WORKER_SECRET || request.headers.get("X-SURVIVALKENDY-WORKER-SECRET") !== env.WORKER_SECRET) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const ticket = await request.json().catch(() => null);
    if (!ticket) return jsonResponse({ error: "Invalid JSON." }, 400);

    const prompt = [
      "Classify this Minecraft server support ticket severity.",
      "Return only compact JSON with severity, confidence, and reason.",
      "Severity must be one of Low, Medium, High, Critical.",
      "Critical means the whole server or core gameplay is unusable for many players and needs immediate on-call paging.",
      "High means major gameplay impact but not an immediate server-wide outage.",
      "Medium means normal staff attention.",
      "Low means minor issue, suggestion, or low-impact request.",
      "Do not classify as Critical from user urgency wording alone; use the full ticket context.",
      "",
      JSON.stringify({
        title: ticket.title,
        category: ticket.category,
        impact: ticket.user_impact,
        urgency: ticket.user_urgency,
        description: ticket.description,
        evidenceLink: ticket.evidence_link || ""
      })
    ].join("\n");

    const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        {
          role: "system",
          content:
            "You are a conservative incident severity classifier for a Minecraft server. Return valid JSON only."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 180
    });

    const text = aiResponse.response || aiResponse.result || JSON.stringify(aiResponse);
    return jsonResponse(parseClassification(text));
  }
};

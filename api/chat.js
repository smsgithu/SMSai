export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    // 🔑 Convert OpenAI-style messages → Anthropic blocks
    const anthropicMessages = messages.map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: [
        {
          type: "text",
          text: m.content
        }
      ]
    }));

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 600,
        messages: anthropicMessages
      })
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return res.status(500).json({
        anthropic_status: anthropicRes.status,
        anthropic_raw_response: data
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({
      error: "Internal server error",
      details: err.message
    });
  }
}

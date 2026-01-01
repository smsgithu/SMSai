export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    // Only send USER messages to Anthropic
    const anthropicMessages = messages
      .filter(m => m.role === "user" && typeof m.content === "string")
      .map(m => ({
        role: "user",
        content: [
          {
            type: "text",
            text: m.content
          }
        ]
      }));

    if (anthropicMessages.length === 0) {
      return res.status(400).json({ error: "No valid user messages" });
    }

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

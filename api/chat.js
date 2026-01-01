export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("Missing ANTHROPIC_API_KEY");
    }

    // 🔧 Convert OpenAI-style messages → Anthropic format
    const anthropicMessages = req.body.messages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: [
        {
          type: "text",
          text: m.content,
        },
      ],
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 600,
        system:
          "You are an educational AI assistant for Solana Made Simple. Explain concepts clearly, emphasize security, and avoid financial advice.",
        messages: anthropicMessages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic error:", data);
      throw new Error("Anthropic API request failed");
    }

    return res.status(200).json({
      content: data.content,
    });
  } catch (err) {
    console.error("Chat API error:", err.message);
    return res.status(500).json({
      content: [
        {
          type: "text",
          text:
            "The AI service is temporarily unavailable. Please try again.",
        },
      ],
    });
  }
}

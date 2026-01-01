export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const anthropicRes = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 600,
          system:
            "You are an educational AI assistant for Solana Made Simple. Teach clearly, emphasize security, and avoid financial advice.",
          messages: req.body.messages,
        }),
      }
    );

    const data = await anthropicRes.json();

    // 🔴 If Anthropic returns an error, surface it
    if (!data.content || !Array.isArray(data.content)) {
      console.error("Anthropic error:", data);
      return res.status(500).json({
        content: [
          {
            type: "text",
            text: "The AI service returned an unexpected response. Please try again.",
          },
        ],
      });
    }

    // ✅ Always return a valid content array
    return res.status(200).json({
      content: data.content,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      content: [
        {
          type: "text",
          text: "Unable to reach the AI service. Please try again later.",
        },
      ],
    });
  }
}

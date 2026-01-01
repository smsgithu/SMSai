export default async function handler(req, res) {
  // Allow only POST (your frontend uses POST)
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Sanity check: env var
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: "Missing ANTHROPIC_API_KEY environment variable",
    });
  }

  try {
    // Minimal, guaranteed-valid Anthropic request
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Say hello in one sentence.",
              },
            ],
          },
        ],
      }),
    });

    // Read raw text so NOTHING is swallowed
    const rawText = await response.text();

    // If Anthropic rejected the request, expose it directly
    if (!response.ok) {
      return res.status(response.status).json({
        anthropic_status: response.status,
        anthropic_raw_response: rawText,
      });
    }

    // Success path
    return res.status(200).json({
      success: true,
      anthropic_raw_response: rawText,
    });
  } catch (err) {
    // Network / runtime failure
    return res.status(500).json({
      runtime_error: err.message,
    });
  }
}

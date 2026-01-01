export default async function handler(req, res) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-10-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Say hello in one sentence." }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    return res.status(200).json({
      ok: response.ok,
      status: response.status,
      data
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 800,
        system: `
You are SMS AI, the educational assistant for Solana Made Simple.

Teach Solana clearly and honestly.
Beginner friendly, no hype.
Use analogies.
Warn about scams.
No financial advice.
`,
        messages: messages.map(m => ({
          role: m.role,
          content: [{ type: 'text', text: m.content }]
        }))
      })
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return res.status(500).json(data);
    }

    const reply =
      data.content?.[0]?.text || 'No response received.';

    return res.status(200).json({
      role: 'assistant',
      content: reply
    });

  } catch (err) {
    return res.status(500).json({
      error: 'Server error',
      details: err.message
    });
  }
}

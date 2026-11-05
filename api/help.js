import { isDiscordWebhook, isWalletAddress, validateHelpRequest } from '../shared/product.js';

const recentByIp = new Map();

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function helpConnected() {
  return isDiscordWebhook(process.env.DISCORD_TICKET_WEBHOOK || '');
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({ connected: helpConnected() });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!helpConnected()) {
    return res.status(503).json({
      connected: false,
      sent: false,
      error: 'Help is not connected yet. Your note was not sent.',
    });
  }

  const parsed = validateHelpRequest({
    topic: req.body?.topic,
    description: req.body?.description,
    discordUsername: req.body?.discord_username,
  });
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, sent: false });

  const ip = clientIp(req);
  const now = Date.now();
  if (now - (recentByIp.get(ip) || 0) < 15000) {
    return res.status(429).json({ error: 'Wait a few seconds before sending another note.', sent: false });
  }

  const wallet = isWalletAddress(req.body?.wallet_address) ? req.body.wallet_address : null;
  const webhook = process.env.DISCORD_TICKET_WEBHOOK.trim();
  const payload = {
    username: 'SMSai Help',
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: parsed.topic,
        description: parsed.description,
        color: 0x9945ff,
        fields: [
          { name: 'Discord username', value: parsed.username || 'Not provided', inline: false },
          { name: 'Public wallet', value: wallet || 'Not connected', inline: false },
        ],
      },
    ],
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'error',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!response.ok) {
      console.error('Help webhook status:', response.status);
      return res.status(502).json({ error: 'Help could not be delivered. Nothing else was saved.', sent: false });
    }
    recentByIp.set(ip, now);
    return res.status(200).json({
      sent: true,
      connected: true,
      reply_via: parsed.username ? 'discord_username' : 'ticket_only',
    });
  } catch (error) {
    console.error('Help webhook failed:', error.message);
    return res.status(502).json({ error: 'Help could not be delivered. Nothing else was saved.', sent: false });
  }
}

// /api/chat.js - Claude API with RAG knowledge injection

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Solana knowledge base - injected into system prompt for better responses
const SOLANA_KNOWLEDGE = `
## Solana Quick Facts
- Founded by Anatoly Yakovenko, launched March 2020
- Uses Proof of History (PoH) + Proof of Stake (PoS)
- ~400ms block time, 65,000+ TPS theoretical, ~$0.00025 per transaction
- SOL token: pay fees, stake for 6-8% APY, governance

## Wallets
- Phantom (most popular), Solflare, Backpack, Glow
- Seed phrase: 12-24 words, NEVER share, store offline securely
- Hardware wallets (Ledger) recommended for large amounts

## DeFi Ecosystem
- DEXs: Jupiter (aggregator), Raydium, Orca, OpenBook
- Lending: Kamino, Marginfi, Solend
- Liquid Staking: Marinade (mSOL), Jito (JitoSOL), BlazeStake (bSOL)

## Staking
- Native: Delegate to validator, ~6-8% APY, 2-3 day unstaking
- Liquid: Get mSOL/JitoSOL, use in DeFi while earning, instant liquidity
- Choose validators by: uptime, commission (avoid 100%), stake distribution

## NFTs
- Marketplaces: Magic Eden, Tensor
- Compressed NFTs (cNFTs) = 1000x cheaper to mint

## Memecoins
- SPL tokens, often on pump.fun
- HIGH RISK: rug pulls, pump & dumps, no intrinsic value
- Popular: BONK, WIF (dogwifhat), POPCAT

## Security
- Never share seed phrase or private keys
- Verify URLs before connecting
- No legit project DMs you first
- "Too good to be true" = scam
- Use burner wallets for risky activities

## Key Projects
- Jupiter (DEX aggregator, JUP token)
- Marinade (liquid staking)
- Magic Eden & Tensor (NFTs)
- Drift (perpetuals)
- Kamino (DeFi hub)

## Resources
- solana.com, docs.solana.com
- solscan.io (explorer)
- step.finance (portfolio)
`;

const SYSTEM_PROMPT = `You are SMSai, a friendly and knowledgeable AI assistant created by Solana Made Simple (SMS). Your mission is to help people understand Solana and crypto in simple, approachable terms.

${SOLANA_KNOWLEDGE}

## Your Personality
- Friendly, patient, and encouraging
- Explain complex topics simply - like talking to a smart friend who's new to crypto
- Use analogies to everyday things when helpful
- Be honest about risks (especially with memecoins and DeFi)
- Never give financial advice - educate, don't recommend specific investments

## Guidelines
- Keep responses concise but complete
- Use bullet points for lists
- Bold **key terms** when introducing them
- If asked about specific prices or current events, acknowledge you may not have real-time data
- For wallet/security questions, always emphasize seed phrase safety
- When discussing memecoins, always mention the risks

## What You Can Help With
- Explaining Solana concepts (wallets, staking, DeFi, NFTs)
- How-to guides (setting up wallet, staking, swapping)
- Understanding risks and security
- Comparing protocols and options
- Troubleshooting common issues

## What to Avoid
- Specific investment advice ("you should buy X")
- Price predictions
- Promoting specific memecoins
- Guaranteeing returns or safety

Remember: You represent Solana Made Simple - make crypto accessible and understandable for everyone!`;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, wallet_address } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Format messages for Claude
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    // Add context about the user if they have a wallet connected
    let contextualSystemPrompt = SYSTEM_PROMPT;
    if (wallet_address) {
      contextualSystemPrompt += `\n\nNote: This user has connected their Solana wallet, so they likely have some experience with crypto. You can be slightly more technical if appropriate, but still keep things accessible.`;
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: contextualSystemPrompt,
      messages: formattedMessages
    });

    const content = response.content[0]?.text || "I'm sorry, I couldn't generate a response. Please try again.";

    return res.status(200).json({ content });

  } catch (error) {
    console.error('Chat API error:', error);
    
    if (error.status === 401) {
      return res.status(500).json({ error: 'API authentication error' });
    }
    
    if (error.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again in a moment.' });
    }

    return res.status(500).json({ error: 'Failed to process chat request' });
  }
}

// /api/chat.js - Claude API with RAG knowledge injection + Solana Docs .md integration

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── Solana Docs .md Fetcher ───
// Leverages solana.com/docs/*.md endpoints (LLM-ready markdown)

const SOLANA_DOCS_MAP = {
  'account': 'https://solana.com/docs/core/accounts.md',
  'accounts': 'https://solana.com/docs/core/accounts.md',
  'transaction': 'https://solana.com/docs/core/transactions.md',
  'transactions': 'https://solana.com/docs/core/transactions.md',
  'program': 'https://solana.com/docs/core/programs.md',
  'programs': 'https://solana.com/docs/core/programs.md',
  'smart contract': 'https://solana.com/docs/core/programs.md',
  'pda': 'https://solana.com/docs/core/pda.md',
  'program derived address': 'https://solana.com/docs/core/pda.md',
  'cpi': 'https://solana.com/docs/core/cpi.md',
  'cross program invocation': 'https://solana.com/docs/core/cpi.md',
  'token': 'https://solana.com/docs/core/tokens.md',
  'tokens': 'https://solana.com/docs/core/tokens.md',
  'spl token': 'https://solana.com/docs/core/tokens.md',
  'spl tokens': 'https://solana.com/docs/core/tokens.md',
  'validator': 'https://solana.com/docs/core.md',
  'validators': 'https://solana.com/docs/core.md',
  'consensus': 'https://solana.com/docs/core.md',
  'proof of history': 'https://solana.com/docs/core.md',
  'poh': 'https://solana.com/docs/core.md',
  'tower bft': 'https://solana.com/docs/core.md',
  'stake': 'https://solana.com/docs/economics/staking.md',
  'staking': 'https://solana.com/docs/economics/staking.md',
  'delegation': 'https://solana.com/docs/economics/staking.md',
  'wallet': 'https://solana.com/docs/intro/wallets.md',
  'wallets': 'https://solana.com/docs/intro/wallets.md',
  'seed phrase': 'https://solana.com/docs/intro/wallets.md',
  'keypair': 'https://solana.com/docs/intro/wallets.md',
  'rpc': 'https://solana.com/docs/rpc.md',
  'cluster': 'https://solana.com/docs/core/clusters.md',
  'clusters': 'https://solana.com/docs/core/clusters.md',
  'mainnet': 'https://solana.com/docs/core/clusters.md',
  'devnet': 'https://solana.com/docs/core/clusters.md',
  'solana': 'https://solana.com/docs/intro/overview.md',
  'what is solana': 'https://solana.com/docs/intro/overview.md',
  'how solana works': 'https://solana.com/docs/intro/overview.md',
  'fee': 'https://solana.com/docs/core/fees.md',
  'fees': 'https://solana.com/docs/core/fees.md',
  'priority fee': 'https://solana.com/docs/core/fees.md',
  'rent': 'https://solana.com/docs/core/fees.md',
  'nft': 'https://solana.com/docs/core/tokens.md',
  'nfts': 'https://solana.com/docs/core/tokens.md',
};

// In-memory cache (persists across warm invocations on Vercel)
const docCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

function detectSolanaDocTopics(message) {
  const lower = message.toLowerCase();
  const urls = new Set();
  for (const [keyword, url] of Object.entries(SOLANA_DOCS_MAP)) {
    if (lower.includes(keyword)) {
      urls.add(url);
    }
  }
  return [...urls].slice(0, 2); // max 2 docs per query
}

async function fetchSolanaDoc(url) {
  const cached = docCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.content;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(url, {
      headers: { 'Accept': 'text/plain' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const content = await response.text();
    // Trim to ~2500 chars to keep context window manageable
    const trimmed = content.length > 2500
      ? content.slice(0, 2500) + '\n\n[... truncated]'
      : content;
    docCache.set(url, { content: trimmed, timestamp: Date.now() });
    return trimmed;
  } catch (error) {
    console.warn(`Failed to fetch Solana doc ${url}:`, error.message);
    return null;
  }
}

async function getSolanaDocsContext(userMessage) {
  const urls = detectSolanaDocTopics(userMessage);
  if (urls.length === 0) return '';
  const docs = await Promise.all(urls.map(fetchSolanaDoc));
  const valid = docs.filter(Boolean);
  if (valid.length === 0) return '';
  return `\n\n---\nREFERENCE FROM OFFICIAL SOLANA DOCUMENTATION (solana.com/docs):\n\n${valid.join('\n\n---\n\n')}`;
}

// ─── Static Knowledge Base ───

const SOLANA_KNOWLEDGE = `
## Solana Quick Facts
- Founded by Anatoly Yakovenko, launched March 2020
- Uses Proof of History (PoH) + Proof of Stake (PoS)
- ~400ms block time, 65,000+ TPS theoretical, ~$0.00025 per transaction
- SOL token: pay fees, stake for 6-8% APY, governance
- Current SOL price range: ~$200-300 (as of late 2025/early 2026)

## Solana Mobile
- **Solana Seeker** (2025): The second-generation Solana Mobile phone
  - Successor to the original Saga phone
  - More affordable than Saga, aimed at mainstream adoption
  - Built-in Seed Vault for secure key storage
  - Native support for Mobile Wallet Adapter (MWA)
  - Comes with exclusive token airdrops and rewards for owners
  - Features Android-based OS optimized for Web3
  - Integrated dApp Store for discovering Solana apps
- **Saga** (2023): First-generation Solana phone, famous for BONK airdrop that made it valuable
- **Seed Vault**: Hardware-level secure enclave on Solana Mobile devices for storing private keys
- **Mobile Wallet Adapter (MWA)**: Protocol for connecting dApps to mobile wallets securely

## Wallets
- **Phantom**: Most popular Solana wallet, browser extension + mobile app, supports Ethereum too
- **Solflare**: Solana-native wallet, excellent staking features, mobile + extension
- **Backpack**: By Mad Lads team, supports xNFTs (executable NFTs)
- **Jupiter Mobile**: Jupiter's own wallet app with built-in swap functionality
- **Glow**: Fast, lightweight Solana wallet
- Seed phrase: 12-24 words, NEVER share, store offline securely
- Hardware wallets (Ledger) recommended for large amounts

## DeFi Ecosystem
**DEXs & Aggregators:**
- Jupiter: #1 DEX aggregator, routes through all DEXs for best price, JUP governance token
- Raydium: AMM with concentrated liquidity, RAY token
- Orca: User-friendly AMM, Whirlpools concentrated liquidity
- OpenBook: On-chain order book (successor to Serum)
- Phoenix: High-performance order book DEX

**Lending & Borrowing:**
- Kamino: Leading DeFi hub, lending, liquidity, and leverage
- Marginfi: Lending protocol with points program
- Solend: Original Solana lending protocol

**Liquid Staking:**
- Jito (JitoSOL): Liquid staking with MEV rewards, very popular
- Marinade (mSOL): Decentralized stake pool, mSOL token
- BlazeStake (bSOL): Community-focused liquid staking
- Sanctum: LST aggregator, create custom LSTs, INF token

**Perpetuals & Trading:**
- Drift: Perpetual futures DEX
- Jupiter Perps: Perpetual trading on Jupiter
- Zeta Markets: Options and perpetuals

## Staking
- **Native Staking**: Delegate SOL to validator, ~6-8% APY, 2-3 day unstaking period
- **Liquid Staking**: Get JitoSOL/mSOL/bSOL, use in DeFi while earning staking rewards
- Choose validators by: uptime, commission (avoid 100%), stake distribution
- Jito offers additional MEV rewards on top of base staking APY

## NFTs & Digital Collectibles
- **Magic Eden**: Largest NFT marketplace, expanded to multi-chain
- **Tensor**: Pro trading NFT marketplace, TNSR token, advanced trading features
- **Compressed NFTs (cNFTs)**: 1000x cheaper to mint using state compression
- **xNFTs**: Executable NFTs that run code (Backpack ecosystem)
- Popular collections: Mad Lads, Tensorians, Famous Fox Federation, Claynosaurz

## Memecoins & Token Launches
- **pump.fun**: Popular platform for launching memecoins on Solana, bonding curve mechanism
- **Moonshot**: Another memecoin launchpad
- Popular memecoins: BONK (Solana's first big memecoin), WIF (dogwifhat), POPCAT, PENGU
- HIGH RISK: rug pulls, pump & dumps, no intrinsic value
- Always research before buying, never invest more than you can lose
- Check if liquidity is locked/burned, verify contract on Solscan

## Solana Ecosystem Projects
- **Jupiter**: DEX aggregator, JUP token, perps, limit orders, DCA
- **Jito**: MEV infrastructure, liquid staking (JitoSOL), JTO token
- **Marinade**: Liquid staking pioneer, mSOL, MNDE token
- **Tensor**: NFT marketplace, TNSR token
- **Helium**: Decentralized wireless network, migrated to Solana (HNT, MOBILE, IOT)
- **Render**: Decentralized GPU rendering, RNDR token on Solana
- **Pyth**: Oracle network providing price feeds
- **Wormhole**: Cross-chain bridge protocol, W token
- **Bonk**: Community memecoin, gained fame from Saga phone airdrop

## Blinks & Actions
- **Solana Actions**: URLs that trigger Solana transactions
- **Blinks** (Blockchain Links): Share Actions anywhere on the internet
- Allows transactions directly from social media, websites, etc.
- Example: Tip someone SOL directly from a tweet

## Security Best Practices
- NEVER share your seed phrase or private keys with anyone
- Verify URLs before connecting wallet (phishing is common)
- No legitimate project will DM you first asking to connect wallet
- "Too good to be true" returns = almost certainly a scam
- Use burner wallets for risky activities (airdrops, new mints)
- Revoke unused token approvals regularly
- Enable transaction simulation in your wallet
- Be wary of fake airdrops and token approvals

## Solana Technical Features
- **Firedancer**: New validator client by Jump Crypto for better performance
- **Token Extensions**: Advanced token features (transfer fees, confidential transfers, etc.)
- **Compressed NFTs**: State compression for 1000x cheaper NFTs
- **Priority Fees**: Pay extra to prioritize transactions during congestion
- **Compute Units**: Measure of computational resources per transaction

## Key Resources
- solana.com - Official website
- docs.solana.com - Developer documentation
- solscan.io - Block explorer (view transactions, tokens, wallets)
- solana.fm - Alternative block explorer
- step.finance - Portfolio tracker
- birdeye.so - Token analytics and charts
- dexscreener.com - DEX analytics
- helius.dev - RPC and developer tools

## DATs (Digital Asset Treasuries)
- **What are DATs?**: Publicly traded companies that hold cryptocurrency (like SOL) on their balance sheets as a core treasury strategy
- Similar to how MicroStrategy pioneered Bitcoin treasuries, DATs now exist for Solana, Ethereum, and other assets
- Investors buy stock in DAT companies to gain exposure to crypto without holding it directly
- **How DATs work**: Raise capital through stock/bond sales → Buy and hold crypto → Often stake holdings for additional yield
- **Top Solana DATs** (as of late 2025):
  - Forward Industries: Largest SOL holder (~6.9M SOL, ~1.1% of supply)
  - DeFi Development Corp (DFDV): First public company focused on SOL accumulation
  - Upexi: ~2M SOL holdings
  - Sharps Technology: ~2M SOL holdings
  - Solana Company (HSDT): Backed by Pantera, targeting 5% of SOL supply
- **Why companies choose SOL**: Staking rewards (6-8% APY), high-performance blockchain, growing ecosystem
- **Risks**: Price volatility can cause large unrealized losses, dilution from stock issuance
- Solana DATs collectively hold ~15M+ SOL (~2.5% of total supply)
- DATs differ from ETFs: actively managed, can use leverage, stake holdings, pursue M&A

## Current Trends (Late 2025/Early 2026)
- Solana Mobile expanding with Seeker phone
- Memecoins continue to be popular but risky
- DeFi TVL growing with new protocols
- Institutional interest increasing via DATs and upcoming ETFs
- Focus on mobile-first Web3 experiences
- Blinks enabling social commerce
- DAT companies accumulating significant SOL supply
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
- For wallet/security questions, always emphasize seed phrase safety
- When discussing memecoins, always mention the risks
- If users ask about Solana Seeker or Solana Mobile, you know about these!
- When you use information from the official Solana docs context provided below, mention it naturally (e.g. "According to the official Solana docs..." or add a note like "📚 Source: Official Solana Documentation")

## When to Use Web Search
- Questions about current prices, market data, or "right now" info
- Recent news, announcements, or events you're unsure about
- New projects, tokens, or protocols not in your knowledge base
- Anything where the user asks "latest" or "current" or "today"
- When you're not confident your knowledge is up-to-date
- Do NOT search for basic concepts you already know (wallets, staking, DeFi basics)

## What You Can Help With
- Explaining Solana concepts (wallets, staking, DeFi, NFTs)
- How-to guides (setting up wallet, staking, swapping)
- Understanding risks and security
- Comparing protocols and options
- Troubleshooting common issues
- Solana Mobile devices (Seeker, Saga, Seed Vault)

## What to Avoid
- Specific investment advice ("you should buy X")
- Price predictions
- Promoting specific memecoins
- Guaranteeing returns or safety

Remember: You represent Solana Made Simple - make crypto accessible and understandable for everyone!`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages, wallet_address } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    // Get the latest user message to check for relevant Solana docs
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    
    // Fetch relevant Solana docs context in parallel (non-blocking, with timeout)
    let docsContext = '';
    if (lastUserMessage) {
      try {
        docsContext = await getSolanaDocsContext(lastUserMessage.content);
      } catch (err) {
        console.warn('Solana docs fetch failed, continuing without:', err.message);
      }
    }

    // Build the system prompt with docs context injected
    let contextualSystemPrompt = SYSTEM_PROMPT;
    
    if (docsContext) {
      contextualSystemPrompt += docsContext;
    }
    
    if (wallet_address) {
      contextualSystemPrompt += `\n\nNote: This user has connected their Solana wallet, so they likely have some experience with crypto. You can be slightly more technical if appropriate, but still keep things accessible.`;
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: contextualSystemPrompt,
      messages: formattedMessages,
      tools: [{
        type: "web_search_20250305",
        name: "web_search"
      }]
    });

    let content = "";
    for (const block of response.content) {
      if (block.type === "text") {
        content += block.text;
      }
    }
    
    if (!content) {
      content = "I'm sorry, I couldn't generate a response. Please try again.";
    }

    return res.status(200).json({ content });

  } catch (error) {
    console.error('Chat API error:', error);
    
    if (error.status === 401) return res.status(500).json({ error: 'API authentication error' });
    if (error.status === 429) return res.status(429).json({ error: 'Rate limit exceeded. Please try again in a moment.' });
    return res.status(500).json({ error: 'Failed to process chat request' });
  }
}

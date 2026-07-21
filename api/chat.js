// /api/chat.js - Claude API with RAG knowledge injection + Solana Docs .md integration

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── Solana Docs .md Fetcher ───
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
  'token extensions': 'https://solana.com/docs/core/tokens.md',
  'token 2022': 'https://solana.com/docs/core/tokens.md',
  'validator': 'https://solana.com/docs/core.md',
  'validators': 'https://solana.com/docs/core.md',
  'consensus': 'https://solana.com/docs/core.md',
  'proof of history': 'https://solana.com/docs/core.md',
  'poh': 'https://solana.com/docs/core.md',
  'tower bft': 'https://solana.com/docs/core.md',
  'stake': 'https://solana.com/docs/economics/staking.md',
  'staking': 'https://solana.com/docs/economics/staking.md',
  'delegation': 'https://solana.com/docs/economics/staking.md',
  'unstake': 'https://solana.com/docs/economics/staking.md',
  'wallet': 'https://solana.com/docs/intro/wallets.md',
  'wallets': 'https://solana.com/docs/intro/wallets.md',
  'seed phrase': 'https://solana.com/docs/intro/wallets.md',
  'keypair': 'https://solana.com/docs/intro/wallets.md',
  'private key': 'https://solana.com/docs/intro/wallets.md',
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
  'priority fees': 'https://solana.com/docs/core/fees.md',
  'rent': 'https://solana.com/docs/core/fees.md',
  'nft': 'https://solana.com/docs/core/tokens.md',
  'nfts': 'https://solana.com/docs/core/tokens.md',
  'compressed nft': 'https://solana.com/docs/core/tokens.md',
  'cnft': 'https://solana.com/docs/core/tokens.md',
  'action': 'https://solana.com/docs/advanced/actions.md',
  'actions': 'https://solana.com/docs/advanced/actions.md',
  'blink': 'https://solana.com/docs/advanced/actions.md',
  'blinks': 'https://solana.com/docs/advanced/actions.md',
  'blockchain link': 'https://solana.com/docs/advanced/actions.md',
  'versioned transaction': 'https://solana.com/docs/advanced/versions.md',
  'address lookup': 'https://solana.com/docs/advanced/lookup-tables.md',
  'lookup table': 'https://solana.com/docs/advanced/lookup-tables.md',
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
- SOL token: pay fees, stake for ~6-8% APY, governance
- For current SOL price, always use web search — prices change constantly
- One of the largest blockchains by daily active users and transaction volume

## Solana Mobile
- **Solana Seeker** (2025): Second-generation Solana Mobile phone
  - Successor to the original Saga phone
  - More affordable than Saga, aimed at mainstream adoption
  - Built-in Seed Vault for secure key storage
  - Native support for Mobile Wallet Adapter (MWA)
  - Exclusive token airdrops and rewards for owners
  - Android-based OS optimized for Web3
  - Integrated dApp Store for discovering Solana apps
  - SKR token powers the Seeker ecosystem
- **Saga** (2023): First-generation Solana phone, famous for BONK airdrop
- **Seed Vault**: Hardware-level secure enclave on Solana Mobile devices
- **Mobile Wallet Adapter (MWA)**: Protocol for connecting dApps to mobile wallets securely
- **Solana dApp Store**: Curated store for Solana-native mobile apps, no revenue cut to Apple/Google

## Wallets
- **Phantom**: Most popular Solana wallet, browser extension + mobile, supports ETH/BTC too
- **Solflare**: Solana-native wallet, excellent staking features, mobile + extension
- **Backpack**: By Mad Lads team, supports xNFTs, multi-chain
- **Jupiter Mobile**: Jupiter's own wallet with built-in swap
- **Glow**: Fast, lightweight Solana wallet
- Seed phrase: 12-24 words, NEVER share, store offline securely
- Hardware wallets (Ledger) recommended for large holdings

## DeFi Ecosystem
**DEXs & Aggregators:**
- **Jupiter**: #1 DEX aggregator on Solana, routes trades for best price, JUP governance token, also offers perps, limit orders, DCA, and bridge
- **Raydium**: AMM with concentrated liquidity, RAY token, major liquidity hub
- **Orca**: User-friendly AMM, Whirlpools concentrated liquidity
- **Meteora**: Dynamic liquidity pools, popular for new token launches
- **OpenBook**: On-chain central limit order book
- **Phoenix**: High-performance order book DEX

**Lending & Borrowing:**
- **Kamino**: Leading DeFi hub — lending, liquidity vaults, leverage, KMNO token
- **Marginfi**: Lending with points/rewards program, mrgn token
- **Solend**: Original Solana lending protocol

**Liquid Staking:**
- **Jito (JitoSOL)**: #1 liquid staking, includes MEV rewards, JTO governance token
- **Marinade (mSOL)**: Decentralized stake pool, MNDE token
- **BlazeStake (bSOL)**: Community-focused liquid staking
- **Sanctum**: LST aggregator, INF token (holds all LSTs)

**Perpetuals & Derivatives:**
- **Drift**: Perpetual futures and spot DEX, DRIFT token
- **Jupiter Perps**: Perpetual trading integrated into Jupiter
- **Zeta Markets**: Options and perpetuals

## Staking
- **Native Staking**: Delegate SOL to validator, ~6-8% APY, 2-3 day unstaking period
- **Liquid Staking**: Get JitoSOL/mSOL/bSOL, use in DeFi while earning rewards
- Choose validators by: uptime, commission rate (avoid 100%), stake distribution for decentralization
- Jito offers additional MEV rewards on top of base staking yield

## NFTs & Digital Collectibles
- **Magic Eden**: Largest NFT marketplace, now multi-chain
- **Tensor**: Pro NFT trading platform, TNSR token, advanced analytics
- **Compressed NFTs (cNFTs)**: State compression makes minting ~1000x cheaper
- **xNFTs**: Executable NFTs that run mini-apps (Backpack ecosystem)
- Notable collections: Mad Lads, Tensorians, Famous Fox Federation, Claynosaurz, Okay Bears

## Memecoins & Token Launches
- **pump.fun**: Dominant memecoin launchpad on Solana, bonding curve model, huge volume
- **pump.swap**: pump.fun's own DEX for graduated tokens
- **Moonshot**: Alternative memecoin launchpad
- **Believe**: Newer launchpad focused on "idea coins" / founder coins
- Popular memecoins: BONK (Solana OG memecoin), WIF (dogwifhat), POPCAT, PENGU, TRUMP, MELANIA
- ⚠️ HIGH RISK: most memecoins go to zero, rug pulls common
- Always check: liquidity locked/burned, contract verified, team doxxed
- Use Solscan or Birdeye to verify before buying

## Solana Ecosystem — Key Projects
- **Jupiter (JUP)**: DEX aggregator, perps, limit orders, DCA, launchpad
- **Jito (JTO)**: MEV infrastructure + liquid staking (JitoSOL)
- **Marinade (MNDE)**: Liquid staking pioneer, mSOL
- **Kamino (KMNO)**: DeFi hub — lending, leverage, liquidity
- **Tensor (TNSR)**: NFT marketplace and trading infrastructure
- **Pyth (PYTH)**: Oracle network, provides price feeds to DeFi protocols
- **Wormhole (W)**: Cross-chain bridge and messaging protocol
- **Helium (HNT)**: Decentralized wireless network on Solana
- **Render (RENDER)**: Decentralized GPU rendering network
- **Bonk (BONK)**: Community memecoin, Solana's mascot token
- **Drift (DRIFT)**: Perpetuals and spot DEX
- **Sanctum (CLOUD)**: LST aggregator and liquid staking hub
- **Meteora**: Dynamic liquidity pools and DeFi infrastructure
- **Firedancer**: New high-performance validator client by Jump Crypto (in development)

## Blinks & Actions
- **Solana Actions**: Standard for URLs that trigger blockchain transactions
- **Blinks** (Blockchain Links): Share Actions anywhere — social media, websites, emails
- Enables one-click transactions from Twitter/X, Discord, anywhere with a link
- Example use cases: tip SOL, mint NFT, swap tokens — all from a shareable link
- Growing adoption across Solana ecosystem apps

## Token Extensions (Token-2022)
- Next-generation token standard on Solana
- Features: transfer fees, confidential transfers, permanent delegate, interest-bearing tokens
- Enables compliant tokenization of real-world assets (RWAs)
- Used by institutional projects requiring regulatory compliance

## DATs (Digital Asset Treasuries)
- Publicly traded companies holding SOL on their balance sheet as core treasury strategy
- Similar to MicroStrategy's Bitcoin treasury model
- **Key Solana DATs:**
  - DeFi Development Corp (DFDV): Pioneer SOL treasury company
  - Upexi: Significant SOL holdings
  - Sol Strategies: SOL-focused treasury
- Companies stake their SOL holdings to earn ~6-8% APY
- Institutional route for SOL exposure without direct custody
- Collectively hold significant % of circulating SOL supply

## Real World Assets (RWAs)
- Tokenizing real-world assets (bonds, real estate, commodities) on Solana
- Growing sector with institutional interest
- Token Extensions enable compliant RWA tokenization
- Projects: Ondo Finance (tokenized treasuries), various stablecoin issuers

## Security Best Practices
- NEVER share seed phrase or private keys — no legitimate service will ask
- Verify URLs before connecting wallet — phishing is extremely common
- No project will DM you first asking to connect wallet
- Use burner wallets for risky activities (new mints, unknown airdrops)
- Revoke unused token approvals at revoke.cash
- Enable transaction simulation in your wallet
- Be wary of fake airdrops that require approving transactions
- "Too good to be true" returns = almost certainly a scam

## Solana Technical
- **Firedancer**: New validator client by Jump Crypto, targets 1M+ TPS
- **Token Extensions**: Advanced token features for enterprise/institutional use
- **Compressed NFTs**: State compression for cheap minting at scale
- **Priority Fees**: Pay extra lamports to prioritize transactions during congestion
- **Compute Units (CU)**: Measure of computational work per transaction
- **Versioned Transactions**: Support address lookup tables for complex txns
- **QUIC**: Solana's transport protocol for validators

## Key Tools & Resources
- **solscan.io**: Block explorer — view transactions, tokens, wallets
- **solana.fm**: Alternative explorer with more analytics
- **birdeye.so**: Token charts and DeFi analytics
- **dexscreener.com**: DEX pair analytics across chains
- **step.finance**: Solana portfolio tracker
- **helius.dev**: Premium RPC and developer APIs
- **revoke.cash**: Revoke token approvals
- **jito.wtf**: MEV and validator stats
- **solanacompass.com**: Ecosystem stats and metrics
`;

const SYSTEM_PROMPT = `You are SMSai, a friendly and knowledgeable AI assistant created by Solana Made Simple (SMS). Your mission is to help people understand Solana and crypto in simple, approachable terms.

${SOLANA_KNOWLEDGE}

## Your Personality
- Friendly, patient, and encouraging
- Explain complex topics simply — like talking to a smart friend who knows crypto
- Use analogies to everyday things when helpful
- Be honest about risks (especially with memecoins and DeFi)
- Never give financial advice — educate, don't recommend specific investments

## Response Guidelines
- Keep responses concise but complete
- Use bullet points for lists
- Bold **key terms** when first introducing them
- For wallet/security questions, always emphasize seed phrase safety
- When discussing memecoins, always mention the risks
- When you use official Solana docs context provided below, cite it naturally: "According to the official Solana docs..." or add 📚

## When to Use Web Search (IMPORTANT)
- **Always search for**: current SOL price, BTC price, any crypto price
- **Always search for**: recent news, protocol updates, new launches from last few months
- **Always search for**: anything the user asks about "latest", "current", "today", "recently", "now"
- **Always search for**: new projects, tokens, or protocols you're less certain about
- **Always search for**: recent governance votes, protocol changes, ecosystem news
- **Don't search for**: basic concepts you already know well (what is staking, how wallets work, etc.)
- When in doubt about whether info is current — search first

## What You Help With
- Explaining Solana concepts (wallets, staking, DeFi, NFTs, memecoins)
- Step-by-step guides (setting up wallet, staking, swapping tokens)
- Understanding risks and how to stay safe
- Comparing protocols and choosing between options
- Solana Mobile (Seeker phone, Saga, Seed Vault, dApp Store)
- Current ecosystem news and updates (via web search)
- Troubleshooting common issues

## What to Avoid
- Specific investment advice ("you should buy X")
- Price predictions
- Promoting specific memecoins
- Guaranteeing returns or safety

Remember: You represent Solana Made Simple — make crypto accessible and understandable for everyone, from complete beginners to intermediate users!`;

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

    // Get the latest user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

    // Fetch relevant Solana docs context (non-blocking)
    let docsContext = '';
    if (lastUserMessage) {
      try {
        docsContext = await getSolanaDocsContext(lastUserMessage.content);
      } catch (err) {
        console.warn('Solana docs fetch failed, continuing without:', err.message);
      }
    }

    // Build contextual system prompt
    let contextualSystemPrompt = SYSTEM_PROMPT;

    if (docsContext) {
      contextualSystemPrompt += docsContext;
    }

    if (wallet_address) {
      contextualSystemPrompt += `\n\nNote: This user has connected their Solana wallet — they likely have some hands-on crypto experience. You can be slightly more technical when appropriate, but still keep things clear and accessible.`;
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
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

// /api/defi.js - DeFiLlama data for Solana ecosystem

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch Solana chain TVL
    const chainResponse = await fetch('https://api.llama.fi/v2/chains');
    const chains = await chainResponse.json();
    const solana = chains.find(c => c.name === 'Solana') || {};

    // Fetch top Solana protocols
    const protocolsResponse = await fetch('https://api.llama.fi/protocols');
    const allProtocols = await protocolsResponse.json();
    
    // Filter for Solana protocols and sort by TVL
    const solanaProtocols = allProtocols
      .filter(p => p.chains && p.chains.includes('Solana'))
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, 10)
      .map(p => ({
        name: p.name,
        tvl: p.tvl,
        tvlChange24h: p.change_1d,
        tvlChange7d: p.change_7d,
        category: p.category,
        logo: p.logo,
        url: p.url
      }));

    // Fetch Solana DeFi yields (top pools)
    const yieldsResponse = await fetch('https://yields.llama.fi/pools');
    const yieldsData = await yieldsResponse.json();
    
    const solanaYields = yieldsData.data
      .filter(p => p.chain === 'Solana' && p.tvlUsd > 1000000)
      .sort((a, b) => b.tvlUsd - a.tvlUsd)
      .slice(0, 10)
      .map(p => ({
        pool: p.pool,
        project: p.project,
        symbol: p.symbol,
        tvl: p.tvlUsd,
        apy: p.apy,
        apyBase: p.apyBase,
        apyReward: p.apyReward
      }));

    const data = {
      solana: {
        tvl: solana.tvl || 0,
        name: 'Solana',
        tokenSymbol: 'SOL'
      },
      topProtocols: solanaProtocols,
      topYields: solanaYields,
      lastUpdated: new Date().toISOString()
    };

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(data);

  } catch (error) {
    console.error('DeFi API error:', error);
    return res.status(500).json({ error: 'Failed to fetch DeFi data' });
  }
}

// /api/news.js - Crypto news for Bitcoin and Solana

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // CryptoPanic API (free tier - no key needed for public posts)
    // Filter for BTC and SOL news
    const [btcNews, solNews] = await Promise.all([
      fetch('https://cryptopanic.com/api/v1/posts/?auth_token=FREE&currencies=BTC&kind=news&public=true').then(r => r.json()).catch(() => ({ results: [] })),
      fetch('https://cryptopanic.com/api/v1/posts/?auth_token=FREE&currencies=SOL&kind=news&public=true').then(r => r.json()).catch(() => ({ results: [] }))
    ]);

    // If CryptoPanic doesn't work without auth, use CoinGecko news as backup
    let newsItems = [];
    
    if (btcNews.results?.length || solNews.results?.length) {
      // CryptoPanic worked
      const btcItems = (btcNews.results || []).slice(0, 5).map(item => ({
        title: item.title,
        url: item.url,
        source: item.source?.title || 'Unknown',
        publishedAt: item.published_at,
        currency: 'BTC'
      }));
      
      const solItems = (solNews.results || []).slice(0, 5).map(item => ({
        title: item.title,
        url: item.url,
        source: item.source?.title || 'Unknown',
        publishedAt: item.published_at,
        currency: 'SOL'
      }));
      
      newsItems = [...btcItems, ...solItems];
    } else {
      // Fallback: Use CoinGecko status updates / trending
      const [btcData, solData] = await Promise.all([
        fetch('https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false').then(r => r.json()).catch(() => ({})),
        fetch('https://api.coingecko.com/api/v3/coins/solana?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false').then(r => r.json()).catch(() => ({}))
      ]);

      // Create news-like items from CoinGecko data
      if (btcData.description?.en) {
        newsItems.push({
          title: 'Bitcoin Overview',
          summary: btcData.description.en.substring(0, 200) + '...',
          url: 'https://www.coingecko.com/en/coins/bitcoin',
          source: 'CoinGecko',
          currency: 'BTC'
        });
      }
      
      if (solData.description?.en) {
        newsItems.push({
          title: 'Solana Overview', 
          summary: solData.description.en.substring(0, 200) + '...',
          url: 'https://www.coingecko.com/en/coins/solana',
          source: 'CoinGecko',
          currency: 'SOL'
        });
      }
    }

    // Also try to get trending searches as "hot topics"
    let trending = [];
    try {
      const trendingResponse = await fetch('https://api.coingecko.com/api/v3/search/trending');
      const trendingData = await trendingResponse.json();
      trending = (trendingData.coins || []).slice(0, 5).map(item => ({
        name: item.item.name,
        symbol: item.item.symbol,
        marketCapRank: item.item.market_cap_rank,
        thumb: item.item.thumb
      }));
    } catch (e) {
      console.error('Trending fetch failed:', e);
    }

    const data = {
      news: newsItems,
      trending: trending,
      lastUpdated: new Date().toISOString()
    };

    // Cache for 15 minutes
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate');
    return res.status(200).json(data);

  } catch (error) {
    console.error('News API error:', error);
    return res.status(500).json({ error: 'Failed to fetch news' });
  }
}

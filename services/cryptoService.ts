
import { MarketData } from '../types';

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true';

// Cache to avoid hitting rate limits (CoinGecko free tier is ~10-30 req/min)
let lastFetchTime = 0;
let cachedData: { btc: MarketData; eth: MarketData } | null = null;
const CACHE_DURATION = 60 * 1000; // 1 minute cache

export async function fetchCryptoPrices(): Promise<{ btc: MarketData; eth: MarketData } | null> {
    const now = Date.now();
    if (cachedData && (now - lastFetchTime < CACHE_DURATION)) {
        return cachedData;
    }

    try {
        const response = await fetch(COINGECKO_API);
        if (!response.ok) {
            if (response.status === 429) console.warn("CoinGecko Rate Limit. Using Cache/Fallback.");
            return cachedData; // Return old data if rate limited
        }

        const data = await response.json();

        const btc: MarketData = {
            symbol: 'BTC',
            name: 'Bitcoin',
            price: data.bitcoin.usd,
            change: data.bitcoin.usd_24h_change,
            trend: data.bitcoin.usd_24h_change >= 0 ? 'up' : 'down',
            lastUpdated: new Date().toISOString()
        };

        const eth: MarketData = {
            symbol: 'ETH',
            name: 'Ethereum',
            price: data.ethereum.usd,
            change: data.ethereum.usd_24h_change,
            trend: data.ethereum.usd_24h_change >= 0 ? 'up' : 'down',
            lastUpdated: new Date().toISOString()
        };

        cachedData = { btc, eth };
        lastFetchTime = now;
        return cachedData;

    } catch (error) {
        console.error("Crypto Fetch Failed:", error);
        return cachedData; // Return last known good data or null
    }
}

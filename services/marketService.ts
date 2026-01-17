import { MarketDashboard, MarketData } from '../types';
import { fetchCryptoPrices } from './cryptoService';

const BASE_VALUES = {
    sp500: 4750,
    gold: 2030,
    oil: 74,
};

function generateSimulatedTicker(name: string, symbol: string, baseValue: number, volatility: number, bias: number = 0): MarketData {
    // Bias pushes the price trend up or down based on external factors (like Tension)
    const randomMove = (Math.random() - 0.5) * volatility;
    const trendMove = bias; // Deterministic "Smart" move

    const changeVal = randomMove + trendMove;
    const price = baseValue + changeVal;
    const percentChange = (changeVal / baseValue) * 100;

    return {
        symbol,
        name,
        price: parseFloat(price.toFixed(2)),
        change: parseFloat(percentChange.toFixed(2)),
        trend: percentChange >= 0 ? 'up' : 'down',
        lastUpdated: new Date().toISOString()
    };
}

export async function fetchMarketData(globalTension: number): Promise<MarketDashboard> {
    // 1. Fetch Real Crypto Data
    let cryptoData = await fetchCryptoPrices();

    // Fallback if CoinGecko fails (Simulated Crypto)
    if (!cryptoData) {
        cryptoData = {
            btc: {
                symbol: 'BTC', name: 'Bitcoin',
                price: 42000 + (globalTension * 10), change: 1.2, trend: 'up',
                lastUpdated: new Date().toISOString()
            },
            eth: {
                symbol: 'ETH', name: 'Ethereum',
                price: 2200 + (globalTension * 2), change: 0.5, trend: 'up',
                lastUpdated: new Date().toISOString()
            }
        };
    }

    // 2. Simulate Stocks/Commodities based on Tension (War logic)
    const volMultiplier = 1 + (globalTension / 50);

    // S&P 500: Negative correlation with tension
    const sp500Bias = -(globalTension / 100) * 20;

    // Gold: Positive correlation (Safe Haven)
    const goldBias = (globalTension / 100) * 15;

    // Oil: Positive correlation (Supply shock fears)
    const oilBias = (globalTension / 100) * 5;

    return {
        sp500: generateSimulatedTicker("S&P 500", "SPY", BASE_VALUES.sp500, 15 * volMultiplier, sp500Bias),
        btc: cryptoData.btc,
        eth: cryptoData.eth,
        gold: generateSimulatedTicker("Gold", "XAU", BASE_VALUES.gold, 5 * volMultiplier, goldBias),
        oil: generateSimulatedTicker("Crude Oil", "WTI", BASE_VALUES.oil, 2 * volMultiplier, oilBias),
        timestamp: new Date().toISOString()
    };
}

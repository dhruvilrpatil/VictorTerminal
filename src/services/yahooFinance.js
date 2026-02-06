// Stock API service - connects to Python backend for real-time Yahoo Finance data

const API_BASE = 'http://localhost:5000/api';

// Fallback data if API is unavailable
const FALLBACK_DATA = [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Energy', price: 2950.45, change: 0.51, open: 2940, high: 2965.30, low: 2935.10, volume: '8.2M', pe: '28.5', marketCap: '19.8T' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy', sector: 'IT', price: 4120.20, change: -1.67, open: 4180, high: 4195.50, low: 4100, volume: '2.1M', pe: '32.1', marketCap: '14.9T' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Banking', price: 1450.80, change: -0.91, open: 1465, high: 1470.20, low: 1445.50, volume: '5.4M', pe: '19.8', marketCap: '11.2T' },
    { symbol: 'INFY.NS', name: 'Infosys', sector: 'IT', price: 1610.10, change: 0.88, open: 1595, high: 1625.40, low: 1590, volume: '4.8M', pe: '25.6', marketCap: '6.7T' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Banking', price: 1085.50, change: 0.69, open: 1078, high: 1092.30, low: 1075, volume: '6.2M', pe: '18.2', marketCap: '7.6T' },
    { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking', price: 760.10, change: 0.00, open: 758, high: 768.50, low: 755.20, volume: '12.5M', pe: '10.5', marketCap: '6.8T' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', sector: 'Telecom', price: 1150.30, change: 2.31, open: 1124, high: 1156.16, low: 1149.47, volume: '3.1M', pe: '55.4', marketCap: '6.4T' },
    { symbol: 'ITC.NS', name: 'ITC Ltd', sector: 'FMCG', price: 425.40, change: 0.00, open: 424, high: 428.90, low: 422.10, volume: '9.8M', pe: '26.8', marketCap: '5.3T' },
];

/**
 * Fetch all stock quotes from Python API
 */
export const fetchQuotes = async () => {
    try {
        const response = await fetch(`${API_BASE}/stocks`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.stocks && data.stocks.length > 0) {
            console.log(`[API] Loaded ${data.count} stocks, last update: ${data.lastUpdate}`);
            return data.stocks;
        }

        throw new Error('No stocks returned');
    } catch (error) {
        console.warn('[API] Python server unavailable, using fallback data:', error.message);
        return FALLBACK_DATA;
    }
};

/**
 * Fetch single stock quote
 */
export const fetchStock = async (symbol) => {
    try {
        const response = await fetch(`${API_BASE}/stocks/${symbol}`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.warn(`[API] Error fetching ${symbol}:`, error.message);
        return FALLBACK_DATA.find(s => s.symbol === symbol) || null;
    }
};

/**
 * Fetch historical data for charts
 */
export const fetchHistoricalData = async (symbol, period = '1mo', interval = '1d') => {
    try {
        const response = await fetch(`${API_BASE}/stocks/${symbol}/history?period=${period}&interval=${interval}`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.data && data.data.length > 0) {
            console.log(`[API] Loaded ${data.count} candles for ${symbol}`);
            return data.data;
        }

        throw new Error('No history data');
    } catch (error) {
        console.warn(`[API] Error fetching history for ${symbol}:`, error.message);
        return generateFallbackHistory(2500, 30);
    }
};

/**
 * Check API health
 */
export const checkApiHealth = async () => {
    try {
        const response = await fetch(`${API_BASE}/health`);
        return await response.json();
    } catch (error) {
        return { status: 'offline', error: error.message };
    }
};

// Generate fallback historical data
const generateFallbackHistory = (basePrice, days) => {
    const data = [];
    let price = basePrice * 0.95;

    for (let i = 0; i < days; i++) {
        const volatility = basePrice * 0.02;
        const open = price + (Math.random() - 0.5) * volatility;
        const close = open + (Math.random() - 0.5) * volatility;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;

        data.push({
            date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            open: Math.round(open * 100) / 100,
            high: Math.round(high * 100) / 100,
            low: Math.round(low * 100) / 100,
            close: Math.round(close * 100) / 100,
        });

        price = close;
    }

    return data;
};

// Stock symbols list
export const STOCK_SYMBOLS = [
    'RELIANCE.NS',
    'TCS.NS',
    'HDFCBANK.NS',
    'INFY.NS',
    'ICICIBANK.NS',
    'SBIN.NS',
    'BHARTIARTL.NS',
    'ITC.NS',
];

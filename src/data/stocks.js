// Stock data for the application
export const stocksData = [
  {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries',
    sector: 'Energy',
    price: 2950.45,
    change: 0.51,
    open: 2940.00,
    high: 2965.30,
    low: 2935.10,
    volume: '8.2M',
    pe: 28.5,
    marketCap: '19.8T',
  },
  {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Svcs',
    sector: 'IT',
    price: 4120.20,
    change: -1.67,
    open: 4180.00,
    high: 4195.50,
    low: 4100.00,
    volume: '2.1M',
    pe: 32.1,
    marketCap: '14.9T',
  },
  {
    symbol: 'HDFCBANK.NS',
    name: 'HDFC Bank Ltd',
    sector: 'Banking',
    price: 1450.80,
    change: -0.91,
    open: 1465.00,
    high: 1470.20,
    low: 1445.50,
    volume: '5.4M',
    pe: 19.8,
    marketCap: '11.2T',
  },
  {
    symbol: 'INFY.NS',
    name: 'Infosys Ltd',
    sector: 'IT',
    price: 1610.10,
    change: 0.88,
    open: 1595.00,
    high: 1625.40,
    low: 1590.00,
    volume: '4.8M',
    pe: 25.6,
    marketCap: '6.7T',
  },
  {
    symbol: 'ICICIBANK.NS',
    name: 'ICICI Bank Ltd',
    sector: 'Banking',
    price: 1085.50,
    change: 0.69,
    open: 1078.00,
    high: 1092.30,
    low: 1075.00,
    volume: '6.2M',
    pe: 18.2,
    marketCap: '7.6T',
  },
  {
    symbol: 'SBIN.NS',
    name: 'State Bank of India',
    sector: 'Banking',
    price: 760.10,
    change: 0.00,
    open: 758.00,
    high: 768.50,
    low: 755.20,
    volume: '12.5M',
    pe: 10.5,
    marketCap: '6.8T',
  },
  {
    symbol: 'BHARTIARTL.NS',
    name: 'Bharti Airtel',
    sector: 'Telecom',
    price: 1150.30,
    change: 2.31,
    open: 1124.00,
    high: 1156.16,
    low: 1149.47,
    volume: '3.1M',
    pe: 55.4,
    marketCap: '6.4T',
  },
  {
    symbol: 'ITC.NS',
    name: 'ITC Ltd',
    sector: 'FMCG',
    price: 425.40,
    change: 0.00,
    open: 424.00,
    high: 428.90,
    low: 422.10,
    volume: '9.8M',
    pe: 26.8,
    marketCap: '5.3T',
  },
];

export const portfolioHoldings = [
  {
    symbol: 'RELIANCE.NS',
    shares: 50,
    avgCost: 2800.00,
    currentPrice: 2950.45,
  },
  {
    symbol: 'HDFCBANK.NS',
    shares: 100,
    avgCost: 1500.00,
    currentPrice: 1450.80,
  },
  {
    symbol: 'TCS.NS',
    shares: 25,
    avgCost: 3800.00,
    currentPrice: 4120.20,
  },
];

// Generate random price history for charts
export const generatePriceHistory = (basePrice, days = 30) => {
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

// Generate sparkline data for mini charts
export const generateSparklineData = (basePrice, points = 20) => {
  const data = [];
  let price = basePrice;
  
  for (let i = 0; i < points; i++) {
    price = price + (Math.random() - 0.5) * basePrice * 0.01;
    data.push({
      value: Math.round(price * 100) / 100,
    });
  }
  
  return data;
};

// Terminal messages
export const terminalAlerts = [
  {
    id: 'MUM-INV-STATION-7',
    status: 'MARKET PULSE - LIVE',
    message: 'Sensex scales new peaks, propelled by energy heavyweight RELIANCE and bullish domestic sentiment following the RBI\'s status quo on repo rates. While the indices maintain a strong bull run, the IT sector (TCS, INFY) faces headwinds from tightened US discretionary spending, leading to localized profit-booking. Banking majors HDFCBANK and ICICIBANK are seeing healthy consolidation, supporting Nifty\'s floor. We anticipate sectoral rotation toward Telecom (BHARTIARTL) ahead of Q2 tariff hikes. Despite global macro volatility, robust FII flows and a neutral monetary stance suggest a "buy on dips" strategy remains prudent for core allocations.',
  },
];

// AI responses for simulation
export const aiResponses = [
  'VICTOR SYSTEM INITIALIZED. AWAITING QUERY.',
  'ANALYZING MARKET CONDITIONS...',
  'NEURAL NETWORK PROCESSING COMPLETE.',
  'RECOMMENDATION: HOLD CURRENT POSITIONS.',
];

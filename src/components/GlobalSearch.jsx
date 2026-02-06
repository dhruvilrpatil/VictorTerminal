import { useState, useEffect, useRef, useMemo } from 'react';

const API_BASE = 'http://localhost:5000/api';

// Large local database for instant search (most popular stocks)
const STOCK_DATABASE = [
    // NIFTY 50
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited', sector: 'Energy' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services Limited', sector: 'IT' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', sector: 'Banking' },
    { symbol: 'INFY.NS', name: 'Infosys Limited', sector: 'IT' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Limited', sector: 'Banking' },
    { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Limited', sector: 'Telecom' },
    { symbol: 'ITC.NS', name: 'ITC Limited', sector: 'FMCG' },
    { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank Limited', sector: 'Banking' },
    { symbol: 'LT.NS', name: 'Larsen & Toubro Limited', sector: 'Infrastructure' },
    { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Limited', sector: 'FMCG' },
    { symbol: 'AXISBANK.NS', name: 'Axis Bank Limited', sector: 'Banking' },
    { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Limited', sector: 'Finance' },
    { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India Limited', sector: 'Automobile' },
    { symbol: 'TITAN.NS', name: 'Titan Company Limited', sector: 'Consumer' },
    { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Limited', sector: 'Chemicals' },
    { symbol: 'WIPRO.NS', name: 'Wipro Limited', sector: 'IT' },
    { symbol: 'HCLTECH.NS', name: 'HCL Technologies Limited', sector: 'IT' },
    { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries Limited', sector: 'Pharma' },
    { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Limited', sector: 'Automobile' },
    { symbol: 'TATASTEEL.NS', name: 'Tata Steel Limited', sector: 'Metal' },
    { symbol: 'POWERGRID.NS', name: 'Power Grid Corporation of India Limited', sector: 'Power' },
    { symbol: 'NTPC.NS', name: 'NTPC Limited', sector: 'Power' },
    { symbol: 'ONGC.NS', name: 'Oil and Natural Gas Corporation Limited', sector: 'Energy' },
    { symbol: 'TECHM.NS', name: 'Tech Mahindra Limited', sector: 'IT' },
    { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement Limited', sector: 'Cement' },
    { symbol: 'ADANIENT.NS', name: 'Adani Enterprises Limited', sector: 'Diversified' },
    { symbol: 'ADANIPORTS.NS', name: 'Adani Ports and Special Economic Zone Limited', sector: 'Infrastructure' },
    { symbol: 'JSWSTEEL.NS', name: 'JSW Steel Limited', sector: 'Metal' },
    { symbol: 'COALINDIA.NS', name: 'Coal India Limited', sector: 'Mining' },
    { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv Limited', sector: 'Finance' },
    { symbol: 'NESTLEIND.NS', name: 'Nestle India Limited', sector: 'FMCG' },
    { symbol: 'DRREDDY.NS', name: 'Dr Reddys Laboratories Limited', sector: 'Pharma' },
    { symbol: 'CIPLA.NS', name: 'Cipla Limited', sector: 'Pharma' },
    { symbol: 'DIVISLAB.NS', name: 'Divis Laboratories Limited', sector: 'Pharma' },
    { symbol: 'BRITANNIA.NS', name: 'Britannia Industries Limited', sector: 'FMCG' },
    { symbol: 'EICHERMOT.NS', name: 'Eicher Motors Limited', sector: 'Automobile' },
    { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp Limited', sector: 'Automobile' },
    { symbol: 'HINDALCO.NS', name: 'Hindalco Industries Limited', sector: 'Metal' },
    { symbol: 'GRASIM.NS', name: 'Grasim Industries Limited', sector: 'Cement' },
    { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank Limited', sector: 'Banking' },
    { symbol: 'APOLLOHOSP.NS', name: 'Apollo Hospitals Enterprise Limited', sector: 'Healthcare' },
    { symbol: 'TATACONSUM.NS', name: 'Tata Consumer Products Limited', sector: 'FMCG' },
    { symbol: 'SBILIFE.NS', name: 'SBI Life Insurance Company Limited', sector: 'Insurance' },
    { symbol: 'HDFCLIFE.NS', name: 'HDFC Life Insurance Company Limited', sector: 'Insurance' },
    { symbol: 'BPCL.NS', name: 'Bharat Petroleum Corporation Limited', sector: 'Energy' },
    { symbol: 'M&M.NS', name: 'Mahindra & Mahindra Limited', sector: 'Automobile' },
    { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto Limited', sector: 'Automobile' },
    { symbol: 'SHRIRAMFIN.NS', name: 'Shriram Finance Limited', sector: 'Finance' },

    // Popular stocks
    { symbol: 'ADANIGREEN.NS', name: 'Adani Green Energy Limited', sector: 'Power' },
    { symbol: 'ADANIPOWER.NS', name: 'Adani Power Limited', sector: 'Power' },
    { symbol: 'VEDL.NS', name: 'Vedanta Limited', sector: 'Metal' },
    { symbol: 'ZOMATO.NS', name: 'Zomato Limited', sector: 'Consumer' },
    { symbol: 'NYKAA.NS', name: 'FSN E-Commerce Ventures Limited Nykaa', sector: 'Consumer' },
    { symbol: 'PAYTM.NS', name: 'One97 Communications Limited Paytm', sector: 'Fintech' },
    { symbol: 'DMART.NS', name: 'Avenue Supermarts Limited DMart', sector: 'Retail' },
    { symbol: 'IRCTC.NS', name: 'Indian Railway Catering and Tourism Corporation Limited', sector: 'Tourism' },
    { symbol: 'HAL.NS', name: 'Hindustan Aeronautics Limited', sector: 'Defence' },
    { symbol: 'BEL.NS', name: 'Bharat Electronics Limited', sector: 'Defence' },
    { symbol: 'LIC.NS', name: 'Life Insurance Corporation of India', sector: 'Insurance' },
    { symbol: 'DLF.NS', name: 'DLF Limited', sector: 'Realty' },
    { symbol: 'IRFC.NS', name: 'Indian Railway Finance Corporation Limited', sector: 'Finance' },
    { symbol: 'PFC.NS', name: 'Power Finance Corporation Limited', sector: 'Finance' },
    { symbol: 'RECLTD.NS', name: 'REC Limited', sector: 'Finance' },
    { symbol: 'BANKBARODA.NS', name: 'Bank of Baroda', sector: 'Banking' },
    { symbol: 'PNB.NS', name: 'Punjab National Bank', sector: 'Banking' },
    { symbol: 'CANBK.NS', name: 'Canara Bank', sector: 'Banking' },
    { symbol: 'TATAPOWER.NS', name: 'Tata Power Company Limited', sector: 'Power' },
    { symbol: 'NHPC.NS', name: 'NHPC Limited', sector: 'Power' },
    { symbol: 'INDIGO.NS', name: 'InterGlobe Aviation Limited IndiGo', sector: 'Aviation' },
    { symbol: 'IDEA.NS', name: 'Vodafone Idea Limited', sector: 'Telecom' },
    { symbol: 'YESBANK.NS', name: 'Yes Bank Limited', sector: 'Banking' },

    // More popular stocks - Breweries, Hotels, etc
    { symbol: 'GMBREW.NS', name: 'GM Breweries Limited', sector: 'FMCG' },
    { symbol: 'UBL.NS', name: 'United Breweries Limited', sector: 'FMCG' },
    { symbol: 'RADICO.NS', name: 'Radico Khaitan Limited', sector: 'FMCG' },
    { symbol: 'VBL.NS', name: 'Varun Beverages Limited', sector: 'FMCG' },
    { symbol: 'MCDOWELL-N.NS', name: 'United Spirits Limited McDowell', sector: 'FMCG' },
    { symbol: 'INDHOTEL.NS', name: 'Indian Hotels Company Limited Taj', sector: 'Hotels' },
    { symbol: 'EIHOTEL.NS', name: 'EIH Limited Oberoi Hotels', sector: 'Hotels' },
    { symbol: 'LEMON.NS', name: 'Lemon Tree Hotels Limited', sector: 'Hotels' },
    { symbol: 'JUBLFOOD.NS', name: 'Jubilant Foodworks Limited', sector: 'Consumer' },
    { symbol: 'WESTLIFE.NS', name: 'Westlife Foodworld Limited McDonalds', sector: 'Consumer' },
    { symbol: 'DEVYANI.NS', name: 'Devyani International Limited KFC Pizza Hut', sector: 'Consumer' },
];

// Fast fuzzy search algorithm
const fuzzySearch = (query, stocks) => {
    if (!query || query.length < 1) return [];

    const searchTerm = query.toLowerCase();
    const words = searchTerm.split(/\s+/);

    const scored = stocks.map(stock => {
        const symbolLower = stock.symbol.toLowerCase().replace('.ns', '').replace('.bo', '');
        const nameLower = stock.name.toLowerCase();
        const sectorLower = stock.sector.toLowerCase();

        let score = 0;

        // Exact symbol match (highest priority)
        if (symbolLower === searchTerm) score += 100;
        else if (symbolLower.startsWith(searchTerm)) score += 80;
        else if (symbolLower.includes(searchTerm)) score += 50;

        // Name matching
        if (nameLower.startsWith(searchTerm)) score += 70;
        else if (nameLower.includes(searchTerm)) score += 40;

        // Word-by-word matching for multi-word queries
        words.forEach(word => {
            if (word.length < 2) return;
            if (symbolLower.includes(word)) score += 30;
            if (nameLower.includes(word)) score += 25;
            if (sectorLower.includes(word)) score += 10;
        });

        // Bonus for matching at word boundaries
        const nameWords = nameLower.split(/\s+/);
        nameWords.forEach(nameWord => {
            if (nameWord.startsWith(searchTerm)) score += 35;
            words.forEach(word => {
                if (nameWord.startsWith(word)) score += 15;
            });
        });

        return { ...stock, score };
    });

    return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
};

const GlobalSearch = ({ onSelectStock }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const inputRef = useRef(null);
    const resultsRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    // Fast local search with useMemo
    const localResults = useMemo(() => {
        return fuzzySearch(query, STOCK_DATABASE);
    }, [query]);

    // Live API search for stocks not in local database
    const searchLive = async (searchQuery) => {
        if (searchQuery.length < 2) return;

        setSearching(true);
        try {
            // Try to fetch from Yahoo Finance via our API
            const symbol = `${searchQuery.toUpperCase()}.NS`;
            const response = await fetch(`${API_BASE}/stocks/${symbol}`);
            const data = await response.json();

            if (data && !data.error && data.price > 0) {
                // Stock exists! Add to results if not already there
                setResults(prev => {
                    const exists = prev.some(s => s.symbol === symbol);
                    if (!exists) {
                        return [...prev, {
                            symbol: symbol,
                            name: data.name || searchQuery.toUpperCase(),
                            sector: data.sector || 'N/A',
                            isLive: true
                        }];
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.log('Live search error:', error);
        }
        setSearching(false);
    };

    useEffect(() => {
        setResults(localResults);
        setSelectedIndex(-1);

        // If no local results and query is long enough, try live search
        if (localResults.length === 0 && query.length >= 2) {
            // Debounce the live search
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => {
                searchLive(query);
            }, 500);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [localResults, query]);

    const handleSelect = async (stock) => {
        setShowResults(false);
        setQuery('');
        setLoading(true);

        try {
            // Fetch full stock data from API
            const response = await fetch(`${API_BASE}/stocks/${stock.symbol}`);
            const stockData = await response.json();

            if (stockData && !stockData.error) {
                onSelectStock(stockData);
            } else {
                // Use basic info if API fails
                onSelectStock({
                    ...stock,
                    price: 0,
                    change: 0
                });
            }
        } catch (error) {
            console.error('Error fetching stock:', error);
            onSelectStock({
                ...stock,
                price: 0,
                change: 0
            });
        }

        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (!showResults || results.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && results[selectedIndex]) {
                    handleSelect(results[selectedIndex]);
                } else if (results.length > 0) {
                    handleSelect(results[0]);
                } else if (query.length >= 2) {
                    // Try direct symbol lookup
                    handleSelect({
                        symbol: `${query.toUpperCase()}.NS`,
                        name: query.toUpperCase(),
                        sector: 'N/A'
                    });
                }
                break;
            case 'Escape':
                setShowResults(false);
                break;
        }
    };

    return (
        <div className="global-search">
            <div className="global-search-input">
                <span className="search-prompt">&gt;</span>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="SEARCH ANY NSE/BSE STOCK (E.G. GMBREW, RELIANCE)..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                    onKeyDown={handleKeyDown}
                />
                {(loading || searching) && <span className="search-loading-icon">⟳</span>}
            </div>

            {showResults && query.length >= 1 && results.length > 0 && (
                <div className="global-search-results" ref={resultsRef}>
                    {results.map((stock, i) => (
                        <div
                            key={stock.symbol}
                            className={`global-search-item ${selectedIndex === i ? 'selected' : ''}`}
                            onClick={() => handleSelect(stock)}
                            onMouseEnter={() => setSelectedIndex(i)}
                        >
                            <div className="search-item-symbol">
                                {stock.symbol.replace('.NS', '').replace('.BO', '')}
                                {stock.isLive && <span className="live-badge">LIVE</span>}
                            </div>
                            <div className="search-item-name">{stock.name}</div>
                            <div className="search-item-sector">{stock.sector}</div>
                        </div>
                    ))}
                </div>
            )}

            {showResults && query.length >= 2 && results.length === 0 && !searching && (
                <div className="global-search-results">
                    <div
                        className="global-search-item try-direct"
                        onClick={() => handleSelect({
                            symbol: `${query.toUpperCase()}.NS`,
                            name: query.toUpperCase(),
                            sector: 'N/A'
                        })}
                    >
                        <div className="search-item-symbol">{query.toUpperCase()}</div>
                        <div className="search-item-name">Try searching "{query.toUpperCase()}" on NSE</div>
                        <div className="search-item-sector">Press Enter</div>
                    </div>
                </div>
            )}

            {showResults && query.length >= 2 && searching && results.length === 0 && (
                <div className="global-search-results">
                    <div className="global-search-empty">Searching for "{query}"...</div>
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;

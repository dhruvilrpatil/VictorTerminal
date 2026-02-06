import { useState, useEffect } from 'react';
import StockModal from '../components/StockModal';

const API_BASE = 'http://localhost:5000/api';

const SearchBar = ({ onSelectStock }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [exchange, setExchange] = useState('NSE');

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const searchTimeout = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&exchange=${exchange}`);
                const data = await response.json();
                setResults(data.results || []);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            }
            setLoading(false);
        }, 300);

        return () => clearTimeout(searchTimeout);
    }, [query, exchange]);

    const handleSelect = async (result) => {
        setShowResults(false);
        setQuery('');

        // Fetch full stock data
        try {
            const response = await fetch(`${API_BASE}/stocks/${result.symbol}`);
            const stockData = await response.json();
            onSelectStock(stockData);
        } catch (error) {
            onSelectStock(result);
        }
    };

    return (
        <div className="search-container">
            <div className="search-input-wrapper">
                <span className="search-icon">⌕</span>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search NSE/BSE stocks..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowResults(true)}
                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                />
                <div className="exchange-toggle">
                    <button
                        className={`exchange-btn ${exchange === 'NSE' ? 'active' : ''}`}
                        onClick={() => setExchange('NSE')}
                    >
                        NSE
                    </button>
                    <button
                        className={`exchange-btn ${exchange === 'BSE' ? 'active' : ''}`}
                        onClick={() => setExchange('BSE')}
                    >
                        BSE
                    </button>
                </div>
            </div>

            {showResults && (query.length >= 2) && (
                <div className="search-results">
                    {loading ? (
                        <div className="search-loading">Searching...</div>
                    ) : results.length > 0 ? (
                        results.map((result, i) => (
                            <div
                                key={i}
                                className="search-result-item"
                                onClick={() => handleSelect(result)}
                            >
                                <div className="search-result-symbol">{result.symbol}</div>
                                <div className="search-result-name">{result.name}</div>
                                <div className="search-result-sector">{result.sector}</div>
                            </div>
                        ))
                    ) : (
                        <div className="search-no-results">No stocks found</div>
                    )}
                </div>
            )}
        </div>
    );
};

const AllStocks = () => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStock, setSelectedStock] = useState(null);

    useEffect(() => {
        const loadStocks = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE}/stocks`);
                const data = await response.json();
                setStocks(data.stocks || []);
            } catch (error) {
                console.error('Error loading stocks:', error);
            }
            setLoading(false);
        };
        loadStocks();
    }, []);

    return (
        <div>
            <h1 className="view-title">ALL STOCKS</h1>

            {/* Search Bar */}
            <SearchBar onSelectStock={setSelectedStock} />

            <div className="panel" style={{ marginTop: '20px' }}>
                <div className="panel-header">
                    <span className="panel-title">WATCHLIST</span>
                </div>
                {loading ? (
                    <div className="loading-indicator">
                        <div className="loading-spinner"></div>
                        Loading stocks...
                    </div>
                ) : (
                    <div className="stocks-list">
                        {stocks.map(stock => (
                            <div
                                key={stock.symbol}
                                className="stock-list-item"
                                onClick={() => setSelectedStock(stock)}
                            >
                                <div className="stock-list-info">
                                    <span className="stock-list-symbol">{stock.symbol}</span>
                                    <span className="stock-list-name">{stock.name}</span>
                                </div>
                                <span className={`stock-list-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                                    {stock.change >= 0 ? '+' : ''}{stock.change?.toFixed(2) || '0.00'}%
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedStock && (
                <StockModal
                    stock={selectedStock}
                    onClose={() => setSelectedStock(null)}
                />
            )}
        </div>
    );
};

export default AllStocks;

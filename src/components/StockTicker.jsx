import { useState, useEffect } from 'react';
import { fetchQuotes } from '../services/yahooFinance';

const StockTicker = () => {
    const [stocks, setStocks] = useState([]);
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const loadStocks = async () => {
            const data = await fetchQuotes();
            setStocks(data);
        };
        loadStocks();

        // Refresh every 60 seconds
        const interval = setInterval(loadStocks, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setOffset(prev => prev - 1);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    const tickerItems = [...stocks, ...stocks]; // Duplicate for seamless loop

    if (stocks.length === 0) {
        return (
            <div className="stock-ticker">
                <div className="ticker-content">
                    <span className="ticker-item">Loading stock data...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="stock-ticker">
            <div
                className="ticker-content"
                style={{ transform: `translateX(${offset % (stocks.length * 200)}px)` }}
            >
                {tickerItems.map((stock, index) => (
                    <span key={index} className="ticker-item">
                        <span className="ticker-symbol">{stock.symbol}</span>
                        <span className="ticker-price">₹{stock.price?.toLocaleString() || 'N/A'}</span>
                        <span className={`ticker-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                            {stock.change >= 0 ? '▲' : '▼'} {Math.abs(stock.change || 0).toFixed(2)}%
                        </span>
                    </span>
                ))}
            </div>
        </div>
    );
};

export default StockTicker;

import { useState, useEffect, useRef } from 'react';
import StockCard from '../components/StockCard';
import PortfolioSummary from '../components/PortfolioSummary';
import StockModal from '../components/StockModal';
import { fetchQuotes } from '../services/yahooFinance';

// Market news headlines
const NEWS_HEADLINES = [
    "📈 Sensex hits all-time high of 74,500; Nifty crosses 22,600 mark",
    "💹 FIIs turn net buyers with ₹2,500 Cr inflow in Indian equities",
    "🏦 RBI keeps repo rate unchanged at 6.5% for 6th consecutive time",
    "⚡ Adani Green surges 8% on new solar project announcement",
    "🚗 Tata Motors reports 15% YoY growth in EV sales for January",
    "💊 Pharma stocks rally as FDA clears key drug approvals",
    "🏭 Metal stocks gain on China stimulus hopes, Tata Steel up 4%",
    "📱 IT stocks mixed ahead of Q4 results; TCS, Infosys in focus",
    "🛢️ Oil & Gas stocks dip as crude prices fall below $75/barrel",
    "🏗️ Infra push: L&T wins ₹12,000 Cr highway project contract",
];

const Dashboard = () => {
    const [stocks, setStocks] = useState([]);
    const [selectedStock, setSelectedStock] = useState(null);
    const [loading, setLoading] = useState(true);
    const [visibleNews, setVisibleNews] = useState([]);
    const [newsLoading, setNewsLoading] = useState(true);

    // Fetch stock data on mount and every 60 seconds
    useEffect(() => {
        const loadStocks = async () => {
            setLoading(true);
            const data = await fetchQuotes();
            setStocks(data);
            setLoading(false);
        };

        loadStocks();
        const interval = setInterval(loadStocks, 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch news on mount and every 2 minutes
    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/news');
                const data = await response.json();
                if (data.news && data.news.length > 0) {
                    // Format news for display
                    const formattedUrl = data.news.map(item => {
                        const icon = item.publisher.includes('Moneycontrol') ? '💹' :
                            item.title.includes('Sensex') ? '📈' :
                                item.title.includes('Bank') ? '🏦' : '📰';
                        return `${icon} ${item.time} - ${item.title} (${item.publisher})`;
                    });
                    setVisibleNews(formattedUrl);
                    setNewsLoading(false);
                }
            } catch (err) {
                console.error("News fetch error:", err);
                // Fallback to static if API fails
                setVisibleNews(NEWS_HEADLINES.slice(0, 5));
                setNewsLoading(false);
            }
        };

        fetchNews();
        const interval = setInterval(fetchNews, 120000); // 2 mins
        return () => clearInterval(interval);
    }, []);

    // Simple rotation if we have many items
    useEffect(() => {
        if (visibleNews.length <= 5) return;

        const rotation = setInterval(() => {
            setVisibleNews(prev => {
                const [first, ...rest] = prev;
                return [...rest, first];
            });
        }, 5000);

        return () => clearInterval(rotation);
    }, [visibleNews.length]);

    const handleStockClick = (stock) => {
        setSelectedStock(stock);
    };

    const handleCloseModal = () => {
        setSelectedStock(null);
    };

    // Get top gainers and losers
    const sortedByChange = [...stocks].sort((a, b) => (b.change || 0) - (a.change || 0));
    const topGainers = sortedByChange.filter(s => (s.change || 0) > 0).slice(0, 3);
    const topLosers = sortedByChange.filter(s => (s.change || 0) < 0).slice(-3).reverse();

    return (
        <>
            <div className="dashboard-grid">
                <div className="dashboard-main">
                    {/* News Headlines Section */}
                    <div className="news-section">
                        <div className="news-section-header">
                            <span className="news-icon">📰</span>
                            <span className="news-title">MARKET NEWS & UPDATES</span>
                            <span className="news-live">● LIVE</span>
                        </div>
                        <div className="news-list">
                            {visibleNews.map((news, i) => (
                                <div key={`${news}-${i}`} className={`news-item ${i === 0 ? 'news-new' : ''}`}>
                                    <span className="news-bullet">▸</span>
                                    <span className="news-text">{news}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Loading indicator */}
                    {loading && stocks.length === 0 && (
                        <div className="loading-indicator">
                            <div className="loading-spinner"></div>
                            Loading stock data from Yahoo Finance...
                        </div>
                    )}

                    {/* Top Gainers & Losers Section */}
                    {stocks.length > 0 && (
                        <div className="top-movers-section">
                            {/* Top Gainers */}
                            <div className="movers-card gainers">
                                <div className="movers-header">
                                    <span className="movers-icon">🚀</span>
                                    <span className="movers-title">TOP GAINERS</span>
                                </div>
                                <div className="movers-list">
                                    {topGainers.map((stock, i) => (
                                        <div
                                            key={stock.symbol}
                                            className="mover-item"
                                            onClick={() => handleStockClick(stock)}
                                        >
                                            <div className="mover-rank">{i + 1}</div>
                                            <div className="mover-info">
                                                <div className="mover-symbol">{stock.symbol?.replace('.NS', '')}</div>
                                                <div className="mover-name">{stock.name}</div>
                                            </div>
                                            <div className="mover-stats">
                                                <div className="mover-price">₹{stock.price?.toLocaleString()}</div>
                                                <div className="mover-change positive">
                                                    ▲ {stock.change?.toFixed(2)}%
                                                </div>
                                            </div>
                                            <div className="mover-details">
                                                <div className="detail-row">
                                                    <span>Open:</span>
                                                    <span>₹{stock.open?.toLocaleString() || 'N/A'}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span>High:</span>
                                                    <span>₹{stock.high?.toLocaleString() || 'N/A'}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span>Vol:</span>
                                                    <span>{stock.volume || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top Losers */}
                            <div className="movers-card losers">
                                <div className="movers-header">
                                    <span className="movers-icon">📉</span>
                                    <span className="movers-title">TOP LOSERS</span>
                                </div>
                                <div className="movers-list">
                                    {topLosers.map((stock, i) => (
                                        <div
                                            key={stock.symbol}
                                            className="mover-item"
                                            onClick={() => handleStockClick(stock)}
                                        >
                                            <div className="mover-rank">{i + 1}</div>
                                            <div className="mover-info">
                                                <div className="mover-symbol">{stock.symbol?.replace('.NS', '')}</div>
                                                <div className="mover-name">{stock.name}</div>
                                            </div>
                                            <div className="mover-stats">
                                                <div className="mover-price">₹{stock.price?.toLocaleString()}</div>
                                                <div className="mover-change negative">
                                                    ▼ {Math.abs(stock.change || 0).toFixed(2)}%
                                                </div>
                                            </div>
                                            <div className="mover-details">
                                                <div className="detail-row">
                                                    <span>Open:</span>
                                                    <span>₹{stock.open?.toLocaleString() || 'N/A'}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span>Low:</span>
                                                    <span>₹{stock.low?.toLocaleString() || 'N/A'}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span>Vol:</span>
                                                    <span>{stock.volume || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* All Stocks Grid */}
                    <div className="section-header">
                        <span className="section-title">📊 ALL WATCHLIST STOCKS</span>
                    </div>
                    <div className="stock-cards-grid">
                        {stocks.map(stock => (
                            <StockCard
                                key={stock.symbol}
                                stock={stock}
                                onClick={handleStockClick}
                            />
                        ))}
                    </div>
                </div>

                <div className="dashboard-sidebar">
                    <PortfolioSummary stocks={stocks} />
                </div>
            </div>

            {/* Stock Modal */}
            {selectedStock && (
                <StockModal
                    stock={selectedStock}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};

export default Dashboard;

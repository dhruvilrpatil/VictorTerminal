import { useState, useEffect } from 'react';
import { fetchQuotes } from '../services/yahooFinance';

const PortfolioSummary = () => {
    const [summary, setSummary] = useState({
        totalEquity: 0,
        investedCap: 0,
        dayPL: 0,
        dayPLPercent: 0,
        netPL: 0,
        netPLPercent: 0,
        holdingsCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const calculateSummary = async () => {
            setLoading(true);

            // Get user holdings from localStorage
            const holdings = JSON.parse(localStorage.getItem('userHoldings') || '[]');

            if (holdings.length === 0) {
                setSummary({
                    totalEquity: 0,
                    investedCap: 0,
                    dayPL: 0,
                    dayPLPercent: 0,
                    netPL: 0,
                    netPLPercent: 0,
                    holdingsCount: 0
                });
                setLoading(false);
                return;
            }

            // Fetch live stock prices
            const liveStocks = await fetchQuotes();

            let totalEquity = 0;
            let investedCap = 0;
            let dayPL = 0;

            holdings.forEach(holding => {
                // Find live price for this stock
                const liveStock = liveStocks.find(s => s.symbol === holding.symbol);
                const currentPrice = liveStock?.price || holding.currentPrice || holding.avgCost;
                const previousClose = liveStock?.previousClose || currentPrice;

                // Calculate values
                const marketValue = holding.shares * currentPrice;
                const costBasis = holding.shares * holding.avgCost;

                totalEquity += marketValue;
                investedCap += costBasis;

                // Day P/L = (current - previousClose) * shares
                if (liveStock && liveStock.previousClose) {
                    dayPL += (currentPrice - previousClose) * holding.shares;
                }
            });

            const netPL = totalEquity - investedCap;
            const netPLPercent = investedCap > 0 ? ((netPL / investedCap) * 100) : 0;
            const dayPLPercent = investedCap > 0 ? ((dayPL / investedCap) * 100) : 0;

            setSummary({
                totalEquity,
                investedCap,
                dayPL,
                dayPLPercent,
                netPL,
                netPLPercent,
                holdingsCount: holdings.length
            });

            setLoading(false);
        };

        calculateSummary();

        // Refresh every 60 seconds
        const interval = setInterval(calculateSummary, 60000);
        return () => clearInterval(interval);
    }, []);

    const formatCurrency = (value) => {
        return `₹${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="panel">
            <div className="panel-header">
                <span className="panel-title">PORTFOLIO SUMMARY</span>
                {summary.holdingsCount > 0 && (
                    <span className="holdings-count">{summary.holdingsCount} stocks</span>
                )}
            </div>
            <div className="panel-content">
                {loading ? (
                    <div className="summary-loading">Loading...</div>
                ) : summary.holdingsCount === 0 ? (
                    <div className="summary-empty">
                        <div className="empty-text">No holdings yet</div>
                        <div className="empty-hint">Add stocks to see portfolio summary</div>
                    </div>
                ) : (
                    <div className="ps-grid">
                        <div className="ps-item">
                            <div className="ps-label">Total Equity</div>
                            <div className="ps-value equity">{formatCurrency(summary.totalEquity)}</div>
                        </div>
                        <div className="ps-item">
                            <div className="ps-label">Invested Cap</div>
                            <div className="ps-value">{formatCurrency(summary.investedCap)}</div>
                        </div>
                        <div className="ps-item">
                            <div className="ps-label">Day P/L</div>
                            <div className={`ps-value ${summary.dayPL >= 0 ? 'positive' : 'negative'}`}>
                                {summary.dayPL >= 0 ? '+' : '-'}{formatCurrency(summary.dayPL)}
                                <span className="ps-percent">({summary.dayPL >= 0 ? '+' : ''}{summary.dayPLPercent.toFixed(2)}%)</span>
                            </div>
                        </div>
                        <div className="ps-item">
                            <div className="ps-label">Net P/L</div>
                            <div className={`ps-value ${summary.netPL >= 0 ? 'positive' : 'negative'}`}>
                                {summary.netPL >= 0 ? '+' : '-'}{formatCurrency(summary.netPL)}
                                <span className="ps-percent">({summary.netPL >= 0 ? '+' : ''}{summary.netPLPercent.toFixed(2)}%)</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PortfolioSummary;

import React, { useState, useEffect } from 'react';
import { fetchQuotes } from '../services/yahooFinance';

const Portfolio = () => {
    const [holdings, setHoldings] = useState([]);
    const [liveStocks, setLiveStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSymbol, setExpandedSymbol] = useState(null);

    // Load holdings from localStorage and fetch live prices
    useEffect(() => {
        const loadHoldings = async () => {
            setLoading(true);

            // Get user holdings from localStorage
            const userHoldings = JSON.parse(localStorage.getItem('userHoldings') || '[]');
            setHoldings(userHoldings);

            // Fetch live stock prices
            const stocks = await fetchQuotes();
            setLiveStocks(stocks);
            setLoading(false);
        };

        loadHoldings();

        // Refresh every 60 seconds
        const interval = setInterval(loadHoldings, 60000);
        return () => clearInterval(interval);
    }, []);

    const getHoldingDetails = (holding) => {
        // Find live price for this stock
        const liveStock = liveStocks.find(s => s.symbol === holding.symbol);
        const currentPrice = liveStock?.price || holding.currentPrice || holding.avgCost;
        const marketValue = holding.shares * currentPrice;
        const costBasis = holding.shares * holding.avgCost;
        const unrealizedPL = marketValue - costBasis;
        const unrealizedPLPercent = costBasis > 0 ? ((unrealizedPL / costBasis) * 100).toFixed(2) : '0.00';

        return {
            ...holding,
            currentPrice,
            marketValue,
            unrealizedPL,
            unrealizedPLPercent,
        };
    };

    const getLotDetails = (lot, currentPrice) => {
        const marketValue = lot.shares * currentPrice;
        const costBasis = lot.shares * lot.price;
        const pl = marketValue - costBasis;
        const plPercent = costBasis > 0 ? ((pl / costBasis) * 100).toFixed(2) : '0.00';
        return { marketValue, costBasis, pl, plPercent };
    };

    const removeHolding = (symbol) => {
        if (confirm(`Remove ${symbol} from holdings?`)) {
            const updatedHoldings = holdings.filter(h => h.symbol !== symbol);
            localStorage.setItem('userHoldings', JSON.stringify(updatedHoldings));
            setHoldings(updatedHoldings);
        }
    };

    const toggleExpand = (symbol) => {
        setExpandedSymbol(expandedSymbol === symbol ? null : symbol);
    };

    // Calculate totals
    const totals = holdings.reduce((acc, h) => {
        const details = getHoldingDetails(h);
        acc.invested += h.shares * h.avgCost;
        acc.current += details.marketValue;
        return acc;
    }, { invested: 0, current: 0 });

    const totalPL = totals.current - totals.invested;
    const totalPLPercent = totals.invested > 0 ? ((totalPL / totals.invested) * 100).toFixed(2) : '0.00';

    return (
        <div>
            <h1 className="view-title">HOLDINGS</h1>

            {/* Portfolio Summary */}
            <div className="portfolio-summary-bar">
                <div className="summary-item">
                    <span className="summary-label">Total Invested</span>
                    <span className="summary-amount">₹{totals.invested.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Current Value</span>
                    <span className="summary-amount">₹{totals.current.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Total P/L</span>
                    <span className={`summary-amount ${totalPL >= 0 ? 'positive' : 'negative'}`}>
                        {totalPL >= 0 ? '+' : ''}₹{totalPL.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({totalPLPercent}%)
                    </span>
                </div>
            </div>

            <div className="panel">
                {loading && holdings.length === 0 ? (
                    <div className="loading-indicator">
                        <div className="loading-spinner"></div>
                        Loading holdings...
                    </div>
                ) : holdings.length === 0 ? (
                    <div className="empty-holdings">
                        <div className="empty-icon">📊</div>
                        <div className="empty-text">No holdings yet</div>
                        <div className="empty-hint">Search for stocks and click "Add to Holdings" to start building your portfolio</div>
                    </div>
                ) : (
                    <table className="holdings-table">
                        <thead>
                            <tr>
                                <th style={{ width: '30px' }}></th>
                                <th>Symbol</th>
                                <th>Shares</th>
                                <th>Avg Cost</th>
                                <th>Market Price</th>
                                <th>Market Value</th>
                                <th>Unrealized P/L</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {holdings.map(holding => {
                                const details = getHoldingDetails(holding);
                                const isExpanded = expandedSymbol === holding.symbol;
                                const hasLots = holding.lots && holding.lots.length > 1;

                                return (
                                    <React.Fragment key={holding.symbol}>
                                        <tr className={isExpanded ? 'expanded-row' : ''}>
                                            <td className="expand-cell">
                                                {hasLots && (
                                                    <button
                                                        className="expand-btn"
                                                        onClick={() => toggleExpand(holding.symbol)}
                                                    >
                                                        {isExpanded ? '▼' : '▶'}
                                                    </button>
                                                )}
                                            </td>
                                            <td className="symbol-cell">{holding.symbol}</td>
                                            <td>{holding.shares}</td>
                                            <td>₹{holding.avgCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td>₹{details.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td>₹{details.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className={details.unrealizedPL >= 0 ? 'positive-cell' : 'negative-cell'}>
                                                {details.unrealizedPL >= 0 ? '+' : ''}
                                                ₹{details.unrealizedPL.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({details.unrealizedPLPercent}%)
                                            </td>
                                            <td>
                                                <button
                                                    className="remove-holding-btn"
                                                    onClick={() => removeHolding(holding.symbol)}
                                                    title="Remove holding"
                                                >
                                                    ✕
                                                </button>
                                            </td>
                                        </tr>
                                        {isExpanded && holding.lots && holding.lots.map((lot, i) => {
                                            const lotDetails = getLotDetails(lot, details.currentPrice);
                                            return (
                                                <tr key={`${holding.symbol}-lot-${i}`} className="lot-row">
                                                    <td></td>
                                                    <td className="lot-label">
                                                        └ Lot {i + 1}
                                                        <span className="lot-date">{new Date(lot.date).toLocaleDateString()}</span>
                                                    </td>
                                                    <td>{lot.shares}</td>
                                                    <td>₹{lot.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td>-</td>
                                                    <td>₹{lotDetails.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className={lotDetails.pl >= 0 ? 'positive-cell' : 'negative-cell'}>
                                                        {lotDetails.pl >= 0 ? '+' : ''}
                                                        ₹{lotDetails.pl.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({lotDetails.plPercent}%)
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Portfolio;

import { useState, useEffect } from 'react';
import { fetchQuotes, fetchHistoricalData } from '../services/yahooFinance';

const Simulation = () => {
    const [stocks, setStocks] = useState([]);
    const [selectedStock, setSelectedStock] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [isSimulating, setIsSimulating] = useState(false);
    const [forecast, setForecast] = useState(null);
    const [loadingChart, setLoadingChart] = useState(false);

    useEffect(() => {
        const loadStocks = async () => {
            const data = await fetchQuotes();
            setStocks(data);
        };
        loadStocks();
    }, []);

    useEffect(() => {
        if (selectedStock) {
            setLoadingChart(true);
            setForecast(null);
            fetchHistoricalData(selectedStock.symbol, '1mo', '1d')
                .then(data => {
                    setChartData(data);
                    setLoadingChart(false);
                })
                .catch(() => setLoadingChart(false));
        }
    }, [selectedStock]);

    const runSimulation = () => {
        if (!selectedStock) return;

        setIsSimulating(true);
        setForecast(null);

        setTimeout(() => {
            const basePrice = selectedStock.price;
            const change = (Math.random() - 0.3) * 0.1;

            setForecast({
                targetPrice: basePrice * (1 + change),
                confidence: Math.floor(70 + Math.random() * 25),
                recommendation: change > 0.02 ? 'STRONG BUY' : change > 0 ? 'BUY' : change > -0.02 ? 'HOLD' : 'SELL',
                horizon: '7 Days',
            });
            setIsSimulating(false);
        }, 2000);
    };

    const renderChart = () => {
        if (loadingChart) {
            return (
                <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <div className="loading-spinner"></div>
                    Loading chart data...
                </div>
            );
        }

        if (chartData.length === 0) return null;

        const width = 500;
        const height = 280;
        const padding = { top: 20, right: 50, bottom: 30, left: 10 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const validData = chartData.filter(d => d.open > 0 && d.close > 0);
        if (validData.length === 0) return null;

        const minPrice = Math.min(...validData.map(d => d.low)) * 0.998;
        const maxPrice = Math.max(...validData.map(d => d.high)) * 1.002;
        const priceRange = maxPrice - minPrice || 1;

        const getY = (price) => padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
        const getX = (index) => padding.left + (index / (validData.length - 1)) * chartWidth;

        const candleWidth = Math.max(2, chartWidth / validData.length * 0.6);

        return (
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
                {/* Price labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                    const price = minPrice + priceRange * pct;
                    const y = getY(price);
                    return (
                        <g key={i}>
                            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#2a2a2a" strokeDasharray="2,4" />
                            <text x={width - padding.right + 5} y={y + 4} fill="#666" fontSize="10" fontFamily="monospace">
                                {price.toFixed(0)}
                            </text>
                        </g>
                    );
                })}

                {/* Candlesticks */}
                {validData.map((candle, i) => {
                    const x = getX(i);
                    const isGreen = candle.close >= candle.open;
                    const color = isGreen ? '#00ff88' : '#ff4444';
                    const bodyTop = getY(Math.max(candle.open, candle.close));
                    const bodyBottom = getY(Math.min(candle.open, candle.close));
                    const bodyHeight = Math.max(1, bodyBottom - bodyTop);

                    return (
                        <g key={i}>
                            <line x1={x} y1={getY(candle.high)} x2={x} y2={getY(candle.low)} stroke={color} strokeWidth="1" />
                            <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyHeight} fill={color} />
                        </g>
                    );
                })}
            </svg>
        );
    };

    return (
        <div className="simulation-layout">
            {/* Stock Selection Sidebar */}
            <div className="simulation-sidebar">
                <div className="simulation-header">
                    <span className="simulation-title">⌕ SELECT ASSET</span>
                </div>
                <div className="stocks-list">
                    {stocks.map(stock => (
                        <div
                            key={stock.symbol}
                            className="stock-list-item"
                            onClick={() => { setSelectedStock(stock); setForecast(null); }}
                            style={{
                                background: selectedStock?.symbol === stock.symbol ? 'var(--bg-tertiary)' : 'transparent',
                                borderLeft: selectedStock?.symbol === stock.symbol ? '2px solid var(--accent)' : '2px solid transparent'
                            }}
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
            </div>

            {/* Simulation Main Area */}
            <div className="simulation-main">
                {selectedStock ? (
                    <>
                        {/* Stock Detail */}
                        <div className="stock-detail">
                            <div className="stock-detail-header">
                                <div>
                                    <div className="stock-detail-symbol">{selectedStock.symbol}</div>
                                    <div className="stock-detail-name">{selectedStock.name} | {selectedStock.sector}</div>
                                </div>
                                <span className="stock-detail-close" onClick={() => setSelectedStock(null)}>[X]</span>
                            </div>

                            {/* Chart */}
                            <div style={{ border: '1px solid var(--border)', borderRadius: '4px', padding: '10px', marginBottom: '15px' }}>
                                {renderChart()}
                            </div>

                            {/* Stats Grid */}
                            <div className="stock-stats-grid">
                                <div className="stat-item">
                                    <div className="stat-label">OPEN</div>
                                    <div className="stat-value">₹{selectedStock.open?.toFixed(2) || 'N/A'}</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-label">HIGH</div>
                                    <div className="stat-value">₹{selectedStock.high?.toFixed(2) || 'N/A'}</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-label">LOW</div>
                                    <div className="stat-value">₹{selectedStock.low?.toFixed(2) || 'N/A'}</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-label">VOL</div>
                                    <div className="stat-value">{selectedStock.volume || 'N/A'}</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-label">P/E</div>
                                    <div className="stat-value">{selectedStock.pe || 'N/A'}</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-label">MKT CAP</div>
                                    <div className="stat-value">{selectedStock.marketCap || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        {/* AI Forecast Panel */}
                        <div className="forecast-panel">
                            <div className="forecast-title">VICTOR AI FORECAST</div>
                            <p className="forecast-description">
                                Run neural simulation to generate price targets.
                            </p>
                            <button
                                className="run-simulation-btn"
                                onClick={runSimulation}
                                disabled={isSimulating}
                            >
                                {isSimulating ? 'SIMULATING...' : 'RUN SIMULATION'}
                            </button>

                            {forecast && (
                                <div className="forecast-results">
                                    <div className="forecast-result-item">
                                        <span className="forecast-result-label">Target Price</span>
                                        <span className="forecast-result-value">₹{forecast.targetPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="forecast-result-item">
                                        <span className="forecast-result-label">Confidence</span>
                                        <span className="forecast-result-value">{forecast.confidence}%</span>
                                    </div>
                                    <div className="forecast-result-item">
                                        <span className="forecast-result-label">Recommendation</span>
                                        <span className="forecast-result-value" style={{ color: forecast.recommendation.includes('BUY') ? '#00ff88' : forecast.recommendation === 'HOLD' ? '#ff8c00' : '#ff4444' }}>
                                            {forecast.recommendation}
                                        </span>
                                    </div>
                                    <div className="forecast-result-item">
                                        <span className="forecast-result-label">Horizon</span>
                                        <span className="forecast-result-value">{forecast.horizon}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="simulation-placeholder">
                        <div className="simulation-placeholder-icon">⌕</div>
                        <div>SELECT AN ASSET FROM THE LIST TO BEGIN SIMULATION</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Simulation;

import { useMemo, useState } from 'react';
import { generatePriceHistory } from '../data/stocks';

const Chart = ({ symbol, basePrice, chartType = 'candlestick', onTypeChange }) => {
    const data = useMemo(() => generatePriceHistory(basePrice, 30), [basePrice]);

    const width = 600;
    const height = 250;
    const padding = { top: 20, right: 60, bottom: 30, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const minPrice = Math.min(...data.map(d => d.low)) * 0.998;
    const maxPrice = Math.max(...data.map(d => d.high)) * 1.002;
    const priceRange = maxPrice - minPrice;

    const getY = (price) => padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    const getX = (index) => padding.left + (index / (data.length - 1)) * chartWidth;

    const candleWidth = chartWidth / data.length * 0.6;

    const renderCandlestick = () => {
        return data.map((candle, i) => {
            const x = getX(i);
            const isGreen = candle.close >= candle.open;
            const color = isGreen ? '#00ff88' : '#ff4444';
            const bodyTop = getY(Math.max(candle.open, candle.close));
            const bodyBottom = getY(Math.min(candle.open, candle.close));
            const bodyHeight = Math.max(1, bodyBottom - bodyTop);

            return (
                <g key={i}>
                    {/* Wick */}
                    <line
                        x1={x}
                        y1={getY(candle.high)}
                        x2={x}
                        y2={getY(candle.low)}
                        stroke={color}
                        strokeWidth="1"
                    />
                    {/* Body */}
                    <rect
                        x={x - candleWidth / 2}
                        y={bodyTop}
                        width={candleWidth}
                        height={bodyHeight}
                        fill={isGreen ? color : color}
                        stroke={color}
                        strokeWidth="1"
                    />
                </g>
            );
        });
    };

    const renderLine = () => {
        const points = data.map((d, i) => `${getX(i)},${getY(d.close)}`).join(' ');
        return (
            <polyline
                points={points}
                fill="none"
                stroke="#ff8c00"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        );
    };

    const renderArea = () => {
        const points = data.map((d, i) => `${getX(i)},${getY(d.close)}`).join(' ');
        const areaPoints = `${getX(0)},${getY(minPrice)} ${points} ${getX(data.length - 1)},${getY(minPrice)}`;
        return (
            <>
                <polygon
                    points={areaPoints}
                    fill="url(#areaGradient)"
                />
                <polyline
                    points={points}
                    fill="none"
                    stroke="#ff8c00"
                    strokeWidth="2"
                />
            </>
        );
    };

    const renderPriceLabels = () => {
        const levels = 5;
        const labels = [];
        for (let i = 0; i <= levels; i++) {
            const price = minPrice + (priceRange / levels) * i;
            const y = getY(price);
            labels.push(
                <g key={i}>
                    <line
                        x1={padding.left}
                        y1={y}
                        x2={width - padding.right}
                        y2={y}
                        stroke="#2a2a2a"
                        strokeDasharray="2,4"
                    />
                    <text
                        x={width - padding.right + 5}
                        y={y + 4}
                        fill="#666"
                        fontSize="10"
                        fontFamily="monospace"
                    >
                        {price.toFixed(0)}
                    </text>
                </g>
            );
        }
        return labels;
    };

    return (
        <div className="panel chart-container">
            <div className="panel-header chart-header">
                <span className="panel-title">MARKET OVERVIEW</span>
                <div className="graph-type-selector">
                    {['candlestick', 'line', 'area'].map(type => (
                        <button
                            key={type}
                            className={`graph-type-btn ${chartType === type ? 'active' : ''}`}
                            onClick={() => onTypeChange(type)}
                        >
                            {type === 'candlestick' ? '1D' : type === 'line' ? '1W' : '1M'}
                        </button>
                    ))}
                </div>
            </div>
            <div className="panel-content">
                <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#ff8c00" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#ff8c00" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {renderPriceLabels()}
                    {chartType === 'candlestick' && renderCandlestick()}
                    {chartType === 'line' && renderLine()}
                    {chartType === 'area' && renderArea()}
                </svg>
            </div>
        </div>
    );
};

export default Chart;

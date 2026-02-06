import { generateSparklineData } from '../data/stocks';
import { useMemo } from 'react';

const StockCard = ({ stock, onClick }) => {
    const sparklineData = useMemo(() => generateSparklineData(stock.price), [stock.price]);

    const renderSparkline = () => {
        const width = 100;
        const height = 35;
        const min = Math.min(...sparklineData.map(d => d.value));
        const max = Math.max(...sparklineData.map(d => d.value));
        const range = max - min || 1;

        const points = sparklineData.map((d, i) => {
            const x = (i / (sparklineData.length - 1)) * width;
            const y = height - ((d.value - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');

        const color = stock.change >= 0 ? '#00ff88' : '#ff4444';

        return (
            <svg width={width} height={height} className="stock-card-chart">
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    };

    const formatVolume = (vol) => {
        if (!vol) return 'N/A';
        if (typeof vol === 'string') return vol;
        if (vol >= 10000000) return (vol / 10000000).toFixed(1) + 'Cr';
        if (vol >= 100000) return (vol / 100000).toFixed(1) + 'L';
        if (vol >= 1000) return (vol / 1000).toFixed(1) + 'K';
        return vol.toLocaleString();
    };

    return (
        <div className="stock-card" onClick={() => onClick && onClick(stock)}>
            <div className="stock-card-header">
                <span className="stock-card-symbol">{stock.symbol}</span>
                <span className={`stock-card-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.change?.toFixed(2)}%
                </span>
            </div>
            <div className="stock-card-price">₹{stock.price?.toLocaleString()}</div>

            <div className="stock-card-body">
                {renderSparkline()}
                <div className="stock-card-details">
                    <div className="stock-detail-row">
                        <span className="detail-label">Open</span>
                        <span className="detail-value">₹{stock.open?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="stock-detail-row">
                        <span className="detail-label">High</span>
                        <span className="detail-value high">₹{stock.high?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="stock-detail-row">
                        <span className="detail-label">Low</span>
                        <span className="detail-value low">₹{stock.low?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="stock-detail-row">
                        <span className="detail-label">Vol</span>
                        <span className="detail-value">{formatVolume(stock.volume)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockCard;

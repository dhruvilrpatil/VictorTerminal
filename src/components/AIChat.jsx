import { useState, useRef, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

const AIChat = () => {
    const [messages, setMessages] = useState([
        { time: new Date().toTimeString().slice(0, 8), text: 'VICTOR AI READY. Ask about any stock - analysis, predictions, comparisons, or market insights.', type: 'system' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const now = new Date();
        const time = now.toTimeString().slice(0, 8);
        const userQuery = input.trim();

        // Add user message
        setMessages(prev => [...prev, { time, text: userQuery, type: 'user' }]);
        setInput('');
        setLoading(true);

        try {
            // Check if query is about a specific stock
            const stockMatch = userQuery.match(/([A-Z]{2,})/i);
            let symbol = stockMatch ? stockMatch[1].toUpperCase() : null;

            // Common stock name mappings
            const stockMappings = {
                'RELIANCE': 'RELIANCE.NS',
                'TCS': 'TCS.NS',
                'INFY': 'INFY.NS',
                'INFOSYS': 'INFY.NS',
                'HDFC': 'HDFCBANK.NS',
                'HDFCBANK': 'HDFCBANK.NS',
                'ICICI': 'ICICIBANK.NS',
                'SBI': 'SBIN.NS',
                'SBIN': 'SBIN.NS',
                'TATA': 'TATAMOTORS.NS',
                'WIPRO': 'WIPRO.NS',
                'ITC': 'ITC.NS',
                'BHARTI': 'BHARTIARTL.NS',
                'AIRTEL': 'BHARTIARTL.NS',
            };

            if (symbol && stockMappings[symbol]) {
                symbol = stockMappings[symbol];
            } else if (symbol && !symbol.endsWith('.NS')) {
                symbol = `${symbol}.NS`;
            }

            // Call AI prediction endpoint
            const response = await fetch(`${API_BASE}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: symbol || 'RELIANCE.NS',
                    query: userQuery
                })
            });

            const data = await response.json();
            const responseTime = new Date().toTimeString().slice(0, 8);

            if (data.success) {
                // Format AI response
                const aiResponse = `
📊 ${data.symbol.replace('.NS', '')} ANALYSIS

💰 Current: ₹${data.currentPrice?.toLocaleString() || 'N/A'}
🎯 Target (7d): ₹${data.targetPrice?.toLocaleString() || 'N/A'}
📈 Confidence: ${data.confidence}%
⚡ Signal: ${data.recommendation}

${data.reasoning}`;

                setMessages(prev => [...prev, {
                    time: responseTime,
                    text: aiResponse.trim(),
                    type: 'ai',
                    recommendation: data.recommendation
                }]);
            } else {
                // Try general response
                const generalResponses = [
                    "Analysis stockname"
                ];

                setMessages(prev => [...prev, {
                    time: responseTime,
                    text: data.error || generalResponses[Math.floor(Math.random() * generalResponses.length)],
                    type: 'ai'
                }]);
            }
        } catch (error) {
            const errorTime = new Date().toTimeString().slice(0, 8);
            setMessages(prev => [...prev, {
                time: errorTime,
                text: 'Connection error. Please ensure the API server is running.',
                type: 'error'
            }]);
        }

        setLoading(false);
    };



    return (
        <div className="panel ai-chat">
            <div className="ai-chat-header">
                <span className="ai-chat-title">AI ANALYST</span>
                <span className="ai-live-badge">
                    <span className={`status-dot ${loading ? 'processing' : ''}`}></span>
                    {loading ? 'THINKING' : 'READY'}
                </span>
            </div>



            <div className="ai-chat-messages">
                {messages.map((msg, i) => (
                    <div key={i} className={`ai-message ${msg.type}`}>
                        <span className="ai-message-time">[{msg.time}]</span>
                        <span className={`ai-message-text ${msg.recommendation ? `rec-${msg.recommendation.toLowerCase().replace(' ', '-')}` : ''}`}>
                            {msg.type === 'user' ? `> ${msg.text}` : msg.text}
                        </span>
                    </div>
                ))}
                {loading && (
                    <div className="ai-message thinking">
                        <span className="ai-message-time">[...]</span>
                        <span className="ai-message-text">Analyzing with Gemini AI...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="ai-chat-input">
                <span>&gt;</span>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about any stock (e.g., 'Analyze RELIANCE')..."
                    disabled={loading}
                />
                <button type="submit" disabled={loading} className="send-btn">
                    {loading ? '...' : '→'}
                </button>
            </form>
        </div>
    );
};

export default AIChat;

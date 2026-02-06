import { useState, useEffect } from 'react';
import { terminalAlerts, aiResponses } from '../data/stocks';

const Terminal = () => {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([
        { time: '22:35:20', text: aiResponses[0] }
    ]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        const now = new Date();
        const timeStr = now.toTimeString().slice(0, 8);

        setMessages(prev => [...prev, { time: timeStr, text: `> ${query}` }]);

        // Simulate AI response
        setTimeout(() => {
            const responseTime = new Date().toTimeString().slice(0, 8);
            const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
            setMessages(prev => [...prev, { time: responseTime, text: randomResponse }]);
        }, 500);

        setQuery('');
    };

    return (
        <div className="terminal-container">
            <div className="terminal-alert">
                <div className="terminal-alert-header">
                    VICTOR ALERT: **Terminal.ID: {terminalAlerts[0].id}** **Status: {terminalAlerts[0].status}**
                </div>
                <div>{terminalAlerts[0].message}</div>
            </div>
            <form onSubmit={handleSubmit} className="terminal-input-line">
                <span className="terminal-prompt">&gt;</span>
                <input
                    type="text"
                    className="terminal-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ENTER QUERY..."
                />
            </form>
        </div>
    );
};

export default Terminal;

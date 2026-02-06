import { useState, useEffect } from 'react';

const Config = ({ shortcuts, setShortcuts, availableActions }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newShortcut, setNewShortcut] = useState({
        actionId: availableActions[0]?.id || '',
        key: '',
        altKey: false,
        ctrlKey: false,
        shiftKey: false
    });
    const [recording, setRecording] = useState(false);

    const formatKey = (s) => {
        const parts = [];
        if (s.ctrlKey) parts.push('Ctrl');
        if (s.altKey) parts.push('Alt');
        if (s.shiftKey) parts.push('Shift');
        parts.push(s.key.toUpperCase());
        return parts.join('+');
    };

    const handleKeyDown = (e) => {
        if (!recording) return;
        e.preventDefault();

        // Ignore modifier-only keydowns
        if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

        setNewShortcut(prev => ({
            ...prev,
            key: e.key,
            altKey: e.altKey,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey
        }));
        setRecording(false);
    };

    const handleAdd = () => {
        if (!newShortcut.key) return;

        // Remove any existing shortcut with same key combo to prevent conflicts
        const filtered = shortcuts.filter(s =>
            !(s.key.toLowerCase() === newShortcut.key.toLowerCase() &&
                s.altKey === newShortcut.altKey &&
                s.ctrlKey === newShortcut.ctrlKey &&
                s.shiftKey === newShortcut.shiftKey)
        );

        setShortcuts([...filtered, { ...newShortcut, id: Date.now().toString() }]);
        setIsAdding(false);
        setNewShortcut({
            actionId: availableActions[0].id,
            key: '',
            altKey: false,
            ctrlKey: false,
            shiftKey: false
        });
    };

    const handleDelete = (id) => {
        setShortcuts(shortcuts.filter(s => s.id !== id));
    };

    const getActionLabel = (id) => {
        return availableActions.find(a => a.id === id)?.label || id;
    };

    const systemStatus = [
        { label: 'API Latency', value: '24ms' },
        { label: 'Data Stream', value: 'Active', isActive: true },
        { label: 'Memory Usage', value: '142MB' },
    ];

    return (
        <div>
            <h1 className="view-title">SYSTEM CONFIGURATION</h1>

            <div className="config-layout">
                {/* Keyboard Shortcuts */}
                <div className="config-section">
                    <div className="config-section-header">
                        <div className="config-section-title">■ KEYBOARD SHORTCUTS</div>
                        <button
                            className="add-shortcut-btn"
                            onClick={() => setIsAdding(!isAdding)}
                        >
                            {isAdding ? 'CANCEL' : '+ ADD SHORTCUT'}
                        </button>
                    </div>

                    {isAdding && (
                        <div className="add-shortcut-form">
                            <div className="form-group">
                                <label>ACTION:</label>
                                <select
                                    value={newShortcut.actionId}
                                    onChange={e => setNewShortcut({ ...newShortcut, actionId: e.target.value })}
                                >
                                    {availableActions.map(action => (
                                        <option key={action.id} value={action.id}>
                                            {action.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>KEY:</label>
                                <div
                                    className={`key-recorder ${recording ? 'recording' : ''}`}
                                    onClick={() => setRecording(true)}
                                    tabIndex={0}
                                    onKeyDown={handleKeyDown}
                                >
                                    {newShortcut.key ? formatKey(newShortcut) : (recording ? 'PRESS KEYS...' : 'CLICK TO RECORD')}
                                </div>
                            </div>
                            <button className="save-btn" onClick={handleAdd} disabled={!newShortcut.key}>
                                SAVE
                            </button>
                        </div>
                    )}

                    <div className="shortcuts-list">
                        {shortcuts.map((shortcut) => (
                            <div key={shortcut.id} className="shortcut-item">
                                <span className="shortcut-label">{getActionLabel(shortcut.actionId)}</span>
                                <div className="shortcut-controls">
                                    <span className="shortcut-key">{formatKey(shortcut)}</span>
                                    <button
                                        className="delete-shortcut-btn"
                                        onClick={() => handleDelete(shortcut.id)}
                                        title="Remove Shortcut"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="shortcut-hint">
                        Use shortcuts to quickly navigate and control the terminal.
                    </div>
                </div>

                {/* About */}
                <div className="config-section config-about">
                    <h3>ABOUT VICTOR TERMINAL</h3>
                    <p>
                        Victor Terminal is a high-performance market simulation and analysis tool designed for professional traders.
                    </p>
                    <div className="config-version">
                        Version: 2.5.0 (Build 2024.10.15)
                    </div>
                    <div className="config-status">
                        Connection Status: ENCRYPTED / LOW LATENCY
                    </div>

                    <div className="config-section-title" style={{ marginTop: '20px' }}>SYSTEM STATUS</div>
                    {systemStatus.map((item, i) => (
                        <div key={i} className="system-status-item">
                            <span className="system-status-label">{item.label}</span>
                            <span className={`system-status-value ${item.isActive ? 'active' : ''}`}>
                                {item.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Config;

import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import StockTicker from './components/StockTicker';
import GlobalSearch from './components/GlobalSearch';
import StockModal from './components/StockModal';
import Dashboard from './views/Dashboard';
import Portfolio from './views/Portfolio';
import AllStocks from './views/AllStocks';
import Config from './views/Config';
import { DEFAULT_SHORTCUTS, AVAILABLE_ACTIONS } from './data/settings';
import './index.css';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedStock, setSelectedStock] = useState(null);
  const [shortcuts, setShortcuts] = useState(() => {
    const saved = localStorage.getItem('userShortcuts');
    return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
  });

  // Save shortcuts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userShortcuts', JSON.stringify(shortcuts));
  }, [shortcuts]);

  // Handle Actions
  const handleAction = useCallback((actionId) => {
    const action = AVAILABLE_ACTIONS.find(a => a.id === actionId);
    if (!action) return;

    if (action.type === 'navigation') {
      setActiveView(action.view);
    } else if (action.id === 'OPEN_SEARCH') {
      // Focus global search input
      const searchInput = document.querySelector('.global-search-input input');
      if (searchInput) {
        searchInput.focus();
        // Discard the key event that triggered this to prevent typing it into the search box
        searchInput.value = '';
      }
    }
  }, []);

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input (except for specific overrides if needed)
      // but usually we want global shortcuts to work (like Ctrl+K) even if focused, 
      // UNLESS it conflicts with typing. 
      // For now, let's allow it but be careful with simple keys.

      const matchedShortcut = shortcuts.find(s => {
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
        const altMatch = !!s.altKey === e.altKey;
        const ctrlMatch = !!s.ctrlKey === e.ctrlKey;
        const shiftMatch = !!s.shiftKey === e.shiftKey;
        return keyMatch && altMatch && ctrlMatch && shiftMatch;
      });

      if (matchedShortcut) {
        e.preventDefault();
        handleAction(matchedShortcut.actionId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, handleAction]);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'portfolio':
        return <Portfolio />;
      case 'stocks':
        return <AllStocks />;
      case 'config':
        return <Config
          shortcuts={shortcuts}
          setShortcuts={setShortcuts}
          availableActions={AVAILABLE_ACTIONS}
        />;
      default:
        return <Dashboard />;
    }
  };

  const getDate = () => {
    const now = new Date();
    return `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
  };

  const handleSearchSelect = (stock) => {
    setSelectedStock(stock);
  };

  return (
    <div className="app-container">
      {/* Header Bar */}
      <header className="header-bar">
        <div className="logo">
          <span className="logo-icon">▷</span>
          <span className="logo-text">VICTOR TERMINAL</span>
        </div>
        <GlobalSearch onSelectStock={handleSearchSelect} />
        <div className="header-right">
          <div className="status-dot"></div>
          <span>CONN</span>
          <span>{getDate()}</span>
        </div>
      </header>

      {/* Stock Ticker */}
      <StockTicker />

      {/* Main Layout */}
      <div className="main-layout">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="content-area">
          {renderView()}
        </main>
      </div>

      {/* Stock Modal from Search */}
      {selectedStock && (
        <StockModal
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}

      {/* Global Footer - Hidden on Dashboard */}
      {activeView !== 'dashboard' && (
        <footer className="app-footer">
          @ubrivant
        </footer>
      )}
    </div>
  );
}

export default App;


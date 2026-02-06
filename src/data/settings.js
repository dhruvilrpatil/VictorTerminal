export const AVAILABLE_ACTIONS = [
    { id: 'NAV_DASHBOARD', label: 'Go to Dashboard', type: 'navigation', view: 'dashboard' },
    { id: 'NAV_PORTFOLIO', label: 'Go to Portfolio', type: 'navigation', view: 'portfolio' },
    { id: 'NAV_STOCKS', label: 'Go to All Stocks', type: 'navigation', view: 'stocks' },
    { id: 'NAV_CONFIG', label: 'Go to Configuration', type: 'navigation', view: 'config' },
    { id: 'OPEN_SEARCH', label: 'Open Global Search', type: 'action' },
];

export const DEFAULT_SHORTCUTS = [
    { id: '1', actionId: 'NAV_DASHBOARD', key: '1', altKey: true, ctrlKey: false, shiftKey: false },
    { id: '2', actionId: 'NAV_PORTFOLIO', key: '2', altKey: true, ctrlKey: false, shiftKey: false },
    { id: '3', actionId: 'NAV_STOCKS', key: '3', altKey: true, ctrlKey: false, shiftKey: false },
    { id: '4', actionId: 'NAV_CONFIG', key: '4', altKey: true, ctrlKey: false, shiftKey: false },
];

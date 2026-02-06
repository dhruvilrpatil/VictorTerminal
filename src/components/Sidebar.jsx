const Sidebar = ({ activeView, onViewChange }) => {
    const navItems = [
        { id: 'dashboard', icon: '⊞', title: 'Dashboard' },
        { id: 'portfolio', icon: '☰', title: 'Portfolio' },
        { id: 'stocks', icon: '⊕', title: 'All Stocks' },
        { id: 'config', icon: '⚙', title: 'Settings' },
    ];

    return (
        <nav className="sidebar">
            {navItems.map((item, index) => (
                <div key={item.id}>
                    <button
                        className={`sidebar-icon ${activeView === item.id ? 'active' : ''}`}
                        onClick={() => onViewChange(item.id)}
                        title={`${item.title} (Alt+${index + 1})`}
                    >
                        <span className="sidebar-icon-inner">{item.icon}</span>
                    </button>
                    {index === 0 && <div className="sidebar-divider" />}
                </div>
            ))}
        </nav>
    );
};

export default Sidebar;

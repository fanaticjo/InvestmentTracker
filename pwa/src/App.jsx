import { useState, useEffect } from 'react';
import AddExpense from './components/AddExpense';
import AddStock from './components/AddStock';
import Dashboard from './components/Dashboard';
import { syncOfflineQueue, getOfflineQueue } from './api';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('expense');
  const [toast, setToast] = useState(null);
  const [offlineCount, setOfflineCount] = useState(0);

  useEffect(() => {
    setOfflineCount(getOfflineQueue().length);

    // Sync offline queue when back online
    const handleOnline = async () => {
      const queue = getOfflineQueue();
      if (queue.length > 0) {
        const result = await syncOfflineQueue();
        if (result.synced > 0) {
          showToast(`✅ Synced ${result.synced} offline entries`);
          setOfflineCount(0);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'expense':
        return <AddExpense onSuccess={showToast} onOfflineChange={setOfflineCount} />;
      case 'stock':
        return <AddStock onSuccess={showToast} />;
      case 'dashboard':
        return <Dashboard />;
      default:
        return <AddExpense onSuccess={showToast} onOfflineChange={setOfflineCount} />;
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1>💰 Tracker</h1>
        {offlineCount > 0 && (
          <span className="offline-badge">{offlineCount} queued</span>
        )}
        {!navigator.onLine && <span className="offline-indicator">Offline</span>}
      </header>

      {/* Content */}
      <main className="app-content">
        {renderTab()}
      </main>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button
          className={`nav-btn ${activeTab === 'expense' ? 'active' : ''}`}
          onClick={() => setActiveTab('expense')}
        >
          <span className="nav-icon">💸</span>
          <span className="nav-label">Expense</span>
        </button>
        <button
          className={`nav-btn ${activeTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock')}
        >
          <span className="nav-icon">📈</span>
          <span className="nav-label">Stock/SIP</span>
        </button>
        <button
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Dashboard</span>
        </button>
      </nav>
    </div>
  );
}

export default App;

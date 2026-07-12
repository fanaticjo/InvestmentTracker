import { useState, useEffect } from 'react';
import { getSummary, getStocks, getSIPs } from '../api';

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [stocks, setStocks] = useState(null);
  const [sips, setSips] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('today');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryData, stockData, sipData] = await Promise.all([
        getSummary().catch(() => null),
        getStocks().catch(() => null),
        getSIPs().catch(() => null)
      ]);
      setSummary(summaryData);
      setStocks(stockData);
      setSips(sipData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      {/* Section tabs */}
      <div className="tab-switch">
        <button
          className={activeSection === 'today' ? 'active' : ''}
          onClick={() => setActiveSection('today')}
        >
          Today
        </button>
        <button
          className={activeSection === 'stocks' ? 'active' : ''}
          onClick={() => setActiveSection('stocks')}
        >
          Stocks
        </button>
        <button
          className={activeSection === 'sips' ? 'active' : ''}
          onClick={() => setActiveSection('sips')}
        >
          SIPs
        </button>
      </div>

      {activeSection === 'today' && <TodayView summary={summary} />}
      {activeSection === 'stocks' && <StocksView stocks={stocks} />}
      {activeSection === 'sips' && <SIPsView sips={sips} />}

      {/* Refresh button */}
      <button
        className="btn-submit"
        onClick={loadData}
        style={{ marginTop: 16, background: '#5f6368' }}
      >
        🔄 Refresh Data
      </button>
    </div>
  );
}

function TodayView({ summary }) {
  if (!summary) {
    return (
      <div className="dashboard-card">
        <p>Unable to load summary. Check API URL in config.</p>
      </div>
    );
  }

  return (
    <>
      {/* Today's total */}
      <div className="dashboard-card">
        <h3>Today's Spending</h3>
        <div className="value">₹{(summary.todayTotal || 0).toLocaleString('en-IN')}</div>
      </div>

      {/* Month total */}
      <div className="dashboard-card">
        <h3>This Month Total</h3>
        <div className="value">₹{(summary.monthTotal || 0).toLocaleString('en-IN')}</div>
      </div>

      {/* Category breakdown */}
      {summary.categoryTotals && Object.keys(summary.categoryTotals).length > 0 && (
        <div className="dashboard-card">
          <h3>Month by Category</h3>
          <ul className="expense-list">
            {Object.entries(summary.categoryTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amount]) => (
                <li key={cat} className="expense-item">
                  <span className="expense-item-cat">{cat}</span>
                  <span className="expense-item-amount">
                    ₹{amount.toLocaleString('en-IN')}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Today's expenses */}
      {summary.todayExpenses && summary.todayExpenses.length > 0 && (
        <div className="dashboard-card">
          <h3>Today's Entries</h3>
          <ul className="expense-list">
            {summary.todayExpenses.map((exp, i) => (
              <li key={i} className="expense-item">
                <div className="expense-item-left">
                  <span className="expense-item-cat">{exp.category}</span>
                  <span className="expense-item-desc">{exp.description}</span>
                </div>
                <span className="expense-item-amount">
                  ₹{exp.amount.toLocaleString('en-IN')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function StocksView({ stocks }) {
  if (!stocks || !stocks.stocks || stocks.stocks.length === 0) {
    return (
      <div className="dashboard-card">
        <p>No stocks in portfolio yet.</p>
      </div>
    );
  }

  const totalInvested = stocks.stocks.reduce((sum, s) => sum + (s.invested || 0), 0);
  const totalCurrent = stocks.stocks.reduce((sum, s) => sum + (s.currentValue || 0), 0);
  const totalPnL = totalCurrent - totalInvested;
  const pnlPct = totalInvested > 0 ? (totalPnL / totalInvested * 100) : 0;

  return (
    <>
      <div className="dashboard-card">
        <h3>Portfolio Value</h3>
        <div className="value">₹{totalCurrent.toLocaleString('en-IN')}</div>
        <div className={`value ${totalPnL >= 0 ? 'profit' : 'loss'}`} style={{ fontSize: 16 }}>
          {totalPnL >= 0 ? '▲' : '▼'} ₹{Math.abs(totalPnL).toLocaleString('en-IN')} ({pnlPct.toFixed(1)}%)
        </div>
      </div>

      <div className="dashboard-card">
        <h3>Holdings</h3>
        <ul className="expense-list">
          {stocks.stocks.filter(s => s.status === 'Holding').map((stock, i) => (
            <li key={i} className="expense-item">
              <div className="expense-item-left">
                <span className="expense-item-cat">{stock.symbol}</span>
                <span className="expense-item-desc">
                  {stock.qty} × ₹{(stock.cmp || 0).toFixed(0)}
                </span>
              </div>
              <span className={`expense-item-amount ${(stock.pnl || 0) >= 0 ? 'profit' : 'loss'}`}
                style={{ color: (stock.pnl || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {(stock.pnlPct || 0).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function SIPsView({ sips }) {
  if (!sips || !sips.sips || sips.sips.length === 0) {
    return (
      <div className="dashboard-card">
        <p>No SIPs added yet.</p>
      </div>
    );
  }

  const totalInvested = sips.sips.reduce((sum, s) => sum + (s.invested || 0), 0);
  const totalCurrent = sips.sips.reduce((sum, s) => sum + (s.currentValue || 0), 0);
  const totalReturns = totalCurrent - totalInvested;
  const monthlyTotal = sips.sips
    .filter(s => s.status === 'Active')
    .reduce((sum, s) => sum + (s.monthlyAmount || 0), 0);

  return (
    <>
      <div className="dashboard-card">
        <h3>SIP Portfolio Value</h3>
        <div className="value">₹{totalCurrent.toLocaleString('en-IN')}</div>
        <div className={`value ${totalReturns >= 0 ? 'profit' : 'loss'}`} style={{ fontSize: 16 }}>
          {totalReturns >= 0 ? '▲' : '▼'} ₹{Math.abs(totalReturns).toLocaleString('en-IN')}
        </div>
      </div>

      <div className="dashboard-card">
        <h3>Monthly SIP Outflow</h3>
        <div className="value">₹{monthlyTotal.toLocaleString('en-IN')}</div>
      </div>

      <div className="dashboard-card">
        <h3>Active SIPs</h3>
        <ul className="expense-list">
          {sips.sips.filter(s => s.status === 'Active').map((sip, i) => (
            <li key={i} className="expense-item">
              <div className="expense-item-left">
                <span className="expense-item-cat">{sip.fundName}</span>
                <span className="expense-item-desc">₹{sip.monthlyAmount}/mo</span>
              </div>
              <span className="expense-item-amount"
                style={{ color: (sip.returnPct || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {(sip.returnPct || 0).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default Dashboard;

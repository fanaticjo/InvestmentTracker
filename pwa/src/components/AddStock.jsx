import { useState } from 'react';
import { addStock, addSIP } from '../api';
import { SECTORS } from '../config';

function AddStock({ onSuccess }) {
  const [mode, setMode] = useState('stock'); // 'stock' or 'sip'

  return (
    <div>
      <div className="tab-switch">
        <button
          className={mode === 'stock' ? 'active' : ''}
          onClick={() => setMode('stock')}
        >
          📈 Stock
        </button>
        <button
          className={mode === 'sip' ? 'active' : ''}
          onClick={() => setMode('sip')}
        >
          🔄 SIP
        </button>
      </div>

      {mode === 'stock' ? (
        <StockForm onSuccess={onSuccess} />
      ) : (
        <SIPForm onSuccess={onSuccess} />
      )}
    </div>
  );
}

function StockForm({ onSuccess }) {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [sector, setSector] = useState('');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!symbol || !qty || !price) {
      onSuccess('Please fill symbol, qty, and price', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await addStock({
        name: name || symbol,
        symbol,
        sector,
        buyDate,
        qty: parseInt(qty),
        price: parseFloat(price),
        notes
      });

      if (result.success) {
        onSuccess(`✅ ${symbol} added to portfolio`, 'success');
        setName(''); setSymbol(''); setQty(''); setPrice(''); setNotes('');
      } else {
        onSuccess(`❌ ${result.error}`, 'error');
      }
    } catch (error) {
      onSuccess(`❌ ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h2 className="form-title">📈 Add Stock</h2>

      <div className="form-group">
        <label className="form-label">NSE Symbol *</label>
        <input
          type="text"
          className="form-input"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="e.g. RELIANCE"
          autoCapitalize="characters"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Stock Name</label>
        <input
          type="text"
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Reliance Industries"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Sector</label>
        <div className="chip-grid">
          {SECTORS.map((s) => (
            <button
              key={s}
              className={`chip ${sector === s ? 'active' : ''}`}
              onClick={() => setSector(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Quantity *</label>
        <input
          type="number"
          className="form-input"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="0"
          inputMode="numeric"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Avg Buy Price (₹) *</label>
        <input
          type="number"
          className="form-input"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Buy Date</label>
        <input
          type="date"
          className="form-input"
          value={buyDate}
          onChange={(e) => setBuyDate(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Notes</label>
        <input
          type="text"
          className="form-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
        />
      </div>

      <button
        className="btn-submit"
        onClick={handleSubmit}
        disabled={loading || !symbol || !qty || !price}
      >
        {loading ? 'Adding...' : 'Add to Portfolio'}
      </button>
    </div>
  );
}

function SIPForm({ onSuccess }) {
  const [fundName, setFundName] = useState('');
  const [amc, setAmc] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [sipDate, setSipDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [totalMonths, setTotalMonths] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!fundName || !monthlyAmount) {
      onSuccess('Please fill fund name and amount', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await addSIP({
        fundName,
        amc,
        monthlyAmount: parseFloat(monthlyAmount),
        sipDate,
        startDate,
        totalMonths: parseInt(totalMonths) || 0,
        units: 0,
        nav: 0
      });

      if (result.success) {
        onSuccess(`✅ SIP ${fundName} added`, 'success');
        setFundName(''); setAmc(''); setMonthlyAmount('');
        setSipDate(''); setStartDate(''); setTotalMonths('');
      } else {
        onSuccess(`❌ ${result.error}`, 'error');
      }
    } catch (error) {
      onSuccess(`❌ ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h2 className="form-title">🔄 Add SIP</h2>

      <div className="form-group">
        <label className="form-label">Fund Name *</label>
        <input
          type="text"
          className="form-input"
          value={fundName}
          onChange={(e) => setFundName(e.target.value)}
          placeholder="e.g. Nifty 50 Index Fund"
        />
      </div>

      <div className="form-group">
        <label className="form-label">AMC</label>
        <input
          type="text"
          className="form-input"
          value={amc}
          onChange={(e) => setAmc(e.target.value)}
          placeholder="e.g. UTI, HDFC, SBI"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Monthly Amount (₹) *</label>
        <input
          type="number"
          className="form-input"
          value={monthlyAmount}
          onChange={(e) => setMonthlyAmount(e.target.value)}
          placeholder="5000"
          inputMode="numeric"
        />
      </div>

      <div className="form-group">
        <label className="form-label">SIP Date (1-28)</label>
        <input
          type="number"
          className="form-input"
          value={sipDate}
          onChange={(e) => setSipDate(e.target.value)}
          placeholder="5"
          min="1"
          max="28"
          inputMode="numeric"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Start Date</label>
        <input
          type="text"
          className="form-input"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="e.g. Jan-2024"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Total Months Invested</label>
        <input
          type="number"
          className="form-input"
          value={totalMonths}
          onChange={(e) => setTotalMonths(e.target.value)}
          placeholder="0"
          inputMode="numeric"
        />
      </div>

      <button
        className="btn-submit"
        onClick={handleSubmit}
        disabled={loading || !fundName || !monthlyAmount}
      >
        {loading ? 'Adding...' : 'Add SIP'}
      </button>
    </div>
  );
}

export default AddStock;

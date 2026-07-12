import { useState } from 'react';
import { addExpense, queueOfflineExpense, getOfflineQueue } from '../api';
import { CATEGORIES, PAYMENT_MODES } from '../config';

function AddExpense({ onSuccess, onOfflineChange }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  const handleSubmit = async () => {
    if (!amount || !category) {
      onSuccess('Please enter amount and category', 'error');
      return;
    }

    setLoading(true);
    try {
      const expense = {
        date,
        category,
        description: description || category,
        paymentMode,
        amount: parseFloat(amount),
        notes
      };

      const result = await addExpense(expense);
      
      if (result.offline) {
        onSuccess(`📱 Saved offline (₹${amount})`, 'success');
        onOfflineChange(getOfflineQueue().length);
      } else if (result.success) {
        onSuccess(`✅ ₹${amount} added to ${category}`, 'success');
      } else {
        onSuccess(`❌ ${result.error}`, 'error');
      }

      // Reset form
      setAmount('');
      setDescription('');
      setNotes('');
      // Keep category and payment mode for quick re-entry
    } catch (error) {
      onSuccess(`❌ ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h2 className="form-title">➕ Add Expense</h2>

      {/* Amount - Big and prominent */}
      <div className="form-group">
        <label className="form-label">Amount (₹)</label>
        <input
          type="number"
          className="form-input amount-input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          inputMode="decimal"
          autoFocus
        />
        <div className="quick-amounts">
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              className="quick-amount-btn"
              onClick={() => setAmount(String(amt))}
            >
              ₹{amt}
            </button>
          ))}
        </div>
      </div>

      {/* Category Chips */}
      <div className="form-group">
        <label className="form-label">Category</label>
        <div className="chip-grid">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`chip ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="form-label">Description</label>
        <input
          type="text"
          className="form-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What did you spend on?"
        />
      </div>

      {/* Payment Mode Chips */}
      <div className="form-group">
        <label className="form-label">Payment Mode</label>
        <div className="chip-grid">
          {PAYMENT_MODES.map((mode) => (
            <button
              key={mode}
              className={`chip ${paymentMode === mode ? 'active' : ''}`}
              onClick={() => setPaymentMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div className="form-group">
        <label className="form-label">Date</label>
        <input
          type="date"
          className="form-input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* Notes */}
      <div className="form-group">
        <label className="form-label">Notes (optional)</label>
        <input
          type="text"
          className="form-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any extra details"
        />
      </div>

      {/* Submit */}
      <button
        className="btn-submit"
        onClick={handleSubmit}
        disabled={loading || !amount || !category}
      >
        {loading ? 'Adding...' : `Add ₹${amount || '0'} Expense`}
      </button>
    </div>
  );
}

export default AddExpense;

# Functional Requirements

## FR-1: Daily Expense Tracking

### FR-1.1: Add Expense
- User can add an expense with: date, category, description, payment mode, amount, notes
- Categories: Food, Transport, Shopping, Bills, Entertainment, Health, Education, Subscriptions, Groceries, Rent, EMI, Gifts, Miscellaneous
- Payment modes: UPI, Cash, Credit Card, Debit Card, Net Banking, Wallet
- Quick amount buttons: ₹50, ₹100, ₹200, ₹500, ₹1000, ₹2000
- Date defaults to today
- Category and payment mode selectable via chip/pill UI

### FR-1.2: Expense Storage
- Expenses stored in "Daily Expenses" sheet tab
- Each row: Date, Category, Description, Payment Mode, Amount, Notes, Month-Year (auto)
- Data validation on Category and Payment Mode columns (dropdown)
- Auto-generated Month-Year helper column for summary calculations

### FR-1.3: Expense Dashboard
- Today's total spending
- This month's total spending
- Category-wise breakdown for current month
- Today's individual entries list
- Last 7 days daily spend trend
- Payment mode split for today

---

## FR-2: SIP (Mutual Fund) Tracking

### FR-2.1: Add SIP
- Fields: Fund Name, AMC, Folio No., SIP Date (1-28), Monthly Amount, Start Date, Total Months, Units Accumulated, Current NAV
- Status: Active, Paused, Stopped, Completed

### FR-2.2: Auto-calculations
- Current Value = Units × NAV
- Total Invested = Monthly Amount × Total Months
- Returns = Current Value - Total Invested
- Return % = (Returns / Total Invested) × 100

### FR-2.3: SIP Summary
- Total row showing aggregate of all active SIPs
- Conditional formatting: green for profit, red for loss

---

## FR-3: Stock Portfolio Tracking

### FR-3.1: Add Stock
- Fields: Stock Name, NSE Symbol, Sector, Buy Date, Quantity, Avg Buy Price, Notes
- Sectors: IT, Banking, FMCG, Pharma, Auto, Energy, Metals, Infra, Realty, Telecom, Chemical, Other
- Status: Holding, Sold, Partial Exit, Watchlist

### FR-3.2: Auto-calculations
- Invested = Qty × Avg Buy Price
- CMP (Current Market Price) = GOOGLEFINANCE("NSE:" + symbol, "price") — auto-updates
- Current Value = Qty × CMP
- P&L = Current Value - Invested
- P&L % = (P&L / Invested) × 100
- Day Change % = GOOGLEFINANCE("NSE:" + symbol, "changepct")

### FR-3.3: Portfolio Summary
- Portfolio total row with aggregate invested, current value, P&L
- Conditional formatting: green for profit, red for loss

---

## FR-4: Monthly Summary Dashboard

### FR-4.1: Monthly Income & Expenses
- 12-month view (Jan-Dec for current year)
- Columns: Month, Income (manual), Total Expenses (auto from Daily Expenses), SIP Investment, Stock Buy, Total Investment, Net Savings, Savings Rate %
- Yearly total row

### FR-4.2: Net Worth Snapshot
- Asset types: SIP/Mutual Funds (auto), Stocks (auto), Bank Balance (manual), Fixed Deposits (manual), Other Assets (manual)
- Total Net Worth calculation
- Percentage allocation per asset type

### FR-4.3: Expense Category Breakdown
- Current month spend by category (auto-calculated)
- Percentage of total per category

---

## FR-5: Budget Management

### FR-5.1: Category Budgets
- Configurable monthly budget per category
- Default budgets provided, user can override
- Status indicators: 🟢 OK (<80%), 🟡 Warning (80-100%), 🔴 Over Budget (>100%)

### FR-5.2: Budget Alerts
- Automated budget check (can run on 25th of each month via trigger)
- Alert showing over-budget and warning categories

---

## FR-6: Google Sheets Integration

### FR-6.1: Sheet Tabs
- Daily Expenses
- SIP Tracker
- Stock Portfolio
- Monthly Summary
- Daily Dashboard

### FR-6.2: Sheet Features
- Data validation dropdowns for categories/status
- Conditional formatting (profit=green, loss=red, savings rate)
- Frozen header rows
- Auto-fill formulas via onEdit trigger
- Custom menu "💰 Finance Tracker" with quick actions

### FR-6.3: Quick-Add Dialogs (Sheet)
- Add Expense dialog (HTML popup in Sheets)
- Add Stock dialog (HTML popup in Sheets)

---

## FR-7: Utility Functions

### FR-7.1: Duplicate Detection
- Highlight potential duplicate expenses (same date, category, amount)

### FR-7.2: Data Export
- Export current month expenses as CSV (viewable in dialog)

### FR-7.3: Monthly Report
- Category-wise spending report as alert dialog

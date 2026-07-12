# 💰 Investment & Expense Tracker

A Google Apps Script-based personal finance tracker that runs inside Google Sheets.

## Features

- **Daily Expenses** — Track daily spending with category dropdowns, payment modes, and quick-add dialog
- **SIP Tracker** — Monitor mutual fund SIPs with auto-calculated returns and P&L
- **Stock Portfolio** — Live stock prices via `GOOGLEFINANCE()`, auto P&L calculations
- **Monthly Summary** — Income vs expenses, net worth snapshot, category breakdown
- **Daily Dashboard** — Today's spend, 7-day trend, budget vs actual with 🟢/🟡/🔴 status
- **Budget Alerts** — Customizable per-category monthly budgets with overspend warnings
- **Quick-Add Dialogs** — Add expenses and stocks via popup forms from the menu

## Setup

1. Open your Google Sheet
2. Go to **Extensions → Apps Script**
3. Delete the default `Code.gs` content
4. Copy-paste all `.gs` files into the editor (create separate files using `+` or paste all into one)
5. Run `setupAll` from the function dropdown
6. Grant permissions when prompted
7. Use the **"💰 Finance Tracker"** menu that appears in your sheet

## File Structure

| File | Purpose |
|------|---------|
| `01_Main.gs` | Config, custom menu, setup orchestrator, help dialog |
| `02_DailyExpenses.gs` | Expense sheet setup + quick-add expense dialog |
| `03_SIPTracker.gs` | Mutual fund SIP tracking with auto-calculations |
| `04_StockPortfolio.gs` | Stock portfolio with GOOGLEFINANCE live prices |
| `05_MonthlySummary.gs` | Dashboard: income/expenses, net worth, category breakdown |
| `06_Utilities.gs` | onEdit triggers, budget alerts, duplicate detection, data export |
| `07_DailyDashboard.gs` | Daily expense dashboard with category budgets and trends |

## Daily Workflow

- **Every day:** Add expenses via menu (💰 → Quick Add → Add Expense) or directly in the sheet
- **SIP date:** Update units & NAV in "SIP Tracker" tab
- **Buy/Sell stocks:** Add via menu or directly in "Stock Portfolio" tab
- **Month end:** Enter income in Monthly Summary, everything else auto-calculates

## Customization

- **Categories:** Edit `CONFIG.categories` in `01_Main.gs`
- **Payment modes:** Edit `CONFIG.paymentModes` in `01_Main.gs`
- **Budgets:** Edit `getDefaultBudget()` in `07_DailyDashboard.gs` or the Budget column directly
- **Budget alerts:** Edit the `budgets` object in `checkBudget()` in `06_Utilities.gs`

## License

MIT

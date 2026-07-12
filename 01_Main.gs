/**
 * =====================================================
 * FINANCIAL TRACKER - Main Setup
 * =====================================================
 * Author: Auto-generated
 * Version: 1.0
 * 
 * HOW TO USE:
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Create separate .gs files for each section
 *    (or paste everything into one file)
 * 4. Run 'setupAll' function once
 * 5. Use the custom "💰 Finance Tracker" menu
 * =====================================================
 */

// ===== CONFIGURATION =====
const CONFIG = {
  currency: '₹',
  dateFormat: 'dd-MMM-yyyy',
  sheets: {
    expenses: 'Daily Expenses',
    sip: 'SIP Tracker',
    stocks: 'Stock Portfolio',
    summary: 'Monthly Summary',
    dailyDashboard: 'Daily Dashboard'
  },
  colors: {
    headerBg: '#1a73e8',
    headerFont: '#ffffff',
    profit: '#34a853',
    loss: '#ea4335',
    neutral: '#fbbc04',
    lightBg: '#f8f9fa',
    sectionBg: '#e8f0fe'
  },
  categories: [
    'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment',
    'Health', 'Education', 'Subscriptions', 'Groceries',
    'Rent', 'EMI', 'Gifts', 'Miscellaneous'
  ],
  paymentModes: ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet']
};

// ===== MENU SETUP =====
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('💰 Finance Tracker')
    .addItem('📊 Setup All Sheets', 'setupAll')
    .addSeparator()
    .addSubMenu(ui.createMenu('➕ Quick Add')
      .addItem('Add Expense', 'showExpenseDialog')
      .addItem('Add Stock Transaction', 'showStockDialog'))
    .addSubMenu(ui.createMenu('🔄 Refresh')
      .addItem('Update Monthly Summary', 'updateMonthlySummary')
      .addItem('Refresh Daily Dashboard', 'refreshDailyDashboard')
      .addItem('Refresh Stock Prices (Manual)', 'refreshStockPrices'))
    .addSeparator()
    .addItem('ℹ️ Help & Instructions', 'showHelp')
    .addToUi();
}

// ===== MAIN SETUP =====
function setupAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    'Setup Financial Tracker',
    'This will create/reset all tracker sheets:\n\n' +
    '• Daily Expenses\n• SIP Tracker\n• Stock Portfolio\n• Monthly Summary\n• Daily Dashboard\n\n' +
    'Existing data in these sheets will be CLEARED. Continue?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) return;
  
  setupDailyExpenses(ss);
  setupSIPTracker(ss);
  setupStockPortfolio(ss);
  setupMonthlySummary(ss);
  setupDailyDashboard(ss);
  
  // Remove default Sheet1 if it exists and is empty
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && defaultSheet.getLastRow() <= 1) {
    ss.deleteSheet(defaultSheet);
  }
  
  // Activate expenses sheet (most used)
  ss.getSheetByName(CONFIG.sheets.expenses).activate();
  
  ui.alert('✅ Setup Complete!', 
    'Your Financial Tracker is ready.\n\n' +
    'Use the "💰 Finance Tracker" menu for quick actions.\n' +
    'Start by adding your daily expenses!', 
    ui.ButtonSet.OK);
}

// ===== HELPER: Get or Create Sheet =====
function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (sheet) {
    sheet.clear();
    sheet.clearFormats();
    sheet.clearConditionalFormatRules();
  } else {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

// ===== HELP DIALOG =====
function showHelp() {
  const html = HtmlService.createHtmlOutput(`
    <div style="font-family: Arial, sans-serif; padding: 10px;">
      <h2>💰 Financial Tracker - Help</h2>
      <h3>Daily Workflow:</h3>
      <ul>
        <li><b>Every day:</b> Add expenses in "Daily Expenses" tab</li>
        <li><b>SIP date:</b> Update units & NAV in "SIP Tracker"</li>
        <li><b>Buy/Sell stocks:</b> Update "Stock Portfolio"</li>
        <li><b>Month end:</b> Run "Update Monthly Summary"</li>
      </ul>
      <h3>Tips:</h3>
      <ul>
        <li>Use dropdowns for Category and Payment Mode</li>
        <li>Stock prices can be fetched using GOOGLEFINANCE()</li>
        <li>Monthly Summary auto-calculates from other sheets</li>
      </ul>
      <h3>Need a new feature?</h3>
      <p>Edit the Apps Script code and add your function!</p>
    </div>
  `).setWidth(400).setHeight(350);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Help & Instructions');
}

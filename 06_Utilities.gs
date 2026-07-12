/**
 * =====================================================
 * UTILITY & HELPER FUNCTIONS
 * =====================================================
 * Add new features here! This is your extension point.
 */

// ===== AUTO-FILL FORMULAS ON EDIT =====
/**
 * Trigger: Runs every time you edit a cell
 * Auto-fills formulas in Stock Portfolio and SIP Tracker
 */
function onEdit(e) {
  // Guard: onEdit is triggered automatically by Google Sheets.
  // If run manually from the editor, 'e' will be undefined — just return.
  if (!e || !e.source) return;
  
  const sheet = e.source.getActiveSheet();
  const row = e.range.getRow();
  const col = e.range.getColumn();
  
  // Auto-fill Stock Portfolio formulas when Symbol is entered
  if (sheet.getName() === CONFIG.sheets.stocks && row >= 2 && col === 2) {
    const symbol = e.range.getValue();
    if (symbol) {
      sheet.getRange(row, 7).setFormula(`=IF(E${row}="","",E${row}*F${row})`);
      sheet.getRange(row, 8).setFormula(`=IF(B${row}="","",GOOGLEFINANCE("NSE:"&B${row},"price"))`);
      sheet.getRange(row, 9).setFormula(`=IF(E${row}="","",E${row}*H${row})`);
      sheet.getRange(row, 10).setFormula(`=IF(G${row}="","",I${row}-G${row})`);
      sheet.getRange(row, 11).setFormula(`=IF(G${row}=0,"",J${row}/G${row}*100)`);
      sheet.getRange(row, 12).setFormula(`=IF(B${row}="","",GOOGLEFINANCE("NSE:"&B${row},"changepct"))`);
    }
  }
  
  // Auto-fill SIP Tracker formulas when Units are entered
  if (sheet.getName() === CONFIG.sheets.sip && row >= 2 && (col === 8 || col === 9)) {
    sheet.getRange(row, 10).setFormula(`=IF(H${row}="","",H${row}*I${row})`);
    sheet.getRange(row, 11).setFormula(`=IF(E${row}="","",E${row}*G${row})`);
    sheet.getRange(row, 12).setFormula(`=IF(J${row}="","",J${row}-K${row})`);
    sheet.getRange(row, 13).setFormula(`=IF(K${row}=0,"",L${row}/K${row}*100)`);
  }
  
  // Auto-fill Month-Year helper in Daily Expenses when Date is entered
  if (sheet.getName() === CONFIG.sheets.expenses && row >= 2 && col === 1) {
    if (e.range.getValue()) {
      sheet.getRange(row, 7).setFormula(`=IF(A${row}="","",TEXT(A${row},"MMM-YYYY"))`);
    }
  }
}

// ===== MONTHLY EXPENSE REPORT =====
/**
 * Generates a quick summary of current month expenses by category
 */
function getMonthlyExpenseReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheets.expenses);
  const data = sheet.getDataRange().getValues();
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const categoryTotals = {};
  let totalSpend = 0;
  
  for (let i = 1; i < data.length; i++) {
    const date = new Date(data[i][0]);
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      const category = data[i][1];
      const amount = data[i][4] || 0;
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      totalSpend += amount;
    }
  }
  
  let report = `📊 Expense Report - ${now.toLocaleString('default', {month: 'long', year: 'numeric'})}\n\n`;
  report += `Total Spend: ₹${totalSpend.toLocaleString('en-IN')}\n\n`;
  report += `Category Breakdown:\n`;
  
  Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, amount]) => {
      const pct = ((amount / totalSpend) * 100).toFixed(1);
      report += `  ${cat}: ₹${amount.toLocaleString('en-IN')} (${pct}%)\n`;
    });
  
  SpreadsheetApp.getUi().alert(report);
}

// ===== DUPLICATE ROW PROTECTION =====
/**
 * Highlights potential duplicate expenses (same date, same amount, same category)
 */
function highlightDuplicateExpenses() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheets.expenses);
  const data = sheet.getDataRange().getValues();
  
  const seen = {};
  const duplicateRows = [];
  
  for (let i = 1; i < data.length; i++) {
    const key = `${data[i][0]}_${data[i][1]}_${data[i][4]}`;
    if (seen[key]) {
      duplicateRows.push(i + 1);
      duplicateRows.push(seen[key]);
    } else {
      seen[key] = i + 1;
    }
  }
  
  if (duplicateRows.length === 0) {
    SpreadsheetApp.getUi().alert('No duplicate expenses found! ✅');
    return;
  }
  
  // Highlight duplicates in yellow
  duplicateRows.forEach(row => {
    sheet.getRange(row, 1, 1, 6).setBackground('#fff3cd');
  });
  
  SpreadsheetApp.getUi().alert(
    `⚠️ Found ${duplicateRows.length} potential duplicate rows (highlighted in yellow).\n` +
    `Review and delete if they are actual duplicates.`
  );
}

// ===== DATA EXPORT =====
/**
 * Export current month expenses as a formatted string (for sharing)
 */
function exportMonthlyData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheets.expenses);
  const data = sheet.getDataRange().getValues();
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  let csv = 'Date,Category,Description,Payment Mode,Amount,Notes\n';
  
  for (let i = 1; i < data.length; i++) {
    const date = new Date(data[i][0]);
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      csv += `${data[i][0]},${data[i][1]},${data[i][2]},${data[i][3]},${data[i][4]},${data[i][5]}\n`;
    }
  }
  
  // Show in a dialog (user can copy)
  const html = HtmlService.createHtmlOutput(
    `<textarea style="width:100%;height:300px;font-family:monospace;font-size:11px;">${csv}</textarea>`
  ).setWidth(500).setHeight(350);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Monthly Data Export');
}

// ===== BUDGET ALERTS =====
/**
 * Set monthly budget and get alerts when exceeding
 * Customize the budgets object below
 */
function checkBudget() {
  // ⚡ CUSTOMIZE YOUR BUDGETS HERE
  const budgets = {
    'Food': 8000,
    'Transport': 3000,
    'Shopping': 5000,
    'Entertainment': 2000,
    'Subscriptions': 1500,
    'Groceries': 6000,
    'Total': 40000
  };
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheets.expenses);
  const data = sheet.getDataRange().getValues();
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const categoryTotals = {};
  let totalSpend = 0;
  
  for (let i = 1; i < data.length; i++) {
    const date = new Date(data[i][0]);
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      const category = data[i][1];
      const amount = data[i][4] || 0;
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      totalSpend += amount;
    }
  }
  
  let alerts = [];
  
  Object.entries(budgets).forEach(([category, budget]) => {
    const spent = category === 'Total' ? totalSpend : (categoryTotals[category] || 0);
    const pct = (spent / budget * 100).toFixed(0);
    
    if (spent > budget) {
      alerts.push(`🔴 ${category}: ₹${spent.toLocaleString('en-IN')} / ₹${budget.toLocaleString('en-IN')} (${pct}% - OVER BUDGET!)`);
    } else if (spent > budget * 0.8) {
      alerts.push(`🟡 ${category}: ₹${spent.toLocaleString('en-IN')} / ₹${budget.toLocaleString('en-IN')} (${pct}% - WARNING)`);
    }
  });
  
  if (alerts.length === 0) {
    SpreadsheetApp.getUi().alert('✅ All spending within budget! Keep it up!');
  } else {
    SpreadsheetApp.getUi().alert('⚠️ Budget Alerts:\n\n' + alerts.join('\n'));
  }
}

// ===== INSTALLABLE TRIGGER SETUP =====
/**
 * Run this ONCE to set up automatic triggers
 * (onEdit already works as simple trigger, but this adds time-based ones)
 */
function setupTriggers() {
  // Delete existing triggers to avoid duplicates
  ScriptApp.getProjectTriggers().forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });
  
  // Monthly budget check on the 25th
  ScriptApp.newTrigger('checkBudget')
    .timeBased()
    .onMonthDay(25)
    .atHour(9)
    .create();
  
  SpreadsheetApp.getUi().alert('✅ Triggers set up! Budget check will run on 25th of each month.');
}

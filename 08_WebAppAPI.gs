/**
 * =====================================================
 * WEB APP API - Endpoint for the PWA
 * =====================================================
 * 
 * DEPLOYMENT STEPS:
 * 1. Open your Google Sheet → Extensions → Apps Script
 * 2. Add this file as a new .gs file (e.g., "08_WebAppAPI.gs")
 * 3. Click Deploy → New Deployment
 * 4. Type: Web App
 * 5. Execute as: Me
 * 6. Who has access: Anyone
 * 7. Click Deploy → Copy the URL
 * 8. Paste the URL in the PWA's config (src/config.js)
 * =====================================================
 */

/**
 * Handle GET requests - Read data
 */
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    let result;
    
    switch (action) {
      case 'getExpenses':
        result = getRecentExpenses(e.parameter.days || 7);
        break;
      case 'getSummary':
        result = getDailySummary();
        break;
      case 'getCategories':
        result = { categories: CONFIG.categories, paymentModes: CONFIG.paymentModes };
        break;
      case 'getStocks':
        result = getStockPortfolio();
        break;
      case 'getSIPs':
        result = getSIPData();
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: error.message 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests - Write data
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    let result;
    
    switch (action) {
      case 'addExpense':
        result = addExpenseAPI(data);
        break;
      case 'addStock':
        result = addStockAPI(data);
        break;
      case 'addSIP':
        result = addSIPAPI(data);
        break;
      case 'addMultipleExpenses':
        result = addMultipleExpensesAPI(data.expenses);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: error.message 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== API WRITE FUNCTIONS =====

function addExpenseAPI(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheets.expenses);
  const lastRow = sheet.getLastRow() + 1;
  
  const date = new Date(data.date);
  sheet.getRange(lastRow, 1).setValue(date);
  sheet.getRange(lastRow, 2).setValue(data.category);
  sheet.getRange(lastRow, 3).setValue(data.description);
  sheet.getRange(lastRow, 4).setValue(data.paymentMode);
  sheet.getRange(lastRow, 5).setValue(parseFloat(data.amount));
  sheet.getRange(lastRow, 6).setValue(data.notes || '');
  sheet.getRange(lastRow, 7).setFormula(`=IF(A${lastRow}="","",TEXT(A${lastRow},"MMM-YYYY"))`);
  
  return { 
    success: true, 
    message: `Expense ₹${data.amount} added for ${data.category}`,
    row: lastRow
  };
}

function addMultipleExpensesAPI(expenses) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheets.expenses);
  let lastRow = sheet.getLastRow() + 1;
  let count = 0;
  
  expenses.forEach(data => {
    const date = new Date(data.date);
    sheet.getRange(lastRow, 1).setValue(date);
    sheet.getRange(lastRow, 2).setValue(data.category);
    sheet.getRange(lastRow, 3).setValue(data.description);
    sheet.getRange(lastRow, 4).setValue(data.paymentMode);
    sheet.getRange(lastRow, 5).setValue(parseFloat(data.amount));
    sheet.getRange(lastRow, 6).setValue(data.notes || '');
    sheet.getRange(lastRow, 7).setFormula(`=IF(A${lastRow}="","",TEXT(A${lastRow},"MMM-YYYY"))`);
    lastRow++;
    count++;
  });
  
  return { success: true, message: `${count} expenses synced`, count: count };
}

function addStockAPI(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheets.stocks);
  const lastRow = sheet.getLastRow() + 1;
  
  sheet.getRange(lastRow, 1).setValue(data.name);
  sheet.getRange(lastRow, 2).setValue(data.symbol.toUpperCase());
  sheet.getRange(lastRow, 3).setValue(data.sector || '');
  sheet.getRange(lastRow, 4).setValue(new Date(data.buyDate));
  sheet.getRange(lastRow, 5).setValue(parseInt(data.qty));
  sheet.getRange(lastRow, 6).setValue(parseFloat(data.price));
  sheet.getRange(lastRow, 7).setFormula(`=IF(E${lastRow}="","",E${lastRow}*F${lastRow})`);
  sheet.getRange(lastRow, 8).setFormula(`=IF(B${lastRow}="","",GOOGLEFINANCE("NSE:"&B${lastRow},"price"))`);
  sheet.getRange(lastRow, 9).setFormula(`=IF(E${lastRow}="","",E${lastRow}*H${lastRow})`);
  sheet.getRange(lastRow, 10).setFormula(`=IF(G${lastRow}="","",I${lastRow}-G${lastRow})`);
  sheet.getRange(lastRow, 11).setFormula(`=IF(G${lastRow}=0,"",J${lastRow}/G${lastRow}*100)`);
  sheet.getRange(lastRow, 12).setFormula(`=IF(B${lastRow}="","",GOOGLEFINANCE("NSE:"&B${lastRow},"changepct"))`);
  sheet.getRange(lastRow, 13).setValue('Holding');
  sheet.getRange(lastRow, 14).setValue(data.notes || '');
  
  return { success: true, message: `Stock ${data.symbol} added` };
}

function addSIPAPI(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheets.sip);
  const lastRow = sheet.getLastRow() + 1;
  
  sheet.getRange(lastRow, 1).setValue(data.fundName);
  sheet.getRange(lastRow, 2).setValue(data.amc || '');
  sheet.getRange(lastRow, 3).setValue(data.folio || '');
  sheet.getRange(lastRow, 4).setValue(data.sipDate);
  sheet.getRange(lastRow, 5).setValue(parseFloat(data.monthlyAmount));
  sheet.getRange(lastRow, 6).setValue(data.startDate);
  sheet.getRange(lastRow, 7).setValue(parseInt(data.totalMonths) || 0);
  sheet.getRange(lastRow, 8).setValue(parseFloat(data.units) || 0);
  sheet.getRange(lastRow, 9).setValue(parseFloat(data.nav) || 0);
  sheet.getRange(lastRow, 10).setFormula(`=IF(H${lastRow}="","",H${lastRow}*I${lastRow})`);
  sheet.getRange(lastRow, 11).setFormula(`=IF(E${lastRow}="","",E${lastRow}*G${lastRow})`);
  sheet.getRange(lastRow, 12).setFormula(`=IF(J${lastRow}="","",J${lastRow}-K${lastRow})`);
  sheet.getRange(lastRow, 13).setFormula(`=IF(K${lastRow}=0,"",L${lastRow}/K${lastRow}*100)`);
  sheet.getRange(lastRow, 14).setValue('Active');
  
  return { success: true, message: `SIP ${data.fundName} added` };
}

// ===== API READ FUNCTIONS =====

function getRecentExpenses(days) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheets.expenses);
  const data = sheet.getDataRange().getValues();
  
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - parseInt(days));
  
  const expenses = [];
  for (let i = 1; i < data.length; i++) {
    const date = new Date(data[i][0]);
    if (date >= cutoff) {
      expenses.push({
        date: date.toISOString().split('T')[0],
        category: data[i][1],
        description: data[i][2],
        paymentMode: data[i][3],
        amount: data[i][4],
        notes: data[i][5]
      });
    }
  }
  
  return { expenses: expenses, count: expenses.length };
}

function getDailySummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheets.expenses);
  const data = sheet.getDataRange().getValues();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let todayTotal = 0;
  let monthTotal = 0;
  const categoryTotals = {};
  const todayExpenses = [];
  
  for (let i = 1; i < data.length; i++) {
    const date = new Date(data[i][0]);
    date.setHours(0, 0, 0, 0);
    const amount = data[i][4] || 0;
    
    // This month
    if (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
      monthTotal += amount;
      const cat = data[i][1];
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
    }
    
    // Today
    if (date.getTime() === today.getTime()) {
      todayTotal += amount;
      todayExpenses.push({
        category: data[i][1],
        description: data[i][2],
        amount: amount
      });
    }
  }
  
  return {
    todayTotal: todayTotal,
    monthTotal: monthTotal,
    categoryTotals: categoryTotals,
    todayExpenses: todayExpenses,
    date: today.toISOString().split('T')[0]
  };
}

function getStockPortfolio() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheets.stocks);
  const data = sheet.getDataRange().getValues();
  
  const stocks = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0] !== 'PORTFOLIO TOTAL') {
      stocks.push({
        name: data[i][0],
        symbol: data[i][1],
        sector: data[i][2],
        qty: data[i][4],
        avgPrice: data[i][5],
        invested: data[i][6],
        cmp: data[i][7],
        currentValue: data[i][8],
        pnl: data[i][9],
        pnlPct: data[i][10],
        status: data[i][12]
      });
    }
  }
  
  return { stocks: stocks };
}

function getSIPData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheets.sip);
  const data = sheet.getDataRange().getValues();
  
  const sips = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0] !== 'TOTAL') {
      sips.push({
        fundName: data[i][0],
        amc: data[i][1],
        monthlyAmount: data[i][4],
        currentValue: data[i][9],
        invested: data[i][10],
        returns: data[i][11],
        returnPct: data[i][12],
        status: data[i][13]
      });
    }
  }
  
  return { sips: sips };
}

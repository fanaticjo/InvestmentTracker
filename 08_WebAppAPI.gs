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

// ===== AUTH CONFIG =====
const ALLOWED_EMAILS = [
  'mohapatrabiswajit744@gmail.com'
  // Add more emails here if you want to share access
];

/**
 * Verify the Google ID token and check if user is allowed
 */
function verifyAuth(token) {
  if (!token) {
    return { authorized: false, error: 'No auth token provided' };
  }
  
  try {
    const tokenInfo = UrlFetchApp.fetch(
      'https://oauth2.googleapis.com/tokeninfo?id_token=' + token
    );
    const payload = JSON.parse(tokenInfo.getContentText());
    
    if (!payload.email) {
      return { authorized: false, error: 'Invalid token - no email' };
    }
    
    if (!ALLOWED_EMAILS.includes(payload.email.toLowerCase())) {
      return { authorized: false, error: 'Unauthorized email: ' + payload.email };
    }
    
    return { authorized: true, email: payload.email };
  } catch (e) {
    return { authorized: false, error: 'Token verification failed: ' + e.message };
  }
}

/**
 * Handle GET requests - Read and Write data
 */
function doGet(e) {
  const action = e.parameter.action;
  const token = e.parameter.token;
  
  // Verify auth
  const auth = verifyAuth(token);
  if (!auth.authorized) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: 'Unauthorized', 
      details: auth.error 
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  try {
    let result;
    
    // Check if this is a write operation (has data param)
    if (e.parameter.data) {
      const data = JSON.parse(e.parameter.data);
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
          result = { error: 'Unknown write action: ' + action };
      }
    } else {
      // Read operations
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
    const token = data.token;
    
    // Verify auth
    const auth = verifyAuth(token);
    if (!auth.authorized) {
      return ContentService.createTextOutput(JSON.stringify({ 
        error: 'Unauthorized', 
        details: auth.error 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
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
  
  // Find first empty row (skip header at row 1)
  const colA = sheet.getRange('A2:A').getValues();
  let insertRow = 2;
  for (let i = 0; i < colA.length; i++) {
    if (colA[i][0] === '' || colA[i][0] === null) {
      insertRow = i + 2;
      break;
    }
  }
  
  const date = new Date(data.date);
  sheet.getRange(insertRow, 1).setValue(date);
  sheet.getRange(insertRow, 2).setValue(data.category);
  sheet.getRange(insertRow, 3).setValue(data.description);
  sheet.getRange(insertRow, 4).setValue(data.paymentMode);
  sheet.getRange(insertRow, 5).setValue(parseFloat(data.amount));
  sheet.getRange(insertRow, 6).setValue(data.notes || '');
  sheet.getRange(insertRow, 7).setFormula(`=IF(A${insertRow}="","",TEXT(A${insertRow},"MMM-YYYY"))`);
  
  return { 
    success: true, 
    message: `Expense ₹${data.amount} added for ${data.category}`,
    row: insertRow
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
  
  // Find first empty row (skip header at row 1)
  const colA = sheet.getRange('A2:A').getValues();
  let insertRow = 2;
  for (let i = 0; i < colA.length; i++) {
    if (colA[i][0] === '' || colA[i][0] === null) {
      insertRow = i + 2;
      break;
    }
    if (colA[i][0] === 'PORTFOLIO TOTAL') {
      insertRow = i + 2;
      sheet.insertRowBefore(insertRow);
      break;
    }
  }
  
  sheet.getRange(insertRow, 1).setValue(data.name);
  sheet.getRange(insertRow, 2).setValue(data.symbol.toUpperCase());
  sheet.getRange(insertRow, 3).setValue(data.sector || '');
  sheet.getRange(insertRow, 4).setValue(new Date(data.buyDate));
  sheet.getRange(insertRow, 5).setValue(parseInt(data.qty));
  sheet.getRange(insertRow, 6).setValue(parseFloat(data.price));
  sheet.getRange(insertRow, 7).setFormula(`=IF(E${insertRow}="","",E${insertRow}*F${insertRow})`);
  sheet.getRange(insertRow, 8).setFormula(`=IF(B${insertRow}="","",GOOGLEFINANCE("NSE:"&B${insertRow},"price"))`);
  sheet.getRange(insertRow, 9).setFormula(`=IF(E${insertRow}="","",E${insertRow}*H${insertRow})`);
  sheet.getRange(insertRow, 10).setFormula(`=IF(G${insertRow}="","",I${insertRow}-G${insertRow})`);
  sheet.getRange(insertRow, 11).setFormula(`=IF(G${insertRow}=0,"",J${insertRow}/G${insertRow}*100)`);
  sheet.getRange(insertRow, 12).setFormula(`=IF(B${insertRow}="","",GOOGLEFINANCE("NSE:"&B${insertRow},"changepct"))`);
  sheet.getRange(insertRow, 13).setValue('Holding');
  sheet.getRange(insertRow, 14).setValue(data.notes || '');
  
  return { success: true, message: `Stock ${data.symbol} added` };
}

function addSIPAPI(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheets.sip);
  
  // Find first empty row (skip header at row 1)
  const colA = sheet.getRange('A2:A').getValues();
  let insertRow = 2; // default to row 2 (first data row)
  for (let i = 0; i < colA.length; i++) {
    if (colA[i][0] === '' || colA[i][0] === null) {
      insertRow = i + 2;
      break;
    }
    if (colA[i][0] === 'TOTAL') {
      // All rows full, insert before TOTAL
      insertRow = i + 2;
      sheet.insertRowBefore(insertRow);
      break;
    }
  }
  
  sheet.getRange(insertRow, 1).setValue(data.fundName);
  sheet.getRange(insertRow, 2).setValue(data.amc || '');
  sheet.getRange(insertRow, 3).setValue(data.folio || '');
  sheet.getRange(insertRow, 4).setValue(data.sipDate);
  sheet.getRange(insertRow, 5).setValue(parseFloat(data.monthlyAmount));
  sheet.getRange(insertRow, 6).setValue(data.startDate);
  sheet.getRange(insertRow, 7).setValue(parseInt(data.totalMonths) || 0);
  sheet.getRange(insertRow, 8).setValue(parseFloat(data.units) || 0);
  sheet.getRange(insertRow, 9).setValue(parseFloat(data.nav) || 0);
  sheet.getRange(insertRow, 10).setFormula(`=IF(H${insertRow}="","",H${insertRow}*I${insertRow})`);
  sheet.getRange(insertRow, 11).setFormula(`=IF(E${insertRow}="","",E${insertRow}*G${insertRow})`);
  sheet.getRange(insertRow, 12).setFormula(`=IF(J${insertRow}="","",J${insertRow}-K${insertRow})`);
  sheet.getRange(insertRow, 13).setFormula(`=IF(K${insertRow}=0,"",L${insertRow}/K${insertRow}*100)`);
  sheet.getRange(insertRow, 14).setValue('Active');
  
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

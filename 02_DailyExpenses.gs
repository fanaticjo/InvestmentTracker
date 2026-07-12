/**
 * =====================================================
 * DAILY EXPENSES SHEET SETUP
 * =====================================================
 */

function setupDailyExpenses(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(ss, CONFIG.sheets.expenses);
  
  // Headers
  const headers = [
    'Date', 'Category', 'Description', 'Payment Mode', 
    'Amount (₹)', 'Notes', 'Month-Year'
  ];
  
  // Set headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground(CONFIG.colors.headerBg);
  headerRange.setFontColor(CONFIG.colors.headerFont);
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(11);
  headerRange.setHorizontalAlignment('center');
  
  // Column widths
  sheet.setColumnWidth(1, 120); // Date
  sheet.setColumnWidth(2, 130); // Category
  sheet.setColumnWidth(3, 200); // Description
  sheet.setColumnWidth(4, 130); // Payment Mode
  sheet.setColumnWidth(5, 120); // Amount
  sheet.setColumnWidth(6, 180); // Notes
  sheet.setColumnWidth(7, 110); // Month-Year (helper column)
  
  // Data validation - Category dropdown (rows 2 to 500)
  const categoryRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.categories, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 2, 499, 1).setDataValidation(categoryRule);
  
  // Data validation - Payment Mode dropdown
  const paymentRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.paymentModes, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 4, 499, 1).setDataValidation(paymentRule);
  
  // Data validation - Date
  const dateRule = SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 1, 499, 1).setDataValidation(dateRule);
  
  // Number format for Amount
  sheet.getRange(2, 5, 499, 1).setNumberFormat('#,##0.00');
  
  // Date format
  sheet.getRange(2, 1, 499, 1).setNumberFormat('dd-MMM-yyyy');
  
  // Month-Year helper formula (for summary calculations)
  // This auto-fills when a date is entered
  sheet.getRange(2, 7).setFormula('=IF(A2="","",TEXT(A2,"MMM-YYYY"))');
  
  // Add sample data row for reference
  const sampleData = [[
    new Date(), 'Food', 'Sample - Delete this row', 'UPI', 100, 'Example entry', ''
  ]];
  sheet.getRange(2, 1, 1, 7).setValues(sampleData);
  sheet.getRange(2, 7).setFormula('=IF(A2="","",TEXT(A2,"MMM-YYYY"))');
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Alternate row coloring
  const rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=ISEVEN(ROW())')
    .setBackground('#f0f4ff')
    .setRanges([sheet.getRange(2, 1, 499, headers.length)])
    .build();
  sheet.setConditionalFormatRules([rule]);
  
  // Hide the Month-Year helper column (used for formulas only)
  sheet.hideColumns(7);
  
  return sheet;
}

/**
 * Quick Add Expense Dialog
 */
function showExpenseDialog() {
  const categoriesOptions = CONFIG.categories.map(c => `<option value="${c}">${c}</option>`).join('');
  const paymentOptions = CONFIG.paymentModes.map(p => `<option value="${p}">${p}</option>`).join('');
  
  const html = HtmlService.createHtmlOutput(`
    <div style="font-family: Arial; padding: 10px;">
      <h3>➕ Add Expense</h3>
      <form id="expenseForm">
        <label>Date:</label><br>
        <input type="date" id="date" value="${new Date().toISOString().split('T')[0]}" style="width:100%; padding:5px; margin-bottom:8px;"><br>
        
        <label>Category:</label><br>
        <select id="category" style="width:100%; padding:5px; margin-bottom:8px;">
          ${categoriesOptions}
        </select><br>
        
        <label>Description:</label><br>
        <input type="text" id="desc" style="width:100%; padding:5px; margin-bottom:8px;" placeholder="What did you spend on?"><br>
        
        <label>Payment Mode:</label><br>
        <select id="payment" style="width:100%; padding:5px; margin-bottom:8px;">
          ${paymentOptions}
        </select><br>
        
        <label>Amount (₹):</label><br>
        <input type="number" id="amount" style="width:100%; padding:5px; margin-bottom:8px;" step="0.01" placeholder="0.00"><br>
        
        <label>Notes (optional):</label><br>
        <input type="text" id="notes" style="width:100%; padding:5px; margin-bottom:12px;" placeholder="Any extra details"><br>
        
        <button type="button" onclick="submitExpense()" 
          style="background:#1a73e8; color:white; padding:10px 20px; border:none; border-radius:4px; cursor:pointer; width:100%;">
          Add Expense
        </button>
      </form>
      <script>
        function submitExpense() {
          const data = {
            date: document.getElementById('date').value,
            category: document.getElementById('category').value,
            desc: document.getElementById('desc').value,
            payment: document.getElementById('payment').value,
            amount: parseFloat(document.getElementById('amount').value),
            notes: document.getElementById('notes').value
          };
          google.script.run.withSuccessHandler(() => {
            google.script.host.close();
          }).addExpenseFromDialog(data);
        }
      </script>
    </div>
  `).setWidth(350).setHeight(450);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Add Expense');
}

/**
 * Backend function to add expense from dialog
 */
function addExpenseFromDialog(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheets.expenses);
  const lastRow = sheet.getLastRow() + 1;
  
  sheet.getRange(lastRow, 1).setValue(new Date(data.date));
  sheet.getRange(lastRow, 2).setValue(data.category);
  sheet.getRange(lastRow, 3).setValue(data.desc);
  sheet.getRange(lastRow, 4).setValue(data.payment);
  sheet.getRange(lastRow, 5).setValue(data.amount);
  sheet.getRange(lastRow, 6).setValue(data.notes);
  sheet.getRange(lastRow, 7).setFormula(`=IF(A${lastRow}="","",TEXT(A${lastRow},"MMM-YYYY"))`);
}

/**
 * =====================================================
 * MONTHLY SUMMARY (DASHBOARD) SHEET SETUP
 * =====================================================
 */

function setupMonthlySummary(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(ss, CONFIG.sheets.summary);
  
  // ===== SECTION 1: Monthly Income & Expenses =====
  sheet.getRange(1, 1).setValue('📊 MONTHLY FINANCIAL SUMMARY')
    .setFontSize(14).setFontWeight('bold');
  
  // Headers for monthly tracking
  const headers = [
    'Month', 'Income (₹)', 'Total Expenses (₹)', 
    'SIP Investment (₹)', 'Stock Buy (₹)',
    'Total Investment (₹)', 'Net Savings (₹)', 'Savings Rate %'
  ];
  
  const headerRange = sheet.getRange(3, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground(CONFIG.colors.headerBg);
  headerRange.setFontColor(CONFIG.colors.headerFont);
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(10);
  headerRange.setHorizontalAlignment('center');
  headerRange.setWrap(true);
  
  // Column widths
  sheet.setColumnWidth(1, 110);  // Month
  sheet.setColumnWidth(2, 120);  // Income
  sheet.setColumnWidth(3, 140);  // Total Expenses
  sheet.setColumnWidth(4, 140);  // SIP
  sheet.setColumnWidth(5, 120);  // Stock Buy
  sheet.setColumnWidth(6, 140);  // Total Investment
  sheet.setColumnWidth(7, 130);  // Net Savings
  sheet.setColumnWidth(8, 110);  // Savings Rate
  
  // Pre-fill months for current year (rows 4-15)
  const currentYear = new Date().getFullYear();
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  for (let i = 0; i < 12; i++) {
    const row = i + 4;
    const monthLabel = `${months[i]}-${currentYear}`;
    sheet.getRange(row, 1).setValue(monthLabel);
    
    // Auto-calculate expenses from Daily Expenses sheet
    // SUMPRODUCT to match month-year text
    sheet.getRange(row, 3).setFormula(
      `=IFERROR(SUMPRODUCT(('Daily Expenses'!G:G="${monthLabel}")*('Daily Expenses'!E:E)),0)`
    );
    
    // Total Investment = SIP + Stock Buy
    sheet.getRange(row, 6).setFormula(`=D${row}+E${row}`);
    
    // Net Savings = Income - Expenses - Investments
    sheet.getRange(row, 7).setFormula(`=B${row}-C${row}-F${row}`);
    
    // Savings Rate = (Income - Expenses) / Income * 100
    sheet.getRange(row, 8).setFormula(`=IF(B${row}=0,"",((B${row}-C${row})/B${row})*100)`);
  }
  
  // Number formats for data rows
  sheet.getRange(4, 2, 12, 6).setNumberFormat('#,##0');
  sheet.getRange(4, 8, 12, 1).setNumberFormat('0.0"%"');
  
  // Yearly total row
  const totalRow = 16;
  sheet.getRange(totalRow, 1).setValue('YEAR TOTAL').setFontWeight('bold');
  sheet.getRange(totalRow, 2).setFormula('=SUM(B4:B15)');
  sheet.getRange(totalRow, 3).setFormula('=SUM(C4:C15)');
  sheet.getRange(totalRow, 4).setFormula('=SUM(D4:D15)');
  sheet.getRange(totalRow, 5).setFormula('=SUM(E4:E15)');
  sheet.getRange(totalRow, 6).setFormula('=SUM(F4:F15)');
  sheet.getRange(totalRow, 7).setFormula('=SUM(G4:G15)');
  sheet.getRange(totalRow, 8).setFormula('=IF(B16=0,"",((B16-C16)/B16)*100)');
  sheet.getRange(totalRow, 1, 1, headers.length)
    .setBackground(CONFIG.colors.sectionBg)
    .setFontWeight('bold');
  
  // ===== SECTION 2: Net Worth Snapshot =====
  const nwStartRow = 19;
  sheet.getRange(nwStartRow, 1).setValue('💰 NET WORTH SNAPSHOT')
    .setFontSize(12).setFontWeight('bold');
  
  const nwHeaders = ['Asset Type', 'Value (₹)', '% of Total'];
  sheet.getRange(nwStartRow + 1, 1, 1, 3).setValues([nwHeaders]);
  sheet.getRange(nwStartRow + 1, 1, 1, 3)
    .setBackground('#34a853').setFontColor('#ffffff').setFontWeight('bold');
  
  // Net worth items
  const nwItems = [
    ['SIP / Mutual Funds', `='SIP Tracker'!J52`, ''],
    ['Stocks', `='Stock Portfolio'!I102`, ''],
    ['Bank Balance (Manual)', '', ''],
    ['Fixed Deposits (Manual)', '', ''],
    ['Other Assets (Manual)', '', '']
  ];
  
  const nwDataStart = nwStartRow + 2;
  sheet.getRange(nwDataStart, 1, nwItems.length, 1).setValues(
    nwItems.map(item => [item[0]])
  );
  
  // Set formulas for auto-calculated values
  sheet.getRange(nwDataStart, 2).setFormula(`='SIP Tracker'!J52`);
  sheet.getRange(nwDataStart + 1, 2).setFormula(`='Stock Portfolio'!I102`);
  
  // Total Net Worth
  const nwTotalRow = nwDataStart + nwItems.length;
  sheet.getRange(nwTotalRow, 1).setValue('TOTAL NET WORTH').setFontWeight('bold');
  sheet.getRange(nwTotalRow, 2).setFormula(`=SUM(B${nwDataStart}:B${nwTotalRow - 1})`);
  sheet.getRange(nwTotalRow, 1, 1, 3)
    .setBackground(CONFIG.colors.sectionBg).setFontWeight('bold');
  
  // Percentage formulas
  for (let i = 0; i < nwItems.length; i++) {
    sheet.getRange(nwDataStart + i, 3).setFormula(
      `=IF(B${nwTotalRow}=0,"",B${nwDataStart + i}/B${nwTotalRow}*100)`
    );
  }
  
  // Number formats for net worth section
  sheet.getRange(nwDataStart, 2, nwItems.length + 1, 1).setNumberFormat('#,##0');
  sheet.getRange(nwDataStart, 3, nwItems.length, 1).setNumberFormat('0.0"%"');
  
  // ===== SECTION 3: Expense Category Breakdown =====
  const catStartRow = 28;
  sheet.getRange(catStartRow, 1).setValue('📂 EXPENSE BREAKDOWN (Current Month)')
    .setFontSize(12).setFontWeight('bold');
  
  const catHeaders = ['Category', 'Amount (₹)', '% of Total'];
  sheet.getRange(catStartRow + 1, 1, 1, 3).setValues([catHeaders]);
  sheet.getRange(catStartRow + 1, 1, 1, 3)
    .setBackground('#ea4335').setFontColor('#ffffff').setFontWeight('bold');
  
  // Category rows with formulas
  const currentMonth = months[new Date().getMonth()] + '-' + currentYear;
  for (let i = 0; i < CONFIG.categories.length; i++) {
    const row = catStartRow + 2 + i;
    sheet.getRange(row, 1).setValue(CONFIG.categories[i]);
    sheet.getRange(row, 2).setFormula(
      `=IFERROR(SUMPRODUCT(('Daily Expenses'!G:G="${currentMonth}")*('Daily Expenses'!B:B="${CONFIG.categories[i]}")*('Daily Expenses'!E:E)),0)`
    );
  }
  
  // Category total
  const catTotalRow = catStartRow + 2 + CONFIG.categories.length;
  sheet.getRange(catTotalRow, 1).setValue('TOTAL').setFontWeight('bold');
  sheet.getRange(catTotalRow, 2).setFormula(
    `=SUM(B${catStartRow + 2}:B${catTotalRow - 1})`
  );
  
  // Percentage formulas for categories
  for (let i = 0; i < CONFIG.categories.length; i++) {
    const row = catStartRow + 2 + i;
    sheet.getRange(row, 3).setFormula(
      `=IF(B${catTotalRow}=0,"",B${row}/B${catTotalRow}*100)`
    );
  }
  
  // Format category section
  sheet.getRange(catStartRow + 2, 2, CONFIG.categories.length + 1, 1).setNumberFormat('#,##0');
  sheet.getRange(catStartRow + 2, 3, CONFIG.categories.length, 1).setNumberFormat('0.0"%"');
  
  // Freeze header area
  sheet.setFrozenRows(3);
  
  // Conditional formatting for savings rate
  const goodSavings = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(30)
    .setBackground('#d4edda')
    .setRanges([sheet.getRange(4, 8, 12, 1)])
    .build();
  
  const lowSavings = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(10)
    .setBackground('#f8d7da')
    .setRanges([sheet.getRange(4, 8, 12, 1)])
    .build();
  
  sheet.setConditionalFormatRules([goodSavings, lowSavings]);
  
  return sheet;
}

/**
 * Update Monthly Summary - recalculates current month data
 */
function updateMonthlySummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheets.summary);
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Monthly Summary sheet not found. Run Setup first.');
    return;
  }
  
  // Force recalculation by touching a cell
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('✅ Monthly Summary updated!');
}

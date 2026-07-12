/**
 * =====================================================
 * DAILY EXPENSE DASHBOARD
 * =====================================================
 * Shows: Today's spend, this week's trend, category-wise
 * daily breakdown, and spending patterns.
 */

function setupDailyDashboard(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(ss, 'Daily Dashboard');
  
  const currentYear = new Date().getFullYear();
  
  // ===== SECTION 1: TODAY'S SNAPSHOT =====
  sheet.getRange(1, 1).setValue("📅 TODAY'S EXPENSE SNAPSHOT")
    .setFontSize(14).setFontWeight('bold');
  
  sheet.getRange(2, 1).setValue('Date:').setFontWeight('bold');
  sheet.getRange(2, 2).setFormula('=TODAY()').setNumberFormat('dd-MMM-yyyy (dddd)');
  
  // Today's total
  sheet.getRange(3, 1).setValue("Today's Total:").setFontWeight('bold');
  sheet.getRange(3, 2).setFormula(
    '=IFERROR(SUMPRODUCT((\'Daily Expenses\'!A:A=TODAY())*(\'Daily Expenses\'!E:E)),0)'
  ).setNumberFormat('₹#,##0').setFontSize(16).setFontColor('#1a73e8');
  
  // Yesterday comparison
  sheet.getRange(4, 1).setValue("Yesterday's Total:").setFontWeight('bold');
  sheet.getRange(4, 2).setFormula(
    '=IFERROR(SUMPRODUCT((\'Daily Expenses\'!A:A=TODAY()-1)*(\'Daily Expenses\'!E:E)),0)'
  ).setNumberFormat('₹#,##0');
  
  // Change indicator
  sheet.getRange(5, 1).setValue('Change:').setFontWeight('bold');
  sheet.getRange(5, 2).setFormula('=IF(B4=0,"N/A",TEXT((B3-B4)/B4,"0%")&IF(B3>B4," ▲"," ▼"))');
  
  // Column widths
  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 130);
  sheet.setColumnWidth(4, 130);
  sheet.setColumnWidth(5, 130);
  sheet.setColumnWidth(6, 130);
  sheet.setColumnWidth(7, 130);
  sheet.setColumnWidth(8, 130);
  
  // ===== SECTION 2: TODAY'S CATEGORY BREAKDOWN =====
  const catStartRow = 7;
  sheet.getRange(catStartRow, 1).setValue("🏷️ TODAY'S SPEND BY CATEGORY")
    .setFontSize(12).setFontWeight('bold');
  
  const catHeaders = ['Category', 'Today (₹)', 'This Week (₹)', 'This Month (₹)', 'Budget (₹)', 'Remaining (₹)', 'Status'];
  sheet.getRange(catStartRow + 1, 1, 1, catHeaders.length).setValues([catHeaders]);
  sheet.getRange(catStartRow + 1, 1, 1, catHeaders.length)
    .setBackground(CONFIG.colors.headerBg)
    .setFontColor(CONFIG.colors.headerFont)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  // Category rows
  for (let i = 0; i < CONFIG.categories.length; i++) {
    const row = catStartRow + 2 + i;
    const cat = CONFIG.categories[i];
    
    sheet.getRange(row, 1).setValue(cat);
    
    // Today's spend for this category
    sheet.getRange(row, 2).setFormula(
      `=IFERROR(SUMPRODUCT(('Daily Expenses'!A:A=TODAY())*('Daily Expenses'!B:B="${cat}")*('Daily Expenses'!E:E)),0)`
    );
    
    // This week (Mon to today)
    sheet.getRange(row, 3).setFormula(
      `=IFERROR(SUMPRODUCT(('Daily Expenses'!A:A>=TODAY()-WEEKDAY(TODAY(),2)+1)*('Daily Expenses'!A:A<=TODAY())*('Daily Expenses'!B:B="${cat}")*('Daily Expenses'!E:E)),0)`
    );
    
    // This month
    sheet.getRange(row, 4).setFormula(
      `=IFERROR(SUMPRODUCT((MONTH('Daily Expenses'!A:A)=MONTH(TODAY()))*(YEAR('Daily Expenses'!A:A)=YEAR(TODAY()))*('Daily Expenses'!B:B="${cat}")*('Daily Expenses'!E:E)),0)`
    );
    
    // Budget - user fills this manually (or we set defaults)
    sheet.getRange(row, 5).setValue(getDefaultBudget(cat));
    
    // Remaining = Budget - This Month
    sheet.getRange(row, 6).setFormula(`=E${row}-D${row}`);
    
    // Status emoji
    sheet.getRange(row, 7).setFormula(
      `=IF(E${row}=0,"—",IF(D${row}/E${row}>1,"🔴 Over",IF(D${row}/E${row}>0.8,"🟡 Warning","🟢 OK")))`
    );
  }
  
  // Category totals row
  const catTotalRow = catStartRow + 2 + CONFIG.categories.length;
  sheet.getRange(catTotalRow, 1).setValue('TOTAL').setFontWeight('bold');
  sheet.getRange(catTotalRow, 2).setFormula(`=SUM(B${catStartRow + 2}:B${catTotalRow - 1})`);
  sheet.getRange(catTotalRow, 3).setFormula(`=SUM(C${catStartRow + 2}:C${catTotalRow - 1})`);
  sheet.getRange(catTotalRow, 4).setFormula(`=SUM(D${catStartRow + 2}:D${catTotalRow - 1})`);
  sheet.getRange(catTotalRow, 5).setFormula(`=SUM(E${catStartRow + 2}:E${catTotalRow - 1})`);
  sheet.getRange(catTotalRow, 6).setFormula(`=SUM(F${catStartRow + 2}:F${catTotalRow - 1})`);
  sheet.getRange(catTotalRow, 1, 1, catHeaders.length)
    .setBackground(CONFIG.colors.sectionBg).setFontWeight('bold');
  
  // Number formats
  sheet.getRange(catStartRow + 2, 2, CONFIG.categories.length + 1, 5).setNumberFormat('#,##0');
  
  // Conditional formatting for Remaining column (red if negative)
  const negativeRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0)
    .setBackground('#f8d7da')
    .setFontColor('#721c24')
    .setRanges([sheet.getRange(catStartRow + 2, 6, CONFIG.categories.length, 1)])
    .build();
  
  const positiveRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(0)
    .setBackground('#d4edda')
    .setFontColor('#155724')
    .setRanges([sheet.getRange(catStartRow + 2, 6, CONFIG.categories.length, 1)])
    .build();
  
  // ===== SECTION 3: LAST 7 DAYS TREND =====
  const trendStartRow = catTotalRow + 3;
  sheet.getRange(trendStartRow, 1).setValue('📈 LAST 7 DAYS DAILY SPEND')
    .setFontSize(12).setFontWeight('bold');
  
  const trendHeaders = ['Day', 'Date', 'Total (₹)', 'Top Category', 'Top Amount (₹)'];
  sheet.getRange(trendStartRow + 1, 1, 1, trendHeaders.length).setValues([trendHeaders]);
  sheet.getRange(trendStartRow + 1, 1, 1, trendHeaders.length)
    .setBackground('#fbbc04').setFontWeight('bold').setHorizontalAlignment('center');
  
  // Last 7 days rows
  for (let i = 0; i < 7; i++) {
    const row = trendStartRow + 2 + i;
    
    // Day name
    sheet.getRange(row, 1).setFormula(`=TEXT(TODAY()-${6 - i},"dddd")`);
    // Date
    sheet.getRange(row, 2).setFormula(`=TODAY()-${6 - i}`);
    sheet.getRange(row, 2).setNumberFormat('dd-MMM');
    // Total spend that day
    sheet.getRange(row, 3).setFormula(
      `=IFERROR(SUMPRODUCT(('Daily Expenses'!A:A=TODAY()-${6 - i})*('Daily Expenses'!E:E)),0)`
    );
    // Top category (most spent)
    sheet.getRange(row, 4).setFormula(
      `=IFERROR(INDEX('Daily Expenses'!B:B,MATCH(MAXIFS('Daily Expenses'!E:E,'Daily Expenses'!A:A,TODAY()-${6 - i}),'Daily Expenses'!E:E,0)),"-")`
    );
    // Top amount
    sheet.getRange(row, 5).setFormula(
      `=IFERROR(MAXIFS('Daily Expenses'!E:E,'Daily Expenses'!A:A,TODAY()-${6 - i}),0)`
    );
  }
  
  // 7-day total
  const trendTotalRow = trendStartRow + 9;
  sheet.getRange(trendTotalRow, 1).setValue('WEEK TOTAL').setFontWeight('bold');
  sheet.getRange(trendTotalRow, 3).setFormula(`=SUM(C${trendStartRow + 2}:C${trendStartRow + 8})`);
  sheet.getRange(trendTotalRow, 1, 1, 5)
    .setBackground(CONFIG.colors.sectionBg).setFontWeight('bold');
  
  // Daily average
  const avgRow = trendTotalRow + 1;
  sheet.getRange(avgRow, 1).setValue('DAILY AVG').setFontWeight('bold');
  sheet.getRange(avgRow, 3).setFormula(`=C${trendTotalRow}/7`);
  
  // Number format for trend
  sheet.getRange(trendStartRow + 2, 3, 9, 1).setNumberFormat('#,##0');
  sheet.getRange(trendStartRow + 2, 5, 7, 1).setNumberFormat('#,##0');
  
  // ===== SECTION 4: PAYMENT MODE SPLIT (Today) =====
  const pmStartRow = avgRow + 3;
  sheet.getRange(pmStartRow, 1).setValue("💳 TODAY'S PAYMENT MODE SPLIT")
    .setFontSize(12).setFontWeight('bold');
  
  const pmHeaders = ['Payment Mode', 'Amount (₹)', 'Transactions'];
  sheet.getRange(pmStartRow + 1, 1, 1, pmHeaders.length).setValues([pmHeaders]);
  sheet.getRange(pmStartRow + 1, 1, 1, pmHeaders.length)
    .setBackground('#6c757d').setFontColor('#ffffff').setFontWeight('bold');
  
  for (let i = 0; i < CONFIG.paymentModes.length; i++) {
    const row = pmStartRow + 2 + i;
    const mode = CONFIG.paymentModes[i];
    
    sheet.getRange(row, 1).setValue(mode);
    sheet.getRange(row, 2).setFormula(
      `=IFERROR(SUMPRODUCT(('Daily Expenses'!A:A=TODAY())*('Daily Expenses'!D:D="${mode}")*('Daily Expenses'!E:E)),0)`
    );
    sheet.getRange(row, 3).setFormula(
      `=IFERROR(SUMPRODUCT(('Daily Expenses'!A:A=TODAY())*('Daily Expenses'!D:D="${mode}")*1),0)`
    );
  }
  
  sheet.getRange(pmStartRow + 2, 2, CONFIG.paymentModes.length, 1).setNumberFormat('#,##0');
  
  // Apply conditional formatting rules
  sheet.setConditionalFormatRules([negativeRule, positiveRule]);
  
  // Freeze top rows
  sheet.setFrozenRows(1);
  
  return sheet;
}

/**
 * Default monthly budgets per category (customize these!)
 */
function getDefaultBudget(category) {
  const budgets = {
    'Food': 8000,
    'Transport': 3000,
    'Shopping': 5000,
    'Bills': 10000,
    'Entertainment': 2000,
    'Health': 3000,
    'Education': 5000,
    'Subscriptions': 1500,
    'Groceries': 6000,
    'Rent': 15000,
    'EMI': 10000,
    'Gifts': 2000,
    'Miscellaneous': 3000
  };
  return budgets[category] || 0;
}

/**
 * Refresh Daily Dashboard - forces recalculation
 */
function refreshDailyDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Daily Dashboard');
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Daily Dashboard not found. Run Setup first.');
    return;
  }
  
  SpreadsheetApp.flush();
  sheet.activate();
  SpreadsheetApp.getUi().alert('✅ Daily Dashboard refreshed!');
}

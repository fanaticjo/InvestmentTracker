/**
 * =====================================================
 * SIP TRACKER SHEET SETUP
 * =====================================================
 */

function setupSIPTracker(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(ss, CONFIG.sheets.sip);
  
  // Headers
  const headers = [
    'Fund Name', 'AMC', 'Folio No.', 'SIP Date',
    'Monthly Amount (₹)', 'Start Date', 'Total Months',
    'Units Accumulated', 'Current NAV', 'Current Value (₹)',
    'Total Invested (₹)', 'Returns (₹)', 'Return %', 'Status'
  ];
  
  // Set headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground(CONFIG.colors.headerBg);
  headerRange.setFontColor(CONFIG.colors.headerFont);
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(10);
  headerRange.setHorizontalAlignment('center');
  headerRange.setWrap(true);
  
  // Column widths
  sheet.setColumnWidth(1, 200);  // Fund Name
  sheet.setColumnWidth(2, 100);  // AMC
  sheet.setColumnWidth(3, 100);  // Folio
  sheet.setColumnWidth(4, 80);   // SIP Date
  sheet.setColumnWidth(5, 130);  // Monthly Amount
  sheet.setColumnWidth(6, 110);  // Start Date
  sheet.setColumnWidth(7, 100);  // Total Months
  sheet.setColumnWidth(8, 130);  // Units
  sheet.setColumnWidth(9, 110);  // NAV
  sheet.setColumnWidth(10, 130); // Current Value
  sheet.setColumnWidth(11, 130); // Total Invested
  sheet.setColumnWidth(12, 120); // Returns
  sheet.setColumnWidth(13, 90);  // Return %
  sheet.setColumnWidth(14, 80);  // Status
  
  // Formulas for calculated fields (row 2 as template)
  // Current Value = Units × NAV
  sheet.getRange(2, 10).setFormula('=IF(H2="","",H2*I2)');
  // Total Invested = Monthly Amount × Total Months
  sheet.getRange(2, 11).setFormula('=IF(E2="","",E2*G2)');
  // Returns = Current Value - Total Invested
  sheet.getRange(2, 12).setFormula('=IF(J2="","",J2-K2)');
  // Return % = (Returns / Total Invested) × 100
  sheet.getRange(2, 13).setFormula('=IF(K2=0,"",L2/K2*100)');
  
  // Number formats
  sheet.getRange(2, 5, 50, 1).setNumberFormat('#,##0');     // Monthly Amount
  sheet.getRange(2, 8, 50, 1).setNumberFormat('#,##0.000'); // Units
  sheet.getRange(2, 9, 50, 1).setNumberFormat('#,##0.00');  // NAV
  sheet.getRange(2, 10, 50, 1).setNumberFormat('#,##0.00'); // Current Value
  sheet.getRange(2, 11, 50, 1).setNumberFormat('#,##0.00'); // Total Invested
  sheet.getRange(2, 12, 50, 1).setNumberFormat('#,##0.00'); // Returns
  sheet.getRange(2, 13, 50, 1).setNumberFormat('0.00"%"'); // Return %
  
  // Status dropdown
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Active', 'Paused', 'Stopped', 'Completed'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 14, 50, 1).setDataValidation(statusRule);
  
  // SIP Date dropdown (1st to 28th)
  const sipDates = Array.from({length: 28}, (_, i) => `${i + 1}`);
  const sipDateRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(sipDates, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 4, 50, 1).setDataValidation(sipDateRule);
  
  // Conditional formatting for Returns column - Green for profit
  const profitRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(0)
    .setBackground('#d4edda')
    .setFontColor('#155724')
    .setRanges([sheet.getRange(2, 12, 50, 1)])
    .build();
  
  // Red for loss
  const lossRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0)
    .setBackground('#f8d7da')
    .setFontColor('#721c24')
    .setRanges([sheet.getRange(2, 12, 50, 1)])
    .build();
  
  sheet.setConditionalFormatRules([profitRule, lossRule]);
  
  // Freeze header
  sheet.setFrozenRows(1);
  
  // Add summary row at bottom (row 52)
  const summaryRow = 52;
  sheet.getRange(summaryRow, 1).setValue('TOTAL').setFontWeight('bold');
  sheet.getRange(summaryRow, 5).setFormula('=SUMIF(N2:N51,"Active",E2:E51)');
  sheet.getRange(summaryRow, 10).setFormula('=SUM(J2:J51)');
  sheet.getRange(summaryRow, 11).setFormula('=SUM(K2:K51)');
  sheet.getRange(summaryRow, 12).setFormula('=SUM(L2:L51)');
  sheet.getRange(summaryRow, 13).setFormula('=IF(K52=0,"",L52/K52*100)');
  sheet.getRange(summaryRow, 1, 1, headers.length)
    .setBackground(CONFIG.colors.sectionBg)
    .setFontWeight('bold');
  
  // Add sample row
  const sampleData = [[
    'Nifty 50 Index Fund', 'UTI', '123456', '5', 
    5000, 'Jan-2024', 18, 245.5, 152.30, '', '', '', '', 'Active'
  ]];
  sheet.getRange(2, 1, 1, headers.length).setValues(sampleData);
  // Re-apply formulas after sample data
  sheet.getRange(2, 10).setFormula('=IF(H2="","",H2*I2)');
  sheet.getRange(2, 11).setFormula('=IF(E2="","",E2*G2)');
  sheet.getRange(2, 12).setFormula('=IF(J2="","",J2-K2)');
  sheet.getRange(2, 13).setFormula('=IF(K2=0,"",L2/K2*100)');
  
  return sheet;
}

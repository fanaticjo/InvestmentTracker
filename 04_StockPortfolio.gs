/**
 * =====================================================
 * STOCK PORTFOLIO SHEET SETUP
 * =====================================================
 */

function setupStockPortfolio(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(ss, CONFIG.sheets.stocks);
  
  // Headers
  const headers = [
    'Stock Name', 'Symbol (NSE)', 'Sector', 'Buy Date',
    'Qty', 'Avg Buy Price (₹)', 'Invested (₹)',
    'CMP (₹)', 'Current Value (₹)', 'P&L (₹)',
    'P&L %', 'Day Change %', 'Status', 'Notes'
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
  sheet.setColumnWidth(1, 150);  // Stock Name
  sheet.setColumnWidth(2, 120);  // Symbol
  sheet.setColumnWidth(3, 100);  // Sector
  sheet.setColumnWidth(4, 110);  // Buy Date
  sheet.setColumnWidth(5, 60);   // Qty
  sheet.setColumnWidth(6, 130);  // Avg Buy Price
  sheet.setColumnWidth(7, 120);  // Invested
  sheet.setColumnWidth(8, 110);  // CMP
  sheet.setColumnWidth(9, 130);  // Current Value
  sheet.setColumnWidth(10, 110); // P&L
  sheet.setColumnWidth(11, 80);  // P&L %
  sheet.setColumnWidth(12, 100); // Day Change
  sheet.setColumnWidth(13, 80);  // Status
  sheet.setColumnWidth(14, 150); // Notes
  
  // Formulas for row 2 (template - these auto-calculate)
  // Invested = Qty × Avg Buy Price
  sheet.getRange(2, 7).setFormula('=IF(E2="","",E2*F2)');
  // CMP using GOOGLEFINANCE (auto-updates!)
  sheet.getRange(2, 8).setFormula('=IF(B2="","",GOOGLEFINANCE("NSE:"&B2,"price"))');
  // Current Value = Qty × CMP
  sheet.getRange(2, 9).setFormula('=IF(E2="","",E2*H2)');
  // P&L = Current Value - Invested
  sheet.getRange(2, 10).setFormula('=IF(G2="","",I2-G2)');
  // P&L % = (P&L / Invested) × 100
  sheet.getRange(2, 11).setFormula('=IF(G2=0,"",J2/G2*100)');
  // Day Change % using GOOGLEFINANCE
  sheet.getRange(2, 12).setFormula('=IF(B2="","",GOOGLEFINANCE("NSE:"&B2,"changepct"))');
  
  // Number formats
  sheet.getRange(2, 5, 100, 1).setNumberFormat('#,##0');       // Qty
  sheet.getRange(2, 6, 100, 1).setNumberFormat('#,##0.00');    // Avg Buy Price
  sheet.getRange(2, 7, 100, 1).setNumberFormat('#,##0.00');    // Invested
  sheet.getRange(2, 8, 100, 1).setNumberFormat('#,##0.00');    // CMP
  sheet.getRange(2, 9, 100, 1).setNumberFormat('#,##0.00');    // Current Value
  sheet.getRange(2, 10, 100, 1).setNumberFormat('#,##0.00');   // P&L
  sheet.getRange(2, 11, 100, 1).setNumberFormat('0.00"%"');    // P&L %
  sheet.getRange(2, 12, 100, 1).setNumberFormat('0.00"%"');    // Day Change %
  sheet.getRange(2, 4, 100, 1).setNumberFormat('dd-MMM-yyyy');  // Date
  
  // Status dropdown
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Holding', 'Sold', 'Partial Exit', 'Watchlist'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 13, 100, 1).setDataValidation(statusRule);
  
  // Sector dropdown
  const sectors = [
    'IT', 'Banking', 'FMCG', 'Pharma', 'Auto', 'Energy',
    'Metals', 'Infra', 'Realty', 'Telecom', 'Chemical', 'Other'
  ];
  const sectorRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(sectors, true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange(2, 3, 100, 1).setDataValidation(sectorRule);
  
  // Conditional formatting - P&L column green/red
  const profitRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(0)
    .setBackground('#d4edda')
    .setFontColor('#155724')
    .setRanges([sheet.getRange(2, 10, 100, 1), sheet.getRange(2, 11, 100, 1)])
    .build();
  
  const lossRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0)
    .setBackground('#f8d7da')
    .setFontColor('#721c24')
    .setRanges([sheet.getRange(2, 10, 100, 1), sheet.getRange(2, 11, 100, 1)])
    .build();
  
  // Day change formatting
  const dayGreenRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(0)
    .setFontColor('#155724')
    .setRanges([sheet.getRange(2, 12, 100, 1)])
    .build();
  
  const dayRedRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0)
    .setFontColor('#721c24')
    .setRanges([sheet.getRange(2, 12, 100, 1)])
    .build();
  
  sheet.setConditionalFormatRules([profitRule, lossRule, dayGreenRule, dayRedRule]);
  
  // Freeze header
  sheet.setFrozenRows(1);
  
  // Summary row
  const summaryRow = 102;
  sheet.getRange(summaryRow, 1).setValue('PORTFOLIO TOTAL').setFontWeight('bold');
  sheet.getRange(summaryRow, 5).setFormula('=SUM(E2:E101)');
  sheet.getRange(summaryRow, 7).setFormula('=SUM(G2:G101)');
  sheet.getRange(summaryRow, 9).setFormula('=SUM(I2:I101)');
  sheet.getRange(summaryRow, 10).setFormula('=SUM(J2:J101)');
  sheet.getRange(summaryRow, 11).setFormula('=IF(G102=0,"",J102/G102*100)');
  sheet.getRange(summaryRow, 1, 1, headers.length)
    .setBackground(CONFIG.colors.sectionBg)
    .setFontWeight('bold');
  
  // Sample row
  const sampleData = [[
    'Reliance Industries', 'RELIANCE', 'Energy', new Date(2025, 2, 15),
    10, 2450, '', '', '', '', '', '', 'Holding', 'Long term hold'
  ]];
  sheet.getRange(2, 1, 1, headers.length).setValues(sampleData);
  // Re-apply formulas
  sheet.getRange(2, 7).setFormula('=IF(E2="","",E2*F2)');
  sheet.getRange(2, 8).setFormula('=IF(B2="","",GOOGLEFINANCE("NSE:"&B2,"price"))');
  sheet.getRange(2, 9).setFormula('=IF(E2="","",E2*H2)');
  sheet.getRange(2, 10).setFormula('=IF(G2="","",I2-G2)');
  sheet.getRange(2, 11).setFormula('=IF(G2=0,"",J2/G2*100)');
  sheet.getRange(2, 12).setFormula('=IF(B2="","",GOOGLEFINANCE("NSE:"&B2,"changepct"))');
  
  return sheet;
}

/**
 * Quick Add Stock Dialog
 */
function showStockDialog() {
  const html = HtmlService.createHtmlOutput(`
    <div style="font-family: Arial; padding: 10px;">
      <h3>➕ Add Stock</h3>
      <form id="stockForm">
        <label>Stock Name:</label><br>
        <input type="text" id="name" style="width:100%; padding:5px; margin-bottom:8px;" placeholder="e.g. Reliance Industries"><br>
        
        <label>NSE Symbol:</label><br>
        <input type="text" id="symbol" style="width:100%; padding:5px; margin-bottom:8px;" placeholder="e.g. RELIANCE"><br>
        
        <label>Sector:</label><br>
        <input type="text" id="sector" style="width:100%; padding:5px; margin-bottom:8px;" placeholder="e.g. Energy"><br>
        
        <label>Buy Date:</label><br>
        <input type="date" id="buyDate" value="${new Date().toISOString().split('T')[0]}" style="width:100%; padding:5px; margin-bottom:8px;"><br>
        
        <label>Quantity:</label><br>
        <input type="number" id="qty" style="width:100%; padding:5px; margin-bottom:8px;" placeholder="0"><br>
        
        <label>Avg Buy Price (₹):</label><br>
        <input type="number" id="price" step="0.01" style="width:100%; padding:5px; margin-bottom:8px;" placeholder="0.00"><br>
        
        <label>Notes:</label><br>
        <input type="text" id="notes" style="width:100%; padding:5px; margin-bottom:12px;" placeholder="Optional"><br>
        
        <button type="button" onclick="submitStock()" 
          style="background:#1a73e8; color:white; padding:10px 20px; border:none; border-radius:4px; cursor:pointer; width:100%;">
          Add Stock
        </button>
      </form>
      <script>
        function submitStock() {
          const data = {
            name: document.getElementById('name').value,
            symbol: document.getElementById('symbol').value.toUpperCase(),
            sector: document.getElementById('sector').value,
            buyDate: document.getElementById('buyDate').value,
            qty: parseInt(document.getElementById('qty').value),
            price: parseFloat(document.getElementById('price').value),
            notes: document.getElementById('notes').value
          };
          google.script.run.withSuccessHandler(() => {
            google.script.host.close();
          }).addStockFromDialog(data);
        }
      </script>
    </div>
  `).setWidth(350).setHeight(500);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Add Stock');
}

/**
 * Backend: Add stock from dialog
 */
function addStockFromDialog(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheets.stocks);
  const lastRow = Math.max(sheet.getLastRow() + 1, 2);
  
  sheet.getRange(lastRow, 1).setValue(data.name);
  sheet.getRange(lastRow, 2).setValue(data.symbol);
  sheet.getRange(lastRow, 3).setValue(data.sector);
  sheet.getRange(lastRow, 4).setValue(new Date(data.buyDate));
  sheet.getRange(lastRow, 5).setValue(data.qty);
  sheet.getRange(lastRow, 6).setValue(data.price);
  sheet.getRange(lastRow, 7).setFormula(`=IF(E${lastRow}="","",E${lastRow}*F${lastRow})`);
  sheet.getRange(lastRow, 8).setFormula(`=IF(B${lastRow}="","",GOOGLEFINANCE("NSE:"&B${lastRow},"price"))`);
  sheet.getRange(lastRow, 9).setFormula(`=IF(E${lastRow}="","",E${lastRow}*H${lastRow})`);
  sheet.getRange(lastRow, 10).setFormula(`=IF(G${lastRow}="","",I${lastRow}-G${lastRow})`);
  sheet.getRange(lastRow, 11).setFormula(`=IF(G${lastRow}=0,"",J${lastRow}/G${lastRow}*100)`);
  sheet.getRange(lastRow, 12).setFormula(`=IF(B${lastRow}="","",GOOGLEFINANCE("NSE:"&B${lastRow},"changepct"))`);
  sheet.getRange(lastRow, 13).setValue('Holding');
  sheet.getRange(lastRow, 14).setValue(data.notes);
}

/**
 * Manual refresh - just triggers recalc
 */
function refreshStockPrices() {
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheets.stocks)
    .getRange(1, 1).setValue('Stock Name'); // Triggers sheet recalculation
  SpreadsheetApp.getUi().alert('Stock prices refreshed via GOOGLEFINANCE.');
}

// ─────────────────────────────────────────────────────────────────
// NBA Narrative · Google Apps Script — Engagement Tracker
// ─────────────────────────────────────────────────────────────────
// SETUP:
//   1. Go to sheets.google.com → create a new blank spreadsheet
//   2. Extensions → Apps Script
//   3. Delete the default code and paste ALL of this file
//   4. Save (Ctrl+S)
//   5. Click Deploy → New Deployment
//      - Type: Web App
//      - Execute as: Me
//      - Who has access: Anyone
//      → Click Deploy → Authorise → Copy the /exec URL
//   6. Paste the URL into gate.js and dashboard.html where it says
//      REPLACE_WITH_APPS_SCRIPT_URL
// ─────────────────────────────────────────────────────────────────

var SHEET_NAME = 'Access Log';
var HEADERS    = ['Timestamp', 'Name', 'Company', 'Position', 'Page', 'URL', 'IP', 'Location', 'Device', 'Returning'];

// ── Receive tracking data from pages ─────────────────────────────
function doPost(e) {
  try {
    var data  = JSON.parse(e.postData.contents);
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    }

    sheet.appendRow([
      data.timestamp || new Date().toUTCString(),
      data.name      || '',
      data.company   || '',
      data.position  || '',
      data.page      || '',
      data.url       || '',
      data.ip        || '',
      data.location  || '',
      data.ua        || '',
      data.returning || 'no'
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Return all rows as JSON (for dashboard) ───────────────────────
// Supports JSONP via ?callback=fnName to bypass CORS
function doGet(e) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    var data  = [];

    if (sheet && sheet.getLastRow() > 1) {
      var rows    = sheet.getDataRange().getValues();
      var headers = rows[0];
      data = rows.slice(1).map(function (row) {
        var obj = {};
        headers.forEach(function (h, i) { obj[h] = row[i]; });
        return obj;
      });
    }

    var json     = JSON.stringify(data);
    var callback = e && e.parameter && e.parameter.callback;

    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + json + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService
      .createTextOutput(json)
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    var callback = e && e.parameter && e.parameter.callback;
    if (callback) {
      return ContentService
        .createTextOutput(callback + '([])')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService
      .createTextOutput('[]')
      .setMimeType(ContentService.MimeType.JSON);
  }
}

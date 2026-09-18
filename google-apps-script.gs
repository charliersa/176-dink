const SHEET_NAME = 'Bookings';

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'donglin-bookings' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents || '{}');
  const sheet = getSheet_();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'id', 'name', 'phone', 'date', 'time', 'court', 'people',
      'total', 'deposit', 'status', 'createdAt'
    ]);
  }

  sheet.appendRow([
    data.id || '', data.name || '', data.phone || '', data.date || '',
    data.time || '', data.court || '', data.people || '', data.total || '',
    data.deposit || '', data.status || '', data.createdAt || new Date().toISOString()
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, id: data.id || null }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}
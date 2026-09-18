const SHEET_NAME = 'Bookings';
const SETTINGS_SHEET_NAME = 'Settings';

// 後台密碼不寫在程式碼裡（這個檔案會進公開 repo）。
// 設定位置：Apps Script 編輯器 → 專案設定 → 指令碼屬性
//   屬性：ADMIN_PASSWORD   值：你的密碼
function checkPassword_(password) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!expected) return false;
  return String(password || '') === String(expected);
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';

  if (action === 'settings') {
    return json_({
      ok: true,
      bg: readSetting_('bg'),
      txt: readSetting_('txt')
    });
  }

  return json_({ ok: true, service: 'donglin-bookings' });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents || '{}');

  if (data.type === 'login') {
    return json_({ ok: checkPassword_(data.password) });
  }

  if (data.type === 'settings') {
    // 密碼不符就什麼都不寫，改前端也繞不過去。
    if (!checkPassword_(data.password)) {
      return json_({ ok: false, error: 'unauthorized' });
    }
    if (data.bg) writeSetting_('bg', data.bg);
    if (data.txt) writeSetting_('txt', data.txt);
    return json_({ ok: true, saved: 'settings' });
  }

  const sheet = getSheet_(SHEET_NAME);

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

  return json_({ ok: true, id: data.id || null });
}

// 設定表為兩欄：key / value(JSON)，bg 與 txt 各佔一列。
function writeSetting_(key, value) {
  const sheet = getSheet_(SETTINGS_SHEET_NAME);
  const payload = JSON.stringify(value);
  const last = sheet.getLastRow();

  if (last === 0) {
    sheet.appendRow(['key', 'value', 'updatedAt']);
  } else {
    const keys = sheet.getRange(2, 1, Math.max(last - 1, 1), 1).getValues();
    for (let i = 0; i < keys.length; i++) {
      if (keys[i][0] === key) {
        sheet.getRange(i + 2, 2, 1, 2).setValues([[payload, new Date().toISOString()]]);
        return;
      }
    }
  }

  sheet.appendRow([key, payload, new Date().toISOString()]);
}

function readSetting_(key) {
  const sheet = getSheet_(SETTINGS_SHEET_NAME);
  const last = sheet.getLastRow();
  if (last < 2) return {};

  const rows = sheet.getRange(2, 1, last - 1, 2).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === key) {
      try { return JSON.parse(rows[i][1] || '{}'); } catch (err) { return {}; }
    }
  }
  return {};
}

function getSheet_(name) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

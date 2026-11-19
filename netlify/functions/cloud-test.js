'use strict';
const h = require('./_shared.cjs');

const EXPECTED_HEADERS = {
  IDEAS: ['Idea ID','Card Code','Title','Production Type','Data Type','Category','Subcategory','Visual Style','Asset Type','Color Palette','Target Buyer','Design Need','Commercial Value Score','Status','Created At','Updated At','Parent Idea ID','Drive Folder ID','Cover Asset ID','Active Prompt ID','Notes'],
  PROMPTS: ['Prompt ID','Idea ID','Prompt Type','Version','Simple Prompt','Visual Prompt','Final Prompt','Reference Asset ID','Active Version','Created At','Updated At','Notes'],
  ASSETS: ['Asset ID','Idea ID','Scene ID','Asset Type','Drive File ID','File Name','MIME Type','Format','Width px','Height px','Megapixels','File Size Bytes','Version','Is Active','Created At','Source Asset ID'],
  GROUPS: ['Group ID','Idea ID','Group Type','Group Title','Series Bible','Continuity Lock','Visual Style','Color Palette','Character Description','Location','Scene Count','Created At','Updated At'],
  'GROUP ITEMS': ['Item ID','Group ID','Idea ID','Sequence','Scene ID','Scene Title','Scene Action','Prompt ID','Active Asset ID','Generation Status','Created At','Updated At'],
  'GENERATION LOG': ['Run ID','Idea ID','Scene ID','Prompt ID','Prompt Version','AI Provider','Model','Resolution','Aspect Ratio','Generation Date','Status','Output Asset ID','Error Message']
};

function columnName(number) {
  let n = number, out = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    out = String.fromCharCode(65 + r) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

exports.handler = async (event) => {
  if (!h.onlyGet(event)) return h.json(405, { error: 'Method not allowed' });
  if (event.queryStringParameters?.folderId || event.queryStringParameters?.sheetId) {
    return h.json(400, { error: 'Cloud Gateway uses the folder and spreadsheet IDs configured in Netlify; custom IDs are not accepted.' });
  }
  const folderId = process.env.RIVIS_DRIVE_FOLDER_ID || '';
  const sheetId = process.env.RIVIS_SPREADSHEET_ID || '';
  if (!h.validFileId(folderId) || !h.validFileId(sheetId)) {
    return h.json(500, { error: 'Configure valid RIVIS_DRIVE_FOLDER_ID and RIVIS_SPREADSHEET_ID in Netlify Environment Variables' });
  }

  const state = await h.activeSession(event);
  if (state.error) return h.json(401, { error: state.error });
  const headers = { Authorization: 'Bearer ' + state.session.access_token };

  try {
    const folderUrl = 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(folderId) + '?fields=id,name,mimeType,capabilities(canAddChildren)&supportsAllDrives=true';
    const sheetDriveUrl = 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(sheetId) + '?fields=id,name,mimeType,capabilities(canEdit)&supportsAllDrives=true';
    const sheetsUrl = 'https://sheets.googleapis.com/v4/spreadsheets/' + encodeURIComponent(sheetId) + '?fields=spreadsheetId,properties(title),sheets(properties(title))';
    const [folderRes, driveSheetRes, sheetRes] = await Promise.all([
      fetch(folderUrl, { headers }),
      fetch(sheetDriveUrl, { headers }),
      fetch(sheetsUrl, { headers })
    ]);
    const [folder, driveSheet, sheet] = await Promise.all([
      folderRes.json().catch(() => ({})),
      driveSheetRes.json().catch(() => ({})),
      sheetRes.json().catch(() => ({}))
    ]);

    if (!folderRes.ok || !sheetRes.ok || !driveSheetRes.ok) {
      const failed = [
        !folderRes.ok ? `Drive folder ${folderRes.status}: ${folder.error?.message || 'access denied'}` : '',
        !driveSheetRes.ok ? `Drive spreadsheet ${driveSheetRes.status}: ${driveSheet.error?.message || 'access denied'}` : '',
        !sheetRes.ok ? `Sheets API ${sheetRes.status}: ${sheet.error?.message || 'access denied'}` : ''
      ].filter(Boolean);
      return h.json(502, { error: 'Google API access verification failed: ' + failed.join('; ') }, state.newCookie ? { 'Set-Cookie': state.newCookie } : {});
    }

    if (folder.mimeType !== 'application/vnd.google-apps.folder' || driveSheet.mimeType !== 'application/vnd.google-apps.spreadsheet') {
      return h.json(400, { error: 'Configured Drive ID must be a folder and configured spreadsheet ID must be a Google Sheets file' }, state.newCookie ? { 'Set-Cookie': state.newCookie } : {});
    }
    if (folder.capabilities?.canAddChildren === false || driveSheet.capabilities?.canEdit === false) {
      return h.json(403, { error: 'The connected Google account does not have write permission on the configured Drive folder or spreadsheet' }, state.newCookie ? { 'Set-Cookie': state.newCookie } : {});
    }

    const tabs = Array.isArray(sheet.sheets) ? sheet.sheets.map(s => s.properties?.title).filter(Boolean) : [];
    const missingTabs = Object.keys(EXPECTED_HEADERS).filter(name => !tabs.includes(name));
    const schemaErrors = [];
    const availableTabs = Object.entries(EXPECTED_HEADERS).filter(([name]) => tabs.includes(name));

    const checks = await Promise.all(availableTabs.map(async ([tab, expected]) => {
      const a1 = "'" + tab.replace(/'/g, "''") + "'!A1:" + columnName(expected.length) + '1';
      const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + encodeURIComponent(sheetId) + '/values/' + encodeURIComponent(a1);
      const response = await fetch(url, { headers });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { tab, ok: false, error: `Header read failed (${response.status}): ${data.error?.message || 'Google Sheets API error'}` };
      }
      const actual = Array.isArray(data.values?.[0]) ? data.values[0].map(v => String(v ?? '').trim()) : [];
      const mismatch = expected.findIndex((value, index) => actual[index] !== value);
      if (mismatch >= 0) {
        return {
          tab,
          ok: false,
          error: `Header mismatch at column ${columnName(mismatch + 1)}: expected "${expected[mismatch]}", found "${actual[mismatch] || '(empty)'}"`
        };
      }
      return { tab, ok: true };
    }));

    for (const check of checks) if (!check.ok) schemaErrors.push({ tab: check.tab, error: check.error });

    return h.json(200, {
      ok: missingTabs.length === 0 && schemaErrors.length === 0,
      folder: { name: folder.name, type: folder.mimeType },
      spreadsheet: { name: sheet.properties?.title, tabs },
      missingTabs,
      schemaErrors,
      schemaStatus: schemaErrors.length ? 'invalid' : 'valid'
    }, state.newCookie ? { 'Set-Cookie': state.newCookie } : {});
  } catch (error) {
    return h.json(502, { error: 'Cannot reach Google APIs: ' + (error.message || 'network error') }, state.newCookie ? { 'Set-Cookie': state.newCookie } : {});
  }
};

// Adds misc_fr and misc_en columns to Bilder, Objekte, Serien sheets.
// Run while Datenbank.xlsx is CLOSED in Excel.
// Idempotent: skips a sheet if misc_fr/misc_en already exist.
//
// Bilder: inserts misc_fr/misc_en after misc, before technique_fr/technique_en
// Objekte: appends misc_fr/misc_en after misc
// Serien: appends misc_fr/misc_en after misc

const XLSX = require('xlsx');
const path = require('path');

const xlsxPath = path.join(__dirname, '..', 'Datenbank.xlsx');
const wb = XLSX.readFile(xlsxPath, { codepage: 65001 });

// Translation table (German → fr / en)
const TRANS = {
  'Privatbesitz':  { fr: 'Collection priv\u00e9e',  en: 'Private collection' },
  'unverk\u00e4uflich': { fr: 'Indisponible',       en: 'Not for sale' },
};

function translate(val, lang) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (!s) return null;
  return (TRANS[s] && TRANS[s][lang]) ? TRANS[s][lang] : null;
}

// Insert columns at given index (0-based) into every row of aoa data
function insertCols(data, insertAt, ...newHeaders) {
  return data.map((row, i) => {
    const r = [...row];
    if (i === 0) {
      r.splice(insertAt, 0, ...newHeaders);
    } else {
      r.splice(insertAt, 0, ...newHeaders.map(() => null));
    }
    return r;
  });
}

function processSheet(sheetName) {
  const ws = wb.Sheets[sheetName];
  let data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

  const header = data[0];

  if (header.includes('misc_fr') || header.includes('misc_en')) {
    console.log(sheetName + ': misc_fr/misc_en already present — skipping column insertion, re-filling values.');
    const miscIdx  = header.indexOf('misc');
    const frIdx    = header.indexOf('misc_fr');
    const enIdx    = header.indexOf('misc_en');
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const miscVal = row[miscIdx];
      row[frIdx] = translate(miscVal, 'fr');
      row[enIdx] = translate(miscVal, 'en');
    }
  } else {
    const miscIdx  = header.indexOf('misc');
    const insertAt = miscIdx + 1;
    console.log(sheetName + ': inserting misc_fr/misc_en at column index ' + insertAt);
    console.log('  Before: ' + JSON.stringify(header));
    data = insertCols(data, insertAt, 'misc_fr', 'misc_en');
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const miscVal = row[miscIdx];
      row[insertAt]     = translate(miscVal, 'fr');
      row[insertAt + 1] = translate(miscVal, 'en');
    }
    console.log('  After:  ' + JSON.stringify(data[0]));
  }

  wb.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(data);
}

processSheet('Bilder');
processSheet('Objekte');
processSheet('Serien');

// ── Save ───────────────────────────────────────────────────────────────────
XLSX.writeFile(wb, xlsxPath, { bookType: 'xlsx', type: 'file' });
console.log('\nDatenbank.xlsx saved.');

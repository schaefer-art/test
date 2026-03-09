// Run this when Datenbank.xlsx is NOT open in Excel.
// Fixes 110 rows in the Bilder sheet that had technique_fr/technique_en
// shifted left into the misc/technique_fr columns (because misc was empty).

const XLSX = require('xlsx');
const path = require('path');

const xlsxPath = path.join(__dirname, '..', 'Datenbank.xlsx');
const wb = XLSX.readFile(xlsxPath);
const ws = wb.Sheets['Bilder'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

const header = data[0];
// Expected: [technique, title, year, size, filename, misc, technique_fr, technique_en]
console.log('Header:', header);

const fixed = [header];
let fixedCount = 0;

for (let i = 1; i < data.length; i++) {
  const row = data[i];
  if (row.length === 7) {
    // misc slot was empty and technique_fr/technique_en shifted left
    // row[5] = technique_fr (should be misc=null), row[6] = technique_en (should be technique_fr)
    const newRow = [row[0], row[1], row[2], row[3], row[4], null, row[5], row[6]];
    fixed.push(newRow);
    fixedCount++;
  } else {
    fixed.push(row);
  }
}

console.log('Fixed', fixedCount, 'rows (inserted empty misc cell).');

const newWs = XLSX.utils.aoa_to_sheet(fixed);
wb.Sheets['Bilder'] = newWs;
XLSX.writeFile(wb, xlsxPath);
console.log('Datenbank.xlsx saved.');

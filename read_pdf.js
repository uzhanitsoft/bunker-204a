const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Install adm-zip if not present
try { require.resolve('adm-zip'); } catch(e) {
  console.log('Installing adm-zip...');
  execSync('npm install adm-zip', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
}

const AdmZip = require('adm-zip');

// DOCX is just a ZIP file with XML inside
const docxPath = path.join(__dirname, '..', 'BUNKER 204A TZ.docx');
const zip = new AdmZip(docxPath);
const xml = zip.readAsText('word/document.xml');

// Strip XML tags and clean up
let text = xml
  .replace(/<w:p[^>]*>/g, '\n')       // paragraphs -> newlines
  .replace(/<w:tab\/>/g, '\t')         // tabs
  .replace(/<w:br\/>/g, '\n')          // breaks
  .replace(/<[^>]+>/g, '')             // strip all XML tags
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\n{3,}/g, '\n\n')          // collapse multiple newlines
  .trim();

const outputPath = path.join(__dirname, 'BUNKER_204A_TZ.txt');
fs.writeFileSync(outputPath, text, 'utf-8');

console.log('=== BUNKER 204A TZ ===\n');
console.log(text);
console.log('\n\n--- Saved to:', outputPath, '---');

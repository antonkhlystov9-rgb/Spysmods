// Validates story files. Usage: node tools/check-stories.js <file.json> [...]   (no arguments = every file in content/stories)
const fs = require('fs'); const path = require('path');
const dir = path.resolve(__dirname, '..', 'content', 'stories');
const files = process.argv.length > 2 ? process.argv.slice(2) : fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => path.join(dir, f));
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;
let bad = 0, total = 0, wordsAll = 0;
for (const f of files) {
  const errs = []; let d;
  try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.log(`${path.basename(f)}: INVALID JSON - ${e.message}`); bad++; continue; }
  const poetry = d.section === 'Poetry';
  if (!Array.isArray(d.series) || d.series.length !== 4) errs.push(`needs exactly 4 series, has ${d.series && d.series.length}`);
  for (const s of d.series || []) {
    if (!Array.isArray(s.volumes) || s.volumes.length !== 12) { errs.push(`"${s.name}" needs exactly 12 volumes, has ${s.volumes && s.volumes.length}`); continue; }
    s.volumes.forEach((v, i) => {
      const at = `"${s.name}" vol ${i + 1}`;
      if (typeof v.title !== 'string' || typeof v.text !== 'string') return errs.push(`${at}: title and text must be strings`);
      const tw = words(v.title), n = words(v.text), lo = poetry ? 55 : 105, hi = poetry ? 135 : 158;
      if (tw < 1 || tw > 7 || /volume|vol\./i.test(v.title)) errs.push(`${at}: bad title "${v.title}"`);
      if (n < lo || n > hi) errs.push(`${at}: ${n} words (want ${poetry ? '60-130' : '110-150'})`);
      if (/[*_#`]|\bhttps?:/.test(v.text)) errs.push(`${at}: contains markdown or a link`);
      if (!poetry && !v.text.includes('\n\n')) errs.push(`${at}: needs 2-3 paragraphs separated by a blank line`);
      total++; wordsAll += n;
    });
  }
  if (errs.length) { bad++; console.log(`${path.basename(f)}: ${errs.length} problem(s)\n  - ` + errs.join('\n  - ')); } else console.log(`${path.basename(f)}: ok`);
}
console.log(`${files.length} file(s), ${total} volumes, ${wordsAll} words, ${bad} file(s) with problems`);
process.exit(bad ? 1 : 0);

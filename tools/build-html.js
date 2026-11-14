// Packs the whole game into ONE html file: double-click it and it plays in the browser.
// Nothing to install, no internet needed, and nothing for an antivirus to object to.
//
// Usage: node tools/build-html.js [output.html] [--cdn] [--fragment]
//   --cdn       load three.js from cdnjs instead of embedding it (smaller file, needs internet)
//   --fragment  leave out the <html>/<head>/<body> wrapper, for hosts that add their own (implies --cdn)
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src');
const args = process.argv.slice(2);
const fragment = args.includes('--fragment');
const cdn = fragment || args.includes('--cdn');
const out = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'dist', 'The-Night-Shelver.html'));
const read = (file) => fs.readFileSync(path.join(src, file), 'utf8');

const icon = 'data:image/png;base64,' + fs.readFileSync(path.join(src, 'icon.png')).toString('base64');
let html = read('index.html');
// every edit must find its target, so a change to index.html cannot silently produce a broken file
const swap = (re, to) => { if (!re.test(html)) throw new Error('index.html no longer contains ' + re); html = html.replace(re, to); };

swap(/[ \t]*<meta http-equiv="Content-Security-Policy"[^>]*>\n/, '');      // inline scripts would be blocked by it
swap(/[ \t]*<link rel="manifest"[^>]*>\n/, '');                             // a single file is not an installable site
swap(/<link rel="icon"[^>]*>/, () => `<link rel="icon" type="image/png" href="${icon}">`);
swap(/<link rel="stylesheet" href="css\/style\.css">/, () => '<style>\n' + read('css/style.css') + '</style>');

let scripts = 0;
html = html.replace(/<script src="([^"]+)"><\/script>/g, (tag, file) => {
  scripts++;
  if (cdn && /three/.test(file)) return '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>';
  let js = read(file);
  if (file.endsWith('ui.js')) {
    if (!js.includes('src="icon.png"')) throw new Error('ui.js no longer uses icon.png');
    js = js.split('src="icon.png"').join(`src="${icon}"`);
  }
  // text that would end the <script> element early, or confuse the HTML parser
  js = js.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
  return '<script>\n' + js + '\n</script>';
});
if (scripts < 8) throw new Error('expected 8 scripts in index.html, found ' + scripts);
if (/<script src="(?!https:)/.test(html) || /href="(css|js)\//.test(html)) throw new Error('something was left pointing at a separate file');

if (fragment) {
  html = html.replace(/<!doctype html>\s*/i, '').replace(/<\/?(html|head|body)[^>]*>\s*/gi, '').replace(/[ \t]*<meta (charset|name="viewport")[^>]*>\n/g, '');
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`${path.relative(process.cwd(), out)}  ${(fs.statSync(out).size / 1048576).toFixed(2)} MB  (${scripts} scripts inlined${cdn ? ', three.js from cdnjs' : ''})`);

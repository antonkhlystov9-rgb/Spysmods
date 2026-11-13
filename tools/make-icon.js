// Renders the app icon (build/icon.png): three book spines on a shelf.
const fs = require('fs'); const path = require('path'); const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const url = await p.evaluate(() => {
    const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
    x.beginPath(); x.roundRect(16, 16, 480, 480, 110); x.fillStyle = '#2b3a66'; x.fill();
    x.lineWidth = 16; x.strokeStyle = '#3b2a1d'; x.stroke();
    x.fillStyle = '#f3d9a4'; for (const [sx, sy, r] of [[120, 110, 7], [400, 90, 5], [330, 150, 4], [200, 70, 4]]) { x.beginPath(); x.arc(sx, sy, r, 0, 7); x.fill(); }
    const book = (bx, w, h, col, tilt) => {
      x.save(); x.translate(bx + w / 2, 400); x.rotate(tilt); x.lineJoin = 'round';
      x.beginPath(); x.roundRect(-w / 2, -h, w, h, 10); x.fillStyle = col; x.fill(); x.lineWidth = 12; x.strokeStyle = '#3b2a1d'; x.stroke();
      x.fillStyle = 'rgba(255,246,226,.9)'; x.fillRect(-w / 2 + 6, -h + 34, w - 12, 14); x.fillRect(-w / 2 + 6, -52, w - 12, 14);
      x.fillRect(-w / 2 + 16, -h + 80, w - 32, 54);
      x.restore();
    };
    book(112, 86, 250, '#b9433c', 0); book(204, 78, 290, '#e9a94b', 0); book(300, 88, 262, '#4f9a6a', 0.19);
    x.fillStyle = '#8a5a3a'; x.beginPath(); x.roundRect(60, 400, 392, 34, 8); x.fill(); x.lineWidth = 12; x.strokeStyle = '#3b2a1d'; x.stroke();
    return c.toDataURL('image/png');
  });
  fs.writeFileSync(path.resolve(__dirname, '..', 'build', 'icon.png'), Buffer.from(url.split(',')[1], 'base64'));
  await b.close();
})();

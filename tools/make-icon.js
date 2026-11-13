// Renders the app icon (build/icon.png) from the game's own item art.
const fs = require('fs'); const path = require('path'); const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.resolve(__dirname, '..', 'src', 'index.html'));
  const url = await p.evaluate(() => {
    const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
    x.beginPath(); x.roundRect(16, 16, 480, 480, 110); x.fillStyle = '#f0c064'; x.fill();
    x.lineWidth = 16; x.strokeStyle = '#4b382a'; x.stroke();
    x.fillStyle = '#e2a64a'; for (let i = 0; i < 6; i++) { x.save(); x.beginPath(); x.roundRect(24, 24, 464, 464, 102); x.clip(); x.fillRect(40 + i * 90, 0, 44, 512); x.restore(); }
    TH.Draw.paint(x, 'jam_r', 256, 262, 400);
    return c.toDataURL('image/png');
  });
  fs.writeFileSync(path.resolve(__dirname, '..', 'build', 'icon.png'), Buffer.from(url.split(',')[1], 'base64'));
  await b.close();
})();

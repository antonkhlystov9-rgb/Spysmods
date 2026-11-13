// Renders the app icon: build/icon.png (512px), build/icon.ico (16-256px, for Windows) and src/icon.png (in-game + browser tab).
const fs = require('fs'); const path = require('path'); const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const SIZES = [16, 24, 32, 48, 64, 128, 256];
  const out = await p.evaluate((sizes) => {
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
    const scaled = (n) => { const s = document.createElement('canvas'); s.width = s.height = n; const g = s.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, n, n); return s; };
    return {
      png512: c.toDataURL('image/png'), png256: scaled(256).toDataURL('image/png'),
      raw: sizes.filter((n) => n < 256).map((n) => Array.from(scaled(n).getContext('2d').getImageData(0, 0, n, n).data))
    };
  }, SIZES);
  await b.close();
  const b64 = (u) => Buffer.from(u.split(',')[1], 'base64');
  const dir = path.resolve(__dirname, '..');
  fs.writeFileSync(path.join(dir, 'build', 'icon.png'), b64(out.png512));
  fs.writeFileSync(path.join(dir, 'src', 'icon.png'), b64(out.png256));

  // .ico: classic 32-bit bitmaps for the small sizes, PNG for 256px
  const images = SIZES.map((n, i) => {
    if (n === 256) return b64(out.png256);
    const px = out.raw[i], rowMask = Math.ceil(n / 32) * 4, buf = Buffer.alloc(40 + n * n * 4 + rowMask * n);
    buf.writeUInt32LE(40, 0); buf.writeInt32LE(n, 4); buf.writeInt32LE(n * 2, 8); buf.writeUInt16LE(1, 12); buf.writeUInt16LE(32, 14); buf.writeUInt32LE(n * n * 4 + rowMask * n, 20);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const s = ((n - 1 - y) * n + x) * 4, d = 40 + (y * n + x) * 4;      // bottom-up, BGRA
      buf[d] = px[s + 2]; buf[d + 1] = px[s + 1]; buf[d + 2] = px[s]; buf[d + 3] = px[s + 3];
    }
    return buf;
  });
  const head = Buffer.alloc(6 + 16 * images.length);
  head.writeUInt16LE(1, 2); head.writeUInt16LE(images.length, 4);
  let off = head.length;
  images.forEach((img, i) => {
    const n = SIZES[i], e = 6 + i * 16;
    head[e] = n === 256 ? 0 : n; head[e + 1] = n === 256 ? 0 : n; head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(img.length, e + 8); head.writeUInt32LE(off, e + 12); off += img.length;
  });
  fs.writeFileSync(path.join(dir, 'build', 'icon.ico'), Buffer.concat([head, ...images]));
  console.log('icon.png, icon.ico (' + SIZES.join(', ') + ' px) and src/icon.png written');
})();

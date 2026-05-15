// Generates PWA icons (PNGs) from scratch using only Node built-ins.
// Design: blue (#2563eb) background, three white stacked "box" outlines
// suggesting inventory. Re-run with `node scripts/gen-icons.js` if you
// want to tweak the design.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BG = [37, 99, 235, 255]; // tailwind blue-600
const FG = [255, 255, 255, 255];

function makePng(size, draw) {
  const width = size;
  const height = size;
  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = draw(x, y, width, height);
      const o = y * rowSize + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }
  const compressed = zlib.deflateSync(raw);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = chunk(
    'IHDR',
    Buffer.concat([u32(width), u32(height), Buffer.from([8, 6, 0, 0, 0])])
  );
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n);
  return b;
}

function chunk(type, data) {
  const len = u32(data.length);
  const typeBuf = Buffer.from(type);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  return Buffer.concat([len, typeBuf, data, crc]);
}

let crcTable;
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return u32((c ^ 0xffffffff) >>> 0);
}

function draw(x, y, w, h) {
  // Stroke width as a fraction of the icon size
  const s = 0.045;

  // Three boxes (outlines) suggesting stacked inventory:
  //   top-center, bottom-left, bottom-right
  const boxes = [
    [0.35, 0.16, 0.65, 0.46],
    [0.16, 0.5, 0.46, 0.84],
    [0.54, 0.5, 0.84, 0.84],
  ];

  for (const [x1, y1, x2, y2] of boxes) {
    const insideOuter =
      x >= w * x1 && x < w * x2 && y >= h * y1 && y < h * y2;
    const insideInner =
      x >= w * (x1 + s) &&
      x < w * (x2 - s) &&
      y >= h * (y1 + s) &&
      y < h * (y2 - s);
    if (insideOuter && !insideInner) return FG;
  }
  return BG;
}

const outDir = path.resolve(__dirname, '..', 'public');
const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32.png', size: 32 },
];

for (const { name, size } of sizes) {
  const png = makePng(size, draw);
  fs.writeFileSync(path.join(outDir, name), png);
  // eslint-disable-next-line no-console
  console.log('Wrote', name, '(' + size + 'x' + size + ')');
}

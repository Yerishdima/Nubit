// Generates PNG icons (16/32/48/128) without external dependencies.
// Draws a rounded indigo→violet square with a white play triangle and a small "spark" dot.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '..', 'static', 'icons');
mkdirSync(outDir, { recursive: true });

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Supersampled rendering for smooth edges.
function render(size) {
  const ss = 4;
  const big = size * ss;
  const radius = big * 0.22;
  const inRounded = (x, y) => {
    const rx = Math.max(radius - x, 0, x - (big - 1 - radius));
    const ry = Math.max(radius - y, 0, y - (big - 1 - radius));
    return rx * rx + ry * ry <= radius * radius;
  };
  // Play triangle: points (0.34,0.26) (0.34,0.74) (0.76,0.5)
  const inTri = (x, y) => {
    const px = x / big, py = y / big;
    const ax = 0.34, ay = 0.26, bx = 0.34, by = 0.74, cx = 0.76, cy = 0.5;
    const s1 = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
    const s2 = (cx - bx) * (py - by) - (cy - by) * (px - bx);
    const s3 = (ax - cx) * (py - cy) - (ay - cy) * (px - cx);
    return (s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0);
  };
  const inSpark = (x, y) => {
    const dx = x / big - 0.8, dy = y / big - 0.22;
    return dx * dx + dy * dy <= 0.08 * 0.08;
  };
  return (x, y) => {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < ss; sy++) {
      for (let sx = 0; sx < ss; sx++) {
        const X = x * ss + sx, Y = y * ss + sy;
        if (!inRounded(X, Y)) continue;
        const t = (X + Y) / (2 * big);
        let cr = 79 + (139 - 79) * t, cg = 70 + (92 - 70) * t, cb = 229 + (246 - 229) * t;
        if (inTri(X, Y) || inSpark(X, Y)) { cr = 255; cg = 255; cb = 255; }
        r += cr; g += cg; b += cb; a += 255;
      }
    }
    const n = ss * ss;
    if (a === 0) return [0, 0, 0, 0];
    const cov = a / n / 255;
    return [Math.round(r / (a / 255)), Math.round(g / (a / 255)), Math.round(b / (a / 255)), Math.round(cov * 255)];
  };
}

for (const size of [16, 32, 48, 128]) {
  writeFileSync(path.join(outDir, `icon${size}.png`), png(size, render(size)));
}
console.log('icons written to', outDir);

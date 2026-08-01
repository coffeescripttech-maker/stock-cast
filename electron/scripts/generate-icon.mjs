/**
 * Generates the Ruiz Store POS app icon:
 *   - `build/icon.png`  — 512×512 source (also used for macOS .icns conversion)
 *   - `build/icon.ico`  — multi-size Windows icon (16→256 px, PNG-compressed),
 *     used directly by electron-builder so no runtime image conversion is needed.
 *
 * Uses only Node built-ins (zlib for PNG IDAT compression), so it runs on any
 * machine without extra dependencies.
 *
 * Replace build/icon.png (and re-run this script for the .ico) with a real
 * brand logo whenever you want — nothing else changes.
 *
 * Run:  node electron/scripts/generate-icon.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PNG = resolve(__dirname, '..', '..', 'build', 'icon.png');
const OUT_ICO = resolve(__dirname, '..', '..', 'build', 'icon.ico');
const SIZE = 512;

const BRAND = [0x86, 0x3b, 0xff, 255]; // #863bff — matches public/favicon.svg
const WHITE = [255, 255, 255, 255];

// ---------------------------------------------------------------------------
// Minimal PNG encoder (RGBA, 8-bit, non-interlaced)
// ---------------------------------------------------------------------------

const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const idat = deflateSync(raw);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

const px = Buffer.alloc(SIZE * SIZE * 4); // transparent canvas

function setPixel(x, y, c) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
  px[i + 3] = c[3];
}

function fillRect(x0, y0, x1, y1, c) {
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) setPixel(x, y, c);
  }
}

function fillCircle(cx, cy, r, c) {
  for (let y = cy - r; y <= cy + r; y += 1) {
    for (let x = cx - r; x <= cx + r; x += 1) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) setPixel(x, y, c);
    }
  }
}

function inRoundedRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = x < x0 + r ? x0 + r : x > x1 - r ? x1 - r : x;
  const cy = y < y0 + r ? y0 + r : y > y1 - r ? y1 - r : y;
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

// Brand rounded-square background.
const M = 40; // margin
const R = 96; // corner radius
for (let y = 0; y < SIZE; y += 1) {
  for (let x = 0; x < SIZE; x += 1) {
    if (inRoundedRect(x, y, M, M, SIZE - M, SIZE - M, R)) setPixel(x, y, BRAND);
  }
}

// Simple white "storefront" glyph: awning + facade with door and windows.
fillRect(140, 170, 372, 200, WHITE); // awning band
const stripes = 6;
const stripeW = (372 - 140) / stripes;
for (let i = 0; i < stripes; i += 1) {
  fillRect(140 + Math.round(i * stripeW), 170, 140 + Math.round(i * stripeW) + 16, 200, BRAND);
}
fillRect(140, 200, 372, 390, WHITE); // facade
fillRect(226, 260, 286, 390, BRAND); // door
fillCircle(276, 324, 8, WHITE); // door knob
fillRect(160, 240, 204, 292, BRAND); // left window
fillRect(308, 240, 352, 292, BRAND); // right window

// ---------------------------------------------------------------------------
// ICO container (multi-size, PNG-compressed entries — Windows Vista+ renders
// PNG entries at any size, so the shell picks the best match and scales down).
// ---------------------------------------------------------------------------

function downscale(rgba, from, to) {
  // Premultiplied-alpha box average keeps rounded-corner edges clean.
  const out = Buffer.alloc(to * to * 4);
  const ratio = from / to;
  for (let y = 0; y < to; y += 1) {
    for (let x = 0; x < to; x += 1) {
      const x0 = Math.floor(x * ratio);
      const x1 = Math.max(Math.floor((x + 1) * ratio), x0 + 1);
      const y0 = Math.floor(y * ratio);
      const y1 = Math.max(Math.floor((y + 1) * ratio), y0 + 1);
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let sy = y0; sy < y1; sy += 1) {
        for (let sx = x0; sx < x1; sx += 1) {
          const i = (sy * from + sx) * 4;
          const al = rgba[i + 3] / 255;
          r += rgba[i] * al;
          g += rgba[i + 1] * al;
          b += rgba[i + 2] * al;
          a += rgba[i + 3];
          n += 1;
        }
      }
      const o = (y * to + x) * 4;
      const outA = a / n;
      if (outA > 0) {
        const scale = 255 / outA;
        out[o] = Math.round((r / n) * scale);
        out[o + 1] = Math.round((g / n) * scale);
        out[o + 2] = Math.round((b / n) * scale);
      }
      out[o + 3] = Math.round(outA);
    }
  }
  return out;
}

function encodeIco(images) {
  // images: [{ size, png: Buffer }]
  const count = images.length;
  const offset = 6 + count * 16;
  const buf = Buffer.alloc(offset + images.reduce((s, im) => s + im.png.length, 0));
  buf.writeUInt16LE(0, 0); // reserved
  buf.writeUInt16LE(1, 2); // type: icon
  buf.writeUInt16LE(count, 4);
  let cursor = offset;
  images.forEach((im, i) => {
    const e = 6 + i * 16;
    buf[e] = im.size >= 256 ? 0 : im.size; // width (0 = 256)
    buf[e + 1] = im.size >= 256 ? 0 : im.size; // height
    buf[e + 2] = 0; // palette colors
    buf[e + 3] = 0; // reserved
    buf.writeUInt16LE(1, e + 4); // color planes
    buf.writeUInt16LE(32, e + 6); // bits per pixel
    buf.writeUInt32LE(im.png.length, e + 8); // bytes in resource
    buf.writeUInt32LE(cursor, e + 12); // image data offset
    im.png.copy(buf, cursor);
    cursor += im.png.length;
  });
  return buf;
}

// ---------------------------------------------------------------------------

mkdirSync(dirname(OUT_PNG), { recursive: true });
writeFileSync(OUT_PNG, encodePng(SIZE, SIZE, px));
console.log(`Wrote ${OUT_PNG}`);

const ICO_SIZES = [256, 128, 64, 48, 32, 24, 16];
const icoImages = ICO_SIZES.map((s) => ({
  size: s,
  png: encodePng(s, s, downscale(px, SIZE, s)),
}));
writeFileSync(OUT_ICO, encodeIco(icoImages));
console.log(`Wrote ${OUT_ICO} (sizes: ${ICO_SIZES.join(', ')})`);

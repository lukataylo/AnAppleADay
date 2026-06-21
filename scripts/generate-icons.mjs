// Generates brand PWA icons without any image dependency: a warm vertical
// gradient with a centered accent dot, written as valid PNGs.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const OUT = new URL("../apps/web/public/", import.meta.url);
mkdirSync(OUT, { recursive: true });

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function makePng(size) {
  const top = [26, 5, 9];
  const bottom = [196, 54, 74];
  const accent = [255, 210, 122];
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const cx = size / 2;
  const cy = size * 0.46;
  const r = size * 0.17;
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter byte
    const t = y / (size - 1);
    const bg = [
      lerp(top[0], bottom[0], t),
      lerp(top[1], bottom[1], t),
      lerp(top[2], bottom[2], t),
    ];
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - cx, y - cy);
      const inDot = d < r;
      const glow = Math.max(0, 1 - (d - r) / (r * 0.6));
      let col = bg;
      if (inDot) col = accent;
      else if (glow > 0)
        col = [
          lerp(bg[0], accent[0], glow * 0.5),
          lerp(bg[1], accent[1], glow * 0.5),
          lerp(bg[2], accent[2], glow * 0.5),
        ];
      raw[p++] = col[0];
      raw[p++] = col[1];
      raw[p++] = col[2];
      raw[p++] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return png;
}

for (const size of [192, 512]) {
  writeFileSync(new URL(`icon-${size}.png`, OUT), makePng(size));
  console.log(`wrote icon-${size}.png`);
}

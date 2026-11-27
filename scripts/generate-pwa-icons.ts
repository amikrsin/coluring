/**
 * Pure Node.js PNG icon generator for ColorWorld PWA assets.
 * Generates 4x supersampled anti-aliased RGBA PNG icons:
 *  - public/pwa-192x192.png (purpose: any)
 *  - public/pwa-512x512.png (purpose: any)
 *  - public/pwa-maskable-512x512.png (purpose: maskable, 14% safe-zone padding)
 *  - public/apple-touch-icon.png (180x180, iOS Safari home screen)
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

type RGB = [number, number, number];

const NAVY: RGB = [15, 30, 54]; // #0F1E36
const RED: RGB = [230, 57, 70]; // #E63946
const GOLD: RGB = [255, 183, 3]; // #FFB703
const TEAL: RGB = [42, 157, 143]; // #2A9D8F
const GREEN: RGB = [56, 176, 0]; // #38B000
const WHITE: RGB = [255, 255, 255];
const SKY: RGB = [56, 189, 248]; // #38BDF8

// CRC32 table for valid PNG chunks
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width: number, height: number, rgba: Uint8Array): Buffer {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter None
    rgba.subarray(y * stride, (y + 1) * stride).forEach((v, i) => {
      raw[y * (stride + 1) + 1 + i] = v;
    });
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function sampleIcon(u: number, v: number, maskable: boolean): [number, number, number, number] {
  // u, v in [0, 1]
  // For maskable icons, keep artwork within central 72% safe zone on full-bleed navy
  const scale = maskable ? 0.72 : 0.92;
  const x = ((u - 0.5) / scale + 0.5) * 512;
  const y = ((v - 0.5) / scale + 0.5) * 512;

  let col: RGB = NAVY;

  // Rounded-rect clipping only for non-maskable icons (maskable MUST be full-bleed square)
  if (!maskable) {
    const r = 112;
    const ux = u * 512;
    const uy = v * 512;
    const dx = Math.max(r - ux, 0, ux - (512 - r));
    const dy = Math.max(r - uy, 0, uy - (512 - r));
    if (dx * dx + dy * dy > r * r) {
      return [0, 0, 0, 0];
    }
  }

  const inCircle = (cx: number, cy: number, rad: number) => {
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= rad * rad;
  };

  if (inCircle(256, 256, 176)) {
    col = RED;
    if (inCircle(332, 312, 46)) col = NAVY;
    else if (inCircle(204, 176, 32)) col = GOLD;
    else if (inCircle(298, 164, 30)) col = TEAL;
    else if (inCircle(154, 258, 30)) col = GREEN;
    else if (inCircle(212, 340, 30)) col = WHITE;
    else if (inCircle(352, 222, 24)) col = SKY;
  }

  return [col[0], col[1], col[2], 255];
}

function renderIcon(size: number, maskable: boolean): Buffer {
  const rgba = new Uint8Array(size * size * 4);
  const samples = 4; // 4x4 supersampling for clean anti-aliased edges
  const invTotal = 1 / (samples * samples);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const u = (px + (sx + 0.5) / samples) / size;
          const v = (py + (sy + 0.5) / samples) / size;
          const [sr, sg, sb, sa] = sampleIcon(u, v, maskable);
          r += sr * (sa / 255);
          g += sg * (sa / 255);
          b += sb * (sa / 255);
          a += sa;
        }
      }

      const idx = (py * size + px) * 4;
      const alphaNorm = a * invTotal;
      if (alphaNorm > 0) {
        const invA = 255 / alphaNorm;
        rgba[idx] = Math.round(Math.min(255, r * invTotal * invA));
        rgba[idx + 1] = Math.round(Math.min(255, g * invTotal * invA));
        rgba[idx + 2] = Math.round(Math.min(255, b * invTotal * invA));
        rgba[idx + 3] = Math.round(Math.min(255, alphaNorm));
      }
    }
  }

  return encodePng(size, size, rgba);
}

const outDir = path.resolve(process.cwd(), 'public');
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  { file: 'pwa-192x192.png', size: 192, maskable: false },
  { file: 'pwa-512x512.png', size: 512, maskable: false },
  { file: 'pwa-maskable-512x512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: true },
];

for (const t of targets) {
  const buf = renderIcon(t.size, t.maskable);
  fs.writeFileSync(path.join(outDir, t.file), buf);
  console.log(`Generated public/${t.file} (${t.size}x${t.size}, ${buf.length} bytes)`);
}

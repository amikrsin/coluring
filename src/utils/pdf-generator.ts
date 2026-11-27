import { PaperSize } from '../types';
import { LINE_ART_LIBRARY } from '../data/line-art';

/**
 * Pure TypeScript PDF 1.4 Vector Generator (zero Node/DOM dependencies).
 * Works natively in Cloudflare Workers (Edge), Express/Node, and Browsers.
 * Translates SVG shapes (rect, circle, ellipse, line, polygon, path) into
 * crisp vector PDF drawing commands sized to A4 (595.28 x 841.89 pt) or
 * US Letter (612 x 792 pt).
 */

const PAPER_DIMS: Record<PaperSize, { width: number; height: number; label: string }> = {
  a4: { width: 595.28, height: 841.89, label: 'A4 (210 x 297 mm)' },
  letter: { width: 612, height: 792, label: 'US Letter (8.5 x 11 in)' },
};

const KAPPA = 0.5522847498;

function fmt(n: number): string {
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

function escapePdfText(str: string): string {
  return str
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function getAttr(tag: string, name: string): string | null {
  const regex = new RegExp(`${name}="([^"]*)"`, 'i');
  const m = tag.match(regex);
  return m ? m[1] : null;
}

function numAttr(tag: string, name: string, fallback = 0): number {
  const val = getAttr(tag, name);
  if (!val) return fallback;
  const parsed = parseFloat(val);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function arcToBeziers(
  x1: number,
  y1: number,
  rxIn: number,
  ryIn: number,
  phiDeg: number,
  largeArc: number,
  sweep: number,
  x2: number,
  y2: number
): [number, number, number, number, number, number][] {
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx === 0 || ry === 0 || (x1 === x2 && y1 === y2)) {
    return [[x1, y1, x2, y2, x2, y2]];
  }

  const phi = (phiDeg * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cosPhi * dx + sinPhi * dy;
  const y1p = -sinPhi * dx + cosPhi * dy;

  const rxSq = rx * rx;
  const rySq = ry * ry;
  const x1pSq = x1p * x1p;
  const y1pSq = y1p * y1p;

  const lambda = x1pSq / rxSq + y1pSq / rySq;
  if (lambda > 1) {
    const scale = Math.sqrt(lambda);
    rx *= scale;
    ry *= scale;
  }

  const rxs = rx * rx;
  const rys = ry * ry;
  const num = Math.max(0, rxs * rys - rxs * y1pSq - rys * x1pSq);
  const den = rxs * y1pSq + rys * x1pSq || 1;
  const coef = (largeArc === sweep ? -1 : 1) * Math.sqrt(num / den);
  const cxp = (coef * rx * y1p) / ry;
  const cyp = (-coef * ry * x1p) / rx;

  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  const vecAngle = (ux: number, uy: number, vx: number, vy: number) => {
    const dot = ux * vx + uy * vy;
    const len = Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1;
    const clamped = Math.max(-1, Math.min(1, dot / len));
    const sign = ux * vy - uy * vx < 0 ? -1 : 1;
    return sign * Math.acos(clamped);
  };

  const theta1 = vecAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dTheta = vecAngle(
    (x1p - cxp) / rx,
    (y1p - cyp) / ry,
    (-x1p - cxp) / rx,
    (-y1p - cyp) / ry
  );
  if (!sweep && dTheta > 0) dTheta -= 2 * Math.PI;
  if (sweep && dTheta < 0) dTheta += 2 * Math.PI;

  const segments = Math.max(1, Math.ceil(Math.abs(dTheta) / (Math.PI / 2)));
  const delta = dTheta / segments;
  const t = (4 / 3) * Math.tan(delta / 4);

  const curves: [number, number, number, number, number, number][] = [];
  for (let i = 0; i < segments; i++) {
    const a1 = theta1 + i * delta;
    const a2 = a1 + delta;
    const cos1 = Math.cos(a1);
    const sin1 = Math.sin(a1);
    const cos2 = Math.cos(a2);
    const sin2 = Math.sin(a2);

    const p1x = cos1 - t * sin1;
    const p1y = sin1 + t * cos1;
    const p2x = cos2 + t * sin2;
    const p2y = sin2 - t * cos2;

    const mapPt = (px: number, py: number): [number, number] => [
      cosPhi * (rx * px) - sinPhi * (ry * py) + cx,
      sinPhi * (rx * px) + cosPhi * (ry * py) + cy,
    ];

    const [c1x, c1y] = mapPt(p1x, p1y);
    const [c2x, c2y] = mapPt(p2x, p2y);
    const [ex, ey] = mapPt(cos2, sin2);
    curves.push([c1x, c1y, c2x, c2y, ex, ey]);
  }
  return curves;
}

function convertSvgToPdfOps(
  svgInner: string,
  offsetX: number,
  offsetY: number,
  scale: number,
  pageHeight: number
): string {
  const tx = (x: number) => offsetX + x * scale;
  const ty = (y: number) => pageHeight - (offsetY + y * scale);

  const ops: string[] = [];
  ops.push('1 J 1 j'); // Round line cap & join for smooth crisp printing

  const tagRegex = /<(rect|circle|ellipse|line|polygon|path)\b([^>]*?)\/>/gi;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(svgInner)) !== null) {
    const tagName = match[1].toLowerCase();
    const attrs = match[2];

    const fill = getAttr(attrs, 'fill') || '#FFFFFF';
    const stroke = getAttr(attrs, 'stroke') || 'none';
    const strokeWidth = numAttr(attrs, 'stroke-width', 5) * scale;

    const isFilledBlack = fill.toLowerCase() === '#111111' || fill.toLowerCase() === '#000000';
    const isFilledWhite = fill.toLowerCase() === '#ffffff' || fill.toLowerCase() === 'white';
    const hasStroke = stroke !== 'none';

    ops.push('q');
    if (hasStroke) {
      ops.push('0.07 0.07 0.07 RG');
      ops.push(`${fmt(Math.max(0.8, strokeWidth))} w`);
    }
    if (isFilledBlack) {
      ops.push('0.07 0.07 0.07 rg');
    } else if (isFilledWhite) {
      ops.push('1 1 1 rg');
    }

    const paintOp = isFilledBlack
      ? hasStroke
        ? 'B'
        : 'f'
      : isFilledWhite
      ? hasStroke
        ? 'B'
        : 'f'
      : hasStroke
      ? 'S'
      : 'n';

    if (tagName === 'rect') {
      const x = numAttr(attrs, 'x');
      const y = numAttr(attrs, 'y');
      const w = numAttr(attrs, 'width');
      const h = numAttr(attrs, 'height');
      const rx = Math.min(numAttr(attrs, 'rx', 0), w / 2, h / 2);

      if (rx <= 0.1) {
        ops.push(`${fmt(tx(x))} ${fmt(ty(y + h))} ${fmt(w * scale)} ${fmt(h * scale)} re ${paintOp}`);
      } else {
        const k = rx * KAPPA;
        ops.push(`${fmt(tx(x + rx))} ${fmt(ty(y))} m`);
        ops.push(`${fmt(tx(x + w - rx))} ${fmt(ty(y))} l`);
        ops.push(
          `${fmt(tx(x + w - rx + k))} ${fmt(ty(y))} ${fmt(tx(x + w))} ${fmt(ty(y + rx - k))} ${fmt(tx(x + w))} ${fmt(ty(y + rx))} c`
        );
        ops.push(`${fmt(tx(x + w))} ${fmt(ty(y + h - rx))} l`);
        ops.push(
          `${fmt(tx(x + w))} ${fmt(ty(y + h - rx + k))} ${fmt(tx(x + w - rx + k))} ${fmt(ty(y + h))} ${fmt(tx(x + w - rx))} ${fmt(ty(y + h))} c`
        );
        ops.push(`${fmt(tx(x + rx))} ${fmt(ty(y + h))} l`);
        ops.push(
          `${fmt(tx(x + rx - k))} ${fmt(ty(y + h))} ${fmt(tx(x))} ${fmt(ty(y + h - rx + k))} ${fmt(tx(x))} ${fmt(ty(y + h - rx))} c`
        );
        ops.push(`${fmt(tx(x))} ${fmt(ty(y + rx))} l`);
        ops.push(
          `${fmt(tx(x))} ${fmt(ty(y + rx - k))} ${fmt(tx(x + rx - k))} ${fmt(ty(y))} ${fmt(tx(x + rx))} ${fmt(ty(y))} c`
        );
        ops.push(`h ${paintOp}`);
      }
    } else if (tagName === 'circle' || tagName === 'ellipse') {
      const cx = numAttr(attrs, 'cx');
      const cy = numAttr(attrs, 'cy');
      const rx = tagName === 'circle' ? numAttr(attrs, 'r') : numAttr(attrs, 'rx');
      const ry = tagName === 'circle' ? numAttr(attrs, 'r') : numAttr(attrs, 'ry');
      const kx = rx * KAPPA;
      const ky = ry * KAPPA;

      ops.push(`${fmt(tx(cx + rx))} ${fmt(ty(cy))} m`);
      ops.push(`${fmt(tx(cx + rx))} ${fmt(ty(cy + ky))} ${fmt(tx(cx + kx))} ${fmt(ty(cy + ry))} ${fmt(tx(cx))} ${fmt(ty(cy + ry))} c`);
      ops.push(`${fmt(tx(cx - kx))} ${fmt(ty(cy + ry))} ${fmt(tx(cx - rx))} ${fmt(ty(cy + ky))} ${fmt(tx(cx - rx))} ${fmt(ty(cy))} c`);
      ops.push(`${fmt(tx(cx - rx))} ${fmt(ty(cy - ky))} ${fmt(tx(cx - kx))} ${fmt(ty(cy - ry))} ${fmt(tx(cx))} ${fmt(ty(cy - ry))} c`);
      ops.push(`${fmt(tx(cx + kx))} ${fmt(ty(cy - ry))} ${fmt(tx(cx + rx))} ${fmt(ty(cy - ky))} ${fmt(tx(cx + rx))} ${fmt(ty(cy))} c`);
      ops.push(`h ${paintOp}`);
    } else if (tagName === 'line') {
      const x1 = numAttr(attrs, 'x1');
      const y1 = numAttr(attrs, 'y1');
      const x2 = numAttr(attrs, 'x2');
      const y2 = numAttr(attrs, 'y2');
      ops.push(`${fmt(tx(x1))} ${fmt(ty(y1))} m ${fmt(tx(x2))} ${fmt(ty(y2))} l S`);
    } else if (tagName === 'polygon') {
      const ptsRaw = (getAttr(attrs, 'points') || '').trim();
      const nums = ptsRaw.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
      if (nums.length >= 4) {
        ops.push(`${fmt(tx(nums[0]))} ${fmt(ty(nums[1]))} m`);
        for (let i = 2; i < nums.length - 1; i += 2) {
          ops.push(`${fmt(tx(nums[i]))} ${fmt(ty(nums[i + 1]))} l`);
        }
        ops.push(`h ${paintOp}`);
      }
    } else if (tagName === 'path') {
      const d = getAttr(attrs, 'd') || '';
      const tokens = d.match(/[MLCQAZmlcqaz]|-?\d*\.?\d+/g) || [];
      let idx = 0;
      let cmd = '';
      let curX = 0;
      let curY = 0;
      let startX = 0;
      let startY = 0;

      const nextNum = () => parseFloat(tokens[idx++] || '0');

      while (idx < tokens.length) {
        if (/^[MLCQAZmlcqaz]$/.test(tokens[idx])) {
          cmd = tokens[idx++];
        }
        if (cmd === 'M') {
          curX = nextNum();
          curY = nextNum();
          startX = curX;
          startY = curY;
          ops.push(`${fmt(tx(curX))} ${fmt(ty(curY))} m`);
          cmd = 'L';
        } else if (cmd === 'L') {
          curX = nextNum();
          curY = nextNum();
          ops.push(`${fmt(tx(curX))} ${fmt(ty(curY))} l`);
        } else if (cmd === 'C') {
          const x1 = nextNum();
          const y1 = nextNum();
          const x2 = nextNum();
          const y2 = nextNum();
          curX = nextNum();
          curY = nextNum();
          ops.push(`${fmt(tx(x1))} ${fmt(ty(y1))} ${fmt(tx(x2))} ${fmt(ty(y2))} ${fmt(tx(curX))} ${fmt(ty(curY))} c`);
        } else if (cmd === 'Q') {
          const qx = nextNum();
          const qy = nextNum();
          const ex = nextNum();
          const ey = nextNum();
          const c1x = curX + (2 / 3) * (qx - curX);
          const c1y = curY + (2 / 3) * (qy - curY);
          const c2x = ex + (2 / 3) * (qx - ex);
          const c2y = ey + (2 / 3) * (qy - ey);
          curX = ex;
          curY = ey;
          ops.push(`${fmt(tx(c1x))} ${fmt(ty(c1y))} ${fmt(tx(c2x))} ${fmt(ty(c2y))} ${fmt(tx(curX))} ${fmt(ty(curY))} c`);
        } else if (cmd === 'A') {
          const rx = nextNum();
          const ry = nextNum();
          const rot = nextNum();
          const laf = nextNum();
          const sf = nextNum();
          const ex = nextNum();
          const ey = nextNum();
          const beziers = arcToBeziers(curX, curY, rx, ry, rot, laf, sf, ex, ey);
          for (const [c1x, c1y, c2x, c2y, bx, by] of beziers) {
            ops.push(`${fmt(tx(c1x))} ${fmt(ty(c1y))} ${fmt(tx(c2x))} ${fmt(ty(c2y))} ${fmt(tx(bx))} ${fmt(ty(by))} c`);
          }
          curX = ex;
          curY = ey;
        } else if (cmd === 'Z' || cmd === 'z') {
          curX = startX;
          curY = startY;
          ops.push('h');
          cmd = '';
        } else {
          idx++;
        }
      }
      ops.push(paintOp);
    }

    ops.push('Q');
  }

  return ops.join('\n');
}

export function generateColoringPdfBytes(
  sheetId: string,
  title: string,
  paperSize: PaperSize
): Uint8Array {
  const { width, height, label } = PAPER_DIMS[paperSize] || PAPER_DIMS.a4;
  const art = LINE_ART_LIBRARY[sheetId] || LINE_ART_LIBRARY['dino-trex'];

  // Compute artwork box with clean print margins
  const marginX = 36;
  const headerH = 44;
  const footerH = 34;
  const availW = width - marginX * 2;
  const availH = height - headerH - footerH;

  const scale = Math.min(availW / 800, availH / 1000);
  const drawW = 800 * scale;
  const drawH = 1000 * scale;
  const offsetX = (width - drawW) / 2;
  const offsetY = headerH + (availH - drawH) / 2;

  const safeTitle = escapePdfText(title);
  const safeFooter = escapePdfText(`ColorWorld.com  |  Free Printable  |  ${label}`);

  const vectorOps = convertSvgToPdfOps(art.svgInner, offsetX, offsetY, scale, height);

  const contentStream = [
    // Crisp white page background
    `1 1 1 rg 0 0 ${fmt(width)} ${fmt(height)} re f`,
    // Header title
    `BT /F1 13 Tf 0.12 0.16 0.23 rg ${fmt(marginX)} ${fmt(height - 30)} Td (${safeTitle}) Tj ET`,
    `BT /F2 9 Tf 0.40 0.45 0.55 rg ${fmt(width - marginX - 110)} ${fmt(height - 29)} Td (${escapePdfText(label)}) Tj ET`,
    // Artwork vector commands
    vectorOps,
    // Quiet print footer
    `BT /F2 8.5 Tf 0.45 0.50 0.58 rg ${fmt(marginX)} 16 Td (${safeFooter}) Tj ET`,
  ].join('\n');

  const encoder = new TextEncoder();
  const streamBytes = encoder.encode(contentStream);

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${fmt(width)} ${fmt(height)}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n`,
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `6 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(encoder.encode(pdf).length);
    pdf += obj;
  }

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return encoder.encode(pdf);
}

export interface CombinedPdfPageInput {
  sheetId: string;
  title: string;
  jpegBytes?: Uint8Array;
  jpegWidth?: number;
  jpegHeight?: number;
}

function concatUint8Arrays(parts: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

/**
 * Builds a single multi-page PDF 1.4 binary containing all pages in the user's
 * Print Set (supporting both crisp vector SVG sheets and embedded JPEG renders
 * of direct PDF coloring pages).
 */
export function generateCombinedPdfBytes(
  pages: CombinedPdfPageInput[],
  paperSize: PaperSize
): Uint8Array {
  const { width, height, label } = PAPER_DIMS[paperSize] || PAPER_DIMS.a4;
  const encoder = new TextEncoder();

  const marginX = 36;
  const headerH = 44;
  const footerH = 34;
  const availW = width - marginX * 2;
  const availH = height - headerH - footerH;

  // Object 1: Catalog, Object 2: Pages, Object 3: Font Bold, Object 4: Font Regular
  const objectBuffers: Map<number, Uint8Array> = new Map();
  objectBuffers.set(3, encoder.encode('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n'));
  objectBuffers.set(4, encoder.encode('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'));

  let nextObjId = 5;
  const pageObjIds: number[] = [];

  for (const page of pages) {
    const safeTitle = escapePdfText(page.title);
    const safeFooter = escapePdfText(`ColorWorld.com  |  Free Printable  |  ${label}`);

    const pageObjId = nextObjId++;
    const contentObjId = nextObjId++;
    pageObjIds.push(pageObjId);

    if (page.jpegBytes && page.jpegWidth && page.jpegHeight) {
      const imgObjId = nextObjId++;
      const scale = Math.min(availW / page.jpegWidth, availH / page.jpegHeight);
      const drawW = page.jpegWidth * scale;
      const drawH = page.jpegHeight * scale;
      const offsetX = (width - drawW) / 2;
      const offsetY = footerH + (availH - drawH) / 2;

      const contentStream = [
        `1 1 1 rg 0 0 ${fmt(width)} ${fmt(height)} re f`,
        `BT /F1 13 Tf 0.12 0.16 0.23 rg ${fmt(marginX)} ${fmt(height - 30)} Td (${safeTitle}) Tj ET`,
        `BT /F2 9 Tf 0.40 0.45 0.55 rg ${fmt(width - marginX - 110)} ${fmt(height - 29)} Td (${escapePdfText(label)}) Tj ET`,
        `q ${fmt(drawW)} 0 0 ${fmt(drawH)} ${fmt(offsetX)} ${fmt(offsetY)} cm /Im0 Do Q`,
        `BT /F2 8.5 Tf 0.45 0.50 0.58 rg ${fmt(marginX)} 16 Td (${safeFooter}) Tj ET`,
      ].join('\n');

      const streamBytes = encoder.encode(contentStream);
      objectBuffers.set(
        pageObjId,
        encoder.encode(
          `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${fmt(width)} ${fmt(height)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << /Im0 ${imgObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`
        )
      );
      objectBuffers.set(
        contentObjId,
        encoder.encode(
          `${contentObjId} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`
        )
      );
      objectBuffers.set(
        imgObjId,
        concatUint8Arrays([
          encoder.encode(
            `${imgObjId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.jpegWidth} /Height ${page.jpegHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpegBytes.length} >>\nstream\n`
          ),
          page.jpegBytes,
          encoder.encode('\nendstream\nendobj\n'),
        ])
      );
    } else {
      const art = LINE_ART_LIBRARY[page.sheetId] || LINE_ART_LIBRARY['dino-trex'];
      const scale = Math.min(availW / 800, availH / 1000);
      const drawW = 800 * scale;
      const drawH = 1000 * scale;
      const offsetX = (width - drawW) / 2;
      const offsetY = headerH + (availH - drawH) / 2;

      const vectorOps = convertSvgToPdfOps(art.svgInner, offsetX, offsetY, scale, height);
      const contentStream = [
        `1 1 1 rg 0 0 ${fmt(width)} ${fmt(height)} re f`,
        `BT /F1 13 Tf 0.12 0.16 0.23 rg ${fmt(marginX)} ${fmt(height - 30)} Td (${safeTitle}) Tj ET`,
        `BT /F2 9 Tf 0.40 0.45 0.55 rg ${fmt(width - marginX - 110)} ${fmt(height - 29)} Td (${escapePdfText(label)}) Tj ET`,
        vectorOps,
        `BT /F2 8.5 Tf 0.45 0.50 0.58 rg ${fmt(marginX)} 16 Td (${safeFooter}) Tj ET`,
      ].join('\n');

      const streamBytes = encoder.encode(contentStream);
      objectBuffers.set(
        pageObjId,
        encoder.encode(
          `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${fmt(width)} ${fmt(height)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`
        )
      );
      objectBuffers.set(
        contentObjId,
        encoder.encode(
          `${contentObjId} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`
        )
      );
    }
  }

  objectBuffers.set(1, encoder.encode('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'));
  objectBuffers.set(
    2,
    encoder.encode(
      `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjIds.length} >>\nendobj\n`
    )
  );

  const totalObjs = nextObjId - 1;
  const header = encoder.encode('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');
  const chunks: Uint8Array[] = [header];
  const offsets: number[] = new Array(totalObjs + 1).fill(0);
  let bytePos = header.length;

  for (let id = 1; id <= totalObjs; id++) {
    const buf = objectBuffers.get(id)!;
    offsets[id] = bytePos;
    chunks.push(buf);
    bytePos += buf.length;
  }

  const xrefOffset = bytePos;
  let xref = `xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= totalObjs; id++) {
    xref += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(encoder.encode(xref));

  return concatUint8Arrays(chunks);
}


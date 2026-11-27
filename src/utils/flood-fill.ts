/**
 * High-performance iterative Scanline Flood-Fill engine for HTML5 Canvas.
 * - Uses typed Int32Array stack (zero recursion stack overflow on 1000x1250 canvases).
 * - Protects crisp black line-art outlines using an immutable ink mask.
 * - Eliminates white anti-aliased halos by expanding 1px cleanly into anti-aliased fringe pixels
 *   adjacent to dark outlines, then re-compositing original crisp line-art luminance.
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RgbColor {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const intVal = parseInt(full, 16);
  return {
    r: (intVal >> 16) & 255,
    g: (intVal >> 8) & 255,
    b: intVal & 255,
  };
}

/**
 * Builds an immutable luminance mask of original dark ink outlines (0 = white paper, 255 = pure black ink)
 * automatically from ANY rendered SVG, PNG, JPG, or PDF coloring page.
 * Protects both bold outlines and fine interior detail lines from flood-fill leaks and brush smudging.
 */
export function buildInkMask(baseImageData: ImageData, lineThreshold = 212): Uint8Array {
  const { data, width, height } = baseImageData;
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    mask[i] = lum < lineThreshold ? Math.min(255, Math.round(((lineThreshold - lum) / lineThreshold) * 255)) : 0;
  }
  return mask;
}

/**
 * Applies original crisp dark ink lines back onto the canvas ImageData
 * using multiply-like blending so filled colors sit seamlessly behind razor-sharp outlines.
 */
export function reapplyInkLines(imageData: ImageData, inkMask: Uint8Array): void {
  const data = imageData.data;
  const len = inkMask.length;
  for (let i = 0; i < len; i++) {
    const ink = inkMask[i];
    if (ink > 16) {
      const idx = i * 4;
      const factor = 1 - ink / 255;
      // Blend toward #111111 (17, 17, 17)
      data[idx] = Math.round(data[idx] * factor + 17 * (1 - factor));
      data[idx + 1] = Math.round(data[idx + 1] * factor + 17 * (1 - factor));
      data[idx + 2] = Math.round(data[idx + 2] * factor + 17 * (1 - factor));
      data[idx + 3] = 255;
    }
  }
}

export function scanlineFloodFill(
  imageData: ImageData,
  startX: number,
  startY: number,
  fillHex: string,
  tolerance: number,
  inkMask?: Uint8Array | null
): boolean {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  const sx = Math.floor(startX);
  const sy = Math.floor(startY);
  if (sx < 0 || sx >= width || sy < 0 || sy >= height) return false;

  const startPixelIndex = sy * width + sx;

  // Prevent accidentally bucket-filling solid black outline strokes themselves
  if (inkMask && inkMask[startPixelIndex] > 95) {
    return false;
  }

  const startOffset = startPixelIndex * 4;
  const targetR = data[startOffset];
  const targetG = data[startOffset + 1];
  const targetB = data[startOffset + 2];

  const { r: fillR, g: fillG, b: fillB } = hexToRgb(fillHex);

  // Skip if already virtually the exact same color
  if (
    Math.abs(targetR - fillR) <= 2 &&
    Math.abs(targetG - fillG) <= 2 &&
    Math.abs(targetB - fillB) <= 2
  ) {
    return false;
  }

  const maxDiff = Math.max(8, Math.min(180, tolerance));
  const visited = new Uint8Array(width * height);
  const filled = new Uint8Array(width * height);

  const matchesTarget = (pixelIdx: number): boolean => {
    if (visited[pixelIdx]) return false;
    // Barrier stops cleanly at even thin anti-aliased PDF strokes
    if (inkMask && inkMask[pixelIdx] > 72) return false;
    const off = pixelIdx * 4;
    const dr = Math.abs(data[off] - targetR);
    const dg = Math.abs(data[off + 1] - targetG);
    const db = Math.abs(data[off + 2] - targetB);
    return dr <= maxDiff && dg <= maxDiff && db <= maxDiff;
  };

  // Iterative scanline stack storing (x, y) pairs
  const stackX = new Int32Array(width * height);
  const stackY = new Int32Array(width * height);
  let sp = 0;

  stackX[sp] = sx;
  stackY[sp] = sy;
  sp++;

  while (sp > 0) {
    sp--;
    const x = stackX[sp];
    const y = stackY[sp];
    const rowStart = y * width;

    let left = x;
    while (left >= 0 && matchesTarget(rowStart + left)) {
      left--;
    }
    left++;

    let right = x;
    while (right < width && matchesTarget(rowStart + right)) {
      right++;
    }
    right--;

    let spanAbove = false;
    let spanBelow = false;

    for (let cx = left; cx <= right; cx++) {
      const pIdx = rowStart + cx;
      visited[pIdx] = 1;
      filled[pIdx] = 1;
      const off = pIdx * 4;
      data[off] = fillR;
      data[off + 1] = fillG;
      data[off + 2] = fillB;
      data[off + 3] = 255;

      if (y > 0) {
        const upMatch = matchesTarget((y - 1) * width + cx);
        if (!spanAbove && upMatch) {
          stackX[sp] = cx;
          stackY[sp] = y - 1;
          sp++;
          spanAbove = true;
        } else if (spanAbove && !upMatch) {
          spanAbove = false;
        }
      }

      if (y < height - 1) {
        const downMatch = matchesTarget((y + 1) * width + cx);
        if (!spanBelow && downMatch) {
          stackX[sp] = cx;
          stackY[sp] = y + 1;
          sp++;
          spanBelow = true;
        } else if (spanBelow && !downMatch) {
          spanBelow = false;
        }
      }
    }
  }

  // Anti-alias halo closure: fill 1px fringe pixels directly touching filled area & outlines
  if (inkMask) {
    for (let y = 1; y < height - 1; y++) {
      const row = y * width;
      for (let x = 1; x < width - 1; x++) {
        const pIdx = row + x;
        if (!filled[pIdx] && inkMask[pIdx] > 0 && inkMask[pIdx] <= 190) {
          if (
            filled[pIdx - 1] ||
            filled[pIdx + 1] ||
            filled[pIdx - width] ||
            filled[pIdx + width]
          ) {
            const off = pIdx * 4;
            data[off] = fillR;
            data[off + 1] = fillG;
            data[off + 2] = fillB;
            data[off + 3] = 255;
          }
        }
      }
    }
    reapplyInkLines(imageData, inkMask);
  }

  return true;
}

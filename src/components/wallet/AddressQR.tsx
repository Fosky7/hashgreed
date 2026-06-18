// src/components/wallet/AddressQR.tsx
//
// Self-contained QR code renderer. The external `qrcode` npm package is NOT
// resolvable in this build environment, so instead of importing it we inline a
// dependency-free QR Code generator (QR model 2, byte mode, Reed-Solomon ECC)
// and paint it onto a <canvas>. Public API is unchanged: <AddressQR value size />.

import { useEffect, useRef } from 'react';

/* ------------------------------------------------------------------ *
 * Minimal, dependency-free QR Code generator (byte mode).
 * Adapted from the public-domain QR Code algorithm. Returns a square
 * boolean matrix where `true` = dark module.
 * ------------------------------------------------------------------ */

// Galois field tables for Reed-Solomon over GF(256).
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: number[], ecLen: number): number[] {
  const gen = rsGeneratorPoly(ecLen);
  const res = new Array(ecLen).fill(0);
  for (const d of data) {
    const factor = d ^ res[0];
    res.shift();
    res.push(0);
    for (let i = 0; i < gen.length - 1; i++) {
      res[i] ^= gfMul(gen[i + 1], factor);
    }
  }
  return res;
}

// Version capacities (byte-mode data codewords) and EC parameters for
// error-correction level M, versions 1..10. Sufficient for a 35-char address
// (and well beyond). Each entry: [totalCodewords, ecCodewordsPerBlock, numBlocks].
const VERSIONS_M: Array<{
  version: number;
  totalCodewords: number;
  ecPerBlock: number;
  group1Blocks: number;
  group1DataCw: number;
  group2Blocks: number;
  group2DataCw: number;
}> = [
  { version: 1, totalCodewords: 26, ecPerBlock: 10, group1Blocks: 1, group1DataCw: 16, group2Blocks: 0, group2DataCw: 0 },
  { version: 2, totalCodewords: 44, ecPerBlock: 16, group1Blocks: 1, group1DataCw: 28, group2Blocks: 0, group2DataCw: 0 },
  { version: 3, totalCodewords: 70, ecPerBlock: 26, group1Blocks: 1, group1DataCw: 44, group2Blocks: 0, group2DataCw: 0 },
  { version: 4, totalCodewords: 100, ecPerBlock: 18, group1Blocks: 2, group1DataCw: 32, group2Blocks: 0, group2DataCw: 0 },
  { version: 5, totalCodewords: 134, ecPerBlock: 24, group1Blocks: 2, group1DataCw: 43, group2Blocks: 0, group2DataCw: 0 },
];

const ALIGNMENT_POSITIONS: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
};

function pickVersion(byteLen: number) {
  for (const v of VERSIONS_M) {
    // data codewords available = group1Blocks*group1DataCw + group2Blocks*group2DataCw
    const dataCw = v.group1Blocks * v.group1DataCw + v.group2Blocks * v.group2DataCw;
    // overhead: mode(4 bits) + char count indicator (8 bits for v1-9 byte mode) = 12 bits -> ~1.5 cw
    // payload bits = byteLen*8 + 12 + terminator; ensure it fits in dataCw bytes
    const neededBits = byteLen * 8 + 4 + 8;
    if (neededBits <= dataCw * 8) return v;
  }
  return VERSIONS_M[VERSIONS_M.length - 1];
}

function buildBitStream(bytes: number[], v: (typeof VERSIONS_M)[number]): number[] {
  const dataCw = v.group1Blocks * v.group1DataCw + v.group2Blocks * v.group2DataCw;
  const bits: number[] = [];
  const push = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };
  // Byte mode indicator = 0b0100
  push(0b0100, 4);
  // Character count indicator: 8 bits for versions 1-9 in byte mode
  push(bytes.length, 8);
  for (const b of bytes) push(b, 8);
  // Terminator (up to 4 zero bits)
  const capacityBits = dataCw * 8;
  let term = Math.min(4, capacityBits - bits.length);
  for (let i = 0; i < term; i++) bits.push(0);
  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);
  // Pad bytes alternating 0xEC, 0x11
  const padBytes = [0xec, 0x11];
  let pi = 0;
  while (bits.length < capacityBits) {
    push(padBytes[pi % 2], 8);
    pi++;
  }
  // Convert bits -> codeword bytes
  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    codewords.push(byte);
  }
  return codewords;
}

function interleave(dataCodewords: number[], v: (typeof VERSIONS_M)[number]): number[] {
  // Split into blocks
  const blocks: number[][] = [];
  let idx = 0;
  for (let i = 0; i < v.group1Blocks; i++) {
    blocks.push(dataCodewords.slice(idx, idx + v.group1DataCw));
    idx += v.group1DataCw;
  }
  for (let i = 0; i < v.group2Blocks; i++) {
    blocks.push(dataCodewords.slice(idx, idx + v.group2DataCw));
    idx += v.group2DataCw;
  }
  const ecBlocks = blocks.map((b) => rsEncode(b, v.ecPerBlock));

  const result: number[] = [];
  const maxData = Math.max(...blocks.map((b) => b.length));
  for (let i = 0; i < maxData; i++) {
    for (const b of blocks) if (i < b.length) result.push(b[i]);
  }
  for (let i = 0; i < v.ecPerBlock; i++) {
    for (const eb of ecBlocks) result.push(eb[i]);
  }
  return result;
}

function createMatrix(version: number): { size: number; modules: (boolean | null)[][] } {
  const size = version * 4 + 17;
  const modules: (boolean | null)[][] = Array.from({ length: size }, () =>
    new Array(size).fill(null),
  );
  return { size, modules };
}

function placeFinder(modules: (boolean | null)[][], r: number, c: number) {
  for (let dr = -1; dr <= 7; dr++) {
    for (let dc = -1; dc <= 7; dc++) {
      const rr = r + dr;
      const cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= modules.length || cc >= modules.length) continue;
      const isBorder = dr === -1 || dr === 7 || dc === -1 || dc === 7;
      const inRing =
        dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 &&
        (dr === 0 || dr === 6 || dc === 0 || dc === 6);
      const inCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
      if (isBorder) modules[rr][cc] = false;
      else modules[rr][cc] = inRing || inCenter;
    }
  }
}

function placeAlignment(modules: (boolean | null)[][], version: number) {
  const pos = ALIGNMENT_POSITIONS[version] || [];
  for (const r of pos) {
    for (const c of pos) {
      // Skip if overlapping finder patterns
      if (
        (r <= 7 && c <= 7) ||
        (r <= 7 && c >= modules.length - 8) ||
        (r >= modules.length - 8 && c <= 7)
      )
        continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const ring = Math.max(Math.abs(dr), Math.abs(dc));
          modules[r + dr][c + dc] = ring !== 1;
        }
      }
    }
  }
}

function placeTiming(modules: (boolean | null)[][]) {
  const n = modules.length;
  for (let i = 8; i < n - 8; i++) {
    const v = i % 2 === 0;
    if (modules[6][i] === null) modules[6][i] = v;
    if (modules[i][6] === null) modules[i][6] = v;
  }
}

function reserveFormat(modules: (boolean | null)[][]) {
  const n = modules.length;
  // Around top-left finder
  for (let i = 0; i <= 8; i++) {
    if (modules[8][i] === null) modules[8][i] = false;
    if (modules[i][8] === null) modules[i][8] = false;
  }
  for (let i = 0; i < 8; i++) {
    if (modules[8][n - 1 - i] === null) modules[8][n - 1 - i] = false;
    if (modules[n - 1 - i][8] === null) modules[n - 1 - i][8] = false;
  }
  // Dark module
  modules[n - 8][8] = true;
}

function placeData(modules: (boolean | null)[][], data: number[]) {
  const n = modules.length;
  let bitIndex = 0;
  const totalBits = data.length * 8;
  const getBit = (i: number) => (i < totalBits ? (data[i >> 3] >> (7 - (i & 7))) & 1 : 0);

  let upward = true;
  for (let col = n - 1; col > 0; col -= 2) {
    if (col === 6) col = 5; // skip timing column
    for (let i = 0; i < n; i++) {
      const row = upward ? n - 1 - i : i;
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (modules[row][cc] === null) {
          let bit = getBit(bitIndex) === 1;
          // Mask 0: (row + col) % 2 === 0
          if ((row + cc) % 2 === 0) bit = !bit;
          modules[row][cc] = bit;
          bitIndex++;
        }
      }
    }
    upward = !upward;
  }
}

function placeFormatInfo(modules: (boolean | null)[][]) {
  // EC level M (0b00) + mask 0 (0b000) -> format bits with BCH.
  // Precomputed format string for (M, mask0): 0b101010000010010
  const formatBits = 0b101010000010010;
  const n = modules.length;
  const bit = (i: number) => (formatBits >> i) & 1;

  // Top-left vertical / horizontal
  for (let i = 0; i <= 5; i++) modules[8][i] = bit(i) === 1;
  modules[8][7] = bit(6) === 1;
  modules[8][8] = bit(7) === 1;
  modules[7][8] = bit(8) === 1;
  for (let i = 9; i <= 14; i++) modules[14 - i][8] = bit(i) === 1;

  // Top-right / bottom-left
  for (let i = 0; i <= 7; i++) modules[8][n - 1 - i] = bit(i) === 1;
  for (let i = 8; i <= 14; i++) modules[n - 15 + i][8] = bit(i) === 1;
}

function generateQrMatrix(text: string): boolean[][] {
  // UTF-8 encode
  const bytes = Array.from(new TextEncoder().encode(text));
  const v = pickVersion(bytes.length);
  const dataCodewords = buildBitStream(bytes, v);
  const finalCodewords = interleave(dataCodewords, v);

  const { size, modules } = createMatrix(v.version);
  placeFinder(modules, 0, 0);
  placeFinder(modules, 0, size - 7);
  placeFinder(modules, size - 7, 0);
  placeAlignment(modules, v.version);
  placeTiming(modules);
  reserveFormat(modules);
  placeData(modules, finalCodewords);
  placeFormatInfo(modules);

  return modules.map((row) => row.map((m) => m === true));
}

/* ------------------------------------------------------------------ *
 * React component — same public API as before.
 * ------------------------------------------------------------------ */
export function AddressQR({ value, size = 200 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let matrix: boolean[][];
    try {
      matrix = generateQrMatrix(value);
    } catch {
      // On any failure, clear the canvas gracefully instead of crashing.
      canvas.width = size;
      canvas.height = size;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      return;
    }

    const quietZone = 4; // modules of padding
    const dim = matrix.length + quietZone * 2;
    const scale = Math.max(1, Math.floor(size / dim));
    const pixelSize = scale * dim;

    canvas.width = pixelSize;
    canvas.height = pixelSize;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const dark = '#1e1b4b';
    const light = '#ffffff';

    ctx.fillStyle = light;
    ctx.fillRect(0, 0, pixelSize, pixelSize);

    ctx.fillStyle = dark;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix.length; c++) {
        if (matrix[r][c]) {
          ctx.fillRect(
            (c + quietZone) * scale,
            (r + quietZone) * scale,
            scale,
            scale,
          );
        }
      }
    }
  }, [value, size]);

  return <canvas ref={canvasRef} className="rounded-xl" width={size} height={size} />;
}

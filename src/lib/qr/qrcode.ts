// src/lib/qr/qrcode.ts
//
// Self-contained QR Code generator (no external dependencies). Replaces the
// unresolved `qrcode` npm package import. Supports byte-mode encoding with
// error-correction level M, automatically choosing the smallest QR version
// (1..40) that fits the data. Returns a boolean module matrix where `true`
// means a dark module.
//
// This is a compact, dependency-free implementation suitable for encoding
// short strings such as blockchain addresses / URIs.
/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Galois Field (GF(256)) tables for Reed-Solomon error correction.
// ---------------------------------------------------------------------------
const EXP = new Array<number>(512);
const LOG = new Array<number>(256);
(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: number[], ecLen: number): number[] {
  const gen = rsGeneratorPoly(ecLen);
  const res = new Array<number>(ecLen).fill(0);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0];
    res.shift();
    res.push(0);
    if (factor !== 0) {
      for (let j = 0; j < gen.length; j++) {
        res[j] ^= gfMul(gen[j], factor);
      }
    }
  }
  return res;
}

// ---------------------------------------------------------------------------
// Version capacity tables for byte mode, EC level M.
// dataCodewords = total data codewords (after subtracting EC). Index = version-1.
// ---------------------------------------------------------------------------
// Total codewords per version (1..40).
const TOTAL_CODEWORDS = [
  26, 44, 70, 100, 134, 172, 196, 242, 292, 346, 404, 466, 532, 581, 655, 733,
  815, 901, 991, 1085, 1156, 1258, 1364, 1474, 1588, 1706, 1828, 1921, 2051,
  2185, 2323, 2465, 2611, 2761, 2876, 3034, 3196, 3362, 3532, 3706,
];

// EC codewords per block & block structure for level M.
// Each entry: [ecPerBlock, numBlocksGroup1, dataPerBlockGroup1, numBlocksGroup2, dataPerBlockGroup2]
const EC_BLOCKS_M: number[][] = [
  [10, 1, 16, 0, 0],
  [16, 1, 28, 0, 0],
  [26, 1, 44, 0, 0],
  [18, 2, 32, 0, 0],
  [24, 2, 43, 0, 0],
  [16, 4, 27, 0, 0],
  [18, 4, 31, 0, 0],
  [22, 2, 38, 2, 39],
  [22, 3, 36, 2, 37],
  [26, 4, 43, 1, 44],
  [30, 1, 50, 4, 51],
  [22, 6, 36, 2, 37],
  [22, 8, 37, 1, 38],
  [24, 4, 40, 5, 41],
  [24, 5, 41, 5, 42],
  [28, 7, 45, 3, 46],
  [28, 10, 46, 1, 47],
  [26, 9, 43, 4, 44],
  [26, 3, 44, 11, 45],
  [26, 3, 41, 13, 42],
  [26, 17, 42, 0, 0],
  [28, 17, 46, 0, 0],
  [28, 4, 47, 14, 48],
  [28, 6, 45, 14, 46],
  [28, 8, 47, 13, 48],
  [28, 19, 46, 4, 47],
  [28, 22, 45, 3, 46],
  [28, 3, 45, 23, 46],
  [28, 21, 45, 7, 46],
  [28, 19, 47, 10, 48],
  [28, 2, 46, 29, 47],
  [28, 10, 46, 23, 47],
  [28, 14, 46, 21, 47],
  [28, 14, 46, 23, 47],
  [28, 12, 47, 26, 48],
  [28, 6, 47, 34, 48],
  [28, 29, 46, 14, 47],
  [28, 13, 46, 32, 47],
  [28, 40, 47, 7, 48],
  [28, 18, 47, 31, 48],
];

function dataCodewordsForVersion(version: number): number {
  const b = EC_BLOCKS_M[version - 1];
  const [ecPerBlock, n1, d1, n2, d2] = b;
  const totalBlocks = n1 + n2;
  return TOTAL_CODEWORDS[version - 1] - ecPerBlock * totalBlocks;
}

// ---------------------------------------------------------------------------
// UTF-8 encode the input string to bytes.
// ---------------------------------------------------------------------------
function toUtf8Bytes(str: string): number[] {
  if (typeof TextEncoder !== 'undefined') {
    return Array.from(new TextEncoder().encode(str));
  }
  const out: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) {
      out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else {
      out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Bit buffer helper.
// ---------------------------------------------------------------------------
class BitBuffer {
  bits: number[] = [];
  put(num: number, length: number) {
    for (let i = length - 1; i >= 0; i--) {
      this.bits.push((num >>> i) & 1);
    }
  }
  get length() {
    return this.bits.length;
  }
}

// ---------------------------------------------------------------------------
// Build the data codeword stream (byte mode, level M).
// ---------------------------------------------------------------------------
function buildDataCodewords(bytes: number[], version: number): number[] {
  const bb = new BitBuffer();
  // Mode indicator for byte mode = 0100.
  bb.put(0x4, 4);
  // Character count indicator length depends on version.
  const ccBits = version <= 9 ? 8 : 16;
  bb.put(bytes.length, ccBits);
  for (const b of bytes) bb.put(b, 8);

  const dataCwCount = dataCodewordsForVersion(version);
  const capacityBits = dataCwCount * 8;

  // Terminator (up to 4 bits).
  const remaining = capacityBits - bb.length;
  bb.put(0, Math.min(4, Math.max(0, remaining)));

  // Pad to byte boundary.
  while (bb.length % 8 !== 0) bb.bits.push(0);

  // Convert bits to codewords.
  const codewords: number[] = [];
  for (let i = 0; i < bb.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bb.bits[i + j];
    codewords.push(byte);
  }

  // Pad with alternating bytes.
  const PAD = [0xec, 0x11];
  let pi = 0;
  while (codewords.length < dataCwCount) {
    codewords.push(PAD[pi % 2]);
    pi++;
  }
  return codewords;
}

// ---------------------------------------------------------------------------
// Interleave data + EC codewords across blocks.
// ---------------------------------------------------------------------------
function buildFinalCodewords(dataCw: number[], version: number): number[] {
  const [ecPerBlock, n1, d1, n2, d2] = EC_BLOCKS_M[version - 1];
  const blocks: { data: number[]; ec: number[] }[] = [];

  let offset = 0;
  const addBlocks = (count: number, dataLen: number) => {
    for (let i = 0; i < count; i++) {
      const data = dataCw.slice(offset, offset + dataLen);
      offset += dataLen;
      const ec = rsEncode(data, ecPerBlock);
      blocks.push({ data, ec });
    }
  };
  addBlocks(n1, d1);
  if (n2 > 0) addBlocks(n2, d2);

  const result: number[] = [];
  const maxData = Math.max(...blocks.map((b) => b.data.length));
  for (let i = 0; i < maxData; i++) {
    for (const b of blocks) {
      if (i < b.data.length) result.push(b.data[i]);
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const b of blocks) result.push(b.ec[i]);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Matrix placement.
// ---------------------------------------------------------------------------
function sizeForVersion(version: number): number {
  return version * 4 + 17;
}

function createMatrix(size: number): (number | null)[][] {
  return Array.from({ length: size }, () =>
    new Array<number | null>(size).fill(null)
  );
}

function placeFinderPattern(m: (number | null)[][], row: number, col: number) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = row + r;
      const cc = col + c;
      if (rr < 0 || rr >= m.length || cc < 0 || cc >= m.length) continue;
      const isBorder = r >= 0 && r <= 6 && (c === 0 || c === 6);
      const isBorder2 = c >= 0 && c <= 6 && (r === 0 || r === 6);
      const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      m[rr][cc] = isBorder || isBorder2 || isCenter ? 1 : 0;
    }
  }
}

const ALIGNMENT_POSITIONS: number[][] = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
  [6, 26, 50, 74],
  [6, 30, 54, 78],
  [6, 30, 56, 82],
  [6, 30, 58, 86],
  [6, 34, 62, 90],
  [6, 28, 50, 72, 94],
  [6, 26, 50, 74, 98],
  [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106],
  [6, 32, 58, 84, 110],
  [6, 30, 58, 86, 114],
  [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122],
  [6, 30, 54, 78, 102, 126],
  [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138],
  [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170],
];

function placeAlignmentPatterns(m: (number | null)[][], version: number) {
  const positions = ALIGNMENT_POSITIONS[version - 1];
  for (const r of positions) {
    for (const c of positions) {
      // Skip overlap with finder patterns.
      if (
        (r === 6 && c === 6) ||
        (r === 6 && c === m.length - 7) ||
        (r === m.length - 7 && c === 6)
      )
        continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const rr = r + dr;
          const cc = c + dc;
          const ring = Math.max(Math.abs(dr), Math.abs(dc));
          m[rr][cc] = ring === 1 ? 0 : 1;
        }
      }
    }
  }
}

function placeTimingPatterns(m: (number | null)[][]) {
  for (let i = 8; i < m.length - 8; i++) {
    const bit = i % 2 === 0 ? 1 : 0;
    if (m[6][i] === null) m[6][i] = bit;
    if (m[i][6] === null) m[i][6] = bit;
  }
}

function reserveFormatAreas(m: (number | null)[][]) {
  const size = m.length;
  // Dark module.
  m[size - 8][8] = 1;
  // Format info areas around finders are filled later; mark as reserved (-1).
  for (let i = 0; i < 9; i++) {
    if (m[8][i] === null) m[8][i] = -1;
    if (m[i][8] === null) m[i][8] = -1;
  }
  for (let i = 0; i < 8; i++) {
    if (m[8][size - 1 - i] === null) m[8][size - 1 - i] = -1;
    if (m[size - 1 - i][8] === null) m[size - 1 - i][8] = -1;
  }
}

function placeData(m: (number | null)[][], codewords: number[]) {
  const size = m.length;
  let bitIndex = 0;
  const totalBits = codewords.length * 8;
  const getBit = (i: number) =>
    i < totalBits ? (codewords[i >> 3] >> (7 - (i & 7))) & 1 : 0;

  let col = size - 1;
  let upward = true;
  while (col > 0) {
    if (col === 6) col--; // skip timing column
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i;
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (m[row][cc] === null) {
          m[row][cc] = getBit(bitIndex);
          bitIndex++;
        }
      }
    }
    upward = !upward;
    col -= 2;
  }
}

// Mask pattern 0: (row + col) % 2 === 0.
function applyMask(m: (number | null)[][]) {
  const size = m.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Only apply to data modules (those that are 0/1, not reserved -1 functional).
      // We track functional modules separately below; here we mask everything that
      // is a data bit using a parallel functional map approach handled by caller.
    }
  }
}

// Format info for EC level M (01) — precomputed for mask 0.
// Mask pattern 0 with level M format bits => standard table value.
const FORMAT_INFO_M_MASK0 = 0b101010000010010;

function placeFormatInfo(m: (number | null)[][]) {
  const size = m.length;
  const bits = FORMAT_INFO_M_MASK0;
  // Around top-left finder.
  for (let i = 0; i <= 5; i++) m[8][i] = (bits >> i) & 1;
  m[8][7] = (bits >> 6) & 1;
  m[8][8] = (bits >> 7) & 1;
  m[7][8] = (bits >> 8) & 1;
  for (let i = 9; i <= 14; i++) m[14 - i][8] = (bits >> i) & 1;
  // Around the other two finders.
  for (let i = 0; i <= 7; i++) m[size - 1 - i][8] = (bits >> i) & 1;
  for (let i = 8; i <= 14; i++) m[8][size - 15 + i] = (bits >> i) & 1;
  m[size - 8][8] = 1; // dark module
}

// ---------------------------------------------------------------------------
// Public API: build a boolean matrix for the given text.
// ---------------------------------------------------------------------------
export function generateQrMatrix(text: string): boolean[][] {
  const bytes = toUtf8Bytes(text);

  // Choose smallest version that fits (byte mode, level M).
  let version = 1;
  while (version <= 40) {
    const ccBits = version <= 9 ? 8 : 16;
    const headerBits = 4 + ccBits;
    const dataBitsNeeded = headerBits + bytes.length * 8;
    const capacityBits = dataCodewordsForVersion(version) * 8;
    if (dataBitsNeeded <= capacityBits) break;
    version++;
  }
  if (version > 40) {
    throw new Error('Data too large to encode in a QR code.');
  }

  const dataCw = buildDataCodewords(bytes, version);
  const finalCw = buildFinalCodewords(dataCw, version);

  const size = sizeForVersion(version);
  const m = createMatrix(size);

  // Functional patterns.
  placeFinderPattern(m, 0, 0);
  placeFinderPattern(m, 0, size - 7);
  placeFinderPattern(m, size - 7, 0);
  placeAlignmentPatterns(m, version);
  placeTimingPatterns(m);
  reserveFormatAreas(m);

  // Build a functional-module map (true = functional / reserved) BEFORE data.
  const functional: boolean[][] = m.map((row) =>
    row.map((v) => v !== null)
  );

  // Place data bits into remaining null cells.
  placeData(m, finalCw);

  // Apply mask pattern 0 to data modules only.
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!functional[r][c]) {
        if ((r + c) % 2 === 0) {
          m[r][c] = m[r][c] === 1 ? 0 : 1;
        }
      }
    }
  }

  // Place format info (overwrites reserved -1 cells).
  placeFormatInfo(m);

  // Normalize to boolean (dark = true).
  return m.map((row) => row.map((v) => v === 1));
}

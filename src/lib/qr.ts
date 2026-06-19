// src/lib/qr.ts
//
// Self-contained, dependency-free QR Code generator.
//
// This replaces the unresolvable `qrcode` npm package. It implements enough of
// the QR spec (byte mode, error-correction level M, automatic version sizing
// up to version 10) to encode wallet addresses, URLs and short strings into a
// boolean module matrix. Consumers (AddressQR.tsx) paint that matrix onto a
// canvas.
//
// Adapted to TypeScript from the well-known compact QRCode implementation
// (Kazuhiko Arase, MIT). It is intentionally small and has zero imports.
/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Galois field math for Reed-Solomon error correction
// ---------------------------------------------------------------------------
const EXP_TABLE: number[] = new Array(256);
const LOG_TABLE: number[] = new Array(256);
(function initTables() {
  for (let i = 0; i < 8; i++) EXP_TABLE[i] = 1 << i;
  for (let i = 8; i < 256; i++) {
    EXP_TABLE[i] = EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8];
  }
  for (let i = 0; i < 255; i++) LOG_TABLE[EXP_TABLE[i]] = i;
})();

function gexp(n: number): number {
  while (n < 0) n += 255;
  while (n >= 256) n -= 255;
  return EXP_TABLE[n];
}
function glog(n: number): number {
  if (n < 1) throw new Error('glog(' + n + ')');
  return LOG_TABLE[n];
}

class Poly {
  num: number[];
  constructor(num: number[], shift = 0) {
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
  }
  get(i: number) {
    return this.num[i];
  }
  getLength() {
    return this.num.length;
  }
  multiply(e: Poly): Poly {
    const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
    for (let i = 0; i < this.getLength(); i++) {
      for (let j = 0; j < e.getLength(); j++) {
        num[i + j] ^= gexp(glog(this.get(i)) + glog(e.get(j)));
      }
    }
    return new Poly(num);
  }
  mod(e: Poly): Poly {
    if (this.getLength() - e.getLength() < 0) return this;
    const ratio = glog(this.get(0)) - glog(e.get(0));
    const num = this.num.slice();
    for (let i = 0; i < e.getLength(); i++) {
      num[i] ^= gexp(glog(e.get(i)) + ratio);
    }
    return new Poly(num).mod(e);
  }
}

function rsBlockPoly(errorCorrectLength: number): Poly {
  let poly = new Poly([1]);
  for (let i = 0; i < errorCorrectLength; i++) {
    poly = poly.multiply(new Poly([1, gexp(i)]));
  }
  return poly;
}

// ---------------------------------------------------------------------------
// Bit buffer
// ---------------------------------------------------------------------------
class BitBuffer {
  buffer: number[] = [];
  length = 0;
  put(num: number, length: number) {
    for (let i = 0; i < length; i++) this.putBit(((num >>> (length - i - 1)) & 1) === 1);
  }
  putBit(bit: boolean) {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) this.buffer.push(0);
    if (bit) this.buffer[bufIndex] |= 0x80 >>> this.length % 8;
    this.length++;
  }
}

// ---------------------------------------------------------------------------
// RS block tables for EC level M (medium). Index = version - 1.
// Each entry: [totalCount, dataCount] repeated per block group, flattened.
// We support versions 1..10 which is plenty for addresses/URLs.
// ---------------------------------------------------------------------------
interface RSBlock { totalCount: number; dataCount: number; }

// [ [count, totalCount, dataCount], ... ] per version for EC level M
const RS_BLOCK_TABLE_M: number[][] = [
  [1, 26, 16], // v1
  [1, 44, 28], // v2
  [1, 70, 44], // v3
  [2, 50, 32], // v4
  [2, 67, 43], // v5
  [4, 43, 27], // v6
  [4, 49, 31], // v7
  [2, 60, 38, 2, 61, 39], // v8
  [3, 58, 36, 2, 59, 37], // v9
  [4, 69, 43, 1, 70, 44], // v10
];

function getRSBlocks(version: number): RSBlock[] {
  const def = RS_BLOCK_TABLE_M[version - 1];
  if (!def) throw new Error('Unsupported QR version: ' + version);
  const blocks: RSBlock[] = [];
  for (let i = 0; i < def.length; i += 3) {
    const count = def[i];
    const totalCount = def[i + 1];
    const dataCount = def[i + 2];
    for (let c = 0; c < count; c++) blocks.push({ totalCount, dataCount });
  }
  return blocks;
}

// Total data capacity (bytes) for EC level M per version (byte mode usable).
function getTotalDataCount(version: number): number {
  return getRSBlocks(version).reduce((sum, b) => sum + b.dataCount, 0);
}

// ---------------------------------------------------------------------------
// QR model
// ---------------------------------------------------------------------------
const PAD0 = 0xec;
const PAD1 = 0x11;

function toUtf8Bytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else if (c >= 0xd800 && c <= 0xdbff) {
      // surrogate pair
      const c2 = str.charCodeAt(++i);
      c = 0x10000 + ((c & 0x3ff) << 10) + (c2 & 0x3ff);
      bytes.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    } else {
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
  }
  return bytes;
}

function chooseVersion(dataLen: number): number {
  for (let v = 1; v <= 10; v++) {
    // byte mode overhead: 4 bits mode + char count indicator (8 bits for v1-9, 16 for v10)
    const cciBits = v <= 9 ? 8 : 16;
    const capacityBytes = getTotalDataCount(v);
    const neededBits = 4 + cciBits + dataLen * 8;
    if (neededBits <= capacityBytes * 8) return v;
  }
  throw new Error('Data too long for supported QR versions (max v10).');
}

function createData(version: number, dataBytes: number[]): number[] {
  const buffer = new BitBuffer();
  // Byte mode indicator
  buffer.put(4, 4);
  const cciBits = version <= 9 ? 8 : 16;
  buffer.put(dataBytes.length, cciBits);
  for (const b of dataBytes) buffer.put(b, 8);

  const totalDataCount = getTotalDataCount(version);
  const totalBits = totalDataCount * 8;
  if (buffer.length > totalBits) throw new Error('Data overflow');

  // Terminator
  if (buffer.length + 4 <= totalBits) buffer.put(0, 4);
  // Byte align
  while (buffer.length % 8 !== 0) buffer.putBit(false);
  // Pad bytes
  while (true) {
    if (buffer.length >= totalBits) break;
    buffer.put(PAD0, 8);
    if (buffer.length >= totalBits) break;
    buffer.put(PAD1, 8);
  }

  return createBytes(buffer, version);
}

function createBytes(buffer: BitBuffer, version: number): number[] {
  const rsBlocks = getRSBlocks(version);
  let offset = 0;
  let maxDcCount = 0;
  let maxEcCount = 0;
  const dcData: number[][] = [];
  const ecData: number[][] = [];

  for (let r = 0; r < rsBlocks.length; r++) {
    const dcCount = rsBlocks[r].dataCount;
    const ecCount = rsBlocks[r].totalCount - dcCount;
    maxDcCount = Math.max(maxDcCount, dcCount);
    maxEcCount = Math.max(maxEcCount, ecCount);

    dcData[r] = new Array(dcCount);
    for (let i = 0; i < dcCount; i++) dcData[r][i] = 0xff & buffer.buffer[i + offset];
    offset += dcCount;

    const rsPoly = rsBlockPoly(ecCount);
    const rawPoly = new Poly(dcData[r], rsPoly.getLength() - 1);
    const modPoly = rawPoly.mod(rsPoly);
    ecData[r] = new Array(rsPoly.getLength() - 1);
    for (let i = 0; i < ecData[r].length; i++) {
      const modIndex = i + modPoly.getLength() - ecData[r].length;
      ecData[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
    }
  }

  let totalCodeCount = 0;
  for (let i = 0; i < rsBlocks.length; i++) totalCodeCount += rsBlocks[i].totalCount;

  const data: number[] = new Array(totalCodeCount);
  let index = 0;
  for (let i = 0; i < maxDcCount; i++) {
    for (let r = 0; r < rsBlocks.length; r++) {
      if (i < dcData[r].length) data[index++] = dcData[r][i];
    }
  }
  for (let i = 0; i < maxEcCount; i++) {
    for (let r = 0; r < rsBlocks.length; r++) {
      if (i < ecData[r].length) data[index++] = ecData[r][i];
    }
  }
  return data;
}

// ---------------------------------------------------------------------------
// Module placement
// ---------------------------------------------------------------------------
const PATTERN_POSITION_TABLE: number[][] = [
  [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
  [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
];

function getBCHTypeInfo(data: number): number {
  let d = data << 10;
  const G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | 1;
  while (bchDigit(d) - bchDigit(G15) >= 0) d ^= G15 << (bchDigit(d) - bchDigit(G15));
  return ((data << 10) | d) ^ 0x5412;
}
function bchDigit(data: number): number {
  let digit = 0;
  while (data !== 0) {
    digit++;
    data >>>= 1;
  }
  return digit;
}

function maskFn(maskPattern: number, i: number, j: number): boolean {
  switch (maskPattern) {
    case 0: return (i + j) % 2 === 0;
    case 1: return i % 2 === 0;
    case 2: return j % 3 === 0;
    case 3: return (i + j) % 3 === 0;
    case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
    case 5: return ((i * j) % 2) + ((i * j) % 3) === 0;
    case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
    case 7: return (((i * j) % 3) + ((i + j) % 2)) % 2 === 0;
    default: return false;
  }
}

function buildMatrix(version: number, maskPattern: number, data: number[]): boolean[][] {
  const size = version * 4 + 17;
  const modules: (boolean | null)[][] = Array.from({ length: size }, () => new Array(size).fill(null));

  const setupPositionProbe = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        if (row + r <= -1 || size <= row + r || col + c <= -1 || size <= col + c) continue;
        modules[row + r][col + c] =
          (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
          (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4);
      }
    }
  };
  setupPositionProbe(0, 0);
  setupPositionProbe(size - 7, 0);
  setupPositionProbe(0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (modules[i][6] === null) modules[i][6] = i % 2 === 0;
    if (modules[6][i] === null) modules[6][i] = i % 2 === 0;
  }

  // Alignment patterns
  const pos = PATTERN_POSITION_TABLE[version - 1];
  for (let i = 0; i < pos.length; i++) {
    for (let j = 0; j < pos.length; j++) {
      const row = pos[i];
      const col = pos[j];
      if (modules[row][col] !== null) continue;
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          modules[row + r][col + c] =
            r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0);
        }
      }
    }
  }

  // Format info (EC level M = 0, with mask pattern)
  const formatBits = getBCHTypeInfo((0 << 3) | maskPattern);
  for (let i = 0; i < 15; i++) {
    const mod = ((formatBits >> i) & 1) === 1;
    if (i < 6) modules[i][8] = mod;
    else if (i < 8) modules[i + 1][8] = mod;
    else modules[size - 15 + i][8] = mod;
  }
  for (let i = 0; i < 15; i++) {
    const mod = ((formatBits >> i) & 1) === 1;
    if (i < 8) modules[8][size - i - 1] = mod;
    else if (i < 9) modules[8][15 - i - 1 + 1] = mod;
    else modules[8][15 - i - 1] = mod;
  }
  modules[size - 8][8] = true;

  // Map data with mask
  let inc = -1;
  let row = size - 1;
  let bitIndex = 7;
  let byteIndex = 0;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    while (true) {
      for (let c = 0; c < 2; c++) {
        if (modules[row][col - c] === null) {
          let dark = false;
          if (byteIndex < data.length) {
            dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
          }
          if (maskFn(maskPattern, row, col - c)) dark = !dark;
          modules[row][col - c] = dark;
          bitIndex--;
          if (bitIndex === -1) {
            byteIndex++;
            bitIndex = 7;
          }
        }
      }
      row += inc;
      if (row < 0 || size <= row) {
        row -= inc;
        inc = -inc;
        break;
      }
    }
  }

  // Convert nulls to false
  return modules.map((r) => r.map((v) => v === true));
}

/**
 * Encode the given text into a QR module matrix (boolean[][]) at EC level M.
 * Uses a fixed mask pattern (0) which is adequate for short, high-contrast
 * data such as wallet addresses.
 */
export function generateQrMatrix(text: string): boolean[][] {
  if (!text) throw new Error('Empty QR data');
  const dataBytes = toUtf8Bytes(text);
  const version = chooseVersion(dataBytes.length);
  const data = createData(version, dataBytes);
  return buildMatrix(version, 0, data);
}

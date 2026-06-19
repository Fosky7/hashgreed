// src/lib/blockchain/kross/polyfills.ts
//
// Self-contained, zero-import, SYNCHRONOUS polyfill installed on globalThis
// BEFORE any blockchain SDK code evaluates. The Waves/Kross crypto libraries
// (@waves/ts-lib-crypto, @waves/waves-transactions) read Node globals
// (Buffer / process / global) at *import time*. In the browser those are
// undefined, causing `Cannot read properties of undefined (reading 'from')`.
//
// Import this module as the very first statement of the app entry so the
// globals exist before anything (static or dynamic) pulls in the SDK.

/* eslint-disable @typescript-eslint/no-explicit-any */
const g = globalThis as any;

// --- global / self ---
if (typeof g.global === 'undefined') g.global = g;

// --- process ---
if (typeof g.process === 'undefined') {
  g.process = { env: {}, browser: true, version: '', nextTick: (cb: () => void) => setTimeout(cb, 0) };
} else {
  if (!g.process.env) g.process.env = {};
  if (typeof g.process.nextTick !== 'function') g.process.nextTick = (cb: () => void) => setTimeout(cb, 0);
}

// --- Buffer (minimal surface used at module-eval time) ---
function toBytes(input: any, encoding?: string): Uint8Array {
  if (input == null) return new Uint8Array(0);
  if (input instanceof Uint8Array) return new Uint8Array(input);
  if (Array.isArray(input)) return Uint8Array.from(input);
  if (typeof input === 'number') return new Uint8Array(input);
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (typeof input === 'string') {
    const enc = (encoding || 'utf8').toLowerCase();
    if (enc === 'hex') {
      const len = Math.floor(input.length / 2);
      const out = new Uint8Array(len);
      for (let i = 0; i < len; i++) out[i] = parseInt(input.substr(i * 2, 2), 16);
      return out;
    }
    if (enc === 'base64') {
      const bin = atob(input);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
    return new TextEncoder().encode(input);
  }
  return new Uint8Array(0);
}

function bytesToString(bytes: Uint8Array, encoding?: string): string {
  const enc = (encoding || 'utf8').toLowerCase();
  if (enc === 'hex') {
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0');
    return s;
  }
  if (enc === 'base64') {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  return new TextDecoder().decode(bytes);
}

function makeBuffer(input: any, encoding?: string): any {
  const u8: any = toBytes(input, encoding);
  u8.toString = (enc?: string) => bytesToString(u8 as Uint8Array, enc);
  u8.slice = (start?: number, end?: number) => makeBuffer((u8 as Uint8Array).subarray(start, end));
  return u8;
}

if (typeof g.Buffer === 'undefined' || typeof g.Buffer.from !== 'function') {
  const BufferShim: any = function (input: any, encoding?: string) {
    return makeBuffer(input, encoding);
  };
  BufferShim.from = (input: any, encoding?: string) => makeBuffer(input, encoding);
  BufferShim.alloc = (size: number) => makeBuffer(new Uint8Array(size));
  BufferShim.allocUnsafe = (size: number) => makeBuffer(new Uint8Array(size));
  BufferShim.isBuffer = (obj: any) => obj instanceof Uint8Array;
  BufferShim.concat = (list: Uint8Array[]) => {
    const total = list.reduce((n, b) => n + (b ? b.length : 0), 0);
    const out = new Uint8Array(total);
    let off = 0;
    for (const b of list) {
      if (!b) continue;
      out.set(b, off);
      off += b.length;
    }
    return makeBuffer(out);
  };
  g.Buffer = BufferShim;
}

// Best-effort async upgrade to the real 'buffer' package (never leaves it undefined).
(async () => {
  try {
    const mod: any = await import('buffer');
    if (mod && mod.Buffer && typeof mod.Buffer.from === 'function') {
      g.Buffer = mod.Buffer;
    }
  } catch {
    /* keep the synchronous shim */
  }
})();

export {};

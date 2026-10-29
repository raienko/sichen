import { Rng } from "../sim/rng";

/**
 * Save encryption, as the design asks: simple. A keyed XOR stream over the
 * UTF-8 JSON, base64 on top, and an FNV-1a checksum of the plain text so a
 * hand-edited or truncated save is refused instead of loaded half-broken.
 * It keeps casual players out of their save files; it is not security, and
 * anything that must be trusted will be checked by the server later.
 *
 * Self-contained (no TextEncoder, atob or btoa) so it behaves the same in
 * every JS engine the game runs on.
 */
const MAGIC = "S1";
const KEY = 0x51c4e2a7;

function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function utf8Encode(text: string): number[] {
  const bytes: number[] = [];
  for (const char of text) {
    const code = char.codePointAt(0)!;
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63));
    else if (code < 0x10000)
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 63),
        0x80 | (code & 63),
      );
    else
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 63),
        0x80 | ((code >> 6) & 63),
        0x80 | (code & 63),
      );
  }
  return bytes;
}

function utf8Decode(bytes: number[]): string {
  let out = "";
  for (let i = 0; i < bytes.length;) {
    const b = bytes[i]!;
    let code: number;
    if (b < 0x80) {
      code = b;
      i += 1;
    } else if (b < 0xe0) {
      code = ((b & 31) << 6) | (bytes[i + 1]! & 63);
      i += 2;
    } else if (b < 0xf0) {
      code =
        ((b & 15) << 12) | ((bytes[i + 1]! & 63) << 6) | (bytes[i + 2]! & 63);
      i += 3;
    } else {
      code =
        ((b & 7) << 18) |
        ((bytes[i + 1]! & 63) << 12) |
        ((bytes[i + 2]! & 63) << 6) |
        (bytes[i + 3]! & 63);
      i += 4;
    }
    out += String.fromCodePoint(code);
  }
  return out;
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function toBase64(bytes: number[]): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const [a, b = 0, c = 0] = [bytes[i]!, bytes[i + 1], bytes[i + 2]];
    const n = (a << 16) | (b << 8) | c;
    out += B64[(n >> 18) & 63]! + B64[(n >> 12) & 63]!;
    out += i + 1 < bytes.length ? B64[(n >> 6) & 63]! : "=";
    out += i + 2 < bytes.length ? B64[n & 63]! : "=";
  }
  return out;
}

function fromBase64(text: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i += 4) {
    const chars = [0, 1, 2, 3].map((k) => B64.indexOf(text[i + k] ?? "="));
    const n =
      ((chars[0]! & 63) << 18) |
      ((chars[1]! & 63) << 12) |
      ((Math.max(0, chars[2]!) & 63) << 6) |
      (Math.max(0, chars[3]!) & 63);
    bytes.push((n >> 16) & 255);
    if (chars[2]! >= 0) bytes.push((n >> 8) & 255);
    if (chars[3]! >= 0) bytes.push(n & 255);
  }
  return bytes;
}

function xor(bytes: number[], salt: number): number[] {
  const rng = new Rng((KEY ^ salt) >>> 0);
  return bytes.map((b) => b ^ Math.floor(rng.next() * 256));
}

export function encodeSave(value: unknown): string {
  const json = JSON.stringify(value);
  const sum = fnv1a(json);
  return `${MAGIC}.${sum.toString(16)}.${toBase64(xor(utf8Encode(json), sum))}`;
}

/** The decoded value, or null for anything that isn't an intact save. */
export function decodeSave(text: string): unknown {
  const [magic, sumHex, body] = text.split(".");
  if (magic !== MAGIC || !sumHex || !body) return null;
  const sum = parseInt(sumHex, 16);
  try {
    const json = utf8Decode(xor(fromBase64(body), sum));
    if (fnv1a(json) !== sum) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

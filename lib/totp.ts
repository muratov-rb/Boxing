import { createHmac, randomBytes, timingSafeEqual } from "crypto";

/* ===========================================================================
   RINGBORNN — time-based one-time passwords (RFC 6238).

   Hand-rolled rather than pulled from npm: the whole algorithm is an HMAC and
   some bit shifting, all of it in Node's standard library, and a dependency
   that sits in the authentication path is a dependency you have to keep
   trusting. Verified against the RFC's own test vectors.

   SHA-1 is not a weakness here. TOTP's security comes from the shared secret
   and the 30-second window, and every authenticator app expects SHA-1 —
   changing it would just mean codes that never match.
   =========================================================================== */

const DIGITS = 6;
const PERIOD = 30; // seconds
/** How many steps either side of now to accept. One = ±30s, which covers a
    phone clock that has drifted without widening the window enough to matter. */
const DRIFT = 1;

/* ------------------------------- base32 ---------------------------------- */
/* Authenticator apps speak base32, so secrets have to travel in it. */

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string): Buffer {
  const clean = s.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const c of clean) {
    const idx = B32.indexOf(c);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/* -------------------------------- codes ---------------------------------- */

/** 20 random bytes — the length RFC 4226 recommends for a SHA-1 HMAC key. */
export function generateSecret(): string {
  return base32Encode(randomBytes(20));
}

/** The code for one 30-second step. Exported so the tests can drive time. */
export function codeForCounter(secret: Buffer, counter: number): string {
  const msg = Buffer.alloc(8);
  /* The counter is 64-bit but Number only holds 53 bits exactly, so write it
     as two 32-bit halves rather than letting a shift silently overflow. */
  msg.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  msg.writeUInt32BE(counter >>> 0, 4);

  const hmac = createHmac("sha1", secret).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];

  return String(bin % 10 ** DIGITS).padStart(DIGITS, "0");
}

export function currentCode(secretBase32: string, atMs = Date.now()): string {
  const counter = Math.floor(atMs / 1000 / PERIOD);
  return codeForCounter(base32Decode(secretBase32), counter);
}

/**
 * Check a code the user typed.
 *
 * Compares in constant time, and accepts one step either side so a phone whose
 * clock has drifted a few seconds still works.
 */
export function verifyCode(
  secretBase32: string,
  given: string,
  atMs = Date.now(),
): boolean {
  const cleaned = (given ?? "").replace(/\D/g, "");
  if (cleaned.length !== DIGITS) return false;

  const secret = base32Decode(secretBase32);
  if (secret.length === 0) return false;

  const counter = Math.floor(atMs / 1000 / PERIOD);
  let ok = false;
  /* Every candidate is checked even after a match, so the time taken does not
     reveal which step succeeded. */
  for (let i = -DRIFT; i <= DRIFT; i++) {
    const expected = Buffer.from(codeForCounter(secret, counter + i));
    const actual = Buffer.from(cleaned);
    if (expected.length === actual.length && timingSafeEqual(expected, actual)) {
      ok = true;
    }
  }
  return ok;
}

/** The URI an authenticator app scans. `issuer` shows above the code. */
export function otpauthUri(secretBase32: string, account: string): string {
  const label = encodeURIComponent(`RingBornn:${account}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer: "RingBornn",
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(PERIOD),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

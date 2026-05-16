// src/utils/totp.ts
// Implementação TOTP (RFC 6238) pura – sem dependências externas.
// Compatível com Google Authenticator / Aegis / qualquer app TOTP.

// ── Base32 decode ─────────────────────────────────────────────────────────────
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(input: string): Uint8Array {
  const s = input.replace(/=+$/, '').toUpperCase();
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = new Uint8Array(Math.floor((s.length * 5) / 8));

  for (let i = 0; i < s.length; i++) {
    const idx = BASE32_CHARS.indexOf(s[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 0xff;
      bits -= 8;
    }
  }
  return output;
}

// ── HMAC-SHA1 (Web Crypto API) ────────────────────────────────────────────────
async function hmacSha1(keyBytes: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw', keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, data);
  return new Uint8Array(sig);
}

// ── HOTP ──────────────────────────────────────────────────────────────────────
function hotp(hmac: Uint8Array, digits = 6): string {
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 10 ** digits).padStart(digits, '0');
}

// ── TOTP público ──────────────────────────────────────────────────────────────
const STEP = 30; // segundos por janela

/** Gera o código TOTP atual para um secret base32. */
export async function generateTOTP(secret: string, digits = 6): Promise<string> {
  const keyBytes = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / STEP);
  const data = new Uint8Array(8);
  // counter como big-endian uint64
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    data[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  const hmac = await hmacSha1(keyBytes, data);
  return hotp(hmac, digits);
}

/** Valida código TOTP aceitando janela ±1 (tolerância de clock). */
export async function verifyTOTP(secret: string, code: string, digits = 6): Promise<boolean> {
  const keyBytes = base32Decode(secret);
  const now = Math.floor(Date.now() / 1000 / STEP);

  for (const delta of [-1, 0, 1]) {
    const counter = now + delta;
    const data = new Uint8Array(8);
    let c = counter;
    for (let i = 7; i >= 0; i--) {
      data[i] = c & 0xff;
      c = Math.floor(c / 256);
    }
    const hmac = await hmacSha1(keyBytes, data);
    if (hotp(hmac, digits) === code) return true;
  }
  return false;
}

/** Segundos restantes na janela atual. */
export function totpSecondsLeft(): number {
  return STEP - (Math.floor(Date.now() / 1000) % STEP);
}

/** URI para QR Code (Google Authenticator). */
export function totpUri(secret: string, account: string, issuer = 'SMRA'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

const ADMIN_KEY = "bp-admin";
const ADMIN_SESSION_KEY = "bp-admin-session";
const ITERATIONS = 150000;
const HASH_LENGTH = 32;

function storageValue(storage) {
  try { return storage.getItem(ADMIN_KEY); } catch { return null; }
}

function readRecord(storage) {
  const value = storageValue(storage);
  if (!value) return null;
  try {
    const record = JSON.parse(value);
    return record?.v === 1 && typeof record.salt === "string" && typeof record.hash === "string" ? record : null;
  } catch {
    return null;
  }
}

function toBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function derive(pin, salt) {
  const material = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await globalThis.crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    material,
    HASH_LENGTH * 8,
  );
  return new Uint8Array(bits);
}

function equalBytes(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

function writeRecord(storage, record) {
  storage.setItem(ADMIN_KEY, JSON.stringify(record));
}

export async function setPin(storage, pin) {
  if (!/^\d{6}$/.test(pin)) throw new Error("pin");
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(pin, salt);
  writeRecord(storage, { v: 1, salt: toBase64(salt), hash: toBase64(hash), failures: 0, lockedUntil: null });
}

export function isPinSet(storage) {
  return readRecord(storage) !== null;
}

export async function verifyPin(storage, pin, now = Date.now()) {
  const record = readRecord(storage);
  if (!record) return "unset";
  const lockedAt = record.lockedUntil ? Date.parse(record.lockedUntil) : NaN;
  if (Number.isFinite(lockedAt) && lockedAt > now) return "locked";
  if (Number.isFinite(lockedAt) && lockedAt <= now) {
    record.failures = 0;
    record.lockedUntil = null;
  }
  let valid = false;
  try { valid = equalBytes(await derive(pin, fromBase64(record.salt)), fromBase64(record.hash)); } catch { valid = false; }
  if (valid) {
    record.failures = 0;
    record.lockedUntil = null;
    writeRecord(storage, record);
    return "ok";
  }
  record.failures = Number.isInteger(record.failures) ? record.failures + 1 : 1;
  if (record.failures >= 5) record.lockedUntil = new Date(now + 60000).toISOString();
  writeRecord(storage, record);
  return record.failures >= 5 ? "locked" : "wrong";
}

export function resetAdmin(storage) {
  storage.removeItem(ADMIN_KEY);
  storage.removeItem("bp-learning-course");
}

function sessionStore(value) {
  return value ?? globalThis.sessionStorage;
}

export function setAdminSession(sessionStorage) {
  sessionStore(sessionStorage).setItem(ADMIN_SESSION_KEY, "1");
}

export function isAdminSession(sessionStorage) {
  try { return sessionStore(sessionStorage).getItem(ADMIN_SESSION_KEY) === "1"; } catch { return false; }
}

export function lockAdmin(sessionStorage) {
  try { sessionStore(sessionStorage).removeItem(ADMIN_SESSION_KEY); } catch { /* session-only protection can continue */ }
}

export { ADMIN_KEY, ADMIN_SESSION_KEY };

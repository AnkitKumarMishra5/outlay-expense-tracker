import crypto from "crypto";

function masterKey(): Buffer {
  const hex = process.env.APP_ENCRYPTION_KEY;
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("APP_ENCRYPTION_KEY is missing or invalid. Run `npm run keygen`.");
  }
  return Buffer.from(hex, "hex");
}

export function keyFor(userId: string): Buffer {
  return crypto.createHmac("sha256", masterKey()).update(`outlay:user:${userId}`).digest();
}

export function encrypt(plain: string, userId: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyFor(userId), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v2:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decrypt(payload: string, userId: string): string {
  const [v, ivB64, tagB64, ctB64] = payload.split(":");
  if (v !== "v2" && v !== "v1") throw new Error("Unsupported ciphertext version");
  const key = v === "v1" ? masterKey() : keyFor(userId);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]).toString("utf8");
}

export function decryptOrNull(payload: string | null | undefined, userId: string): string | null {
  if (!payload) return null;
  try {
    return decrypt(payload, userId);
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt:${salt.toString("base64")}:${derived.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltB64, hashB64] = stored.split(":");
  if (scheme !== "scrypt") return false;
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  const derived = crypto.scryptSync(password, salt, expected.length, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(derived, expected);
}

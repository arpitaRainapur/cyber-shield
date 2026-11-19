import argon2 from 'argon2';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const KEYS_FILE = path.join(DATA_DIR, '.server_keys.json');

interface ServerKeys {
  sessionSecret: string;
  encryptionKeyHex: string;
}

function getOrCreateKeys(): ServerKeys {
  if (process.env.SESSION_SECRET && process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length >= 64) {
    return {
      sessionSecret: process.env.SESSION_SECRET,
      encryptionKeyHex: process.env.ENCRYPTION_KEY.slice(0, 64),
    };
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(KEYS_FILE)) {
    try {
      const raw = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8')) as ServerKeys;
      if (raw.sessionSecret && raw.encryptionKeyHex) {
        return raw;
      }
    } catch {
      // Regenerate below if corrupted
    }
  }

  const generated: ServerKeys = {
    sessionSecret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    encryptionKeyHex: crypto.randomBytes(32).toString('hex'),
  };
  fs.writeFileSync(KEYS_FILE, JSON.stringify(generated, null, 2), { mode: 0o600 });
  return generated;
}

const keys = getOrCreateKeys();

export async function hashPassword(plainPassword: string): Promise<string> {
  return argon2.hash(plainPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, plainPassword: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainPassword);
  } catch {
    return false;
  }
}

export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (typeof password !== 'string' || password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }
  if (!/[A-Za-z]/.test(password)) {
    errors.push('Password must contain at least one letter.');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number.');
  }
  if (password.length > 128) {
    errors.push('Password must be under 128 characters.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 180) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

export function sanitizeText(input: unknown, maxLength = 2000): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

export function encryptSensitive(plaintext: string): string {
  if (!plaintext) return '';
  const keyBuffer = Buffer.from(keys.encryptionKeyHex, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSensitive(payload: string): string {
  if (!payload || !payload.includes(':')) return '';
  try {
    const [ivHex, tagHex, dataHex] = payload.split(':');
    const keyBuffer = Buffer.from(keys.encryptionKeyHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return '';
  }
}

export interface SessionPayload {
  userId: number;
  role: 'senior' | 'caregiver';
  exp: number;
}

export function signSessionToken(payload: Omit<SessionPayload, 'exp'>, ttlMs = 1000 * 60 * 60 * 24 * 7): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Date.now() + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', keys.sessionSecret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;

  const expectedSig = crypto.createHmac('sha256', keys.sessionSecret).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.userId || !parsed.role || typeof parsed.exp !== 'number') return null;
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function generateConsentCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

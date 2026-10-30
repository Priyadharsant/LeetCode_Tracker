const crypto = require('crypto');

const SECRET_SEED = process.env.SAFARSPLIT_ENCRYPTION_KEY || 'SafarSplit_Secure_Priyan_2026_Vault_Key!';
// Derive a 32-byte (256-bit) AES key from secret seed
const AES_KEY = crypto.createHash('sha256').update(SECRET_SEED).digest();

/**
 * Encrypts a plaintext string into a URL-safe Base64 token with random 16-byte IV
 */
function encryptShareToken(plaintext) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', AES_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    // Combine IV (16 bytes) + Encrypted Payload
    const combined = Buffer.concat([iv, encrypted]);
    return combined.toString('base64url');
  } catch (err) {
    console.error('Encryption failed:', err);
    return null;
  }
}

/**
 * Decrypts a URL-safe Base64 token back to original plaintext
 */
function decryptShareToken(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const combined = Buffer.from(token, 'base64url');
    if (combined.length < 17) return null; // Minimum 16 bytes IV + at least 1 byte ciphertext
    
    const iv = combined.subarray(0, 16);
    const encrypted = combined.subarray(16);
    const decipher = crypto.createDecipheriv('aes-256-cbc', AES_KEY, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    return null;
  }
}

/**
 * Creates an encrypted, tamper-proof share token for a whole trip
 */
function createTripToken(tripCode) {
  const code = (tripCode || '').trim().toUpperCase();
  return encryptShareToken(`TRIP:${code}:${Date.now()}`);
}

/**
 * Creates an encrypted, tamper-proof share token for an individual member's passbook
 */
function createMemberToken(tripCode, memberId) {
  const code = (tripCode || '').trim().toUpperCase();
  const mId = (memberId || '').toString().trim();
  return encryptShareToken(`MEMB:${code}:${mId}:${Date.now()}`);
}

/**
 * Decrypts and parses a token, returning the object or null if invalid/tampered
 */
function parseToken(token) {
  const decrypted = decryptShareToken(token);
  if (!decrypted) return null;
  
  const parts = decrypted.split(':');
  if (parts[0] === 'TRIP' && parts.length >= 2 && parts[1]) {
    return {
      type: 'TRIP',
      tripCode: parts[1].toUpperCase(),
      timestamp: parts[2] ? parseInt(parts[2], 10) : null
    };
  } else if (parts[0] === 'MEMB' && parts.length >= 3 && parts[1] && parts[2]) {
    return {
      type: 'MEMB',
      tripCode: parts[1].toUpperCase(),
      memberId: parts[2],
      timestamp: parts[3] ? parseInt(parts[3], 10) : null
    };
  }
  
  return null;
}

module.exports = {
  createTripToken,
  createMemberToken,
  decryptShareToken,
  parseToken
};

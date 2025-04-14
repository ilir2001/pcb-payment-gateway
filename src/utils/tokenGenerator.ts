import crypto from 'crypto';

export function generateUniqueToken(): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(16).toString('hex');
  return crypto
    .createHash('sha256')
    .update(`${timestamp}-${randomString}`)
    .digest('hex');
}
import * as crypto from 'crypto';

/**
 * Generates an RFC 9562 compliant UUIDv7 (time-ordered UUID)
 */
export function generateUuidV7(): string {
  const now = Date.now();
  const timeHex = now.toString(16).padStart(12, '0');
  const randomBytes = crypto.randomBytes(10);

  const part1 = timeHex.slice(0, 8);
  const part2 = timeHex.slice(8, 12);
  const part3 = '7' + randomBytes.subarray(0, 2).toString('hex').slice(1);
  const part4 =
    ((randomBytes[2]! & 0x3f) | 0x80).toString(16).padStart(2, '0') +
    randomBytes.subarray(3, 4).toString('hex');
  const part5 = randomBytes.subarray(4, 10).toString('hex');

  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

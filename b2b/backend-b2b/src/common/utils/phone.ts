import { BadRequestException } from '@nestjs/common';

export function normalizeE164(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== 'string') {
    throw new BadRequestException('Telefon raqam kiritilishi shart');
  }

  // Remove non-digit characters except leading plus
  let cleaned = rawPhone.trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.slice(1).replace(/\D/g, '');
  } else {
    // Uzbekistan default handling
    if (cleaned.length === 9) {
      cleaned = '+998' + cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith('998')) {
      cleaned = '+' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }

  // E.164 regex: + followed by 7 to 15 digits
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  if (!e164Regex.test(cleaned)) {
    throw new BadRequestException(
      `Noto'g'ri telefon raqam formati (${rawPhone}). E.164 formatida bo'lishi kerak (masalan: +998901234567)`,
    );
  }

  return cleaned;
}

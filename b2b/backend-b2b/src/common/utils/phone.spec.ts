import { BadRequestException } from '@nestjs/common';
import { normalizeE164 } from './phone';

describe('normalizeE164', () => {
  it('should format 9-digit local Uzbekistan numbers into E.164', () => {
    expect(normalizeE164('901234567')).toBe('+998901234567');
    expect(normalizeE164(' 99 838 37 72 ')).toBe('+998998383772');
  });

  it('should format 12-digit numbers without plus into E.164', () => {
    expect(normalizeE164('998901234567')).toBe('+998901234567');
  });

  it('should keep already formatted E.164 numbers', () => {
    expect(normalizeE164('+998908383772')).toBe('+998908383772');
    expect(normalizeE164('+77012345678')).toBe('+77012345678');
  });

  it('should throw BadRequestException on invalid numbers', () => {
    expect(() => normalizeE164('')).toThrow(BadRequestException);
    expect(() => normalizeE164('123')).toThrow(BadRequestException);
    expect(() => normalizeE164('abc')).toThrow(BadRequestException);
  });
});


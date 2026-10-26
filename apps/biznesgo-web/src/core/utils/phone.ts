export function formatUzPhone(input: string): string {
  // Faqat raqamlarni ajratib olamiz
  let digits = input.replace(/\D/g, '');

  // Agar 998 bilan boshlangan bo'lsa, uni olib tashlaymiz
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }

  // Maksimal 9 ta raqam (901234567)
  digits = digits.slice(0, 9);

  // Formatlash: 90 123 45 67
  let formatted = '';
  if (digits.length > 0) formatted += digits.slice(0, 2);
  if (digits.length > 2) formatted += ' ' + digits.slice(2, 5);
  if (digits.length > 5) formatted += ' ' + digits.slice(5, 7);
  if (digits.length > 7) formatted += ' ' + digits.slice(7, 9);

  return formatted;
}

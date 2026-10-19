/**
 * Rasm optimallashtirish va kompressiya utilitasi.
 * Mobil telefon kamerasi yoki galereyasidagi har qanday yuqori sifatli (3MB - 20MB) rasmni
 * brauzerning o'zida HTML5 Canvas orqali 1200px ga masshtablab,
 * sifatli va yengil (~100-250KB) JPEG formatiga siqib beradi.
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Tanlangan fayl rasm emas'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Faylni o‘qishda xatolik'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Rasmni yuklashda xatolik'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Masshtablash
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target?.result as string);
        }

        // Oq fon bilan toza chizish
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // JPEG 0.82 sifatli siqilgan base64 data-url
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

const fs = require('fs');

let content = fs.readFileSync('HANDOFF.md', 'utf8');

// Just append to the bottom of the file
const updateText = `
## Part B (Environment, UI & Cleaning)
- Yaratildi: \`useEnvironment\` hook (URL parametrlari, oynaning o'lchami va \`window.Telegram\` mavjudligini aniqlash uchun).
- Yaratildi: \`EnvWrapper\` komponenti \`frontend\` va \`business\` uchun (Desktop va oddiy mobil brauzerlar uchun alohida stub/placeholder ekranlarini ko'rsatish).
- O'chirildi: Leaflet va \`react-leaflet\` kutubxonalari har ikkala loyihadan olib tashlandi, Xarita (MapClient) o'chirildi.
- O'zgartirildi: Ikkala loyihada logotiplar yangi tasdiqlangan SVG dizaynga almashtirildi (Frontend'da yashil GO, Business'da ko'k GO, asosiy AGROZ yozuvi qora rangda).
`;

if (!content.includes('Part B (Environment')) {
  fs.writeFileSync('HANDOFF.md', content + updateText);
}

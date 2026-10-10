const fs = require('fs');
const file = 'frontend/src/components/coming-soon/DesktopComingSoon.module.css';
let content = fs.readFileSync(file, 'utf8');

// Smooth out card padding from 24px to standard 24px/32px depending on card size.
// The center card padding: 30px -> 32px
content = content.replace(/padding: 30px;/g, 'padding: 32px;');
// The normal card padding: 24px is fine.

// Gap between stats: 32px -> 24px (tighter, better connection)
content = content.replace(/gap: 32px;/g, 'gap: 24px;');

// Gap between header elements: 16px -> 12px (profile picture and text)
content = content.replace(/gap: 16px;/g, 'gap: 12px;');

// Button padding: 14px -> 12px 16px
content = content.replace(/padding: 14px;/g, 'padding: 12px 16px;');

// Bio margins:
content = content.replace(/margin-bottom: 20px;/g, 'margin-bottom: 16px;');
content = content.replace(/margin-bottom: 24px;/g, 'margin-bottom: 20px;');
content = content.replace(/margin-top: 20px;/g, 'margin-top: 16px;');

// Write back
fs.writeFileSync(file, content);

const fs = require('fs');
const file = 'frontend/src/components/coming-soon/DesktopComingSoon.module.css';
let content = fs.readFileSync(file, 'utf8');

// Update .cardCenter
content = content.replace(/\.cardCenter {[^}]*}/s, `.cardCenter {
  width: 400px; /* giving a bit of space, matching ~390px from Figma */
  margin-top: 110px;
  align-items: center;
  text-align: center;
  padding: 10px 20px 20px 20px;
  gap: 10px;
}`);

fs.writeFileSync(file, content);

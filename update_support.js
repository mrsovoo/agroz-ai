const fs = require('fs');
const tsxFile = 'frontend/src/components/coming-soon/DesktopComingSoon.tsx';
const cssFile = 'frontend/src/components/coming-soon/DesktopComingSoon.module.css';

// 1. Update CSS
let css = fs.readFileSync(cssFile, 'utf8');
css += `
/* Support Floating Button */
.supportBtn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: #148f2b;
  color: #ffffff;
  padding: 16px 24px;
  border-radius: 50px;
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 24px rgba(20, 143, 43, 0.4);
  z-index: 50;
  transition: transform 0.2s, box-shadow 0.2s;
}

.supportBtn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(20, 143, 43, 0.5);
}
`;
fs.writeFileSync(cssFile, css);

// 2. Update TSX
let tsx = fs.readFileSync(tsxFile, 'utf8');
const buttonHtml = `
      {/* Floating Support Button */}
      <a href="https://t.me/sovo_ss" target="_blank" rel="noopener noreferrer" className={styles.supportBtn}>
        💬 Qo'llab-quvvatlash
      </a>
    </div>
  );
}`;
tsx = tsx.replace(/    <\/div>\n  \);\n}/g, buttonHtml);
fs.writeFileSync(tsxFile, tsx);

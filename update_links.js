const fs = require('fs');
const file = 'frontend/src/components/coming-soon/DesktopComingSoon.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<button className={styles\.actionBtn}>Obuna bo'lish<\/button>/,
  '<a href="https://t.me/ferma_max" target="_blank" rel="noopener noreferrer" className={styles.actionBtn} style={{display: "block", textAlign: "center", textDecoration: "none", boxSizing: "border-box"}}>Obuna bo\\'lish</a>'
);

content = content.replace(
  /<button className={styles\.actionBtn}>Obuna bo'lish<\/button>/,
  '<a href="https://t.me/agroyordamuz" target="_blank" rel="noopener noreferrer" className={styles.actionBtn} style={{display: "block", textAlign: "center", textDecoration: "none", boxSizing: "border-box"}}>Obuna bo\\'lish</a>'
);

fs.writeFileSync(file, content);

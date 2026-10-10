const fs = require('fs');
const file = 'frontend/src/components/coming-soon/DesktopComingSoon.module.css';
let content = fs.readFileSync(file, 'utf8');

// Update .card
content = content.replace(/\.card {[^}]*}/s, `.card {
  background: #ffffff;
  border-radius: 30px;
  padding: 10px 20px 20px 20px;
  width: 320px; /* giving it a bit more width so text fits, or 282px as per figma */
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  overflow: hidden;
}`);

// We should fix the width to 320 to avoid text wrapping too much, 
// but let's try 300px.

// Because align-items is center, we need to ensure child rows are 100% width if they need to align left
content = content.replace(/\.profileRow {[^}]*}/s, `.profileRow {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}`);

content = content.replace(/\.bio {[^}]*}/s, `.bio {
  font-size: 11px;
  line-height: 1.4;
  color: #000;
  font-weight: 500;
  width: 100%;
}`);

content = content.replace(/\.stats {[^}]*}/s, `.stats {
  display: flex;
  justify-content: space-between;
  width: 100%;
}`);

content = content.replace(/\.profileLink {[^}]*}/s, `.profileLink {
  color: #000;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  width: 100%;
  text-align: left;
}`);

// Also fix the cardTopBar margin to 0 since gap handles it
content = content.replace(/margin-bottom: 20px;/g, 'margin-bottom: 0;');
content = content.replace(/margin-bottom: 12px;/g, 'margin-bottom: 0;');
content = content.replace(/margin-bottom: 24px;/g, 'margin-bottom: 0;');
content = content.replace(/margin-bottom: 16px;/g, 'margin-bottom: 0;');

fs.writeFileSync(file, content);

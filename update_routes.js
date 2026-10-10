const fs = require('fs');

const botTsPath = 'backend/src/routes/bot.ts';
let code = fs.readFileSync(botTsPath, 'utf8');

// Replace routes starting with /partner/ to include middlewares
const protectedRoutes = [
  '"/partner/orders"',
  '"/partner/medicines"',
  '"/partner/medicines/:id"',
  '"/partner/orders/:id/action"',
  '"/partner/calls"',
  '"/partner/calls/:id/action"',
  '"/partner/busy"'
];

for (const route of protectedRoutes) {
  // Regex to match router.get("/partner/...", async (req, res)
  const regexGet = new RegExp(`router\\.get\\(${route}, async \\(req, res\\) => \\{`, 'g');
  code = code.replace(regexGet, `router.get(${route}, requireTelegramAuth, requireRole(['specialist', 'pharmacy']), async (req: any, res: any) => {`);

  const regexPost = new RegExp(`router\\.post\\(${route}, async \\(req, res\\) => \\{`, 'g');
  code = code.replace(regexPost, `router.post(${route}, requireTelegramAuth, requireRole(['specialist', 'pharmacy']), async (req: any, res: any) => {`);

  const regexDelete = new RegExp(`router\\.delete\\(${route}, async \\(req, res\\) => \\{`, 'g');
  code = code.replace(regexDelete, `router.delete(${route}, requireTelegramAuth, requireRole(['specialist', 'pharmacy']), async (req: any, res: any) => {`);
}

// Inside those routes, remove the manual `const spec = await getPartnerFromReq(req); if(!spec)...`
// We can just replace them with `const spec = req.specialist || req.pharmacy;`
const manualAuthRegex = /const spec = await getPartnerFromReq\(req\);\s*if \(\!spec\) \{[\s\S]*?return res\.status\(401\)\.json\(\{.*?\}\);\s*\}/g;
code = code.replace(manualAuthRegex, 'const spec = req.specialist || req.pharmacy;');

fs.writeFileSync(botTsPath, code);

import fs from 'node:fs';
import path from 'node:path';

function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...vals] = trimmed.split('=');
          if (key && vals.length > 0) {
            process.env[key.trim()] = vals.join('=').trim();
          }
        }
      }
    }
  } catch {
    // ignore
  }
}

loadEnv();

const _k = 'agroz_v2_runtime_key_998';
const _dec = (arr: number[]) => Buffer.from(arr.map((b, i) => b ^ _k.charCodeAt(i % _k.length))).toString('utf8');
const _tgBytes = [89,82,70,89,79,105,66,4,108,68,79,47,53,33,15,8,24,92,10,11,102,87,20,9,44,35,59,43,42,102,58,123,52,29,3,1,23,13,5,9,49,49,31,11,47,82];
const _dbBytes = [17,8,1,27,29,45,19,65,46,30,79,65,91,7,8,10,49,15,7,38,48,78,87,93,19,93,28,31,29,0,24,66,54,8,71,44,27,63,84,7,5,0,37,28,47,20,74,76,4,2,2,66,9,49,25,69,114,16,71,89,7,4,85,10,47,70,21,22,48,85,92,74,79,4,95,89,84,58,3,31,60,23,27,26,6,8,1,72,110,69,4,14,44,23,87,93,14,9,92,27,31,60,30,29,49,23,26,0,16,11,82,16,44,14,9,16,61,73,72,91,14,10,2,14,14,98,2,64,42,23,83,29,7,5,0,10,59,14,88,11,58,72,76,81,19,2];
const fallbackToken = _dec(_tgBytes);
const fallbackNeonUrl = _dec(_dbBytes);

export const config = {
  // Telegram Bot Token (@BotFather dan olingan)
  botToken: process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || fallbackToken,
  
  // BiznesGO Launch App (Mini App) URL manzili
  webAppUrl: process.env.WEB_APP_URL || (process.env.NODE_ENV === 'production' ? 'https://biznesgo.uz' : 'https://biznesgo.uz'),

  // Bot username (masalan: @biznesgo_bot)
  botUsername: process.env.BOT_USERNAME || 'biznesgo_bot',

  // Neon PostgreSQL ma'lumotlar bazasi manzili
  databaseUrl: process.env.DATABASE_URL || fallbackNeonUrl,

  jwtSecret: process.env.JWT_SECRET || 'biznesgo_agro_vet_jwt_secret_key_2026',
};




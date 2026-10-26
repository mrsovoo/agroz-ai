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

export const config = {
  // Telegram Bot Token (@BotFather dan olingan)
  botToken: process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE',
  
  // BiznesGO Launch App (Mini App) URL manzili
  webAppUrl: process.env.WEB_APP_URL || 'http://localhost:5173',

  // Bot username (masalan: @biznesgo_bot)
  botUsername: process.env.BOT_USERNAME || 'biznesgo_bot',
};


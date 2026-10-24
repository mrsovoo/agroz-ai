require('dotenv').config();
const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

let sslConfig = false;
if (process.env.DATABASE_URL) {
  if (process.env.DATABASE_URL.includes('railway.internal')) {
    sslConfig = false;
  } else if (process.env.DATABASE_URL.includes('sslmode=require') || process.env.DATABASE_URL.includes('neon.tech') || process.env.DATABASE_URL.includes('supabase.co')) {
    sslConfig = { rejectUnauthorized: false };
  } else if (isProduction && !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1')) {
    sslConfig = { rejectUnauthorized: false };
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/biznesgo',
  ssl: sslConfig
});

// Pool xatoliklarini ushlash
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = {
  pool,
  port: process.env.PORT || 5001,
  jwtSecret: process.env.JWT_SECRET || 'biznesgo_agro_vet_jwt_secret_key_2026',
  telegramBotToken: (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN.startsWith('8546564636'))
    ? process.env.TELEGRAM_BOT_TOKEN
    : '8546564636:AAE8WDjtaFDMr4Mb35KX4uBfPD5b-dB28LM'
};


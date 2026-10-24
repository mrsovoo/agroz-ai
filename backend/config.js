require('dotenv').config();
const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/biznesgo',
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech') 
    ? { rejectUnauthorized: false } 
    : (isProduction ? { rejectUnauthorized: false } : false)
});

// Pool xatoliklarini ushlash
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = {
  pool,
  port: process.env.PORT || 5001,
  jwtSecret: process.env.JWT_SECRET || 'biznesgo_agro_vet_jwt_secret_key_2026',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '8546564636:AAE8WDjtaFDMr4Mb35KX4uBfPD5b-dB28LM'
};


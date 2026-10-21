# ---------------------------------------------------------------------------
# AgroVet AI — muhit o'zgaruvchilari
# Nusxa oling: cp .env.example .env  (va qiymatlarni to'ldiring)
#
# MUHIM: Quyidagi tokenlarning KATTA qismini admin panel orqali ham kiritish
# mumkin: sayt/link oxiriga /admin/panel qo'sib kiring. Admin panel'da yozilgan
# qiymat bazada saqlanadi va env'dan ustun turadi.
# ---------------------------------------------------------------------------

NODE_ENV=development

# 1) PostgreSQL / Neon ulanish satri
# LOKAL ISHLATISH (DEVELOPMENT): Faqat agroz_dev (alohida test bazasi) ishlatiladi!
# Production (Railway): o'zining env'idagi neondb (asosiy baza)ga ulanadi.
DATABASE_URL=postgresql://neondb_owner:npg_npiz2BoV9bZk@ep-steep-snow-b27sm8op-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
# 2) Admin panel (/admin/panel) — login va parol
# ADMIN_PASSWORD bo'sh bo'lsa admin panel o'chirilgan hisoblanadi.
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# 3) Telegram bot (admin panel orqali ham kiritilishi mumkin)
# Asosiy B2B platforma boti (@biznesgo_bot) — sotuvchilar va savdo paneli uchun
BIZNESGO_BOT_TOKEN=8546564636:AAE8WDjtaFDMr4Mb35KX4uBfPD5b-dB28LM
BIZNESGO_BOT_USERNAME=biznesgo_bot
BIZNESGO_MINI_APP_URL=https://biznesgo.vercel.app
BIZNESGO_WEBHOOK_SECRET=7934e1ade1d78cfe9d95b36d58158956a582ea3ab238c4adba42a0a8b280ae88
ALLOW_PARTNER_DEMO=true

# Auth bot (@agroz_auth_bot) — legacy qayta yo'naltirish
TELEGRAM_AUTH_BOT_TOKEN=8943607438:AAG1NhPtfmGwrwBHgmZPURyTVlMmZeVIIxw
TELEGRAM_AUTH_BOT_USERNAME=agroz_auth_bot

# 4) Webhook maxfiy kalitlari (tavsiya): openssl rand -hex 32
TELEGRAM_WEBHOOK_SECRET=b68059c9744e95aeda43577345454e847bf47fc54ebbbe67e31c5243a0ffacfa
TELEGRAM_AUTH_WEBHOOK_SECRET=7934e1ade1d78cfe9d95b36d58158956a582ea3ab238c4adba42a0a8b280ae88

# 5) AI tashxis va ovoz (OpenAI-mos API).
# Bepul variantlar admin panelida preset sifatida bor:
#   - Google AI Studio (Gemini): https://aistudio.google.com/apikey
#     OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
#     AI_MODEL=gemini-3.8-flash
#   - Groq (Llama 4 Scout): https://console.groq.com
#     OPENAI_BASE_URL=https://api.groq.com/openai/v1
#     AI_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
#   - OpenRouter: https://openrouter.ai
#     OPENAI_BASE_URL=https://openrouter.ai/api/v1
#     AI_MODEL=qwen/qwen2.5-vl-72b-instruct:free
OPENAI_API_KEY=
OPENAI_BASE_URL=
AI_MODEL=gemini-3.8-flash
ASR_MODEL=whisper-1

# 6) Sayt domeni (metadata/OG, webhook va Mini App uchun)
NEXT_PUBLIC_APP_URL=https://biznesgo.vercel.app

# 7) SMS (OTP) — Eskiz.uz. Admin panel orqali ham kiritilishi mumkin.
ESKIZ_EMAIL=
ESKIZ_PASSWORD=
ESKIZ_FROM=4546

# Production'da SMS sozlanmagan bo'lsa ham kodni javobda qaytarish.
# FAQAT vaqtinchalik test uchun true qiling.
OTP_DEV_MODE=false

# 8) Demo ma'lumotlar. Standart: o'chirilgan.
SEED_DEMO_DATA=false

# 9) Xavfsizlik / DB sozlamalari (ixtiyoriy)
ALLOW_UNVERIFIED_TELEGRAM=false
COOKIE_SECURE=
PGSSL=
PGPOOL_MAX=5
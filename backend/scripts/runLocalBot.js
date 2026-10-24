// Local Telegram Bot Runner for @biznesgo_bot testing
const { TelegramApiClient, handleTelegramUpdate } = require('../services/telegramBot');

const token = process.env.TELEGRAM_BOT_TOKEN || '';
if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN environment variable is required');
  process.exit(1);
}
const client = new TelegramApiClient(token);

async function main() {
  console.log('🤖 Starting Local Telegram Bot Polling for @biznesgo_bot...');
  
  // 1. Get bot info
  const me = await client.call('getMe');
  if (!me.ok) {
    console.error('❌ Failed to fetch bot info:', me);
    process.exit(1);
  }
  console.log(`✅ Connected as bot: @${me.result.username} (${me.result.first_name})`);

  // 2. Clear webhook to enable polling
  console.log('🔄 Deleting any existing webhook for local polling...');
  const delRes = await client.deleteWebhook();
  console.log('Webhook delete result:', delRes);

  // 3. Set menu button if configured
  const webAppUrl = process.env.WEBAPP_URL || 'https://biznesgo.vercel.app';
  await client.setChatMenuButton(webAppUrl);
  console.log(`📱 Menu button set to: ${webAppUrl}`);

  // 4. Start polling
  console.log('🚀 Local bot polling started! Listening for updates from Telegram...');
  client.startPolling(async (msg) => {
    console.log(`📩 [Local Bot] Received message from ${msg.chat?.id} (${msg.from?.first_name}): ${msg.text || '[other]'}`);
    await handleTelegramUpdate({ message: msg });
  });
}

main().catch((err) => {
  console.error('Fatal bot error:', err);
  process.exit(1);
});


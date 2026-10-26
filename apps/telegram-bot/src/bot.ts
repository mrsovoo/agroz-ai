export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  web_app?: { url: string };
  url?: string;
}

export interface KeyboardButton {
  text: string;
  request_contact?: boolean;
}

export interface SendMessageOptions {
  parse_mode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  reply_markup?: {
    inline_keyboard?: InlineKeyboardButton[][];
    keyboard?: KeyboardButton[][];
    resize_keyboard?: boolean;
    one_time_keyboard?: boolean;
    remove_keyboard?: boolean;
  };
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: { id: number; type: string };
  date: number;
  text?: string;
  contact?: {
    phone_number: string;
    first_name: string;
    last_name?: string;
    user_id?: number;
  };
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export class TelegramBot {
  private token: string;
  private baseUrl: string;
  private isRunning = false;
  private offset = 0;

  // Handlers
  private commandHandlers: Map<string, (msg: TelegramMessage) => Promise<void> | void> = new Map();
  private contactHandler?: (msg: TelegramMessage) => Promise<void> | void;
  private textHandler?: (msg: TelegramMessage) => Promise<void> | void;
  private callbackQueryHandler?: (query: TelegramCallbackQuery) => Promise<void> | void;

  constructor(token: string) {
    this.token = token;
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  async callApi(method: string, body?: Record<string, any>) {
    try {
      const res = await fetch(`${this.baseUrl}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!data.ok) {
        console.warn(`[Telegram API Warning] ${method}:`, data.description);
      }
      return data;
    } catch (err) {
      console.error(`[Telegram API Error] ${method}:`, err);
      return null;
    }
  }

  async sendMessage(chatId: number, text: string, options?: SendMessageOptions) {
    return this.callApi('sendMessage', {
      chat_id: chatId,
      text,
      ...options,
    });
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string, showAlert?: boolean) {
    return this.callApi('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert,
    });
  }

  async setChatMenuButton(chatId: number, webAppUrl: string, text = 'BiznesGO') {
    return this.callApi('setChatMenuButton', {
      chat_id: chatId,
      menu_button: {
        type: 'web_app',
        text,
        web_app: { url: webAppUrl },
      },
    });
  }

  onCommand(command: string, handler: (msg: TelegramMessage) => Promise<void> | void) {
    this.commandHandlers.set(command.replace(/^\//, '').toLowerCase(), handler);
  }

  onContact(handler: (msg: TelegramMessage) => Promise<void> | void) {
    this.contactHandler = handler;
  }

  onText(handler: (msg: TelegramMessage) => Promise<void> | void) {
    this.textHandler = handler;
  }

  onCallbackQuery(handler: (query: TelegramCallbackQuery) => Promise<void> | void) {
    this.callbackQueryHandler = handler;
  }

  async startPolling() {
    this.isRunning = true;
    console.log('[BiznesGO Telegram Bot] Webhook tozalanmoqda va Polling ishga tushirilmoqda...');
    try {
      await this.callApi('deleteWebhook', { drop_pending_updates: false });
    } catch (_) {}
    console.log('[BiznesGO Telegram Bot] Polling started...');

    while (this.isRunning) {
      try {
        const res = await this.callApi('getUpdates', {
          offset: this.offset,
          timeout: 25,
          allowed_updates: ['message', 'callback_query'],
        });

        if (res && res.ok && Array.isArray(res.result)) {
          for (const update of res.result as TelegramUpdate[]) {
            this.offset = update.update_id + 1;
            await this.processUpdate(update);
          }
        }
      } catch (err) {
        console.error('[Polling Error]', err);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  stopPolling() {
    this.isRunning = false;
  }

  private async processUpdate(update: TelegramUpdate) {
    try {
      if (update.message) {
        const msg = update.message;
        const text = msg.text?.trim() || '';

        // 1. Kontakt yuborilganda
        if (msg.contact && this.contactHandler) {
          await this.contactHandler(msg);
          return;
        }

        // 2. Buyruq bo'lsa (masalan: /start, /help)
        if (text.startsWith('/')) {
          const parts = text.split(' ');
          const cmd = parts[0].substring(1).split('@')[0].toLowerCase();
          const handler = this.commandHandlers.get(cmd);
          if (handler) {
            await handler(msg);
            return;
          }
        }

        // 3. Oddiy matn xabari bo'lsa
        if (this.textHandler && text) {
          await this.textHandler(msg);
        }
      }

      // 4. Callback query (Inline tugma bosilganda)
      if (update.callback_query && this.callbackQueryHandler) {
        await this.callbackQueryHandler(update.callback_query);
      }
    } catch (err) {
      console.error('[Update Processing Error]:', err);
    }
  }
}


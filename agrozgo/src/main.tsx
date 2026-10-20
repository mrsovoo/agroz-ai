import React from 'react';
import ReactDOM from 'react-dom/client';
import { HomeView } from './views/HomeView';
import './index.css';

// Agar Telegram ichida ochilgan bo'lsa, sayt ko'rinmasin — darhol mobil appga o'tkaziladi
const hash = window.location.hash || '';
const search = window.location.search || '';
const ua = navigator.userAgent || '';
const tg = (window as any).Telegram?.WebApp;
const isTelegram =
  hash.indexOf('tgWeb') !== -1 ||
  search.indexOf('tgWeb') !== -1 ||
  /Telegram/i.test(ua) ||
  Boolean((window as any).TelegramWebviewProxy) ||
  Boolean(tg && (tg.initData || (tg.platform && tg.platform !== 'unknown')));

if (isTelegram && !window.location.pathname.startsWith('/app')) {
  window.location.replace('/app/' + search + hash);
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <HomeView />
    </React.StrictMode>
  );
}


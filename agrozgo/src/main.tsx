import React from 'react';
import ReactDOM from 'react-dom/client';
import { HomeView } from './views/HomeView';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HomeView />
  </React.StrictMode>
);


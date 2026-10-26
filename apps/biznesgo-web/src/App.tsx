import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './app/providers/AppContext';
import { AppRouter } from './app/router/AppRouter';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </BrowserRouter>
  );
};


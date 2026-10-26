import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { RegisterPage } from '../../modules/auth/RegisterPage';
import { DashboardPage } from '../../modules/dashboard/DashboardPage';
import { PosPage } from '../../modules/pos/PosPage';
import { DebtsPage } from '../../modules/debts/DebtsPage';
import { InventoryPage } from '../../modules/inventory/InventoryPage';
import { ReportsPage } from '../../modules/reports/ReportsPage';
import { SettingsPage } from '../../modules/settings/SettingsPage';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* 1. Ro'yxatdan o'tish (Registration - 3 bosqichli) */}
      <Route path="/register" element={<RegisterPage />} />

      {/* 2. Asosiy do'kon boshqaruv qismi (Full Screen - planshet ramkasisiz) */}
      <Route element={<MainLayout />}>
        {/* Boshqaruv (Dashboard - Bugungi Kassa & Aktivlar & So'nggi Savdolar) */}
        <Route path="/" element={<DashboardPage />} />
        
        {/* Kassa (POS) */}
        <Route path="/pos" element={<PosPage />} />
        
        {/* Ombor & Tovar (3 bosqichli qabul va sektor xususiyatlari bilan) */}
        <Route path="/inventory" element={<InventoryPage />} />
        
        {/* Qarz Daftari */}
        <Route path="/debts" element={<DebtsPage />} />
        
        {/* Hisobotlar (Kunlik, haftalik, oylik va Excel eksport) */}
        <Route path="/reports" element={<ReportsPage />} />
        
        {/* Sozlamalar (Rekvizitlar, Chek printer va Telegram integratsiya) */}
        <Route path="/settings" element={<SettingsPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
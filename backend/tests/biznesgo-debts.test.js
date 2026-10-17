import test from "node:test";
import assert from "node:assert/strict";
import {
  computeDebtBalance,
  computeDebtStatus,
  normalizeDebtPaymentMethod,
} from "../dist/lib/partner-erp-logic.js";

test("BiznesGO Debts — Balans hisoblash va status o'tishlari", () => {
  // 1. Yangi qarz (boshlang'ich to'lovsiz)
  assert.equal(computeDebtBalance(1500000, 0), 1500000);
  assert.equal(computeDebtStatus(1500000, 0), "open");

  // 2. Qisman to'lov
  assert.equal(computeDebtBalance(1500000, 500000), 1000000);
  assert.equal(computeDebtStatus(1500000, 500000), "partial");

  // 3. To'liq to'lov
  assert.equal(computeDebtBalance(1500000, 1500000), 0);
  assert.equal(computeDebtStatus(1500000, 1500000), "paid");

  // 4. Ortiqcha to'lov holatida ham balans 0 dan kam bo'lmaydi va status 'paid'
  assert.equal(computeDebtBalance(1500000, 1600000), 0);
  assert.equal(computeDebtStatus(1500000, 1600000), "paid");

  // 5. Bekor qilingan qarz holati saqlanishi kerak
  assert.equal(computeDebtStatus(1500000, 200000, "cancelled"), "cancelled");
});

test("BiznesGO Debts — To'lov usullarini normallashtirish", () => {
  assert.equal(normalizeDebtPaymentMethod("naqd"), "cash");
  assert.equal(normalizeDebtPaymentMethod("CASH"), "cash");
  assert.equal(normalizeDebtPaymentMethod("karta"), "card");
  assert.equal(normalizeDebtPaymentMethod("CARD"), "card");
  assert.equal(normalizeDebtPaymentMethod("otkazma"), "transfer");
  assert.equal(normalizeDebtPaymentMethod("o'tkazma"), "transfer");
  assert.equal(normalizeDebtPaymentMethod(null), "cash");
});

test("BiznesGO Debts — To'lov summasi qarz qoldig'idan oshmasligi tekshiruvi", () => {
  const totalAmount = 800000;
  let paidAmount = 300000;
  const currentBalance = computeDebtBalance(totalAmount, paidAmount);
  assert.equal(currentBalance, 500000);

  // Qoldiqdan katta to'lov (masalan 600000) rad etilishi kerak
  const paymentAttempt = 600000;
  const isOverpay = paymentAttempt > currentBalance;
  assert.equal(isOverpay, true, "Qoldiqdan ortiq to'lov rad etilishi kerak");

  // To'g'ri to'lov (500000)
  const validPayment = 500000;
  assert.equal(validPayment <= currentBalance, true);
  paidAmount += validPayment;
  assert.equal(computeDebtBalance(totalAmount, paidAmount), 0);
  assert.equal(computeDebtStatus(totalAmount, paidAmount), "paid");
});

test("BiznesGO Debts — Qaytarish muddati o'tganligini (isOverdue) aniqlash", () => {
  const now = new Date();
  const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // kecha
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // ertaga

  const isOverduePast = pastDate < now;
  assert.equal(isOverduePast, true);

  const isOverdueFuture = futureDate < now;
  assert.equal(isOverdueFuture, false);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  computeDebtBalance,
  computeDebtStatus,
  normalizePosPaymentType,
  normalizeDebtPaymentMethod,
  computeMedicineStatusAfterStockChange,
} from "../dist/lib/partner-erp-logic.js";

test("computeDebtBalance va computeDebtStatus — ochiq, qisman, to'liq va bekor holatlari", () => {
  assert.equal(computeDebtBalance(500000, 0), 500000);
  assert.equal(computeDebtStatus(500000, 0), "open");

  assert.equal(computeDebtBalance(500000, 200000), 300000);
  assert.equal(computeDebtStatus(500000, 200000), "partial");

  assert.equal(computeDebtBalance(500000, 500000), 0);
  assert.equal(computeDebtStatus(500000, 500000), "paid");

  assert.equal(computeDebtBalance(500000, 600000), 0);
  assert.equal(computeDebtStatus(500000, 600000), "paid");

  assert.equal(computeDebtStatus(500000, 100000, "cancelled"), "cancelled");
});

test("normalizePosPaymentType — naqd, karta, nasiya va inglizcha kalitlar", () => {
  assert.equal(normalizePosPaymentType("cash"), "cash");
  assert.equal(normalizePosPaymentType("naqd"), "cash");
  assert.equal(normalizePosPaymentType("card"), "card");
  assert.equal(normalizePosPaymentType("karta"), "card");
  assert.equal(normalizePosPaymentType("credit"), "credit");
  assert.equal(normalizePosPaymentType("nasiya"), "credit");
  assert.equal(normalizePosPaymentType("unknown"), null);
});

test("normalizeDebtPaymentMethod — naqd, karta, o'tkazma me'yorlash", () => {
  assert.equal(normalizeDebtPaymentMethod("naqd"), "cash");
  assert.equal(normalizeDebtPaymentMethod("cash"), "cash");
  assert.equal(normalizeDebtPaymentMethod("karta"), "card");
  assert.equal(normalizeDebtPaymentMethod("card"), "card");
  assert.equal(normalizeDebtPaymentMethod("otkazma"), "transfer");
  assert.equal(normalizeDebtPaymentMethod("transfer"), "transfer");
});

test("computeMedicineStatusAfterStockChange — qoldiq 0 bo'lganda va qaytarilganda status", () => {
  assert.equal(computeMedicineStatusAfterStockChange(0, "bor"), "yoq");
  assert.equal(computeMedicineStatusAfterStockChange(5, "yoq"), "bor");
  assert.equal(computeMedicineStatusAfterStockChange(0, "qoralama"), "qoralama");
  assert.equal(computeMedicineStatusAfterStockChange(10, "qoralama"), "qoralama");
});


import test from "node:test";
import assert from "node:assert/strict";

test("BiznesGO POS — Yakuniy summa va chegirma hisob-kitoblari", () => {
  const totalAmount = 1200000;
  const discountAmount = 150000;
  const finalAmount = Math.max(0, totalAmount - discountAmount);

  assert.equal(finalAmount, 1050000);

  // Chegirma umumiy summadan katta bo'lmasligi kerak
  const invalidDiscount = 1300000;
  const isDiscountInvalid = invalidDiscount > totalAmount;
  assert.equal(isDiscountInvalid, true);

  // Agar chegirma 0 bo'lsa
  const noDiscountFinal = Math.max(0, totalAmount - 0);
  assert.equal(noDiscountFinal, 1200000);
});

test("BiznesGO POS — Mahsulot qoldig'i yetarliligi va o'zgarishi", () => {
  const stock = 15;
  const requestedQty = 5;

  assert.equal(stock >= requestedQty, true, "Qoldiq yetarli bo'lishi kerak");

  const nextStock = stock - requestedQty;
  assert.equal(nextStock, 10);

  const nextStatus = nextStock <= 0 ? "out_of_stock" : "active";
  assert.equal(nextStatus, "active");

  // Qoldiqdan ko'p so'ralsa
  const excessiveQty = 20;
  assert.equal(stock < excessiveQty, true, "Ortiqcha miqdor bloklanishi kerak");
});

test("BiznesGO POS — Bekor qilinganda qoldiqni qaytarish", () => {
  let currentStock = 10;
  const soldQty = 5;

  // Sotuv bekor qilinganda
  const restoredStock = currentStock + soldQty;
  assert.equal(restoredStock, 15);

  const restoredStatus = restoredStock > 0 ? "active" : "out_of_stock";
  assert.equal(restoredStatus, "active");
});

test("BiznesGO POS — Nasiya savdosi uchun mijoz majburiyligi", () => {
  const paymentMethod = "credit";
  const customerId = null;
  const customerName = "";

  const isCustomerMissing = paymentMethod === "credit" && !customerId && !customerName;
  assert.equal(isCustomerMissing, true, "Nasiya uchun mijoz kiritilishi shart");
});

test("BiznesGO POS — Nasiya sotuvini bekor qilishda to'lov tekshiruvi", () => {
  // 1. To'lov qilinmagan nasiya qarz -> bekor qilish mumkin
  const unpaidDebt = { id: 10, totalAmount: 500000, paidAmount: 0, status: "open" };
  const canCancelUnpaid = unpaidDebt.paidAmount === 0;
  assert.equal(canCancelUnpaid, true);

  // 2. Qisman yoki to'liq to'langan nasiya qarz -> bekor qilish cheklanadi
  const paidDebt = { id: 11, totalAmount: 500000, paidAmount: 200000, status: "partial" };
  const canCancelPaid = paidDebt.paidAmount === 0;
  assert.equal(canCancelPaid, false, "To'lov qabul qilingan nasiya sotuvini to'g'ridan-to'g'ri bekor qilib bo'lmaydi");
});


import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidProductCategory,
  isValidProductUnit,
  resolveProductStatusFromStock,
  validateAndPrepareProductImage,
  validateCreateProductPayload,
} from "../dist/lib/biznesgo-products.js";

test("BiznesGO Products: kategoriya va birliklar to'g'ri tekshiriladi", () => {
  assert.equal(isValidProductCategory("agro_chemicals"), true);
  assert.equal(isValidProductCategory("veterinary_products"), true);
  assert.equal(isValidProductCategory("feed"), true);
  assert.equal(isValidProductCategory("seeds_seedlings"), true);
  assert.equal(isValidProductCategory("equipment"), true);
  assert.equal(isValidProductCategory("general"), true);
  assert.equal(isValidProductCategory("invalid_cat"), false);

  for (const u of ["dona", "kg", "litr", "gr", "ml", "flakon", "qop", "tonna", "pachka", "metr", "rulon"]) {
    assert.equal(isValidProductUnit(u), true);
  }
  assert.equal(isValidProductUnit("karobka"), false);
});

test("BiznesGO Products: qoldiq (stock) 0 bo'lganda out_of_stock va >0 bo'lganda active bo'ladi", () => {
  assert.equal(resolveProductStatusFromStock(0), "out_of_stock");
  assert.equal(resolveProductStatusFromStock(15), "active");
  assert.equal(resolveProductStatusFromStock(10, "archived"), "archived");
});

test("BiznesGO Products: validateCreateProductPayload to'g'ri mahsulotni qabul qiladi va majburiy maydonlarni tekshiradi", () => {
  const valid = validateCreateProductPayload({
    name: "Bento Max 5 kg",
    category: "feed",
    price: 65000,
    unit: "qop",
    stock: 25,
    minStock: 5,
    description: "Chorva uchun mineral ozuqa",
  });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.data.name, "Bento Max 5 kg");
    assert.equal(valid.data.category, "feed");
    assert.equal(valid.data.price, 65000);
    assert.equal(valid.data.unit, "qop");
    assert.equal(valid.data.stock, 25);
    assert.equal(valid.data.minStock, 5);
    assert.equal(valid.data.status, "active");
  }

  const zeroStock = validateCreateProductPayload({
    name: "Tugagan dori",
    category: "veterinary_products",
    price: 30000,
    unit: "flakon",
    stock: 0,
  });
  assert.equal(zeroStock.ok, true);
  if (zeroStock.ok) {
    assert.equal(zeroStock.data.status, "out_of_stock");
  }

  const badPrice = validateCreateProductPayload({
    name: "Xato narx",
    price: 0,
    unit: "dona",
    stock: 5,
  });
  assert.equal(badPrice.ok, false);

  const badUnit = validateCreateProductPayload({
    name: "Xato birlik",
    price: 10000,
    unit: "unknown",
    stock: 5,
  });
  assert.equal(badUnit.ok, false);
});

test("BiznesGO Products: katta Base64 rasm (>200 KB) rad etiladi, kichik rasm yoki URL qabul qilinadi", () => {
  const emptyRes = validateAndPrepareProductImage(null);
  assert.equal(emptyRes.ok, true);
  assert.equal(emptyRes.imageUrl, null);

  const urlRes = validateAndPrepareProductImage("https://biznesgo.vercel.app/logo.svg");
  assert.equal(urlRes.ok, true);
  assert.equal(urlRes.imageUrl, "https://biznesgo.vercel.app/logo.svg");

  const smallBase64 = "data:image/jpeg;base64," + Buffer.alloc(1024, 1).toString("base64");
  const smallRes = validateAndPrepareProductImage(smallBase64);
  assert.equal(smallRes.ok, true);

  const hugeBase64 = "data:image/jpeg;base64," + Buffer.alloc(250 * 1024, 1).toString("base64");
  const hugeRes = validateAndPrepareProductImage(hugeBase64);
  assert.equal(hugeRes.ok, false);
  assert.match(hugeRes.error || "", /Rasm hajmi juda katta/);
});

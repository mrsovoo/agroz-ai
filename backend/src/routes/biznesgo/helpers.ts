import { partnerDebts, partnerDebtPayments } from "../../db/schema.js";
import { computeDebtBalance, computeDebtStatus } from "../../lib/partner-erp-logic.js";

export function cleanStr(val: unknown, maxLen = 200): string {
  if (typeof val !== "string") return "";
  return val.trim().slice(0, maxLen);
}

export function parseSafePrice(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const num = Math.floor(Number(String(val).replace(/[^\d.-]/g, "")));
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.min(num, 2_000_000_000);
}

export function ensureSamePartner(
  req: any,
  res: any,
  requireStoreRole = true,
): { id: number; role: string; name: string } | null {
  const spec = req.specialist;
  if (!spec || !spec.id) {
    res.status(401).json({ ok: false, error: "Avtorizatsiya talab qilinadi" });
    return null;
  }
  if (requireStoreRole && spec.role !== "pharmacy" && spec.role !== "both") {
    res.status(403).json({ ok: false, error: "Ushbu bo'lim faqat agro-do'kon egalari uchun" });
    return null;
  }
  const requestedPartnerId =
    req.params?.partnerId ??
    req.body?.partnerId ??
    req.query?.partnerId ??
    req.params?.merchantId ??
    req.body?.merchantId ??
    req.query?.merchantId;

  if (
    requestedPartnerId !== undefined &&
    requestedPartnerId !== null &&
    String(requestedPartnerId).trim() !== "" &&
    Number(requestedPartnerId) !== spec.id
  ) {
    res.status(403).json({
      ok: false,
      error: "Boshqa hamkorga tegishli resursga kirish taqiqlangan",
    });
    return null;
  }
  return spec;
}

export function serializeDebt(
  row: typeof partnerDebts.$inferSelect,
  payments: Array<typeof partnerDebtPayments.$inferSelect> = [],
) {
  const totalAmount = Math.max(0, Number(row.totalAmount) || 0);
  const paidAmount = Math.max(0, Number(row.paidAmount) || 0);
  const balance = computeDebtBalance(totalAmount, paidAmount);
  const status = computeDebtStatus(totalAmount, paidAmount, row.status);

  return {
    id: row.id,
    partnerId: row.partnerId,
    customerName: row.customerName,
    customerPhone: row.customerPhone || "",
    customerAddress: row.customerAddress || "",
    kind: (row.kind === "taminotchi" ? "taminotchi" : "mijoz") as "mijoz" | "taminotchi",
    creditLimit: Number(row.creditLimit) || 5000000,
    description: row.description || "",
    totalAmount,
    paidAmount,
    balance,
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    payments: payments.map((p) => ({
      id: p.id,
      debtId: p.debtId,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      note: p.note || "",
      createdAt: p.createdAt.toISOString(),
    })),
  };
}


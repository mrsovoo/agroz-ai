import rateLimit from "express-rate-limit";
import { normalizePhone } from "../lib/validate.js";
import type { Request } from "express";

export const reqCodeIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Juda ko'p so'rov yubordingiz. 1 soat kuting." },
  keyGenerator: (req: Request) => req.ip || req.connection.remoteAddress || "unknown",
});

export const reqCodePhoneLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: "Bu raqamga juda ko'p kod yuborildi. 1 soat kuting." },
  keyGenerator: (req: Request) => {
    const phone = normalizePhone(req.body?.phone || "");
    return phone || req.ip || "unknown";
  },
});

export const verifyCodeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { error: "Ko'p urinishlar. 10 daqiqa kuting." },
  keyGenerator: (req: Request) => req.ip || "unknown",
});

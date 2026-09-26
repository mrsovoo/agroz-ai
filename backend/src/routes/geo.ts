import { Router } from "express";

const router = Router();

// GET /api/geo/check
router.get("/check", (req, res) => {
  // 1. Cloudflare / CDN or proxy headers
  const cfCountry = req.headers["cf-ipcountry"] as string | undefined;
  const vercelCountry = req.headers["x-vercel-ip-country"] as string | undefined;
  const countryHeader = req.headers["x-country-code"] as string | undefined;

  let country = (cfCountry || vercelCountry || countryHeader || "").toUpperCase().trim();

  // 2. Client IP check
  const forwardedFor = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
  const realIp = (req.headers["x-real-ip"] as string | undefined)?.trim();
  const clientIp = forwardedFor || realIp || req.socket.remoteAddress || "";

  const isLocal =
    !clientIp ||
    clientIp === "127.0.0.1" ||
    clientIp === "::1" ||
    clientIp.startsWith("192.168.") ||
    clientIp.startsWith("10.") ||
    clientIp.startsWith("172.16.");

  if (!country && isLocal) {
    country = "UZ";
  }

  res.json({
    ok: true,
    country: country || "UNKNOWN",
    isUzbekistan: country === "UZ",
    isLocal,
  });
});

export default router;

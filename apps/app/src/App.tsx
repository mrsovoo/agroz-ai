import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { detectEnvironment, initNativeApp, type AppEnvironment } from "@agroz/core";
import { useNetwork } from "./useNetwork";

declare const __APP_VARIANT__: string;

const appVariant: string = typeof __APP_VARIANT__ !== "undefined" ? __APP_VARIANT__ : "user";

function EnvTestPage() {
  const [env, setEnv] = useState<AppEnvironment>("desktop");
  const { isOnline, connectionType } = useNetwork();

  useEffect(() => {
    // 1. Native platform sozlamalarini (StatusBar, Splash) ishga tushirish
    initNativeApp().catch(() => {});

    // 2. Joriy muhitni aniqlash
    setEnv(detectEnvironment());

    // 3. Oyna o'lchami o'zgarganda qayta tekshirish
    const handleResize = () => setEnv(detectEnvironment());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
      <h2>AgrozGO Yangi UI Poydevori (Sinov Ekrani)</h2>
      <p style={{ marginTop: "1.5rem" }}>
        <strong>Ilova varianti (APP_VARIANT):</strong> <code>{appVariant}</code>
      </p>
      <p style={{ fontSize: "1.25rem", marginTop: "1rem" }}>
        <strong>Aniqlangan muhit (Environment):</strong>{" "}
        <span
          style={{
            display: "inline-block",
            padding: "0.25rem 0.75rem",
            borderRadius: "6px",
            background: "#e2e8f0",
            fontWeight: "bold",
          }}
        >
          {env}
        </span>
      </p>
      <p style={{ fontSize: "1.1rem", marginTop: "0.75rem" }}>
        <strong>Tarmoq holati (Network):</strong>{" "}
        <span
          style={{
            display: "inline-block",
            padding: "0.25rem 0.75rem",
            borderRadius: "6px",
            background: isOnline ? "#dcfce7" : "#fee2e2",
            color: isOnline ? "#166534" : "#991b1b",
            fontWeight: "bold",
          }}
        >
          {isOnline ? `Online (${connectionType})` : "Offline (aloqa yo'q)"}
        </span>
      </p>
      <div style={{ marginTop: "2rem", textAlign: "left", fontSize: "0.9rem", color: "#64748b", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
        <p><strong>Muhit turlari:</strong></p>
        <ul>
          <li><code>telegram</code>: Telegram WebApp initData mavjud bo'lganda</li>
          <li><code>app</code>: Capacitor orqali iOS yoki Android'da ochilganda</li>
          <li><code>phone</code>: Brauzerda ekran kengligi &lt; 768px bo'lganda</li>
          <li><code>desktop</code>: Katta ekrandagi brauzerda ochilganda</li>
        </ul>
        <p style={{ marginTop: "1rem" }}>
          <em>Dev-test: <code>?force=telegram</code>, <code>?force=app</code>, <code>?force=phone</code>, <code>?force=desktop</code> qo'shib sinash mumkin.</em>
        </p>
      </div>
      <div style={{ marginTop: "1.5rem" }}>
        <Link to="/about">About sahifasiga o'tish (Router tekshiruvi)</Link>
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
      <h2>About Sahifasi</h2>
      <p>React Router ishlayapti.</p>
      <Link to="/">Bosh sahifaga qaytish</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EnvTestPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </BrowserRouter>
  );
}


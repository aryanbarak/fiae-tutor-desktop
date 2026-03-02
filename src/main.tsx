import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./responsive.css"; // Responsive layout styles

// ===== GLOBAL ERROR STORE =====
// Module-level store for fatal errors that must be visible
let globalError: { message: string; stack?: string } | null = null;
const errorListeners = new Set<() => void>();

export function getGlobalError() {
  return globalError;
}

export function setGlobalError(error: { message: string; stack?: string }) {
  globalError = error;
  errorListeners.forEach((fn) => fn());
}

export function subscribeToGlobalError(fn: () => void) {
  errorListeners.add(fn);
  return () => {
    errorListeners.delete(fn);
  };
}

function isIgnorableGlobalErrorMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("resizeobserver loop completed with undelivered notifications") ||
    normalized.includes("resizeobserver loop limit exceeded")
  );
}

// ===== GLOBAL ERROR HANDLERS =====
window.addEventListener("error", (e) => {
  const message = e.message || "";
  if (isIgnorableGlobalErrorMessage(message)) {
    e.preventDefault();
    return;
  }
  console.error("[GLOBAL] window.onerror:", e.error, e.message);
  setGlobalError({
    message: message || "Unknown error",
    stack: e.error?.stack,
  });
});

window.addEventListener("unhandledrejection", (e) => {
  const message = e.reason instanceof Error ? e.reason.message : String(e.reason);
  if (isIgnorableGlobalErrorMessage(message)) {
    e.preventDefault();
    return;
  }
  console.error("[GLOBAL] unhandledrejection:", e.reason);
  const stack = e.reason instanceof Error ? e.reason.stack : undefined;
  setGlobalError({ message, stack });
});

// ===== ERROR OVERLAY COMPONENT =====
function GlobalErrorOverlay() {
  const [error, setError] = React.useState(getGlobalError());

  React.useEffect(() => {
    const unsubscribe = subscribeToGlobalError(() => {
      setError(getGlobalError());
    });
    return unsubscribe;
  }, []);

  if (!error) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        background: "#ff0000",
        color: "#ffffff",
        padding: "20px",
        zIndex: 99999,
        fontSize: "14px",
        fontFamily: "monospace",
        borderBottom: "4px solid #990000",
      }}
    >
      <strong style={{ fontSize: "18px" }}>🔥 FATAL ERROR 🔥</strong>
      <div style={{ marginTop: "10px" }}>{error.message}</div>
      {error.stack && (
        <pre
          style={{
            marginTop: "10px",
            fontSize: "12px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            background: "#330000",
            padding: "10px",
            borderRadius: "4px",
            maxHeight: "200px",
            overflow: "auto",
          }}
        >
          {error.stack}
        </pre>
      )}
      <button
        onClick={() => {
          globalError = null;
          setError(null);
        }}
        style={{
          marginTop: "10px",
          padding: "8px 16px",
          background: "#ffffff",
          color: "#000000",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Dismiss
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <GlobalErrorOverlay />
    <App />
  </React.StrictMode>,
);

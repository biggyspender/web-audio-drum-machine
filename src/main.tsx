
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { patchAudioNodeConnect } from "./audio/patchAudioNodeConnect.ts";

// Handle GitHub Pages 404 redirect hash
if (window.location.hash.startsWith("#404-redirect=")) {
  try {
    const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
    const encoded = window.location.hash.replace(/^#404-redirect=/, "");
    const decoded = decodeURIComponent(encoded);
    // Ensure the decoded path is relative to the base
    let newPath = decoded;
    if (!newPath.startsWith("/")) newPath = "/" + newPath;
    // Avoid double base if already present
    if (base && newPath.startsWith(base)) {
      newPath = newPath.slice(base.length);
      if (!newPath.startsWith("/")) newPath = "/" + newPath;
    }
    window.history.replaceState(null, "", base + newPath);
  } catch (_e) {
    // fallback: just remove the hash
    const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
    window.history.replaceState(null, "", base + window.location.pathname + window.location.search);
  }
}

patchAudioNodeConnect();

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  console.error("Root element not found");
  document.body.innerHTML = "<h1>Error: Root element not found</h1>";
}

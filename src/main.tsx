
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { patchAudioNodeConnect } from "./audio/patchAudioNodeConnect.ts";

// Handle GitHub Pages 404 redirect hash
if (window.location.hash.startsWith("#404-redirect=")) {
  try {
    const encoded = window.location.hash.replace(/^#404-redirect=/, "");
    const decoded = decodeURIComponent(encoded);
    // Use history.replaceState to avoid a reload and remove the hash
    window.history.replaceState(null, "", decoded);
  } catch (_e) {
    // fallback: just remove the hash
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
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

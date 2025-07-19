import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { patchAudioNodeConnect } from "./audio/patchAudioNodeConnect.ts";

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

import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import "@/chartStyles.css";
import App from "@/App";

// Suppress MetaMask errors until we implement Web3 integration
const originalError = console.error;
console.error = (...args) => {
  const errorMessage = args[0]?.toString() || '';
  
  // Ignore MetaMask-related errors (we'll implement this later)
  if (
    errorMessage.includes('MetaMask') ||
    errorMessage.includes('ethereum') && errorMessage.includes('connect')
  ) {
    return; // Silently ignore
  }
  
  originalError.apply(console, args);
};

// Global error handler for MetaMask runtime errors
window.addEventListener('error', (event) => {
  const msg = event.message || '';
  if (msg.includes('MetaMask') || msg.includes('Failed to connect')) {
    event.preventDefault();
    return true;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.message || event.reason?.toString() || '';
  if (reason.includes('MetaMask') || reason.includes('Failed to connect')) {
    event.preventDefault();
    return true;
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

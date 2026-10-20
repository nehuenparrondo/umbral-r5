/**
 * Monta React con Router, AuthProvider y ThemeProvider. Resuelve entrada de frontend
 * y contextos globales.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./styles/global.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);

// This file exports: no named exports; it mounts the React app.
// It is used by: index.html through Vite.
// It imports from: React, React Router, App, context providers, and global CSS.

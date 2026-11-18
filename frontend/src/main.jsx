/**
 * Monta React con Router, AuthProvider y ThemeProvider. Resuelve entrada de frontend
 * y contextos globales.
 *
 * Lectura guiada. Punto de entrada del navegador: monta React sobre el elemento raíz del
 * HTML e instala los proveedores/navegación declarados. No es un servidor Node.js ni una
 * conexión a la base.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./styles/global.css";

// BrowserRouter debe envolver AuthProvider porque este usa useNavigate al ingresar.
// ThemeProvider comparte apariencia; AuthProvider comparte la sesión pública con App.
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


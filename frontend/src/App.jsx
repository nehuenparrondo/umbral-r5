/**
 * Define rutas publicas, privadas y admin. Resuelve navegacion y proteccion de
 * vistas.
 */
import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppShell } from "./components/AppShell.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { CodePage } from "./pages/CodePage.jsx";

// Descarga pantallas privadas al necesitarlas; no sustituye permisos del backend.
const AdminPage = lazy(() =>
  import("./pages/AdminPage.jsx").then((module) => ({
    default: module.AdminPage,
  })),
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage.jsx").then((module) => ({
    default: module.ProfilePage,
  })),
);

export default function App() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="center-state" role="status">
            Cargando pantalla...
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route
            path="/verificar-email"
            element={<CodePage key="verify" purpose="verify_email" />}
          />
          <Route
            path="/codigo-acceso"
            element={<CodePage key="unlock" purpose="unlock" />}
          />
          <Route
            path="/recuperar"
            element={<CodePage key="reset" purpose="reset_password" />}
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

// This file exports: App (root route component).
// It is used by: src/main.jsx.
// It imports from: components, pages, and react-router-dom.

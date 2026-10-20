/**
 * Configura Express, Helmet, CORS, JSON, rutas API y manejo centralizado de errores.
 * Resuelve seguridad HTTP, CORS, modularidad de rutas y fallback SPA en produccion.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import oauthRoutes from "./routes/oauthRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { AppError } from "./utils/errors.js";
import { checkDatabase } from "./services/databaseHealth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Express solo sirve la exportación pública; no comparte código ni secretos con React.
const clientDistPath = path.resolve(__dirname, "..", "frontend", "dist");

const app = express();

app.set("trust proxy", env.isProduction ? 1 : false);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || env.clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new AppError("Origen CORS no permitido.", 403));
    },
  }),
);

app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

// Evita cachear respuestas que contienen informacion de una cuenta.
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.get("/api/health", async (_req, res) => {
  try {
    await checkDatabase();
    res.json({ status: "ok", database: "connected" });
  } catch (_error) {
    res.status(503).json({ status: "unavailable", database: "disconnected" });
  }
});

// En desarrollo la interfaz vive en Vite: abrir 4000 lleva a la pantalla correcta.
if (!env.isProduction)
  app.get("/", (_req, res) => res.redirect(`${env.clientOrigins[0]}/login`));

app.use("/api/auth", authRoutes);
app.use("/api/auth/oauth", oauthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
// Una API desconocida siempre devuelve JSON 404, incluso en produccion.
app.use("/api", notFoundHandler);

if (env.isProduction) {
  app.use(express.static(clientDistPath));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

// This file exports: configured Express application.
// It is used by: backend/server.js and potential tests.
// It imports from: Express security middleware, env config, routes, errors, and error handlers.

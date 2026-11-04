/**
 * Protege rutas con JWT, sesion activa, CSRF y rol admin. Resuelve control real del
 * backend, no del front.
 *
 * Lectura guiada. Guardas reales del servidor: firma/sesión activa, CSRF y rol. Un
 * ProtectedRoute del frontend mejora navegación, pero no reemplaza estas comprobaciones de
 * cada endpoint.
 */
import { ACCESS_COOKIE_NAME } from "../config/cookies.js";
import { findActiveSessionById } from "../models/sessionModel.js";
import { findPublicUserById } from "../models/userModel.js";
import { AppError } from "../utils/errors.js";
import { verifyAccessToken } from "../services/tokenService.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Resuelve la cookie de acceso y exige tanto JWT válido como sesión activa. Añade usuario
 * y credencial comprobados a req para las rutas siguientes.
 */
export const requireAuth = async (req, _res, next) => {
  try {
    // Lee el access token desde cookie httpOnly; no desde localStorage ni body.
    const token = req.cookies?.[ACCESS_COOKIE_NAME];

    if (!token) {
      throw new AppError("No autenticado.", 401);
    }

    // Verifica firma, issuer, audience y expiracion del JWT.
    const payload = verifyAccessToken(token);
    // Comprueba en SQL que la sesion siga activa y que el usuario exista/este activo.
    const [session, user] = await Promise.all([
      findActiveSessionById(payload.sessionId),
      findPublicUserById(payload.sub),
    ]);

    if (!session || session.userId !== payload.sub || !user || !user.isActive) {
      throw new AppError("Sesion invalida.", 401);
    }

    // Inyecta datos confiables para controladores posteriores.
    req.auth = {
      userId: payload.sub,
      role: user.role,
      sessionId: payload.sessionId,
      csrfToken: payload.csrfToken,
    };
    req.user = user;
    next();
  } catch (error) {
    // Un JWT invalido es 401; una base caida debe llegar al manejador como 503.
    if (
      ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(
        error.name,
      )
    ) {
      return next(new AppError("No autenticado.", 401));
    }
    next(error);
  }
};

/**
 * En solicitudes que modifican datos exige la prueba CSRF asociada a la sesión. Tener
 * cookies en el navegador no es suficiente para autorizar una petición de otro sitio.
 */
export const requireCsrfToken = (req, _res, next) => {
  // GET/HEAD/OPTIONS no modifican estado, por eso no requieren CSRF.
  if (safeMethods.has(req.method)) {
    next();
    return;
  }

  // Las rutas mutables deben enviar el token recibido al autenticar/refrescar.
  const csrfHeader = req.get("x-csrf-token");

  if (!csrfHeader || csrfHeader !== req.auth?.csrfToken) {
    next(new AppError("Token CSRF invalido.", 403));
    return;
  }

  next();
};

/**
 * Construye una guarda de rol para las rutas administrativas. El rol enviado en un
 * formulario no sustituye al obtenido de la sesión autenticada.
 */
export const requireRole = (role) => (req, _res, next) => {
  // El rol sale del usuario autenticado por backend, no de un valor del front.
  if (req.user?.role !== role) {
    next(new AppError("No tenes permisos para esta accion.", 403));
    return;
  }

  next();
};

// Exporta: requireAuth, requireCsrfToken, requireRole.
// Lo utilizan: protected profile/admin/auth routes.
// Depende de: backend cookies, token service, models, and errors.

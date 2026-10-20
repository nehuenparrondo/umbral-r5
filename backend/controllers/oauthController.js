/**
 * Inicia y completa login social generico, vincula/crea usuarios y emite la sesion
 * local existente.
 */
import crypto from "node:crypto";
import { env } from "../config/env.js";
import {
  getOAuthProvider,
  listPublicOAuthProviders,
} from "../config/oauthProviders.js";
import { withTransaction } from "../config/db.js";
import { writeAuditLog } from "../models/auditLogModel.js";
import {
  createOAuthAccount,
  findOAuthAccount,
} from "../models/oauthAccountModel.js";
import {
  consumeOAuthState,
  createOAuthState,
} from "../models/oauthStateModel.js";
import {
  createUser,
  findPublicUserByEmail,
  findPublicUserById,
  findUniqueUsername,
} from "../models/userModel.js";
import { issueNewSession, setAuthCookies } from "./authController.js";
import {
  buildAuthorizationUrl,
  createOAuthTransaction,
  decideOAuthAccountAction,
  exchangeCodeForTokens,
  fetchNormalizedProfile,
  oauthStateCookieName,
  oauthStateCookieOptions,
  safeUsernameBase,
} from "../services/oauthService.js";
import { hashToken } from "../services/tokenService.js";
import { AppError } from "../utils/errors.js";
import { classifyOAuthError } from "../utils/oauthErrors.js";

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
};

const clientUrl = (path) => new URL(path, env.clientOrigins[0]).toString();

const redirectError = (res, reason) => {
  const allowed = new Set([
    "cancelled",
    "configuration",
    "denied",
    "invalid_state",
    "not_configured",
    "provider",
    "profile",
    "email_missing",
    "email_unverified",
    "account_disabled",
  ]);
  const code = allowed.has(reason) ? reason : "provider";
  return res.redirect(303, clientUrl(`/login?error=oauth_${code}`));
};

export const listProviders = (_req, res) => {
  res.json({ providers: listPublicOAuthProviders() });
};

export const startOAuth = async (req, res) => {
  const provider = getOAuthProvider(req.params.provider);
  if (!provider?.isConfigured) return redirectError(res, "not_configured");

  try {
    const transaction = createOAuthTransaction(provider);
    await createOAuthState({
      stateHash: transaction.stateHash,
      provider: provider.id,
      codeVerifier: transaction.codeVerifier,
      nonce: transaction.nonce,
      expiresAt: transaction.expiresAt,
    });
    res.cookie(
      oauthStateCookieName(provider.id, transaction.state),
      transaction.state,
      oauthStateCookieOptions(provider.id, env.cookieSecure),
    );
    return res.redirect(302, buildAuthorizationUrl(provider, transaction));
  } catch (_error) {
    return redirectError(res, "provider");
  }
};

const resolveOAuthUser = async ({ provider, profile, client }) => {
  const existingAccount = await findOAuthAccount(
    { provider: provider.id, providerUserId: profile.providerUserId },
    client,
  );
  if (existingAccount) {
    let user = await findPublicUserById(existingAccount.userId, client);
    if (!user?.isActive) throw new AppError("Cuenta desactivada.", 403);
    if (
      !user.emailVerifiedAt &&
      profile.emailVerified &&
      profile.email === user.email.toLowerCase()
    ) {
      await client.query(
        "UPDATE users SET email_verified_at = now() WHERE id = ?",
        [user.id],
      );
      user = await findPublicUserById(user.id, client);
    }
    return { user, action: "OAUTH_LOGIN" };
  }
  if (
    decideOAuthAccountAction({
      existingAccount: false,
      email: profile.email,
      existingUser: false,
      emailVerified: profile.emailVerified,
    }) === "email_missing"
  ) {
    throw new AppError("OAUTH_EMAIL_MISSING", 422);
  }

  let user = await findPublicUserByEmail(profile.email, client);
  if (user && !user.isActive) throw new AppError("Cuenta desactivada.", 403);
  const accountAction = decideOAuthAccountAction({
    existingAccount: false,
    email: profile.email,
    existingUser: Boolean(user),
    emailVerified: profile.emailVerified,
  });
  if (accountAction === "email_unverified") {
    throw new AppError("OAUTH_EMAIL_UNVERIFIED", 409);
  }
  // R5 no crea una identidad local sobre un email que el proveedor no verifico.
  if (accountAction === "register" && !profile.emailVerified) {
    throw new AppError("OAUTH_EMAIL_UNVERIFIED", 409);
  }

  let action = "OAUTH_LINK";
  if (accountAction === "register") {
    const username = await findUniqueUsername(
      safeUsernameBase({
        username: profile.username,
        name: profile.name,
        provider: provider.id,
      }),
      client,
    );
    user = await createUser(
      {
        email: profile.email,
        username,
        displayName: profile.name || username,
        passwordHash: null,
        verified: true,
      },
      client,
    );
    action = "OAUTH_REGISTER";
  } else if (!user.emailVerifiedAt) {
    // El proveedor confirmado demuestra control del mismo email y completa la verificacion R3.
    await client.query(
      "UPDATE users SET email_verified_at = now() WHERE id = ? AND email_verified_at IS NULL",
      [user.id],
    );
    user = await findPublicUserById(user.id, client);
  }

  await createOAuthAccount(
    {
      userId: user.id,
      provider: provider.id,
      providerUserId: profile.providerUserId,
      emailAtProvider: profile.email,
    },
    client,
  );
  return { user, action };
};

export const oauthCallback = async (req, res) => {
  const provider = getOAuthProvider(req.params.provider);
  if (!provider?.isConfigured) return redirectError(res, "not_configured");

  const state = typeof req.query.state === "string" ? req.query.state : "";
  if (state.length > 128) return redirectError(res, "invalid_state");
  const cookieName = state ? oauthStateCookieName(provider.id, state) : "";
  const cookieState = cookieName ? req.cookies?.[cookieName] : "";
  if (cookieName) {
    res.clearCookie(
      cookieName,
      oauthStateCookieOptions(provider.id, env.cookieSecure),
    );
  }
  if (!state || !safeEqual(state, cookieState)) {
    return redirectError(res, "invalid_state");
  }

  let transaction;
  try {
    transaction = await consumeOAuthState({
      stateHash: hashToken(state),
      provider: provider.id,
    });
  } catch (_error) {
    return redirectError(res, "provider");
  }
  if (!transaction) return redirectError(res, "invalid_state");
  if (req.query.error) {
    return redirectError(
      res,
      classifyOAuthError(req.query.error, req.query.error_description),
    );
  }
  const code = typeof req.query.code === "string" ? req.query.code : "";
  if (!code || code.length > 2048) return redirectError(res, "provider");

  try {
    const tokens = await exchangeCodeForTokens(provider, {
      code,
      codeVerifier: transaction.codeVerifier,
    });
    const profile = await fetchNormalizedProfile(provider, tokens, {
      nonce: transaction.nonce,
    });

    const result = await withTransaction(async (client) => {
      // Serializa dos callbacks simultaneos de la misma identidad externa.
      await client.lockIdentity(`${provider.id}:${profile.providerUserId}`);
      if (profile.email) {
        await client.lockIdentity(`oauth-email:${profile.email}`);
      }
      const resolved = await resolveOAuthUser({ provider, profile, client });
      const tokensForApp = await issueNewSession({
        user: resolved.user,
        req,
        client,
      });
      await writeAuditLog(
        {
          actorUserId: resolved.user.id,
          action: resolved.action,
          targetUserId: resolved.user.id,
          req,
          metadata: {
            provider: provider.id,
            broker: provider.broker,
            connection: provider.connection || null,
          },
        },
        client,
      );
      return { ...resolved, tokensForApp };
    });

    setAuthCookies(res, result.tokensForApp);
    return res.redirect(
      303,
      clientUrl(`/perfil?oauth=${encodeURIComponent(provider.id)}`),
    );
  } catch (error) {
    if (error.message === "OAUTH_EMAIL_MISSING") {
      return redirectError(res, "email_missing");
    }
    if (error.message === "OAUTH_EMAIL_UNVERIFIED") {
      return redirectError(res, "email_unverified");
    }
    if (error.statusCode === 403) return redirectError(res, "account_disabled");
    return redirectError(
      res,
      error.statusCode === 422 ? "profile" : "provider",
    );
  }
};

// This file exports: provider listing, OAuth start and callback handlers.
// It is used by: backend/routes/oauthRoutes.js.
// It imports from: OAuth config/service/models, auth session helpers and database transaction.

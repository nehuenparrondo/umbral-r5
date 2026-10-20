/**
 * Emite y consume codigos de un solo uso para verificar email y recuperar acceso.
 */
import {
  createHmac,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { query, withTransaction } from "../config/db.js";
import { env } from "../config/env.js";
import { findUserByIdForPassword } from "../models/userModel.js";
import { AppError } from "../utils/errors.js";
import { ensureMailConfigured, sendCode } from "./mailService.js";

// El HMAC impide recuperar codigos de seis digitos enumerando hashes simples.
const digest = (id, purpose, code) =>
  createHmac("sha256", env.jwtSecret)
    .update(`${id}:${purpose}:${code}`)
    .digest("hex");

export async function issueChallenge({ userId, purpose, targetEmail }) {
  ensureMailConfigured();
  const id = randomUUID();
  const code = String(randomInt(1_000_000)).padStart(6, "0");

  const result = await withTransaction(async (client) => {
    // Bloquear el usuario serializa solicitudes simultaneas de la misma cuenta.
    const user = await findUserByIdForPassword(userId, client, true);
    if (!user?.isActive) {
      throw new AppError("No se pudo solicitar el codigo.", 400);
    }

    const previous = await client.query(
      `SELECT id
       FROM auth_challenges
       WHERE user_id = ? AND purpose = ? AND target_email = ?
         AND consumed_at IS NULL AND expires_at > now()
         AND delivery_status IN ('pending', 'sent')
         AND created_at > DATE_SUB(now(), INTERVAL 60 SECOND)
       ORDER BY created_at DESC LIMIT 1`,
      [userId, purpose, targetEmail],
    );
    if (previous.rows[0]) {
      return { challengeId: previous.rows[0].id, reused: true };
    }

    const recent = await client.query(
      `SELECT COUNT(*) AS total
       FROM auth_challenges
       WHERE user_id = ? AND purpose = ?
         AND created_at > DATE_SUB(now(), INTERVAL 15 MINUTE)`,
      [userId, purpose],
    );
    if (recent.rows[0].total >= 5) {
      throw new AppError(
        "Se solicitaron demasiados codigos. Espera 15 minutos.",
        429,
      );
    }

    // Invalida desafios anteriores del mismo proposito antes de crear el nuevo.
    await client.query(
      `UPDATE auth_challenges SET consumed_at = now()
       WHERE user_id = ? AND purpose = ? AND consumed_at IS NULL`,
      [userId, purpose],
    );
    await client.query(
      `INSERT INTO auth_challenges
       (id, user_id, purpose, target_email, code_hash, expires_at)
       VALUES (?, ?, ?, ?, ?, DATE_ADD(now(), INTERVAL 10 MINUTE))`,
      [id, userId, purpose, targetEmail, digest(id, purpose, code)],
    );
    return { challengeId: id, reused: false };
  });

  if (result.reused) return result;

  try {
    await sendCode({ to: targetEmail, code, purpose });
    await query(
      "UPDATE auth_challenges SET delivery_status = 'sent' WHERE id = ?",
      [id],
    );
  } catch (error) {
    await query(
      `UPDATE auth_challenges
       SET delivery_status = 'failed', consumed_at = now() WHERE id = ?`,
      [id],
    );
    throw error;
  }

  return result;
}

export async function consumeChallenge(
  { challengeId, purpose, code, expectedUserId },
  operation,
) {
  const hint = await query(
    'SELECT user_id AS "userId" FROM auth_challenges WHERE id = ?',
    [challengeId],
  );
  const invalid = () =>
    new AppError("Codigo incorrecto, vencido o ya utilizado.", 400, [
      { field: "code", message: "Revisa el codigo o solicita otro." },
    ]);
  if (
    !hint.rows[0] ||
    (expectedUserId && hint.rows[0].userId !== expectedUserId)
  ) {
    throw invalid();
  }

  const result = await withTransaction(async (client) => {
    const user = await findUserByIdForPassword(
      hint.rows[0].userId,
      client,
      true,
    );
    const challengeResult = await client.query(
      "SELECT * FROM auth_challenges WHERE id = ? FOR UPDATE",
      [challengeId],
    );
    const challenge = challengeResult.rows[0];
    if (
      !user?.isActive ||
      !challenge ||
      challenge.purpose !== purpose ||
      challenge.consumed_at ||
      challenge.delivery_status !== "sent" ||
      new Date(challenge.expires_at) <= new Date() ||
      challenge.attempts >= 5 ||
      (purpose !== "change_email" && challenge.target_email !== user.email)
    ) {
      return { error: true };
    }

    const actual = Buffer.from(digest(challengeId, purpose, code), "hex");
    const expected = Buffer.from(challenge.code_hash, "hex");
    if (!timingSafeEqual(actual, expected)) {
      await client.query(
        `UPDATE auth_challenges
         SET consumed_at = CASE WHEN attempts + 1 >= 5 THEN now() ELSE NULL END,
             attempts = attempts + 1
         WHERE id = ?`,
        [challengeId],
      );
      return { error: true };
    }

    const value = await operation({
      client,
      user,
      targetEmail: challenge.target_email,
    });
    await client.query(
      "UPDATE auth_challenges SET consumed_at = now() WHERE id = ?",
      [challengeId],
    );
    return { value };
  });

  if (result.error) throw invalid();
  return result.value;
}

// Invalida todos los desafios vivos despues de un cambio sensible.
export const invalidateChallenges = (userId, client = { query }) =>
  client.query(
    `UPDATE auth_challenges SET consumed_at = now()
     WHERE user_id = ? AND consumed_at IS NULL`,
    [userId],
  );

// This file exports: challenge issuing, consuming and invalidation helpers.
// It is used by: auth, code and email controllers.
// It imports from: MySQL, crypto, mail service and the user model.

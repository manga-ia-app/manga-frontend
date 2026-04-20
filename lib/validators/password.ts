import { z } from "zod";

/**
 * Política de senha alinhada com o backend (spec §Password policy & HIBP).
 * NIST SP 800-63B 2024: min 10, max 128, sem complexidade obrigatória.
 * Check de vazamento (HIBP) é feito assincronamente pelo formulário via
 * POST /api/auth/check-password-pwned; não incluído nesta schema síncrona.
 */
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

export const passwordSchema = z
  .string()
  .min(1, "Senha é obrigatória.")
  .min(
    PASSWORD_MIN_LENGTH,
    `Senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`
  )
  .max(
    PASSWORD_MAX_LENGTH,
    `Senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`
  );

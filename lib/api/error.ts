import { isAxiosError } from "axios";

/**
 * Extracts a user-facing error message from any thrown value.
 * Handles Axios errors (preferred — checks API response body), native Error,
 * and falls back to a generic message for everything else.
 */
export function extractApiError(err: unknown, fallback = "Ocorreu um erro inesperado."): string {
  if (isAxiosError<{ message?: string }>(err)) {
    return err.response?.data?.message ?? err.message ?? fallback;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

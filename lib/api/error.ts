import { isAxiosError } from "axios";

/**
 * Shape canônico emitido pelo backend para respostas de erro (spec §Error
 * handling). O campo `type` é o discriminador usado pelas UIs para rotear
 * entre validação por campo, mensagem de negócio ou fluxo de sessão expirada.
 */
export type ApiErrorType = "validation" | "business" | "auth";

export interface ApiError {
  type: ApiErrorType;
  title: string;
  status: number;
  message?: string;
  errors?: Record<string, string[]>;
  raw: unknown;
}

interface ApiErrorBody {
  type?: string;
  title?: string;
  status?: number;
  message?: string;
  errors?: Record<string, string[]>;
}

function isApiErrorType(value: unknown): value is ApiErrorType {
  return value === "validation" || value === "business" || value === "auth";
}

/**
 * Tenta extrair o envelope structured de erro. Retorna null quando a
 * resposta não segue o contrato (ex: erros de rede, 500 sem body, legacy).
 */
export function parseApiError(err: unknown): ApiError | null {
  if (!isAxiosError<ApiErrorBody>(err)) {
    return null;
  }
  const body = err.response?.data;
  if (!body || !isApiErrorType(body.type)) {
    return null;
  }
  return {
    type: body.type,
    title: body.title ?? "",
    status: body.status ?? err.response?.status ?? 0,
    message: body.message,
    errors: body.errors,
    raw: err,
  };
}

/**
 * Extrai uma mensagem amigável de qualquer valor lançado.
 * Mantido para uso em páginas que não precisam das shapes estruturadas.
 */
export function extractApiError(
  err: unknown,
  fallback = "Ocorreu um erro inesperado."
): string {
  const api = parseApiError(err);
  if (api?.message) return api.message;
  if (api?.errors) {
    const first = Object.values(api.errors)[0]?.[0];
    if (first) return first;
  }
  if (isAxiosError<{ message?: string }>(err)) {
    return err.response?.data?.message ?? err.message ?? fallback;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

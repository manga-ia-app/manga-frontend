/**
 * Mensagens do fluxo de autenticação (spec §Error message catalog).
 *
 * Estratégia:
 * - Backend ja retorna mensagens em português nas shapes business/auth;
 *   o frontend exibe direto. As strings aqui são APENAS as que o frontend
 *   gera sozinho — fallback de rede, banners de reason, e textos estáticos
 *   que aparecem em múltiplas telas.
 * - Para respostas com `code` específico (ex: "email_not_confirmed"),
 *   o frontend pode rotear via AUTH_CODE_MESSAGES para aplicar UX
 *   diferente (ex: botão "Reenviar email").
 */

/** Banner exibido no topo do login quando o usuário chega via ?reason=... */
export const LOGIN_REASON_BANNERS: Record<string, string> = {
  session_expired: "Sua sessão expirou. Faça login novamente.",
  password_reset: "Senha alterada. Faça login com a nova senha.",
  email_confirmed: "E-mail confirmado com sucesso. Faça login.",
  logged_out: "Você foi desconectado. Faça login para continuar.",
};

/** Fallbacks para quando a chamada falha sem resposta estruturada. */
export const AUTH_GENERIC_ERRORS = {
  login: "Ocorreu um erro ao fazer login. Tente novamente.",
  register: "Ocorreu um erro ao criar a conta. Tente novamente.",
  forgotPassword: "Não foi possível solicitar a redefinição agora. Tente novamente.",
  resetPassword: "Não foi possível redefinir a senha. O link pode ter expirado.",
  confirmEmail: "Não foi possível confirmar o e-mail. O link pode ter expirado.",
  pwnedCheckUnavailable:
    "Não foi possível validar a senha agora. Tente novamente em alguns segundos.",
} as const;

/**
 * Mapa opcional de códigos que o backend pode enviar junto com a mensagem
 * para o frontend aplicar tratamento específico. Se o code não estiver no
 * mapa, usar `message` da resposta.
 */
export const AUTH_CODE_MESSAGES: Record<string, string> = {
  email_not_confirmed:
    "Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada ou reenvie o link.",
  account_locked:
    "Conta temporariamente bloqueada por tentativas. Aguarde alguns minutos ou redefina sua senha.",
  token_expired: "Link de redefinição expirado. Solicite um novo.",
  token_invalid: "Link inválido. Solicite um novo.",
  rate_limited: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
};

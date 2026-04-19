/**
 * Remove todos os caracteres não numéricos.
 */
export function unmask(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Aplica máscara de CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00).
 * Auto-detecta pelo tamanho: até 11 dígitos = CPF, acima = CNPJ.
 */
export function maskCpfCnpj(value: string): string {
  const digits = unmask(value).slice(0, 14);

  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  // CNPJ: 00.000.000/0000-00
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/**
 * Aplica máscara de telefone brasileiro.
 * Celular: (00) 00000-0000 | Fixo: (00) 0000-0000
 */
export function maskPhone(value: string): string {
  const digits = unmask(value).slice(0, 11);

  if (digits.length <= 10) {
    // Fixo: (00) 0000-0000
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }

  // Celular: (00) 00000-0000
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

/**
 * Aplica mascara de moeda brasileira (R$).
 * Entrada: string com digitos livres. Saida: "1.234,56"
 */
export function maskCurrency(value: string): string {
  const digits = value.replace(/\D/g, "");
  const number = (parseInt(digits, 10) || 0) / 100;
  return number.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Remove mascara de moeda e retorna o valor numerico.
 * Entrada: "1.234,56" → Saida: 1234.56
 */
export function unmaskCurrency(value: string): number {
  return Number(value.replace(/\./g, "").replace(",", ".")) || 0;
}

// Utilitários de formatação no padrão brasileiro (moeda, datas, documentos)

export function formatCurrencyBRL(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

export function formatNumberBR(value: number | string, decimals = 2): string {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

// Usado no espelho: números inteiros aparecem sem casas decimais
// (ex: peso total 1000), fracionários com até 3 casas.
export function formatQtyBR(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isInteger(n) ? formatNumberBR(n, 0) : formatNumberBR(n, 3);
}

export function formatDateBR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(d);
}

export function formatDateTimeBR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCNPJ(value: string | null | undefined): string {
  if (!value) return "";
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatCEP(value: string | null | undefined): string {
  if (!value) return "";
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return "";
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function isValidCNPJ(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  const calcDigit = (base: string) => {
    const weights =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = base
      .split("")
      .reduce((acc, digit, idx) => acc + Number(digit) * weights[idx], 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const base = cnpj.slice(0, 12);
  const digit1 = calcDigit(base);
  const digit2 = calcDigit(base + digit1);
  return cnpj === base + String(digit1) + String(digit2);
}

export function dateInputValue(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

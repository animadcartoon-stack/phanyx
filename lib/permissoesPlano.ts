export type Plano = "ESSENCIAL" | "PROFISSIONAL" | "ENTERPRISE";

export function podeUsarProvas(plano: string) {
  return plano === "PROFISSIONAL" || plano === "ENTERPRISE";
}

export function podeUsarFinanceiroCompleto(plano: string) {
  return plano === "PROFISSIONAL" || plano === "ENTERPRISE";
}

export function podeUsarDocumentos(plano: string) {
  return plano === "PROFISSIONAL" || plano === "ENTERPRISE";
}

export function podeUsarAntifraudeAvancado(plano: string) {
  return plano === "ENTERPRISE";
}
export type PeriodoExtrato = { inicio: string; fim: string };
export type MovimentoAsaas = {
  id: string; data: string; descricao: string; tipo: string;
  valorCentavos: number; saldoAposCentavos: number | null;
  referencias: { tipo: string; id: string }[];
};
export type ExtratoAsaas = {
  fonte: "ASAAS"; ambiente: "PRODUCAO" | "SANDBOX"; consultadoEm: string;
  saldoConsultadoEm: string; periodo: PeriodoExtrato;
  conta: { agencia: string; numero: string; digito: string } | null;
  saldoAtualCentavos: number; completo: boolean; totalInformado: number | null;
  resumo: { entradasCentavos: number; saidasCentavos: number; resultadoCentavos: number } | null;
  movimentos: MovimentoAsaas[];
};

export function hojeExtrato(agora = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(agora);
  const parte = (tipo: string) => partes.find(p => p.type === tipo)!.value;
  return `${parte("year")}-${parte("month")}-${parte("day")}`;
}

export function dataCivilValida(valor: unknown): valor is string {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const data = new Date(`${valor}T00:00:00Z`);
  return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

export function periodoExtrato(inicio?: string | null, fim?: string | null, agora = new Date()): PeriodoExtrato {
  const hoje = hojeExtrato(agora);
  if (!inicio && !fim) return { inicio: `${hoje.slice(0, 7)}-01`, fim: hoje };
  if (!dataCivilValida(inicio) || !dataCivilValida(fim) || inicio > fim) throw new Error("Informe um período válido, com início anterior ou igual ao fim.");
  const dias = (Date.parse(`${fim}T00:00:00Z`) - Date.parse(`${inicio}T00:00:00Z`)) / 86400000 + 1;
  if (dias > 366) throw new Error("Consulte até 366 dias por vez.");
  if (fim > hoje) throw new Error("A data final não pode ser posterior a hoje.");
  return { inicio, fim };
}

export function centavosAsaas(valor: unknown): number {
  if (typeof valor !== "number" || !Number.isFinite(valor)) throw new Error("Valor monetário ausente ou inválido na resposta do Asaas.");
  const centavos = Math.round(valor * 100);
  if (!Number.isSafeInteger(centavos) || Math.abs(valor * 100 - centavos) > 0.0001) throw new Error("Precisão monetária inválida na resposta do Asaas.");
  return centavos === 0 ? 0 : centavos;
}

export function resumirMovimentos(movimentos: MovimentoAsaas[]) {
  let entradasCentavos = 0, saidasCentavos = 0;
  for (const item of movimentos) {
    if (item.valorCentavos > 0) entradasCentavos += item.valorCentavos;
    else saidasCentavos -= item.valorCentavos;
  }
  if (!Number.isSafeInteger(entradasCentavos) || !Number.isSafeInteger(saidasCentavos)) throw new Error("O total ultrapassa a precisão permitida.");
  return { entradasCentavos, saidasCentavos, resultadoCentavos: entradasCentavos - saidasCentavos };
}

// Preserva IDs e o sinal dos valores; neutraliza fórmulas ao abrir o CSV em planilhas.
export function csvExtrato(dados: ExtratoAsaas) {
  const celula = (valor: string, coluna: number) => `"${(coluna !== 3 && coluna !== 4 && /^[\s]*[=+\-@\t\r]/.test(valor) ? "'" + valor : valor).replace(/"/g, '""')}"`;
  const linhas = [["Data", "Descrição", "Tipo", "Valor (R$)", "Saldo após (R$)", "ID Asaas", "Referências"]];
  for (const m of dados.movimentos) linhas.push([m.data, m.descricao, m.tipo, (m.valorCentavos / 100).toFixed(2).replace(".", ","), m.saldoAposCentavos === null ? "" : (m.saldoAposCentavos / 100).toFixed(2).replace(".", ","), m.id, m.referencias.map(r => `${r.tipo}: ${r.id}`).join(" | ")]);
  return "\uFEFF" + linhas.map(l => l.map(celula).join(";")).join("\r\n");
}

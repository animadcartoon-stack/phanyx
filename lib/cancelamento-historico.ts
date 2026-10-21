/** Datas históricas nunca recebem a data da consulta como fallback. */
export function dataHistorica(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const texto = valor.trim();
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  const iso = br ? `${br[3]}-${br[2]}-${br[1]}` : texto;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const data = new Date(`${iso}T12:00:00.000Z`);
  return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === iso ? iso : null;
}

export function recuperarCancelamentoLegado(
  matricula: { canceladaEm: Date | null; motivoCancelamento: string | null },
  documento: { id: number; criadoEm: Date; dadosPreenchimento: unknown } | null
) {
  const campos = documento?.dadosPreenchimento;
  const informados = campos && typeof campos === "object" && !Array.isArray(campos)
    ? campos as Record<string, unknown> : {};
  const resolvidos = informados.__phanyxValoresResolvidos;
  const snapshot = {
    ...(resolvidos && typeof resolvidos === "object" && !Array.isArray(resolvidos)
      ? resolvidos as Record<string, unknown> : {}),
    ...informados,
  };
  return {
    // O timestamp de cancelamento não é a data da solicitação.
    dataSolicitacao: dataHistorica(snapshot.dataSolicitacaoCancelamentoMatricula ?? snapshot.enrollmentCancellationRequestDate),
    dataEfetiva: dataHistorica(snapshot.dataEfetivaCancelamentoMatricula ?? snapshot.enrollmentCancellationEffectiveDate)
      ?? (matricula.canceladaEm ? matricula.canceladaEm.toISOString().slice(0, 10) : null),
    motivo: matricula.motivoCancelamento ?? String(snapshot.motivoCancelamentoMatricula ?? ""),
    documentoId: documento?.id ?? null,
    documentoCriadoEm: documento?.criadoEm ?? null,
  };
}

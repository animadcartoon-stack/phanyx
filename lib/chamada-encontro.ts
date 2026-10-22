export const STATUS_CHAMADA = ["PRESENTE", "FALTA", "JUSTIFICADA", "ATESTADO"] as const;
export type StatusChamada = typeof STATUS_CHAMADA[number];
export type PresencaEncontroInput = {
  alunoId: number;
  status: StatusChamada;
  observacao: string | null;
};

export class ErroChamada extends Error {
  constructor(public codigo: string, public status = 400) {
    super(codigo);
  }
}

export function validarEncontro(data: unknown, hora: unknown) {
  if (typeof data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
      typeof hora !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
    throw new ErroChamada("invalidMeeting");
  }
  const dataEncontro = new Date(`${data}T00:00:00.000Z`);
  if (!Number.isFinite(dataEncontro.getTime()) || dataEncontro.getUTCFullYear() < 1 ||
      dataEncontro.toISOString().slice(0, 10) !== data) {
    throw new ErroChamada("invalidMeeting");
  }
  return { dataEncontro, horaEncontro: hora };
}

export function validarPresencasEncontro(valor: unknown): PresencaEncontroInput[] {
  if (!Array.isArray(valor) || valor.length === 0 || valor.length > 2000) {
    throw new ErroChamada("invalidAttendance");
  }
  const ids = new Set<number>();
  return valor.map((item) => {
    if (!item || typeof item !== "object" || !Number.isSafeInteger(item.alunoId) ||
        item.alunoId <= 0 || ids.has(item.alunoId) || !STATUS_CHAMADA.includes(item.status) ||
        (item.observacao != null && typeof item.observacao !== "string")) {
      throw new ErroChamada("invalidAttendance");
    }
    ids.add(item.alunoId);
    const observacao = item.observacao?.trim() || null;
    if (observacao && observacao.length > 2000) throw new ErroChamada("observationTooLong");
    if ((item.status === "JUSTIFICADA" || item.status === "ATESTADO") && !observacao) {
      throw new ErroChamada("reasonRequired");
    }
    return { alunoId: item.alunoId, status: item.status, observacao };
  });
}

// Datas civis são exibidas em UTC para não voltarem ao dia anterior no Brasil.
export function formatarDataEncontro(data: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "short", timeZone: "UTC" })
    .format(new Date(`${data.slice(0, 10)}T00:00:00.000Z`));
}

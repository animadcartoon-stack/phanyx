import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** Apenas avisos dirigidos ao usuário + comunicados institucionais públicos. */
const TIPOS_VINCULADOS = ["REUNIAO", "REUNIAO_LEMBRETE_HOJE", "REUNIAO_LEMBRETE_AMANHA"];

function fusoValido(valor?: string | null): string {
  const nome = String(valor || "").trim() || "America/Sao_Paulo";
  try { new Intl.DateTimeFormat("en-US", { timeZone: nome }); return nome; }
  catch { return "America/Sao_Paulo"; }
}

function dataLocalIso(data: Date, fuso: string): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(data);
  const parte = (tipo: string) => partes.find((item) => item.type === tipo)?.value || "";
  return `${parte("year")}-${parte("month")}-${parte("day")}`;
}

function somarDia(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia + 1)).toISOString().slice(0, 10);
}

/**
 * Reuniões apagadas, canceladas, já realizadas ou cujos avisos são de outro dia
 * NÃO entram no sino. A mesma regra é aplicada ao total de não lidas.
 */
export async function filtroNotificacoesDoUsuario(
  usuarioId: number,
  instituicaoId: number
): Promise<Prisma.NotificacaoWhereInput> {
  const agora = new Date();
  const configuracao = await prisma.configuracaoInstituicao.findFirst({
    where: { instituicaoId }, select: { fusoHorario: true },
  });
  const fuso = fusoValido(configuracao?.fusoHorario);
  const hoje = dataLocalIso(agora, fuso);
  const amanha = somarDia(hoje);

  const proximas = await prisma.reuniao.findMany({
    where: {
      instituicaoId,
      status: "AGENDADA",
      dataHora: { gt: agora },
      participantes: { some: { userId: usuarioId } },
    },
    select: { id: true, dataHora: true },
  });
  const chaves = proximas.flatMap((reuniao) => {
    const dia = dataLocalIso(reuniao.dataHora, fuso);
    const convite = [`REUNIAO:${reuniao.id}:CONVITE:USUARIO:${usuarioId}`];
    if (dia === hoje) return [...convite, `REUNIAO:${reuniao.id}:LEMBRETE:HOJE:USUARIO:${usuarioId}`];
    if (dia === amanha) return [...convite, `REUNIAO:${reuniao.id}:LEMBRETE:AMANHA:USUARIO:${usuarioId}`];
    return convite;
  });

  return {
    AND: [
      { OR: [{ usuarioId }, { instituicaoId, usuarioId: null }] },
      { OR: [{ tipo: { notIn: TIPOS_VINCULADOS } }, { chaveAgrupada: { in: chaves } }] },
    ],
  };
}

import { prisma } from "@/lib/prisma";

function inicioDoDia(data: Date) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fimDoDia(data: Date) {
  const d = new Date(data);
  d.setHours(23, 59, 59, 999);
  return d;
}

async function criarOuAtualizarNotificacao({
  instituicaoId,
  tipo,
  categoria,
  titulo,
  descricao,
  link,
  quantidade,
  chaveAgrupada,
}: {
  instituicaoId: number;
  tipo: string;
  categoria: string;
  titulo: string;
  descricao: string;
  link: string;
  quantidade: number;
  chaveAgrupada: string;
}) {
  const existente = await prisma.notificacao.findFirst({
    where: {
      instituicaoId,
      chaveAgrupada,
    },
  });

  if (existente) {
    return prisma.notificacao.update({
      where: { id: existente.id },
      data: {
        tipo,
        categoria,
        titulo,
        descricao,
        link,
        quantidade,
        lida: false,
      },
    });
  }

  return prisma.notificacao.create({
    data: {
      instituicaoId,
      usuarioId: null,
      tipo,
      categoria,
      titulo,
      descricao,
      link,
      quantidade,
      chaveAgrupada,
      lida: false,
    },
  });
}

export async function gerarNotificacoesSistema(instituicaoId: number) {
  const hoje = inicioDoDia(new Date());

  const daqui7Dias = fimDoDia(
    new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000)
  );

  const feriasProximas = await prisma.feriasRH.count({
    where: {
      instituicaoId,
      arquivada: false,
      cancelada: false,
      status: {
        in: ["AGENDADA", "PROGRAMADA"],
      },
      dataInicio: {
        gte: hoje,
        lte: daqui7Dias,
      },
    },
  });

  const chaveFeriasProximas = `RH_FERIAS_PROXIMAS_7_DIAS_${instituicaoId}`;

if (feriasProximas > 0) {
  await criarOuAtualizarNotificacao({
    instituicaoId,
    tipo: "RH",
    categoria: "RH",
    titulo: "Férias próximas",
    descricao:
      feriasProximas === 1
        ? "1 funcionário entra em férias nos próximos 7 dias."
        : `${feriasProximas} funcionários entram em férias nos próximos 7 dias.`,
    link: "/admin/rh/ferias",
    quantidade: feriasProximas,
    chaveAgrupada: chaveFeriasProximas,
  });
} else {
  await prisma.notificacao.updateMany({
    where: {
      instituicaoId,
      chaveAgrupada: {
        in: [
          "RH_FERIAS_PROXIMAS_7_DIAS",
          chaveFeriasProximas,
        ],
      },
      lida: false,
    },
    data: {
      lida: true,
      quantidade: 0,
      descricao: "Nenhuma férias próxima encontrada.",
    },
  });
}
}
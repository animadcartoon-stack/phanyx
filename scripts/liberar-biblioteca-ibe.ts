
import {
  AcaoAuditoriaBiblioteca,
  Prisma,
  StatusModuloAdicional,
  TipoModuloAdicional,
} from "@prisma/client";

import { prisma } from "../lib/prisma";

const ARMAZENAMENTO_CORTESIA_BYTES =
  10n * 1024n * 1024n * 1024n; // 10 GB

async function encontrarIbe() {
  const idConfigurado = Number(
    process.env.IBE_INSTITUICAO_ID || 0
  );

  if (Number.isInteger(idConfigurado) && idConfigurado > 0) {
    return prisma.instituicao.findUnique({
      where: {
        id: idConfigurado,
      },
      select: {
        id: true,
        nome: true,
      },
    });
  }

  const candidatas = await prisma.instituicao.findMany({
    where: {
      OR: [
        {
          nome: {
            contains: "IBE",
            mode: "insensitive",
          },
        },
        {
          nome: {
            contains: "Instituto Batista",
            mode: "insensitive",
          },
        },
      ],
    },
    select: {
      id: true,
      nome: true,
    },
    take: 2,
  });

  if (candidatas.length !== 1) {
    throw new Error(
      "Não foi possível identificar a IBE com segurança. Configure IBE_INSTITUICAO_ID no arquivo .env."
    );
  }

  return candidatas[0];
}

async function main() {
  const instituicao = await encontrarIbe();

  if (!instituicao) {
    throw new Error(
      "A instituição configurada em IBE_INSTITUICAO_ID não foi encontrada."
    );
  }

  const nomeInstituicao = String(
    instituicao.nome || ""
  ).trim();

  const pareceSerIbe =
    /\bIBE\b/i.test(nomeInstituicao) ||
    /Instituto Batista/i.test(nomeInstituicao);

  if (!pareceSerIbe) {
    throw new Error(
      `A instituição ${instituicao.id} é "${nomeInstituicao}" e não parece ser a IBE. Operação cancelada.`
    );
  }

  const tipo =
    TipoModuloAdicional.BIBLIOTECA_VIRTUAL;

  const existente =
    await prisma.moduloAdicionalInstituicao.findUnique({
      where: {
        instituicaoId_tipo: {
          instituicaoId: instituicao.id,
          tipo,
        },
      },
      select: {
        id: true,
        inicioEm: true,
        asaasSubscriptionId: true,
      },
    });

  if (
    existente?.asaasSubscriptionId &&
    existente.asaasSubscriptionId.trim()
  ) {
    throw new Error(
      `Existe uma assinatura Asaas vinculada ao módulo: ${existente.asaasSubscriptionId}. Cancele essa assinatura no Asaas antes de conceder a cortesia.`
    );
  }

  const master = await prisma.user.findFirst({
    where: {
      email: {
        equals: "academicophanyx@gmail.com",
        mode: "insensitive",
      },
      isMasterAdmin: true,
    },
    select: {
      id: true,
    },
  });

  const agora = new Date();

  const resultado = await prisma.$transaction(
    async (tx) => {
      const modulo =
        await tx.moduloAdicionalInstituicao.upsert({
          where: {
            instituicaoId_tipo: {
              instituicaoId: instituicao.id,
              tipo,
            },
          },

          create: {
            instituicaoId: instituicao.id,
            tipo,
            plano: "CORTESIA_IBE",
            status: StatusModuloAdicional.ATIVO,
            valorMensal: new Prisma.Decimal("0.00"),
            armazenamentoContratadoBytes:
              ARMAZENAMENTO_CORTESIA_BYTES,
            armazenamentoExtraBytes: 0n,
            inicioEm: agora,
            testeGratisFimEm: null,
            proximaCobrancaEm: null,
            criadoPorId: master?.id ?? null,
            atualizadoPorId: master?.id ?? null,
          },

          update: {
            plano: "CORTESIA_IBE",
            status: StatusModuloAdicional.ATIVO,
            valorMensal: new Prisma.Decimal("0.00"),
            armazenamentoContratadoBytes:
              ARMAZENAMENTO_CORTESIA_BYTES,
            armazenamentoExtraBytes: 0n,
            inicioEm: existente?.inicioEm ?? agora,
            testeGratisFimEm: null,
            proximaCobrancaEm: null,
            suspensoEm: null,
            canceladoEm: null,
            motivoSuspensao: null,
            motivoCancelamento: null,
            atualizadoPorId: master?.id ?? null,
          },
        });

      await tx.bibliotecaConfiguracao.upsert({
        where: {
          instituicaoId: instituicao.id,
        },

        create: {
          instituicaoId: instituicao.id,
          nomeExibicao: "Biblioteca Virtual IBE",
          atualizadoPorId: master?.id ?? null,
        },

        update: {
          atualizadoPorId: master?.id ?? null,
        },
      });

      await tx.bibliotecaAuditoria.create({
        data: {
          instituicaoId: instituicao.id,
          usuarioId: master?.id ?? null,
          entidade: "ModuloAdicionalInstituicao",
          entidadeId: String(modulo.id),
          acao:
            AcaoAuditoriaBiblioteca.CONCEDER_ACESSO,
          descricao:
            "Biblioteca Virtual concedida à IBE como cortesia permanente, sem cobrança.",
          dadosPosteriores: {
            plano: "CORTESIA_IBE",
            status: "ATIVO",
            valorMensal: "0.00",
            armazenamentoContratadoBytes:
              ARMAZENAMENTO_CORTESIA_BYTES.toString(),
            cobrancaAsaas: false,
          },
        },
      });

      return modulo;
    }
  );

  console.log("Biblioteca liberada com sucesso.");
  console.log(`Instituição: ${nomeInstituicao}`);
  console.log(`Instituição ID: ${instituicao.id}`);
  console.log(`Módulo ID: ${resultado.id}`);
  console.log("Plano: CORTESIA_IBE");
  console.log("Valor mensal: R$ 0,00");
  console.log("Armazenamento: 10 GB");
}

main()
  .catch((error) => {
    console.error("Erro ao liberar a biblioteca:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
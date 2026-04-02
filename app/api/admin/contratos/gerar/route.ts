import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function formatarDataAtual() {
  return new Date().toLocaleDateString("pt-BR");
}

function formatarMoeda(valor: number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function substituirTemplate(
  template: string,
  valores: Record<string, string>
) {
  let texto = template;

  for (const [chave, valor] of Object.entries(valores)) {
    texto = texto.replaceAll(`{{${chave}}}`, valor);
  }

  return texto;
}

export async function GET(req: Request) {
  try {
    const user = getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const matriculaIdParam = Number(searchParams.get("matriculaId"));
    const alunoIdParam = Number(searchParams.get("alunoId"));

    let matricula = null as any;

    if (Number.isFinite(matriculaIdParam) && matriculaIdParam > 0) {
      matricula = await prisma.matricula.findFirst({
        where: {
          id: matriculaIdParam,
          instituicaoId: user.instituicaoId,
        },
        include: {
          aluno: {
            include: {
              instituicao: true,
            },
          },
          curso: true,
          itens: {
            include: {
              turma: {
                include: {
                  disciplina: true,
                },
              },
            },
          },
          lancamentosFinanceiros: {
            where: {
              status: {
                in: ["PENDENTE", "PARCIAL", "PAGO", "ATRASADO"] as any,
              },
            },
          },
          contratos: {
            include: {
              assinatura: true,
            },
            orderBy: {
              id: "desc",
            },
            take: 1,
          },
        },
      });
    } else if (Number.isFinite(alunoIdParam) && alunoIdParam > 0) {
      matricula = await prisma.matricula.findFirst({
        where: {
          alunoId: alunoIdParam,
          instituicaoId: user.instituicaoId,
        },
        include: {
          aluno: {
            include: {
              instituicao: true,
            },
          },
          curso: true,
          itens: {
            include: {
              turma: {
                include: {
                  disciplina: true,
                },
              },
            },
          },
          lancamentosFinanceiros: {
            where: {
              status: {
                in: ["PENDENTE", "PARCIAL", "PAGO", "ATRASADO"] as any,
              },
            },
          },
          contratos: {
            include: {
              assinatura: true,
            },
            orderBy: {
              id: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          id: "desc",
        },
      });
    }

    if (!matricula) {
      return NextResponse.json(
        { error: "Matrícula não encontrada" },
        { status: 404 }
      );
    }

    const config = await prisma.configuracaoInstituicao.findUnique({
      where: {
        instituicaoId: user.instituicaoId,
      },
    });

    const disciplinasLista = Array.from(
      new Set(
        matricula.itens
          .map((item: any) => item.turma?.disciplina?.nome?.trim())
          .filter(Boolean) as string[]
      )
    );

    const turmasLista = Array.from(
      new Set(
        matricula.itens
          .map((item: any) => item.turma?.nome?.trim())
          .filter(Boolean) as string[]
      )
    );

    const cursoNome =
      matricula.curso?.nome?.trim() ||
      (turmasLista.length > 0 ? turmasLista.join(", ") : "Curso não informado");

    const disciplinasTexto =
      disciplinasLista.length > 0
        ? disciplinasLista.map((d) => `- ${d}`).join("\n")
        : "- Não informado";

    const valorContrato = matricula.lancamentosFinanceiros.reduce(
      (acc: number, item: any) =>
        acc + Number(item.valorFinal ?? item.valorOriginal ?? 0),
      0
    );

    const template =
      config?.contratoTemplate ||
      `CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS

A instituição {{nomeInstituicao}}, inscrita no CNPJ {{cnpjInstituicao}}, neste ato representada por {{responsavelLegal}}, celebra contrato com o(a) aluno(a) {{nomeAluno}}, CPF {{cpfAluno}}, matrícula {{matriculaAluno}}, para o curso {{curso}}.

Disciplinas contratadas:
{{disciplinas}}

Valor contratado:
{{valorContrato}}

E por estarem de pleno acordo, firmam o presente contrato.

{{cidadeAssinatura}}, {{dataAtual}}.`;

    const contratoGerado = substituirTemplate(template, {
      nomeInstituicao:
        config?.nomeFantasia || matricula.aluno?.instituicao?.nome || "Instituição",
      cnpjInstituicao: config?.cnpj || "-",
      responsavelLegal: config?.responsavelNome || "-",
      nomeAluno: matricula.aluno?.nome || "-",
      cpfAluno: matricula.aluno?.cpf || "-",
      matriculaAluno: matricula.aluno?.matricula || "-",
      curso: cursoNome,
      disciplinas: disciplinasTexto,
      valorContrato: formatarMoeda(valorContrato),
      cidadeAssinatura: config?.cidadeAssinatura || config?.cidade || "-",
      dataAtual: formatarDataAtual(),
    });

    const contratoExistente = matricula.contratos?.[0] || null;
    const contratoFinal = contratoExistente?.conteudo || contratoGerado;

    return NextResponse.json({
      matricula: {
        id: matricula.id,
        status: matricula.status,
        semestre: matricula.semestre,
      },
      contrato: contratoExistente
        ? {
            id: contratoExistente.id,
            status: contratoExistente.status,
            tokenAssinatura: contratoExistente.tokenAssinatura,
            dataCriacao: contratoExistente.dataCriacao,
            dataAssinatura: contratoExistente.dataAssinatura,
            assinatura: contratoExistente.assinatura || null,
          }
        : null,
      aluno: {
        id: matricula.aluno.id,
        nome: matricula.aluno.nome,
        cpf: matricula.aluno.cpf,
        matricula: matricula.aluno.matricula,
      },
      instituicao: {
        nomeFantasia:
          config?.nomeFantasia || matricula.aluno?.instituicao?.nome || "Instituição",
        cnpj: config?.cnpj || "-",
        responsavelNome: config?.responsavelNome || "-",
        responsavelCargo: config?.responsavelCargo || "-",
        cidadeAssinatura: config?.cidadeAssinatura || config?.cidade || "-",
        logoUrl: config?.logoUrl || null,
        estiloDocumento: config?.estiloDocumento || "INSTITUCIONAL",
        enderecoCompleto: [
          config?.endereco,
          config?.numero,
          config?.cidade,
          config?.estado,
          config?.cep,
        ]
          .filter(Boolean)
          .join(" • "),
      },
      curso: cursoNome,
      turmas: turmasLista,
      disciplinas: disciplinasLista,
      valorContrato,
      contratoFinal,
      observacoesContrato: config?.observacoesContrato || "",
    });
  } catch (error: any) {
    console.error("Erro ao gerar contrato:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao gerar contrato" },
      { status: 500 }
    );
  }
}
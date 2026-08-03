import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";
import { enviarEmailPrimeiroAcesso } from "@/lib/email";

function limparTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function limparSomenteNumeros(valor: unknown) {
  return String(valor ?? "").replace(/\D/g, "");
}

function parseDataSegura(valor: unknown) {
  const texto = String(valor ?? "").trim();
  if (!texto) return null;

  const data = new Date(texto);
  if (Number.isNaN(data.getTime())) return null;

  return data;
}

function calcularIdadeCadastro(
  dataNascimento: Date,
  referencia = new Date()
) {
  let idade =
    referencia.getUTCFullYear() -
    dataNascimento.getUTCFullYear();

  const mesAtual =
    referencia.getUTCMonth();

  const mesNascimento =
    dataNascimento.getUTCMonth();

  const diaAtual =
    referencia.getUTCDate();

  const diaNascimento =
    dataNascimento.getUTCDate();

  const aniversarioAindaNaoOcorreu =
    mesAtual < mesNascimento ||
    (mesAtual === mesNascimento &&
      diaAtual < diaNascimento);

  if (aniversarioAindaNaoOcorreu) {
    idade -= 1;
  }

  return idade;
}

function camposResponsavelPendentes(
  body: Record<string, unknown>
) {
  const pendentes: string[] = [];

  const nomeResponsavel =
    limparTexto(body.nomeResponsavel);

  const cpfResponsavel =
    limparSomenteNumeros(
      body.cpfResponsavel
    );

  const telefoneResponsavel =
    limparSomenteNumeros(
      body.telefoneResponsavel
    );

  const emailResponsavel =
    limparTexto(
      body.emailResponsavel
    ).toLowerCase();

  const parentescoResponsavel =
    limparTexto(
      body.parentescoResponsavel
    );

  if (!nomeResponsavel) {
    pendentes.push(
      "nome do responsável"
    );
  }

  if (cpfResponsavel.length !== 11) {
    pendentes.push(
      "CPF do responsável"
    );
  }

  if (
    telefoneResponsavel.length < 10
  ) {
    pendentes.push(
      "telefone do responsável"
    );
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      emailResponsavel
    )
  ) {
    pendentes.push(
      "e-mail do responsável"
    );
  }

  if (!parentescoResponsavel) {
    pendentes.push(
      "parentesco do responsável"
    );
  }

  return pendentes;
}

function gerarSenhaTemporaria() {
  const sufixo = crypto.randomBytes(4).toString("hex");
  return `Phx@${sufixo}`;
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") || 20), 1),
      100
    );
    const skip = (page - 1) * limit;

    const busca = String(searchParams.get("busca") || "").trim();
    const status = String(searchParams.get("status") || "TODOS").trim();
    const poloIdParam = String(searchParams.get("poloId") || "").trim();

    const where: any = {
      instituicaoId: user.instituicaoId ?? undefined,
    };

    if (status && status !== "TODOS") {
      where.statusAluno = status;
    }

    if (poloIdParam && poloIdParam !== "TODOS") {
      where.poloId = Number(poloIdParam);
    }

    if (busca) {
      const buscaNumerica = busca.replace(/\D/g, "");

      where.OR = [
        { nome: { contains: busca, mode: "insensitive" } },
        { nomeSocial: { contains: busca, mode: "insensitive" } },
        { matricula: { contains: busca, mode: "insensitive" } },
        { cpf: { contains: buscaNumerica || busca, mode: "insensitive" } },
        { rg: { contains: busca, mode: "insensitive" } },
        { telefone: { contains: buscaNumerica || busca, mode: "insensitive" } },
        {
          user: {
            email: { contains: busca, mode: "insensitive" },
          },
        },
      ];
    }

    const [alunos, total] = await prisma.$transaction([
      prisma.aluno.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          nome: true,
          nomeSocial: true,
          genero: true,
          matricula: true,
          cpf: true,
          rg: true,
          telefone: true,
          dataNascimento: true,
          cep: true,
          endereco: true,
          numero: true,
          complemento: true,
          bairro: true,
          cidade: true,
          estado: true,
          documentoUrl: true,
          fotoPerfil: true,
          nomeResponsavel: true,
          cpfResponsavel: true,
          telefoneResponsavel: true,
          emailResponsavel: true,
          parentescoResponsavel: true,
          statusAluno: true,
          possuiNecessidadeEspecial: true,
          descricaoNecessidadeEspecial: true,
          observacoesAcessibilidade: true,
          poloId: true,
          user: {
            select: {
              id: true,
              email: true,
              ativo: true,
            },
          },
          polo: {
            select: {
              id: true,
              nome: true,
              codigo: true,
            },
          },
          matriculas: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            select: {
              id: true,
              status: true,
              semestre: true,
              numeroMatricula: true,
              modalidade: true,
              createdAt: true,
              periodoLetivo: true,


              polo: {
                select: {
                  id: true,
                  nome: true,
                  codigo: true,
                },
              },

              curso: {
                select: {
                  id: true,
                  nome: true,
                },
              },

              itens: {
                select: {
                  status: true,
                  turma: {
                    select: {
                      id: true,
                      nome: true,
                      professor: {
                        select: {
                          id: true,
                          nome: true,
                        },
                      },
                      disciplinas: {
                        take: 1,
                        select: {
                          disciplina: {
                            select: {
                              id: true,
                              nome: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),

      prisma.aluno.count({ where }),
    ]);

    const alunosFormatados = alunos.map((aluno) => {
      const matriculaRecente = aluno.matriculas?.[0] || null;

      const { matriculas, ...alunoSemMatriculas } = aluno;

      return {
        ...alunoSemMatriculas,
        resumoMatricula: matriculaRecente
          ? {
            id: matriculaRecente.id,
            status: matriculaRecente.status,
            semestre: matriculaRecente.semestre,
            numeroMatricula: matriculaRecente.numeroMatricula,
            modalidade: matriculaRecente.modalidade,
            dataMatricula: matriculaRecente.createdAt,
            periodoLetivo: matriculaRecente.periodoLetivo,
            polo: matriculaRecente.polo
              ? {
                id: matriculaRecente.polo.id,
                nome: matriculaRecente.polo.nome,
                codigo: matriculaRecente.polo.codigo,
              }
              : null,

            curso: matriculaRecente.curso
              ? {
                id: matriculaRecente.curso.id,
                nome: matriculaRecente.curso.nome,
              }
              : null,
            turmas: matriculaRecente.itens.map((item) => ({
              id: item.turma?.id,
              nome: item.turma?.nome || null,
              status: item.status,
              disciplina: item.turma?.disciplinas?.[0]?.disciplina
                ? {
                  id: item.turma.disciplinas[0].disciplina.id,
                  nome: item.turma.disciplinas[0].disciplina.nome,
                }
                : null,
              professor: item.turma?.professor
                ? {
                  id: item.turma.professor.id,
                  nome: item.turma.professor.nome,
                }
                : null,
            })),
          }
          : null,
      };
    });

    return NextResponse.json({
      data: alunosFormatados,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error("ERRO AO BUSCAR ALUNOS:", error);

    return NextResponse.json(
      {
        error: "Erro ao buscar alunos.",
        detalhe: error?.message || "Erro interno",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const dataNascimento =
      parseDataSegura(
        body.dataNascimento
      );

    const nome = limparTexto(body.nome);
    const email = limparTexto(body.email).toLowerCase();
    const matriculaInformada = limparTexto(body.matricula);
    const cpf = limparSomenteNumeros(body.cpf);
    const rg = limparTexto(body.rg);
    const telefone = limparTexto(body.telefone);
    const poloId =
      body.poloId !== undefined &&
        body.poloId !== null &&
        String(body.poloId).trim() !== ""
        ? Number(body.poloId)
        : null;

    if (!nome) {
      return NextResponse.json(
        { error: "O nome do aluno é obrigatório." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "O email do aluno é obrigatório." },
        { status: 400 }
      );
    }

    if (!dataNascimento) {
  return NextResponse.json(
    {
      error:
        "A data de nascimento do aluno é obrigatória.",
    },
    {
      status: 400,
    }
  );
}

const idadeCadastro =
  calcularIdadeCadastro(
    dataNascimento
  );

if (
  idadeCadastro < 0 ||
  idadeCadastro > 120
) {
  return NextResponse.json(
    {
      error:
        "A data de nascimento informada é inválida.",
    },
    {
      status: 400,
    }
  );
}

const alunoMenorCadastro =
  idadeCadastro < 18;

const pendenciasResponsavel =
  alunoMenorCadastro
    ? camposResponsavelPendentes(
        body
      )
    : [];

const responsavelIncompleto =
  alunoMenorCadastro &&
  pendenciasResponsavel.length > 0;

if (
  alunoMenorCadastro &&
  body.confirmacaoMenorCadastroAceita !==
    true
) {
  return NextResponse.json(
    {
      codigo:
        "CONFIRMACAO_MENOR_CADASTRO_NECESSARIA",

      error:
        responsavelIncompleto
          ? `O aluno possui ${idadeCadastro} ano(s) e os dados do responsável estão incompletos.`
          : `O aluno possui ${idadeCadastro} ano(s) e ainda não atingiu a idade adulta.`,

      idade: idadeCadastro,

      responsavelIncompleto,

      camposResponsavelPendentes:
        pendenciasResponsavel,
    },
    {
      status: 409,
    }
  );
}

    const userExistente = await prisma.user.findUnique({
  where: {
    email,
  },
  select: {
    id: true,
    instituicaoId: true,

    aluno: {
      select: {
        id: true,
        nome: true,
        statusAluno: true,
      },
    },
  },
});

if (userExistente) {
  const alunoExistente =
    userExistente.aluno;

  const pertenceMesmaInstituicao =
    userExistente.instituicaoId ===
    user.instituicaoId;

  if (
    pertenceMesmaInstituicao &&
    alunoExistente
  ) {
    return NextResponse.json(
      {
        codigo: "ALUNO_EXISTENTE",
        error:
          "Já existe um aluno com este e-mail nesta instituição.",
        campo: "EMAIL",

        aluno: {
          id: alunoExistente.id,
          nome: alunoExistente.nome,
          statusAluno:
            alunoExistente.statusAluno,
        },
      },
      { status: 409 }
    );
  }

  return NextResponse.json(
    {
      error:
        "Este e-mail já está cadastrado no PHANYX.",
    },
    { status: 400 }
  );
}

    if (matriculaInformada) {
      const matriculaExistente = await prisma.aluno.findFirst({
        where: {
          instituicaoId: user.instituicaoId,
          matricula: matriculaInformada,
        },
        select: { id: true, nome: true },
      });

      if (matriculaExistente) {
        return NextResponse.json(
          { error: "Já existe um aluno com esta matrícula nesta instituição." },
          { status: 400 }
        );
      }
    }

    if (cpf) {
      const cpfExistente =
  await prisma.aluno.findFirst({
    where: {
      instituicaoId:
        user.instituicaoId,
      cpf,
    },

    select: {
      id: true,
      nome: true,
      statusAluno: true,
    },
  });

if (cpfExistente) {
  return NextResponse.json(
    {
      codigo: "ALUNO_EXISTENTE",
      error:
        "Já existe um aluno com este CPF nesta instituição.",
      campo: "CPF",

      aluno: {
        id: cpfExistente.id,
        nome: cpfExistente.nome,
        statusAluno:
          cpfExistente.statusAluno,
      },
    },
    { status: 409 }
  );
}
    }

    if (poloId !== null) {
      const polo = await prisma.polo.findFirst({
        where: {
          id: poloId,
          instituicaoId: user.instituicaoId,
        },
        select: { id: true },
      });

      if (!polo) {
        return NextResponse.json(
          { error: "Polo inválido para esta instituição." },
          { status: 400 }
        );
      }
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
      select: { nome: true },
    });

    const senhaTemporaria = gerarSenhaTemporaria();
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    const novoAluno = await prisma.$transaction(async (tx) => {

      let matriculaFinal = matriculaInformada;

      if (!matriculaFinal) {
        const instituicaoAtualizada = await tx.instituicao.update({
          where: {
            id: user.instituicaoId!,
          },
          data: {
            proximoNumeroMatricula: {
              increment: 1,
            },
          },
          select: {
            proximoNumeroMatricula: true,
            slug: true,
          },
        });

        const numeroGerado = instituicaoAtualizada.proximoNumeroMatricula - 1;
        const prefixo =
          instituicaoAtualizada.slug
            ?.normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^A-Za-z0-9]/g, "")
            .toUpperCase()
            .slice(0, 6) || "MAT";

        matriculaFinal = `${prefixo}-${String(numeroGerado).padStart(6, "0")}`;
      }

      const novoUser = await tx.user.create({
        data: {
          nome,
          email,
          senha: senhaHash,
          role: "ALUNO",
          instituicaoId: user.instituicaoId!,
          precisaTrocarSenha: true,
        },
      });

      const alunoCriado = await tx.aluno.create({
        data: {
          nome,
          nomeSocial: limparTexto(body.nomeSocial) || null,
          genero: limparTexto(body.genero) || null,
          matricula: matriculaFinal || null,
          poloId: poloId || null,
          cpf: cpf || null,
          rg: rg || null,
          telefone: telefone || null,
          dataNascimento,
          cep: limparTexto(body.cep) || null,
          endereco: limparTexto(body.endereco) || null,
          numero: limparTexto(body.numero) || null,
          complemento: limparTexto(body.complemento) || null,
          bairro: limparTexto(body.bairro) || null,
          cidade: limparTexto(body.cidade) || null,
          estado: limparTexto(body.estado) || null,
          documentoUrl: limparTexto(body.documentoUrl) || null,
          fotoPerfil: limparTexto(body.fotoPerfil) || null,
          nomeResponsavel: limparTexto(body.nomeResponsavel) || null,
          cpfResponsavel: limparSomenteNumeros(body.cpfResponsavel) || null,
          telefoneResponsavel: limparTexto(body.telefoneResponsavel) || null,
          emailResponsavel:
            limparTexto(body.emailResponsavel).toLowerCase() || null,
          parentescoResponsavel:
            limparTexto(body.parentescoResponsavel) || null,
          statusAluno: limparTexto(body.statusAluno) || "ATIVO",
          possuiNecessidadeEspecial: !!body.possuiNecessidadeEspecial,
          descricaoNecessidadeEspecial:
            limparTexto(body.descricaoNecessidadeEspecial) || null,
          observacoesAcessibilidade:
            limparTexto(body.observacoesAcessibilidade) || null,
          userId: novoUser.id,
          instituicaoId: user.instituicaoId!,

        },
        include: {
          user: true,
        },
      });

      return alunoCriado;
    });

    let avisoEmail: string | null = null;

    try {
      await enviarEmailPrimeiroAcesso({
        email,
        nome,
        senha: senhaTemporaria,
        instituicao: instituicao?.nome || "PHANYX",
        portal: "aluno",
      });
    } catch (emailError) {
      console.error("ERRO AO ENVIAR EMAIL DE ACESSO DO ALUNO:", emailError);
      avisoEmail =
        "Aluno criado com sucesso, mas houve erro ao enviar o email de acesso.";
    }

    return NextResponse.json({
      ...novoAluno,
      senhaTemporaria,
      avisoEmail,
    });
  } catch (error: any) {
    console.error("ERRO AO CRIAR ALUNO:", error);

    if (error?.code === "P2002") {
      const alvo = Array.isArray(error?.meta?.target)
        ? error.meta.target.join(", ")
        : String(error?.meta?.target || "");

      if (alvo.includes("email")) {
        return NextResponse.json(
          { error: "Este email já está cadastrado." },
          { status: 400 }
        );
      }

      if (alvo.includes("matricula")) {
        return NextResponse.json(
          { error: "Esta matrícula já está cadastrada." },
          { status: 400 }
        );
      }

      if (alvo.includes("cpf")) {
        return NextResponse.json(
          { error: "Este CPF já está cadastrado." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Já existe um cadastro com um dos dados informados." },
        { status: 400 }
      );
    }

    if (error?.code === "P2003") {
      return NextResponse.json(
        { error: "Um relacionamento obrigatório do aluno é inválido." },
        { status: 400 }
      );
    }

    if (error?.message) {
      return NextResponse.json(
        {
          error: "Erro ao criar aluno.",
          detalhe: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao criar aluno." },
      { status: 500 }
    );
  }
}
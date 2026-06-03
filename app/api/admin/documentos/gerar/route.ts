import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function juntarPartes(partes: Array<string | null | undefined>, separador = " ") {
  return partes.filter((p) => p && String(p).trim()).join(separador);
}

function montarEndereco(dados?: any) {
  const ruaNumero = juntarPartes([dados?.endereco, dados?.numero], ", ");
  const cidadeEstado = juntarPartes([dados?.cidade, dados?.estado], " - ");

  return [
    ruaNumero,
    dados?.bairro,
    cidadeEstado,
    dados?.cep ? `CEP: ${dados.cep}` : "",
  ]
    .filter(Boolean)
    .join("\n") || "-";
}

function montarBlocoInstituicao(config?: any) {
  return [
    config?.nomeFantasia || "Instituição",
    config?.cnpj ? `CNPJ: ${config.cnpj}` : "",
    montarEndereco(config),
    config?.telefone ? `Telefone: ${config.telefone}` : "",
    config?.email ? `E-mail: ${config.email}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function montarBlocoPolo(polo?: any) {
  if (!polo) return "-";

  return [
    polo?.nome || "Polo",
    montarEndereco(polo),
    polo?.telefone ? `Telefone: ${polo.telefone}` : "",
    polo?.email ? `E-mail: ${polo.email}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();

    const templateId = Number(body?.templateId);
    const alunoId = body?.alunoId ? Number(body.alunoId) : null;
    const matriculaId = body?.matriculaId ? Number(body.matriculaId) : null;
    const tituloPersonalizado = body?.titulo
      ? String(body.titulo).trim()
      : null;

    if (!Number.isFinite(templateId) || templateId <= 0) {
      return NextResponse.json(
        { error: "Template inválido" },
        { status: 400 }
      );
    }

    const template = await prisma.documentoTemplate.findFirst({
      where: {
        id: templateId,
        instituicaoId: user.instituicaoId,
        ativo: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      );
    }

    const config = await prisma.configuracaoInstituicao.findUnique({
      where: {
        instituicaoId: user.instituicaoId,
      },
    });

    let aluno = null as any;
    let matricula = null as any;
    let cursoNome = "Curso não informado";
    let disciplinasLista: string[] = [];
    let valorContrato = 0;

    if (matriculaId && Number.isFinite(matriculaId) && matriculaId > 0) {
      matricula = await prisma.matricula.findFirst({
        where: {
          id: matriculaId,
          instituicaoId: user.instituicaoId,
        },
        include: {
  aluno: {
    include: {
      polo: true,
    },
  },
  curso: true,
          itens: {
  include: {
    disciplina: true,
    turma: true,
  },
},
          lancamentosFinanceiros: true,
        },
      });

      if (!matricula) {
        return NextResponse.json(
          { error: "Matrícula não encontrada" },
          { status: 404 }
        );
      }

      aluno = matricula.aluno;

      cursoNome =
        matricula.curso?.nome?.trim() || "Curso não informado";

      disciplinasLista = Array.from(
  new Set(
    matricula.itens
      .map((item) => item.disciplina?.nome?.trim())
      .filter(Boolean) as string[]
  )
);

      valorContrato = matricula.lancamentosFinanceiros.reduce(
  (acc, item) => acc + Number(item.valorFinal ?? item.valorOriginal ?? 0),
  0
);

if (!valorContrato || valorContrato <= 0) {
  valorContrato = Number(matricula.valorMatricula || 0);
}
    } else if (alunoId && Number.isFinite(alunoId) && alunoId > 0) {
      aluno = await prisma.aluno.findFirst({
  where: {
    id: alunoId,
    instituicaoId: user.instituicaoId,
  },
  include: {
    polo: true,
  },
});

      if (!aluno) {
        return NextResponse.json(
          { error: "Aluno não encontrado" },
          { status: 404 }
        );
      }
    }

    const polo = aluno?.polo || null;

const conteudoFinal = substituirTemplate(template.conteudo, {
  logoInstituicao: "{{logoInstituicao}}",

  nomeInstituicao: config?.nomeFantasia || "Instituição",
  cnpjInstituicao: config?.cnpj || "-",
  enderecoInstituicao: montarEndereco(config),
  telefoneInstituicao: config?.telefone || "-",
  emailInstituicao: config?.email || "-",
  cidadeInstituicao: config?.cidade || "-",
  estadoInstituicao: config?.estado || "-",
  cepInstituicao: config?.cep || "-",
  blocoInstituicao: montarBlocoInstituicao(config),

  nomePolo: polo?.nome || "-",
  enderecoPolo: montarEndereco(polo),
  telefonePolo: polo?.telefone || "-",
  emailPolo: polo?.email || "-",
  cidadePolo: polo?.cidade || "-",
  estadoPolo: polo?.estado || "-",
  cepPolo: polo?.cep || "-",
  blocoPolo: montarBlocoPolo(polo),

  responsavelLegal: config?.responsavelNome || "-",

  nomeAluno: aluno?.nome || "-",
  cpfAluno: aluno?.cpf || "-",
  matriculaAluno: aluno?.matricula || "-",
  numeroMatricula: aluno?.matricula || "-",
  statusAluno: aluno?.statusAluno || "-",

  curso: cursoNome,
  statusMatricula: matricula?.status || "-",

  dataInicioAluno: matricula?.createdAt
    ? new Date(matricula.createdAt).toLocaleDateString("pt-BR")
    : "-",
  dataMatricula: matricula?.createdAt
    ? new Date(matricula.createdAt).toLocaleDateString("pt-BR")
    : "-",

  dataConclusao: (matricula as any)?.dataConclusao
    ? new Date((matricula as any).dataConclusao).toLocaleDateString("pt-BR")
    : "-",
  dataConclusaoAluno: (matricula as any)?.dataConclusao
    ? new Date((matricula as any).dataConclusao).toLocaleDateString("pt-BR")
    : "-",

  semestreAtual: matricula?.semestre || "-",

  cargaHorariaCurso: (matricula?.curso as any)?.cargaHoraria
    ? `${(matricula?.curso as any).cargaHoraria}h`
    : "-",
  cargaHorariaMinimaCurso: (matricula?.curso as any)?.cargaHorariaMinima
    ? `${(matricula?.curso as any).cargaHorariaMinima}h`
    : "-",
  cargaHorariaMaximaCurso: (matricula?.curso as any)?.cargaHorariaMaxima
    ? `${(matricula?.curso as any).cargaHorariaMaxima}h`
    : "-",

  percentualConclusao: (matricula as any)?.percentualConclusao
    ? `${(matricula as any).percentualConclusao}%`
    : "-",

  disciplinas:
    disciplinasLista.length > 0
      ? disciplinasLista.map((d) => `- ${d}`).join("\n")
      : "- Não informado",

  valorContrato: formatarMoeda(valorContrato),
  cidadeAssinatura: config?.cidadeAssinatura || config?.cidade || "-",
  dataAtual: formatarDataAtual(),
  referenciaFinanceira: "Pagamento institucional",
  dataEmissao: new Date().toLocaleDateString("pt-BR"),

horaEmissao: new Date().toLocaleTimeString("pt-BR"),

dataHoraEmissao: new Date().toLocaleString("pt-BR"),

numeroDocumento: `DOC-${new Date().getFullYear()}-${String(
  templateId
).padStart(6, "0")}`,
  tituloDocumento: tituloPersonalizado || template.nome,
});

    const documento = await prisma.documentoGerado.create({
      data: {
        titulo: tituloPersonalizado || template.nome,
        tipo: template.tipo,
        contexto: template.contexto,
        conteudo: conteudoFinal,
        status: "GERADO",
        exigeAssinatura: template.exigeAssinatura,
        instituicaoId: user.instituicaoId,
        alunoId: aluno?.id || null,
        matriculaId: matricula?.id || null,
        templateId: template.id,
      },
    });

    return NextResponse.json({
      id: documento.id,
      titulo: documento.titulo,
      tipo: documento.tipo,
      contexto: documento.contexto,
      status: documento.status,
      exigeAssinatura: documento.exigeAssinatura,
      aluno: aluno
        ? {
            id: aluno.id,
            nome: aluno.nome,
            matricula: aluno.matricula,
          }
        : null,
      matricula: matricula
        ? {
            id: matricula.id,
            status: matricula.status,
            semestre: matricula.semestre,
          }
        : null,
      conteudo: documento.conteudo,
    });
  } catch (error: any) {
    console.error("Erro ao gerar documento:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao gerar documento" },
      { status: 500 }
    );
  }
}
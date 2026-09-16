import * as XLSX from "xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CAMPOS_FILTRO = [
  "busca",
  "status",
  "situacaoMatricula",
  "turmaId",
  "poloId",
] as const;

const CABECALHOS = {
  "pt-BR": {
    nome: "Nome",
    nomeSocial: "Nome social",
    email: "E-mail",
    cpf: "CPF",
    rg: "RG",
    telefone: "Telefone",
    nascimento: "Data de nascimento",
    situacaoAluno: "Situação do aluno",
    matricula: "Matrícula",
    statusMatricula: "Status da matrícula",
    curso: "Curso",
    polo: "Polo",
    turmas: "Turmas",
    cidade: "Cidade",
    estado: "Estado",
    sheet: "Alunos",
  },

  "pt-PT": {
    nome: "Nome",
    nomeSocial: "Nome social",
    email: "E-mail",
    cpf: "NIF / documento",
    rg: "Documento",
    telefone: "Telefone",
    nascimento: "Data de nascimento",
    situacaoAluno: "Situação do aluno",
    matricula: "Matrícula",
    statusMatricula: "Estado da matrícula",
    curso: "Curso",
    polo: "Polo",
    turmas: "Turmas",
    cidade: "Cidade",
    estado: "Distrito / região",
    sheet: "Alunos",
  },

  "en-US": {
    nome: "Name",
    nomeSocial: "Preferred name",
    email: "Email",
    cpf: "Tax ID / document",
    rg: "Document",
    telefone: "Phone",
    nascimento: "Date of birth",
    situacaoAluno: "Student status",
    matricula: "Enrollment number",
    statusMatricula: "Enrollment status",
    curso: "Course",
    polo: "Campus",
    turmas: "Classes",
    cidade: "City",
    estado: "State / region",
    sheet: "Students",
  },

  "es-ES": {
    nome: "Nombre",
    nomeSocial: "Nombre social",
    email: "Correo electrónico",
    cpf: "Documento fiscal",
    rg: "Documento",
    telefone: "Teléfono",
    nascimento: "Fecha de nacimiento",
    situacaoAluno: "Estado del alumno",
    matricula: "Matrícula",
    statusMatricula: "Estado de la matrícula",
    curso: "Curso",
    polo: "Sede",
    turmas: "Clases",
    cidade: "Ciudad",
    estado: "Estado / región",
    sheet: "Alumnos",
  },

  "fr-FR": {
    nome: "Nom",
    nomeSocial: "Nom d'usage",
    email: "E-mail",
    cpf: "Identifiant fiscal / document",
    rg: "Document",
    telefone: "Téléphone",
    nascimento: "Date de naissance",
    situacaoAluno: "Statut de l'étudiant",
    matricula: "Numéro d'inscription",
    statusMatricula: "Statut de l'inscription",
    curso: "Formation",
    polo: "Campus",
    turmas: "Classes",
    cidade: "Ville",
    estado: "État / région",
    sheet: "Étudiants",
  },
} as const;

type LocaleExportacao =
  keyof typeof CABECALHOS;

function normalizarLocale(
  valor: string
): LocaleExportacao {
  if (valor in CABECALHOS) {
    return valor as LocaleExportacao;
  }

  return "pt-BR";
}

function textoStatus(
  valor: unknown
) {
  return String(valor || "")
    .replace(/_/g, " ");
}

function formatarData(
  valor: unknown,
  locale: LocaleExportacao
) {
  if (!valor) return "";

  const data = new Date(
    String(valor)
  );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    locale
  ).format(data);
}

export async function GET(
  request: Request
) {
  try {
    const urlEntrada =
      new URL(request.url);

    const locale =
      normalizarLocale(
        String(
          urlEntrada.searchParams.get(
            "locale"
          ) || "pt-BR"
        )
      );

    const labels =
      CABECALHOS[locale];

    const params =
      new URLSearchParams();

    for (
      const chave
      of CAMPOS_FILTRO
    ) {
      const valor =
        urlEntrada.searchParams.get(
          chave
        );

      if (
        valor !== null &&
        valor !== ""
      ) {
        params.set(
          chave,
          valor
        );
      }
    }

    params.set(
      "limit",
      "100"
    );

    const cookie =
      request.headers.get(
        "cookie"
      ) || "";

    const alunos: any[] = [];

    let pagina = 1;
    let totalPaginas = 1;

    do {
      params.set(
        "page",
        String(pagina)
      );

      const apiUrl =
        new URL(
          "/api/aluno",
          urlEntrada.origin
        );

      apiUrl.search =
        params.toString();

      const resposta =
        await fetch(
          apiUrl,
          {
            headers: cookie
              ? {
                  cookie,
                }
              : undefined,
            cache: "no-store",
          }
        );

      const data =
        await resposta
          .json()
          .catch(() => null);

      if (!resposta.ok) {
        return Response.json(
          {
            error:
              data?.error ||
              "Erro ao carregar alunos para exportação.",
          },
          {
            status:
              resposta.status,
          }
        );
      }

      const registros =
        Array.isArray(
          data?.data
        )
          ? data.data
          : [];

      alunos.push(
        ...registros
      );

      totalPaginas =
        Math.max(
          Number(
            data?.meta
              ?.totalPages || 1
          ),
          1
        );

      pagina += 1;

      if (pagina > 10000) {
        throw new Error(
          "Limite de páginas excedido durante a exportação."
        );
      }
    } while (
      pagina <= totalPaginas
    );

    const dadosPlanilha =
      alunos.map(
        (aluno) => {
          const matricula =
            aluno
              ?.resumoMatricula ||
            null;

          const turmas =
            Array.isArray(
              matricula?.turmas
            )
              ? matricula.turmas
                  .map(
                    (turma: any) =>
                      turma?.nome
                  )
                  .filter(Boolean)
                  .join(" | ")
              : "";

          return {
            [labels.nome]:
              aluno?.nome || "",

            [labels.nomeSocial]:
              aluno?.nomeSocial || "",

            [labels.email]:
              aluno?.user?.email ||
              "",

            [labels.cpf]:
              aluno?.cpf || "",

            [labels.rg]:
              aluno?.rg || "",

            [labels.telefone]:
              aluno?.telefone || "",

            [labels.nascimento]:
              formatarData(
                aluno
                  ?.dataNascimento,
                locale
              ),

            [labels.situacaoAluno]:
              textoStatus(
                aluno?.statusAluno
              ),

            [labels.matricula]:
              matricula
                ?.numeroMatricula ||
              aluno?.matricula ||
              "",

            [labels.statusMatricula]:
              textoStatus(
                matricula?.status
              ),

            [labels.curso]:
              matricula
                ?.curso?.nome ||
              "",

            [labels.polo]:
              matricula
                ?.polo?.nome ||
              aluno?.polo?.nome ||
              "",

            [labels.turmas]:
              turmas,

            [labels.cidade]:
              aluno?.cidade || "",

            [labels.estado]:
              aluno?.estado || "",
          };
        }
      );

    const worksheet =
      XLSX.utils.json_to_sheet(
        dadosPlanilha
      );

    worksheet["!cols"] = [
      { wch: 32 },
      { wch: 28 },
      { wch: 34 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 22 },
      { wch: 22 },
      { wch: 24 },
      { wch: 32 },
      { wch: 26 },
      { wch: 55 },
      { wch: 24 },
      { wch: 20 },
    ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      labels.sheet
    );

    const buffer =
      XLSX.write(
        workbook,
        {
          type: "buffer",
          bookType: "xlsx",
        }
      );

    const bytes =
      new Uint8Array(
        buffer
      );

    const hoje =
      new Date()
        .toISOString()
        .slice(0, 10);

    return new Response(
      bytes,
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

          "Content-Disposition":
            `attachment; filename="alunos-${hoje}.xlsx"`,

          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error: any) {
    console.error(
      "ERRO AO EXPORTAR ALUNOS:",
      error
    );

    return Response.json(
      {
        error:
          error?.message ||
          "Erro ao exportar alunos.",
      },
      {
        status: 500,
      }
    );
  }
}

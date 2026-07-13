import { notFound } from "next/navigation";
import CrachaRenderer from "@/components/crachas/CrachaRenderer";
import { prisma } from "@/lib/prisma";
import { validarTokenRenderCracha } from "@/lib/crachas/cracha-render-token";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    t?: string;
  };
};

type DadosRenderCracha = Record<
  string,
  string | number | null | undefined
>;

function texto(valor: unknown) {
  return String(valor ?? "").trim();
}

function formatarData(valor?: Date | string | null) {
  if (!valor) return "";

  const data = valor instanceof Date ? valor : new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);
}

function objetosJson(valor: unknown) {
  return Array.isArray(valor) ? valor : [];
}

function pontosGradienteJson(valor: unknown) {
  return Array.isArray(valor) ? valor : [];
}

function statusLegivel(valor: unknown) {
  const status = texto(valor);

  if (!status) return "";

  return status
    .toLowerCase()
    .split("_")
    .map((parte) => {
      return parte.charAt(0).toUpperCase() + parte.slice(1);
    })
    .join(" ");
}

async function buscarDadosPessoa({
  tipoPessoa,
  pessoaId,
  instituicaoId,
  codigoCracha,
  validadeEm,
  instituicaoNome,
}: {
  tipoPessoa: string;
  pessoaId: number;
  instituicaoId: number;
  codigoCracha: string;
  validadeEm?: Date | null;
  instituicaoNome: string;
}) {
  const dadosBase: DadosRenderCracha = {
    codigoCracha,
    validadeCracha: formatarData(validadeEm),
    instituicaoNome,
  };

  if (tipoPessoa === "ALUNO") {
    const aluno = await prisma.aluno.findFirst({
      where: {
        id: pessoaId,
        instituicaoId,
      },
      select: {
        id: true,
        nome: true,
        nomeSocial: true,
        matricula: true,
        fotoPerfil: true,
        statusAluno: true,
        polo: {
          select: {
            nome: true,
          },
        },
      },
    });

    if (!aluno) {
      throw new Error("Aluno não encontrado para renderização do crachá.");
    }

    const nomePreferencialCompleto =
  texto(aluno.nomeSocial) || texto(aluno.nome);

const nomePreferencial =
  nomeAutomaticoParaCracha(nomePreferencialCompleto);

    return {
      fotoUrl: aluno.fotoPerfil,
      dados: {
        ...dadosBase,

        alunoNome: aluno.nome,
        alunoNomeSocial: aluno.nomeSocial || "",
        alunoNomePreferencial: nomePreferencial,

        nome: nomePreferencial,
        numeroMatricula: aluno.matricula || "",
        matricula: aluno.matricula || "",

        poloNome: aluno.polo?.nome || "",
        statusAluno: statusLegivel(aluno.statusAluno),

        cursoNome: "",
        turmaNome: "",
        semestre: "",
        modalidade: "",
      },
    };
  }

  if (tipoPessoa === "PROFESSOR") {
    const professor = await prisma.professor.findFirst({
      where: {
        id: pessoaId,
        instituicaoId,
      },
      select: {
        id: true,
        nome: true,
        fotoPerfil: true,
        especialidade: true,
        titulacao: true,
        formacao: true,
        codigoFuncionario: true,
        statusProfessor: true,
        departamento: {
          select: {
            nome: true,
          },
        },
        polo: {
          select: {
            nome: true,
          },
        },
      },
    });

    if (!professor) {
      throw new Error(
        "Professor não encontrado para renderização do crachá."
      );
    }

    return {
      fotoUrl: professor.fotoPerfil,
      dados: {
        ...dadosBase,

        professorNome: nomeAutomaticoParaCracha(professor.nome),
        nome: nomeAutomaticoParaCracha(professor.nome),

        departamentoNome: professor.departamento?.nome || "",
        disciplinasProfessor: professor.especialidade || "",
        especialidade: professor.especialidade || "",

        titulacao: professor.titulacao || "",
        formacao: professor.formacao || "",
        codigoFuncionario: professor.codigoFuncionario || "",
        poloNome: professor.polo?.nome || "",

        statusProfessor: statusLegivel(
          professor.statusProfessor
        ),
      },
    };
  }

  if (tipoPessoa === "FUNCIONARIO") {
    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id: pessoaId,
        instituicaoId,
      },
      select: {
        id: true,
        nome: true,
        fotoPerfil: true,
        cargo: true,
        setor: true,
        codigoFuncionario: true,
        statusFuncionario: true,
        departamento: {
          select: {
            nome: true,
          },
        },
      },
    });

    if (!funcionario) {
      throw new Error(
        "Funcionário não encontrado para renderização do crachá."
      );
    }

    return {
      fotoUrl: funcionario.fotoPerfil,
      dados: {
        ...dadosBase,

        funcionarioNome: nomeAutomaticoParaCracha(funcionario.nome),
        nome: nomeAutomaticoParaCracha(funcionario.nome),

        cargo: funcionario.cargo || "",
        setor: funcionario.setor || "",
        codigoFuncionario:
          funcionario.codigoFuncionario || "",

        departamentoNome:
          funcionario.departamento?.nome || "",

        statusFuncionario: statusLegivel(
          funcionario.statusFuncionario
        ),
      },
    };
  }

  if (tipoPessoa === "VISITANTE") {
    const visitante = await prisma.visitante.findFirst({
      where: {
        id: pessoaId,
        instituicaoId,
        arquivado: false,
      },
      select: {
        id: true,
        nome: true,
        fotoPerfil: true,
        empresa: true,
        destino: true,
        pessoaVisitada: true,
        setorVisitado: true,
        motivo: true,
        evento: true,
        codigoVisitante: true,
        codigoCracha: true,
        status: true,
        crachaValidoAte: true,
      },
    });

    if (!visitante) {
      throw new Error(
        "Visitante não encontrado para renderização do crachá."
      );
    }

    return {
      fotoUrl: visitante.fotoPerfil,
      dados: {
        ...dadosBase,

        visitanteNome: nomeAutomaticoParaCracha(visitante.nome),
        nome: nomeAutomaticoParaCracha(visitante.nome),

        visitanteEmpresa: visitante.empresa || "",
        visitanteDestino: visitante.destino || "",

        empresa: visitante.empresa || "",
        destino: visitante.destino || "",
        pessoaVisitada: visitante.pessoaVisitada || "",
        setorVisitado: visitante.setorVisitado || "",
        motivo: visitante.motivo || "",
        evento: visitante.evento || "",

        codigoVisitante: visitante.codigoVisitante || "",

        codigoCracha:
          visitante.codigoCracha || codigoCracha,

        validadeCracha: formatarData(
          visitante.crachaValidoAte || validadeEm
        ),

        statusVisitante: statusLegivel(visitante.status),
      },
    };
  }

  throw new Error(
    `Tipo de pessoa não suportado para o PDF: ${tipoPessoa}.`
  );
}

function ScriptRenderPronto() {
  const codigo = `
    (function () {
      async function aguardarRenderizacao() {
        try {
          if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
          }

          var imagens = Array.from(document.images || []);

          await Promise.all(
            imagens.map(function (imagem) {
              if (imagem.complete) {
                return Promise.resolve();
              }

              return new Promise(function (resolve) {
                imagem.onload = resolve;
                imagem.onerror = resolve;
              });
            })
          );

          await new Promise(function (resolve) {
            requestAnimationFrame(function () {
              requestAnimationFrame(resolve);
            });
          });

          document.documentElement.dataset.crachaRenderPronto = "true";
        } catch (erro) {
          document.documentElement.dataset.crachaRenderErro =
            erro instanceof Error
              ? erro.message
              : "Erro ao concluir a renderização do crachá.";
        }
      }

      aguardarRenderizacao();
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: codigo,
      }}
    />
  );
}

function nomeAutomaticoParaCracha(valor: unknown) {
  const nomeCompleto = String(valor ?? "")
    .trim()
    .replace(/\s+/g, " ");

  if (!nomeCompleto) {
    return "";
  }

  const partes = nomeCompleto.split(" ").filter(Boolean);

  if (partes.length <= 2) {
    return nomeCompleto;
  }

  if (nomeCompleto.length <= 24) {
    return nomeCompleto;
  }

  const primeiroNome = partes[0];
  const ultimoNome = partes[partes.length - 1];

  return `${primeiroNome} ${ultimoNome}`;
}

export default async function CrachaRenderPage({
  params,
  searchParams,
}: PageProps) {
  const crachaEmitidoId = Number(params.id);
  const token = searchParams?.t || "";

  if (
    !crachaEmitidoId ||
    Number.isNaN(crachaEmitidoId) ||
    !validarTokenRenderCracha(crachaEmitidoId, token)
  ) {
    notFound();
  }

  const crachaEmitido = await prisma.crachaEmitido.findUnique({
    where: {
      id: crachaEmitidoId,
    },
    include: {
      modelo: true,
      instituicao: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  });

  if (!crachaEmitido) {
    notFound();
  }

  const tipoPessoa = texto(
    crachaEmitido.tipoPessoa
  ).toUpperCase();

  const codigoCracha = texto(
    crachaEmitido.codigoCracha
  );

  if (!codigoCracha) {
    throw new Error(
      "O crachá emitido não possui um código de identificação."
    );
  }

  const resultadoPessoa = await buscarDadosPessoa({
    tipoPessoa,
    pessoaId: crachaEmitido.pessoaId,
    instituicaoId: crachaEmitido.instituicaoId,
    codigoCracha,
    validadeEm: crachaEmitido.validadeEm,
    instituicaoNome: crachaEmitido.instituicao.nome,
  });

  const modelo = crachaEmitido.modelo;

  const frenteJson = objetosJson(modelo.frenteJson);
  const versoJson = objetosJson(modelo.versoJson);

  const possuiVerso = versoJson.length > 0;

  const larguraMm =
    Number(modelo.larguraMm) > 0
      ? Number(modelo.larguraMm)
      : 54;

  const alturaMm =
    Number(modelo.alturaMm) > 0
      ? Number(modelo.alturaMm)
      : 86;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: ${larguraMm}mm ${alturaMm}mm;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0 !important;
              padding: 0 !important;
              width: ${larguraMm}mm;
              min-height: ${alturaMm}mm;
              background: transparent;
              overflow: visible;
            }

            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }

            [data-cracha-pagina] {
              margin: 0 !important;
              padding: 0 !important;
            }

            [data-cracha-pagina]:last-of-type {
              break-after: auto !important;
              page-break-after: auto !important;
            }
          `,
        }}
      />

      <main
        style={{
          margin: 0,
          padding: 0,
          width: `${larguraMm}mm`,
        }}
      >
        <CrachaRenderer
          lado="FRENTE"
          formato={modelo.formato}
          larguraMm={larguraMm}
          alturaMm={alturaMm}
          objetos={frenteJson}
          tipoFundo={modelo.tipoFundoFrente}
          corFundo={modelo.corFundoFrente}
          corFundoSecundaria={
            modelo.corFundoFrenteSecundaria
          }
          direcaoGradiente={
            modelo.direcaoGradienteFrente
          }
          gradientePontos={pontosGradienteJson(
            modelo.gradientePontosFundoFrente
          )}
          dados={resultadoPessoa.dados}
          fotoUrl={resultadoPessoa.fotoUrl}
          logoUrl={null}
        />

        {possuiVerso && (
          <CrachaRenderer
            lado="VERSO"
            formato={modelo.formato}
            larguraMm={larguraMm}
            alturaMm={alturaMm}
            objetos={versoJson}
            tipoFundo={modelo.tipoFundoVerso}
            corFundo={modelo.corFundoVerso}
            corFundoSecundaria={
              modelo.corFundoVersoSecundaria
            }
            direcaoGradiente={
              modelo.direcaoGradienteVerso
            }
            gradientePontos={pontosGradienteJson(
              modelo.gradientePontosFundoVerso
            )}
            dados={resultadoPessoa.dados}
            fotoUrl={resultadoPessoa.fotoUrl}
            logoUrl={null}
          />
        )}
      </main>

      <ScriptRenderPronto />
    </>
  );
}
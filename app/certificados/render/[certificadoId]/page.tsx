import { prisma } from "@/lib/prisma";
import CertificadoRender from "@/components/certificados/CertificadoRender";
import { validarTokenRenderCertificado } from "@/lib/certificados/certificado-render-token";

export const dynamic = "force-dynamic";

type Props = {
  params: {
    certificadoId: string;
  };
  searchParams?: {
  t?: string;
  overlay?: string;
};
};

function formatarData(data: any) {
  if (!data) return "";

  const d = new Date(data);

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString("pt-BR");
}

function normalizarCampo(campo: any) {
  const dados = campo?.dadosJson || {};

  return {
    ...dados,
    ...campo,
    id: campo.id,
    bancoId: campo.id,
  };
}

function pegarUrlImagemCampo(campo: any) {
  return (
    campo?.imagemUrl ||
    campo?.url ||
    campo?.src ||
    campo?.arquivoUrl ||
    campo?.previewUrl ||
    campo?.dadosJson?.imagemUrl ||
    campo?.dadosJson?.url ||
    campo?.dadosJson?.src ||
    campo?.dadosJson?.arquivoUrl ||
    campo?.dadosJson?.previewUrl ||
    null
  );
}

function matriculaDoCertificado(certificado: any) {
  const aluno = certificado?.aluno;
  const disciplinaCertificadoId = Number(certificado?.disciplinaId);

  const matriculas = Array.isArray(aluno?.matriculas)
    ? aluno.matriculas
    : [];

  return (
    matriculas.find((matricula: any) =>
      Array.isArray(matricula?.itens)
        ? matricula.itens.some(
            (item: any) =>
              Number(item?.disciplinaId ?? item?.disciplina?.id) ===
              disciplinaCertificadoId
          )
        : false
    ) || matriculas[0] || null
  );
}

function disciplinasDaMatricula(certificado: any) {
  const matriculaRelacionada = matriculaDoCertificado(certificado);
  const itens = Array.isArray(matriculaRelacionada?.itens)
    ? matriculaRelacionada.itens
    : [];

  const nomes = itens
    .map((item: any) => item?.disciplina?.nome)
    .filter(Boolean);

  if (nomes.length > 0) return nomes;

  if (certificado?.disciplina?.nome) {
    return [certificado.disciplina.nome];
  }

  return [];
}

function cursoDoCertificado(certificado: any) {
  return matriculaDoCertificado(certificado)?.curso || null;
}

export default async function CertificadoRenderPage({
  params,
  searchParams,
}: Props) {
  const certificadoId = Number(params.certificadoId);

  if (!Number.isFinite(certificadoId) || certificadoId <= 0) {
    return (
      <main style={{ padding: 24, fontFamily: "Arial" }}>
        Certificado inválido.
      </main>
    );
  }

  const tokenValido = validarTokenRenderCertificado(
    certificadoId,
    searchParams?.t
  );

  const modoOverlay = searchParams?.overlay === "1";

  if (!tokenValido) {
    return (
      <main style={{ padding: 24, fontFamily: "Arial" }}>
        Não autorizado.
      </main>
    );
  }

  const certificado = await prisma.certificado.findUnique({
    where: {
      id: certificadoId,
    },
    include: {
      aluno: {
        include: {
          matriculas: {
            include: {
              curso: true,
              polo: true,
              itens: {
                include: {
                  disciplina: true,
                },
              },
            },
          },
        },
      },
      disciplina: true,
            instituicao: {
        include: {
          configuracaoInstituicao: true,
        },
      },
    },
  });

  if (!certificado) {
    return (
      <main style={{ padding: 24, fontFamily: "Arial" }}>
        Certificado não encontrado.
      </main>
    );
  }

  const instituicao = certificado.instituicao as any;
  const aluno = certificado.aluno as any;
  const curso = cursoDoCertificado(certificado);

  const modoFundoSalvo = ["modelo", "phanyx", "cor"].includes(
  instituicao?.certificadoModoFundo
)
  ? instituicao.certificadoModoFundo
  : "modelo";

const corFundoSalva =
  instituicao?.certificadoCorFundoPagina || "#ffffff";

const larguraBase =
  Number(instituicao?.certificadoLarguraBase) || 1123;

const alturaBase =
  Number(instituicao?.certificadoAlturaBase) || 794;

  const configuracaoInstituicao =
    instituicao?.configuracaoInstituicao || null;

  const matriculaRelacionada = matriculaDoCertificado(certificado);

  const camposBanco = await prisma.certificadoCampo.findMany({
    where: {
      instituicaoId: certificado.instituicaoId,
    },
    orderBy: {
      id: "asc",
    },
  });

  const campos = camposBanco.map((campo: any) => {
    const normalizado = normalizarCampo(campo);

    if (
      normalizado.tipo === "IMAGEM" ||
      normalizado.tipo === "ASSINATURA" ||
      normalizado.tipo === "LOGO_INSTITUICAO"
    ) {
      const url = pegarUrlImagemCampo(normalizado);

      return {
        ...normalizado,
        imagemUrl: url,
        src: url,
        url,
      };
    }

    return normalizado;
  });

  const dados = {
    nomeAluno: aluno?.nome || "",
        numeroMatricula:
      matriculaRelacionada?.numeroMatricula ||
      matriculaRelacionada?.numero ||
      aluno?.matricula ||
      "",
    cpfAluno: aluno?.cpf || "",
    rgAluno: aluno?.rg || "",

    nomeCurso: curso?.nome || certificado?.disciplina?.nome || "",
    disciplinasConcluidas: disciplinasDaMatricula(certificado),
    cargaHoraria:
      curso?.cargaHorariaTotal ||
      curso?.cargaHoraria ||
      certificado?.disciplina?.cargaHoraria ||
      "",
    anoConclusao:
      certificado?.emitidoEm
        ? new Date(certificado.emitidoEm).getFullYear()
        : new Date().getFullYear(),
        dataConclusao: formatarData(
      matriculaRelacionada?.dataConclusao ||
        matriculaRelacionada?.dataFim ||
        certificado?.emitidoEm
    ),
    aproveitamento: "100%",
    frequenciaTotal: "100%",
      modalidade: matriculaRelacionada?.modalidade || "",
    turma: matriculaRelacionada?.turma?.nome || "",
    polo: matriculaRelacionada?.polo?.nome || "",

    nomeInstituicao: instituicao?.nome || "",
    cnpjInstituicao: instituicao?.cnpj || "",
        cidade:
      instituicao?.certificadoCidade ||
      configuracaoInstituicao?.cidade ||
      configuracaoInstituicao?.cidadeAssinatura ||
      matriculaRelacionada?.polo?.cidade ||
      aluno?.cidade ||
      "",
    dataEmissao: formatarData(certificado?.emitidoEm || new Date()),
        nomeDiretor:
      instituicao?.certificadoCoordenadorNome ||
      configuracaoInstituicao?.responsavelNome ||
      instituicao?.responsavelNome ||
      "",
        assinaturaUrl:
      instituicao?.certificadoAssinaturaUrl ||
      configuracaoInstituicao?.certificadoAssinaturaUrl ||
      instituicao?.assinaturaUrl ||
      null,
        logoUrl:
      instituicao?.logoUrl ||
      configuracaoInstituicao?.logoUrl ||
      instituicao?.logo ||
      null,

    numeroCertificado: certificado?.codigo || String(certificado.id),
    codigoValidacao: certificado?.codigo || String(certificado.id),
    qrCodeUrl: null,
  };

  const templateUrl =
  modoFundoSalvo === "modelo"
    ? instituicao?.certificadoPreviewUrl ||
      instituicao?.certificadoTemplateUrl ||
      null
    : null;

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />

        <style
          dangerouslySetInnerHTML={{
            __html: `
              @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Caveat:wght@400;500;600;700&family=Dancing+Script:wght@400;500;600;700&family=Great+Vibes&family=Indie+Flower&family=Lato:wght@400;700&family=Libre+Baskerville:wght@400;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;600;700&family=Pacifico&family=Playfair+Display:wght@400;600;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Satisfy&display=swap');

              * {
                box-sizing: border-box;
              }

              html,
body {
  width: ${larguraBase}px;
  height: ${alturaBase}px;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: ${modoOverlay ? "transparent" : corFundoSalva};
}

@page {
  size: ${larguraBase}px ${alturaBase}px;
  margin: 0;
}

              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              iframe {
                background: white;
              }
            `,
          }}
        />
      </head>

      <body>
       <CertificadoRender
  campos={campos as any}
  dados={dados}
  templateUrl={
    modoOverlay
      ? null
      : templateUrl
      ? templateUrl.toLowerCase().includes(".pdf")
        ? `${templateUrl}#toolbar=0&navpanes=0&scrollbar=0`
        : templateUrl
      : null
  }
  modoFundo={modoOverlay ? "cor" : modoFundoSalvo}
  corFundoPagina={modoOverlay ? "transparent" : corFundoSalva}
  larguraBase={larguraBase}
  alturaBase={alturaBase}
  escala={1}
  mostrarBordas={false}
  fundoTransparente={modoOverlay}
/>
      </body>
    </html>
  );
}
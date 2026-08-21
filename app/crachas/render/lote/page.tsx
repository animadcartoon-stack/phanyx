import { Fragment } from "react";
import { notFound } from "next/navigation";
import CrachaRenderer from "@/components/crachas/CrachaRenderer";
import { prisma } from "@/lib/prisma";
import {
  normalizarIdsRenderCrachaLote,
  validarTokenRenderCrachaLote,
} from "@/lib/crachas/cracha-render-token";
import { buscarDadosRenderCrachaLote } from "@/lib/crachas/dados-render-cracha-lote";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: {
    ids?: string;
    t?: string;
  };
};

function objetosJson(valor: unknown) {
  return Array.isArray(valor) ? valor : [];
}

function pontosGradienteJson(valor: unknown) {
  return Array.isArray(valor) ? valor : [];
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

          document.documentElement.dataset.crachaRenderPronto =
            "true";
        } catch (erro) {
          document.documentElement.dataset.crachaRenderErro =
            erro instanceof Error
              ? erro.message
              : "Erro ao concluir a renderização do lote.";
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

export default async function CrachaRenderLotePage({
  searchParams,
}: PageProps) {
  const idsRecebidos = String(
    searchParams?.ids || ""
  )
    .split(",")
    .map((valor) => valor.trim())
    .filter(Boolean);

  const ids =
    normalizarIdsRenderCrachaLote(idsRecebidos);

  const token = searchParams?.t || "";

  if (
    ids.length === 0 ||
    !validarTokenRenderCrachaLote(ids, token)
  ) {
    notFound();
  }

  const encontrados =
    await prisma.crachaEmitido.findMany({
      where: {
        id: {
          in: ids,
        },
        status: {
          not: "CANCELADO",
        },
      },
      include: {
        modelo: true,
        instituicao: {
          select: {
            nome: true,
          },
        },
      },
    });

  if (encontrados.length !== ids.length) {
    notFound();
  }

  const mapaCrachas = new Map<number, any>(
    encontrados.map(
      (cracha) => [cracha.id, cracha] as const
    )
  );

  const crachas = ids.map((id) => {
    const cracha = mapaCrachas.get(id);

    if (!cracha) {
      notFound();
    }

    return cracha;
  });

  const primeiroCracha = crachas[0];
  const modelo = primeiroCracha.modelo;

  const loteCompativel = crachas.every(
    (cracha) =>
      cracha.instituicaoId ===
        primeiroCracha.instituicaoId &&
      cracha.modeloId === primeiroCracha.modeloId &&
      cracha.tipoPessoa ===
        primeiroCracha.tipoPessoa
  );

  if (!loteCompativel) {
    throw new Error(
      "O bloco possui crachás de instituições, tipos ou modelos diferentes."
    );
  }

  const frenteJson = objetosJson(
    modelo.frenteJson
  );

  const versoJson = objetosJson(
    modelo.versoJson
  );

  if (frenteJson.length === 0) {
    throw new Error(
      "O modelo selecionado não possui conteúdo na frente."
    );
  }

  const possuiVerso = versoJson.length > 0;

  const larguraMm =
    Number(modelo.larguraMm) > 0
      ? Number(modelo.larguraMm)
      : 54;

  const alturaMm =
    Number(modelo.alturaMm) > 0
      ? Number(modelo.alturaMm)
      : 86;

  const pessoas =
    await buscarDadosRenderCrachaLote(crachas);

  const mapaPessoas = new Map(
    pessoas.map(
      (pessoa) =>
        [pessoa.crachaEmitidoId, pessoa] as const
    )
  );

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
              break-after: page;
              page-break-after: always;
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
        {crachas.map((cracha) => {
          const pessoa = mapaPessoas.get(cracha.id);

          if (!pessoa) {
            throw new Error(
              `Dados do crachá ${cracha.id} não encontrados.`
            );
          }

          return (
            <Fragment key={cracha.id}>
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
                dados={pessoa.dados}
                fotoUrl={pessoa.fotoUrl}
                logoUrl={null}
              />

              {possuiVerso && (
                <CrachaRenderer
                  lado="VERSO"
                  formato={modelo.formato}
                  larguraMm={larguraMm}
                  alturaMm={alturaMm}
                  objetos={versoJson}
                  tipoFundo={
                    modelo.tipoFundoVerso
                  }
                  corFundo={
                    modelo.corFundoVerso
                  }
                  corFundoSecundaria={
                    modelo.corFundoVersoSecundaria
                  }
                  direcaoGradiente={
                    modelo.direcaoGradienteVerso
                  }
                  gradientePontos={pontosGradienteJson(
                    modelo.gradientePontosFundoVerso
                  )}
                  dados={pessoa.dados}
                  fotoUrl={pessoa.fotoUrl}
                  logoUrl={null}
                />
              )}
            </Fragment>
          );
        })}
      </main>

      <ScriptRenderPronto />
    </>
  );
}
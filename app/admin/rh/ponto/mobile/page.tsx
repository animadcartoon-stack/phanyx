"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

type ConfiguracaoPontoMobile = {
  id?: number;
  instituicaoId?: number;

  ativo: boolean;
  exigirFoto: boolean;
  exigirLocalizacao: boolean;
  reconhecimentoFacialAtivo: boolean;
  exigirProvaVida: boolean;
  permitirForaDoRaio: boolean;
  exigirFuncionarioLiberado: boolean;
  raioPadraoMetros: number;
};

type ToastState = {
  tipo: "sucesso" | "erro";
  mensagem: string;
} | null;

type IdentidadeInstituicao = {
  slug: string;
  nome: string;
  nomeCadastro?: string | null;
  logoUrl?: string | null;
  cidade?: string | null;
  estado?: string | null;
};

const configuracaoPadrao: ConfiguracaoPontoMobile = {
  ativo: false,
  exigirFoto: true,
  exigirLocalizacao: true,
  reconhecimentoFacialAtivo: false,
  exigirProvaVida: false,
  permitirForaDoRaio: true,
  exigirFuncionarioLiberado: true,
  raioPadraoMetros: 150,
};

export default function PontoMobileConfiguracaoPage() {
  const [configuracao, setConfiguracao] =
    useState<ConfiguracaoPontoMobile>(configuracaoPadrao);

  const [linkAplicativo, setLinkAplicativo] = useState(
  "https://www.phanyx.com.br/rh-app"
);

const [identidadeInstituicao, setIdentidadeInstituicao] =
  useState<IdentidadeInstituicao | null>(null);

const [qrCodeUrl, setQrCodeUrl] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
  carregarConfiguracao();
}, []);

useEffect(() => {
  gerarQrCode();
}, [linkAplicativo]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  function mostrarToast(
    tipo: "sucesso" | "erro",
    mensagem: string
  ) {
    setToast({
      tipo,
      mensagem,
    });
  }

  async function carregarConfiguracao() {
    try {
      setCarregando(true);

      const resposta = await fetch(
        "/api/admin/rh/ponto/mobile/configuracao",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
            "Não foi possível carregar a configuração."
        );
      }

      const identidade =
  dados?.instituicao as IdentidadeInstituicao | undefined;

if (identidade?.slug) {
  setIdentidadeInstituicao(identidade);

  setLinkAplicativo(
    `https://www.phanyx.com.br/rh-app/${encodeURIComponent(
      identidade.slug
    )}`
  );
}

      setConfiguracao({
        ativo: dados.ativo === true,
        exigirFoto: dados.exigirFoto !== false,
        exigirLocalizacao:
          dados.exigirLocalizacao !== false,
        reconhecimentoFacialAtivo:
          dados.reconhecimentoFacialAtivo === true,
        exigirProvaVida:
          dados.exigirProvaVida === true,
        permitirForaDoRaio:
          dados.permitirForaDoRaio !== false,
        exigirFuncionarioLiberado: true,
        raioPadraoMetros: Number(
          dados.raioPadraoMetros || 150
        ),
      });
    } catch (error) {
      mostrarToast(
        "erro",
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o Ponto Mobile."
      );
    } finally {
      setCarregando(false);
    }
  }

  function atualizarCampo(
    campo: keyof ConfiguracaoPontoMobile,
    valor: boolean | number
  ) {
    setConfiguracao((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  async function salvarConfiguracao() {
    try {
      setSalvando(true);

      const resposta = await fetch(
        "/api/admin/rh/ponto/mobile/configuracao",
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...configuracao,
            exigirFuncionarioLiberado: true,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
            "Não foi possível salvar a configuração."
        );
      }

      if (dados.configuracao) {
        setConfiguracao({
          ...dados.configuracao,
          exigirFuncionarioLiberado: true,
        });
      }

      mostrarToast(
        "sucesso",
        dados?.mensagem ||
          "Configuração do Ponto Mobile salva com sucesso."
      );
    } catch (error) {
      mostrarToast(
        "erro",
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a configuração."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function copiarLink() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(linkAplicativo);
      } else {
        const campoTemporario =
          document.createElement("textarea");

        campoTemporario.value = linkAplicativo;
        campoTemporario.style.position = "fixed";
        campoTemporario.style.opacity = "0";

        document.body.appendChild(campoTemporario);
        campoTemporario.select();
        document.execCommand("copy");
        document.body.removeChild(campoTemporario);
      }

      mostrarToast(
        "sucesso",
        "Link do PHANYX RH copiado com sucesso."
      );
    } catch {
      mostrarToast(
        "erro",
        "Não foi possível copiar o link."
      );
    }
  }

  async function gerarQrCode() {
  try {
    const url = await QRCode.toDataURL(linkAplicativo, {
      width: 320,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    setQrCodeUrl(url);
  } catch {
    mostrarToast(
      "erro",
      "Não foi possível gerar o QR Code."
    );
  }
}

function baixarQrCode() {
  if (!qrCodeUrl) {
    mostrarToast(
      "erro",
      "O QR Code ainda não foi gerado."
    );
    return;
  }

  const link = document.createElement("a");
  link.href = qrCodeUrl;
  link.download = "phanyx-rh-qrcode.png";
  link.click();
}

function imprimirQrCode() {
  if (!qrCodeUrl) {
    mostrarToast(
      "erro",
      "O QR Code ainda não foi gerado."
    );
    return;
  }

  const janela = window.open(
    "",
    "_blank",
    "width=800,height=900"
  );

  if (!janela) {
    mostrarToast(
      "erro",
      "Não foi possível abrir a janela de impressão."
    );
    return;
  }

  janela.document.write(`
    <html>
      <head>
        <title>QR Code - PHANYX RH</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 32px;
            text-align: center;
            color: #0f172a;
          }

          .box {
            max-width: 520px;
            margin: 0 auto;
            border: 1px solid #cbd5e1;
            border-radius: 24px;
            padding: 24px;
          }

          h1 {
            margin: 0 0 10px;
            font-size: 28px;
          }

          p {
            font-size: 16px;
            line-height: 1.6;
          }

          img {
            width: 260px;
            height: 260px;
            margin: 20px auto;
            display: block;
            border: 1px solid #cbd5e1;
            border-radius: 16px;
            padding: 12px;
            background: white;
          }

          .link {
            margin-top: 14px;
            font-weight: bold;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="box">
          <h1>PHANYX RH</h1>
          <p>Escaneie o QR Code abaixo para acessar o aplicativo de ponto do funcionário.</p>
          <img src="${qrCodeUrl}" alt="QR Code PHANYX RH" />
          <p class="link">${linkAplicativo}</p>
        </div>
      </body>
    </html>
  `);

  janela.document.close();
  janela.focus();
  janela.print();
}

  if (carregando) {
    return (
      <main className="phanyx-ponto-mobile-page min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Carregando configurações do Ponto Mobile...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="phanyx-ponto-mobile-page min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {toast && (
        <div
          className={`fixed right-4 top-4 z-[100] max-w-md rounded-2xl border px-5 py-4 shadow-xl ${
            toast.tipo === "sucesso"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100"
              : "border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-100"
          }`}
        >
          <p className="text-sm font-semibold">
            {toast.mensagem}
          </p>
        </div>
      )}

      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
            RH PHANYX
          </p>

          <h1 className="text-3xl font-black tracking-tight">
            Ponto Mobile
          </h1>

          <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Configure o registro de ponto pelo celular com
            foto, localização e liberação individual dos
            funcionários.
          </p>
        </header>

        <section
          className={`rounded-3xl border p-6 shadow-sm ${
            configuracao.ativo
              ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
              : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black">
                Ativação do Ponto Mobile
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Quando ativado, somente funcionários
                individualmente liberados pelo RH poderão
                registrar ponto pelo celular.
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
              <input
                type="checkbox"
                checked={configuracao.ativo}
                onChange={(evento) =>
                  atualizarCampo(
                    "ativo",
                    evento.target.checked
                  )
                }
                className="h-5 w-5 accent-blue-600"
              />

              <span className="text-sm font-bold">
                {configuracao.ativo
                  ? "Ponto Mobile ativado"
                  : "Ponto Mobile desativado"}
              </span>
            </label>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="phanyx-ponto-mobile-neutral-card rounded-3xl border p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-black">
                Regras do registro
              </h2>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Defina quais validações serão solicitadas no
                celular do funcionário.
              </p>
            </div>

            <div className="space-y-4">
              <CampoConfiguracao
                titulo="Exigir foto no momento do ponto"
                descricao="A câmera frontal será aberta para capturar uma foto ao vivo."
                marcado={configuracao.exigirFoto}
                aoAlterar={(valor) =>
                  atualizarCampo("exigirFoto", valor)
                }
              />

              <CampoConfiguracao
                titulo="Exigir localização do celular"
                descricao="O PHANYX solicitará a localização no momento do registro."
                marcado={configuracao.exigirLocalizacao}
                aoAlterar={(valor) =>
                  atualizarCampo(
                    "exigirLocalizacao",
                    valor
                  )
                }
              />

              <CampoConfiguracao
                titulo="Ativar reconhecimento facial"
                descricao="A foto capturada será comparada com a foto oficial do funcionário."
                marcado={
                  configuracao.reconhecimentoFacialAtivo
                }
                aoAlterar={(valor) =>
                  atualizarCampo(
                    "reconhecimentoFacialAtivo",
                    valor
                  )
                }
              />

              <CampoConfiguracao
                titulo="Exigir prova de vida"
                descricao="Solicitará uma ação diante da câmera para reduzir o uso de fotografias."
                marcado={configuracao.exigirProvaVida}
                desabilitado={
                  !configuracao.reconhecimentoFacialAtivo
                }
                aoAlterar={(valor) =>
                  atualizarCampo(
                    "exigirProvaVida",
                    valor
                  )
                }
              />

              <CampoConfiguracao
                titulo="Permitir registro fora da área"
                descricao="O ponto será registrado, mas ficará sinalizado para análise do RH."
                marcado={
                  configuracao.permitirForaDoRaio
                }
                aoAlterar={(valor) =>
                  atualizarCampo(
                    "permitirForaDoRaio",
                    valor
                  )
                }
              />
            </div>

            <div className="phanyx-ponto-mobile-subcard mt-6 rounded-2xl border p-4">
              <label
                htmlFor="raioPadraoMetros"
                className="block text-sm font-black"
              >
                Raio padrão permitido
              </label>

              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
                Distância padrão entre o funcionário e o
                local autorizado.
              </p>

              <div className="mt-3 flex items-center gap-3">
                <input
                  id="raioPadraoMetros"
                  type="number"
                  min={10}
                  max={5000}
                  value={configuracao.raioPadraoMetros}
                  onChange={(evento) =>
                    atualizarCampo(
                      "raioPadraoMetros",
                      Math.min(
                        5000,
                        Math.max(
                          10,
                          Number(evento.target.value || 10)
                        )
                      )
                    )
                  }
                  className="w-36 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />

                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  metros
                </span>
              </div>
            </div>
          </section>

          <div className="space-y-6">
            <section className="phanyx-ponto-mobile-neutral-card rounded-3xl border p-6 shadow-sm">
              <h2 className="text-lg font-black text-blue-950 dark:text-blue-100">
                Funcionários autorizados
              </h2>

              <p className="mt-2 text-sm leading-6 text-blue-900/80 dark:text-blue-200">
                Mesmo com o recurso ativado, cada funcionário
                precisa ser liberado individualmente pelo RH.
              </p>

              <Link
                href="/admin/rh/ponto/mobile/funcionarios"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-blue-800"
              >
                Gerenciar funcionários
              </Link>
            </section>

           <section className="phanyx-ponto-mobile-neutral-card rounded-3xl border p-6 shadow-sm">
  <h2 className="text-lg font-black">
    Link e QR Code do PHANYX RH
  </h2>

  {identidadeInstituicao?.nome && (
  <div className="mt-3 rounded-2xl border border-slate-700 p-4">
    <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">
      Aplicativo desta instituição
    </p>

    <p className="mt-1 text-base font-black">
      {identidadeInstituicao.nome}
    </p>

    {(identidadeInstituicao.cidade ||
      identidadeInstituicao.estado) && (
      <p className="mt-1 text-xs">
        {[
          identidadeInstituicao.cidade,
          identidadeInstituicao.estado,
        ]
          .filter(Boolean)
          .join(" - ")}
      </p>
    )}
  </div>
)}

  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
    Copie o link, envie o QR Code ao funcionário ou imprima
    para facilitar a instalação do aplicativo.
  </p>

  <div className="mt-5 flex justify-center">
    {qrCodeUrl ? (
      <img
        src={qrCodeUrl}
        alt="QR Code do PHANYX RH"
        className="h-52 w-52 rounded-2xl border border-slate-300 bg-white p-3 dark:border-slate-700"
      />
    ) : (
      <div className="flex h-52 w-52 items-center justify-center rounded-2xl border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
        Gerando QR Code...
      </div>
    )}
  </div>

  <div className="phanyx-ponto-mobile-link-box mt-5 break-all rounded-2xl border p-4 text-sm font-semibold">
    {linkAplicativo}
  </div>

  <div className="mt-4 grid gap-3">
    <button
      type="button"
      onClick={copiarLink}
      className="phanyx-ponto-mobile-copy-button min-h-11 w-full rounded-xl border px-4 py-3 text-sm font-black transition"
    >
      Copiar link
    </button>

    <button
      type="button"
      onClick={baixarQrCode}
      className="phanyx-ponto-mobile-copy-button min-h-11 w-full rounded-xl border px-4 py-3 text-sm font-black transition"
    >
      Baixar QR Code
    </button>

    <button
      type="button"
      onClick={imprimirQrCode}
      className="phanyx-ponto-mobile-copy-button min-h-11 w-full rounded-xl border px-4 py-3 text-sm font-black transition"
    >
      Imprimir QR Code
    </button>
  </div>
</section>

            <section className="phanyx-ponto-mobile-note-card rounded-3xl border p-5">
              <p className="text-sm font-black text-amber-950 dark:text-amber-100">
                Liberação individual obrigatória
              </p>

              <p className="mt-2 text-xs leading-5 text-amber-900/80 dark:text-amber-200">
                Nenhum funcionário será liberado
                automaticamente. O RH deverá autorizar cada
                pessoa que poderá usar o celular para bater
                ponto.
              </p>
            </section>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/admin/rh/ponto/configuracoes"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Voltar
          </Link>

          <button
            type="button"
            onClick={salvarConfiguracao}
            disabled={salvando}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {salvando
              ? "Salvando..."
              : "Salvar configuração"}
          </button>
        </div>
      </div>
    </main>
  );
}

type CampoConfiguracaoProps = {
  titulo: string;
  descricao: string;
  marcado: boolean;
  desabilitado?: boolean;
  aoAlterar: (valor: boolean) => void;
};

function CampoConfiguracao({
  titulo,
  descricao,
  marcado,
  desabilitado = false,
  aoAlterar,
}: CampoConfiguracaoProps) {
  return (
  <label
    className={`phanyx-ponto-mobile-option-card flex items-start gap-4 rounded-2xl border p-4 transition ${
      desabilitado
        ? "is-disabled cursor-not-allowed"
        : "cursor-pointer"
    }`}
  >
    <input
      type="checkbox"
      checked={marcado}
      disabled={desabilitado}
      onChange={(evento) =>
        aoAlterar(evento.target.checked)
      }
      className="mt-1 h-5 w-5 shrink-0 accent-blue-600"
    />

    <span>
      <span
        className={`block text-sm font-black ${
          desabilitado
            ? "text-slate-600 dark:text-slate-300"
            : "text-slate-900 dark:text-slate-100"
        }`}
      >
        {titulo}
      </span>

      <span
        className={`mt-1 block text-xs leading-5 ${
          desabilitado
            ? "text-slate-500 dark:text-slate-400"
            : "text-slate-600 dark:text-slate-400"
        }`}
      >
        {descricao}
      </span>
    </span>
  </label>
);
}
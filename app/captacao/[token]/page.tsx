"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";
import {
  formatarTelefoneBR,
  normalizarTelefoneBR,
  telefoneValidoBR,
} from "@/lib/comercial/captacao/telefone";

type OpcaoCampo = {
  value: string;
  label: string;
};

type CampoPublico = {
  chave: string;
  rotulo: string;
  tipo: string;
  mapeamento: string;

  placeholder: string | null;
  textoAjuda: string | null;
  valorPadrao: string | null;
  mascara: string | null;

  obrigatorio: boolean;
  ordem: number;
  largura: number;

  opcoes: unknown;
  validacoes: unknown;
};

type RespostaFormulario = {
  success: true;

  formulario: {
    token: string;
    titulo: string;
    descricao: string | null;

    mensagemSucesso: string | null;
    urlRedirecionamento: string | null;

    versao: number;

    consentimento: {
      exigido: boolean;
      texto: string | null;
      versao: string | null;
      politicaPrivacidadeUrl: string | null;
    };

    visual: unknown;

    antiSpam: {
      honeypot: {
        ativo: boolean;
        campo: string | null;
      };

      recaptcha: {
        ativo: boolean;
        siteKey: string | null;
      };
    };

    campos: CampoPublico[];
  };
};

type RespostaErro = {
  success?: false;
  error?: string;

  message?: string;
  redirectUrl?: string | null;
};

type ValorCampo =
  | string
  | boolean
  | string[];

declare global {
  interface Window {
    grecaptcha?: {
      ready(
        callback: () => void
      ): void;

      execute(
        siteKey: string,
        options: {
          action: string;
        }
      ): Promise<string>;
    };
  }
}

function normalizarOpcoes(
  valor: unknown
): OpcaoCampo[] {
  if (
    Array.isArray(valor)
  ) {
    return valor
      .map(
        (
          item
        ): OpcaoCampo | null => {
          if (
            typeof item ===
            "string" ||
            typeof item ===
            "number"
          ) {
            return {
              value:
                String(item),

              label:
                String(item),
            };
          }

          if (
            item &&
            typeof item ===
            "object" &&
            !Array.isArray(
              item
            )
          ) {
            const registro =
              item as Record<
                string,
                unknown
              >;

            const value =
              registro.value ??
              registro.id ??
              registro.codigo;

            const label =
              registro.label ??
              registro.nome ??
              registro.texto ??
              value;

            if (
              value ===
              undefined ||
              label ===
              undefined
            ) {
              return null;
            }

            return {
              value:
                String(value),

              label:
                String(label),
            };
          }

          return null;
        }
      )
      .filter(
        (
          item
        ): item is OpcaoCampo =>
          item !== null
      );
  }

  return [];
}

function classeLargura(
  largura: number
) {
  if (
    largura <= 3
  ) {
    return "col-span-12 md:col-span-3";
  }

  if (
    largura <= 4
  ) {
    return "col-span-12 md:col-span-4";
  }

  if (
    largura <= 6
  ) {
    return "col-span-12 md:col-span-6";
  }

  return "col-span-12";
}

async function carregarRecaptcha(
  siteKey: string
) {
  if (
    window.grecaptcha
  ) {
    return;
  }

  await new Promise<void>(
    (
      resolve,
      reject
    ) => {
      const existente =
        document.querySelector<HTMLScriptElement>(
          'script[data-phanyx-recaptcha="true"]'
        );

      if (existente) {
        existente.addEventListener(
          "load",
          () =>
            resolve(),
          {
            once: true,
          }
        );

        existente.addEventListener(
          "error",
          () =>
            reject(
              new Error()
            ),
          {
            once: true,
          }
        );

        return;
      }

      const script =
        document.createElement(
          "script"
        );

      script.src =
        `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
          siteKey
        )}`;

      script.async =
        true;

      script.defer =
        true;

      script.dataset.phanyxRecaptcha =
        "true";

      script.onload =
        () =>
          resolve();

      script.onerror =
        () =>
          reject(
            new Error()
          );

      document.head.appendChild(
        script
      );
    }
  );
}

async function obterTokenRecaptcha(
  siteKey: string
) {
  await carregarRecaptcha(
    siteKey
  );

  if (
    !window.grecaptcha
  ) {
    throw new Error(
      "Não foi possível validar a proteção anti-spam."
    );
  }

  return new Promise<string>(
    (
      resolve,
      reject
    ) => {
      window.grecaptcha?.ready(
        () => {
          window.grecaptcha
            ?.execute(
              siteKey,
              {
                action:
                  "captacao_formulario",
              }
            )
            .then(resolve)
            .catch(reject);
        }
      );
    }
  );
}

export default function FormularioPublicoCaptacaoPage() {
  const params =
    useParams();

  const tokenParam =
    params.token;

  const token =
    Array.isArray(
      tokenParam
    )
      ? tokenParam[0] ?? ""
      : String(
        tokenParam ?? ""
      );

  const [
    dados,
    setDados,
  ] =
    useState<RespostaFormulario | null>(
      null
    );

  const [
    valores,
    setValores,
  ] =
    useState<
      Record<
        string,
        ValorCampo
      >
    >({});

  const [
    errosCampos,
    setErrosCampos,
  ] =
    useState<
      Record<
        string,
        string
      >
    >({});

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    enviando,
    setEnviando,
  ] =
    useState(false);

  const [
    erro,
    setErro,
  ] =
    useState("");

  const [
    sucesso,
    setSucesso,
  ] =
    useState("");

  const [
    consentimentoGlobal,
    setConsentimentoGlobal,
  ] =
    useState(false);

  const [
    honeypot,
    setHoneypot,
  ] =
    useState("");

  const carregar =
    useCallback(
      async () => {
        try {
          setCarregando(
            true
          );

          setErro("");

          const resposta =
            await fetch(
              `/api/public/captacao/formularios/${encodeURIComponent(
                token
              )}`,
              {
                cache:
                  "no-store",
              }
            );

          const json =
            (
              await resposta
                .json()
                .catch(
                  () => ({})
                )
            ) as
            | RespostaFormulario
            | RespostaErro;

          if (
            !resposta.ok ||
            !(
              "success" in
              json
            ) ||
            json.success !==
            true
          ) {
            throw new Error(
              (
                json as
                RespostaErro
              ).error ||
              "Este formulário não está disponível no momento."
            );
          }

          setDados(
            json
          );

          const iniciais:
            Record<
              string,
              ValorCampo
            > = {};

          for (
            const campo of
            json.formulario.campos
          ) {
            if (
              campo.tipo ===
              "SELECAO_MULTIPLA"
            ) {
              iniciais[
                campo.chave
              ] = [];
            } else if (
              campo.tipo ===
              "CHECKBOX" ||
              campo.tipo ===
              "CONSENTIMENTO"
            ) {
              iniciais[
                campo.chave
              ] = false;
            } else {
              iniciais[
                campo.chave
              ] =
                campo.valorPadrao ??
                "";
            }
          }

          setValores(
            iniciais
          );
        } catch (
        error
        ) {
          setErro(
            error instanceof
              Error
              ? error.message
              : "Este formulário não está disponível no momento."
          );
        } finally {
          setCarregando(
            false
          );
        }
      },
      [
        token,
      ]
    );

  useEffect(() => {
    if (token) {
      void carregar();
    }
  }, [
    carregar,
    token,
  ]);

  const campoConsentimento =
    useMemo(
      () =>
        dados?.formulario.campos.find(
          (
            campo
          ) =>
            campo.mapeamento ===
            "CONSENTIMENTO"
        ) ??
        null,
      [
        dados,
      ]
    );

  function atualizarValor(
    chave: string,
    valor: ValorCampo
  ) {
    setValores(
      (
        atual
      ) => ({
        ...atual,

        [chave]:
          valor,
      })
    );

    setErrosCampos(
      (
        atual
      ) => {
        if (
          !atual[chave]
        ) {
          return atual;
        }

        const proximo = {
          ...atual,
        };

        delete proximo[
          chave
        ];

        return proximo;
      }
    );
  }

    function validar() {
    if (!dados) {
      return false;
    }

    const novosErros: Record<
      string,
      string
    > = {};

    for (
      const campo of
      dados.formulario.campos
    ) {
      const valor =
        valores[campo.chave];

      const vazio =
        valor === undefined ||
        valor === null ||
        valor === "" ||
        valor === false ||
        (
          Array.isArray(valor) &&
          valor.length === 0
        );

      if (
        campo.obrigatorio &&
        vazio
      ) {
        novosErros[
          campo.chave
        ] =
          `Preencha “${campo.rotulo}”.`;

        continue;
      }

      if (
        campo.tipo === "EMAIL" &&
        typeof valor === "string" &&
        valor.trim()
      ) {
        const emailValido =
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            valor.trim()
          );

        if (!emailValido) {
          novosErros[
            campo.chave
          ] =
            "Informe um e-mail válido.";
        }
      }

      if (
        campo.tipo ===
          "TELEFONE" &&
        typeof valor ===
          "string" &&
        valor.trim()
      ) {
        if (
          !telefoneValidoBR(
            valor
          )
        ) {
          novosErros[
            campo.chave
          ] =
            "Informe um telefone válido com DDD.";
        }
      }
    }

    if (
      dados.formulario
        .consentimento
        .exigido &&
      !campoConsentimento &&
      !consentimentoGlobal
    ) {
      novosErros[
        "__consentimento"
      ] =
        "É necessário concordar para enviar seus dados.";
    }

    setErrosCampos(
      novosErros
    );

    return (
      Object.keys(
        novosErros
      ).length === 0
    );
  }

    function obterMetadados() {
      const query =
        new URLSearchParams(
          window.location.search
        );

      return {
        paginaOrigem:
          window.location.href,

        referrer:
          document.referrer ||
          null,

        idioma:
          navigator.language,

        utmSource:
          query.get(
            "utm_source"
          ) ??
          query.get(
            "utmSource"
          ),

        utmMedium:
          query.get(
            "utm_medium"
          ) ??
          query.get(
            "utmMedium"
          ),

        utmCampaign:
          query.get(
            "utm_campaign"
          ) ??
          query.get(
            "utmCampaign"
          ),

        utmContent:
          query.get(
            "utm_content"
          ) ??
          query.get(
            "utmContent"
          ),

        utmTerm:
          query.get(
            "utm_term"
          ) ??
          query.get(
            "utmTerm"
          ),

        gclid:
          query.get(
            "gclid"
          ),

        fbclid:
          query.get(
            "fbclid"
          ),

        msclkid:
          query.get(
            "msclkid"
          ),
      };
    }

    async function enviar(
      event:
        FormEvent<HTMLFormElement>
    ) {
      event.preventDefault();

      if (
        !dados ||
        enviando
      ) {
        return;
      }

      setErro("");

      setSucesso("");

      if (!validar()) {
        return;
      }

      try {
        setEnviando(
          true
        );

        const dadosEnvio:
          Record<
            string,
            unknown
          > = {};

        for (
          const campo of
          dados.formulario.campos
        ) {
          const valor =
            valores[
            campo.chave
            ];

          if (
            campo.mapeamento ===
            "TELEFONE" &&
            typeof valor ===
            "string"
          ) {
            dadosEnvio[
              campo.chave
            ] =
              normalizarTelefoneBR(
                valor
              );
          } else {
            dadosEnvio[
              campo.chave
            ] =
              valor;
          }
        }

        const consentimentoLgpd =
          campoConsentimento
            ? Boolean(
              valores[
              campoConsentimento
                .chave
              ]
            )
            : consentimentoGlobal;

        const corpo:
          Record<
            string,
            unknown
          > = {
          dados:
            dadosEnvio,

          metadados:
            obterMetadados(),

          consentimentoLgpd,
        };

        const campoHoneypot =
          dados.formulario
            .antiSpam
            .honeypot
            .campo;

        if (
          campoHoneypot
        ) {
          corpo[
            campoHoneypot
          ] =
            honeypot;
        }

        if (
          dados.formulario
            .antiSpam
            .recaptcha
            .ativo
        ) {
          const siteKey =
            dados.formulario
              .antiSpam
              .recaptcha
              .siteKey;

          if (!siteKey) {
            throw new Error(
              "Este formulário ainda não está pronto para receber envios."
            );
          }

          corpo.recaptchaToken =
            await obterTokenRecaptcha(
              siteKey
            );
        }

        const resposta =
          await fetch(
            `/api/public/captacao/formularios/${encodeURIComponent(
              token
            )}/submissoes`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  corpo
                ),
            }
          );

        const json =
          (
            await resposta
              .json()
              .catch(
                () => ({})
              )
          ) as {
            success?: boolean;

            error?: string;

            message?: string;

            redirectUrl?:
            string | null;
          };

        if (
          !resposta.ok ||
          json.success !==
          true
        ) {
          throw new Error(
            json.error ||
            "Não foi possível enviar seus dados. Tente novamente."
          );
        }

        const mensagem =
          json.message ||
          dados.formulario
            .mensagemSucesso ||
          "Seus dados foram enviados com sucesso.";

        setSucesso(
          mensagem
        );

        if (
          json.redirectUrl
        ) {
          window.setTimeout(
            () => {
              window.location.assign(
                json.redirectUrl as string
              );
            },
            1200
          );
        }
      } catch (
      error
      ) {
        setErro(
          error instanceof
            Error
            ? error.message
            : "Não foi possível enviar seus dados. Tente novamente."
        );
      } finally {
        setEnviando(
          false
        );
      }
    }

    function renderizarCampo(
      campo: CampoPublico
    ) {
      const valor =
        valores[
        campo.chave
        ];

      const erroCampo =
        errosCampos[
        campo.chave
        ];

      const obrigatorio =
        campo.obrigatorio;

      const rotulo = (
        <label
          htmlFor={
            campo.chave
          }
          className="mb-2 block text-sm font-semibold text-slate-900"
        >
          {campo.rotulo}

          {obrigatorio && (
            <span className="ml-1 text-red-600">
              *
            </span>
          )}
        </label>
      );

      const classeInput =
        `w-full rounded-xl border px-3.5 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${erroCampo
          ? "border-red-400 bg-red-50"
          : "border-slate-300 bg-white"
        }`;

      if (
        campo.tipo ===
        "OCULTO"
      ) {
        return (
          <input
            id={
              campo.chave
            }
            type="hidden"
            value={
              typeof valor ===
                "string"
                ? valor
                : ""
            }
            readOnly
          />
        );
      }

      if (
        campo.tipo ===
        "TEXTO_LONGO"
      ) {
        return (
          <>
            {rotulo}

            <textarea
              id={
                campo.chave
              }
              rows={4}
              value={
                typeof valor ===
                  "string"
                  ? valor
                  : ""
              }
              onChange={(
                event
              ) =>
                atualizarValor(
                  campo.chave,
                  event.target
                    .value
                )
              }
              placeholder={
                campo.placeholder ??
                undefined
              }
              className={
                classeInput
              }
            />
          </>
        );
      }

      if (
        campo.tipo ===
        "SELECAO_UNICA"
      ) {
        const opcoes =
          normalizarOpcoes(
            campo.opcoes
          );

        return (
          <>
            {rotulo}

            <select
              id={
                campo.chave
              }
              value={
                typeof valor ===
                  "string"
                  ? valor
                  : ""
              }
              onChange={(
                event
              ) =>
                atualizarValor(
                  campo.chave,
                  event.target
                    .value
                )
              }
              className={
                classeInput
              }
            >
              <option value="">
                {campo.placeholder ||
                  "Selecione uma opção"}
              </option>

              {opcoes.map(
                (
                  opcao
                ) => (
                  <option
                    key={
                      opcao.value
                    }
                    value={
                      opcao.value
                    }
                  >
                    {
                      opcao.label
                    }
                  </option>
                )
              )}
            </select>
          </>
        );
      }

      if (
        campo.tipo ===
        "SELECAO_MULTIPLA"
      ) {
        const opcoes =
          normalizarOpcoes(
            campo.opcoes
          );

        const selecionados =
          Array.isArray(
            valor
          )
            ? valor
            : [];

        return (
          <>
            {rotulo}

            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {opcoes.map(
                (
                  opcao
                ) => {
                  const marcado =
                    selecionados.includes(
                      opcao.value
                    );

                  return (
                    <label
                      key={
                        opcao.value
                      }
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-white"
                    >
                      <input
                        type="checkbox"
                        checked={
                          marcado
                        }
                        onChange={() => {
                          atualizarValor(
                            campo.chave,
                            marcado
                              ? selecionados.filter(
                                (
                                  item
                                ) =>
                                  item !==
                                  opcao.value
                              )
                              : [
                                ...selecionados,
                                opcao.value,
                              ]
                          );
                        }}
                        className="h-4 w-4"
                      />

                      <span className="text-sm text-slate-800">
                        {
                          opcao.label
                        }
                      </span>
                    </label>
                  );
                }
              )}
            </div>
          </>
        );
      }

      if (
        campo.tipo ===
        "CHECKBOX" ||
        campo.tipo ===
        "CONSENTIMENTO"
      ) {
        return (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <input
              id={
                campo.chave
              }
              type="checkbox"
              checked={
                Boolean(
                  valor
                )
              }
              onChange={(
                event
              ) =>
                atualizarValor(
                  campo.chave,
                  event.target
                    .checked
                )
              }
              className="mt-1 h-5 w-5 shrink-0"
            />

            <span className="text-sm leading-6 text-slate-800">
              {
                campo.rotulo
              }

              {obrigatorio && (
                <span className="ml-1 text-red-600">
                  *
                </span>
              )}

              {campo.tipo ===
                "CONSENTIMENTO" &&
                dados?.formulario
                  .consentimento
                  .texto && (
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {
                      dados
                        .formulario
                        .consentimento
                        .texto
                    }
                  </span>
                )}
            </span>
          </label>
        );
      }

      const tipoHtml =
        campo.tipo ===
          "EMAIL"
          ? "email"
          : campo.tipo ===
            "NUMERO"
            ? "number"
            : campo.tipo ===
              "DATA"
              ? "date"
              : campo.tipo ===
                "TELEFONE"
                ? "tel"
                : "text";

      return (
        <>
          {rotulo}

          <input
            id={
              campo.chave
            }
            type={
              tipoHtml
            }
            inputMode={
              campo.tipo ===
                "TELEFONE"
                ? "tel"
                : undefined
            }
            autoComplete={
              campo.mapeamento ===
                "NOME"
                ? "name"
                : campo.mapeamento ===
                  "EMAIL"
                  ? "email"
                  : campo.mapeamento ===
                    "TELEFONE"
                    ? "tel"
                    : undefined
            }
            value={
              typeof valor ===
                "string"
                ? valor
                : ""
            }
            onChange={(
              event
            ) => {
              const novoValor =
                campo.tipo ===
                  "TELEFONE"
                  ? formatarTelefoneBR(
                    event.target
                      .value
                  )
                  : event.target
                    .value;

              atualizarValor(
                campo.chave,
                novoValor
              );
            }}
            placeholder={
              campo.placeholder ??
              undefined
            }
            className={
              classeInput
            }
          />
        </>
      );
    }

    if (carregando) {
      return (
        <main className="min-h-screen bg-slate-50 px-4 py-10">
          <div className="mx-auto max-w-3xl">
            <div className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm" />
          </div>
        </main>
      );
    }

    if (
      erro &&
      !dados
    ) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="text-4xl">
              📄
            </div>

            <h1 className="mt-4 text-xl font-bold text-slate-900">
              Formulário indisponível
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {erro}
            </p>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Se você recebeu este link de uma instituição, entre em contato com ela para obter ajuda.
            </p>
          </div>
        </main>
      );
    }

    if (!dados) {
      return null;
    }

    if (sucesso) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
          <div className="w-full max-w-lg rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
              ✓
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-900">
              Tudo certo!
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              {sucesso}
            </p>

            {dados.formulario
              .urlRedirecionamento && (
                <p className="mt-3 text-xs text-slate-500">
                  Você será direcionado em instantes.
                </p>
              )}
          </div>
        </main>
      );
    }

    const possuiConsentimentoValido =
      !dados.formulario
        .consentimento
        .exigido ||
      Boolean(
        dados.formulario
          .consentimento
          .texto &&
        dados.formulario
          .consentimento
          .versao
      );

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-6 sm:px-8 sm:py-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Formulário de interesse
              </p>

              <h1 className="mt-2 text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">
                {
                  dados.formulario
                    .titulo
                }
              </h1>

              {dados.formulario
                .descricao && (
                  <p className="mt-3 text-base leading-7 text-slate-600">
                    {
                      dados
                        .formulario
                        .descricao
                    }
                  </p>
                )}

              <p className="mt-4 text-xs text-slate-500">
                Os campos marcados com * são obrigatórios.
              </p>
            </div>

            <form
              onSubmit={
                enviar
              }
              className="px-5 py-6 sm:px-8 sm:py-8"
            >
              {!possuiConsentimentoValido && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  Este formulário ainda está sendo configurado e não pode receber dados neste momento.
                </div>
              )}

              {erro && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  {erro}
                </div>
              )}

              <div className="grid grid-cols-12 gap-x-4 gap-y-6">
                {dados.formulario.campos.map(
                  (
                    campo
                  ) => {
                    if (
                      campo.tipo ===
                      "OCULTO"
                    ) {
                      return (
                        <div
                          key={
                            campo.chave
                          }
                          className="hidden"
                        >
                          {renderizarCampo(
                            campo
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={
                          campo.chave
                        }
                        className={
                          classeLargura(
                            campo.largura
                          )
                        }
                      >
                        {renderizarCampo(
                          campo
                        )}

                        {campo.tipo !==
                          "CONSENTIMENTO" &&
                          (
                            campo.tipo ===
                            "TELEFONE" ||
                            campo.textoAjuda
                          ) && (
                            <p className="mt-1.5 text-xs leading-5 text-slate-500">
                              {campo.tipo ===
                                "TELEFONE"
                                ? "Informe seu telefone com DDD."
                                : campo.textoAjuda}
                            </p>
                          )}

                        {errosCampos[
                          campo.chave
                        ] && (
                            <p className="mt-1.5 text-xs font-medium text-red-600">
                              {
                                errosCampos[
                                campo.chave
                                ]
                              }
                            </p>
                          )}
                      </div>
                    );
                  }
                )}
              </div>

              {dados.formulario
                .consentimento
                .exigido &&
                !campoConsentimento && (
                  <div className="mt-7">
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <input
                        type="checkbox"
                        checked={
                          consentimentoGlobal
                        }
                        onChange={(
                          event
                        ) => {
                          setConsentimentoGlobal(
                            event.target
                              .checked
                          );

                          setErrosCampos(
                            (
                              atual
                            ) => {
                              const proximo = {
                                ...atual,
                              };

                              delete proximo[
                                "__consentimento"
                              ];

                              return proximo;
                            }
                          );
                        }}
                        className="mt-1 h-5 w-5 shrink-0"
                      />

                      <span className="text-sm leading-6 text-slate-700">
                        {
                          dados
                            .formulario
                            .consentimento
                            .texto
                        }

                        <span className="ml-1 text-red-600">
                          *
                        </span>
                      </span>
                    </label>

                    {errosCampos[
                      "__consentimento"
                    ] && (
                        <p className="mt-1.5 text-xs font-medium text-red-600">
                          {
                            errosCampos[
                            "__consentimento"
                            ]
                          }
                        </p>
                      )}
                  </div>
                )}

              {dados.formulario
                .consentimento
                .politicaPrivacidadeUrl && (
                  <p className="mt-4 text-xs leading-5 text-slate-500">
                    Ao enviar, seus dados serão tratados conforme a{" "}
                    <a
                      href={
                        dados
                          .formulario
                          .consentimento
                          .politicaPrivacidadeUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-blue-700 underline underline-offset-2"
                    >
                      Política de Privacidade
                    </a>
                    .
                  </p>
                )}

              {dados.formulario
                .antiSpam
                .honeypot
                .ativo && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-[10000px] h-px w-px overflow-hidden"
                  >
                    <label>
                      Não preencha este campo
                      <input
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={
                          honeypot
                        }
                        onChange={(
                          event
                        ) =>
                          setHoneypot(
                            event.target
                              .value
                          )
                        }
                      />
                    </label>
                  </div>
                )}

              <div className="mt-8 border-t border-slate-200 pt-6">
                <button
                  type="submit"
                  disabled={
                    enviando ||
                    !possuiConsentimentoValido
                  }
                  className="w-full rounded-xl bg-blue-700 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enviando
                    ? "Enviando..."
                    : "Enviar meus dados"}
                </button>

                <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                  Seus dados serão enviados com segurança para a instituição responsável por este formulário.
                </p>
              </div>
            </form>
          </section>
        </div>
      </main>
    );
  }
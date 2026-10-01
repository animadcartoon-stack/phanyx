"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useTranslations,
} from "next-intl";


type TipoEtiqueta =
  | "LOMBADA"
  | "CODIGO_BARRAS";

type Orientacao =
  | "RETRATO"
  | "PAISAGEM";

type Origem =
  | "SISTEMA"
  | "FABRICANTE"
  | "PERSONALIZADO";


type ModeloEtiqueta = {
  id: string;
  idBanco: number | null;
  persistido: boolean;

  nome: string;
  descricao: string | null;

  tipo: TipoEtiqueta;
  origem: Origem;

  marca: string | null;
  codigoFabricante: string | null;

  larguraFolhaMm: number;
  alturaFolhaMm: number;

  orientacao: Orientacao;

  margemSuperiorMm: number;
  margemDireitaMm: number;
  margemInferiorMm: number;
  margemEsquerdaMm: number;

  larguraEtiquetaMm: number;
  alturaEtiquetaMm: number;

  espacoHorizontalMm: number;
  espacoVerticalMm: number;

  colunas: number;
  linhas: number;
  capacidade: number;

  deslocamentoHorizontalMm: number;
  deslocamentoVerticalMm: number;

  padrao: boolean;
  ativo: boolean;

  editavel: boolean;
  excluivel: boolean;
};


type RespostaApi = {
  ok?: boolean;

  modelos?: ModeloEtiqueta[];
  modelo?: ModeloEtiqueta;

  mensagem?: string;
  message?: string;
  error?: string;
};


type FormularioModelo = {
  nome: string;
  descricao: string;

  tipo: TipoEtiqueta;

  marca: string;
  codigoFabricante: string;

  larguraFolhaMm: string;
  alturaFolhaMm: string;

  orientacao: Orientacao;

  margemSuperiorMm: string;
  margemDireitaMm: string;
  margemInferiorMm: string;
  margemEsquerdaMm: string;

  larguraEtiquetaMm: string;
  alturaEtiquetaMm: string;

  espacoHorizontalMm: string;
  espacoVerticalMm: string;

  colunas: string;
  linhas: string;

  deslocamentoHorizontalMm: string;
  deslocamentoVerticalMm: string;

  ativo: boolean;
  padrao: boolean;
};


type Editor = {
  idBanco: number | null;
  modo:
    | "NOVO"
    | "EDITAR"
    | "DUPLICAR";

  formulario:
    FormularioModelo;
};


const API =
  "/api/admin/biblioteca/modelos-etiqueta";


function formularioNovo(
  tipo:
    TipoEtiqueta
): FormularioModelo {
  if (
    tipo ===
    "CODIGO_BARRAS"
  ) {
    return {
      nome:
        "",

      descricao:
        "",

      tipo:
        "CODIGO_BARRAS",

      marca:
        "",

      codigoFabricante:
        "",

      larguraFolhaMm:
        "210",

      alturaFolhaMm:
        "297",

      orientacao:
        "RETRATO",

      margemSuperiorMm:
        "10",

      margemDireitaMm:
        "10",

      margemInferiorMm:
        "10",

      margemEsquerdaMm:
        "10",

      larguraEtiquetaMm:
        "50",

      alturaEtiquetaMm:
        "28",

      espacoHorizontalMm:
        "5",

      espacoVerticalMm:
        "4",

      colunas:
        "3",

      linhas:
        "7",

      deslocamentoHorizontalMm:
        "0",

      deslocamentoVerticalMm:
        "0",

      ativo:
        true,

      padrao:
        false,
    };
  }

  return {
    nome:
      "",

    descricao:
      "",

    tipo:
      "LOMBADA",

    marca:
      "",

    codigoFabricante:
      "",

    larguraFolhaMm:
      "210",

    alturaFolhaMm:
      "297",

    orientacao:
      "RETRATO",

    margemSuperiorMm:
      "10",

    margemDireitaMm:
      "10",

    margemInferiorMm:
      "10",

    margemEsquerdaMm:
      "10",

    larguraEtiquetaMm:
      "35",

    alturaEtiquetaMm:
      "25",

    espacoHorizontalMm:
      "3",

    espacoVerticalMm:
      "2",

    colunas:
      "5",

    linhas:
      "9",

    deslocamentoHorizontalMm:
      "0",

    deslocamentoVerticalMm:
      "0",

    ativo:
      true,

    padrao:
      false,
  };
}


function modeloParaFormulario(
  modelo:
    ModeloEtiqueta,
  nome:
    string = modelo.nome,
): FormularioModelo {
  return {
    nome,

    descricao:
      modelo.descricao ||
      "",

    tipo:
      modelo.tipo,

    marca:
      modelo.marca ||
      "",

    codigoFabricante:
      modelo.codigoFabricante ||
      "",

    larguraFolhaMm:
      String(
        modelo.larguraFolhaMm
      ),

    alturaFolhaMm:
      String(
        modelo.alturaFolhaMm
      ),

    orientacao:
      modelo.orientacao,

    margemSuperiorMm:
      String(
        modelo.margemSuperiorMm
      ),

    margemDireitaMm:
      String(
        modelo.margemDireitaMm
      ),

    margemInferiorMm:
      String(
        modelo.margemInferiorMm
      ),

    margemEsquerdaMm:
      String(
        modelo.margemEsquerdaMm
      ),

    larguraEtiquetaMm:
      String(
        modelo.larguraEtiquetaMm
      ),

    alturaEtiquetaMm:
      String(
        modelo.alturaEtiquetaMm
      ),

    espacoHorizontalMm:
      String(
        modelo.espacoHorizontalMm
      ),

    espacoVerticalMm:
      String(
        modelo.espacoVerticalMm
      ),

    colunas:
      String(
        modelo.colunas
      ),

    linhas:
      String(
        modelo.linhas
      ),

    deslocamentoHorizontalMm:
      String(
        modelo.deslocamentoHorizontalMm
      ),

    deslocamentoVerticalMm:
      String(
        modelo.deslocamentoVerticalMm
      ),

    ativo:
      modelo.ativo,

    padrao:
      false,
  };
}


function mensagemErro(
  dados:
    RespostaApi,
  padrao:
    string,
) {
  return (
    dados.mensagem ||
    dados.message ||
    dados.error ||
    padrao
  );
}


type CampoProps = {
  label: string;
  value: string;

  onChange:
    (
      valor:
        string
    ) => void;

  type?:
    "text" |
    "number";

  step?:
    string;

  min?:
    string;

  placeholder?:
    string;
};


function Campo({
  label,
  value,
  onChange,
  type =
    "text",
  step,
  min,
  placeholder,
}: CampoProps) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide !text-slate-600 dark:!text-slate-300">
        {label}
      </span>

      <input
        type={type}
        value={value}
        step={step}
        min={min}
        placeholder={placeholder}
        onChange={(
          evento
        ) =>
          onChange(
            evento.target.value
          )
        }
        className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm !text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:!text-white"
      />
    </label>
  );
}


export function ModelosEtiquetaBiblioteca() {
  const t =
    useTranslations(
      "AdminLibrarySettings.labelModels"
    );

  const [
    modelos,
    setModelos,
  ] =
    useState<
      ModeloEtiqueta[]
    >([]);

  const [
    carregando,
    setCarregando,
  ] =
    useState(
      true
    );

  const [
    processando,
    setProcessando,
  ] =
    useState(
      false
    );

  const [
    erro,
    setErro,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    tipoAtivo,
    setTipoAtivo,
  ] =
    useState<
      TipoEtiqueta
    >(
      "LOMBADA"
    );

  const [
    editor,
    setEditor,
  ] =
    useState<
      Editor | null
    >(
      null
    );

  const [
    excluir,
    setExcluir,
  ] =
    useState<
      ModeloEtiqueta | null
    >(
      null
    );

  const [
    toast,
    setToast,
  ] =
    useState<
      string | null
    >(
      null
    );


  const carregar =
    useCallback(
      async () => {
        setCarregando(
          true
        );

        setErro(
          null
        );

        try {
          const resposta =
            await fetch(
              API,
              {
                cache:
                  "no-store",
              }
            );

          const dados =
            await resposta.json() as
              RespostaApi;

          if (
            !resposta.ok ||
            !dados.ok ||
            !Array.isArray(
              dados.modelos
            )
          ) {
            throw new Error(
              mensagemErro(
                dados,
                t(
                  "errors.load"
                )
              )
            );
          }

          setModelos(
            dados.modelos
          );
        } catch (
          erroCarregamento
        ) {
          setErro(
            erroCarregamento
              instanceof Error
              ? erroCarregamento.message
              : t(
                  "errors.load"
                )
          );
        } finally {
          setCarregando(
            false
          );
        }
      },
      [
        t,
      ]
    );


  useEffect(
    () => {
      void carregar();
    },
    [
      carregar,
    ]
  );


  useEffect(
    () => {
      if (!toast) {
        return;
      }

      const timer =
        window.setTimeout(
          () =>
            setToast(
              null
            ),
          3500
        );

      return () =>
        window.clearTimeout(
          timer
        );
    },
    [
      toast,
    ]
  );


  const filtrados =
    useMemo(
      () =>
        modelos.filter(
          (
            modelo
          ) =>
            modelo.tipo ===
            tipoAtivo
        ),
      [
        modelos,
        tipoAtivo,
      ]
    );


  const alterarCampo =
    (
      campo:
        keyof FormularioModelo,
      valor:
        string | boolean,
    ) => {
      setEditor(
        (
          atual
        ) => {
          if (!atual) {
            return atual;
          }

          return {
            ...atual,

            formulario: {
              ...atual.formulario,

              [campo]:
                valor,
            },
          };
        }
      );
    };


  const abrirNovo =
    (
      tipoInicial:
        TipoEtiqueta
    ) => {
      setEditor({
        idBanco:
          null,

        modo:
          "NOVO",

        formulario:
          formularioNovo(
            tipoInicial
          ),
      });
    };


  const abrirEditar =
    (
      modelo:
        ModeloEtiqueta
    ) => {
      if (
        !modelo.editavel ||
        !modelo.idBanco
      ) {
        return;
      }

      setEditor({
        idBanco:
          modelo.idBanco,

        modo:
          "EDITAR",

        formulario:
          modeloParaFormulario(
            modelo
          ),
      });
    };


  const abrirDuplicar =
    (
      modelo:
        ModeloEtiqueta
    ) => {
      setEditor({
        idBanco:
          null,

        modo:
          "DUPLICAR",

        formulario:
          modeloParaFormulario(
            modelo,
            modelo.nome +
              t(
                "copySuffix"
              )
          ),
      });
    };


  const salvar =
    async () => {
      if (!editor) {
        return;
      }

      const formulario =
        editor.formulario;

      if (
        !formulario.nome.trim()
      ) {
        setToast(
          t(
            "validation.name"
          )
        );

        return;
      }

      setProcessando(
        true
      );

      try {
        const corpo = {
          nome:
            formulario.nome.trim(),

          descricao:
            formulario.descricao.trim() ||
            null,

          tipo:
            formulario.tipo,

          marca:
            formulario.marca.trim() ||
            null,

          codigoFabricante:
            formulario.codigoFabricante.trim() ||
            null,

          larguraFolhaMm:
            Number(
              formulario.larguraFolhaMm
            ),

          alturaFolhaMm:
            Number(
              formulario.alturaFolhaMm
            ),

          orientacao:
            formulario.orientacao,

          margemSuperiorMm:
            Number(
              formulario.margemSuperiorMm
            ),

          margemDireitaMm:
            Number(
              formulario.margemDireitaMm
            ),

          margemInferiorMm:
            Number(
              formulario.margemInferiorMm
            ),

          margemEsquerdaMm:
            Number(
              formulario.margemEsquerdaMm
            ),

          larguraEtiquetaMm:
            Number(
              formulario.larguraEtiquetaMm
            ),

          alturaEtiquetaMm:
            Number(
              formulario.alturaEtiquetaMm
            ),

          espacoHorizontalMm:
            Number(
              formulario.espacoHorizontalMm
            ),

          espacoVerticalMm:
            Number(
              formulario.espacoVerticalMm
            ),

          colunas:
            Number(
              formulario.colunas
            ),

          linhas:
            Number(
              formulario.linhas
            ),

          deslocamentoHorizontalMm:
            Number(
              formulario.deslocamentoHorizontalMm
            ),

          deslocamentoVerticalMm:
            Number(
              formulario.deslocamentoVerticalMm
            ),

          ativo:
            formulario.ativo,

          padrao:
            formulario.padrao,
        };

        const resposta =
          await fetch(
            editor.idBanco
              ? `${API}/${editor.idBanco}`
              : API,
            {
              method:
                editor.idBanco
                  ? "PATCH"
                  : "POST",

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

        const dados =
          await resposta.json() as
            RespostaApi;

        if (
          !resposta.ok ||
          !dados.ok
        ) {
          throw new Error(
            mensagemErro(
              dados,
              t(
                "errors.save"
              )
            )
          );
        }

        setEditor(
          null
        );

        setToast(
          editor.idBanco
            ? t(
                "success.updated"
              )
            : t(
                "success.created"
              )
        );

        await carregar();
      } catch (
        erroSalvamento
      ) {
        setToast(
          erroSalvamento
            instanceof Error
            ? erroSalvamento.message
            : t(
                "errors.save"
              )
        );
      } finally {
        setProcessando(
          false
        );
      }
    };


  const definirPadrao =
    async (
      modelo:
        ModeloEtiqueta
    ) => {
      if (
        modelo.padrao
      ) {
        return;
      }

      setProcessando(
        true
      );

      try {
        const resposta =
          modelo.persistido &&
          modelo.idBanco
            ? await fetch(
                `${API}/${modelo.idBanco}`,
                {
                  method:
                    "PATCH",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body:
                    JSON.stringify({
                      acao:
                        "DEFINIR_PADRAO",
                    }),
                }
              )
            : await fetch(
                API,
                {
                  method:
                    "PATCH",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body:
                    JSON.stringify({
                      acao:
                        "DEFINIR_PADRAO_SISTEMA",

                      tipo:
                        modelo.tipo,
                    }),
                }
              );

        const dados =
          await resposta.json() as
            RespostaApi;

        if (
          !resposta.ok ||
          !dados.ok
        ) {
          throw new Error(
            mensagemErro(
              dados,
              t(
                "errors.action"
              )
            )
          );
        }

        setToast(
          t(
            "success.defaultChanged"
          )
        );

        await carregar();
      } catch (
        erroAcao
      ) {
        setToast(
          erroAcao
            instanceof Error
            ? erroAcao.message
            : t(
                "errors.action"
              )
        );
      } finally {
        setProcessando(
          false
        );
      }
    };


  const alternarAtivo =
    async (
      modelo:
        ModeloEtiqueta
    ) => {
      if (
        !modelo.idBanco
      ) {
        return;
      }

      setProcessando(
        true
      );

      try {
        const resposta =
          await fetch(
            `${API}/${modelo.idBanco}`,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  acao:
                    modelo.ativo
                      ? "DESATIVAR"
                      : "ATIVAR",
                }),
            }
          );

        const dados =
          await resposta.json() as
            RespostaApi;

        if (
          !resposta.ok ||
          !dados.ok
        ) {
          throw new Error(
            mensagemErro(
              dados,
              t(
                "errors.action"
              )
            )
          );
        }

        setToast(
          t(
            "success.stateChanged"
          )
        );

        await carregar();
      } catch (
        erroAcao
      ) {
        setToast(
          erroAcao
            instanceof Error
            ? erroAcao.message
            : t(
                "errors.action"
              )
        );
      } finally {
        setProcessando(
          false
        );
      }
    };


  const confirmarExclusao =
    async () => {
      if (
        !excluir?.idBanco
      ) {
        return;
      }

      setProcessando(
        true
      );

      try {
        const resposta =
          await fetch(
            `${API}/${excluir.idBanco}`,
            {
              method:
                "DELETE",
            }
          );

        const dados =
          await resposta.json() as
            RespostaApi;

        if (
          !resposta.ok ||
          !dados.ok
        ) {
          throw new Error(
            mensagemErro(
              dados,
              t(
                "errors.action"
              )
            )
          );
        }

        setExcluir(
          null
        );

        setToast(
          t(
            "success.deleted"
          )
        );

        await carregar();
      } catch (
        erroAcao
      ) {
        setToast(
          erroAcao
            instanceof Error
            ? erroAcao.message
            : t(
                "errors.action"
              )
        );
      } finally {
        setProcessando(
          false
        );
      }
    };


  return (
    <>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] !text-indigo-700 dark:!text-indigo-300">
              {t(
                "eyebrow"
              )}
            </p>

            <h2 className="mt-1 text-xl font-black !text-slate-950 dark:!text-white">
              {t(
                "title"
              )}
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-6 !text-slate-600 dark:!text-slate-300">
              {t(
                "description"
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={
                carregando ||
                processando
              }
              onClick={() =>
                void carregar()
              }
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-black !text-slate-800 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:!text-white dark:hover:bg-slate-800"
            >
              {t(
                "reload"
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                abrirNovo(
                  tipoAtivo
                )
              }
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-indigo-700 px-4 text-sm font-black !text-white [-webkit-text-fill-color:#fff] transition hover:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-500"
            >
              {t(
                "new"
              )}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-zinc-950">
          {(
            [
              "LOMBADA",
              "CODIGO_BARRAS",
            ] as const
          ).map(
            (
              tipo
            ) => (
              <button
                key={
                  tipo
                }
                type="button"
                onClick={() =>
                  setTipoAtivo(
                    tipo
                  )
                }
                className={[
                  "rounded-xl px-4 py-2 text-sm font-black transition",
                  tipoAtivo ===
                  tipo
                    ? "bg-white !text-indigo-700 shadow-sm dark:bg-slate-800 dark:!text-indigo-300"
                    : "!text-slate-600 hover:!text-slate-950 dark:!text-slate-400 dark:hover:!text-white",
                ].join(
                  " "
                )}
              >
                {tipo ===
                "LOMBADA"
                  ? t(
                      "types.spine"
                    )
                  : t(
                      "types.barcode"
                    )}
              </button>
            )
          )}
        </div>

        {carregando ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm !text-slate-500 dark:border-slate-700 dark:!text-slate-400">
            {t(
              "loading"
            )}
          </div>
        ) : erro ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/40">
            <p className="text-sm font-bold !text-red-800 dark:!text-red-200">
              {erro}
            </p>

            <button
              type="button"
              onClick={() =>
                void carregar()
              }
              className="mt-3 rounded-xl border border-red-300 px-4 py-2 text-sm font-black !text-red-800 dark:border-red-800 dark:!text-red-200"
            >
              {t(
                "retry"
              )}
            </button>
          </div>
        ) : filtrados.length ===
          0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm !text-slate-500 dark:border-slate-700 dark:!text-slate-400">
            {t(
              "empty"
            )}
          </div>
        ) : (
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {filtrados.map(
              (
                modelo
              ) => (
                <article
                  key={
                    modelo.id
                  }
                  className={[
                    "rounded-2xl border p-5 transition",
                    modelo.padrao
                      ? "border-indigo-300 bg-indigo-50/60 ring-2 ring-indigo-500/10 dark:border-indigo-700 dark:bg-indigo-950/20"
                      : "border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40",
                    !modelo.ativo
                      ? "opacity-70"
                      : "",
                  ].join(
                    " "
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide !text-slate-700 dark:bg-slate-800 dark:!text-slate-200">
                          {modelo.origem ===
                          "SISTEMA"
                            ? t(
                                "badges.system"
                              )
                            : modelo.origem ===
                              "FABRICANTE"
                            ? t(
                                "badges.manufacturer"
                              )
                            : t(
                                "badges.custom"
                              )}
                        </span>

                        {modelo.padrao ? (
                          <span className="rounded-full bg-indigo-700 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide !text-white [-webkit-text-fill-color:#fff]">
                            {t(
                              "badges.default"
                            )}
                          </span>
                        ) : null}

                        {!modelo.ativo ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide !text-amber-800 dark:bg-amber-950 dark:!text-amber-200">
                            {t(
                              "badges.inactive"
                            )}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-3 text-base font-black !text-slate-950 dark:!text-white">
                        {
                          modelo.nome
                        }
                      </h3>

                      {modelo.descricao ? (
                        <p className="mt-1 text-sm leading-6 !text-slate-600 dark:!text-slate-300">
                          {
                            modelo.descricao
                          }
                        </p>
                      ) : null}

                      {modelo.marca ||
                      modelo.codigoFabricante ? (
                        <p className="mt-2 text-xs font-bold !text-slate-500 dark:!text-slate-400">
                          {[
                            modelo.marca,
                            modelo.codigoFabricante,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " / "
                            )}
                        </p>
                      ) : null}
                    </div>

                    <div className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center dark:border-slate-700 dark:bg-slate-900">
                      <div className="text-2xl font-black !text-indigo-700 dark:!text-indigo-300">
                        {
                          modelo.capacidade
                        }
                      </div>

                      <div className="text-[10px] font-black uppercase tracking-wider !text-slate-500 dark:!text-slate-400">
                        {t(
                          "capacity"
                        )}
                      </div>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                    <div>
                      <dt className="font-black !text-slate-500 dark:!text-slate-400">
                        {t(
                          "metrics.sheet"
                        )}
                      </dt>

                      <dd className="mt-1 font-bold !text-slate-900 dark:!text-white">
                        {
                          modelo.larguraFolhaMm
                        }{" "}
                        x{" "}
                        {
                          modelo.alturaFolhaMm
                        }{" "}
                        mm
                      </dd>
                    </div>

                    <div>
                      <dt className="font-black !text-slate-500 dark:!text-slate-400">
                        {t(
                          "metrics.label"
                        )}
                      </dt>

                      <dd className="mt-1 font-bold !text-slate-900 dark:!text-white">
                        {
                          modelo.larguraEtiquetaMm
                        }{" "}
                        x{" "}
                        {
                          modelo.alturaEtiquetaMm
                        }{" "}
                        mm
                      </dd>
                    </div>

                    <div>
                      <dt className="font-black !text-slate-500 dark:!text-slate-400">
                        {t(
                          "metrics.grid"
                        )}
                      </dt>

                      <dd className="mt-1 font-bold !text-slate-900 dark:!text-white">
                        {
                          modelo.colunas
                        }{" "}
                        x{" "}
                        {
                          modelo.linhas
                        }
                      </dd>
                    </div>

                    <div>
                      <dt className="font-black !text-slate-500 dark:!text-slate-400">
                        {t(
                          "metrics.offset"
                        )}
                      </dt>

                      <dd className="mt-1 font-bold !text-slate-900 dark:!text-white">
                        X{" "}
                        {
                          modelo.deslocamentoHorizontalMm
                        }
                        {" / "}
                        Y{" "}
                        {
                          modelo.deslocamentoVerticalMm
                        }{" "}
                        mm
                      </dd>
                    </div>
                  </dl>

                  {modelo.origem ===
                  "SISTEMA" ? (
                    <p className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-xs leading-5 !text-slate-600 dark:bg-slate-900 dark:!text-slate-300">
                      {t(
                        "systemProtected"
                      )}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {!modelo.padrao &&
                    modelo.ativo ? (
                      <button
                        type="button"
                        disabled={
                          processando
                        }
                        onClick={() =>
                          void definirPadrao(
                            modelo
                          )
                        }
                        className="rounded-xl bg-indigo-700 px-3 py-2 text-xs font-black !text-white [-webkit-text-fill-color:#fff] disabled:opacity-50 dark:bg-indigo-600"
                      >
                        {t(
                          "actions.setDefault"
                        )}
                      </button>
                    ) : null}

                    {modelo.editavel ? (
                      <button
                        type="button"
                        onClick={() =>
                          abrirEditar(
                            modelo
                          )
                        }
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black !text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:!text-white"
                      >
                        {t(
                          "actions.edit"
                        )}
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() =>
                        abrirDuplicar(
                          modelo
                        )
                      }
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black !text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:!text-white"
                    >
                      {t(
                        "actions.duplicate"
                      )}
                    </button>

                    {modelo.persistido ? (
                      <button
                        type="button"
                        disabled={
                          processando
                        }
                        onClick={() =>
                          void alternarAtivo(
                            modelo
                          )
                        }
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black !text-slate-800 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:!text-white"
                      >
                        {modelo.ativo
                          ? t(
                              "actions.deactivate"
                            )
                          : t(
                              "actions.activate"
                            )}
                      </button>
                    ) : null}

                    {modelo.excluivel ? (
                      <button
                        type="button"
                        disabled={
                          processando
                        }
                        onClick={() =>
                          setExcluir(
                            modelo
                          )
                        }
                        className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-black !text-red-700 disabled:opacity-50 dark:border-red-900 dark:bg-red-950/30 dark:!text-red-300"
                      >
                        {t(
                          "actions.delete"
                        )}
                      </button>
                    ) : null}
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      {editor ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(
            evento
          ) => {
            if (
              evento.target ===
              evento.currentTarget &&
              !processando
            ) {
              setEditor(
                null
              );
            }
          }}
          onKeyDown={(
            evento
          ) => {
            if (
              evento.key ===
              "Enter"
            ) {
              evento.preventDefault();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] !text-indigo-700 dark:!text-indigo-300">
                  {t(
                    "modal.eyebrow"
                  )}
                </p>

                <h3 className="mt-1 text-xl font-black !text-slate-950 dark:!text-white">
                  {editor.modo ===
                  "EDITAR"
                    ? t(
                        "modal.editTitle"
                      )
                    : editor.modo ===
                      "DUPLICAR"
                    ? t(
                        "modal.duplicateTitle"
                      )
                    : t(
                        "modal.newTitle"
                      )}
                </h3>
              </div>

              <button
                type="button"
                disabled={
                  processando
                }
                onClick={() =>
                  setEditor(
                    null
                  )
                }
                aria-label={t(
                  "modal.close"
                )}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-xl font-black !text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:!text-slate-200 dark:hover:bg-slate-800"
              >
                {"\u00d7"}
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <div>
                <h4 className="text-sm font-black !text-slate-950 dark:!text-white">
                  {t(
                    "groups.identification"
                  )}
                </h4>

                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <Campo
                    label={t(
                      "fields.name"
                    )}
                    value={
                      editor.formulario.nome
                    }
                    onChange={(
                      valor
                    ) =>
                      alterarCampo(
                        "nome",
                        valor
                      )
                    }
                  />

                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-wide !text-slate-600 dark:!text-slate-300">
                      {t(
                        "fields.type"
                      )}
                    </span>

                    <select
                      value={
                        editor.formulario.tipo
                      }
                      onChange={(
                        evento
                      ) =>
                        alterarCampo(
                          "tipo",
                          evento.target.value as
                            TipoEtiqueta
                        )
                      }
                      className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm !text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:!text-white"
                    >
                      <option value="LOMBADA">
                        {t(
                          "types.spine"
                        )}
                      </option>

                      <option value="CODIGO_BARRAS">
                        {t(
                          "types.barcode"
                        )}
                      </option>
                    </select>
                  </label>

                  <Campo
                    label={t(
                      "fields.brand"
                    )}
                    value={
                      editor.formulario.marca
                    }
                    onChange={(
                      valor
                    ) =>
                      alterarCampo(
                        "marca",
                        valor
                      )
                    }
                  />

                  <Campo
                    label={t(
                      "fields.manufacturerCode"
                    )}
                    value={
                      editor.formulario.codigoFabricante
                    }
                    onChange={(
                      valor
                    ) =>
                      alterarCampo(
                        "codigoFabricante",
                        valor
                      )
                    }
                  />
                </div>

                <label className="mt-4 block">
                  <span className="text-xs font-black uppercase tracking-wide !text-slate-600 dark:!text-slate-300">
                    {t(
                      "fields.description"
                    )}
                  </span>

                  <textarea
                    rows={3}
                    value={
                      editor.formulario.descricao
                    }
                    onChange={(
                      evento
                    ) =>
                      alterarCampo(
                        "descricao",
                        evento.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm !text-slate-950 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:!text-white"
                  />
                </label>
              </div>

              <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
                <h4 className="text-sm font-black !text-slate-950 dark:!text-white">
                  {t(
                    "groups.sheet"
                  )}
                </h4>

                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Campo
                    label={t(
                      "fields.sheetWidth"
                    )}
                    type="number"
                    step="0.001"
                    min="0.1"
                    value={
                      editor.formulario.larguraFolhaMm
                    }
                    onChange={(
                      valor
                    ) =>
                      alterarCampo(
                        "larguraFolhaMm",
                        valor
                      )
                    }
                  />

                  <Campo
                    label={t(
                      "fields.sheetHeight"
                    )}
                    type="number"
                    step="0.001"
                    min="0.1"
                    value={
                      editor.formulario.alturaFolhaMm
                    }
                    onChange={(
                      valor
                    ) =>
                      alterarCampo(
                        "alturaFolhaMm",
                        valor
                      )
                    }
                  />

                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-wide !text-slate-600 dark:!text-slate-300">
                      {t(
                        "fields.orientation"
                      )}
                    </span>

                    <select
                      value={
                        editor.formulario.orientacao
                      }
                      onChange={(
                        evento
                      ) =>
                        alterarCampo(
                          "orientacao",
                          evento.target.value as
                            Orientacao
                        )
                      }
                      className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm !text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:!text-white"
                    >
                      <option value="RETRATO">
                        {t(
                          "orientation.portrait"
                        )}
                      </option>

                      <option value="PAISAGEM">
                        {t(
                          "orientation.landscape"
                        )}
                      </option>
                    </select>
                  </label>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {(
                    [
                      [
                        "margemSuperiorMm",
                        "fields.marginTop",
                      ],
                      [
                        "margemDireitaMm",
                        "fields.marginRight",
                      ],
                      [
                        "margemInferiorMm",
                        "fields.marginBottom",
                      ],
                      [
                        "margemEsquerdaMm",
                        "fields.marginLeft",
                      ],
                    ] as const
                  ).map(
                    (
                      [
                        campo,
                        chave,
                      ]
                    ) => (
                      <Campo
                        key={
                          campo
                        }
                        label={t(
                          chave
                        )}
                        type="number"
                        step="0.001"
                        min="0"
                        value={
                          editor.formulario[
                            campo
                          ]
                        }
                        onChange={(
                          valor
                        ) =>
                          alterarCampo(
                            campo,
                            valor
                          )
                        }
                      />
                    )
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
                <h4 className="text-sm font-black !text-slate-950 dark:!text-white">
                  {t(
                    "groups.labels"
                  )}
                </h4>

                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Campo
                    label={t(
                      "fields.labelWidth"
                    )}
                    type="number"
                    step="0.001"
                    min="0.1"
                    value={
                      editor.formulario.larguraEtiquetaMm
                    }
                    onChange={(
                      valor
                    ) =>
                      alterarCampo(
                        "larguraEtiquetaMm",
                        valor
                      )
                    }
                  />

                  <Campo
                    label={t(
                      "fields.labelHeight"
                    )}
                    type="number"
                    step="0.001"
                    min="0.1"
                    value={
                      editor.formulario.alturaEtiquetaMm
                    }
                    onChange={(
                      valor
                    ) =>
                      alterarCampo(
                        "alturaEtiquetaMm",
                        valor
                      )
                    }
                  />

                  <Campo
                    label={t(
                      "fields.columns"
                    )}
                    type="number"
                    step="1"
                    min="1"
                    value={
                      editor.formulario.colunas
                    }
                    onChange={(
                      valor
                    ) =>
                      alterarCampo(
                        "colunas",
                        valor
                      )
                    }
                  />

                  <Campo
                    label={t(
                      "fields.rows"
                    )}
                    type="number"
                    step="1"
                    min="1"
                    value={
                      editor.formulario.linhas
                    }
                    onChange={(
                      valor
                    ) =>
                      alterarCampo(
                        "linhas",
                        valor
                      )
                    }
                  />

                  <Campo
                    label={t(
                      "fields.horizontalGap"
                    )}
                    type="number"
                    step="0.001"
                    min="0"
                    value={
                      editor.formulario.espacoHorizontalMm
                    }
                    onChange={(
                      valor
                    ) =>
                      alterarCampo(
                        "espacoHorizontalMm",
                        valor
                      )
                    }
                  />

                  <Campo
                    label={t(
                      "fields.verticalGap"
                    )}
                    type="number"
                    step="0.001"
                    min="0"
                    value={
                      editor.formulario.espacoVerticalMm
                    }
                    onChange={(
                      valor
                    ) =>
                      alterarCampo(
                        "espacoVerticalMm",
                        valor
                      )
                    }
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
                <h4 className="text-sm font-black !text-slate-950 dark:!text-white">
                  {t(
                    "groups.calibration"
                  )}
                </h4>

                <p className="mt-1 text-xs leading-5 !text-slate-500 dark:!text-slate-400">
                  {t(
                    "calibrationHelp"
                  )}
                </p>

                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <Campo
                    label={t(
                      "fields.offsetX"
                    )}
                    type="number"
                    step="0.1"
                    value={
                      editor.formulario.deslocamentoHorizontalMm
                    }
                    onChange={(
                      valor
                    ) =>
                      alterarCampo(
                        "deslocamentoHorizontalMm",
                        valor
                      )
                    }
                  />

                  <Campo
                    label={t(
                      "fields.offsetY"
                    )}
                    type="number"
                    step="0.1"
                    value={
                      editor.formulario.deslocamentoVerticalMm
                    }
                    onChange={(
                      valor
                    ) =>
                      alterarCampo(
                        "deslocamentoVerticalMm",
                        valor
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2 dark:border-slate-800">
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <input
                    type="checkbox"
                    checked={
                      editor.formulario.ativo
                    }
                    onChange={(
                      evento
                    ) =>
                      alterarCampo(
                        "ativo",
                        evento.target.checked
                      )
                    }
                    className="mt-1 h-4 w-4"
                  />

                  <span>
                    <span className="block text-sm font-black !text-slate-900 dark:!text-white">
                      {t(
                        "fields.active"
                      )}
                    </span>

                    <span className="mt-1 block text-xs leading-5 !text-slate-500 dark:!text-slate-400">
                      {t(
                        "fields.activeHelp"
                      )}
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <input
                    type="checkbox"
                    checked={
                      editor.formulario.padrao
                    }
                    onChange={(
                      evento
                    ) =>
                      alterarCampo(
                        "padrao",
                        evento.target.checked
                      )
                    }
                    className="mt-1 h-4 w-4"
                  />

                  <span>
                    <span className="block text-sm font-black !text-slate-900 dark:!text-white">
                      {t(
                        "fields.default"
                      )}
                    </span>

                    <span className="mt-1 block text-xs leading-5 !text-slate-500 dark:!text-slate-400">
                      {t(
                        "fields.defaultHelp"
                      )}
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white/95 p-5 backdrop-blur sm:flex-row sm:justify-end dark:border-slate-800 dark:bg-slate-900/95">
              <button
                type="button"
                disabled={
                  processando
                }
                onClick={() =>
                  setEditor(
                    null
                  )
                }
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-black !text-slate-800 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:!text-white"
              >
                {t(
                  "modal.cancel"
                )}
              </button>

              <button
                type="button"
                disabled={
                  processando
                }
                onClick={() =>
                  void salvar()
                }
                className="min-h-11 rounded-xl bg-indigo-700 px-6 text-sm font-black !text-white [-webkit-text-fill-color:#fff] disabled:opacity-50 dark:bg-indigo-600"
              >
                {processando
                  ? t(
                      "modal.saving"
                    )
                  : t(
                      "modal.save"
                    )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {excluir ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <h3 className="text-xl font-black !text-slate-950 dark:!text-white">
              {t(
                "delete.title"
              )}
            </h3>

            <p className="mt-2 text-sm leading-6 !text-slate-600 dark:!text-slate-300">
              {t(
                "delete.description",
                {
                  name:
                    excluir.nome,
                }
              )}
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={
                  processando
                }
                onClick={() =>
                  setExcluir(
                    null
                  )
                }
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-black !text-slate-800 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:!text-white"
              >
                {t(
                  "delete.cancel"
                )}
              </button>

              <button
                type="button"
                disabled={
                  processando
                }
                onClick={() =>
                  void confirmarExclusao()
                }
                className="min-h-11 rounded-xl bg-red-700 px-5 text-sm font-black !text-white [-webkit-text-fill-color:#fff] disabled:opacity-50 dark:bg-red-600"
              >
                {processando
                  ? t(
                      "delete.deleting"
                    )
                  : t(
                      "delete.confirm"
                    )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-[120] max-w-md rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold !text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:!text-white"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
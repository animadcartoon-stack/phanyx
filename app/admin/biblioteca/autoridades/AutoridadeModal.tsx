"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useTranslations } from "next-intl";

type TipoVariante =
  | "VARIANTE"
  | "PSEUDONIMO"
  | "NOME_ANTERIOR"
  | "TRANSLITERACAO"
  | "OUTRO";

type VarianteApi = {
  id: number;
  nome: string;
  tipo: TipoVariante;
  idioma: string | null;
  observacao: string | null;
  ativo: boolean;
};

type PessoaApi = {
  id: number;
  nome: string;
  nomeOrdenacao: string | null;
  biografia: string | null;
  nacionalidade: string | null;
  dataNascimento: string | null;
  dataFalecimento: string | null;
  fotoUrl: string | null;
  siteUrl: string | null;
  orcid: string | null;
  viaf: string | null;
  isni: string | null;
  wikidataId: string | null;
  lccn: string | null;
  notaAutoridade: string | null;
  ativo: boolean;
  variantes: VarianteApi[];
};

type VarianteFormulario = {
  chave: string;
  nome: string;
  tipo: TipoVariante;
  idioma: string;
  observacao: string;
};

type Formulario = {
  nome: string;
  nomeOrdenacao: string;
  nacionalidade: string;
  dataNascimento: string;
  dataFalecimento: string;
  biografia: string;
  fotoUrl: string;
  siteUrl: string;
  orcid: string;
  viaf: string;
  isni: string;
  wikidataId: string;
  lccn: string;
  notaAutoridade: string;
  ativo: boolean;
  variantes: VarianteFormulario[];
};

type Props = {
  aberto: boolean;
  autorId: number | null;
  onClose: () => void;
  onSaved: (mensagem: string) => void;
};

const formularioInicial: Formulario = {
  nome: "",
  nomeOrdenacao: "",
  nacionalidade: "",
  dataNascimento: "",
  dataFalecimento: "",
  biografia: "",
  fotoUrl: "",
  siteUrl: "",
  orcid: "",
  viaf: "",
  isni: "",
  wikidataId: "",
  lccn: "",
  notaAutoridade: "",
  ativo: true,
  variantes: [],
};

const campoClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900";

const rotuloClass =
  "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200";

function valorData(
  valor: string | null
) {
  if (!valor) return "";

  return valor.slice(
    0,
    10
  );
}

function opcional(
  valor: string
) {
  const texto =
    valor.trim();

  return texto || null;
}

function chaveVariante() {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

function novaVariante(): VarianteFormulario {
  return {
    chave: chaveVariante(),
    nome: "",
    tipo: "VARIANTE",
    idioma: "",
    observacao: "",
  };
}

export default function AutoridadeModal({
  aberto,
  autorId,
  onClose,
  onSaved,
}: Props) {
  const t =
    useTranslations(
      "AdminLibraryAuthorities"
    );

  const [
    formulario,
    setFormulario,
  ] =
    useState<Formulario>(
      formularioInicial
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(false);

  const [
    salvando,
    setSalvando,
  ] =
    useState(false);

  const [
    erro,
    setErro,
  ] =
    useState("");

  const editando =
    autorId !== null;

  useEffect(() => {
    if (!aberto) return;

    setErro("");

    if (!editando) {
      setFormulario(
        formularioInicial
      );

      setCarregando(false);
      return;
    }

    let cancelado = false;

    async function carregar() {
      setCarregando(true);

      try {
        const resposta =
          await fetch(
            `/api/admin/biblioteca/autoridades/pessoas/${autorId}`,
            {
              cache:
                "no-store",
            }
          );

        const corpo =
          (await resposta.json()) as {
            ok?: boolean;
            pessoa?: PessoaApi;
          };

        if (
          !resposta.ok ||
          corpo.ok !== true ||
          !corpo.pessoa
        ) {
          throw new Error();
        }

        if (cancelado) return;

        const pessoa =
          corpo.pessoa;

        setFormulario({
          nome:
            pessoa.nome,

          nomeOrdenacao:
            pessoa.nomeOrdenacao ??
            "",

          nacionalidade:
            pessoa.nacionalidade ??
            "",

          dataNascimento:
            valorData(
              pessoa.dataNascimento
            ),

          dataFalecimento:
            valorData(
              pessoa.dataFalecimento
            ),

          biografia:
            pessoa.biografia ??
            "",

          fotoUrl:
            pessoa.fotoUrl ??
            "",

          siteUrl:
            pessoa.siteUrl ??
            "",

          orcid:
            pessoa.orcid ??
            "",

          viaf:
            pessoa.viaf ??
            "",

          isni:
            pessoa.isni ??
            "",

          wikidataId:
            pessoa.wikidataId ??
            "",

          lccn:
            pessoa.lccn ??
            "",

          notaAutoridade:
            pessoa.notaAutoridade ??
            "",

          ativo:
            pessoa.ativo,

          /*
            Variantes históricas inativas
            não entram no formulário.
            Assim não são reativadas
            acidentalmente no PATCH.
          */
          variantes:
            pessoa.variantes
              .filter(
                (variante) =>
                  variante.ativo
              )
              .map(
                (variante) => ({
                  chave:
                    `api-${variante.id}`,

                  nome:
                    variante.nome,

                  tipo:
                    variante.tipo,

                  idioma:
                    variante.idioma ??
                    "",

                  observacao:
                    variante.observacao ??
                    "",
                })
              ),
        });
      } catch {
        if (!cancelado) {
          setErro(
            t(
              "messages.loadOneError"
            )
          );
        }
      } finally {
        if (!cancelado) {
          setCarregando(
            false
          );
        }
      }
    }

    void carregar();

    return () => {
      cancelado = true;
    };
  }, [
    aberto,
    autorId,
    editando,
    t,
  ]);

  useEffect(() => {
    if (!aberto) return;

    function aoTeclar(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
          "Escape" &&
        !salvando
      ) {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      aoTeclar
    );

    return () =>
      window.removeEventListener(
        "keydown",
        aoTeclar
      );
  }, [
    aberto,
    salvando,
    onClose,
  ]);

  function alterar<
    K extends keyof Formulario
  >(
    campo: K,
    valor: Formulario[K]
  ) {
    setFormulario(
      (atual) => ({
        ...atual,
        [campo]:
          valor,
      })
    );
  }

  function adicionarVariante() {
    alterar(
      "variantes",
      [
        ...formulario.variantes,
        novaVariante(),
      ]
    );
  }

  function removerVariante(
    chave: string
  ) {
    alterar(
      "variantes",
      formulario.variantes.filter(
        (variante) =>
          variante.chave !==
          chave
      )
    );
  }

  function alterarVariante<
    K extends
      keyof Omit<
        VarianteFormulario,
        "chave"
      >
  >(
    chave: string,
    campo: K,
    valor:
      VarianteFormulario[K]
  ) {
    alterar(
      "variantes",
      formulario.variantes.map(
        (variante) =>
          variante.chave ===
          chave
            ? {
                ...variante,
                [campo]:
                  valor,
              }
            : variante
      )
    );
  }

  async function salvar(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (salvando) return;

    if (
      !formulario.nome.trim()
    ) {
      setErro(
        t(
          "messages.requiredName"
        )
      );

      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const variantes =
        formulario.variantes
          .filter(
            (variante) =>
              variante.nome
                .trim()
          )
          .map(
            (variante) => ({
              nome:
                variante.nome.trim(),

              tipo:
                variante.tipo,

              idioma:
                opcional(
                  variante.idioma
                ),

              observacao:
                opcional(
                  variante.observacao
                ),
            })
          );

      const corpo = {
        nome:
          formulario.nome.trim(),

        nomeOrdenacao:
          opcional(
            formulario.nomeOrdenacao
          ),

        nacionalidade:
          opcional(
            formulario.nacionalidade
          ),

        dataNascimento:
          opcional(
            formulario.dataNascimento
          ),

        dataFalecimento:
          opcional(
            formulario.dataFalecimento
          ),

        biografia:
          opcional(
            formulario.biografia
          ),

        fotoUrl:
          opcional(
            formulario.fotoUrl
          ),

        siteUrl:
          opcional(
            formulario.siteUrl
          ),

        orcid:
          opcional(
            formulario.orcid
          ),

        viaf:
          opcional(
            formulario.viaf
          ),

        isni:
          opcional(
            formulario.isni
          ),

        wikidataId:
          opcional(
            formulario.wikidataId
          ),

        lccn:
          opcional(
            formulario.lccn
          ),

        notaAutoridade:
          opcional(
            formulario.notaAutoridade
          ),

        variantes,

        ...(editando
          ? {
              ativo:
                formulario.ativo,
            }
          : {}),
      };

      const resposta =
        await fetch(
          editando
            ? `/api/admin/biblioteca/autoridades/pessoas/${autorId}`
            : "/api/admin/biblioteca/autoridades/pessoas",
          {
            method:
              editando
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

      const respostaJson =
        (await resposta.json()) as {
          ok?: boolean;
          error?: string;
          codigo?: string;
        };

      if (
        !resposta.ok ||
        respostaJson.ok !== true
      ) {
        setErro(
          respostaJson.error ||
            t(
              "messages.saveError"
            )
        );

        return;
      }

      onSaved(
        editando
          ? t(
              "messages.updated"
            )
          : t(
              "messages.created"
            )
      );
    } catch {
      setErro(
        t(
          "messages.saveError"
        )
      );
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/65 p-3 sm:p-6"
      role="presentation"
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
            event.currentTarget &&
          !salvando
        ) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-autoridade"
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <h2
              id="titulo-modal-autoridade"
              className="text-xl font-bold text-slate-950 dark:text-white"
            >
              {editando
                ? t(
                    "editTitle"
                  )
                : t(
                    "createTitle"
                  )}
            </h2>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              salvando
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t(
              "close"
            )}
          </button>
        </header>

        {carregando ? (
          <div className="p-10 text-center text-sm text-slate-600 dark:text-slate-300">
            {t(
              "loading"
            )}
          </div>
        ) : (
          <form
            onSubmit={
              salvar
            }
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <div className="space-y-7">
                <section>
                  <h3 className="mb-4 text-base font-bold text-slate-950 dark:text-white">
                    {t(
                      "basicData"
                    )}
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        className={
                          rotuloClass
                        }
                      >
                        {t(
                          "fields.name"
                        )}{" "}
                        *
                      </label>

                      <input
                        className={
                          campoClass
                        }
                        value={
                          formulario.nome
                        }
                        onChange={(
                          event
                        ) =>
                          alterar(
                            "nome",
                            event
                              .target
                              .value
                          )
                        }
                        placeholder={t(
                          "placeholders.name"
                        )}
                        maxLength={
                          240
                        }
                      />
                    </div>

                    <div>
                      <label
                        className={
                          rotuloClass
                        }
                      >
                        {t(
                          "fields.sortName"
                        )}
                      </label>

                      <input
                        className={
                          campoClass
                        }
                        value={
                          formulario.nomeOrdenacao
                        }
                        onChange={(
                          event
                        ) =>
                          alterar(
                            "nomeOrdenacao",
                            event
                              .target
                              .value
                          )
                        }
                        placeholder={t(
                          "placeholders.sortName"
                        )}
                        maxLength={
                          240
                        }
                      />
                    </div>

                    <div>
                      <label
                        className={
                          rotuloClass
                        }
                      >
                        {t(
                          "fields.nationality"
                        )}
                      </label>

                      <input
                        className={
                          campoClass
                        }
                        value={
                          formulario.nacionalidade
                        }
                        onChange={(
                          event
                        ) =>
                          alterar(
                            "nacionalidade",
                            event
                              .target
                              .value
                          )
                        }
                        placeholder={t(
                          "placeholders.nationality"
                        )}
                        maxLength={
                          120
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          className={
                            rotuloClass
                          }
                        >
                          {t(
                            "fields.birthDate"
                          )}
                        </label>

                        <input
                          type="date"
                          className={
                            campoClass
                          }
                          value={
                            formulario.dataNascimento
                          }
                          onChange={(
                            event
                          ) =>
                            alterar(
                              "dataNascimento",
                              event
                                .target
                                .value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label
                          className={
                            rotuloClass
                          }
                        >
                          {t(
                            "fields.deathDate"
                          )}
                        </label>

                        <input
                          type="date"
                          className={
                            campoClass
                          }
                          value={
                            formulario.dataFalecimento
                          }
                          onChange={(
                            event
                          ) =>
                            alterar(
                              "dataFalecimento",
                              event
                                .target
                                .value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        className={
                          rotuloClass
                        }
                      >
                        {t(
                          "fields.photoUrl"
                        )}
                      </label>

                      <input
                        type="url"
                        className={
                          campoClass
                        }
                        value={
                          formulario.fotoUrl
                        }
                        onChange={(
                          event
                        ) =>
                          alterar(
                            "fotoUrl",
                            event
                              .target
                              .value
                          )
                        }
                        placeholder={t(
                          "placeholders.photoUrl"
                        )}
                      />
                    </div>

                    <div>
                      <label
                        className={
                          rotuloClass
                        }
                      >
                        {t(
                          "fields.siteUrl"
                        )}
                      </label>

                      <input
                        type="url"
                        className={
                          campoClass
                        }
                        value={
                          formulario.siteUrl
                        }
                        onChange={(
                          event
                        ) =>
                          alterar(
                            "siteUrl",
                            event
                              .target
                              .value
                          )
                        }
                        placeholder={t(
                          "placeholders.siteUrl"
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        className={
                          rotuloClass
                        }
                      >
                        {t(
                          "fields.biography"
                        )}
                      </label>

                      <textarea
                        className={`${campoClass} min-h-24 resize-y`}
                        value={
                          formulario.biografia
                        }
                        onChange={(
                          event
                        ) =>
                          alterar(
                            "biografia",
                            event
                              .target
                              .value
                          )
                        }
                        placeholder={t(
                          "placeholders.biography"
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        className={
                          rotuloClass
                        }
                      >
                        {t(
                          "fields.authorityNote"
                        )}
                      </label>

                      <textarea
                        className={`${campoClass} min-h-24 resize-y`}
                        value={
                          formulario.notaAutoridade
                        }
                        onChange={(
                          event
                        ) =>
                          alterar(
                            "notaAutoridade",
                            event
                              .target
                              .value
                          )
                        }
                        placeholder={t(
                          "placeholders.authorityNote"
                        )}
                      />
                    </div>

                    {editando && (
                      <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200 md:col-span-2">
                        <input
                          type="checkbox"
                          checked={
                            formulario.ativo
                          }
                          onChange={(
                            event
                          ) =>
                            alterar(
                              "ativo",
                              event
                                .target
                                .checked
                            )
                          }
                          className="h-4 w-4"
                        />

                        {t(
                          "fields.active"
                        )}
                      </label>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="mb-4 text-base font-bold text-slate-950 dark:text-white">
                    {t(
                      "identifiersSection"
                    )}
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {(
                      [
                        [
                          "orcid",
                          "orcid",
                        ],
                        [
                          "viaf",
                          "viaf",
                        ],
                        [
                          "isni",
                          "isni",
                        ],
                        [
                          "wikidataId",
                          "wikidata",
                        ],
                        [
                          "lccn",
                          "lccn",
                        ],
                      ] as const
                    ).map(
                      ([
                        campo,
                        chave,
                      ]) => (
                        <div
                          key={
                            campo
                          }
                        >
                          <label
                            className={
                              rotuloClass
                            }
                          >
                            {t(
                              `fields.${chave}`
                            )}
                          </label>

                          <input
                            className={
                              campoClass
                            }
                            value={
                              formulario[
                                campo
                              ]
                            }
                            onChange={(
                              event
                            ) =>
                              alterar(
                                campo,
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder={t(
                              `placeholders.${chave}`
                            )}
                          />
                        </div>
                      )
                    )}
                  </div>
                </section>

                <section>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-base font-bold text-slate-950 dark:text-white">
                      {t(
                        "variantsSection"
                      )}
                    </h3>

                    <button
                      type="button"
                      onClick={
                        adicionarVariante
                      }
                      className="rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
                    >
                      +{" "}
                      {t(
                        "addVariant"
                      )}
                    </button>
                  </div>

                  {formulario
                    .variantes
                    .length ===
                  0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t(
                        "noVariants"
                      )}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {formulario.variantes.map(
                        (
                          variante
                        ) => (
                          <div
                            key={
                              variante.chave
                            }
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950"
                          >
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                              <div className="xl:col-span-2">
                                <label
                                  className={
                                    rotuloClass
                                  }
                                >
                                  {t(
                                    "fields.variantName"
                                  )}
                                </label>

                                <input
                                  className={
                                    campoClass
                                  }
                                  value={
                                    variante.nome
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    alterarVariante(
                                      variante.chave,
                                      "nome",
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  placeholder={t(
                                    "placeholders.variantName"
                                  )}
                                  maxLength={
                                    240
                                  }
                                />
                              </div>

                              <div>
                                <label
                                  className={
                                    rotuloClass
                                  }
                                >
                                  {t(
                                    "fields.variantType"
                                  )}
                                </label>

                                <select
                                  className={
                                    campoClass
                                  }
                                  value={
                                    variante.tipo
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    alterarVariante(
                                      variante.chave,
                                      "tipo",
                                      event
                                        .target
                                        .value as
                                        TipoVariante
                                    )
                                  }
                                >
                                  {(
                                    [
                                      "VARIANTE",
                                      "PSEUDONIMO",
                                      "NOME_ANTERIOR",
                                      "TRANSLITERACAO",
                                      "OUTRO",
                                    ] as const
                                  ).map(
                                    (
                                      tipo
                                    ) => (
                                      <option
                                        key={
                                          tipo
                                        }
                                        value={
                                          tipo
                                        }
                                      >
                                        {t(
                                          `variantType.${tipo}`
                                        )}
                                      </option>
                                    )
                                  )}
                                </select>
                              </div>

                              <div>
                                <label
                                  className={
                                    rotuloClass
                                  }
                                >
                                  {t(
                                    "fields.variantLanguage"
                                  )}
                                </label>

                                <input
                                  className={
                                    campoClass
                                  }
                                  value={
                                    variante.idioma
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    alterarVariante(
                                      variante.chave,
                                      "idioma",
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  placeholder={t(
                                    "placeholders.variantLanguage"
                                  )}
                                  maxLength={
                                    30
                                  }
                                />
                              </div>

                              <div className="md:col-span-2 xl:col-span-3">
                                <label
                                  className={
                                    rotuloClass
                                  }
                                >
                                  {t(
                                    "fields.variantObservation"
                                  )}
                                </label>

                                <input
                                  className={
                                    campoClass
                                  }
                                  value={
                                    variante.observacao
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    alterarVariante(
                                      variante.chave,
                                      "observacao",
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  placeholder={t(
                                    "placeholders.variantObservation"
                                  )}
                                />
                              </div>

                              <div className="flex items-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    removerVariante(
                                      variante.chave
                                    )
                                  }
                                  className="w-full rounded-xl border border-red-300 bg-white px-3 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-300"
                                >
                                  {t(
                                    "removeVariant"
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </section>

                {erro && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                  >
                    {erro}
                  </div>
                )}
              </div>
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-950 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  onClose
                }
                disabled={
                  salvando
                }
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              >
                {t(
                  "cancel"
                )}
              </button>

              <button
                type="submit"
                disabled={
                  salvando ||
                  carregando
                }
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {salvando
                  ? t(
                      "saving"
                    )
                  : t(
                      "save"
                    )}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}

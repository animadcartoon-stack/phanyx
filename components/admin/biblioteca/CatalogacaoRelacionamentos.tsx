"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useTranslations } from "next-intl";

type AutorVinculado = {
  funcao: string;
  ordem: number;
  autor: {
    id: number;
    nome: string;
    nomeOrdenacao: string | null;
  };
};

type CategoriaVinculada = {
  principal: boolean;
  categoria: {
    id: number;
    nome: string;
    slug: string;
    cor: string | null;
    icone: string | null;
  };
};

type EditoraVinculada = {
  id: number;
  nome: string;
} | null;

type AutorReferencia = {
  id: number;
  nome: string;
  nomeOrdenacao: string | null;
  orcid: string | null;
};

type EditoraReferencia = {
  id: number;
  nome: string;
  cidade: string | null;
  estado: string | null;
  pais: string | null;
};

type CategoriaReferencia = {
  id: number;
  nome: string;
  slug: string;
  cor: string | null;
  icone: string | null;
  categoriaPaiId: number | null;
};

type VinculoAutor = {
  autorId: number;
  funcao: string;
  ordem: number;
};

type VinculoCategoria = {
  categoriaId: number;
  principal: boolean;
};

type Props = {
  itemId: number;
  podeEditar: boolean;
  impersonacao: boolean;
  editora: EditoraVinculada;
  autores: AutorVinculado[];
  categorias: CategoriaVinculada[];
  onSaved: () => void;
};

const FUNCOES_AUTORIA = [
  "AUTOR",
  "COAUTOR",
  "ORGANIZADOR",
  "EDITOR",
  "TRADUTOR",
  "ORIENTADOR",
  "COLABORADOR",
] as const;

type FuncaoAutoria =
  (typeof FUNCOES_AUTORIA)[number];

type TipoReferencia =
  | "AUTOR"
  | "EDITORA"
  | "CATEGORIA";

async function lerResposta(
  resposta: Response,
) {
  const texto =
    await resposta.text();

  if (!texto) {
    return {};
  }

  try {
    return JSON.parse(texto) as Record<
      string,
      unknown
    >;
  } catch {
    return {};
  }
}

export default function CatalogacaoRelacionamentos({
  itemId,
  podeEditar,
  impersonacao,
  editora,
  autores,
  categorias,
  onSaved,
}: Props) {
  const t =
    useTranslations(
      "AdminLibraryItemUi",
    );

  const [
    referencias,
    setReferencias,
  ] = useState<{
    autores: AutorReferencia[];
    editoras: EditoraReferencia[];
    categorias: CategoriaReferencia[];
  }>({
    autores: [],
    editoras: [],
    categorias: [],
  });

  const [
    editoraId,
    setEditoraId,
  ] = useState(
    editora
      ? String(editora.id)
      : "",
  );

  const [
    autoresSelecionados,
    setAutoresSelecionados,
  ] = useState<VinculoAutor[]>(
    autores.map(
      (
        vinculo,
        indice,
      ) => ({
        autorId:
          vinculo.autor.id,
        funcao:
          vinculo.funcao,
        ordem:
          Number.isInteger(
            vinculo.ordem,
          )
            ? vinculo.ordem
            : indice,
      }),
    ),
  );

  const [
    categoriasSelecionadas,
    setCategoriasSelecionadas,
  ] = useState<
    VinculoCategoria[]
  >(
    categorias.map(
      (vinculo) => ({
        categoriaId:
          vinculo.categoria.id,
        principal:
          vinculo.principal,
      }),
    ),
  );

  const [
    autorAdicionar,
    setAutorAdicionar,
  ] = useState("");

  const [
    categoriaAdicionar,
    setCategoriaAdicionar,
  ] = useState("");

  const [
    carregando,
    setCarregando,
  ] = useState(false);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    mensagem,
    setMensagem,
  ] = useState<{
    tipo: "sucesso" | "erro";
    texto: string;
  } | null>(null);

  const [
    mostrarCriacao,
    setMostrarCriacao,
  ] = useState(false);

  const [
    tipoReferencia,
    setTipoReferencia,
  ] = useState<TipoReferencia>(
    "AUTOR",
  );

  const [
    nomeReferencia,
    setNomeReferencia,
  ] = useState("");

  const [
    nomeOrdenacao,
    setNomeOrdenacao,
  ] = useState("");

  const [
    orcid,
    setOrcid,
  ] = useState("");

  const [
    criando,
    setCriando,
  ] = useState(false);

  useEffect(() => {
    setEditoraId(
      editora
        ? String(editora.id)
        : "",
    );

    setAutoresSelecionados(
      autores.map(
        (
          vinculo,
          indice,
        ) => ({
          autorId:
            vinculo.autor.id,
          funcao:
            vinculo.funcao,
          ordem:
            Number.isInteger(
              vinculo.ordem,
            )
              ? vinculo.ordem
              : indice,
        }),
      ),
    );

    setCategoriasSelecionadas(
      categorias.map(
        (vinculo) => ({
          categoriaId:
            vinculo.categoria.id,
          principal:
            vinculo.principal,
        }),
      ),
    );
  }, [
    itemId,
    editora,
    autores,
    categorias,
  ]);

  const carregar =
    useCallback(
      async (
        signal?: AbortSignal,
      ) => {
        setCarregando(true);

        try {
          const resposta =
            await fetch(
              "/api/admin/biblioteca/catalogacao/referencias",
              {
                method: "GET",
                credentials:
                  "include",
                cache:
                  "no-store",
                signal,
              },
            );

          const dados =
            await lerResposta(
              resposta,
            );

          if (!resposta.ok) {
            throw new Error(
              String(
                dados.error ||
                  t(
                    "loadBibliographicReferencesError",
                  ),
              ),
            );
          }

          setReferencias({
            autores:
              Array.isArray(
                dados.autores,
              )
                ? (dados.autores as AutorReferencia[])
                : [],

            editoras:
              Array.isArray(
                dados.editoras,
              )
                ? (dados.editoras as EditoraReferencia[])
                : [],

            categorias:
              Array.isArray(
                dados.categorias,
              )
                ? (dados.categorias as CategoriaReferencia[])
                : [],
          });
        } catch (erro) {
          if (
            erro instanceof
              DOMException &&
            erro.name ===
              "AbortError"
          ) {
            return;
          }

          setMensagem({
            tipo: "erro",
            texto:
              erro instanceof Error
                ? erro.message
                : t(
                    "loadBibliographicReferencesError",
                  ),
          });
        } finally {
          if (!signal?.aborted) {
            setCarregando(false);
          }
        }
      },
      [t],
    );

  useEffect(() => {
    const controlador =
      new AbortController();

    void carregar(
      controlador.signal,
    );

    return () =>
      controlador.abort();
  }, [carregar]);

  function rotuloFuncao(
    funcao: string,
  ) {
    switch (funcao) {
      case "AUTOR":
        return t(
          "roleAuthor",
        );
      case "COAUTOR":
        return t(
          "roleCoauthor",
        );
      case "ORGANIZADOR":
        return t(
          "roleOrganizer",
        );
      case "EDITOR":
        return t(
          "roleEditor",
        );
      case "TRADUTOR":
        return t(
          "roleTranslator",
        );
      case "ORIENTADOR":
        return t(
          "roleSupervisor",
        );
      case "COLABORADOR":
        return t(
          "roleCollaborator",
        );
      default:
        return funcao;
    }
  }

  function adicionarAutor() {
    const autorId =
      Number(
        autorAdicionar,
      );

    if (
      !Number.isInteger(
        autorId,
      ) ||
      autorId <= 0
    ) {
      return;
    }

    if (
      autoresSelecionados.some(
        (vinculo) =>
          vinculo.autorId ===
          autorId,
      )
    ) {
      return;
    }

    setAutoresSelecionados(
      (atual) => [
        ...atual,
        {
          autorId,
          funcao:
            "AUTOR",
          ordem:
            atual.length,
        },
      ],
    );

    setAutorAdicionar("");
  }

  function removerAutor(
    autorId: number,
  ) {
    setAutoresSelecionados(
      (atual) =>
        atual
          .filter(
            (vinculo) =>
              vinculo.autorId !==
              autorId,
          )
          .map(
            (
              vinculo,
              indice,
            ) => ({
              ...vinculo,
              ordem:
                indice,
            }),
          ),
    );
  }

  function alterarFuncao(
    autorId: number,
    funcao: string,
  ) {
    setAutoresSelecionados(
      (atual) =>
        atual.map(
          (vinculo) =>
            vinculo.autorId ===
            autorId
              ? {
                  ...vinculo,
                  funcao,
                }
              : vinculo,
        ),
    );
  }

  function moverAutor(
    indice: number,
    direcao: -1 | 1,
  ) {
    setAutoresSelecionados(
      (atual) => {
        const destino =
          indice + direcao;

        if (
          destino < 0 ||
          destino >=
            atual.length
        ) {
          return atual;
        }

        const copia =
          [...atual];

        [
          copia[indice],
          copia[destino],
        ] = [
          copia[destino],
          copia[indice],
        ];

        return copia.map(
          (
            vinculo,
            posicao,
          ) => ({
            ...vinculo,
            ordem:
              posicao,
          }),
        );
      },
    );
  }

  function adicionarCategoria() {
    const categoriaId =
      Number(
        categoriaAdicionar,
      );

    if (
      !Number.isInteger(
        categoriaId,
      ) ||
      categoriaId <= 0
    ) {
      return;
    }

    if (
      categoriasSelecionadas.some(
        (vinculo) =>
          vinculo.categoriaId ===
          categoriaId,
      )
    ) {
      return;
    }

    setCategoriasSelecionadas(
      (atual) => [
        ...atual,
        {
          categoriaId,
          principal:
            atual.length === 0,
        },
      ],
    );

    setCategoriaAdicionar("");
  }

  function removerCategoria(
    categoriaId: number,
  ) {
    setCategoriasSelecionadas(
      (atual) => {
        const removida =
          atual.find(
            (vinculo) =>
              vinculo.categoriaId ===
              categoriaId,
          );

        const restantes =
          atual.filter(
            (vinculo) =>
              vinculo.categoriaId !==
              categoriaId,
          );

        if (
          removida?.principal &&
          restantes.length
        ) {
          return restantes.map(
            (
              vinculo,
              indice,
            ) => ({
              ...vinculo,
              principal:
                indice === 0,
            }),
          );
        }

        return restantes;
      },
    );
  }

  function marcarPrincipal(
    categoriaId: number,
  ) {
    setCategoriasSelecionadas(
      (atual) =>
        atual.map(
          (vinculo) => ({
            ...vinculo,
            principal:
              vinculo.categoriaId ===
              categoriaId,
          }),
        ),
    );
  }

  async function salvar() {
    if (
      salvando ||
      !podeEditar ||
      impersonacao
    ) {
      return;
    }

    setSalvando(true);
    setMensagem(null);

    try {
      const resposta =
        await fetch(
          "/api/admin/biblioteca/acervo/" +
            itemId +
            "/relacionamentos",
          {
            method: "PATCH",
            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                editoraId:
                  editoraId
                    ? Number(
                        editoraId,
                      )
                    : null,

                autores:
                  autoresSelecionados.map(
                    (
                      vinculo,
                      indice,
                    ) => ({
                      ...vinculo,
                      ordem:
                        indice,
                    }),
                  ),

                categorias:
                  categoriasSelecionadas,
              }),
          },
        );

      const dados =
        await lerResposta(
          resposta,
        );

      if (!resposta.ok) {
        throw new Error(
          String(
            dados.error ||
              t(
                "saveBibliographicRelationshipsError",
              ),
          ),
        );
      }

      setMensagem({
        tipo:
          "sucesso",
        texto:
          String(
            dados.mensagem ||
              t(
                "saveBibliographicRelationshipsSuccess",
              ),
          ),
      });

      onSaved();
    } catch (erro) {
      setMensagem({
        tipo: "erro",
        texto:
          erro instanceof Error
            ? erro.message
            : t(
                "saveBibliographicRelationshipsError",
              ),
      });
    } finally {
      setSalvando(false);
    }
  }

  async function criarReferencia() {
    if (
      criando ||
      !nomeReferencia.trim() ||
      !podeEditar ||
      impersonacao
    ) {
      return;
    }

    setCriando(true);
    setMensagem(null);

    try {
      const resposta =
        await fetch(
          "/api/admin/biblioteca/catalogacao/referencias",
          {
            method: "POST",
            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                tipo:
                  tipoReferencia,

                nome:
                  nomeReferencia,

                nomeOrdenacao:
                  tipoReferencia ===
                  "AUTOR"
                    ? nomeOrdenacao
                    : undefined,

                orcid:
                  tipoReferencia ===
                  "AUTOR"
                    ? orcid
                    : undefined,
              }),
          },
        );

      const dados =
        await lerResposta(
          resposta,
        );

      const registro =
        dados.registro as
          | {
              id: number;
              nome: string;
            }
          | undefined;

      if (
        !resposta.ok ||
        !registro
      ) {
        throw new Error(
          String(
            dados.error ||
              t(
                "createBibliographicReferenceError",
              ),
          ),
        );
      }

      await carregar();

      if (
        tipoReferencia ===
        "EDITORA"
      ) {
        setEditoraId(
          String(
            registro.id,
          ),
        );
      }

      if (
        tipoReferencia ===
        "AUTOR"
      ) {
        setAutoresSelecionados(
          (atual) =>
            atual.some(
              (vinculo) =>
                vinculo.autorId ===
                registro.id,
            )
              ? atual
              : [
                  ...atual,
                  {
                    autorId:
                      registro.id,
                    funcao:
                      "AUTOR",
                    ordem:
                      atual.length,
                  },
                ],
        );
      }

      if (
        tipoReferencia ===
        "CATEGORIA"
      ) {
        setCategoriasSelecionadas(
          (atual) =>
            atual.some(
              (vinculo) =>
                vinculo.categoriaId ===
                registro.id,
            )
              ? atual
              : [
                  ...atual,
                  {
                    categoriaId:
                      registro.id,
                    principal:
                      atual.length ===
                      0,
                  },
                ],
        );
      }

      setMensagem({
        tipo:
          "sucesso",
        texto:
          dados.existente
            ? t(
                "bibliographicReferenceAlreadyExists",
              )
            : t(
                "bibliographicReferenceCreated",
              ),
      });

      setNomeReferencia("");
      setNomeOrdenacao("");
      setOrcid("");
      setMostrarCriacao(false);
    } catch (erro) {
      setMensagem({
        tipo: "erro",
        texto:
          erro instanceof Error
            ? erro.message
            : t(
                "createBibliographicReferenceError",
              ),
      });
    } finally {
      setCriando(false);
    }
  }

  const relacionamentosAlterados =
    editoraId !==
      (editora
        ? String(editora.id)
        : "") ||
    JSON.stringify(
      autoresSelecionados.map(
        (
          vinculo,
          indice,
        ) => ({
          autorId:
            vinculo.autorId,
          funcao:
            vinculo.funcao,
          ordem:
            indice,
        }),
      ),
    ) !==
      JSON.stringify(
        autores.map(
          (
            vinculo,
            indice,
          ) => ({
            autorId:
              vinculo.autor.id,
            funcao:
              vinculo.funcao,
            ordem:
              Number.isInteger(
                vinculo.ordem,
              )
                ? vinculo.ordem
                : indice,
          }),
        ),
      ) ||
    JSON.stringify(
      categoriasSelecionadas,
    ) !==
      JSON.stringify(
        categorias.map(
          (vinculo) => ({
            categoriaId:
              vinculo.categoria.id,
            principal:
              vinculo.principal,
          }),
        ),
      );

  const bloqueado =
    !podeEditar ||
    impersonacao ||
    salvando;

  return (
    <section className="bib-card bib-detail-section">
      <header className="bib-detail-section-heading">
        <div>
          <span aria-hidden="true">
            {"\uD83D\uDC65"}
          </span>

          <div>
            <h2>
              {t(
                "relationshipsTitle",
              )}
            </h2>

            <p>
              {t(
                "relationshipsDescription",
              )}
            </p>
          </div>
        </div>

        {podeEditar &&
        !impersonacao ? (
          <button
            type="button"
            className="bib-button bib-button-primary"
            disabled={
              salvando ||
              carregando ||
              !relacionamentosAlterados
            }
            onClick={() =>
              void salvar()
            }
          >
            {salvando
              ? t(
                  "savingBibliographicRelationships",
                )
              : t(
                  "saveBibliographicRelationships",
                )}
          </button>
        ) : (
          <span className="bib-readonly-chip">
            {t(
              "bibliographicRelationshipsReadOnly",
            )}
          </span>
        )}
      </header>

      {mensagem ? (
        <p
          role={
            mensagem.tipo ===
            "erro"
              ? "alert"
              : "status"
          }
          className="bib-compact-empty"
        >
          <strong>
            {mensagem.texto}
          </strong>
        </p>
      ) : null}

      {carregando ? (
        <p>
          {t(
            "loadingBibliographicReferences",
          )}
        </p>
      ) : (
        <div className="bib-relationship-grid">
          <article className="bib-relationship-card">
            <h3>
              {t("publisher")}
            </h3>

            <select
              className="bib-input"
              value={
                editoraId
              }
              disabled={
                bloqueado
              }
              onChange={(
                evento,
              ) =>
                setEditoraId(
                  evento.target
                    .value,
                )
              }
            >
              <option value="">
                {t(
                  "selectPublisher",
                )}
              </option>

              {referencias.editoras.map(
                (
                  registro,
                ) => (
                  <option
                    key={
                      registro.id
                    }
                    value={
                      registro.id
                    }
                  >
                    {registro.nome}
                  </option>
                ),
              )}
            </select>

            {editora ? (
              <small>
                {t(
                  "currentlyLinked",
                )}
                :{" "}
                {editora.nome}
              </small>
            ) : (
              <small>
                {t(
                  "noPublisher",
                )}
              </small>
            )}
          </article>

          <article className="bib-relationship-card">
            <h3>
              {t("authors")}
            </h3>

            <div className="flex gap-2">
              <select
                className="bib-input"
                value={
                  autorAdicionar
                }
                disabled={
                  bloqueado
                }
                onChange={(
                  evento,
                ) =>
                  setAutorAdicionar(
                    evento.target
                      .value,
                  )
                }
              >
                <option value="">
                  {t(
                    "selectAuthor",
                  )}
                </option>

                {referencias.autores.map(
                  (
                    registro,
                  ) => (
                    <option
                      key={
                        registro.id
                      }
                      value={
                        registro.id
                      }
                    >
                      {registro.nome}
                    </option>
                  ),
                )}
              </select>

              <button
                type="button"
                className="bib-button bib-button-secondary"
                disabled={
                  bloqueado ||
                  !autorAdicionar
                }
                onClick={
                  adicionarAutor
                }
              >
                {t("add")}
              </button>
            </div>

            {autoresSelecionados.length ? (
              <div className="mt-3 space-y-2">
                {autoresSelecionados.map(
                  (
                    vinculo,
                    indice,
                  ) => {
                    const autor =
                      referencias.autores.find(
                        (
                          registro,
                        ) =>
                          registro.id ===
                          vinculo.autorId,
                      );

                    return (
                      <div
                        key={
                          vinculo.autorId
                        }
                        className="bib-related-row bib-catalog-author-row"
                      >
                        <div className="bib-exemplar-info bib-catalog-author-info">
                          <strong>
                            {autor?.nome ||
                              "#" +
                                vinculo.autorId}
                          </strong>

                          <small>
                            {t(
                              "authorOrder",
                              {
                                order:
                                  indice +
                                  1,
                              },
                            )}
                          </small>
                        </div>

                        <select
                          className="bib-input"
                          value={
                            vinculo.funcao
                          }
                          disabled={
                            bloqueado
                          }
                          onChange={(
                            evento,
                          ) =>
                            alterarFuncao(
                              vinculo.autorId,
                              evento
                                .target
                                .value,
                            )
                          }
                        >
                          {FUNCOES_AUTORIA.map(
                            (
                              funcao,
                            ) => (
                              <option
                                key={
                                  funcao
                                }
                                value={
                                  funcao
                                }
                              >
                                {rotuloFuncao(
                                  funcao,
                                )}
                              </option>
                            ),
                          )}
                        </select>

                        <div className="bib-catalog-author-actions">
                          <button
                            type="button"
                            className="bib-button bib-button-secondary"
                            disabled={
                              bloqueado ||
                              indice ===
                                0
                            }
                            aria-label={t(
                              "moveAuthorUp",
                            )}
                            onClick={() =>
                              moverAutor(
                                indice,
                                -1,
                              )
                            }
                          >
                            {"\u2191"}
                          </button>

                          <button
                            type="button"
                            className="bib-button bib-button-secondary"
                            disabled={
                              bloqueado ||
                              indice ===
                                autoresSelecionados.length -
                                  1
                            }
                            aria-label={t(
                              "moveAuthorDown",
                            )}
                            onClick={() =>
                              moverAutor(
                                indice,
                                1,
                              )
                            }
                          >
                            {"\u2193"}
                          </button>

                          <button
                            type="button"
                            className="bib-button bib-button-danger"
                            disabled={
                              bloqueado
                            }
                            onClick={() =>
                              removerAutor(
                                vinculo.autorId,
                              )
                            }
                          >
                            {t(
                              "remove",
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            ) : (
              <p className="mt-2">
                {t("noAuthors")}
              </p>
            )}
          </article>

          <article className="bib-relationship-card">
            <h3>
              {t(
                "subjectsAndCategories",
              )}
            </h3>

            <div className="flex gap-2">
              <select
                className="bib-input"
                value={
                  categoriaAdicionar
                }
                disabled={
                  bloqueado
                }
                onChange={(
                  evento,
                ) =>
                  setCategoriaAdicionar(
                    evento.target
                      .value,
                  )
                }
              >
                <option value="">
                  {t(
                    "selectSubject",
                  )}
                </option>

                {referencias.categorias.map(
                  (
                    registro,
                  ) => (
                    <option
                      key={
                        registro.id
                      }
                      value={
                        registro.id
                      }
                    >
                      {registro.nome}
                    </option>
                  ),
                )}
              </select>

              <button
                type="button"
                className="bib-button bib-button-secondary"
                disabled={
                  bloqueado ||
                  !categoriaAdicionar
                }
                onClick={
                  adicionarCategoria
                }
              >
                {t("add")}
              </button>
            </div>

            {categoriasSelecionadas.length ? (
              <div className="mt-3 space-y-2">
                {categoriasSelecionadas.map(
                  (
                    vinculo,
                  ) => {
                    const categoria =
                      referencias.categorias.find(
                        (
                          registro,
                        ) =>
                          registro.id ===
                          vinculo.categoriaId,
                      );

                    return (
                      <div
                        key={
                          vinculo.categoriaId
                        }
                        className="bib-related-row"
                      >
                        <div className="bib-exemplar-info">
                          <strong>
                            {categoria?.nome ||
                              "#" +
                                vinculo.categoriaId}
                          </strong>

                          <label>
                            <input
                              type="radio"
                              name={
                                "categoria-principal-" +
                                itemId
                              }
                              checked={
                                vinculo.principal
                              }
                              disabled={
                                bloqueado
                              }
                              onChange={() =>
                                marcarPrincipal(
                                  vinculo.categoriaId,
                                )
                              }
                            />{" "}
                            {t(
                              "principalSubject",
                            )}
                          </label>
                        </div>

                        <button
                          type="button"
                          className="bib-button bib-button-danger"
                          disabled={
                            bloqueado
                          }
                          onClick={() =>
                            removerCategoria(
                              vinculo.categoriaId,
                            )
                          }
                        >
                          {t(
                            "remove",
                          )}
                        </button>
                      </div>
                    );
                  },
                )}
              </div>
            ) : (
              <p className="mt-2">
                {t(
                  "noSubjects",
                )}
              </p>
            )}
          </article>
        </div>
      )}

      {podeEditar &&
      !impersonacao ? (
        <div className="mt-5">
          <button
            type="button"
            className="bib-button bib-button-secondary"
            onClick={() =>
              setMostrarCriacao(
                (atual) =>
                  !atual,
              )
            }
          >
            {t(
              "createBibliographicReference",
            )}
          </button>

          {mostrarCriacao ? (
            <div className="bib-card mt-3 p-4">
              <div className="bib-form-grid">
                <label className="bib-field">
                  <span>
                    {t(
                      "referenceType",
                    )}
                  </span>

                  <select
                    className="bib-input"
                    value={
                      tipoReferencia
                    }
                    disabled={
                      criando
                    }
                    onChange={(
                      evento,
                    ) =>
                      setTipoReferencia(
                        evento
                          .target
                          .value as TipoReferencia,
                      )
                    }
                  >
                    <option value="AUTOR">
                      {t(
                        "referenceAuthor",
                      )}
                    </option>

                    <option value="EDITORA">
                      {t(
                        "referencePublisher",
                      )}
                    </option>

                    <option value="CATEGORIA">
                      {t(
                        "referenceSubject",
                      )}
                    </option>
                  </select>
                </label>

                <label className="bib-field">
                  <span>
                    {t(
                      "referenceName",
                    )}
                  </span>

                  <input
                    className="bib-input"
                    value={
                      nomeReferencia
                    }
                    disabled={
                      criando
                    }
                    onChange={(
                      evento,
                    ) =>
                      setNomeReferencia(
                        evento.target
                          .value,
                      )
                    }
                  />
                </label>

                {tipoReferencia ===
                "AUTOR" ? (
                  <>
                    <label className="bib-field">
                      <span>
                        {t(
                          "authorSortName",
                        )}
                      </span>

                      <input
                        className="bib-input"
                        value={
                          nomeOrdenacao
                        }
                        disabled={
                          criando
                        }
                        placeholder={t(
                          "authorSortNamePlaceholder",
                        )}
                        onChange={(
                          evento,
                        ) =>
                          setNomeOrdenacao(
                            evento
                              .target
                              .value,
                          )
                        }
                      />
                    </label>

                    <label className="bib-field">
                      <span>
                        ORCID
                      </span>

                      <input
                        className="bib-input"
                        value={
                          orcid
                        }
                        disabled={
                          criando
                        }
                        placeholder="0000-0000-0000-0000"
                        onChange={(
                          evento,
                        ) =>
                          setOrcid(
                            evento
                              .target
                              .value,
                          )
                        }
                      />
                    </label>
                  </>
                ) : null}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="bib-button bib-button-primary"
                  disabled={
                    criando ||
                    !nomeReferencia.trim()
                  }
                  onClick={() =>
                    void criarReferencia()
                  }
                >
                  {criando
                    ? t(
                        "creatingBibliographicReference",
                      )
                    : t(
                        "createBibliographicReferenceAction",
                      )}
                </button>

                <button
                  type="button"
                  className="bib-button bib-button-secondary"
                  disabled={
                    criando
                  }
                  onClick={() => {
                    setMostrarCriacao(
                      false,
                    );
                    setNomeReferencia(
                      "",
                    );
                    setNomeOrdenacao(
                      "",
                    );
                    setOrcid("");
                  }}
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <style jsx>{`
        .bib-catalog-author-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 0.6rem;
          align-items: stretch;
          width: 100%;
          min-width: 0;
          overflow: hidden;
        }

        .bib-catalog-author-info {
          min-width: 0;
          width: 100%;
        }

        .bib-catalog-author-info strong {
          display: block;
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: normal;
          line-height: 1.35;
        }

        .bib-catalog-author-row
          > .bib-input {
          width: 100%;
          min-width: 0;
        }

        .bib-catalog-author-actions {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          align-items: center !important;
          justify-content: flex-start !important;
          gap: 0.4rem !important;
          width: 100% !important;
          min-width: 0 !important;
        }

        .bib-catalog-author-actions
          > .bib-button {
          display: inline-flex !important;
          flex: 0 0 auto !important;
          width: auto !important;
          min-width: 2.4rem !important;
          max-width: none !important;
          padding-left: 0.65rem !important;
          padding-right: 0.65rem !important;
          margin: 0 !important;
          white-space: nowrap !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .bib-catalog-author-actions
          > .bib-button-danger {
          flex: 0 0 auto !important;
          width: auto !important;
          min-width: max-content !important;
        }

      `}</style>
    </section>
  );
}
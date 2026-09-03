"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocale,
  useTranslations,
} from "next-intl";

import CadastrosTransporte from "@/components/admin/atividades-externas/CadastrosTransporte";

type TipoModal =
  | "ONIBUS"
  | "MICRO_ONIBUS"
  | "VAN"
  | "AUTOMOVEL"
  | "VEICULO_AUTONOMO"
  | "AVIAO"
  | "HELICOPTERO"
  | "TREM"
  | "METRO"
  | "BONDE"
  | "BARCO"
  | "FERRY"
  | "NAVIO"
  | "TRANSPORTE_PUBLICO"
  | "BICICLETA"
  | "CAMINHADA"
  | "OUTRO";

type StatusTrecho =
  | "PLANEJADO"
  | "CONFIRMADO"
  | "EM_EMBARQUE"
  | "EM_TRANSITO"
  | "CONCLUIDO"
  | "CANCELADO";

type Prestador = {
  id: number;
  nome: string;
  nomeFantasia?: string | null;
  tipo: string;
};

type Trecho = {
  id: number;
  ordem: number;

  titulo?: string | null;

  modal: TipoModal;

  prestadorTransporteId?: number | null;

  origemNome: string;
  origemEndereco?: string | null;
  origemCidade?: string | null;
  origemRegiao?: string | null;
  origemPais?: string | null;

  destinoNome: string;
  destinoEndereco?: string | null;
  destinoCidade?: string | null;
  destinoRegiao?: string | null;
  destinoPais?: string | null;

  partidaPrevista?: string | null;
  chegadaPrevista?: string | null;

  partidaReal?: string | null;
  chegadaReal?: string | null;

  numeroReferencia?: string | null;

  observacao?: string | null;

  status: StatusTrecho;

  prestadorTransporte?: Prestador | null;

  veiculos: Array<{
    id: number;
    veiculoId: number;

    veiculo: {
      id: number;
      nomeIdentificacao?: string | null;
      tipo: string;
      marca?: string | null;
      modelo?: string | null;
      placa?: string | null;
      capacidadePassageiros?: number | null;
      tipoConducao: string;
    };

    condutores: Array<{
      id: number;
      condutorId: number;

      condutor: {
        id: number;
        nome: string;
        tipo: string;
      };
    }>;
  }>;

  passageiros: Array<{
    id: number;
    participanteId: number;
  }>;
};

type RespostaApi = {
  ok: boolean;

  podeGerenciar: boolean;

  resumo: {
    totalTrechos: number;
    totalVeiculos: number;
    totalCondutores: number;
    totalPassageiros: number;

    totalPrestadoresDisponiveis: number;
    totalVeiculosDisponiveis: number;
    totalCondutoresDisponiveis: number;
  };

  trechos: Trecho[];

  opcoes: {
    prestadores: Prestador[];

    veiculos: Array<{
      id: number;
      nomeIdentificacao?: string | null;
      tipo: string;
      placa?: string | null;
    }>;

    condutores: Array<{
      id: number;
      nome: string;
      tipo: string;
    }>;
  };

  error?: string;
};

type FormularioTrecho = {
  modal: TipoModal;

  titulo: string;

  prestadorTransporteId: string;

  origemNome: string;
  origemEndereco: string;
  origemCidade: string;
  origemRegiao: string;
  origemPais: string;

  destinoNome: string;
  destinoEndereco: string;
  destinoCidade: string;
  destinoRegiao: string;
  destinoPais: string;

  partidaPrevista: string;
  chegadaPrevista: string;

  numeroReferencia: string;

  observacao: string;
};

type OpcaoSelect = {
  value: string;
  label: string;
};

const MODAIS: TipoModal[] = [
  "ONIBUS",
  "MICRO_ONIBUS",
  "VAN",
  "AUTOMOVEL",
  "VEICULO_AUTONOMO",
  "AVIAO",
  "HELICOPTERO",
  "TREM",
  "METRO",
  "BONDE",
  "BARCO",
  "FERRY",
  "NAVIO",
  "TRANSPORTE_PUBLICO",
  "BICICLETA",
  "CAMINHADA",
  "OUTRO",
];

const FORMULARIO_INICIAL: FormularioTrecho = {
  modal: "ONIBUS",

  titulo: "",

  prestadorTransporteId: "",

  origemNome: "",
  origemEndereco: "",
  origemCidade: "",
  origemRegiao: "",
  origemPais: "",

  destinoNome: "",
  destinoEndereco: "",
  destinoCidade: "",
  destinoRegiao: "",
  destinoPais: "",

  partidaPrevista: "",
  chegadaPrevista: "",

  numeroReferencia: "",

  observacao: "",
};

function iconeModal(
  modal: TipoModal
) {
  switch (modal) {
    case "ONIBUS":
    case "MICRO_ONIBUS":
      return "🚌";

    case "VAN":
      return "🚐";

    case "AUTOMOVEL":
      return "🚗";

    case "VEICULO_AUTONOMO":
      return "🤖";

    case "AVIAO":
      return "✈️";

    case "HELICOPTERO":
      return "🚁";

    case "TREM":
      return "🚆";

    case "METRO":
      return "🚇";

    case "BONDE":
      return "🚋";

    case "BARCO":
    case "FERRY":
    case "NAVIO":
      return "⛴️";

    case "TRANSPORTE_PUBLICO":
      return "🚍";

    case "BICICLETA":
      return "🚲";

    case "CAMINHADA":
      return "🚶";

    default:
      return "🚚";
  }
}

function SelectPhanyx({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;

  onChange: (
    value: string
  ) => void;

  options: OpcaoSelect[];

  placeholder: string;
}) {
  const [aberto, setAberto] =
    useState(false);

  const ref =
    useRef<HTMLDivElement>(
      null
    );

  useEffect(() => {
    function fechar(
      event: MouseEvent
    ) {
      if (
        ref.current &&
        !ref.current.contains(
          event.target as Node
        )
      ) {
        setAberto(false);
      }
    }

    document.addEventListener(
      "mousedown",
      fechar
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        fechar
      );
  }, []);

  const selecionada =
    options.find(
      (option) =>
        option.value === value
    );

  return (
    <div
      ref={ref}
      className="phanyx-transporte-select relative"
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() =>
          setAberto(
            (atual) => !atual
          )
        }
        className="phanyx-transporte-select-trigger flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium"
      >
        <span className="truncate">
          {selecionada?.label ||
            placeholder}
        </span>

        <span
          aria-hidden="true"
          className={[
            "shrink-0 text-[10px] transition-transform",
            aberto
              ? "rotate-180"
              : "",
          ].join(" ")}
        >
          ▼
        </span>
      </button>

      {aberto ? (
        <div
          role="listbox"
          className="phanyx-transporte-select-menu absolute left-0 right-0 top-[calc(100%+6px)] z-[100] max-h-72 overflow-y-auto rounded-xl border p-1.5 shadow-xl"
        >
          {options.map(
            (option) => {
              const selecionado =
                option.value ===
                value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={
                    selecionado
                  }
                  onClick={() => {
                    onChange(
                      option.value
                    );

                    setAberto(
                      false
                    );
                  }}
                  className={[
                    "phanyx-transporte-select-option",
                    selecionado
                      ? "is-selected"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span>
                    {option.label}
                  </span>

                  {selecionado ? (
                    <span>
                      ✓
                    </span>
                  ) : null}
                </button>
              );
            }
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function TransporteAtividadeExterna({
  atividadeId,
  onTransporteAlterado,
}: {
  atividadeId: number;

  onTransporteAlterado?: () =>
    | void
    | Promise<void>;
}) {
  const t =
    useTranslations(
      "AdminExternalActivityTransport"
    );

  const locale =
    useLocale();

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [
    podeGerenciar,
    setPodeGerenciar,
  ] = useState(false);

  const [trechos, setTrechos] =
    useState<Trecho[]>([]);

  const [
    prestadores,
    setPrestadores,
  ] = useState<Prestador[]>([]);

  const [
    resumo,
    setResumo,
  ] = useState({
    totalTrechos: 0,
    totalVeiculos: 0,
    totalCondutores: 0,
    totalPassageiros: 0,
  });

  const [
    formularioAberto,
    setFormularioAberto,
  ] = useState(false);

  const [
    cadastrosAbertos,
    setCadastrosAbertos,
  ] = useState(false);

  const [
    formulario,
    setFormulario,
  ] =
    useState<FormularioTrecho>({
      ...FORMULARIO_INICIAL,
    });

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      const resposta =
        await fetch(
          `/api/admin/atividades-externas/${atividadeId}/transporte`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const dados =
        (await resposta.json()) as RespostaApi;

      if (
        !resposta.ok ||
        !dados.ok
      ) {
        throw new Error(
          dados.error ||
          "ERRO_CARREGAR"
        );
      }

      setPodeGerenciar(
        dados.podeGerenciar
      );

      setTrechos(
        dados.trechos || []
      );

      setPrestadores(
        dados.opcoes
          ?.prestadores || []
      );

      setResumo({
        totalTrechos:
          dados.resumo
            ?.totalTrechos || 0,

        totalVeiculos:
          dados.resumo
            ?.totalVeiculos || 0,

        totalCondutores:
          dados.resumo
            ?.totalCondutores || 0,

        totalPassageiros:
          dados.resumo
            ?.totalPassageiros || 0,
      });
    } catch (error) {
      console.error(
        "[TRANSPORTE_ATIVIDADE_CARREGAR]",
        error
      );

      setErro(
        t("errors.load")
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, [atividadeId]);

  function alterarCampo(
    campo: keyof FormularioTrecho,
    valor: string
  ) {
    setFormulario(
      (atual) => ({
        ...atual,
        [campo]: valor,
      })
    );
  }

  function formatarDataHora(
    valor?: string | null
  ) {
    if (!valor) {
      return t(
        "common.notInformed"
      );
    }

    const data =
      new Date(valor);

    if (
      Number.isNaN(
        data.getTime()
      )
    ) {
      return t(
        "common.notInformed"
      );
    }

    return new Intl.DateTimeFormat(
      locale,
      {
        dateStyle: "short",
        timeStyle: "short",
      }
    ).format(data);
  }

  async function salvarTrecho() {
    setErro("");
    setSucesso("");

    if (
      !formulario.origemNome.trim()
    ) {
      setErro(
        t("errors.originRequired")
      );

      return;
    }

    if (
      !formulario.destinoNome.trim()
    ) {
      setErro(
        t(
          "errors.destinationRequired"
        )
      );

      return;
    }

    setSalvando(true);

    try {
      const resposta =
        await fetch(
          `/api/admin/atividades-externas/${atividadeId}/transporte`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              modal:
                formulario.modal,

              titulo:
                formulario.titulo,

              prestadorTransporteId:
                formulario
                  .prestadorTransporteId ||
                null,

              origemNome:
                formulario
                  .origemNome,

              origemEndereco:
                formulario
                  .origemEndereco,

              origemCidade:
                formulario
                  .origemCidade,

              origemRegiao:
                formulario
                  .origemRegiao,

              origemPais:
                formulario
                  .origemPais,

              destinoNome:
                formulario
                  .destinoNome,

              destinoEndereco:
                formulario
                  .destinoEndereco,

              destinoCidade:
                formulario
                  .destinoCidade,

              destinoRegiao:
                formulario
                  .destinoRegiao,

              destinoPais:
                formulario
                  .destinoPais,

              partidaPrevista:
                formulario
                  .partidaPrevista
                  ? new Date(
                    formulario
                      .partidaPrevista
                  ).toISOString()
                  : null,

              chegadaPrevista:
                formulario
                  .chegadaPrevista
                  ? new Date(
                    formulario
                      .chegadaPrevista
                  ).toISOString()
                  : null,

              numeroReferencia:
                formulario
                  .numeroReferencia,

              observacao:
                formulario
                  .observacao,
            }),
          }
        );

      const dados =
        await resposta.json();

      if (
        !resposta.ok ||
        !dados?.ok
      ) {
        const codigo =
          String(
            dados?.error || ""
          );

        if (
          codigo ===
          "CHEGADA_ANTES_DA_PARTIDA"
        ) {
          throw new Error(
            "CHEGADA_ANTES_DA_PARTIDA"
          );
        }

        throw new Error(
          codigo ||
          "ERRO_SALVAR"
        );
      }

      setFormulario({
        ...FORMULARIO_INICIAL,
      });

      setFormularioAberto(
        false
      );

      setSucesso(
        t("success.created")
      );

      await carregar();

      await onTransporteAlterado?.();
    } catch (error) {
      console.error(
        "[TRANSPORTE_ATIVIDADE_SALVAR]",
        error
      );

      const codigo =
        error instanceof Error
          ? error.message
          : "";

      if (
        codigo ===
        "CHEGADA_ANTES_DA_PARTIDA"
      ) {
        setErro(
          t(
            "errors.arrivalBeforeDeparture"
          )
        );
      } else {
        setErro(
          t("errors.save")
        );
      }
    } finally {
      setSalvando(false);
    }
  }

  const opcoesPrestadores:
    OpcaoSelect[] = [
      {
        value: "",
        label: t(
          "form.noProvider"
        ),
      },

      ...prestadores.map(
        (prestador) => ({
          value: String(
            prestador.id
          ),

          label:
            prestador
              .nomeFantasia ||
            prestador.nome,
        })
      ),
    ];

  if (carregando) {
    return (
      <div className="phanyx-transporte-loading rounded-2xl border p-6 text-sm">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="phanyx-transporte space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black">
            🚌 {t("title")}
          </h2>

          <p className="mt-1 text-sm opacity-80">
            {t("description")}
          </p>
        </div>

        {podeGerenciar ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setErro("");
                setSucesso("");

                setCadastrosAbertos(
                  (atual) => !atual
                );

                setFormularioAberto(
                  false
                );
              }}
              className="phanyx-transporte-secondary-button rounded-xl border px-4 py-3 text-sm font-extrabold"
            >
              {t("actions.registrations")}
            </button>

            <button
              type="button"
              onClick={() => {
                setErro("");
                setSucesso("");

                setFormularioAberto(
                  (atual) => !atual
                );

                setCadastrosAbertos(
                  false
                );
              }}
              className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-blue-800"
            >
              {formularioAberto
                ? t("actions.cancel")
                : t(
                  "actions.addSegment"
                )}
            </button>
          </div>
        ) : null}
      </div>

      {erro ? (
        <div className="phanyx-transporte-error rounded-xl border px-4 py-3 text-sm font-semibold">
          {erro}
        </div>
      ) : null}

      {sucesso ? (
        <div className="phanyx-transporte-success rounded-xl border px-4 py-3 text-sm font-semibold">
          {sucesso}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          valor={
            resumo.totalTrechos
          }
          rotulo={t(
            "summary.segments"
          )}
          icone="🛣️"
        />

        <ResumoCard
          valor={
            resumo.totalVeiculos
          }
          rotulo={t(
            "summary.vehicles"
          )}
          icone="🚐"
        />

        <ResumoCard
          valor={
            resumo.totalCondutores
          }
          rotulo={t(
            "summary.drivers"
          )}
          icone="🧑‍✈️"
        />

        <ResumoCard
          valor={
            resumo.totalPassageiros
          }
          rotulo={t(
            "summary.passengers"
          )}
          icone="👥"
        />
      </div>

      {cadastrosAbertos ? (
        <CadastrosTransporte
          onFechar={() =>
            setCadastrosAbertos(
              false
            )
          }
          onCadastrosAlterados={
            carregar
          }
        />
      ) : null}

      {formularioAberto ? (
        <div className="phanyx-transporte-form rounded-2xl border p-4 sm:p-5">
          <div className="mb-5">
            <h3 className="text-lg font-black">
              {t(
                "form.title"
              )}
            </h3>

            <p className="mt-1 text-sm opacity-75">
              {t(
                "form.description"
              )}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Campo
              label={t(
                "form.segmentTitle"
              )}
            >
              <input
                value={
                  formulario.titulo
                }
                onChange={(e) =>
                  alterarCampo(
                    "titulo",
                    e.target.value
                  )
                }
                placeholder={t(
                  "form.segmentTitlePlaceholder"
                )}
                className="phanyx-transporte-input"
              />
            </Campo>

            <Campo
              label={t(
                "form.modal"
              )}
              obrigatorio
            >
              <SelectPhanyx
                value={
                  formulario.modal
                }
                onChange={(
                  valor
                ) =>
                  alterarCampo(
                    "modal",
                    valor
                  )
                }
                placeholder={t(
                  "form.modal"
                )}
                options={MODAIS.map(
                  (modal) => ({
                    value: modal,

                    label: `${iconeModal(
                      modal
                    )} ${t(
                      `modals.${modal}`
                    )}`,
                  })
                )}
              />
            </Campo>

            <Campo
              label={t(
                "form.provider"
              )}
            >
              <SelectPhanyx
                value={
                  formulario
                    .prestadorTransporteId
                }
                onChange={(
                  valor
                ) =>
                  alterarCampo(
                    "prestadorTransporteId",
                    valor
                  )
                }
                placeholder={t(
                  "form.provider"
                )}
                options={
                  opcoesPrestadores
                }
              />
            </Campo>

            <Campo
              label={t(
                "form.reference"
              )}
            >
              <input
                value={
                  formulario
                    .numeroReferencia
                }
                onChange={(e) =>
                  alterarCampo(
                    "numeroReferencia",
                    e.target.value
                  )
                }
                placeholder={t(
                  "form.referencePlaceholder"
                )}
                className="phanyx-transporte-input"
              />
            </Campo>
          </div>

          <div className="my-5 grid gap-5 xl:grid-cols-2">
            <LocalCard
              titulo={`📍 ${t(
                "form.origin"
              )}`}
            >
              <Campo
                label={t(
                  "form.placeName"
                )}
                obrigatorio
              >
                <input
                  value={
                    formulario
                      .origemNome
                  }
                  onChange={(e) =>
                    alterarCampo(
                      "origemNome",
                      e.target
                        .value
                    )
                  }
                  className="phanyx-transporte-input"
                />
              </Campo>

              <Campo
                label={t(
                  "form.address"
                )}
              >
                <input
                  value={
                    formulario
                      .origemEndereco
                  }
                  onChange={(e) =>
                    alterarCampo(
                      "origemEndereco",
                      e.target
                        .value
                    )
                  }
                  className="phanyx-transporte-input"
                />
              </Campo>

              <div className="grid gap-3 sm:grid-cols-3">
                <Campo
                  label={t(
                    "form.city"
                  )}
                >
                  <input
                    value={
                      formulario
                        .origemCidade
                    }
                    onChange={(e) =>
                      alterarCampo(
                        "origemCidade",
                        e.target
                          .value
                      )
                    }
                    className="phanyx-transporte-input"
                  />
                </Campo>

                <Campo
                  label={t(
                    "form.region"
                  )}
                >
                  <input
                    value={
                      formulario
                        .origemRegiao
                    }
                    onChange={(e) =>
                      alterarCampo(
                        "origemRegiao",
                        e.target
                          .value
                      )
                    }
                    className="phanyx-transporte-input"
                  />
                </Campo>

                <Campo
                  label={t(
                    "form.country"
                  )}
                >
                  <input
                    value={
                      formulario
                        .origemPais
                    }
                    onChange={(e) =>
                      alterarCampo(
                        "origemPais",
                        e.target
                          .value
                      )
                    }
                    className="phanyx-transporte-input"
                  />
                </Campo>
              </div>
            </LocalCard>

            <LocalCard
              titulo={`🏁 ${t(
                "form.destination"
              )}`}
            >
              <Campo
                label={t(
                  "form.placeName"
                )}
                obrigatorio
              >
                <input
                  value={
                    formulario
                      .destinoNome
                  }
                  onChange={(e) =>
                    alterarCampo(
                      "destinoNome",
                      e.target
                        .value
                    )
                  }
                  className="phanyx-transporte-input"
                />
              </Campo>

              <Campo
                label={t(
                  "form.address"
                )}
              >
                <input
                  value={
                    formulario
                      .destinoEndereco
                  }
                  onChange={(e) =>
                    alterarCampo(
                      "destinoEndereco",
                      e.target
                        .value
                    )
                  }
                  className="phanyx-transporte-input"
                />
              </Campo>

              <div className="grid gap-3 sm:grid-cols-3">
                <Campo
                  label={t(
                    "form.city"
                  )}
                >
                  <input
                    value={
                      formulario
                        .destinoCidade
                    }
                    onChange={(e) =>
                      alterarCampo(
                        "destinoCidade",
                        e.target
                          .value
                      )
                    }
                    className="phanyx-transporte-input"
                  />
                </Campo>

                <Campo
                  label={t(
                    "form.region"
                  )}
                >
                  <input
                    value={
                      formulario
                        .destinoRegiao
                    }
                    onChange={(e) =>
                      alterarCampo(
                        "destinoRegiao",
                        e.target
                          .value
                      )
                    }
                    className="phanyx-transporte-input"
                  />
                </Campo>

                <Campo
                  label={t(
                    "form.country"
                  )}
                >
                  <input
                    value={
                      formulario
                        .destinoPais
                    }
                    onChange={(e) =>
                      alterarCampo(
                        "destinoPais",
                        e.target
                          .value
                      )
                    }
                    className="phanyx-transporte-input"
                  />
                </Campo>
              </div>
            </LocalCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Campo
              label={t(
                "form.departure"
              )}
            >
              <input
                type="datetime-local"
                value={
                  formulario
                    .partidaPrevista
                }
                onChange={(e) =>
                  alterarCampo(
                    "partidaPrevista",
                    e.target.value
                  )
                }
                className="phanyx-transporte-input"
              />
            </Campo>

            <Campo
              label={t(
                "form.arrival"
              )}
            >
              <input
                type="datetime-local"
                value={
                  formulario
                    .chegadaPrevista
                }
                onChange={(e) =>
                  alterarCampo(
                    "chegadaPrevista",
                    e.target.value
                  )
                }
                className="phanyx-transporte-input"
              />
            </Campo>
          </div>

          <div className="mt-4">
            <Campo
              label={t(
                "form.notes"
              )}
            >
              <textarea
                rows={3}
                value={
                  formulario
                    .observacao
                }
                onChange={(e) =>
                  alterarCampo(
                    "observacao",
                    e.target.value
                  )
                }
                placeholder={t(
                  "form.notesPlaceholder"
                )}
                className="phanyx-transporte-input min-h-[96px] resize-y"
              />
            </Campo>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              disabled={salvando}
              onClick={() =>
                void salvarTrecho()
              }
              className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando
                ? t(
                  "actions.saving"
                )
                : t(
                  "actions.saveSegment"
                )}
            </button>
          </div>
        </div>
      ) : null}

      <div className="phanyx-transporte-card rounded-2xl border p-4 sm:p-5">
        <h3 className="text-lg font-black">
          {t("segments.title")}
        </h3>

        <p className="mt-1 text-sm opacity-75">
          {t(
            "segments.description"
          )}
        </p>

        {trechos.length === 0 ? (
          <div className="phanyx-transporte-empty mt-5 rounded-xl border p-8 text-center">
            <div className="text-3xl">
              🛣️
            </div>

            <p className="mt-3 font-extrabold">
              {t(
                "segments.emptyTitle"
              )}
            </p>

            <p className="mt-1 text-sm opacity-75">
              {t(
                "segments.emptyDescription"
              )}
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {trechos.map(
              (trecho) => (
                <div
                  key={trecho.id}
                  className="phanyx-transporte-segment rounded-2xl border p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <div className="phanyx-transporte-modal-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl">
                        {iconeModal(
                          trecho.modal
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-black uppercase tracking-wide opacity-65">
                          {t(
                            "segments.segmentNumber",
                            {
                              number:
                                trecho.ordem,
                            }
                          )}
                        </div>

                        <h4 className="mt-0.5 break-words text-base font-black">
                          {trecho.titulo ||
                            t(
                              `modals.${trecho.modal}`
                            )}
                        </h4>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="phanyx-transporte-chip rounded-full border px-2.5 py-1 text-xs font-bold">
                            {t(
                              `modals.${trecho.modal}`
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="phanyx-transporte-status rounded-full border px-3 py-1.5 text-xs font-black">
                      {t(
                        `statuses.${trecho.status}`
                      )}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                    <LocalResumo
                      rotulo={t(
                        "segments.origin"
                      )}
                      nome={
                        trecho.origemNome
                      }
                      detalhes={[
                        trecho.origemCidade,
                        trecho.origemRegiao,
                        trecho.origemPais,
                      ]}
                    />

                    <div className="hidden text-center text-2xl opacity-55 lg:block">
                      →
                    </div>

                    <LocalResumo
                      rotulo={t(
                        "segments.destination"
                      )}
                      nome={
                        trecho.destinoNome
                      }
                      detalhes={[
                        trecho.destinoCidade,
                        trecho.destinoRegiao,
                        trecho.destinoPais,
                      ]}
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <InfoCard
                      rotulo={t(
                        "segments.departure"
                      )}
                      valor={formatarDataHora(
                        trecho.partidaPrevista
                      )}
                    />

                    <InfoCard
                      rotulo={t(
                        "segments.arrival"
                      )}
                      valor={formatarDataHora(
                        trecho.chegadaPrevista
                      )}
                    />

                    <InfoCard
                      rotulo={t(
                        "segments.provider"
                      )}
                      valor={
                        trecho
                          .prestadorTransporte
                          ?.nomeFantasia ||
                        trecho
                          .prestadorTransporte
                          ?.nome ||
                        t(
                          "common.notDefined"
                        )
                      }
                    />

                    <InfoCard
                      rotulo={t(
                        "segments.vehicles"
                      )}
                      valor={String(
                        trecho
                          .veiculos
                          .length
                      )}
                    />
                  </div>

                  {trecho
                    .numeroReferencia ? (
                    <div className="mt-3 text-xs opacity-75">
                      <strong>
                        {t(
                          "segments.reference"
                        )}
                        :
                      </strong>{" "}
                      {
                        trecho.numeroReferencia
                      }
                    </div>
                  ) : null}

                  {trecho.observacao ? (
                    <div className="phanyx-transporte-note mt-4 rounded-xl border p-3 text-sm">
                      {
                        trecho.observacao
                      }
                    </div>
                  ) : null}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Campo({
  label,
  obrigatorio = false,
  children,
}: {
  label: string;
  obrigatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black">
        {label}

        {obrigatorio ? (
          <span className="ml-1 text-red-500">
            *
          </span>
        ) : null}
      </span>

      {children}
    </label>
  );
}

function ResumoCard({
  valor,
  rotulo,
  icone,
}: {
  valor: number;
  rotulo: string;
  icone: string;
}) {
  return (
    <div className="phanyx-transporte-resumo rounded-2xl border p-4">
      <div className="text-lg">
        {icone}
      </div>

      <div className="mt-2 text-2xl font-black">
        {valor}
      </div>

      <div className="mt-0.5 text-xs font-bold opacity-70">
        {rotulo}
      </div>
    </div>
  );
}

function LocalCard({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="phanyx-transporte-local rounded-2xl border p-4">
      <h4 className="mb-4 text-sm font-black">
        {titulo}
      </h4>

      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function LocalResumo({
  rotulo,
  nome,
  detalhes,
}: {
  rotulo: string;
  nome: string;
  detalhes: Array<
    string | null | undefined
  >;
}) {
  const detalhe =
    detalhes
      .filter(Boolean)
      .join(", ");

  return (
    <div className="phanyx-transporte-location rounded-xl border p-3.5">
      <div className="text-[11px] font-black uppercase tracking-wide opacity-60">
        {rotulo}
      </div>

      <div className="mt-1 font-black">
        {nome}
      </div>

      {detalhe ? (
        <div className="mt-1 text-xs opacity-70">
          {detalhe}
        </div>
      ) : null}
    </div>
  );
}

function InfoCard({
  rotulo,
  valor,
}: {
  rotulo: string;
  valor: string;
}) {
  return (
    <div className="phanyx-transporte-info rounded-xl border p-3">
      <div className="text-[11px] font-black uppercase tracking-wide opacity-60">
        {rotulo}
      </div>

      <div className="mt-1 text-sm font-bold">
        {valor}
      </div>
    </div>
  );
}
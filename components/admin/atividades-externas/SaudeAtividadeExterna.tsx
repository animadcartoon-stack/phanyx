"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useTranslations,
} from "next-intl";

type FichaSaude = {
  id: number;

  possuiAlergia: boolean;
  alergias?: string | null;

  possuiRestricaoAlimentar: boolean;
  restricoesAlimentares?: string | null;

  utilizaMedicacao: boolean;
  medicacoes?: string | null;

  necessitaMedicacaoDuranteAtividade: boolean;
  instrucoesMedicacao?: string | null;

  possuiCondicaoSaudeRelevante: boolean;
  condicoesSaudeRelevantes?: string | null;

  possuiNecessidadeEspecial: boolean;
  necessidadesEspeciais?: string | null;

  necessitaAcessibilidade: boolean;
  orientacoesAcessibilidade?: string | null;

  necessitaAcompanhamentoIndividual: boolean;
  orientacoesAcompanhamento?: string | null;

  contatoEmergenciaNome?: string | null;
  contatoEmergenciaTelefone?: string | null;
  contatoEmergenciaParentesco?: string | null;

  medicoOuServicoReferencia?: string | null;
  telefoneMedicoOuServico?: string | null;

  planoSaudeOuSeguro?: string | null;
  numeroPlanoOuSeguro?: string | null;

  observacoesEmergencia?: string | null;

  informacaoConfirmadaPeloResponsavel: boolean;
  confirmadaEm?: string | null;
};

type Participante = {
  id: number;
  alunoId: number;

  statusParticipacao: string;
  statusPresenca: string;

  temAlerta: boolean;

  aluno: {
    id: number;
    nome: string;
    nomeSocial?: string | null;
    matricula?: string | null;
    fotoPerfil?: string | null;
    poloId?: number | null;
  };

  saude?: FichaSaude | null;
};

type Resumo = {
  participantes: number;
  fichasPreenchidas: number;
  comAlertas: number;
  confirmadas: number;
};

type RespostaApi = {
  ok?: boolean;
  podeGerenciar?: boolean;

  resumo?: Resumo;

  participantes?: Participante[];

  error?: string;
  message?: string;
};

type FormularioSaude = {
  possuiAlergia: boolean;
  alergias: string;

  possuiRestricaoAlimentar: boolean;
  restricoesAlimentares: string;

  utilizaMedicacao: boolean;
  medicacoes: string;

  necessitaMedicacaoDuranteAtividade: boolean;
  instrucoesMedicacao: string;

  possuiCondicaoSaudeRelevante: boolean;
  condicoesSaudeRelevantes: string;

  possuiNecessidadeEspecial: boolean;
  necessidadesEspeciais: string;

  necessitaAcessibilidade: boolean;
  orientacoesAcessibilidade: string;

  necessitaAcompanhamentoIndividual: boolean;
  orientacoesAcompanhamento: string;

  contatoEmergenciaNome: string;
  contatoEmergenciaTelefone: string;
  contatoEmergenciaParentesco: string;

  medicoOuServicoReferencia: string;
  telefoneMedicoOuServico: string;

  planoSaudeOuSeguro: string;
  numeroPlanoOuSeguro: string;

  observacoesEmergencia: string;

  informacaoConfirmadaPeloResponsavel: boolean;
};

const FORMULARIO_INICIAL:
  FormularioSaude = {
    possuiAlergia: false,
    alergias: "",

    possuiRestricaoAlimentar: false,
    restricoesAlimentares: "",

    utilizaMedicacao: false,
    medicacoes: "",

    necessitaMedicacaoDuranteAtividade: false,
    instrucoesMedicacao: "",

    possuiCondicaoSaudeRelevante: false,
    condicoesSaudeRelevantes: "",

    possuiNecessidadeEspecial: false,
    necessidadesEspeciais: "",

    necessitaAcessibilidade: false,
    orientacoesAcessibilidade: "",

    necessitaAcompanhamentoIndividual: false,
    orientacoesAcompanhamento: "",

    contatoEmergenciaNome: "",
    contatoEmergenciaTelefone: "",
    contatoEmergenciaParentesco: "",

    medicoOuServicoReferencia: "",
    telefoneMedicoOuServico: "",

    planoSaudeOuSeguro: "",
    numeroPlanoOuSeguro: "",

    observacoesEmergencia: "",

    informacaoConfirmadaPeloResponsavel: false,
  };

function nomeParticipante(
  participante: Participante
) {
  return (
    participante.aluno.nomeSocial?.trim() ||
    participante.aluno.nome.trim()
  );
}

export default function SaudeAtividadeExterna({
  atividadeId,
  onSaudeAlterada,
}: {
  atividadeId: number;

  onSaudeAlterada?:
    () =>
      | void
      | Promise<void>;
}) {
  const t =
    useTranslations(
      "AdminExternalActivityHealth"
    );

  const endpoint =
    `/api/admin/atividades-externas/${atividadeId}/saude`;

  const [
    participantes,
    setParticipantes,
  ] =
    useState<
      Participante[]
    >([]);

  const [
    resumo,
    setResumo,
  ] =
    useState<Resumo>({
      participantes: 0,
      fichasPreenchidas: 0,
      comAlertas: 0,
      confirmadas: 0,
    });

  const [
    podeGerenciar,
    setPodeGerenciar,
  ] =
    useState(false);

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

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

  const [
    sucesso,
    setSucesso,
  ] =
    useState("");

  const [
    busca,
    setBusca,
  ] =
    useState("");

  const [
    participanteEditando,
    setParticipanteEditando,
  ] =
    useState<
      Participante | null
    >(null);

  const [
    formulario,
    setFormulario,
  ] =
    useState<FormularioSaude>({
      ...FORMULARIO_INICIAL,
    });

  async function carregar() {
    try {
      setCarregando(true);
      setErro("");

      const resposta =
        await fetch(
          endpoint,
          {
            credentials:
              "include",

            cache:
              "no-store",
          }
        );

      const dados:
        RespostaApi =
          await resposta.json();

      if (
        !resposta.ok ||
        !dados.ok
      ) {
        throw new Error(
          dados.message ||
          dados.error ||
          t(
            "messages.loadError"
          )
        );
      }

      setParticipantes(
        dados.participantes ||
          []
      );

      setResumo(
        dados.resumo || {
          participantes:
            0,

          fichasPreenchidas:
            0,

          comAlertas:
            0,

          confirmadas:
            0,
        }
      );

      setPodeGerenciar(
        Boolean(
          dados.podeGerenciar
        )
      );
    } catch (e: unknown) {
      setErro(
        e instanceof Error
          ? e.message
          : t(
              "messages.loadError"
            )
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(
    () => {
      void carregar();
    },
    [atividadeId]
  );

  const participantesFiltrados =
    useMemo(
      () => {
        const termo =
          busca
            .trim()
            .toLocaleLowerCase();

        if (!termo) {
          return participantes;
        }

        return participantes.filter(
          (participante) => {
            const texto = [
              participante
                .aluno
                .nome,

              participante
                .aluno
                .nomeSocial,

              participante
                .aluno
                .matricula,
            ]
              .filter(Boolean)
              .join(" ")
              .toLocaleLowerCase();

            return texto.includes(
              termo
            );
          }
        );
      },
      [
        busca,
        participantes,
      ]
    );

  function atualizarCampo<
    K extends keyof FormularioSaude
  >(
    campo: K,
    valor:
      FormularioSaude[K]
  ) {
    setFormulario(
      (atual) => ({
        ...atual,

        [campo]:
          valor,
      })
    );
  }

  function abrirFicha(
    participante:
      Participante
  ) {
    setErro("");
    setSucesso("");

    const ficha =
      participante.saude;

    setParticipanteEditando(
      participante
    );

    setFormulario({
      possuiAlergia:
        Boolean(
          ficha?.possuiAlergia
        ),

      alergias:
        ficha?.alergias ||
        "",

      possuiRestricaoAlimentar:
        Boolean(
          ficha
            ?.possuiRestricaoAlimentar
        ),

      restricoesAlimentares:
        ficha
          ?.restricoesAlimentares ||
        "",

      utilizaMedicacao:
        Boolean(
          ficha
            ?.utilizaMedicacao
        ),

      medicacoes:
        ficha?.medicacoes ||
        "",

      necessitaMedicacaoDuranteAtividade:
        Boolean(
          ficha
            ?.necessitaMedicacaoDuranteAtividade
        ),

      instrucoesMedicacao:
        ficha
          ?.instrucoesMedicacao ||
        "",

      possuiCondicaoSaudeRelevante:
        Boolean(
          ficha
            ?.possuiCondicaoSaudeRelevante
        ),

      condicoesSaudeRelevantes:
        ficha
          ?.condicoesSaudeRelevantes ||
        "",

      possuiNecessidadeEspecial:
        Boolean(
          ficha
            ?.possuiNecessidadeEspecial
        ),

      necessidadesEspeciais:
        ficha
          ?.necessidadesEspeciais ||
        "",

      necessitaAcessibilidade:
        Boolean(
          ficha
            ?.necessitaAcessibilidade
        ),

      orientacoesAcessibilidade:
        ficha
          ?.orientacoesAcessibilidade ||
        "",

      necessitaAcompanhamentoIndividual:
        Boolean(
          ficha
            ?.necessitaAcompanhamentoIndividual
        ),

      orientacoesAcompanhamento:
        ficha
          ?.orientacoesAcompanhamento ||
        "",

      contatoEmergenciaNome:
        ficha
          ?.contatoEmergenciaNome ||
        "",

      contatoEmergenciaTelefone:
        ficha
          ?.contatoEmergenciaTelefone ||
        "",

      contatoEmergenciaParentesco:
        ficha
          ?.contatoEmergenciaParentesco ||
        "",

      medicoOuServicoReferencia:
        ficha
          ?.medicoOuServicoReferencia ||
        "",

      telefoneMedicoOuServico:
        ficha
          ?.telefoneMedicoOuServico ||
        "",

      planoSaudeOuSeguro:
        ficha
          ?.planoSaudeOuSeguro ||
        "",

      numeroPlanoOuSeguro:
        ficha
          ?.numeroPlanoOuSeguro ||
        "",

      observacoesEmergencia:
        ficha
          ?.observacoesEmergencia ||
        "",

      informacaoConfirmadaPeloResponsavel:
        Boolean(
          ficha
            ?.informacaoConfirmadaPeloResponsavel
        ),
    });
  }

  function fecharFicha() {
    if (salvando) {
      return;
    }

    setParticipanteEditando(
      null
    );

    setFormulario({
      ...FORMULARIO_INICIAL,
    });
  }

  async function salvarFicha() {
    if (
      !participanteEditando
    ) {
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const resposta =
        await fetch(
          endpoint,
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                acao:
                  "SALVAR_FICHA",

                participanteId:
                  participanteEditando
                    .id,

                ...formulario,
              }),
          }
        );

      const dados =
        await resposta.json();

      if (
        !resposta.ok ||
        !dados?.ok
      ) {
        throw new Error(
          dados?.message ||
          dados?.error ||
          t(
            "messages.saveError"
          )
        );
      }

      setParticipanteEditando(
        null
      );

      setFormulario({
        ...FORMULARIO_INICIAL,
      });

      setSucesso(
        t(
          "messages.saved"
        )
      );

      await carregar();

      await onSaudeAlterada?.();
    } catch (e: unknown) {
      setErro(
        e instanceof Error
          ? e.message
          : t(
              "messages.saveError"
            )
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        {t(
          "loading"
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">

        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
          {t(
            "eyebrow"
          )}
        </p>

        <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
          {t(
            "title"
          )}
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t(
            "description"
          )}
        </p>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
          <strong>
            {t(
              "privacy.title"
            )}
          </strong>{" "}
          {t(
            "privacy.description"
          )}
        </div>

        {erro ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
            {erro}
          </div>
        ) : null}

        {sucesso ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
            {sucesso}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          <ResumoCard
            titulo={t(
              "summary.participants"
            )}
            valor={
              resumo
                .participantes
            }
          />

          <ResumoCard
            titulo={t(
              "summary.records"
            )}
            valor={
              resumo
                .fichasPreenchidas
            }
          />

          <ResumoCard
            titulo={t(
              "summary.alerts"
            )}
            valor={
              resumo
                .comAlertas
            }
          />

          <ResumoCard
            titulo={t(
              "summary.confirmed"
            )}
            valor={
              resumo
                .confirmadas
            }
          />
        </div>
      </section>

      {participanteEditando ? (
        <section className="rounded-3xl border border-blue-200 bg-white p-5 dark:border-blue-900 dark:bg-slate-900 sm:p-6">

          <div className="flex flex-col gap-2">

            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
              {t(
                "form.eyebrow"
              )}
            </p>

            <h3 className="text-xl font-black text-slate-950 dark:text-white">
              {nomeParticipante(
                participanteEditando
              )}
            </h3>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              {participanteEditando
                .aluno
                .matricula ||
                t(
                  "participant.noRegistration"
                )}
            </p>
          </div>

          <SecaoFormulario
            titulo={t(
              "sections.allergies"
            )}
            descricao={t(
              "sections.allergiesDescription"
            )}
          >
            <ToggleDetalhe
              label={t(
                "fields.hasAllergy"
              )}
              checked={
                formulario
                  .possuiAlergia
              }
              onChange={(valor) =>
                atualizarCampo(
                  "possuiAlergia",
                  valor
                )
              }
            >
              <CampoTexto
                label={t(
                  "fields.allergies"
                )}
                value={
                  formulario
                    .alergias
                }
                onChange={(valor) =>
                  atualizarCampo(
                    "alergias",
                    valor
                  )
                }
              />
            </ToggleDetalhe>

            <ToggleDetalhe
              label={t(
                "fields.hasFoodRestriction"
              )}
              checked={
                formulario
                  .possuiRestricaoAlimentar
              }
              onChange={(valor) =>
                atualizarCampo(
                  "possuiRestricaoAlimentar",
                  valor
                )
              }
            >
              <CampoTexto
                label={t(
                  "fields.foodRestrictions"
                )}
                value={
                  formulario
                    .restricoesAlimentares
                }
                onChange={(valor) =>
                  atualizarCampo(
                    "restricoesAlimentares",
                    valor
                  )
                }
              />
            </ToggleDetalhe>
          </SecaoFormulario>

          <SecaoFormulario
            titulo={t(
              "sections.medication"
            )}
            descricao={t(
              "sections.medicationDescription"
            )}
          >
            <ToggleDetalhe
              label={t(
                "fields.usesMedication"
              )}
              checked={
                formulario
                  .utilizaMedicacao
              }
              onChange={(valor) =>
                atualizarCampo(
                  "utilizaMedicacao",
                  valor
                )
              }
            >
              <CampoTexto
                label={t(
                  "fields.medications"
                )}
                value={
                  formulario
                    .medicacoes
                }
                onChange={(valor) =>
                  atualizarCampo(
                    "medicacoes",
                    valor
                  )
                }
              />
            </ToggleDetalhe>

            <ToggleDetalhe
              label={t(
                "fields.needsMedicationDuringActivity"
              )}
              checked={
                formulario
                  .necessitaMedicacaoDuranteAtividade
              }
              onChange={(valor) =>
                atualizarCampo(
                  "necessitaMedicacaoDuranteAtividade",
                  valor
                )
              }
            >
              <CampoTexto
                label={t(
                  "fields.medicationInstructions"
                )}
                value={
                  formulario
                    .instrucoesMedicacao
                }
                onChange={(valor) =>
                  atualizarCampo(
                    "instrucoesMedicacao",
                    valor
                  )
                }
              />
            </ToggleDetalhe>

            <ToggleDetalhe
              label={t(
                "fields.hasRelevantCondition"
              )}
              checked={
                formulario
                  .possuiCondicaoSaudeRelevante
              }
              onChange={(valor) =>
                atualizarCampo(
                  "possuiCondicaoSaudeRelevante",
                  valor
                )
              }
            >
              <CampoTexto
                label={t(
                  "fields.relevantConditions"
                )}
                value={
                  formulario
                    .condicoesSaudeRelevantes
                }
                onChange={(valor) =>
                  atualizarCampo(
                    "condicoesSaudeRelevantes",
                    valor
                  )
                }
              />
            </ToggleDetalhe>
          </SecaoFormulario>

          <SecaoFormulario
            titulo={t(
              "sections.accessibility"
            )}
            descricao={t(
              "sections.accessibilityDescription"
            )}
          >
            <ToggleDetalhe
              label={t(
                "fields.hasSpecialNeed"
              )}
              checked={
                formulario
                  .possuiNecessidadeEspecial
              }
              onChange={(valor) =>
                atualizarCampo(
                  "possuiNecessidadeEspecial",
                  valor
                )
              }
            >
              <CampoTexto
                label={t(
                  "fields.specialNeeds"
                )}
                value={
                  formulario
                    .necessidadesEspeciais
                }
                onChange={(valor) =>
                  atualizarCampo(
                    "necessidadesEspeciais",
                    valor
                  )
                }
              />
            </ToggleDetalhe>

            <ToggleDetalhe
              label={t(
                "fields.needsAccessibility"
              )}
              checked={
                formulario
                  .necessitaAcessibilidade
              }
              onChange={(valor) =>
                atualizarCampo(
                  "necessitaAcessibilidade",
                  valor
                )
              }
            >
              <CampoTexto
                label={t(
                  "fields.accessibilityGuidance"
                )}
                value={
                  formulario
                    .orientacoesAcessibilidade
                }
                onChange={(valor) =>
                  atualizarCampo(
                    "orientacoesAcessibilidade",
                    valor
                  )
                }
              />
            </ToggleDetalhe>

            <ToggleDetalhe
              label={t(
                "fields.needsIndividualSupport"
              )}
              checked={
                formulario
                  .necessitaAcompanhamentoIndividual
              }
              onChange={(valor) =>
                atualizarCampo(
                  "necessitaAcompanhamentoIndividual",
                  valor
                )
              }
            >
              <CampoTexto
                label={t(
                  "fields.individualSupportGuidance"
                )}
                value={
                  formulario
                    .orientacoesAcompanhamento
                }
                onChange={(valor) =>
                  atualizarCampo(
                    "orientacoesAcompanhamento",
                    valor
                  )
                }
              />
            </ToggleDetalhe>
          </SecaoFormulario>

          <SecaoFormulario
            titulo={t(
              "sections.emergency"
            )}
            descricao={t(
              "sections.emergencyDescription"
            )}
          >
            <div className="grid gap-4 lg:grid-cols-3">

              <CampoInput
                label={t(
                  "fields.emergencyContactName"
                )}
                value={
                  formulario
                    .contatoEmergenciaNome
                }
                onChange={(valor) =>
                  atualizarCampo(
                    "contatoEmergenciaNome",
                    valor
                  )
                }
              />

              <CampoInput
                label={t(
                  "fields.emergencyContactPhone"
                )}
                value={
                  formulario
                    .contatoEmergenciaTelefone
                }
                onChange={(valor) =>
                  atualizarCampo(
                    "contatoEmergenciaTelefone",
                    valor
                  )
                }
              />

              <CampoInput
                label={t(
                  "fields.relationship"
                )}
                value={
                  formulario
                    .contatoEmergenciaParentesco
                }
                onChange={(valor) =>
                  atualizarCampo(
                    "contatoEmergenciaParentesco",
                    valor
                  )
                }
              />

              <CampoInput
                label={t(
                  "fields.referenceService"
                )}
                value={
                  formulario
                    .medicoOuServicoReferencia
                }
                onChange={(valor) =>
                  atualizarCampo(
                    "medicoOuServicoReferencia",
                    valor
                  )
                }
              />

              <CampoInput
                label={t(
                  "fields.referenceServicePhone"
                )}
                value={
                  formulario
                    .telefoneMedicoOuServico
                }
                onChange={(valor) =>
                  atualizarCampo(
                    "telefoneMedicoOuServico",
                    valor
                  )
                }
              />
            </div>

            <CampoTexto
              label={t(
                "fields.emergencyNotes"
              )}
              value={
                formulario
                  .observacoesEmergencia
              }
              onChange={(valor) =>
                atualizarCampo(
                  "observacoesEmergencia",
                  valor
                )
              }
            />
          </SecaoFormulario>

          <SecaoFormulario
            titulo={t(
              "sections.insurance"
            )}
            descricao={t(
              "sections.insuranceDescription"
            )}
          >
            <div className="grid gap-4 lg:grid-cols-2">

              <CampoInput
                label={t(
                  "fields.healthPlan"
                )}
                value={
                  formulario
                    .planoSaudeOuSeguro
                }
                onChange={(valor) =>
                  atualizarCampo(
                    "planoSaudeOuSeguro",
                    valor
                  )
                }
              />

              <CampoInput
                label={t(
                  "fields.healthPlanNumber"
                )}
                value={
                  formulario
                    .numeroPlanoOuSeguro
                }
                onChange={(valor) =>
                  atualizarCampo(
                    "numeroPlanoOuSeguro",
                    valor
                  )
                }
              />
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">

              <input
                type="checkbox"
                checked={
                  formulario
                    .informacaoConfirmadaPeloResponsavel
                }
                onChange={(e) =>
                  atualizarCampo(
                    "informacaoConfirmadaPeloResponsavel",
                    e.target.checked
                  )
                }
                className="mt-1 h-4 w-4"
              />

              <span>
                <span className="block text-sm font-black text-emerald-900 dark:text-emerald-200">
                  {t(
                    "fields.confirmedByGuardian"
                  )}
                </span>

                <span className="mt-1 block text-xs leading-5 text-emerald-800 dark:text-emerald-300">
                  {t(
                    "fields.confirmedByGuardianDescription"
                  )}
                </span>
              </span>
            </label>
          </SecaoFormulario>

          <div className="mt-6 flex flex-wrap justify-end gap-3">

            <button
              type="button"
              onClick={
                fecharFicha
              }
              disabled={
                salvando
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              {t(
                "actions.cancel"
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                void salvarFicha()
              }
              disabled={
                salvando
              }
              className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              {salvando
                ? t(
                    "actions.saving"
                  )
                : t(
                    "actions.save"
                  )}
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <h3 className="text-lg font-black text-slate-950 dark:text-white">
              {t(
                "participants.title"
              )}
            </h3>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t(
                "participants.description"
              )}
            </p>
          </div>

          <div className="relative w-full lg:max-w-md">

            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 dark:text-slate-400"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
              />
              <path d="m20 20-3.5-3.5" />
            </svg>

            <input
              type="search"
              value={
                busca
              }
              onChange={(e) =>
                setBusca(
                  e.target.value
                )
              }
              placeholder={t(
                "participants.search"
              )}
              className="w-full rounded-xl border-2 border-slate-400 bg-slate-50 py-3 pl-12 pr-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition placeholder:font-medium placeholder:text-slate-500 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-950"
            />
          </div>
        </div>

        {participantesFiltrados.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="font-black text-slate-800 dark:text-slate-100">
              {t(
                "participants.empty"
              )}
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">

            {participantesFiltrados.map(
              (participante) => {
                const ficha =
                  participante.saude;

                return (
                  <article
                    key={
                      participante.id
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <h4 className="text-base font-black text-slate-950 dark:text-white">
                            {nomeParticipante(
                              participante
                            )}
                          </h4>

                          <Etiqueta
                            destaque={
                              Boolean(
                                ficha
                              )
                            }
                          >
                            {ficha
                              ? t(
                                  "participant.recordFilled"
                                )
                              : t(
                                  "participant.recordPending"
                                )}
                          </Etiqueta>

                          {ficha
                            ?.informacaoConfirmadaPeloResponsavel ? (
                            <Etiqueta
                              destaque
                            >
                              {t(
                                "participant.confirmed"
                              )}
                            </Etiqueta>
                          ) : null}
                        </div>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {participante
                            .aluno
                            .matricula ||
                            t(
                              "participant.noRegistration"
                            )}
                        </p>

                        {participante.temAlerta ? (
                          <div className="mt-3 flex flex-wrap gap-2">

                            {ficha
                              ?.possuiAlergia ? (
                              <EtiquetaAlerta>
                                {t(
                                  "indicators.allergy"
                                )}
                              </EtiquetaAlerta>
                            ) : null}

                            {ficha
                              ?.possuiRestricaoAlimentar ? (
                              <EtiquetaAlerta>
                                {t(
                                  "indicators.foodRestriction"
                                )}
                              </EtiquetaAlerta>
                            ) : null}

                            {ficha
                              ?.utilizaMedicacao ? (
                              <EtiquetaAlerta>
                                {t(
                                  "indicators.medication"
                                )}
                              </EtiquetaAlerta>
                            ) : null}

                            {ficha
                              ?.necessitaMedicacaoDuranteAtividade ? (
                              <EtiquetaAlerta>
                                {t(
                                  "indicators.medicationDuringActivity"
                                )}
                              </EtiquetaAlerta>
                            ) : null}

                            {ficha
                              ?.possuiCondicaoSaudeRelevante ? (
                              <EtiquetaAlerta>
                                {t(
                                  "indicators.healthCondition"
                                )}
                              </EtiquetaAlerta>
                            ) : null}

                            {ficha
                              ?.possuiNecessidadeEspecial ? (
                              <EtiquetaAlerta>
                                {t(
                                  "indicators.specialNeed"
                                )}
                              </EtiquetaAlerta>
                            ) : null}

                            {ficha
                              ?.necessitaAcessibilidade ? (
                              <EtiquetaAlerta>
                                {t(
                                  "indicators.accessibility"
                                )}
                              </EtiquetaAlerta>
                            ) : null}

                            {ficha
                              ?.necessitaAcompanhamentoIndividual ? (
                              <EtiquetaAlerta>
                                {t(
                                  "indicators.individualSupport"
                                )}
                              </EtiquetaAlerta>
                            ) : null}
                          </div>
                        ) : ficha ? (
                          <p className="mt-3 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            {t(
                              "participant.noAlerts"
                            )}
                          </p>
                        ) : null}
                      </div>

                      {podeGerenciar ? (
                        <button
                          type="button"
                          onClick={() =>
                            abrirFicha(
                              participante
                            )
                          }
                          className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-black text-blue-700 transition hover:bg-blue-50 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300"
                        >
                          {ficha
                            ? t(
                                "actions.edit"
                              )
                            : t(
                                "actions.fill"
                              )}
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">

      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {titulo}
      </p>

      <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
        {valor}
      </p>
    </div>
  );
}

function Etiqueta({
  children,
  destaque = false,
}: {
  children:
    React.ReactNode;

  destaque?:
    boolean;
}) {
  return (
    <span
      className={
        destaque
          ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
          : "rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
      }
    >
      {children}
    </span>
  );
}

function EtiquetaAlerta({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
      {children}
    </span>
  );
}

function SecaoFormulario({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children:
    React.ReactNode;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-700 sm:p-5">

      <h4 className="font-black text-slate-950 dark:text-white">
        {titulo}
      </h4>

      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {descricao}
      </p>

      <div className="mt-4 space-y-4">
        {children}
      </div>
    </div>
  );
}

function ToggleDetalhe({
  label,
  checked,
  onChange,
  children,
}: {
  label: string;
  checked: boolean;
  onChange:
    (
      valor:
        boolean
    ) => void;

  children?:
    React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">

      <label className="flex items-center gap-3">

        <input
          type="checkbox"
          checked={
            checked
          }
          onChange={(e) =>
            onChange(
              e.target.checked
            )
          }
          className="h-4 w-4"
        />

        <span className="text-sm font-black text-slate-800 dark:text-slate-100">
          {label}
        </span>
      </label>

      {checked &&
      children ? (
        <div className="mt-4">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function CampoInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;

  onChange:
    (
      valor:
        string
    ) => void;
}) {
  return (
    <label className="block">

      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>

      <input
        value={
          value
        }
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />
    </label>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;

  onChange:
    (
      valor:
        string
    ) => void;
}) {
  return (
    <label className="block">

      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>

      <textarea
        rows={3}
        value={
          value
        }
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />
    </label>
  );
}

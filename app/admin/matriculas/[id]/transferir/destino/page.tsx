"use client";

import CursoTurmaTransferencia from "./CursoTurmaTransferencia";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { useLocale, useTranslations } from "next-intl";
import withAuth from "@/lib/withAuth";

type TipoTransferencia =
  | "POLO"
  | "CURSO_TURMA"
  | "INSTITUICAO_PHANYX"
  | "INSTITUICAO_EXTERNA"
  | "REATRIBUICAO_ALUNO";

type Matricula = {
  id: number;
  status?: string | null;
  modalidade?: string | null;
  semestre?: number | null;

  aluno?: {
    id: number;
    nome: string;
    nomeSocial?: string | null;
  } | null;

  instituicao?: {
    id: number;
    nome: string;
  } | null;

  polo?: {
    id: number;
    nome: string;
  } | null;

  curso?: {
    id: number;
    nome: string;
  } | null;

  turmaPrincipal?: {
    id: number;
    nome: string;
  } | null;

  cursoSemestre?: {
    id: number;
    numero: number;
    titulo?: string | null;
  } | null;
};

type PoloOption = {
  id: number;
  nome: string;
  codigo?: string | null;
  ativo?: boolean;
};

type TurmaOption = {
  id: number;
  nome: string;
  cursoId?: number | null;
  semestre?: string | null;
  periodoLetivo?: string | null;
  ativa?: boolean;

  polo?: {
    id: number;
    nome: string;
  } | null;
};

type TransferenciaPendente = {
  id: number;
  tipo: string;
  status: string;

  dataTransferencia?: string | null;

  motivo?: string | null;
  observacoes?: string | null;

  poloOrigemId?: number | null;
  poloOrigemNomeSnapshot?: string | null;

  poloDestinoId?: number | null;
  poloDestinoNomeSnapshot?: string | null;

  turmaOrigemId?: number | null;
  turmaOrigemNomeSnapshot?: string | null;

  turmaDestinoId?: number | null;
  turmaDestinoNomeSnapshot?: string | null;

  cursoDestinoId?: number | null;
  cursoDestinoNomeSnapshot?: string | null;

  itens: Array<{
    id: number;
    itemMatriculaOrigemId: number;
    itemMatriculaDestinoId?: number | null;

    disciplinaId: number;
    disciplinaNomeSnapshot: string;

    situacao: string;
  }>;
};

const TIPOS_VALIDOS: TipoTransferencia[] = [
  "POLO",
  "CURSO_TURMA",
  "INSTITUICAO_PHANYX",
  "INSTITUICAO_EXTERNA",
  "REATRIBUICAO_ALUNO",
];

function DestinoTransferenciaPage() {
  const t =
    useTranslations(
      "AdminTransferenciaMatricula"
    );

  const locale =
    useLocale();

  const router =
    useRouter();

  const params =
    useParams();

  const searchParams =
    useSearchParams();

  const matriculaId =
    Number(params?.id);

  const tipoRecebido =
    searchParams.get("tipo") ?? "";

  const tipo: TipoTransferencia | null =
    TIPOS_VALIDOS.includes(
      tipoRecebido as TipoTransferencia
    )
      ? (tipoRecebido as TipoTransferencia)
      : null;

  const [matricula, setMatricula] =
    useState<Matricula | null>(
      null
    );

  const [polos, setPolos] =
    useState<PoloOption[]>([]);

  const [turmas, setTurmas] =
    useState<TurmaOption[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [
    poloDestinoId,
    setPoloDestinoId,
  ] =
    useState("");

  const [
    turmaDestinoId,
    setTurmaDestinoId,
  ] =
    useState("");

  const [
    motivo,
    setMotivo,
  ] =
    useState("");

  const [
    observacoes,
    setObservacoes,
  ] =
    useState("");

  const [
    revisando,
    setRevisando,
  ] =
    useState(false);

  const [
    transferindo,
    setTransferindo,
  ] =
    useState(false);

  const [
    transferenciaConcluida,
    setTransferenciaConcluida,
  ] =
    useState(false);

  const [
    sucesso,
    setSucesso,
  ] =
    useState("");

  const [
    ultimaTransferenciaConcluida,
    setUltimaTransferenciaConcluida,
  ] =
    useState<{
      id: number;

      tipo: string;
      status: string;

      dataTransferencia:
        string;

      concluidaEm?:
        string | null;

      motivo?:
        string | null;

      poloOrigemNomeSnapshot?:
        string | null;

      poloDestinoNomeSnapshot?:
        string | null;

      turmaOrigemNomeSnapshot?:
        string | null;

      turmaDestinoNomeSnapshot?:
        string | null;

      itens?: Array<{
        situacao:
          string;
      }>;
    } | null>(
      null
    );

  const [
    historicoTransferenciasCarregado,
    setHistoricoTransferenciasCarregado,
  ] =
    useState(false);

  const [
    mostrarFormularioNovaTransferencia,
    setMostrarFormularioNovaTransferencia,
  ] =
    useState(false);

  const [
    transferenciaPendente,
    setTransferenciaPendente,
  ] =
    useState<TransferenciaPendente | null>(
      null
    );

  const [
    turmaAlocacaoId,
    setTurmaAlocacaoId,
  ] =
    useState("");

  const [
    alocandoTurma,
    setAlocandoTurma,
  ] =
    useState(false);

  const [
    alocacaoConcluida,
    setAlocacaoConcluida,
  ] =
    useState(false);

  const [
    erroAlocacao,
    setErroAlocacao,
  ] =
    useState("");

  const [
    sucessoAlocacao,
    setSucessoAlocacao,
  ] =
    useState("");

  const [
    disciplinasFaltantes,
    setDisciplinasFaltantes,
  ] =
    useState<string[]>([]);

  const [
    dataTransferencia,
    setDataTransferencia,
  ] =
    useState(() => {
      const agora = new Date();

      const local =
        new Date(
          agora.getTime() -
          agora.getTimezoneOffset() *
            60000
        );

      return local
        .toISOString()
        .slice(0, 10);
    });

  const dataTransferenciaFormatada =
    useMemo(() => {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
          dataTransferencia
        )
      ) {
        return dataTransferencia;
      }

      const [
        ano,
        mes,
        dia,
      ] =
        dataTransferencia
          .split("-")
          .map(Number);

      const data =
        new Date(
          Date.UTC(
            ano,
            mes - 1,
            dia,
            12
          )
        );

      return new Intl.DateTimeFormat(
        locale
      ).format(data);
    }, [
      dataTransferencia,
      locale,
    ]);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (
        !Number.isInteger(
          matriculaId
        ) ||
        matriculaId <= 0
      ) {
        setErro(
          t(
            "errors.invalidEnrollment"
          )
        );

        setCarregando(false);
        return;
      }

      if (!tipo) {
        setErro(
          t(
            "errors.selectType"
          )
        );

        setCarregando(false);
        return;
      }

      try {
        setCarregando(true);
        setErro("");

        const pedidos: Promise<Response>[] = [
          fetch(
            `/api/admin/matriculas/${matriculaId}`,
            {
              credentials:
                "include",

              cache:
                "no-store",
            }
          ),
        ];

        if (tipo === "POLO") {
          pedidos.push(
            fetch(
              "/api/admin/polos",
              {
                credentials:
                  "include",

                cache:
                  "no-store",
              }
            )
          );

          pedidos.push(
            fetch(
              "/api/admin/turmas",
              {
                credentials:
                  "include",

                cache:
                  "no-store",
              }
            )
          );

          pedidos.push(
            fetch(
              `/api/admin/matriculas/${matriculaId}/transferencias/pendente`,
              {
                credentials:
                  "include",

                cache:
                  "no-store",
              }
            )
          );
        }

        const respostas =
          await Promise.all(
            pedidos
          );

        const resMatricula =
          respostas[0];

        const dadosMatricula =
          await resMatricula
            .json()
            .catch(() => null);

        if (
          !resMatricula.ok ||
          !dadosMatricula
        ) {
          throw new Error(
            dadosMatricula?.error ||
            "Enrollment not found"
          );
        }

        if (!ativo) {
          return;
        }

        setMatricula(
          dadosMatricula
        );

        if (tipo === "POLO") {
          const resPolos =
            respostas[1];

          const resTurmas =
            respostas[2];

          const resPendente =
            respostas[3];

          const dadosPolos =
            await resPolos
              .json()
              .catch(() => null);

          const dadosTurmas =
            await resTurmas
              .json()
              .catch(() => null);

          const dadosPendente =
            await resPendente
              .json()
              .catch(() => null);

          if (!resPolos.ok) {
            throw new Error(
              dadosPolos?.error ||
              "Campus load error"
            );
          }

          if (!resTurmas.ok) {
            throw new Error(
              dadosTurmas?.error ||
              "Class load error"
            );
          }

          if (!resPendente.ok) {
            throw new Error(
              dadosPendente?.error ||
              "Pending transfer load error"
            );
          }

          setTransferenciaPendente(
            dadosPendente?.transferencia ??
            null
          );

          const listaPolos =
            Array.isArray(
              dadosPolos
            )
              ? dadosPolos
              : Array.isArray(
                  dadosPolos?.polos
                )
                ? dadosPolos.polos
                : [];

          setPolos(
            listaPolos
              .map(
                (polo: any) => ({
                  id:
                    Number(
                      polo?.id
                    ),

                  nome:
                    String(
                      polo?.nome ??
                      "Polo"
                    ),

                  codigo:
                    polo?.codigo ??
                    null,

                  ativo:
                    polo?.ativo !==
                    false,
                })
              )
              .filter(
                (
                  polo:
                    PoloOption
                ) =>
                  Number.isInteger(
                    polo.id
                  ) &&
                  polo.id > 0
              )
          );

          setTurmas(
            (
              Array.isArray(
                dadosTurmas
              )
                ? dadosTurmas
                : []
            )
              .map(
                (
                  turma: any
                ) => ({
                  id:
                    Number(
                      turma?.id
                    ),

                  nome:
                    String(
                      turma?.nome ??
                      "Turma"
                    ),

                  cursoId:
                    turma?.cursoId ??
                    turma?.curso
                      ?.id ??
                    null,

                  semestre:
                    turma
                      ?.semestre ??
                    null,

                  periodoLetivo:
                    turma
                      ?.periodoLetivo ??
                    null,

                  ativa:
                    turma?.ativa !==
                    false,

                  polo:
                    turma?.polo
                      ?.id
                      ? {
                          id:
                            Number(
                              turma
                                .polo
                                .id
                            ),

                          nome:
                            String(
                              turma
                                .polo
                                .nome ??
                              "Polo"
                            ),
                        }
                      : null,
                })
              )
              .filter(
                (
                  turma:
                    TurmaOption
                ) =>
                  Number.isInteger(
                    turma.id
                  ) &&
                  turma.id > 0
              )
          );
        }
      } catch (error) {
        console.error(
          "Transfer destination load error:",
          error
        );

        if (ativo) {
          setErro(
            t(
              "errors.load"
            )
          );
        }
      } finally {
        if (ativo) {
          setCarregando(
            false
          );
        }
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [
    matriculaId,
    tipo,
    t,
  ]);

  const polosDestino =
    useMemo(() => {
      const atual =
        matricula?.polo?.id;

      return polos
        .filter(
          (polo) =>
            polo.ativo !==
              false &&
            polo.id !== atual
        )
        .sort(
          (a, b) =>
            a.nome.localeCompare(
              b.nome
            )
        );
    }, [
      polos,
      matricula?.polo?.id,
    ]);

  const turmasDestino =
    useMemo(() => {
      const poloId =
        Number(
          poloDestinoId
        );

      const cursoId =
        matricula?.curso?.id;

      if (
        !Number.isInteger(
          poloId
        ) ||
        poloId <= 0
      ) {
        return [];
      }

      return turmas
        .filter(
          (turma) =>
            turma.ativa !==
              false &&
            Number(
              turma.polo?.id
            ) === poloId &&
            (
              !cursoId ||
              Number(
                turma.cursoId
              ) ===
                Number(
                  cursoId
                )
            )
        )
        .sort(
          (a, b) =>
            a.nome.localeCompare(
              b.nome
            )
        );
    }, [
      turmas,
      poloDestinoId,
      matricula?.curso?.id,
    ]);

  const poloDestino =
    polosDestino.find(
      (polo) =>
        polo.id ===
        Number(
          poloDestinoId
        )
    ) ?? null;

  const turmaDestino =
    turmasDestino.find(
      (turma) =>
        turma.id ===
        Number(
          turmaDestinoId
        )
    ) ?? null;

  /* LAST_TRANSFER_EFFECT_INSTALLED */
  useEffect(() => {
    let ativo = true;

    async function carregarUltimaTransferencia() {
      try {
        const resposta =
          await fetch(
            `/api/admin/matriculas/${matriculaId}/transferencias`,
            {
              credentials:
                "include",

              cache:
                "no-store",
            }
          );

        const dados =
          await resposta
            .json()
            .catch(
              () => null
            );

        if (
          !resposta.ok ||
          !dados?.success
        ) {
          throw new Error(
            "LAST_TRANSFER_LOAD_ERROR"
          );
        }

        if (!ativo) {
          return;
        }

        const lista =
          Array.isArray(
            dados?.transferencias
          )
            ? dados.transferencias
            : [];

        const ultima =
          lista.find(
            (item) =>
              item?.status ===
              "CONCLUIDA"
          ) ?? null;

        setUltimaTransferenciaConcluida(
          ultima
        );

        /*
         * Se nunca houve transferencia
         * concluida, abre o formulario
         * normalmente.
         */
        if (!ultima) {
          setMostrarFormularioNovaTransferencia(
            true
          );
        }
      } catch (error) {
        console.error(
          "Last transfer load error:",
          error
        );

        /*
         * Problema no historico nao deve
         * impedir o administrador de
         * trabalhar.
         */
        if (ativo) {
          setMostrarFormularioNovaTransferencia(
            true
          );
        }
      } finally {
        if (ativo) {
          setHistoricoTransferenciasCarregado(
            true
          );
        }
      }
    }

    if (
      Number.isInteger(
        matriculaId
      ) &&
      matriculaId > 0
    ) {
      void carregarUltimaTransferencia();
    }

    return () => {
      ativo = false;
    };
  }, [
    matriculaId,
  ]);

  const turmasAlocacao =
    useMemo(() => {
      if (
        !transferenciaPendente
          ?.poloDestinoId
      ) {
        return [];
      }

      const poloId =
        Number(
          transferenciaPendente
            .poloDestinoId
        );

      const cursoId =
        transferenciaPendente
          .cursoDestinoId ??
        matricula?.curso?.id ??
        null;

      return turmas
        .filter(
          (turma) =>
            turma.ativa !==
              false &&
            Number(
              turma.polo?.id
            ) === poloId &&
            (
              !cursoId ||
              Number(
                turma.cursoId
              ) ===
                Number(
                  cursoId
                )
            )
        )
        .sort(
          (a, b) =>
            a.nome.localeCompare(
              b.nome
            )
        );
    }, [
      turmas,
      transferenciaPendente,
      matricula?.curso?.id,
    ]);

  function revisar() {
    setErro("");

    if (!poloDestinoId) {
      setErro(
        t(
          "campusTransfer.errors.selectCampus"
        )
      );

      return;
    }

    if (!dataTransferencia) {
      setErro(
        t(
          "campusTransfer.errors.date"
        )
      );

      return;
    }

    if (
      motivo
        .trim()
        .length < 3
    ) {
      setErro(
        t(
          "campusTransfer.errors.reason"
        )
      );

      return;
    }

    setRevisando(true);
  }

  async function confirmarTransferencia() {
    if (
      transferindo ||
      transferenciaConcluida
    ) {
      return;
    }

    if (
      tipo !== "POLO" ||
      !poloDestinoId
    ) {
      return;
    }

    try {
      setTransferindo(true);
      setErro("");
      setSucesso("");

      const resposta =
        await fetch(
          `/api/admin/matriculas/${matriculaId}/transferencias`,
          {
            method: "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              tipo: "POLO",

              poloDestinoId:
                Number(
                  poloDestinoId
                ),

              turmaDestinoId:
                turmaDestinoId
                  ? Number(
                      turmaDestinoId
                    )
                  : null,

              dataTransferencia,

              motivo:
                motivo.trim(),

              observacoes:
                observacoes.trim() ||
                null,
            }),
          }
        );

      const dados =
        await resposta
          .json()
          .catch(
            () => null
          );

      if (
        !resposta.ok ||
        !dados?.success
      ) {
        console.error(
          "Transfer confirmation error:",
          dados
        );

        throw new Error(
          dados?.codigo ||
          "TRANSFERENCIA_NAO_CONCLUIDA"
        );
      }

      const possuiPendencia =
        Boolean(
          dados?.resumo
            ?.possuiPendencia
        );

      setTransferenciaConcluida(
        true
      );

      setSucesso(
        t(
          possuiPendencia
            ? "campusTransfer.review.successPending"
            : "campusTransfer.review.success"
        )
      );
    } catch (error) {
      console.error(
        "Transfer confirmation error:",
        error
      );

      setErro(
        t(
          "campusTransfer.errors.confirm"
        )
      );
    } finally {
      setTransferindo(false);
    }
  }

  async function alocarTransferenciaPendente() {
    if (
      !transferenciaPendente ||
      !turmaAlocacaoId ||
      alocandoTurma ||
      alocacaoConcluida
    ) {
      return;
    }

    try {
      setAlocandoTurma(true);

      setErroAlocacao("");
      setSucessoAlocacao("");
      setDisciplinasFaltantes([]);

      const resposta =
        await fetch(
          `/api/admin/matriculas/${matriculaId}/transferencias/${transferenciaPendente.id}/alocar-turma`,
          {
            method: "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              turmaDestinoId:
                Number(
                  turmaAlocacaoId
                ),
            }),
          }
        );

      const dados =
        await resposta
          .json()
          .catch(() => null);

      if (
        !resposta.ok ||
        !dados?.success
      ) {
        if (
          dados?.codigo ===
          "TURMA_INCOMPATIVEL"
        ) {
          const faltantes =
            Array.isArray(
              dados?.detalhes
                ?.disciplinasFaltantes
            )
              ? dados.detalhes
                  .disciplinasFaltantes
                  .map(
                    (item: any) =>
                      String(
                        item?.nome ??
                        ""
                      ).trim()
                  )
                  .filter(Boolean)
              : [];

          setDisciplinasFaltantes(
            faltantes
          );

          setErroAlocacao(
            t(
              "campusTransfer.pendingTransfer.errors.incompatible"
            )
          );

          return;
        }

        console.error(
          "Pending transfer allocation error:",
          dados
        );

        setErroAlocacao(
          t(
            "campusTransfer.pendingTransfer.errors.allocate"
          )
        );

        return;
      }

      setAlocacaoConcluida(
        true
      );

      setSucessoAlocacao(
        t(
          "campusTransfer.pendingTransfer.success"
        )
      );

      setMatricula(
        (atual) =>
          atual
            ? {
                ...atual,

                status:
                  dados?.matricula
                    ?.status ??
                  "ATIVA",

                turmaPrincipal:
                  turmasAlocacao
                    .find(
                      (turma) =>
                        turma.id ===
                        Number(
                          turmaAlocacaoId
                        )
                    )
                    ? {
                        id:
                          Number(
                            turmaAlocacaoId
                          ),

                        nome:
                          turmasAlocacao.find(
                            (turma) =>
                              turma.id ===
                              Number(
                                turmaAlocacaoId
                              )
                          )?.nome ??
                          "Turma",
                      }
                    : atual
                        .turmaPrincipal,
              }
            : atual
      );
    } catch (error) {
      console.error(
        "Pending transfer allocation error:",
        error
      );

      setErroAlocacao(
        t(
          "campusTransfer.pendingTransfer.errors.allocate"
        )
      );
    } finally {
      setAlocandoTurma(false);
    }
  }

  if (carregando) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-950">
          {t("loading")}
        </div>
      </div>
    );
  }

  if (
    tipo === "POLO" &&
    transferenciaPendente &&
    matricula
  ) {
    const quantidadePendentes =
      transferenciaPendente
        .itens
        .filter(
          (item) =>
            item.situacao !==
            "MIGRADO"
        )
        .length;

    return (
      <div
        data-testid="pending-transfer-panel"
        className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6"
      >
        <div>
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/matriculas"
              )
            }
            className="mb-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            {"<- "}
            {t("back")}
          </button>

          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
            {t(
              "campusTransfer.pendingTransfer.title"
            )}
          </h1>

          <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300">
            {t(
              "campusTransfer.pendingTransfer.description"
            )}
          </p>
        </div>

        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm dark:border-amber-800 dark:bg-amber-950/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                {t(
                  "campusTransfer.pendingTransfer.status"
                )}
              </div>

              <div className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                {
                  transferenciaPendente
                    .poloOrigemNomeSnapshot ??
                  "-"
                }
                {" -> "}
                {
                  transferenciaPendente
                    .poloDestinoNomeSnapshot ??
                  "-"
                }
              </div>
            </div>

            <div className="rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-neutral-900 dark:text-amber-200">
              {quantidadePendentes}{" "}
              {t(
                "campusTransfer.pendingTransfer.pendingSubjects"
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Info
              label={t(
                "campusTransfer.pendingTransfer.origin"
              )}
              value={
                transferenciaPendente
                  .poloOrigemNomeSnapshot ||
                "-"
              }
            />

            <Info
              label={t(
                "campusTransfer.pendingTransfer.destination"
              )}
              value={
                transferenciaPendente
                  .poloDestinoNomeSnapshot ||
                "-"
              }
            />

            <Info
              label={t(
                "campusTransfer.pendingTransfer.course"
              )}
              value={
                transferenciaPendente
                  .cursoDestinoNomeSnapshot ||
                matricula.curso?.nome ||
                "-"
              }
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-950">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            {t(
              "campusTransfer.pendingTransfer.allocateTitle"
            )}
          </h2>

          <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">
            {t(
              "campusTransfer.pendingTransfer.allocateHelp"
            )}
          </p>

          <div className="mt-5">
            <Campo
              label={t(
                "campusTransfer.pendingTransfer.class"
              )}
            >
              <SelectCinza
                value={
                  turmaAlocacaoId
                }
                disabled={
                  alocandoTurma ||
                  alocacaoConcluida ||
                  turmasAlocacao.length ===
                    0
                }
                placeholder={t(
                  "campusTransfer.pendingTransfer.selectClass"
                )}
                options={
                  turmasAlocacao.map(
                    (turma) => ({
                      value:
                        String(
                          turma.id
                        ),
                      label:
                        turma.nome,
                    })
                  )
                }
                onChange={(
                  value
                ) => {
                  setTurmaAlocacaoId(
                    value
                  );

                  setErroAlocacao(
                    ""
                  );

                  setDisciplinasFaltantes(
                    []
                  );
                }}
              />
            </Campo>
          </div>

          {turmasAlocacao.length ===
            0 && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
              {t(
                "campusTransfer.pendingTransfer.noClasses"
              )}
            </div>
          )}

          {erroAlocacao && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
            >
              <div>
                {erroAlocacao}
              </div>

              {disciplinasFaltantes.length >
                0 && (
                <div className="mt-3">
                  <div className="font-semibold">
                    {t(
                      "campusTransfer.pendingTransfer.missingSubjects"
                    )}
                  </div>

                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {disciplinasFaltantes.map(
                      (
                        disciplina
                      ) => (
                        <li
                          key={
                            disciplina
                          }
                        >
                          {
                            disciplina
                          }
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {sucessoAlocacao && (
            <div
              role="status"
              className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
            >
              {sucessoAlocacao}
            </div>
          )}

          <div className="mt-5 flex justify-end gap-3">
            {alocacaoConcluida && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/admin/matriculas"
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
              >
                {t(
                  "campusTransfer.pendingTransfer.back"
                )}
              </button>
            )}

            <button
              type="button"
              disabled={
                !turmaAlocacaoId ||
                alocandoTurma ||
                alocacaoConcluida
              }
              onClick={
                alocarTransferenciaPendente
              }
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:opacity-70"
            >
              {alocandoTurma
                ? t(
                    "campusTransfer.pendingTransfer.allocating"
                  )
                : alocacaoConcluida
                  ? t(
                      "campusTransfer.pendingTransfer.allocated"
                    )
                  : t(
                      "campusTransfer.pendingTransfer.allocate"
                    )}
            </button>
          </div>
        </section>
      </div>
    );
  }

  /* COURSE_CLASS_TRANSFER_PAGE */
  if (
    tipo === "CURSO_TURMA" &&
    matricula &&
    !transferenciaPendente
  ) {
    return (
      <CursoTurmaTransferencia
        matriculaId={
          matriculaId
        }
      />
    );
  }

  if (
    tipo === "POLO" &&
    matricula &&
    !transferenciaPendente &&
    !historicoTransferenciasCarregado
  ) {
    return (
      <div className="mx-auto max-w-6xl p-6 text-slate-600 dark:text-neutral-300">
        {t(
          "campusTransfer.lastTransfer.loading"
        )}
      </div>
    );
  }

  if (
    tipo === "POLO" &&
    matricula &&
    !transferenciaPendente &&
    ultimaTransferenciaConcluida &&
    !mostrarFormularioNovaTransferencia
  ) {
    const referenciaData =
      ultimaTransferenciaConcluida
        .concluidaEm ||
      ultimaTransferenciaConcluida
        .dataTransferencia;

    const dataUltima =
      new Date(
        referenciaData
      );

    const dataFormatada =
      Number.isNaN(
        dataUltima.getTime()
      )
        ? "-"
        : new Intl.DateTimeFormat(
            locale,
            ultimaTransferenciaConcluida
              .concluidaEm
              ? {
                  dateStyle:
                    "short",

                  timeStyle:
                    "short",
                }
              : {
                  dateStyle:
                    "short",
                }
          ).format(
            dataUltima
          );

    const quantidadeMigrada =
      Array.isArray(
        ultimaTransferenciaConcluida
          .itens
      )
        ? ultimaTransferenciaConcluida
            .itens
            .filter(
              (item) =>
                item.situacao ===
                "MIGRADO"
            )
            .length
        : 0;

    return (
      <div
        data-testid="last-transfer-panel"
        className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6"
      >
        <div>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/admin/matriculas/${matriculaId}/transferir`
              )
            }
            className="mb-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
          >
            {"<- "}
            {t(
              "campusTransfer.lastTransfer.back"
            )}
          </button>

          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
            {t(
              "campusTransfer.lastTransfer.title"
            )}
          </h1>

          <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300">
            {t(
              "campusTransfer.lastTransfer.description"
            )}
          </p>
        </div>

        <section className="overflow-hidden rounded-2xl border border-emerald-300 bg-white shadow-sm dark:border-emerald-800 dark:bg-neutral-950">
          <div className="border-b border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  {t(
                    "campusTransfer.lastTransfer.completed"
                  )}
                </div>

                <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">
                  {
                    ultimaTransferenciaConcluida
                      .poloOrigemNomeSnapshot ||
                    "-"
                  }

                  {" \u2192 "}

                  {
                    ultimaTransferenciaConcluida
                      .poloDestinoNomeSnapshot ||
                    "-"
                  }
                </h2>

                <div className="mt-2 text-sm text-slate-600 dark:text-neutral-300">
                  {dataFormatada}
                </div>
              </div>

              <div className="inline-flex w-fit rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-700 dark:bg-neutral-900 dark:text-emerald-200">
                {t(
                  "campusTransfer.lastTransfer.statusCompleted"
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Info
                label={t(
                  "campusTransfer.lastTransfer.originClass"
                )}
                value={
                  ultimaTransferenciaConcluida
                    .turmaOrigemNomeSnapshot ||
                  "-"
                }
              />

              <Info
                label={t(
                  "campusTransfer.lastTransfer.destinationClass"
                )}
                value={
                  ultimaTransferenciaConcluida
                    .turmaDestinoNomeSnapshot ||
                  "-"
                }
              />

              <Info
                label={t(
                  "campusTransfer.lastTransfer.migratedSubjects"
                )}
                value={
                  quantidadeMigrada
                }
              />

              <Info
                label={t(
                  "campusTransfer.lastTransfer.currentCampus"
                )}
                value={
                  matricula.polo
                    ?.nome ||
                  "-"
                }
              />
            </div>

            <Info
              label={t(
                "campusTransfer.lastTransfer.reason"
              )}
              value={
                ultimaTransferenciaConcluida
                  .motivo ||
                "-"
              }
            />

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  window.open(
                    `/admin/matriculas/${matriculaId}/transferencias`,
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
              >
                {t(
                  "campusTransfer.lastTransfer.viewHistory"
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setMostrarFormularioNovaTransferencia(
                    true
                  )
                }
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {t(
                  "campusTransfer.lastTransfer.startNew"
                )}
              </button>
            </div>
          </div>
        </section>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
          {t(
            "campusTransfer.lastTransfer.notice"
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <button
          type="button"
          onClick={() =>
            router.push(
              `/admin/matriculas/${matriculaId}/transferir`
            )
          }
          className="mb-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
        >
          {"<- "}
          {t("back")}
        </button>

        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
          {tipo === "POLO"
            ? t(
                "campusTransfer.title"
              )
            : t("next.title")}
        </h1>
      </div>

      {erro && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          {erro}
        </div>
      )}

      {matricula && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">
            {t(
              "origin.title"
            )}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info
              label={t(
                "origin.student"
              )}
              value={
                matricula.aluno
                  ?.nomeSocial ||
                matricula.aluno
                  ?.nome ||
                "-"
              }
            />

            <Info
              label={t(
                "origin.institution"
              )}
              value={
                matricula
                  .instituicao
                  ?.nome ||
                "-"
              }
            />

            <Info
              label={t(
                "origin.campus"
              )}
              value={
                matricula.polo
                  ?.nome ||
                "-"
              }
            />

            <Info
              label={t(
                "origin.course"
              )}
              value={
                matricula.curso
                  ?.nome ||
                "-"
              }
            />
          </div>
        </section>
      )}

      {tipo === "POLO" &&
        matricula && (
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t(
                "campusTransfer.description"
              )}
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Campo
                label={t(
                  "campusTransfer.currentCampus"
                )}
              >
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
                  {matricula
                    .polo
                    ?.nome ||
                    "-"}
                </div>
              </Campo>

              <Campo
                label={t(
                  "campusTransfer.destinationCampus"
                )}
              >
                <SelectCinza
                  value={
                    poloDestinoId
                  }
                  placeholder={t(
                    "campusTransfer.selectCampus"
                  )}
                  options={polosDestino.map(
                    (polo) => ({
                      value: String(
                        polo.id
                      ),
                      label: polo.nome,
                    })
                  )}
                  onChange={(
                    value
                  ) => {
                    setPoloDestinoId(
                      value
                    );

                    setTurmaDestinoId(
                      ""
                    );

                    setRevisando(
                      false
                    );
                  }}
                />

                {polosDestino.length ===
                  0 && (
                  <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                    {t(
                      "campusTransfer.noOtherCampuses"
                    )}
                  </p>
                )}
              </Campo>

              <Campo
                label={t(
                  "campusTransfer.course"
                )}
              >
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
                  {matricula
                    .curso
                    ?.nome ||
                    "-"}
                </div>
              </Campo>

              <Campo
                label={t(
                  "campusTransfer.destinationClass"
                )}
              >
                <SelectCinza
                  value={
                    turmaDestinoId
                  }
                  disabled={
                    !poloDestinoId
                  }
                  placeholder={t(
                    "campusTransfer.awaitingClass"
                  )}
                  options={turmasDestino.map(
                    (turma) => ({
                      value: String(
                        turma.id
                      ),
                      label: turma.nome,
                    })
                  )}
                  onChange={(
                    value
                  ) => {
                    setTurmaDestinoId(
                      value
                    );

                    setRevisando(
                      false
                    );
                  }}
                />
              </Campo>

              <Campo
                label={t(
                  "campusTransfer.transferDate"
                )}
              >
                <input
                  type="date"
                  value={
                    dataTransferencia
                  }
                  onChange={(
                    event
                  ) => {
                    setDataTransferencia(
                      event.target
                        .value
                    );

                    setRevisando(
                      false
                    );
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </Campo>

              <Campo
                label={t(
                  "campusTransfer.reason"
                )}
              >
                <input
                  value={motivo}
                  onChange={(
                    event
                  ) => {
                    setMotivo(
                      event.target
                        .value
                    );

                    setRevisando(
                      false
                    );
                  }}
                  placeholder={t(
                    "campusTransfer.reasonPlaceholder"
                  )}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </Campo>
            </div>

            <Campo
              label={t(
                "campusTransfer.notes"
              )}
            >
              <textarea
                rows={4}
                value={observacoes}
                onChange={(
                  event
                ) => {
                  setObservacoes(
                    event.target
                      .value
                  );

                  setRevisando(
                    false
                  );
                }}
                placeholder={t(
                  "campusTransfer.notesPlaceholder"
                )}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </Campo>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={
                  revisar
                }
                className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700"
              >
                {t(
                  "campusTransfer.reviewButton"
                )}
                {" ->"}
              </button>
            </div>

            {revisando &&
              poloDestino && (
                <div className="space-y-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-5 dark:border-cyan-900 dark:bg-cyan-950/20">
                  <h3 className="font-semibold text-slate-950 dark:text-white">
                    {t(
                      "campusTransfer.review.title"
                    )}
                  </h3>

                  <div className="grid gap-3 md:grid-cols-3">
                    <Info
                      label={t(
                        "campusTransfer.review.origin"
                      )}
                      value={
                        matricula
                          .polo
                          ?.nome ||
                        "-"
                      }
                    />

                    <Info
                      label={t(
                        "campusTransfer.review.destination"
                      )}
                      value={
                        poloDestino.nome
                      }
                    />

                    <Info
                      label={t(
                        "campusTransfer.review.class"
                      )}
                      value={
                        turmaDestino
                          ?.nome ||
                        t(
                          "campusTransfer.awaitingClass"
                        )
                      }
                    />

                    <Info
                      label={t(
                        "campusTransfer.review.date"
                      )}
                      value={
                        dataTransferenciaFormatada
                      }
                    />

                    <Info
                      label={t(
                        "campusTransfer.review.reason"
                      )}
                      value={
                        motivo
                      }
                    />
                  </div>

                  {observacoes.trim() && (
                    <div className="rounded-xl border border-cyan-200 bg-white p-4 text-sm dark:border-cyan-900 dark:bg-slate-950">
                      {
                        observacoes
                      }
                    </div>
                  )}

                  <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    {t(
                      "campusTransfer.review.pending"
                    )}
                  </div>

                  {sucesso && (
                    <div
                      role="status"
                      className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                    >
                      {sucesso}
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      disabled={
                        transferindo ||
                        transferenciaConcluida
                      }
                      onClick={() =>
                        setRevisando(
                          false
                        )
                      }
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white"
                    >
                      {t(
                        "campusTransfer.review.edit"
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={
                        transferindo ||
                        transferenciaConcluida
                      }
                      onClick={
                        confirmarTransferencia
                      }
                      className={[
                        "rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition",
                        "bg-blue-600 hover:bg-blue-700",
                        "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2",
                        "disabled:cursor-not-allowed disabled:bg-slate-400 disabled:opacity-70",
                        "dark:focus:ring-offset-neutral-950",
                      ].join(" ")}
                    >
                      {transferindo
                        ? t(
                            "campusTransfer.review.confirming"
                          )
                        : transferenciaConcluida
                          ? t(
                              "campusTransfer.review.confirmed"
                            )
                          : t(
                              "campusTransfer.review.confirm"
                            )}
                    </button>
                  </div>
                </div>
              )}
          </section>
        )}

      {tipo &&
        tipo !== "POLO" && (
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/30">
            <h2 className="font-semibold text-blue-950 dark:text-blue-100">
              {t(
                "next.title"
              )}
            </h2>

            <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
              {t(
                `next.${tipo}`
              )}
            </p>
          </section>
        )}
    </div>
  );
}


type SelectCinzaOption = {
  value: string;
  label: string;
};

function SelectCinza({
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
}: {
  value: string;
  options: SelectCinzaOption[];
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [aberto, setAberto] =
    useState(false);

  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const selecionada =
    options.find(
      (option) =>
        option.value === value
    ) ?? null;

  useEffect(() => {
    function fecharAoClicarFora(
      event: MouseEvent
    ) {
      const alvo =
        event.target as Node;

      if (
        containerRef.current &&
        !containerRef.current.contains(
          alvo
        )
      ) {
        setAberto(false);
      }
    }

    document.addEventListener(
      "mousedown",
      fecharAoClicarFora
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        fecharAoClicarFora
      );
    };
  }, []);

  useEffect(() => {
    if (disabled) {
      setAberto(false);
    }
  }, [disabled]);

  function selecionar(
    novoValor: string
  ) {
    onChange(novoValor);
    setAberto(false);
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onKeyDown={(event) => {
        if (
          event.key === "Escape"
        ) {
          setAberto(false);
        }
      }}
    >
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() =>
          setAberto(
            (atual) => !atual
          )
        }
        className={[
          "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left outline-none transition",

          // CLARO
          "border-slate-300 bg-white text-slate-950",
          "hover:bg-slate-50",
          "focus:border-slate-500 focus:ring-2 focus:ring-slate-200",

          // ESCURO / SISTEMA
          "dark:border-neutral-600",
          "dark:bg-neutral-900",
          "dark:text-white",
          "dark:hover:bg-neutral-800",
          "dark:focus:border-neutral-500",
          "dark:focus:ring-neutral-700",

          "disabled:cursor-not-allowed disabled:opacity-50",
        ].join(" ")}
      >
        <span
          className={
            selecionada
              ? "text-slate-950 dark:text-white"
              : "text-slate-500 dark:text-neutral-400"
          }
        >
          {selecionada?.label ??
            placeholder}
        </span>

        <span
          aria-hidden="true"
          className={[
            "shrink-0 text-sm transition-transform",
            "text-slate-500 dark:text-neutral-400",
            aberto
              ? "rotate-180"
              : "",
          ].join(" ")}
        >
          ▼
        </span>
      </button>

      {aberto && !disabled && (
        <div
          role="listbox"
          className={[
            "absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border p-1 shadow-xl",

            // CLARO
            "border-slate-300 bg-white",

            // ESCURO / SISTEMA
            "dark:border-neutral-600 dark:bg-neutral-900",
          ].join(" ")}
        >
          <button
            type="button"
            role="option"
            aria-selected={
              value === ""
            }
            onClick={() =>
              selecionar("")
            }
            className={[
              "w-full rounded-lg px-3 py-2.5 text-left text-sm transition",

              value === ""
                ? [
                    // SELECIONADO - CLARO
                    "bg-slate-200 font-medium text-slate-950",

                    // SELECIONADO - ESCURO/SISTEMA
                    "dark:bg-neutral-700 dark:text-white",
                  ].join(" ")
                : [
                    // NORMAL - CLARO
                    "text-slate-700 hover:bg-slate-100",

                    // NORMAL - ESCURO/SISTEMA
                    "dark:text-neutral-100 dark:hover:bg-neutral-800",
                  ].join(" "),
            ].join(" ")}
          >
            {placeholder}
          </button>

          {options.map(
            (option) => {
              const ativa =
                option.value ===
                value;

              return (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  role="option"
                  aria-selected={
                    ativa
                  }
                  onClick={() =>
                    selecionar(
                      option.value
                    )
                  }
                  className={[
                    "mt-1 flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",

                    ativa
                      ? [
                          // SELECIONADO - CLARO
                          "bg-slate-200 font-medium text-slate-950",

                          // SELECIONADO - ESCURO/SISTEMA
                          "dark:bg-neutral-700 dark:text-white",
                        ].join(" ")
                      : [
                          // NORMAL - CLARO
                          "text-slate-700 hover:bg-slate-100",

                          // NORMAL - ESCURO/SISTEMA
                          "dark:text-neutral-100 dark:hover:bg-neutral-800",
                        ].join(" "),
                  ].join(" ")}
                >
                  <span>
                    {option.label}
                  </span>

                  {ativa && (
                    <span
                      aria-hidden="true"
                      className="text-slate-500 dark:text-neutral-300"
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children:
    React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </div>

      {children}
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value:
    string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>

      <div className="mt-1 font-medium text-slate-950 dark:text-white">
        {value}
      </div>
    </div>
  );
}

export default withAuth(
  DestinoTransferenciaPage,
  ["admin"]
);

"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useLocale,
  useTranslations,
} from "next-intl";
import withAuth from "@/lib/withAuth";
import PhanyxToast from "@/components/ui/PhanyxToast";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";

type Cancelamento = {
  id: number;
  numeroProtocolo: string;
  status:
    | "RASCUNHO"
    | "FINALIZADO"
    | "CANCELADO";
  statusAnterior: string;
  motivo: string;
  observacoes?: string | null;
  dataSolicitacao: string;
  dataEfetiva: string;
  regraContratual?: string | null;
  baseCalculoMulta?: string | number | null;
  percentualMulta?: string | number | null;
  valorParcelasVencidas?: string | number | null;
  valorMulta?: string | number | null;
  valorJuros?: string | number | null;
  valorCredito?: string | number | null;
  valorDevolucao?: string | number | null;
  valorTotal?: string | number | null;
  situacaoFinanceira?: string | null;
  registradoPorNomeSnapshot?: string | null;
  finalizadoPorNomeSnapshot?: string | null;
  finalizadoEm?: string | null;
  criadoEm: string;
  _count?: {
    documentosGerados: number;
  };
};

type Dados = {
  success: boolean;
  matricula: {
    id: number;
    numeroMatricula?: string | null;
    status?: string | null;
    aluno?: {
      id: number;
      nome: string;
      cpf?: string | null;
    } | null;
    curso?: {
      id: number;
      nome: string;
    } | null;
    polo?: {
      id: number;
      nome: string;
    } | null;
    turmaPrincipal?: {
      id: number;
      nome: string;
    } | null;
    instituicao?: {
      id: number;
      nome: string;
    } | null;
  };
  rascunho: Cancelamento | null;
  cancelamentos: Cancelamento[];
};

type Template = {
  id: number;
  nome: string;
  tipo: string;
};

function hoje() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function inputData(
  valor?: string | null
) {
  return valor
    ? valor.slice(0, 10)
    : "";
}

function inputNumero(
  valor:
    | string
    | number
    | null
    | undefined
) {
  const n = Number(valor);
  return Number.isFinite(n)
    ? String(n)
    : "";
}

function AdminCancelamentoMatriculaPage() {
  const t =
    useTranslations(
      "AdminCancelamentoMatricula"
    );
  const tMatricula =
    useTranslations(
      "AdminMatriculasQuarentena"
    );
  const locale =
    useLocale();
  const params =
    useParams();
  const raw =
    Array.isArray(params?.id)
      ? params.id[0]
      : params?.id;
  const matriculaId =
    Number(raw);

  const [dados, setDados] =
    useState<Dados | null>(null);
  const [loading, setLoading] =
    useState(true);
  const [erro, setErro] =
    useState("");
  const [toast, setToast] =
    useState<{
      tipo:
        | "sucesso"
        | "erro"
        | "aviso"
        | "info";
      mensagem: string;
    } | null>(null);
  const [processando, setProcessando] =
    useState<
      "salvar"
      | "finalizar"
      | null
    >(null);
  const [confirmar, setConfirmar] =
    useState(false);

  const [motivo, setMotivo] =
    useState("");
  const [
    dataSolicitacao,
    setDataSolicitacao,
  ] = useState(hoje());
  const [
    dataEfetiva,
    setDataEfetiva,
  ] = useState(hoje());
  const [
    regraContratual,
    setRegraContratual,
  ] = useState("");
  const [
    baseCalculoMulta,
    setBaseCalculoMulta,
  ] = useState("");
  const [
    percentualMulta,
    setPercentualMulta,
  ] = useState("");
  const [
    valorParcelasVencidas,
    setValorParcelasVencidas,
  ] = useState("");
  const [
    valorMulta,
    setValorMulta,
  ] = useState("");
  const [
    valorJuros,
    setValorJuros,
  ] = useState("");
  const [
    valorCredito,
    setValorCredito,
  ] = useState("");
  const [
    valorDevolucao,
    setValorDevolucao,
  ] = useState("");
  const [
    situacaoFinanceira,
    setSituacaoFinanceira,
  ] = useState("PENDENTE");
  const [
    observacoes,
    setObservacoes,
  ] = useState("");

  const [templates, setTemplates] =
    useState<Template[]>([]);
  const [
    templateId,
    setTemplateId,
  ] = useState("");
  const [
    gerandoDocumento,
    setGerandoDocumento,
  ] = useState(false);
  const [
    documentoId,
    setDocumentoId,
  ] = useState<number | null>(null);

  const rascunho =
    dados?.rascunho || null;

  const finalizado =
    useMemo(
      () =>
        dados?.cancelamentos.find(
          (item) =>
            item.status ===
            "FINALIZADO"
        ) || null,
      [dados?.cancelamentos]
    );

  const processo =
    rascunho || finalizado;

  const somenteLeitura =
    dados?.matricula.status ===
      "CANCELADA" &&
    !rascunho;

  const total =
    useMemo(() => {
      const n =
        (v: string) => {
          const x = Number(v || 0);
          return Number.isFinite(x)
            ? x
            : 0;
        };
      return Math.max(
        0,
        n(valorParcelasVencidas) +
          n(valorMulta) +
          n(valorJuros) -
          n(valorCredito)
      );
    }, [
      valorParcelasVencidas,
      valorMulta,
      valorJuros,
      valorCredito,
    ]);

  function preencher(
    item: Cancelamento | null
  ) {
    if (!item) {
      setMotivo("");
      setDataSolicitacao(hoje());
      setDataEfetiva(hoje());
      setRegraContratual("");
      setBaseCalculoMulta("");
      setPercentualMulta("");
      setValorParcelasVencidas("");
      setValorMulta("");
      setValorJuros("");
      setValorCredito("");
      setValorDevolucao("");
      setSituacaoFinanceira(
        "PENDENTE"
      );
      setObservacoes("");
      return;
    }

    setMotivo(item.motivo || "");
    setDataSolicitacao(
      inputData(item.dataSolicitacao)
    );
    setDataEfetiva(
      inputData(item.dataEfetiva)
    );
    setRegraContratual(
      item.regraContratual || ""
    );
    setBaseCalculoMulta(
      inputNumero(
        item.baseCalculoMulta
      )
    );
    setPercentualMulta(
      inputNumero(
        item.percentualMulta
      )
    );
    setValorParcelasVencidas(
      inputNumero(
        item.valorParcelasVencidas
      )
    );
    setValorMulta(
      inputNumero(item.valorMulta)
    );
    setValorJuros(
      inputNumero(item.valorJuros)
    );
    setValorCredito(
      inputNumero(item.valorCredito)
    );
    setValorDevolucao(
      inputNumero(item.valorDevolucao)
    );
    setSituacaoFinanceira(
      item.situacaoFinanceira ||
      "PENDENTE"
    );
    setObservacoes(
      item.observacoes || ""
    );
  }

  async function carregar(
    full = true
  ) {
    if (
      !Number.isInteger(matriculaId) ||
      matriculaId <= 0
    ) {
      setErro(t("errors.load"));
      setLoading(false);
      return;
    }

    if (full) setLoading(true);
    setErro("");

    try {
      const res =
        await fetch(
          `/api/admin/matriculas/${matriculaId}/cancelamento`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

      const payload =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        throw new Error(
          payload?.error ||
          t("errors.load")
        );
      }

      const final =
        payload as Dados;

      setDados(final);

      preencher(
        final.rascunho ||
          final.cancelamentos.find(
            (item) =>
              item.status ===
              "FINALIZADO"
          ) ||
          null
      );
    } catch (e) {
      console.error(e);
      setErro(t("errors.load"));
    } finally {
      if (full) setLoading(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, [matriculaId]);

  useEffect(() => {
    let ativo = true;

    async function carregarTemplates() {
      if (!processo) {
        setTemplates([]);
        setTemplateId("");
        return;
      }

      try {
        const res =
          await fetch(
            "/api/admin/documentos/templates?somenteAtivos=1",
            {
              credentials:
                "include",
              cache:
                "no-store",
            }
          );

        const payload =
          await res
            .json()
            .catch(() => null);

        if (
          !res.ok ||
          !Array.isArray(payload)
        ) {
          throw new Error();
        }

        const filtrados =
          payload
            .filter(
              (item: any) =>
                String(
                  item?.tipo || ""
                )
                  .toUpperCase() ===
                "CANCELAMENTO_MATRICULA"
            )
            .map(
              (item: any) => ({
                id:
                  Number(item.id),
                nome:
                  String(item.nome || ""),
                tipo:
                  String(item.tipo || ""),
              })
            )
            .filter(
              (item: Template) =>
                item.id > 0 &&
                item.nome
            );

        if (!ativo) return;

        setTemplates(filtrados);

        setTemplateId(
          (atual) =>
            filtrados.some(
              (item: Template) =>
                String(item.id) ===
                atual
            )
              ? atual
              : (
                  filtrados.length ===
                  1
                    ? String(
                        filtrados[0].id
                      )
                    : ""
                )
        );
      } catch (e) {
        console.error(e);
        if (ativo) {
          setTemplates([]);
        }
      }
    }

    void carregarTemplates();

    return () => {
      ativo = false;
    };
  }, [processo?.id]);

  function corpo() {
    if (
      motivo.trim().length < 3
    ) {
      setToast({
        tipo: "erro",
        mensagem:
          t("errors.reason"),
      });
      return null;
    }

    if (!dataSolicitacao) {
      setToast({
        tipo: "erro",
        mensagem:
          t("errors.requestDate"),
      });
      return null;
    }

    if (!dataEfetiva) {
      setToast({
        tipo: "erro",
        mensagem:
          t("errors.effectiveDate"),
      });
      return null;
    }

    if (
      dataEfetiva <
      dataSolicitacao
    ) {
      setToast({
        tipo: "erro",
        mensagem:
          t(
            "errors.effectiveBeforeRequest"
          ),
      });
      return null;
    }

    return {
      motivo: motivo.trim(),
      dataSolicitacao,
      dataEfetiva,
      regraContratual:
        regraContratual.trim() ||
        null,
      baseCalculoMulta:
        baseCalculoMulta || 0,
      percentualMulta:
        percentualMulta || 0,
      valorParcelasVencidas:
        valorParcelasVencidas || 0,
      valorMulta:
        valorMulta || 0,
      valorJuros:
        valorJuros || 0,
      valorCredito:
        valorCredito || 0,
      valorDevolucao:
        valorDevolucao || 0,
      situacaoFinanceira,
      observacoes:
        observacoes.trim() ||
        null,
    };
  }

  async function salvar() {
    const dadosCorpo = corpo();
    if (!dadosCorpo) return;

    setProcessando("salvar");

    try {
      const res =
        await fetch(
          `/api/admin/matriculas/${matriculaId}/cancelamento`,
          {
            method:
              rascunho
                ? "PATCH"
                : "POST",
            credentials:
              "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify(
                rascunho
                  ? {
                      ...dadosCorpo,
                      cancelamentoId:
                        rascunho.id,
                      acao:
                        "SALVAR_RASCUNHO",
                    }
                  : dadosCorpo
              ),
          }
        );

      const payload =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        throw new Error(
          payload?.error ||
          t("errors.generic")
        );
      }

      setToast({
        tipo: "sucesso",
        mensagem:
          t("messages.draftSaved"),
      });

      await carregar(false);
    } catch (e: any) {
      setToast({
        tipo: "erro",
        mensagem:
          e?.message ||
          t("errors.generic"),
      });
    } finally {
      setProcessando(null);
    }
  }

  async function finalizar() {
    if (!rascunho) {
      setToast({
        tipo: "aviso",
        mensagem:
          t("messages.saveFirst"),
      });
      return;
    }

    const dadosCorpo = corpo();
    if (!dadosCorpo) return;

    setProcessando(
      "finalizar"
    );

    try {
      const res =
        await fetch(
          `/api/admin/matriculas/${matriculaId}/cancelamento`,
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
                ...dadosCorpo,
                cancelamentoId:
                  rascunho.id,
                acao: "FINALIZAR",
              }),
          }
        );

      const payload =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        throw new Error(
          payload?.error ||
          t("errors.generic")
        );
      }

      setToast({
        tipo: "sucesso",
        mensagem:
          t("messages.finalized"),
      });

      await carregar(false);
    } catch (e: any) {
      setToast({
        tipo: "erro",
        mensagem:
          e?.message ||
          t("errors.generic"),
      });
    } finally {
      setProcessando(null);
      setConfirmar(false);
    }
  }

  async function gerarDocumento() {
    if (
      !processo ||
      !templateId
    ) return;

    setGerandoDocumento(true);
    setDocumentoId(null);

    try {
      const res =
        await fetch(
          "/api/admin/documentos/gerar",
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
                locale,
                templateId:
                  Number(templateId),
                matriculaId,
                cancelamentoMatriculaId:
                  processo.id,
              }),
          }
        );

      const payload =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        throw new Error(
          payload?.error ||
          t(
            "documents.errors.generate"
          )
        );
      }

      const id =
        Number(payload?.id);

      if (!id) {
        throw new Error(
          t(
            "documents.errors.invalidResponse"
          )
        );
      }

      setDocumentoId(id);

      setToast({
        tipo: "sucesso",
        mensagem:
          t(
            "documents.messages.generated"
          ),
      });

      await carregar(false);
    } catch (e: any) {
      setToast({
        tipo: "erro",
        mensagem:
          e?.message ||
          t(
            "documents.errors.generate"
          ),
      });
    } finally {
      setGerandoDocumento(false);
    }
  }

  function moeda(
    valor:
      | string
      | number
      | null
      | undefined
  ) {
    const n = Number(valor || 0);
    return new Intl.NumberFormat(
      locale,
      {
        style: "currency",
        currency: "BRL",
      }
    ).format(
      Number.isFinite(n)
        ? n
        : 0
    );
  }

  function dataHora(
    valor?: string | null
  ) {
    if (!valor) return "—";
    const d = new Date(valor);
    return Number.isNaN(
      d.getTime()
    )
      ? "—"
      : new Intl.DateTimeFormat(
          locale,
          {
            dateStyle: "medium",
            timeStyle: "short",
          }
        ).format(d);
  }

  if (loading) {
    return (
      <div className="p-6">
        {t("loading")}
      </div>
    );
  }

  if (
    erro ||
    !dados
  ) {
    return (
      <div className="p-6">
        <Link
          href="/admin/matriculas"
          className="font-semibold text-blue-600 hover:underline"
        >
          ← {t("back")}
        </Link>

        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          {erro || t("errors.load")}
        </div>
      </div>
    );
  }

  const m = dados.matricula;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {toast && (
        <PhanyxToast
          tipo={toast.tipo}
          mensagem={toast.mensagem}
          onClose={() =>
            setToast(null)
          }
        />
      )}

      <div>
        <Link
          href="/admin/matriculas"
          className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
        >
          ← {t("back")}
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">
          {t("title")}
        </h1>

        <p className="mt-2 max-w-4xl text-sm text-slate-600 dark:text-slate-300">
          {t("subtitle")}
        </p>
      </div>

      <section className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-bold">
          {t("summary.title")}
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Info
            label={t("summary.student")}
            value={
              m.aluno?.nome || "—"
            }
          />
          <Info
            label={t("summary.enrollment")}
            value={
              m.numeroMatricula ||
              `#${m.id}`
            }
          />
          <Info
            label={t("summary.course")}
            value={
              m.curso?.nome || "—"
            }
          />
          <Info
            label={t("summary.status")}
            value={
              m.status
                ? tMatricula(
                    `status.${m.status}`
                  )
                : "—"
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">
              {t("process.title")}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t("process.description")}
            </p>
          </div>

          <Info
            label={t("process.protocol")}
            value={
              processo?.numeroProtocolo ||
              t(
                "process.pendingProtocol"
              )
            }
          />
        </div>

        {somenteLeitura && (
          <div className="mt-5 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
            <strong>
              {t(
                "warnings.finalizedTitle"
              )}
            </strong>
            <p className="mt-1 text-sm">
              {t("warnings.finalized")}
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-5">
          <Campo
            label={t("form.reason")}
          >
            <textarea
              value={motivo}
              onChange={(e) =>
                setMotivo(
                  e.target.value
                )
              }
              disabled={somenteLeitura}
              rows={4}
              className="w-full rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              label={t(
                "form.requestDate"
              )}
            >
              <input
                type="date"
                value={
                  dataSolicitacao
                }
                onChange={(e) =>
                  setDataSolicitacao(
                    e.target.value
                  )
                }
                disabled={
                  somenteLeitura
                }
                className="w-full rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </Campo>

            <Campo
              label={t(
                "form.effectiveDate"
              )}
            >
              <input
                type="date"
                value={dataEfetiva}
                onChange={(e) =>
                  setDataEfetiva(
                    e.target.value
                  )
                }
                disabled={
                  somenteLeitura
                }
                className="w-full rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </Campo>
          </div>

          <Campo
            label={t(
              "form.contractRule"
            )}
          >
            <textarea
              value={
                regraContratual
              }
              onChange={(e) =>
                setRegraContratual(
                  e.target.value
                )
              }
              disabled={
                somenteLeitura
              }
              rows={3}
              className="w-full rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </Campo>

          <div>
            <h3 className="font-bold">
              {t("finance.title")}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t("finance.subtitle")}
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Campo
                label={t(
                  "finance.overdue"
                )}
              >
                <Numero
                  value={
                    valorParcelasVencidas
                  }
                  setValue={
                    setValorParcelasVencidas
                  }
                  disabled={
                    somenteLeitura
                  }
                />
              </Campo>

              <Campo
                label={t("finance.base")}
              >
                <Numero
                  value={
                    baseCalculoMulta
                  }
                  setValue={
                    setBaseCalculoMulta
                  }
                  disabled={
                    somenteLeitura
                  }
                />
              </Campo>

              <Campo
                label={t(
                  "finance.percentage"
                )}
              >
                <Numero
                  value={
                    percentualMulta
                  }
                  setValue={
                    setPercentualMulta
                  }
                  disabled={
                    somenteLeitura
                  }
                  max={100}
                />
              </Campo>

              <Campo
                label={t("finance.fine")}
              >
                <Numero
                  value={valorMulta}
                  setValue={
                    setValorMulta
                  }
                  disabled={
                    somenteLeitura
                  }
                />
              </Campo>

              <Campo
                label={t(
                  "finance.interest"
                )}
              >
                <Numero
                  value={valorJuros}
                  setValue={
                    setValorJuros
                  }
                  disabled={
                    somenteLeitura
                  }
                />
              </Campo>

              <Campo
                label={t(
                  "finance.credit"
                )}
              >
                <Numero
                  value={valorCredito}
                  setValue={
                    setValorCredito
                  }
                  disabled={
                    somenteLeitura
                  }
                />
              </Campo>

              <Campo
                label={t(
                  "finance.refund"
                )}
              >
                <Numero
                  value={valorDevolucao}
                  setValue={
                    setValorDevolucao
                  }
                  disabled={
                    somenteLeitura
                  }
                />
              </Campo>

              <Campo
                label={t(
                  "finance.status"
                )}
              >
                <select
                  value={
                    situacaoFinanceira
                  }
                  onChange={(e) =>
                    setSituacaoFinanceira(
                      e.target.value
                    )
                  }
                  disabled={
                    somenteLeitura
                  }
                  className="w-full rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                >
                  {[
                    "PENDENTE",
                    "QUITADO",
                    "ISENTO",
                    "VALOR_A_DEVOLVER",
                  ].map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {t(
                          `finance.statuses.${item}`
                        )}
                      </option>
                    )
                  )}
                </select>
              </Campo>

              <Info
                label={t("finance.total")}
                value={moeda(total)}
              />
            </div>
          </div>

          <Campo
            label={t(
              "form.observations"
            )}
          >
            <textarea
              value={observacoes}
              onChange={(e) =>
                setObservacoes(
                  e.target.value
                )
              }
              disabled={
                somenteLeitura
              }
              rows={4}
              className="w-full rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </Campo>
        </div>

        {!somenteLeitura && (
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={salvar}
              disabled={
                processando !== null
              }
              className="rounded-xl border px-4 py-2 font-semibold disabled:opacity-50"
            >
              {processando ===
              "salvar"
                ? t("actions.saving")
                : t(
                    "actions.saveDraft"
                  )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!rascunho) {
                  setToast({
                    tipo: "aviso",
                    mensagem:
                      t(
                        "messages.saveFirst"
                      ),
                  });
                  return;
                }
                setConfirmar(true);
              }}
              disabled={
                processando !== null
              }
              className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {t("actions.finalize")}
            </button>
          </div>
        )}
      </section>

      {processo && (
        <section className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-bold">
            {t("documents.title")}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t(
              "documents.subtitle",
              {
                protocol:
                  processo.numeroProtocolo,
              }
            )}
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <select
              value={templateId}
              onChange={(e) =>
                setTemplateId(
                  e.target.value
                )
              }
              className="min-w-[260px] flex-1 rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">
                {t(
                  "documents.selectTemplate"
                )}
              </option>
              {templates.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.nome}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              onClick={
                gerarDocumento
              }
              disabled={
                !templateId ||
                gerandoDocumento
              }
              className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {gerandoDocumento
                ? t(
                    "documents.generating"
                  )
                : t(
                    "documents.generate"
                  )}
            </button>
          </div>

          {templates.length === 0 && (
            <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
              {t(
                "documents.noTemplates"
              )}
            </p>
          )}

          <div className="mt-4 flex gap-3">
            <Link
              href="/admin/documentos/templates"
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              {t(
                "documents.manageTemplates"
              )}
            </Link>

            {documentoId && (
              <a
                href={`/api/admin/documentos/pdf/${documentoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-emerald-700 hover:underline"
              >
                {t(
                  "documents.openPdf"
                )}
              </a>
            )}
          </div>
        </section>
      )}

      <section className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-bold">
          {t("history.title")}
        </h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {t("history.subtitle")}
        </p>

        <div className="mt-4 space-y-3">
          {dados.cancelamentos.length ===
          0 ? (
            <p className="text-sm text-slate-500">
              {t("history.empty")}
            </p>
          ) : (
            dados.cancelamentos.map(
              (item) => (
                <article
                  key={item.id}
                  className="rounded-xl border bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Info
                      label={t(
                        "history.protocol"
                      )}
                      value={
                        item.numeroProtocolo
                      }
                    />
                    <Info
                      label={t(
                        "history.status"
                      )}
                      value={t(
                        `processStatus.${item.status}`
                      )}
                    />
                    <Info
                      label={t(
                        "history.total"
                      )}
                      value={moeda(
                        item.valorTotal
                      )}
                    />
                    <Info
                      label={t(
                        "history.documents"
                      )}
                      value={
                        item._count
                          ?.documentosGerados ??
                        0
                      }
                    />
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm">
                    <strong>
                      {t(
                        "history.reason"
                      )}
                      :
                    </strong>{" "}
                    {item.motivo}
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Info
                      label={t(
                        "history.registeredBy"
                      )}
                      value={
                        item
                          .registradoPorNomeSnapshot ||
                        "—"
                      }
                    />
                    <Info
                      label={t(
                        "history.finalizedBy"
                      )}
                      value={
                        item
                          .finalizadoPorNomeSnapshot ||
                        "—"
                      }
                    />
                    <Info
                      label={t(
                        "history.finalizedAt"
                      )}
                      value={dataHora(
                        item.finalizadoEm
                      )}
                    />
                  </div>
                </article>
              )
            )
          )}
        </div>
      </section>

      <PhanyxConfirmModal
        aberto={confirmar}
        titulo={t(
          "confirmModal.title"
        )}
        mensagem={t(
          "confirmModal.message"
        )}
        textoConfirmar={t(
          "confirmModal.confirm"
        )}
        textoCancelar={t(
          "confirmModal.cancel"
        )}
        textoCarregando={t(
          "actions.finalizing"
        )}
        onConfirmar={finalizar}
        onCancelar={() =>
          setConfirmar(false)
        }
      />
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
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">
        {label}
      </span>
      {children}
    </label>
  );
}

function Numero({
  value,
  setValue,
  disabled,
  max,
}: {
  value: string;
  setValue:
    (valor: string) => void;
  disabled?: boolean;
  max?: number;
}) {
  return (
    <input
      type="number"
      min="0"
      max={max}
      step="0.01"
      value={value}
      onChange={(e) =>
        setValue(
          e.target.value
        )
      }
      disabled={disabled}
      className="w-full rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
    />
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 break-words font-medium">
        {value}
      </div>
    </div>
  );
}

export default withAuth(
  AdminCancelamentoMatriculaPage,
  ["admin"]
);

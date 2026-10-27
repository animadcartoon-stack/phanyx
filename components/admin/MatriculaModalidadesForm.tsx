"use client";
import { faltantesRequisitos, mensagemRequisitoCurso } from "@/lib/matriculas/requisitos-cursos-interface";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { idCursoPrincipal } from "@/lib/matriculas/cursos-adicionais";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { type HorarioModalidade } from "@/lib/matriculas/combos";
import type { OfertaModalidade } from "@/lib/matriculas/modalidades-servidor";
import type { calcularContratacaoModalidades } from "@/lib/matriculas/combos";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";
import contraste from "@/components/admin/ContrasteAcademico.module.css";

type Previa = {
  calculo: ReturnType<typeof calcularContratacaoModalidades>;
  versao: string;
  snapshot: { nome: string };
};
type Aluno = { id: number; nome: string; matricula?: string; email?: string };
type Ajuste = {
  valorMatricula: string;
  valorMensalidade: string;
  quantidadeParcelas: string;
  motivo: string;
};
type Pendente = { ids: number[]; alunoId: string; inicio: string };
type Conflito = { primeiro: HorarioModalidade; segundo: HorarioModalidade };
type Alternativa = { substituirTurmaId: number; oferta: OfertaModalidade };
const input =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100";
const chavePolo = (id: number | null) => id === null ? "__sem_polo__" : String(id);

type Props = {
  cursoPrincipalId?: number | null;
  alunoSelecionadoId?: string;
  integrado?: boolean;
};

export default function MatriculaModalidadesForm({ cursoPrincipalId, alunoSelecionadoId, integrado = false }: Props) {
  const t = useTranslations("EnrollmentCombos");
  const ta = useTranslations("AdditionalCourses");
  const params = useSearchParams();
  const origemId = (v: string | null) => { try { return idCursoPrincipal(v); } catch { return null; } };
  const principalId = cursoPrincipalId !== undefined ? cursoPrincipalId : origemId(params.get("cursoPrincipalId"));
  const [principal, setPrincipal] = useState<{ id: number; nome: string } | null>(null);
  const inicializada = useRef(false);
  const tr = useTranslations("CourseRequirements");
  const locale = useLocale();
  const [ofertas, setOfertas] = useState<OfertaModalidade[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [busca, setBusca] = useState("");
  const [alunoId, setAlunoId] = useState(() => alunoSelecionadoId !== undefined ? alunoSelecionadoId : String(origemId(params.get("alunoId")) || ""));
  const [poloId, setPoloId] = useState("");
  const [periodo, setPeriodo] = useState("__selecione__");
  const [inicio, setInicio] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [status, setStatus] = useState("A_INICIAR");
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [mostrarAdicionais, setMostrarAdicionais] = useState(false);
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [ajuste, setAjuste] = useState<Ajuste | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [pendenciasCursos, setPendenciasCursos] = useState<{ cursoNome: string; obrigatorioNome: string }[]>([]);
  const [confirmacao, setConfirmacao] = useState<{
    mensagem: string;
    acao: () => void;
  } | null>(null);
  const [conflito, setConflito] = useState<{
    conflitos: Conflito[];
    alternativas: Alternativa[];
    pendente: Pendente;
  } | null>(null);
  const [resultado, setResultado] = useState<{
    id: number;
    numeroMatricula: string;
  } | null>(null);
  const chave = useRef("");
  const operacao = useRef(false);
  const traduzirErro = (codigo?: string) =>
    ta.has(`errors.${codigo}`) ? ta(`errors.${codigo}`) : t.has(`errors.${codigo}`)
      ? t(`errors.${codigo}`)
      : t("errors.ERRO_INTERNO");
  const moeda = (centavos: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }).format(centavos / 100);
  const dia = (valor: number) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "long",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2023, 0, 1 + valor)));
  const horarios = (lista: HorarioModalidade[]) =>
    lista
      .map((h) => `${dia(h.diaSemana)} ${h.horaInicio}–${h.horaFim || "?"}`)
      .join("; ");

  useEffect(() => {
    let ativo = true;
    fetch(`/api/admin/matriculas/modalidades${principalId !== null ? `?cursoPrincipalId=${principalId}` : ""}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(traduzirErro(data.codigo));
        if (ativo) { setOfertas(data.ofertas); setPrincipal(data.principal || null);
          const principais = (data.ofertas as OfertaModalidade[]).filter(o => o.cursoId === principalId);
          if (principais.length === 1) { setPoloId(chavePolo(principais[0].poloId)); setPeriodo(principais[0].periodoLetivo || ""); }
        }
      })
      .catch((error) => {
        if (ativo) setErro(error.message);
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });
    return () => {
      ativo = false;
    };
  }, [principalId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const abort = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(
        `/api/admin/alunos/busca-simples?busca=${encodeURIComponent(busca)}`,
        { signal: abort.signal, cache: "no-store" },
      )
        .then(async (res) => {
          if (!res.ok) throw new Error(traduzirErro());
          return res.json();
        })
        .then((data) => setAlunos(Array.isArray(data) ? data : []))
        .catch((error) => {
          if (error.name !== "AbortError") setErro(error.message);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      abort.abort();
    };
  }, [busca]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!alunoId) return;
    const controller = new AbortController();
    fetch(`/api/admin/alunos/busca-simples?id=${encodeURIComponent(alunoId)}`, { cache: "no-store", signal: controller.signal })
      .then(async r => { if (!r.ok) throw new Error(traduzirErro()); return r.json(); })
      .then(lista => { if (!controller.signal.aborted) setAluno(lista.find((a: Aluno) => a.id === Number(alunoId)) || null); })
      .catch(e => { if (!controller.signal.aborted) setErro(e.message); });
    return () => controller.abort();
  }, [alunoId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (inicializada.current || principalId === null || loading || !alunoId) return;
    const principais = ofertas.filter(o => o.cursoId === principalId);
    if (principais.length !== 1 || principais[0].horariosPendentes) return;
    inicializada.current = true;
    void validar({ ids: [principais[0].id], alunoId, inicio });
  }, [ofertas, principalId, loading, alunoId]); // eslint-disable-line react-hooks/exhaustive-deps

  function revisarAjuste(acao: () => void) {
    if (ajuste)
      setConfirmacao({
        mensagem: t("resetAdjustment"),
        acao: () => {
          setAjuste(null);
          acao();
        },
      });
    else acao();
  }
  function limpar() {
    setSelecionadas([]);
    setPendenciasCursos([]);
    setPrevia(null);
    setAjuste(null);
  }

  async function validar(pendente: Pendente) {
    if (operacao.current) return;
    if (!pendente.ids.length) {
      limpar();
      setInicio(pendente.inicio);
      return;
    }
    operacao.current = true;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/matriculas/modalidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "PREVIA",
          ...(principalId !== null ? { cursoPrincipalId: principalId } : {}),
          alunoId: Number(pendente.alunoId),
          turmaIds: pendente.ids,
          dataInicioCurso: pendente.inicio || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.codigo === "CURSO_CONJUNTO_PENDENTE") {
          setSelecionadas(pendente.ids);
          setInicio(pendente.inicio);
          setPrevia(null);
          setAjuste(null);
          setPendenciasCursos(faltantesRequisitos(data.detalhes));
          return;
        }
        if (data.codigo === "CONFLITO_HORARIO") {
          setConflito({ ...data.detalhes, pendente });
          return;
        }
        throw new Error(traduzirErro(data.codigo));
      }
      setSelecionadas(pendente.ids);
      setPrevia(data);
      setPendenciasCursos([]);
      setInicio(pendente.inicio);
      setAjuste(null);
    } catch (error) {
      setErro(error instanceof Error ? error.message : traduzirErro());
    } finally {
      operacao.current = false;
      setBusy(false);
    }
  }

  async function concluir(confirmacaoMenorAceita = false) {
    if (!previa || operacao.current) return;
    operacao.current = true;
    setSalvando(true);
    if (!chave.current) chave.current = crypto.randomUUID();
    try {
      const res = await fetch("/api/admin/matriculas/modalidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "CONFIRMAR",
          ...(principalId !== null ? { cursoPrincipalId: principalId } : {}),
          chave: chave.current,
          alunoId: Number(alunoId),
          turmaIds: selecionadas,
          dataInicioCurso: inicio || null,
          primeiroVencimento: vencimento,
          status,
          versao: previa.versao,
          ajuste: ajuste
            ? {
                ...ajuste,
                quantidadeParcelas: Number(ajuste.quantidadeParcelas),
              }
            : null,
          confirmacaoMenorAceita,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.codigo === "CONFIRMACAO_MENOR_NECESSARIA") {
          setConfirmacao({
            mensagem:
              t("minorConfirmation", { idade: data.detalhes.idade }) +
              (data.detalhes.pendencias?.length
                ? ` ${t("guardianPending")}: ${data.detalhes.pendencias.join(", ")}.`
                : ""),
            acao: () => {
              void concluir(true);
            },
          });
          return;
        }
        if (data.codigo === "CONFLITO_HORARIO")
          setConflito({
            ...data.detalhes,
            pendente: { ids: selecionadas, alunoId, inicio },
          });
        else setErro(mensagemRequisitoCurso(tr, data) || traduzirErro(data.codigo));
        if (
          [
            "CURSO_CONJUNTO_PENDENTE",
            "DADOS_ALTERADOS",
            "TURMA_SEM_VAGAS",
            "TURMA_INDISPONIVEL",
            "CONFLITO_HORARIO",
          ].includes(data.codigo)
        )
          setPrevia(null);
        return;
      }
      setResultado(data.matricula);
    } catch {
      setErro(t("networkRetry"));
    } finally {
      operacao.current = false;
      setSalvando(false);
    }
  }

  const polos = useMemo(
    () =>
      Array.from(new Map(
        ofertas.filter(o => principalId === null || o.cursoId === principalId)
          .map(o => [chavePolo(o.poloId), o.poloNome] as const),
      ).entries()),
    [ofertas, principalId],
  );
  const periodos = useMemo(
    () => Array.from(new Set(
      ofertas
        .filter(o => principalId === null || o.cursoId === principalId)
        .filter(o => !poloId || chavePolo(o.poloId) === poloId)
        .map(o => o.periodoLetivo || ""),
    )).sort(),
    [ofertas, poloId, principalId],
  );
  useEffect(() => {
    if (!poloId && polos.length === 1) setPoloId(polos[0][0]);
  }, [polos, poloId]);
  useEffect(() => {
    if (periodo === "__selecione__" && periodos.length === 1) setPeriodo(periodos[0]);
  }, [periodo, periodos]);
  const disponiveis = ofertas.filter(
    o => poloId !== "" && chavePolo(o.poloId) === poloId && (o.periodoLetivo || "") === periodo,
  );
  const cursos = Array.from(
    new Map(disponiveis.map((o) => [o.cursoId, o.curso])).values(),
  ).sort((a, b) => Number(b.id === principalId) - Number(a.id === principalId));
  const bloqueado = loading || busy || salvando || Boolean(resultado);
  const finais = ajuste
    ? {
        taxa: Number(ajuste.valorMatricula) * 100,
        mensalidade: Number(ajuste.valorMensalidade) * 100,
        parcelas: Number(ajuste.quantidadeParcelas),
      }
    : previa
      ? {
          taxa: previa.calculo.matriculaCentavos,
          mensalidade: previa.calculo.mensalidadeCentavos,
          parcelas: previa.calculo.quantidadeParcelas,
        }
      : null;
  const selecaoAluno =
    aluno && !alunos.some((a) => a.id === aluno.id)
      ? [aluno, ...alunos]
      : alunos;

  return (
    <section className="space-y-6 text-slate-900 dark:text-slate-100">
      {integrado ? (
        <p className="text-sm text-slate-700 dark:text-slate-300">Selecione a turma do curso principal. A matrícula com apenas um curso é válida. Adicione outras modalidades somente se desejar.</p>
      ) : (
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("enroll")}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            {t("enrollmentHelp")}
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/admin/matriculas" className="underline">
            {t("enrollments")}
          </Link>
          <Link href="/admin/combos" className="underline">
            {t("manageCombos")}
          </Link>
        </div>
      </div>
      )}
      {principal && <section role="note" className="rounded-xl border border-blue-300 bg-blue-50 p-4 text-slate-900 dark:border-blue-700 dark:bg-slate-900 dark:text-slate-100"><strong>{ta("principal", { name: principal.nome })}</strong><p className="mt-1 text-sm">{ta("enrollmentHelp")}</p></section>}
      {resultado ? (
        <section
          role="status"
          className="space-y-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
        >
          <h2 className="text-xl font-bold">{t("enrollmentCreated")}</h2>
          <p>{resultado.numeroMatricula}</p>
          <p>{t("createdHelp")}</p>
          <Link
            href="/admin/matriculas"
            className="inline-block rounded-lg bg-blue-700 px-4 py-2 text-white"
          >
            {t("viewEnrollments")}
          </Link>
        </section>
      ) : (
        <>
          <fieldset
            disabled={bloqueado}
            className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2 disabled:opacity-60"
          >
            {!integrado && (
              <>
            <label>
              {t("findStudent")}
              <input
                className={input}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder={t("searchStudent")}
              />
            </label>
            <label>
              {t("student")}
              <select
                required
                className={input}
                value={alunoId}
                onChange={(e) => {
                  const id = e.target.value;
                  revisarAjuste(() => {
                    limpar();
                    setAlunoId(id);
                    setAluno(
                      selecaoAluno.find((a) => a.id === Number(id)) || null,
                    );
                  });
                }}
              >
                <option value="">{t("choose")}</option>
                {selecaoAluno.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                    {a.matricula
                      ? ` · ${a.matricula}`
                      : a.email
                        ? ` · ${a.email}`
                        : ""}
                  </option>
                ))}
              </select>
            </label>
              </>
            )}
            <label>
              {t("pole")} <span className="text-xs text-slate-500 dark:text-slate-300">(quando aplicável)</span>
              <select
                className={input}
                value={poloId}
                onChange={(e) => {
                  const id = e.target.value;
                  revisarAjuste(() => {
                    limpar();
                    setPoloId(id);
                    setPeriodo("__selecione__");
                  });
                }}
              >
                <option value="">{t("choose")}</option>
                {polos.map(([id, nome]) => (
                  <option key={id} value={id}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("period")}
              <select
                className={input}
                value={periodo}
                onChange={(e) => {
                  const p = e.target.value;
                  revisarAjuste(() => {
                    limpar();
                    setPeriodo(p);
                  });
                }}
              >
                <option value="__selecione__">{t("choose")}</option>
                {periodos.map((p) => (
                  <option key={p} value={p}>
                    {p || t("noPeriod")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("startDate")}
              <input
                type="date"
                className={`${input} ${contraste.dataCalendario}`}
                value={inicio}
                onChange={(e) => {
                  const data = e.target.value;
                  revisarAjuste(() => {
                    if (selecionadas.length)
                      void validar({
                        ids: selecionadas,
                        alunoId,
                        inicio: data,
                      });
                    else setInicio(data);
                  });
                }}
              />
            </label>
            <label>
              {t("status")}
              <select
                className={input}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="A_INICIAR">{t("starting")}</option>
                <option value="ATIVA">{t("active")}</option>
              </select>
            </label>
          </fieldset>
          <section aria-busy={busy} className="space-y-4">
            <h2 className="text-lg font-semibold">{t("chooseModalities")}</h2>
            {principalId !== null && (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-950 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100">
                <input
                  type="checkbox"
                  checked={mostrarAdicionais}
                  disabled={bloqueado}
                  onChange={(e) => {
                    const ativar = e.target.checked;
                    revisarAjuste(() => {
                      setMostrarAdicionais(ativar);
                      if (!ativar) {
                        const ids = selecionadas.filter(id => ofertas.some(o => o.id === id && o.cursoId === principalId));
                        if (ids.length !== selecionadas.length) {
                          setSelecionadas(ids);
                          setPrevia(null); // não permitir confirmação com cotação antiga
                          void validar({ ids, alunoId, inicio });
                        }
                      }
                    });
                  }}
                />
                Adicionar outro curso (opcional)
              </label>
            )}
            {loading ? (
              <p>{t("loading")}</p>
            ) : !alunoId ? (
              <p>Selecione o aluno para escolher as turmas.</p>
            ) : ofertas.length === 0 ? (
              <p role="status">Não há turmas ativas elegíveis para esta contratação. Confira as turmas e horários dos cursos configurados como adicionais em Cursos.</p>
            ) : !poloId || periodo === "__selecione__" ? (
              <p>Selecione o polo, se houver mais de uma opção, e o período letivo da turma.</p>
            ) : cursos.length === 0 ? (
              <p>{t("noOffers")}</p>
            ) : (
              <fieldset
                disabled={bloqueado}
                className="grid gap-4 md:grid-cols-2 disabled:opacity-60"
              >
                {cursos.filter(curso => principalId === null || curso.id === principalId || mostrarAdicionais).map((curso) => {
                  const turmaSelecionada = selecionadas.find((id) =>
                    disponiveis.some(
                      (o) => o.id === id && o.cursoId === curso.id,
                    ),
                  );
                  return (
                    <div
                      key={curso.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                    >
                      {curso.id === principalId && <p className="mb-2 text-sm font-semibold">{ta("principalLabel")}</p>}
                      <label
                        className="font-semibold"
                        htmlFor={`curso-${curso.id}`}
                      >
                        {curso.nome}
                      </label>
                      {Boolean(curso.requisitosConjuntos?.length) && <p className="mt-1 text-sm">{tr("requires")}: {curso.requisitosConjuntos!.map(r => r.cursoObrigatorio.nome).join(", ")}</p>}
                      <p className="my-2 text-sm text-slate-600 dark:text-slate-300">
                        {t("standaloneMonthly")}:{" "}
                        {curso.valorMensalidade === null
                          ? t("missingPrice")
                          : moeda(Number(curso.valorMensalidade) * 100)}
                        {curso.participaCombo && ` · ${t("participates")}`}
                      </p>
                      <select
                        id={`curso-${curso.id}`}
                        className={input}
                        value={turmaSelecionada || ""}
                        onChange={(e) => {
                          const id = Number(e.target.value);
                          const ids = selecionadas.filter(
                            (s) => s !== turmaSelecionada,
                          );
                          if (id) ids.push(id);
                          revisarAjuste(() => {
                            void validar({ ids, alunoId, inicio });
                          });
                        }}
                      >
                        <option value="" disabled={curso.id === principalId}>{t("notSelected")}</option>
                        {disponiveis
                          .filter((o) => o.cursoId === curso.id)
                          .map((o) => (
                            <option
                              key={o.id}
                              value={o.id}
                              disabled={o.horariosPendentes || o.vagas === 0}
                            >
                              {o.nome}{o.turno ? ` · ${o.turno}` : ""} ·{" "}
                              {o.horariosPendentes
                                ? t("schedulePending")
                                : o.eadLivre
                                  ? t("freeEad")
                                  : horarios(o.horarios)}{" "}
                              ·{" "}
                              {o.vagas === null
                                ? t("noCapacityLimit")
                                : t("availableSeats", { count: o.vagas })}
                            </option>
                          ))}
                      </select>
                    </div>
                  );
                })}
              </fieldset>
            )}
            {busy && <p role="status">{t("calculating")}</p>}
          </section>
          {pendenciasCursos.length > 0 && <section role="alert" className="rounded-xl border border-amber-400 bg-amber-50 p-4 text-amber-950 dark:bg-amber-950 dark:text-amber-100">
            <p className="font-semibold">{tr("pendingTitle")}</p>
            <ul className="mt-2 list-disc pl-5">{pendenciasCursos.map((f, i) => <li key={i}>{tr("dependency", { course: f.cursoNome, required: f.obrigatorioNome })}</li>)}</ul>
            <p className="mt-2 text-sm">{tr("pendingHelp")}</p>
          </section>}
          {selecionadas.length > 0 && (
            <section className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <h2 className="font-semibold">{t("selectedSchedule")}</h2>
              {ofertas
                .filter((o) => selecionadas.includes(o.id))
                .map((o) => (
                  <p key={o.id} className="text-sm">
                    <strong>{o.curso.nome}</strong> · {o.nome} ·{" "}
                    {o.eadLivre ? t("freeEad") : horarios(o.horarios)}
                  </p>
                ))}
              {!previa && (
                <button
                  disabled={bloqueado}
                  onClick={() =>
                    void validar({ ids: selecionadas, alunoId, inicio })
                  }
                  className="rounded-lg bg-blue-700 px-4 py-2 text-white"
                >
                  {t("recalculate")}
                </button>
              )}
            </section>
          )}
          {previa && finais && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setConfirmacao({
                  mensagem: t("confirmEnrollment", {
                    aluno: aluno?.nome || "",
                    taxa: moeda(finais.taxa),
                    mensalidade: moeda(finais.mensalidade),
                    parcelas: finais.parcelas,
                  }),
                  acao: () => {
                    void concluir();
                  },
                });
              }}
              className="space-y-4 rounded-2xl border border-blue-300 bg-blue-50 p-5 dark:border-blue-800 dark:bg-slate-900"
            >
              <h2 className="text-lg font-semibold">{t("summary")}</h2>
              <p>
                {t("appliedRule")}:{" "}
                <strong>
                  {previa.calculo.tipoPreco === "QUANTIDADE"
                    ? t("quantityApplied")
                    : previa.calculo.comboId ? previa.calculo.nome
                    : t("standalone")}
                </strong>{" "}
                ·{" "}
                {t("modalityCount", {
                  count: previa.calculo.quantidadeModalidades,
                })}
              </p>
              {previa.calculo.tipoPreco !== "AVULSO" &&
                previa.calculo.cursoIdsAvulsos.length > 0 && (
                  <p className="text-sm">{t("extrasHelp")}</p>
                )}
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t("automaticRuleHelp")}
              </p>
              {previa.calculo.tipoPreco === "QUANTIDADE" && (
                <ul className="space-y-1 text-sm">
                  {previa.calculo.precosPorCurso.map(preco => <li key={preco.cursoId}>
                    {preco.cursoNome}: {moeda(preco.mensalidadeCentavos)} · {preco.quantidadeAtividades === null
                      ? t("standalone") : t("priceForActivities", { count: preco.quantidadeAtividades })}
                  </li>)}
                </ul>
              )}
              <dl className="grid grid-cols-2 gap-3">
                <dt>{t("enrollmentFee")}</dt>
                <dd className="font-bold">{moeda(finais.taxa)}</dd>
                <dt>{t("monthly")}</dt>
                <dd className="font-bold">{moeda(finais.mensalidade)}</dd>
                <dt>{t("installments")}</dt>
                <dd>{finais.parcelas}</dd>
                <dt>{t("total")}</dt>
                <dd className="font-bold">
                  {moeda(finais.taxa + finais.mensalidade * finais.parcelas)}
                </dd>
              </dl>
              <fieldset
                disabled={bloqueado}
                className="space-y-4 disabled:opacity-60"
              >
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(ajuste)}
                    onChange={(e) =>
                      setAjuste(
                        e.target.checked
                          ? {
                              valorMatricula: (
                                previa.calculo.matriculaCentavos / 100
                              ).toFixed(2),
                              valorMensalidade: (
                                previa.calculo.mensalidadeCentavos / 100
                              ).toFixed(2),
                              quantidadeParcelas: String(
                                previa.calculo.quantidadeParcelas,
                              ),
                              motivo: "",
                            }
                          : null,
                      )
                    }
                  />
                  {t("manualAdjustment")}
                </label>
                {ajuste && (
                  <div className="grid gap-3 md:grid-cols-3">
                    <label>
                      {t("enrollmentFee")}
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        className={input}
                        value={ajuste.valorMatricula}
                        onChange={(e) =>
                          setAjuste({
                            ...ajuste,
                            valorMatricula: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      {t("monthly")}
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        className={input}
                        value={ajuste.valorMensalidade}
                        onChange={(e) =>
                          setAjuste({
                            ...ajuste,
                            valorMensalidade: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      {t("installments")}
                      <input
                        required
                        type="number"
                        min="1"
                        max="120"
                        className={input}
                        value={ajuste.quantidadeParcelas}
                        onChange={(e) =>
                          setAjuste({
                            ...ajuste,
                            quantidadeParcelas: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="md:col-span-3">
                      {t("adjustmentReason")}
                      <textarea
                        required
                        minLength={3}
                        maxLength={1000}
                        className={input}
                        value={ajuste.motivo}
                        onChange={(e) =>
                          setAjuste({ ...ajuste, motivo: e.target.value })
                        }
                      />
                    </label>
                  </div>
                )}
                <label className="block">
                  {t("firstDueDate")}
                  <input
                    required
                    type="date"
                    className={`${input} ${contraste.dataCalendario}`}
                    value={vencimento}
                    onChange={(e) => setVencimento(e.target.value)}
                  />
                </label>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {t("billingHelp")}
                </p>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white"
                >
                  {salvando ? t("saving") : t("finishEnrollment")}
                </button>
              </fieldset>
            </form>
          )}
        </>
      )}
      {conflito && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/60 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-label={t("scheduleConflict")}
            className="max-h-[85vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <h2 className="text-xl font-bold">{t("scheduleConflict")}</h2>
            <p>{t("conflictHelp")}</p>
            {conflito.conflitos.map((c, i) => (
              <div
                key={i}
                className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100"
              >
                <p>
                  {c.primeiro.disciplinaNome} · {c.primeiro.turmaNome} ·{" "}
                  {horarios([c.primeiro])}
                </p>
                <p>
                  {c.segundo.disciplinaNome} · {c.segundo.turmaNome} ·{" "}
                  {horarios([c.segundo])}
                </p>
              </div>
            ))}
            <h3 className="font-semibold">{t("availableAlternatives")}</h3>
            {!conflito.alternativas.length ? (
              <p>{t("noAlternatives")}</p>
            ) : (
              conflito.alternativas.map((a, i) => (
                <div
                  key={i}
                  className="space-y-2 rounded-lg border border-slate-300 p-3 dark:border-slate-700"
                >
                  <p className="text-sm">
                    {a.oferta.curso.nome} · {a.oferta.nome} ·{" "}
                    {a.oferta.eadLivre
                      ? t("freeEad")
                      : horarios(a.oferta.horarios)}
                  </p>
                  <button
                    type="button"
                    disabled={busy || salvando}
                    className="rounded-lg bg-blue-700 px-3 py-2 text-sm text-white"
                    onClick={() => {
                      const pendente = conflito.pendente;
                      setConfirmacao({
                        mensagem: t("confirmAlternative", {
                          turma: a.oferta.nome,
                          horario: a.oferta.eadLivre
                            ? t("freeEad")
                            : horarios(a.oferta.horarios),
                        }),
                        acao: () => {
                          setConflito(null);
                          void validar({
                            ...pendente,
                            ids: pendente.ids.map((id) =>
                              id === a.substituirTurmaId ? a.oferta.id : id,
                            ),
                          });
                        },
                      });
                    }}
                  >
                    {t("selectAlternative")}
                  </button>
                </div>
              ))
            )}
            <button
              type="button"
              autoFocus
              onClick={() => setConflito(null)}
              className="rounded-lg border border-slate-400 px-4 py-2"
            >
              {t("close")}
            </button>
          </section>
        </div>
      )}
      <PhanyxConfirmModal
        aberto={Boolean(erro)}
        titulo={t("attention")}
        mensagem={erro}
        textoConfirmar={t("ok")}
        mostrarCancelar={false}
        onConfirmar={() => setErro("")}
        onCancelar={() => setErro("")}
      />
      <PhanyxConfirmModal
        aberto={Boolean(confirmacao)}
        titulo={t("confirmation")}
        mensagem={confirmacao?.mensagem || ""}
        textoConfirmar={t("confirm")}
        textoCancelar={t("cancel")}
        onConfirmar={() => {
          const acao = confirmacao?.acao;
          setConfirmacao(null);
          acao?.();
        }}
        onCancelar={() => setConfirmacao(null)}
      />
    </section>
  );
}

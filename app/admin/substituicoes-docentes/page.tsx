"use client";

import { useEffect, useMemo, useState } from "react";

type StatusSubstituicao =
  | "AGENDADA"
  | "ATIVA"
  | "SUSPENSA"
  | "ENCERRADA"
  | "CANCELADA";

type Professor = {
  id: number;
  nome: string;
};

type Curso = {
  id: number;
  nome: string;
};

type Turma = {
  id: number;
  nome: string;
  cursoId?: number | null;
};

type Disciplina = {
  id: number;
  nome: string;
  cursoId?: number | null;
};

type VinculoTitular = {
  id: number;
  professorTitularId: number;
  turmaId: number;
  turmaNome: string;
  disciplinaId: number;
  disciplinaNome: string;
  cursoId?: number | null;
  cursoNome: string;
};

type SubstituicaoDocente = {
  id: number;
  status: StatusSubstituicao;
  professorTitular?: Professor | null;
  professorSubstituto?: Professor | null;
  curso?: Curso | null;
  turma?: Turma | null;
  disciplina?: Disciplina | null;
  dataInicio: string;
  dataFim?: string | null;
  motivo?: string | null;
  observacoes?: string | null;
};

type FeedbackTipo = "sucesso" | "erro" | "";

const motivosSubstituicao = [
  "Licença médica",
  "Licença maternidade",
  "Férias",
  "Capacitação",
  "Afastamento",
  "Vacância",
  "Outro",
];

export default function SubstituicoesDocentesPage() {
  const [substituicoes, setSubstituicoes] = useState<SubstituicaoDocente[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [vinculosTitular, setVinculosTitular] = useState<VinculoTitular[]>([]);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [substituicaoVisualizada, setSubstituicaoVisualizada] =
    useState<SubstituicaoDocente | null>(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const [professorTitularId, setProfessorTitularId] = useState("");
  const [professorSubstitutoId, setProfessorSubstitutoId] = useState("");
  const [vinculoSelecionadoId, setVinculoSelecionadoId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [semDataFim, setSemDataFim] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [motivoOutro, setMotivoOutro] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [permissoesAberto, setPermissoesAberto] = useState(false);

  function mostrarFeedback(tipo: Exclude<FeedbackTipo, "">, mensagem: string) {
    setFeedbackTipo(tipo);
    setFeedback(mensagem);

    setTimeout(() => {
      setFeedback("");
      setFeedbackTipo("");
    }, 3500);
  }

  async function carregarDados() {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/substituicoes-docentes", {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Erro ao carregar substituições docentes.");
      }

      setSubstituicoes(Array.isArray(json.items) ? json.items : []);
      setProfessores(Array.isArray(json.professores) ? json.professores : []);
      setVinculosTitular(
        Array.isArray(json.vinculosTitular) ? json.vinculosTitular : []
      );
    } catch (e: any) {
      mostrarFeedback(
        "erro",
        e?.message || "Erro ao carregar substituições docentes."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const vinculosDoTitular = useMemo(() => {
    if (!professorTitularId) return [];

    return vinculosTitular.filter(
      (item) => String(item.professorTitularId) === professorTitularId
    );
  }, [vinculosTitular, professorTitularId]);

  const vinculoSelecionado = useMemo(() => {
    if (!vinculoSelecionadoId) return null;

    return (
      vinculosTitular.find(
        (item) => String(item.id) === String(vinculoSelecionadoId)
      ) || null
    );
  }, [vinculosTitular, vinculoSelecionadoId]);

  const professoresSubstitutos = useMemo(() => {
    if (!professorTitularId) return professores;

    return professores.filter(
      (professor) => String(professor.id) !== professorTitularId
    );
  }, [professores, professorTitularId]);

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return substituicoes.filter((item) => {
      const texto = [
        item.professorTitular?.nome,
        item.professorSubstituto?.nome,
        item.curso?.nome,
        item.turma?.nome,
        item.disciplina?.nome,
        item.status,
        item.motivo,
      ]
        .join(" ")
        .toLowerCase();

      const bateBusca = !termo || texto.includes(termo);
      const bateStatus = !filtroStatus || item.status === filtroStatus;

      return bateBusca && bateStatus;
    });
  }, [substituicoes, busca, filtroStatus]);

  const resumo = useMemo(() => {
    return {
      ativas: substituicoes.filter((s) => s.status === "ATIVA").length,
      agendadas: substituicoes.filter((s) => s.status === "AGENDADA").length,
      encerradas: substituicoes.filter((s) => s.status === "ENCERRADA").length,
      canceladas: substituicoes.filter((s) => s.status === "CANCELADA").length,
      total: substituicoes.length,
    };
  }, [substituicoes]);

  function limparFormulario() {
    setProfessorTitularId("");
    setProfessorSubstitutoId("");
    setVinculoSelecionadoId("");
    setDataInicio("");
    setDataFim("");
    setSemDataFim(false);
    setMotivo("");
    setMotivoOutro("");
    setObservacoes("");
    setPermissoesAberto(false);
  }

  async function criarSubstituicao(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSalvando(true);

      if (!vinculoSelecionado) {
        throw new Error("Selecione uma turma e disciplina vinculada ao professor titular.");
      }

      const motivoFinal =
        motivo === "Outro" ? motivoOutro.trim() : motivo.trim();

      const res = await fetch("/api/admin/substituicoes-docentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          professorTitularId: Number(professorTitularId),
          professorSubstitutoId: Number(professorSubstitutoId),
          turmaId: Number(vinculoSelecionado.turmaId),
          disciplinaId: Number(vinculoSelecionado.disciplinaId),
          dataInicio,
          dataFim: semDataFim ? null : dataFim || null,
          semDataFim,
          motivo: motivoFinal || null,
          observacoes,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Erro ao cadastrar substituição.");
      }

      limparFormulario();
      setModalAberto(false);
      await carregarDados();
      mostrarFeedback("sucesso", "Substituição docente cadastrada com sucesso.");
    } catch (e: any) {
      mostrarFeedback("erro", e?.message || "Erro ao cadastrar substituição.");
    } finally {
      setSalvando(false);
    }
  }

  function formatarData(data?: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  }

  function statusClasse(status: StatusSubstituicao) {
    if (status === "ATIVA") return "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300";
    if (status === "AGENDADA") return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300";
    if (status === "ENCERRADA") return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
    if (status === "CANCELADA") return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
    return "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-300";
  }

  async function alterarStatusSubstituicao(
    id: number,
    acao: "ENCERRAR" | "SUSPENDER" | "REATIVAR" | "CANCELAR"
  ) {
    try {
      setSalvando(true);

      const res = await fetch("/api/admin/substituicoes-docentes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, acao }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Erro ao atualizar substituição.");
      }

      await carregarDados();
      mostrarFeedback("sucesso", "Substituição atualizada com sucesso.");
    } catch (e: any) {
      mostrarFeedback("erro", e?.message || "Erro ao atualizar substituição.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="phanyx-substituicoes-page space-y-6 text-slate-900 dark:text-slate-100">
      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm ${feedbackTipo === "sucesso"
            ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
            : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            }`}
        >
          {feedback}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
              Acadêmico
            </p>
            <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              Substituições Docentes
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Controle professores substitutos sem compartilhar login do professor titular.
              O aluno continua acessando a mesma turma e disciplina.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
          >
            + Nova Substituição
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Ativas", resumo.ativas],
          ["Agendadas", resumo.agendadas],
          ["Encerradas", resumo.encerradas],
          ["Canceladas", resumo.canceladas],
          ["Total", resumo.total],
        ].map(([label, valor]) => (
          <div
            key={label}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
              {valor}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por professor, turma, disciplina, curso ou motivo..."
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">Todos os status</option>
            <option value="AGENDADA">Agendada</option>
            <option value="ATIVA">Ativa</option>
            <option value="SUSPENSA">Suspensa</option>
            <option value="ENCERRADA">Encerrada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Registros de substituição
          </h2>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
            Carregando substituições...
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
            Nenhuma substituição encontrada.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Titular</th>
                    <th className="px-4 py-3">Substituto</th>
                    <th className="px-4 py-3">Turma</th>
                    <th className="px-4 py-3">Disciplina</th>
                    <th className="px-4 py-3">Início</th>
                    <th className="px-4 py-3">Fim</th>
                    <th className="px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {listaFiltrada.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-200 dark:border-slate-800"
                    >
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClasse(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {item.professorTitular?.nome || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {item.professorSubstituto?.nome || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {item.turma?.nome || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {item.disciplina?.nome || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {formatarData(item.dataInicio)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {formatarData(item.dataFim)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSubstituicaoVisualizada(item)}
                            className="phanyx-substituicoes-visualizar rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold transition dark:border-slate-700"
                          >
                            Visualizar
                          </button>

                          {item.status === "ATIVA" && (
                            <>
                              <button
                                type="button"
                                onClick={() => alterarStatusSubstituicao(item.id, "SUSPENDER")}
                                disabled={salvando}
                                className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
                              >
                                Suspender
                              </button>

                              <button
                                type="button"
                                onClick={() => alterarStatusSubstituicao(item.id, "ENCERRAR")}
                                disabled={salvando}
                                className="rounded-xl border border-green-300 bg-green-50 px-3 py-2 text-xs font-bold text-green-800 transition hover:bg-green-100 disabled:opacity-60"
                              >
                                Encerrar
                              </button>
                            </>
                          )}

                          {item.status === "SUSPENSA" && (
                            <>
                              <button
                                type="button"
                                onClick={() => alterarStatusSubstituicao(item.id, "REATIVAR")}
                                disabled={salvando}
                                className="rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800 transition hover:bg-blue-100 disabled:opacity-60"
                              >
                                Reativar
                              </button>

                              <button
                                type="button"
                                onClick={() => alterarStatusSubstituicao(item.id, "ENCERRAR")}
                                disabled={salvando}
                                className="rounded-xl border border-green-300 bg-green-50 px-3 py-2 text-xs font-bold text-green-800 transition hover:bg-green-100 disabled:opacity-60"
                              >
                                Encerrar
                              </button>
                            </>
                          )}

                          {(item.status === "AGENDADA" ||
                            item.status === "ATIVA" ||
                            item.status === "SUSPENSA") && (
                              <button
                                type="button"
                                onClick={() => alterarStatusSubstituicao(item.id, "CANCELAR")}
                                disabled={salvando}
                                className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                              >
                                Cancelar
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 lg:hidden">
              {listaFiltrada.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClasse(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatarData(item.dataInicio)}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <p>
                      <strong>Titular:</strong>{" "}
                      {item.professorTitular?.nome || "-"}
                    </p>
                    <p>
                      <strong>Substituto:</strong>{" "}
                      {item.professorSubstituto?.nome || "-"}
                    </p>
                    <p>
                      <strong>Turma:</strong> {item.turma?.nome || "-"}
                    </p>
                    <p>
                      <strong>Disciplina:</strong>{" "}
                      {item.disciplina?.nome || "-"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {modalAberto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Nova Substituição Docente
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  O substituto usará o próprio login e receberá acesso temporário.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="phanyx-substituicoes-fechar rounded-full px-3 py-1 text-sm font-bold transition"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={criarSubstituicao} className="mt-6 grid gap-4 md:grid-cols-2">
              <select required value={professorTitularId} onChange={(e) => setProfessorTitularId(e.target.value)} className="rounded-2xl border p-3 dark:border-slate-700 dark:bg-slate-900">
                <option value="">Professor titular</option>
                {professores.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>

              <select required value={professorSubstitutoId} onChange={(e) => setProfessorSubstitutoId(e.target.value)} className="rounded-2xl border p-3 dark:border-slate-700 dark:bg-slate-900">
                <option value="">Professor substituto</option>
                {professores.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>

              <select
                required
                value={vinculoSelecionadoId}
                onChange={(e) => setVinculoSelecionadoId(e.target.value)}
                className="rounded-2xl border p-3 dark:border-slate-700 dark:bg-slate-900 md:col-span-2"
              >
                <option value="">
                  Selecione uma turma e disciplina do professor titular
                </option>

                {vinculosDoTitular.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.turmaNome} • {v.disciplinaNome}
                  </option>
                ))}
              </select>

              {vinculoSelecionado && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30 md:col-span-2">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">
                        Curso
                      </p>
                      <p className="font-semibold">
                        {vinculoSelecionado.cursoNome}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">
                        Turma
                      </p>
                      <p className="font-semibold">
                        {vinculoSelecionado.turmaNome}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">
                        Disciplina
                      </p>
                      <p className="font-semibold">
                        {vinculoSelecionado.disciplinaNome}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="md:col-span-2 mt-1">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Período
                </h3>
              </div>

              <input required type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="rounded-2xl border p-3 dark:border-slate-700 dark:bg-slate-900" />

              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="rounded-2xl border p-3 dark:border-slate-700 dark:bg-slate-900" />

              <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo da substituição" className="rounded-2xl border p-3 dark:border-slate-700 dark:bg-slate-900 md:col-span-2" />

              <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observações" className="min-h-28 rounded-2xl border p-3 dark:border-slate-700 dark:bg-slate-900 md:col-span-2" />

              <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:justify-end">
                <button type="button" onClick={() => setModalAberto(false)} className="rounded-2xl border px-5 py-3 text-sm font-bold dark:border-slate-700">
                  Cancelar
                </button>

                <button disabled={salvando} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60">
                  {salvando ? "Salvando..." : "Cadastrar substituição"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {substituicaoVisualizada && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                  Registro oficial
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                  Substituição Docente
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Detalhes da substituição cadastrada no PHANYX.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSubstituicaoVisualizada(null)}
                className="phanyx-substituicoes-fechar rounded-full px-3 py-1 text-sm font-bold transition"
              >
                Fechar
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Status
                </p>
                <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                  {substituicaoVisualizada.status}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Período
                </p>
                <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                  {formatarData(substituicaoVisualizada.dataInicio)} até{" "}
                  {formatarData(substituicaoVisualizada.dataFim)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Professor titular
                </p>
                <p className="mt-1 text-base font-black text-slate-900 dark:text-white">
                  {substituicaoVisualizada.professorTitular?.nome || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Professor substituto
                </p>
                <p className="mt-1 text-base font-black text-slate-900 dark:text-white">
                  {substituicaoVisualizada.professorSubstituto?.nome || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Curso
                </p>
                <p className="mt-1 text-base font-black text-slate-900 dark:text-white">
                  {substituicaoVisualizada.curso?.nome || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Turma
                </p>
                <p className="mt-1 text-base font-black text-slate-900 dark:text-white">
                  {substituicaoVisualizada.turma?.nome || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 md:col-span-2">
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Disciplina
                </p>
                <p className="mt-1 text-base font-black text-slate-900 dark:text-white">
                  {substituicaoVisualizada.disciplina?.nome || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 md:col-span-2">
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Motivo
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {substituicaoVisualizada.motivo || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 md:col-span-2">
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Observações
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {substituicaoVisualizada.observacoes || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
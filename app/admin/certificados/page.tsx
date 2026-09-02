"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import PhanyxToast from "@/components/ui/PhanyxToast";

type AlunoItem = {
  id: number;
  nome: string;
  email?: string | null;
  matricula?: string | null;
  curso?: string | null;
  statusCertificado?: "PRONTO" | "PENDENTE" | "NAO_ELEGIVEL";
  certificadoUrl?: string | null;
};

function normalizarListaAlunos(data: any): AlunoItem[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.alunos)) return data.alunos;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function normalizarBusca(valor: unknown) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s@._-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function distanciaLevenshtein(a: string, b: string) {
  const matriz = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matriz[i][0] = i;
  for (let j = 0; j <= b.length; j++) matriz[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;

      matriz[i][j] = Math.min(
        matriz[i - 1][j] + 1,
        matriz[i][j - 1] + 1,
        matriz[i - 1][j - 1] + custo
      );
    }
  }

  return matriz[a.length][b.length];
}

function alunoCombinaComBusca(aluno: AlunoItem, termoOriginal: string) {
  const termo = normalizarBusca(termoOriginal);

  if (!termo) {
    return {
      combina: true,
      score: 0,
    };
  }

  const campos = [
    aluno.nome,
    aluno.email,
    aluno.matricula,
    aluno.curso,
  ]
    .filter(Boolean)
    .map((valor) => normalizarBusca(valor));

  const textoCompleto = campos.join(" ");

  if (textoCompleto.includes(termo)) {
    return {
      combina: true,
      score: 0,
    };
  }

  const palavrasBusca = termo.split(" ").filter(Boolean);
  const palavrasAluno = textoCompleto.split(" ").filter(Boolean);

  let melhorScore = 999;

  for (const palavraBusca of palavrasBusca) {
    for (const palavraAluno of palavrasAluno) {
      if (
        palavraAluno.startsWith(palavraBusca) ||
        palavraBusca.startsWith(palavraAluno)
      ) {
        melhorScore = Math.min(melhorScore, 1);
        continue;
      }

      const distancia = distanciaLevenshtein(palavraBusca, palavraAluno);
      const limite =
        palavraBusca.length <= 4
          ? 1
          : palavraBusca.length <= 7
          ? 2
          : 3;

      if (distancia <= limite) {
        melhorScore = Math.min(melhorScore, distancia + 2);
      }
    }
  }

  return {
    combina: melhorScore < 999,
    score: melhorScore,
  };
}

function corStatus(status?: AlunoItem["statusCertificado"]) {
  if (status === "PRONTO") {
    return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800";
  }

  if (status === "PENDENTE") {
    return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800";
  }

  return "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700";
}

export default function AdminCertificadosPage() {
  const t = useTranslations("AdminCertificates");
  const locale = useLocale();

  function labelStatus(status?: AlunoItem["statusCertificado"]) {
    if (status === "PRONTO") return t("status.ready");
    if (status === "PENDENTE") return t("status.pending");
    return t("status.notEligible");
  }

  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [alunos, setAlunos] = useState<AlunoItem[]>([]);
  const [todosAlunos, setTodosAlunos] = useState<AlunoItem[]>([]);

  const [mostrarSugestoesBusca, setMostrarSugestoesBusca] = useState(false);
  const [nomeCampoBusca] = useState(
  () => `phanyx-certificados-busca-${Date.now()}`
);

  const [carregando, setCarregando] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoItem | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [visualizandoCertificadoId, setVisualizandoCertificadoId] =
    useState<number | null>(null);
  const [certificadoPreviewUrl, setCertificadoPreviewUrl] = useState("");
  const [certificadoPreviewNome, setCertificadoPreviewNome] = useState("");
  const [salvandoConfiguracao, setSalvandoConfiguracao] = useState(false);
  const [regraLiberacaoCertificado, setRegraLiberacaoCertificado] =
  useState("CURSO_COMPLETO");
  const [mediaMinimaCertificado, setMediaMinimaCertificado] = useState("7");
  const [frequenciaMinimaCertificado, setFrequenciaMinimaCertificado] =
  useState("75");
  const [liberarCertificadoAutomatico, setLiberarCertificadoAutomatico] =
  useState(true);

 async function carregarAlunos(termo = "") {
  try {
    setCarregando(true);
    setErro("");

    const res = await fetch("/api/aluno?page=1&limit=200", {
      cache: "no-store",
      credentials: "include",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setErro(data?.detalhe || data?.error || t("errors.searchStudents"));
      setAlunos([]);
      setTodosAlunos([]);
      return;
    }

    const lista = normalizarListaAlunos(data).map((item: any) => ({
      id: Number(item.id),
      nome: item.nome || t("fallback.unnamedStudent"),
      email: item.email ?? item.user?.email ?? null,
      matricula:
        item.matricula ??
        item.resumoMatricula?.numeroMatricula ??
        null,
      curso:
        item.curso?.nome ??
        item.matriculaAtiva?.curso?.nome ??
        item.matriculas?.[0]?.curso?.nome ??
        item.resumoMatricula?.curso?.nome ??
        item.resumoMatricula?.cursoNome ??
        null,
      statusCertificado: item.statusCertificado ?? "PENDENTE",
      certificadoUrl: item.certificadoUrl ?? null,
    }));

    const listaOrdenada = lista.sort((a, b) =>
      a.nome.localeCompare(b.nome, locale, {
        sensitivity: "base",
      })
    );

    setTodosAlunos(listaOrdenada);

    const termoLimpo = normalizarBusca(termo);

    if (!termoLimpo) {
      setAlunos(listaOrdenada);
      return;
    }

    const listaFiltrada = listaOrdenada
      .map((aluno) => {
        const resultado = alunoCombinaComBusca(aluno, termoLimpo);

        return {
          aluno,
          combina: resultado.combina,
          score: resultado.score,
        };
      })
      .filter((item) => item.combina)
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;

        return a.aluno.nome.localeCompare(b.aluno.nome, locale, {
          sensitivity: "base",
        });
      })
      .map((item) => item.aluno);

    setAlunos(listaFiltrada);
  } catch {
    setErro(t("errors.loadStudents"));
    setAlunos([]);
    setTodosAlunos([]);
  } finally {
    setCarregando(false);
  }
}

  useEffect(() => {
    carregarAlunos();
  }, []);

  useEffect(() => {
  carregarConfiguracaoCertificados();
}, []);

  const totalProntos = useMemo(
    () => alunos.filter((a) => a.statusCertificado === "PRONTO").length,
    [alunos]
  );

  const totalPendentes = useMemo(
    () => alunos.filter((a) => a.statusCertificado === "PENDENTE").length,
    [alunos]
  );

  const totalNaoElegiveis = useMemo(
    () => alunos.filter((a) => a.statusCertificado === "NAO_ELEGIVEL").length,
    [alunos]
  );

  function aplicarBusca() {
  const termo = busca.trim();

  setBuscaAplicada(termo);

  if (!termo) {
    setAlunos(todosAlunos);
    return;
  }

  const listaFiltrada = todosAlunos
    .map((aluno) => {
      const resultado = alunoCombinaComBusca(aluno, termo);

      return {
        aluno,
        combina: resultado.combina,
        score: resultado.score,
      };
    })
    .filter((item) => item.combina)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;

      return a.aluno.nome.localeCompare(b.aluno.nome, locale, {
        sensitivity: "base",
      });
    })
    .map((item) => item.aluno);

  setAlunos(listaFiltrada);
}

  function limparBusca() {
  setBusca("");
  setBuscaAplicada("");
  setAlunoSelecionado(null);
  setAlunos(todosAlunos);
}

  function acaoAindaNaoLigada(aluno: AlunoItem) {
    setAlunoSelecionado(aluno);
    setSucesso(t("messages.emailComingSoon", { name: aluno.nome }));
  }

  async function carregarConfiguracaoCertificados() {
  try {
    const res = await fetch("/api/admin/certificados/configuracao", {
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setErro(data?.error || t("errors.loadConfiguration"));
      return;
    }

    setRegraLiberacaoCertificado(
      data?.regraLiberacaoCertificado || "CURSO_COMPLETO"
    );
    setMediaMinimaCertificado(
      String(data?.mediaMinimaCertificado ?? 7)
    );
    setFrequenciaMinimaCertificado(
      String(data?.frequenciaMinimaCertificado ?? 75)
    );
    setLiberarCertificadoAutomatico(
      data?.liberarCertificadoAutomatico !== false
    );
  } catch {
    setErro(t("errors.loadConfiguration"));
  }
}

async function salvarConfiguracaoCertificados() {
  try {
    setSalvandoConfiguracao(true);

    const res = await fetch("/api/admin/certificados/configuracao", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        regraLiberacaoCertificado,
        mediaMinimaCertificado: Number(mediaMinimaCertificado),
        frequenciaMinimaCertificado: Number(frequenciaMinimaCertificado),
        liberarCertificadoAutomatico,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.sucesso) {
      setErro(data?.error || t("errors.saveConfiguration"));
      return;
    }

    setSucesso(t("messages.configurationSaved"));
  } catch {
    setErro(t("errors.saveConfiguration"));
  } finally {
    setSalvandoConfiguracao(false);
  }
}

async function visualizarCertificadoAluno(aluno: AlunoItem) {
  try {
    setVisualizandoCertificadoId(aluno.id);
    setErro("");

    const res = await fetch("/api/admin/certificados/gerar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        alunoId: aluno.id,
        baixar: true,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);

      setErro(
        data?.detalhe ||
          data?.error ||
          t("errors.viewCertificate")
      );
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    if (certificadoPreviewUrl) {
      window.URL.revokeObjectURL(certificadoPreviewUrl);
    }

    setCertificadoPreviewUrl(url);
    setCertificadoPreviewNome(aluno.nome);
    setAlunoSelecionado(aluno);
  } catch (error: any) {
    setErro(
      error?.message ||
        t("errors.viewCertificate")
    );
  } finally {
    setVisualizandoCertificadoId(null);
  }
}

  return (
  <div className="phanyx-certificados-page space-y-6">

<style jsx global>{`
  .phanyx-certificados-page .cert-card {
    background: #ffffff !important;
    border-color: #cbd5e1 !important;
    color: #0f172a !important;
  }

  .phanyx-certificados-page .cert-card :is(h1,h2,h3,h4,p,label,div) {
    color: #0f172a !important;
    opacity: 1 !important;
  }

  .phanyx-certificados-page .cert-muted {
    color: #475569 !important;
    opacity: 1 !important;
  }

  .phanyx-certificados-page .cert-option {
    background: #ffffff !important;
    border-color: #cbd5e1 !important;
    color: #0f172a !important;
  }

  .phanyx-certificados-page .cert-option :is(h1,h2,h3,h4,p,span,div) {
    color: #0f172a !important;
    opacity: 1 !important;
  }

  .phanyx-certificados-page .cert-option-active {
    background: #2563eb !important;
    border-color: #2563eb !important;
    color: #ffffff !important;
  }

  .phanyx-certificados-page .cert-option-active :is(h1,h2,h3,h4,p,span,div) {
    color: #ffffff !important;
    opacity: 1 !important;
  }

  .phanyx-certificados-page .cert-input {
    background: #ffffff !important;
    border-color: #cbd5e1 !important;
    color: #0f172a !important;
  }

  .phanyx-certificados-page .cert-input::placeholder {
    color: #64748b !important;
    opacity: 1 !important;
  }

  .phanyx-certificados-page .cert-clear-button {
    background: #ffffff !important;
    border-color: #cbd5e1 !important;
    color: #0f172a !important;
  }

  .phanyx-certificados-page .cert-clear-button:hover {
    background: #f8fafc !important;
    color: #0f172a !important;
  }

  .phanyx-certificados-page .cert-email-button {
    background: #0f172a !important;
    border-color: #0f172a !important;
    color: #ffffff !important;
  }

  .phanyx-certificados-page .cert-email-button:hover {
    background: #1e293b !important;
    border-color: #1e293b !important;
    color: #ffffff !important;
  }

  .phanyx-certificados-page .cert-preview-panel,
  .phanyx-certificados-page .cert-preview-header {
    background: #0f172a !important;
    border-color: #334155 !important;
  }

  .phanyx-certificados-page .cert-preview-kicker {
    color: #60a5fa !important;
    opacity: 1 !important;
  }

  .phanyx-certificados-page .cert-preview-name {
    color: #ffffff !important;
    opacity: 1 !important;
  }

  .phanyx-certificados-page .cert-subtle,
  .phanyx-certificados-page .cert-table-head {
    background: #f8fafc !important;
    border-color: #cbd5e1 !important;
  }

  .phanyx-certificados-page .cert-table-row {
    border-color: #e2e8f0 !important;
  }

  .phanyx-certificados-page .cert-table :is(th,td) {
    color: #334155;
  }

  html.dark:not([data-theme="system"]) .phanyx-certificados-page .cert-card,
  html.dark:not([data-theme="system"]) .phanyx-certificados-page .cert-option {
    background: #0f172a !important;
    border-color: #334155 !important;
    color: #f8fafc !important;
  }

  html.dark:not([data-theme="system"]) .phanyx-certificados-page .cert-card :is(h1,h2,h3,h4,p,label,div),
  html.dark:not([data-theme="system"]) .phanyx-certificados-page .cert-option :is(h1,h2,h3,h4,p,span,div) {
    color: #f8fafc !important;
    opacity: 1 !important;
  }

  html.dark:not([data-theme="system"]) .phanyx-certificados-page .cert-muted {
    color: #cbd5e1 !important;
  }

  html.dark:not([data-theme="system"]) .phanyx-certificados-page .cert-input {
    background: #0f172a !important;
    border-color: #334155 !important;
    color: #f8fafc !important;
  }

  html.dark:not([data-theme="system"]) .phanyx-certificados-page .cert-input::placeholder {
    color: #94a3b8 !important;
  }

  html.dark:not([data-theme="system"]) .phanyx-certificados-page .cert-clear-button {
    background: #020617 !important;
    border-color: #334155 !important;
    color: #f8fafc !important;
  }

  html.dark:not([data-theme="system"]) .phanyx-certificados-page .cert-subtle,
  html.dark:not([data-theme="system"]) .phanyx-certificados-page .cert-table-head {
    background: #020617 !important;
    border-color: #334155 !important;
  }

  html.dark:not([data-theme="system"]) .phanyx-certificados-page .cert-table-row {
    border-color: #334155 !important;
  }

  html.dark:not([data-theme="system"]) .phanyx-certificados-page .cert-table :is(th,td) {
    color: #e2e8f0;
  }

  html[data-theme="system"] .phanyx-certificados-page .cert-card,
  html[data-theme="system"] .phanyx-certificados-page .cert-option {
    background: #262626 !important;
    border-color: #525252 !important;
    color: #f8fafc !important;
  }

  html[data-theme="system"] .phanyx-certificados-page .cert-card :is(h1,h2,h3,h4,p,label,div),
  html[data-theme="system"] .phanyx-certificados-page .cert-option :is(h1,h2,h3,h4,p,span,div) {
    color: #f8fafc !important;
    opacity: 1 !important;
  }

  html[data-theme="system"] .phanyx-certificados-page .cert-muted {
    color: #d4d4d4 !important;
  }

  html[data-theme="system"] .phanyx-certificados-page .cert-input {
    background: #303030 !important;
    border-color: #525252 !important;
    color: #f8fafc !important;
  }

  html[data-theme="system"] .phanyx-certificados-page .cert-input::placeholder {
    color: #d4d4d4 !important;
  }

  html[data-theme="system"] .phanyx-certificados-page .cert-clear-button {
    background: #303030 !important;
    border-color: #525252 !important;
    color: #f8fafc !important;
  }

  html[data-theme="system"] .phanyx-certificados-page .cert-subtle,
  html[data-theme="system"] .phanyx-certificados-page .cert-table-head {
    background: #303030 !important;
    border-color: #525252 !important;
  }

  html[data-theme="system"] .phanyx-certificados-page .cert-table-row {
    border-color: #525252 !important;
  }

  html[data-theme="system"] .phanyx-certificados-page .cert-table :is(th,td) {
    color: #e5e5e5;
  }
`}</style>

    {erro && (
      <PhanyxToast
        tipo="erro"
        titulo={t("toast.errorTitle")}
        mensagem={erro}
        onClose={() => setErro("")}
      />
    )}

    {sucesso && (
      <PhanyxToast
        tipo="sucesso"
        titulo={t("toast.successTitle")}
        mensagem={sucesso}
        onClose={() => setSucesso("")}
      />
    )}
      <div className="cert-card rounded-3xl border p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
          {t("header.kicker")}
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          {t("header.title")}
        </h1>

        <p className="mt-2 max-w-4xl text-slate-600">
          {t("header.description")}
        </p>
      </div>

<div className="cert-card rounded-3xl border p-6 shadow-sm">
  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
        {t("settings.kicker")}
      </p>

      <h2 className="mt-2 text-2xl font-bold">
        {t("settings.title")}
      </h2>

      <p className="cert-muted mt-2 max-w-3xl text-sm leading-6">
        {t("settings.description")}
      </p>
    </div>

    <label className="cert-option flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold">
      <input
        type="checkbox"
        checked={liberarCertificadoAutomatico}
        onChange={(e) => setLiberarCertificadoAutomatico(e.target.checked)}
      />
      {t("settings.autoRelease")}
    </label>
  </div>

  <div className="mt-5 grid gap-4 lg:grid-cols-4">
  <button
    type="button"
    onClick={() => setRegraLiberacaoCertificado("DISCIPLINA_CONCLUIDA")}
    className={`rounded-2xl border p-4 text-left transition ${
      regraLiberacaoCertificado === "DISCIPLINA_CONCLUIDA"
        ? "cert-option-active"
        : "cert-option"
    }`}
  >
    <p className="font-bold">{t("rules.subject.title")}</p>
    <p className="mt-1 text-xs leading-5">
      {t("rules.subject.description")}
    </p>
  </button>

  <button
    type="button"
    onClick={() => setRegraLiberacaoCertificado("SEMESTRE_CONCLUIDO")}
    className={`rounded-2xl border p-4 text-left transition ${
      regraLiberacaoCertificado === "SEMESTRE_CONCLUIDO"
        ? "cert-option-active"
        : "cert-option"
    }`}
  >
    <p className="font-bold">{t("rules.semester.title")}</p>
    <p className="mt-1 text-xs leading-5">
      {t("rules.semester.description")}
    </p>
  </button>

  <button
    type="button"
    onClick={() => setRegraLiberacaoCertificado("CURSO_COMPLETO")}
    className={`rounded-2xl border p-4 text-left transition ${
      regraLiberacaoCertificado === "CURSO_COMPLETO"
        ? "cert-option-active"
        : "cert-option"
    }`}
  >
    <p className="font-bold">{t("rules.course.title")}</p>
    <p className="mt-1 text-xs leading-5">
      {t("rules.course.description")}
    </p>
  </button>

  <button
    type="button"
    onClick={() => setRegraLiberacaoCertificado("MANUAL")}
    className={`rounded-2xl border p-4 text-left transition ${
      regraLiberacaoCertificado === "MANUAL"
        ? "cert-option-active"
        : "cert-option"
    }`}
  >
    <p className="font-bold">{t("rules.manual.title")}</p>
    <p className="mt-1 text-xs leading-5">
      {t("rules.manual.description")}
    </p>
  </button>
</div>

  <div className="mt-5 grid gap-4 md:grid-cols-3">
  <label className="block">
    <span className="mb-2 block text-sm font-semibold">
      {t("settings.minimumGrade")}
    </span>

    <input
      type="number"
      min={0}
      max={10}
      step={0.1}
      value={mediaMinimaCertificado}
      onChange={(e) => setMediaMinimaCertificado(e.target.value)}
      className="cert-input w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
    />
  </label>

  <label className="block">
    <span className="mb-2 block text-sm font-semibold">
      {t("settings.minimumAttendance")}
    </span>

    <input
      type="number"
      min={0}
      max={100}
      step={1}
      value={frequenciaMinimaCertificado}
      onChange={(e) => setFrequenciaMinimaCertificado(e.target.value)}
      className="cert-input w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
    />
  </label>

  <div className="flex items-end">
    <button
      type="button"
      disabled={salvandoConfiguracao}
      onClick={salvarConfiguracaoCertificados}
      className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {salvandoConfiguracao
        ? t("settings.saving")
        : t("settings.save")}
    </button>
  </div>
</div>
</div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="cert-card rounded-2xl border p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("stats.ready")}
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{totalProntos}</p>
        </div>

        <div className="cert-card rounded-2xl border p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("stats.pending")}
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{totalPendentes}</p>
        </div>

        <div className="cert-card rounded-2xl border p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("stats.notEligible")}
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{totalNaoElegiveis}</p>
        </div>
      </div>

      <div className="cert-card rounded-3xl border p-6 shadow-sm">
  <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
    <div className="flex-1">
      <label className="mb-2 block text-sm font-medium">
        {t("search.label")}
      </label>

      <input
        type="search"
        value={busca}
        onFocus={() => setMostrarSugestoesBusca(true)}
        onChange={(e) => {
          const valor = e.target.value;
          setBusca(valor);
          setMostrarSugestoesBusca(true);

          const termo = valor.trim();

          if (!termo) {
            setBuscaAplicada("");
            setAlunos(todosAlunos);
            setAlunoSelecionado(null);
            return;
          }

          const listaFiltrada = todosAlunos
            .map((aluno) => {
              const resultado = alunoCombinaComBusca(aluno, termo);

              return {
                aluno,
                combina: resultado.combina,
                score: resultado.score,
              };
            })
            .filter((item) => item.combina)
            .sort((a, b) => {
              if (a.score !== b.score) return a.score - b.score;

              return a.aluno.nome.localeCompare(b.aluno.nome, locale, {
                sensitivity: "base",
              });
            })
            .map((item) => item.aluno);

          setAlunos(listaFiltrada);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            aplicarBusca();
            setMostrarSugestoesBusca(false);
          }

          if (e.key === "Escape") {
            setMostrarSugestoesBusca(false);
          }
        }}
        placeholder={t("search.placeholder")}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        name={nomeCampoBusca}
        id={nomeCampoBusca}
        className="cert-input w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-400"
      />

      {mostrarSugestoesBusca && busca.trim() && todosAlunos.length > 0 && (
        <div className="phanyx-cert-sugestoes mt-2 rounded-2xl p-2">
          {todosAlunos
            .map((aluno) => {
              const resultado = alunoCombinaComBusca(aluno, busca);

              return {
                aluno,
                combina: resultado.combina,
                score: resultado.score,
              };
            })
            .filter((item) => item.combina)
            .sort((a, b) => {
              if (a.score !== b.score) return a.score - b.score;

              return a.aluno.nome.localeCompare(b.aluno.nome, locale, {
                sensitivity: "base",
              });
            })
            .slice(0, 6)
            .map((item) => (
              <button
                key={item.aluno.id}
                type="button"
                onClick={() => {
                  setBusca(item.aluno.nome);
                  setBuscaAplicada(item.aluno.nome);
                  setAlunos([item.aluno]);
                  setAlunoSelecionado(item.aluno);
                  setMostrarSugestoesBusca(false);
                }}
                className="phanyx-cert-sugestao block w-full rounded-xl px-3 py-2 text-left text-sm"
              >
                <span className="font-semibold">{item.aluno.nome}</span>

                <span className="phanyx-cert-sugestao-email ml-2 text-xs">
                  {item.aluno.email || t("fallback.noEmail")}
                </span>
              </button>
            ))}

          {todosAlunos
            .map((aluno) => alunoCombinaComBusca(aluno, busca))
            .filter((resultado) => resultado.combina).length === 0 && (
            <div className="cert-muted px-3 py-2 text-sm">
              {t("search.noSuggestions")}
            </div>
          )}
        </div>
      )}
    </div>

    <button
      type="button"
      onClick={aplicarBusca}
      className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
    >
      {t("search.searchButton")}
    </button>

    <button
      type="button"
      onClick={limparBusca}
      className="cert-clear-button rounded-xl border px-5 py-3 font-semibold"
    >
      {t("search.clearButton")}
    </button>
  </div>

  {buscaAplicada && (
    <p className="cert-muted mt-3 text-sm">
      {t.rich("search.result", {
        term: () => (
          <span className="font-semibold">{buscaAplicada}</span>
        ),
      })}
    </p>
  )}
</div>

      <div className="cert-card rounded-3xl border shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-900">
            {t("table.title")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("table.description")}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="cert-table min-w-full">
            <thead className="cert-table-head">
              <tr className="text-left text-sm text-slate-600">
                <th className="px-6 py-4 font-semibold">{t("table.student")}</th>
                <th className="px-6 py-4 font-semibold">{t("table.course")}</th>
                <th className="px-6 py-4 font-semibold">{t("table.enrollment")}</th>
                <th className="px-6 py-4 font-semibold">{t("table.status")}</th>
                <th className="px-6 py-4 font-semibold">{t("table.actions")}</th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-sm text-slate-500">
                    {t("table.loading")}
                  </td>
                </tr>
              ) : alunos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-sm text-slate-500">
                    {buscaAplicada
                      ? t("table.noResultsSearch")
                      : t("table.noResults")}
                  </td>
                </tr>
              ) : (
                alunos.map((aluno) => (
                  <tr
                    key={aluno.id}
                    className="phanyx-cert-tabela-linha cert-table-row border-t"
                  >
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setAlunoSelecionado(aluno)}
                        className="text-left"
                      >
                        <div className="phanyx-cert-nome font-semibold">{aluno.nome}</div>
                        <div className="phanyx-cert-email text-sm">
  {aluno.email || t("fallback.noEmail")}
</div>
                      </button>
                    </td>

                    <td className="phanyx-cert-texto px-6 py-4 text-sm">
                      {aluno.curso || t("fallback.notInformed")}
                    </td>

                    <td className="phanyx-cert-texto px-6 py-4 text-sm">
                      {aluno.matricula || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`phanyx-cert-status-badge inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${corStatus(
  aluno.statusCertificado
)}`}
                      >
                        {labelStatus(aluno.statusCertificado)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
  type="button"
  disabled={aluno.statusCertificado === "PRONTO"}
  onClick={async () => {
    try {
      const res = await fetch("/api/admin/certificados/gerar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ alunoId: aluno.id }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.sucesso) {
        setErro(
          data?.detalhe ||
            data?.error ||
            t("errors.issueCertificate")
        );
        return;
      }

      setSucesso(t("messages.certificateIssued", { name: aluno.nome }));

      setAlunos((prev) =>
        prev.map((item) =>
          item.id === aluno.id
            ? {
                ...item,
                statusCertificado: "PRONTO",
              }
            : item
        )
      );

      setTodosAlunos((prev) =>
        prev.map((item) =>
          item.id === aluno.id
            ? {
                ...item,
                statusCertificado: "PRONTO",
              }
            : item
        )
      );

      setAlunoSelecionado((prev) =>
        prev?.id === aluno.id
          ? {
              ...prev,
              statusCertificado: "PRONTO",
            }
          : prev
      );
    } catch (error: any) {
      setErro(
        error?.message ||
          t("errors.issueCertificateRequirements")
      );
    }
  }}
  className={`rounded-lg px-3 py-2 text-xs font-semibold ${
    aluno.statusCertificado === "PRONTO"
      ? "cursor-not-allowed bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
      : "bg-blue-600 text-white hover:bg-blue-700"
  }`}
>
  {aluno.statusCertificado === "PRONTO"
    ? t("table.certificateIssued")
    : t("table.issueCertificate")}
</button>

                       <button
  type="button"
  disabled={visualizandoCertificadoId !== null}
  onClick={() => visualizarCertificadoAluno(aluno)}
  className="phanyx-cert-botao-secundario rounded-lg border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
>
  {visualizandoCertificadoId === aluno.id
    ? t("table.opening")
    : t("table.view")}
</button>

                        <button
  type="button"
  onClick={async () => {
    try {
      const res = await fetch("/api/admin/certificados/gerar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ alunoId: aluno.id, baixar: true }),
      });

      if (!res.ok) {
        const erro = await res.json().catch(() => null);
        setErro(erro?.error || t("errors.downloadCertificate"));
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = t("download.fileName", { name: aluno.nome });
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setErro(t("errors.downloadCertificate"));
    }
  }}
  className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
>
  {t("table.download")}
</button>

                        <button
                          type="button"
                          onClick={() => acaoAindaNaoLigada(aluno)}
                          className="cert-email-button rounded-lg border px-3 py-2 text-xs font-semibold transition"
                        >
                          {t("table.email")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="cert-card rounded-3xl border p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          {t("selected.title")}
        </h2>

        {alunoSelecionado ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="cert-subtle rounded-2xl border p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("selected.name")}
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {alunoSelecionado.nome}
              </p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("selected.email")}
              </p>
              <p className="mt-2 text-sm text-slate-700">
                {alunoSelecionado.email || t("fallback.noEmail")}
              </p>
            </div>

            <div className="cert-subtle rounded-2xl border p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("selected.course")}
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {alunoSelecionado.curso || t("fallback.notInformed")}
              </p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("selected.certificateStatus")}
              </p>
              <p className="mt-2 text-sm text-slate-700">
                {labelStatus(alunoSelecionado.statusCertificado)}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            {t("selected.instruction")}
          </p>
        )}
      </div>
      {certificadoPreviewUrl && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4">
    <div className="cert-preview-panel flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border shadow-2xl">
      <div className="cert-preview-header flex items-center justify-between border-b px-5 py-3">
        <div>
          <p className="cert-preview-kicker text-xs font-semibold uppercase tracking-[0.18em]">
            {t("preview.kicker")}
          </p>
          <h2 className="cert-preview-name text-lg font-bold">
            {certificadoPreviewNome}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            window.URL.revokeObjectURL(certificadoPreviewUrl);
            setCertificadoPreviewUrl("");
            setCertificadoPreviewNome("");
          }}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
        >
          {t("preview.close")} ✕
        </button>
      </div>

      <iframe
        src={certificadoPreviewUrl}
        className="h-full w-full bg-white"
        title={t("preview.title")}
      />
    </div>
  </div>
)}
    </div>
  );

}

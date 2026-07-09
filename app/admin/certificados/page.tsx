"use client";

import { useEffect, useMemo, useState } from "react";
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
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }

  if (status === "PENDENTE") {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }

  return "bg-slate-100 text-slate-600 border-slate-200";
}

function labelStatus(status?: AlunoItem["statusCertificado"]) {
  if (status === "PRONTO") return "Pronto";
  if (status === "PENDENTE") return "Pendente";
  return "Não elegível";
}

export default function AdminCertificadosPage() {
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
  const [visualizandoCertificado, setVisualizandoCertificado] = useState(false);
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
      setErro(data?.detalhe || data?.error || "Erro ao buscar alunos.");
      setAlunos([]);
      setTodosAlunos([]);
      return;
    }

    const lista = normalizarListaAlunos(data).map((item: any) => ({
      id: Number(item.id),
      nome: item.nome || "Aluno sem nome",
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
      a.nome.localeCompare(b.nome, "pt-BR", {
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

        return a.aluno.nome.localeCompare(b.aluno.nome, "pt-BR", {
          sensitivity: "base",
        });
      })
      .map((item) => item.aluno);

    setAlunos(listaFiltrada);
  } catch {
    setErro("Erro ao carregar alunos.");
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

      return a.aluno.nome.localeCompare(b.aluno.nome, "pt-BR", {
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

  function acaoAindaNaoLigada(nomeAcao: string, aluno: AlunoItem) {
    setAlunoSelecionado(aluno);
    setSucesso(
  `${nomeAcao} do certificado de ${aluno.nome} será ligado no próximo passo.`
);
  }

  async function carregarConfiguracaoCertificados() {
  try {
    const res = await fetch("/api/admin/certificados/configuracao", {
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setErro(data?.error || "Erro ao carregar configuração de certificados.");
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
    setErro("Erro ao carregar configuração de certificados.");
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
      setErro(data?.error || "Erro ao salvar configuração.");
      return;
    }

    setSucesso("Configuração de certificados salva com sucesso.");
  } catch {
    setErro("Erro ao salvar configuração de certificados.");
  } finally {
    setSalvandoConfiguracao(false);
  }
}

async function visualizarCertificadoAluno(aluno: AlunoItem) {
  try {
    setVisualizandoCertificado(true);
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
          "Não foi possível visualizar o certificado."
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
        "Erro ao visualizar certificado."
    );
  } finally {
    setVisualizandoCertificado(false);
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

  .phanyx-certificados-page .cert-card :is(h1,h2,h3,h4,p,span,label,div) {
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

  html.dark:not([data-theme="system"]) .phanyx-certificados-page .cert-card,
  html.dark:not([data-theme="system"]) .phanyx-certificados-page .cert-option {
    background: #0f172a !important;
    border-color: #334155 !important;
    color: #f8fafc !important;
  }

  html.dark:not([data-theme="system"]) .phanyx-certificados-page .cert-card :is(h1,h2,h3,h4,p,span,label,div),
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

  html[data-theme="system"] .phanyx-certificados-page .cert-card,
  html[data-theme="system"] .phanyx-certificados-page .cert-option {
    background: #262626 !important;
    border-color: #525252 !important;
    color: #f8fafc !important;
  }

  html[data-theme="system"] .phanyx-certificados-page .cert-card :is(h1,h2,h3,h4,p,span,label,div),
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
`}</style>

    {erro && (
      <PhanyxToast
        tipo="erro"
        titulo="Não foi possível concluir"
        mensagem={erro}
        onClose={() => setErro("")}
      />
    )}

    {sucesso && (
      <PhanyxToast
        tipo="sucesso"
        titulo="Tudo certo"
        mensagem={sucesso}
        onClose={() => setSucesso("")}
      />
    )}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
          Admin • Certificados
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Gestão de certificados
        </h1>

        <p className="mt-2 max-w-4xl text-slate-600">
          Busque alunos, veja o status do certificado, abra o documento pronto
          quando existir e prepare o fluxo de baixar ou enviar por email.
        </p>
      </div>

<div className="cert-card rounded-3xl border p-6 shadow-sm">
  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
        Configuração da instituição
      </p>

      <h2 className="mt-2 text-2xl font-bold">
        Liberação automática de certificados
      </h2>

      <p className="cert-muted mt-2 max-w-3xl text-sm leading-6">
        Defina quando o certificado ficará disponível automaticamente na área do aluno.
        A emissão manual continua disponível para secretaria/diretoria quando houver autorização.
      </p>
    </div>

    <label className="cert-option flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold">
      <input
        type="checkbox"
        checked={liberarCertificadoAutomatico}
        onChange={(e) => setLiberarCertificadoAutomatico(e.target.checked)}
      />
      Liberar automaticamente
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
    <p className="font-bold">Por disciplina</p>
    <p className="mt-1 text-xs leading-5">
      O aluno recebe certificado quando concluir uma disciplina.
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
    <p className="font-bold">Por semestre</p>
    <p className="mt-1 text-xs leading-5">
      O aluno recebe certificado quando concluir o semestre.
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
    <p className="font-bold">Curso completo</p>
    <p className="mt-1 text-xs leading-5">
      O aluno recebe certificado apenas ao concluir o curso.
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
    <p className="font-bold">Manual</p>
    <p className="mt-1 text-xs leading-5">
      O certificado só aparece quando for emitido pela equipe autorizada.
    </p>
  </button>
</div>

  <div className="mt-5 grid gap-4 md:grid-cols-3">
  <label className="block">
    <span className="mb-2 block text-sm font-semibold">
      Média mínima
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
      Frequência mínima (%)
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
      {salvandoConfiguracao ? "Salvando..." : "Salvar configuração"}
    </button>
  </div>
</div>
</div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Certificados prontos
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{totalProntos}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pendentes
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{totalPendentes}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Não elegíveis
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{totalNaoElegiveis}</p>
        </div>
      </div>

      <div className="cert-card rounded-3xl border p-6 shadow-sm">
  <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
    <div className="flex-1">
      <label className="mb-2 block text-sm font-medium">
        Buscar aluno
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

              return a.aluno.nome.localeCompare(b.aluno.nome, "pt-BR", {
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
        placeholder="Digite nome, matrícula ou email"
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

              return a.aluno.nome.localeCompare(b.aluno.nome, "pt-BR", {
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
                  {item.aluno.email || "Sem email"}
                </span>
              </button>
            ))}

          {todosAlunos
            .map((aluno) => alunoCombinaComBusca(aluno, busca))
            .filter((resultado) => resultado.combina).length === 0 && (
            <div className="cert-muted px-3 py-2 text-sm">
              Nenhuma sugestão encontrada.
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
      Buscar
    </button>

    <button
      type="button"
      onClick={limparBusca}
      className="cert-clear-button rounded-xl border px-5 py-3 font-semibold"
    >
      Limpar
    </button>
  </div>

  {buscaAplicada && (
    <p className="cert-muted mt-3 text-sm">
      Resultado da busca por:{" "}
      <span className="font-semibold">{buscaAplicada}</span>
    </p>
  )}
</div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-900">Alunos e certificados</h2>
          <p className="mt-1 text-sm text-slate-500">
            Clique em um aluno para visualizar melhor as ações disponíveis.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm text-slate-600">
                <th className="px-6 py-4 font-semibold">Aluno</th>
                <th className="px-6 py-4 font-semibold">Curso</th>
                <th className="px-6 py-4 font-semibold">Matrícula</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Ações</th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-sm text-slate-500">
                    Carregando alunos...
                  </td>
                </tr>
              ) : alunos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-sm text-slate-500">
                    {buscaAplicada
  ? "Nenhum aluno encontrado. Tente parte do nome, email, matrícula ou uma grafia parecida."
  : "Nenhum aluno encontrado."}
                  </td>
                </tr>
              ) : (
                alunos.map((aluno) => (
                  <tr
                    key={aluno.id}
                    className="phanyx-cert-tabela-linha border-t"
                  >
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setAlunoSelecionado(aluno)}
                        className="text-left"
                      >
                        <div className="phanyx-cert-nome font-semibold">{aluno.nome}</div>
                        <div className="phanyx-cert-email text-sm">
  {aluno.email || "Sem email"}
</div>
                      </button>
                    </td>

                    <td className="phanyx-cert-texto px-6 py-4 text-sm">
                      {aluno.curso || "Não informado"}
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
            "Erro ao emitir certificado."
        );
        return;
      }

      setSucesso(`Certificado de ${aluno.nome} emitido com sucesso.`);

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
          "Erro ao emitir certificado. Verifique se o aluno possui matrícula e disciplina vinculada."
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
    ? "Certificado emitido"
    : "Emitir certificado"}
</button>

                       <button
  type="button"
  disabled={visualizandoCertificado}
  onClick={() => visualizarCertificadoAluno(aluno)}
  className="phanyx-cert-botao-secundario rounded-lg border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
>
  {visualizandoCertificado ? "Abrindo..." : "Visualizar"}
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
        setErro(erro?.error || "Não foi possível baixar o certificado.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificado-${aluno.nome}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setErro("Erro ao baixar certificado.");
    }
  }}
  className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
>
  Baixar
</button>

                        <button
                          type="button"
                          onClick={() => acaoAindaNaoLigada("Enviar por email", aluno)}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          Email
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

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Aluno selecionado</h2>

        {alunoSelecionado ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Nome
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {alunoSelecionado.nome}
              </p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </p>
              <p className="mt-2 text-sm text-slate-700">
                {alunoSelecionado.email || "Sem email"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Curso
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {alunoSelecionado.curso || "Não informado"}
              </p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status do certificado
              </p>
              <p className="mt-2 text-sm text-slate-700">
                {labelStatus(alunoSelecionado.statusCertificado)}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            Selecione um aluno na tabela acima.
          </p>
        )}
      </div>
      {certificadoPreviewUrl && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4">
    <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
            Visualização do certificado
          </p>
          <h2 className="text-lg font-bold text-white">
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
          Fechar ✕
        </button>
      </div>

      <iframe
        src={certificadoPreviewUrl}
        className="h-full w-full bg-white"
        title="Visualização do certificado"
      />
    </div>
  </div>
)}
    </div>
  );
}
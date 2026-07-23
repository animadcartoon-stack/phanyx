"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type CursoSemestreOption = {
  id: number;
  numero: number;
  titulo?: string | null;
  cargaMinima?: number | null;
  cargaMaxima?: number | null;
};

type CursoOption = {
  id: number;
  nome: string;
  codigo?: string | null;
  semestres: CursoSemestreOption[];
};

type PeriodoRematricula = {
  id: number;
  titulo?: string | null;
  periodoLetivo: string;
  semestreNumero?: number | null;
  dataInicio: string;
  dataFim: string;
  dataInicioAulas?: string | null;
  status: string;
  exigeAprovacao: boolean;
  bloqueiaInadimplente: boolean;
  cargaMinimaOverride?: number | null;
  cargaMaximaOverride?: number | null;
  curso?: {
    id: number;
    nome: string;
    codigo?: string | null;
    ativo: boolean;
  } | null;
  cursoSemestre?: {
    id: number;
    numero: number;
    titulo?: string | null;
    cargaMinima?: number | null;
    cargaMaxima?: number | null;
  } | null;
  _count: {
    matriculas: number;
    rematriculas: number;
  };
};

type RespostaApi = {
  periodos?: PeriodoRematricula[];
  cursos?: CursoOption[];
  error?: string;
  message?: string;
};

type StatusSalvamento = "RASCUNHO" | "PUBLICADO";

type MensagemTela = {
  tipo: "sucesso" | "erro";
  texto: string;
};

const FORMULARIO_INICIAL = {
  cursoId: "",
  cursoSemestreId: "",
  periodoLetivo: "",
  titulo: "",
  dataInicio: "",
  dataFim: "",
  dataInicioAulas: "",
  cargaMinimaOverride: "",
  cargaMaximaOverride: "",
  instrucoes: "",
  exigeAprovacao: false,
  permiteRascunho: true,
  bloqueiaInadimplente: false,
};

function formatarDataHora(valor?: string | null) {
  if (!valor) {
    return "Não informado";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "Data inválida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

function nomeStatus(status: string) {
  const nomes: Record<string, string> = {
    RASCUNHO: "Rascunho",
    PUBLICADO: "Publicado",
    ENCERRADO: "Encerrado",
    CANCELADO: "Cancelado",
  };

  return nomes[status] || status;
}

function classeStatus(status: string) {
  if (status === "PUBLICADO") {
    return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (status === "ENCERRADO") {
    return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }

  if (status === "CANCELADO") {
    return "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
  }

  return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
}

function converterParaIso(valor: string) {
  if (!valor) {
    return null;
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data.toISOString();
}

export default function RematriculasSemestraisPage() {
  const [cursos, setCursos] = useState<CursoOption[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoRematricula[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<MensagemTela | null>(null);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);

  const carregarDados = useCallback(async () => {
    setCarregando(true);

    try {
      const resposta = await fetch("/api/admin/rematriculas-semestrais", {
        method: "GET",
        cache: "no-store",
      });

      const dados = (await resposta.json()) as RespostaApi;

      if (!resposta.ok) {
        throw new Error(dados.error || "Não foi possível carregar os dados.");
      }

      setCursos(dados.cursos || []);
      setPeriodos(dados.periodos || []);
    } catch (error) {
      setMensagem({
        tipo: "erro",
        texto:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os períodos de rematrícula.",
      });
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const cursoSelecionado = useMemo(() => {
    const cursoId = Number(formulario.cursoId);

    return cursos.find((curso) => curso.id === cursoId) || null;
  }, [cursos, formulario.cursoId]);

  const semestreSelecionado = useMemo(() => {
    const semestreId = Number(formulario.cursoSemestreId);

    return (
      cursoSelecionado?.semestres.find(
        (semestre) => semestre.id === semestreId,
      ) || null
    );
  }, [cursoSelecionado, formulario.cursoSemestreId]);

  function alterarCurso(cursoId: string) {
    setFormulario((atual) => ({
      ...atual,
      cursoId,
      cursoSemestreId: "",
      cargaMinimaOverride: "",
      cargaMaximaOverride: "",
    }));
  }

  function alterarSemestre(cursoSemestreId: string) {
    const semestre = cursoSelecionado?.semestres.find(
      (item) => item.id === Number(cursoSemestreId),
    );

    setFormulario((atual) => ({
      ...atual,
      cursoSemestreId,
      cargaMinimaOverride:
        semestre?.cargaMinima !== null &&
        semestre?.cargaMinima !== undefined
          ? String(semestre.cargaMinima)
          : "",
      cargaMaximaOverride:
        semestre?.cargaMaxima !== null &&
        semestre?.cargaMaxima !== undefined
          ? String(semestre.cargaMaxima)
          : "",
    }));
  }

  async function salvarPeriodo(
    evento: FormEvent<HTMLFormElement>,
    status: StatusSalvamento,
  ) {
    evento.preventDefault();
    setMensagem(null);

    if (!formulario.cursoId) {
      setMensagem({
        tipo: "erro",
        texto: "Selecione o curso.",
      });
      return;
    }

    if (!formulario.cursoSemestreId) {
      setMensagem({
        tipo: "erro",
        texto: "Selecione o semestre de destino.",
      });
      return;
    }

    if (
      !formulario.periodoLetivo.trim() ||
      !formulario.dataInicio ||
      !formulario.dataFim
    ) {
      setMensagem({
        tipo: "erro",
        texto:
          "Informe o período letivo, a abertura e o encerramento da rematrícula.",
      });
      return;
    }

    setSalvando(true);

    try {
      const resposta = await fetch("/api/admin/rematriculas-semestrais", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cursoId: Number(formulario.cursoId),
          cursoSemestreId: Number(formulario.cursoSemestreId),
          periodoLetivo: formulario.periodoLetivo.trim(),
          titulo: formulario.titulo.trim(),
          dataInicio: converterParaIso(formulario.dataInicio),
          dataFim: converterParaIso(formulario.dataFim),
          dataInicioAulas: converterParaIso(formulario.dataInicioAulas),
          cargaMinimaOverride:
            formulario.cargaMinimaOverride === ""
              ? null
              : Number(formulario.cargaMinimaOverride),
          cargaMaximaOverride:
            formulario.cargaMaximaOverride === ""
              ? null
              : Number(formulario.cargaMaximaOverride),
          instrucoes: formulario.instrucoes.trim(),
          exigeAprovacao: formulario.exigeAprovacao,
          permiteRascunho: formulario.permiteRascunho,
          bloqueiaInadimplente: formulario.bloqueiaInadimplente,
          status,
        }),
      });

      const dados = (await resposta.json()) as RespostaApi;

      if (!resposta.ok) {
        throw new Error(
          dados.error || "Não foi possível salvar o período de rematrícula.",
        );
      }

      setFormulario(FORMULARIO_INICIAL);
      setMensagem({
        tipo: "sucesso",
        texto:
          dados.message ||
          "O período de rematrícula foi salvo corretamente.",
      });

      await carregarDados();
    } catch (error) {
      setMensagem({
        tipo: "erro",
        texto:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar o período de rematrícula.",
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="phanyx-rematriculas-semestrais min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
            Acadêmico
          </p>

          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            Rematrículas semestrais
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
            Defina quando os alunos poderão selecionar as disciplinas do
            próximo semestre e quais regras deverão ser respeitadas.
          </p>
        </header>

        {mensagem && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              mensagem.tipo === "sucesso"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
            }`}
          >
            {mensagem.texto}
          </div>
        )}

        <form
          onSubmit={(evento) => salvarPeriodo(evento, "RASCUNHO")}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
        >
          <div className="mb-6">
            <h2 className="text-lg font-bold">
              Configurar novo período
            </h2>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              O aluno somente visualizará a rematrícula dentro das datas
              estabelecidas.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-semibold">Curso</span>

              <select
                value={formulario.cursoId}
                onChange={(evento) => alterarCurso(evento.target.value)}
                className="phanyx-rematricula-select h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Selecione o curso</option>

                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nome}
                    {curso.codigo ? ` — ${curso.codigo}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">
                Semestre de destino
              </span>

              <select
                value={formulario.cursoSemestreId}
                onChange={(evento) =>
                  alterarSemestre(evento.target.value)
                }
                disabled={!cursoSelecionado}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">Selecione o semestre</option>

                {cursoSelecionado?.semestres.map((semestre) => (
                  <option key={semestre.id} value={semestre.id}>
                    {semestre.numero}º semestre
                    {semestre.titulo ? ` — ${semestre.titulo}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">
                Período letivo
              </span>

              <input
                value={formulario.periodoLetivo}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    periodoLetivo: evento.target.value,
                  }))
                }
                placeholder="Ex.: 2027.1"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="space-y-2 md:col-span-2 xl:col-span-3">
              <span className="text-sm font-semibold">
                Título do período
              </span>

              <input
                value={formulario.titulo}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    titulo: evento.target.value,
                  }))
                }
                placeholder="Será preenchido automaticamente se ficar em branco"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">
                Abertura da rematrícula
              </span>

              <input
                type="datetime-local"
                value={formulario.dataInicio}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    dataInicio: evento.target.value,
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">
                Encerramento da rematrícula
              </span>

              <input
                type="datetime-local"
                value={formulario.dataFim}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    dataFim: evento.target.value,
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">
                Início das aulas
              </span>

              <input
                type="datetime-local"
                value={formulario.dataInicioAulas}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    dataInicioAulas: evento.target.value,
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">
                Carga horária mínima
              </span>

              <input
                type="number"
                min="0"
                value={formulario.cargaMinimaOverride}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    cargaMinimaOverride: evento.target.value,
                  }))
                }
                placeholder={
                  semestreSelecionado?.cargaMinima !== null &&
                  semestreSelecionado?.cargaMinima !== undefined
                    ? String(semestreSelecionado.cargaMinima)
                    : "Não definida"
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">
                Carga horária máxima
              </span>

              <input
                type="number"
                min="0"
                value={formulario.cargaMaximaOverride}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    cargaMaximaOverride: evento.target.value,
                  }))
                }
                placeholder={
                  semestreSelecionado?.cargaMaxima !== null &&
                  semestreSelecionado?.cargaMaxima !== undefined
                    ? String(semestreSelecionado.cargaMaxima)
                    : "Não definida"
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="space-y-2 md:col-span-2 xl:col-span-3">
              <span className="text-sm font-semibold">
                Instruções para os alunos
              </span>

              <textarea
                value={formulario.instrucoes}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    instrucoes: evento.target.value,
                  }))
                }
                rows={4}
                placeholder="Informe orientações sobre seleção de disciplinas, horários, pendências e confirmação."
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <input
                type="checkbox"
                checked={formulario.exigeAprovacao}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    exigeAprovacao: evento.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4"
              />

              <span>
                <strong className="block text-sm">
                  Exigir aprovação
                </strong>

                <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
                  A secretaria ou coordenação deverá aprovar a seleção.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <input
                type="checkbox"
                checked={formulario.permiteRascunho}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    permiteRascunho: evento.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4"
              />

              <span>
                <strong className="block text-sm">
                  Permitir rascunho
                </strong>

                <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
                  O aluno poderá salvar a seleção antes de enviar.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <input
                type="checkbox"
                checked={formulario.bloqueiaInadimplente}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    bloqueiaInadimplente: evento.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4"
              />

              <span>
                <strong className="block text-sm">
                  Bloquear inadimplentes
                </strong>

                <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
                  Alunos inadimplentes não poderão enviar a rematrícula.
                </span>
              </span>
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
            <button
              type="submit"
              disabled={salvando}
              className="phanyx-rematricula-botao-rascunho h-11 rounded-xl border px-5 text-sm font-semibold transition disabled:cursor-not-allowed"
            >
              {salvando ? "Salvando..." : "Salvar rascunho"}
            </button>

            <button
              type="button"
              disabled={salvando}
              onClick={(evento) => {
                const formularioHtml = evento.currentTarget.form;

                if (formularioHtml) {
                  salvarPeriodo(
                    {
                      preventDefault: () => undefined,
                    } as FormEvent<HTMLFormElement>,
                    "PUBLICADO",
                  );
                }
              }}
              className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? "Publicando..." : "Criar e publicar"}
            </button>
          </div>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="text-lg font-bold">
              Períodos configurados
            </h2>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Acompanhe as campanhas de rematrícula da instituição.
            </p>
          </div>

          {carregando ? (
            <div className="p-8 text-center text-sm text-slate-600 dark:text-slate-400">
              Carregando períodos...
            </div>
          ) : periodos.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-semibold">
                Nenhum período de rematrícula configurado.
              </p>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Utilize o formulário acima para criar o primeiro período.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {periodos.map((periodo) => (
                <article
                  key={periodo.id}
                  className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">
                        {periodo.titulo ||
                          `Rematrícula ${periodo.periodoLetivo}`}
                      </h3>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${classeStatus(
                          periodo.status,
                        )}`}
                      >
                        {nomeStatus(periodo.status)}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {periodo.curso?.nome || "Curso não informado"} ·{" "}
                      {periodo.cursoSemestre?.numero ||
                        periodo.semestreNumero ||
                        "—"}
                      º semestre · {periodo.periodoLetivo}
                    </p>

                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <span className="block text-xs font-semibold uppercase text-slate-500">
                          Abertura
                        </span>
                        <span className="mt-1 block">
                          {formatarDataHora(periodo.dataInicio)}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-semibold uppercase text-slate-500">
                          Encerramento
                        </span>
                        <span className="mt-1 block">
                          {formatarDataHora(periodo.dataFim)}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-semibold uppercase text-slate-500">
                          Início das aulas
                        </span>
                        <span className="mt-1 block">
                          {formatarDataHora(periodo.dataInicioAulas)}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-semibold uppercase text-slate-500">
                          Carga horária
                        </span>
                        <span className="mt-1 block">
                          {periodo.cargaMinimaOverride ??
                            periodo.cursoSemestre?.cargaMinima ??
                            "—"}
                          h a{" "}
                          {periodo.cargaMaximaOverride ??
                            periodo.cursoSemestre?.cargaMaxima ??
                            "—"}
                          h
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex min-w-40 flex-row gap-3 lg:flex-col lg:items-end lg:justify-center">
                    <div className="rounded-xl bg-slate-100 px-4 py-3 text-center dark:bg-slate-800">
                      <span className="block text-xl font-bold">
                        {periodo._count.rematriculas}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        rematrículas
                      </span>
                    </div>

                    {periodo.exigeAprovacao && (
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                        Exige aprovação
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
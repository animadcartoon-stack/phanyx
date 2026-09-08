"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

type Polo = {
  id: number;
  nome: string;
  codigo?: string | null;
  ativo: boolean;
  statusComercial:
    | "ATIVO"
    | "PENDENTE_ATIVACAO"
    | "SUSPENSO"
    | "ENCERRADO";
};

type ModalidadeCertificado =
  | "GERAL"
  | "BACHARELADO"
  | "LICENCIATURA"
  | "TECNOLOGO"
  | "POS_GRADUACAO"
  | "MBA"
  | "MESTRADO"
  | "DOUTORADO"
  | "TECNICO"
  | "CURSO_LIVRE"
  | "OFICINA"
  | "ENSINO_MEDIO"
  | "ENSINO_FUNDAMENTAL"
  | "EDUCACAO_INFANTIL"
  | "PRE_ESCOLA"
  | "EXTENSAO"
  | "CAPACITACAO"
  | "TREINAMENTO"
  | "EJA"
  | "OUTRO";

const OPCOES_MODALIDADE_CERTIFICADO: ModalidadeCertificado[] = [
  "GERAL",
  "BACHARELADO",
  "LICENCIATURA",
  "TECNOLOGO",
  "POS_GRADUACAO",
  "MBA",
  "MESTRADO",
  "DOUTORADO",
  "TECNICO",
  "CURSO_LIVRE",
  "OFICINA",
  "ENSINO_MEDIO",
  "ENSINO_FUNDAMENTAL",
  "EDUCACAO_INFANTIL",
  "PRE_ESCOLA",
  "EXTENSAO",
  "CAPACITACAO",
  "TREINAMENTO",
  "EJA",
  "OUTRO",
];

type Curso = {
  id: number;
  nome: string;
  codigo?: string | null;
  descricao?: string | null;
  modalidadeCertificado?: ModalidadeCertificado | null;
  quantidadeSemestres?: number | null;
  ativo: boolean;
  valorMatricula?: number | null;
  valorMensalidade?: number | null;
  quantidadeParcelas?: number | null;
  createdAt?: string | null;
  excluidoEm?: string | null;
  expiraExclusaoEm?: string | null;
  criadoPor?: {
  id: number;
  nome: string;
} | null;
  excluidoPor?: {
  id: number;
  nome: string;
} | null;
  cursosPolos?: {
    id: number;
    poloId: number;
    polo?: Polo | null;
  }[];
  publicacoesRedeOrigem?: {
  id: number;
  poloId?: number | null;
  polo?: {
    id: number;
    nome: string;
  } | null;
  instituicaoDestino?: {
    id: number;
    nome: string;
  } | null;
}[];
publicacaoRedeDestino?: {
  id: number;
} | null;
};

type FeedbackTipo = "sucesso" | "erro" | "";

export default function AdminCursosPage() {
  const searchParams = useSearchParams();
  const t = useTranslations("AdminCourses");
  const locale = useLocale();

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [polos, setPolos] = useState<Polo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"ATIVOS" | "EXCLUIDOS" | "TODOS">("ATIVOS");
  const [polosAbertos, setPolosAbertos] = useState(false);

  const [cursoEditandoPolos, setCursoEditandoPolos] =
  useState<Curso | null>(null);

const [
  polosEdicaoSelecionados,
  setPolosEdicaoSelecionados,
] = useState<number[]>([]);

const [salvandoPolosCurso, setSalvandoPolosCurso] =
  useState(false);

  const [form, setForm] = useState({
    nome: "",
    codigo: "",
    descricao: "",
    modalidadeCertificado: "GERAL" as ModalidadeCertificado,
    quantidadeSemestres: "",
    valorMatricula: "",
    valorMensalidade: "",
    quantidadeParcelas: "",
  });

  const [polosSelecionados, setPolosSelecionados] = useState<number[]>([]);

  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");
  const [criando, setCriando] = useState(false);
  const [cursoParaExcluir, setCursoParaExcluir] = useState<Curso | null>(null);
  const [modalErro, setModalErro] = useState("");
  const [excluindoCurso, setExcluindoCurso] = useState(false);

  useEffect(() => {
    if (!feedback) return;

    const timer = setTimeout(() => {
      setFeedback("");
      setFeedbackTipo("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [feedback]);

  function mostrarFeedback(tipo: Exclude<FeedbackTipo, "">, mensagem: string) {
    setFeedbackTipo(tipo);
    setFeedback(mensagem);
  }

function formatarDataHora(
  data: string | null | undefined,
  localeAtual: string,
  naoInformado: string
) {
  if (!data) return naoInformado;

  const d = new Date(data);

  if (Number.isNaN(d.getTime())) return naoInformado;

  return d.toLocaleString(localeAtual, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatarMoeda(valor: number, localeAtual: string) {
  return Number(valor || 0).toLocaleString(localeAtual, {
    style: "currency",
    currency: "BRL",
  });
}

function obterDataExpiracaoCurso(curso: Curso) {
  if (curso.expiraExclusaoEm) return curso.expiraExclusaoEm;
  if (!curso.excluidoEm) return null;

  const excluido = new Date(curso.excluidoEm);
  if (Number.isNaN(excluido.getTime())) return null;

  return new Date(excluido.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
}

function estaNoUltimoDia(data?: string | null) {
  if (!data) return false;

  const expira = new Date(data).getTime();
  const agora = Date.now();
  const umDia = 24 * 60 * 60 * 1000;

  return expira > agora && expira - agora <= umDia;
}

  async function carregarCursos() {
    try {
      const res = await fetch("/api/admin/cursos", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(t("errors.loadCourses"));
      }

      const data = await res.json();
      setCursos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
      setCursos([]);
    } finally {
      setLoading(false);
    }
  }

  async function carregarPolos() {
  try {
    const res = await fetch(
      "/api/admin/polos",
      {
        credentials: "include",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        t("errors.loadPoles")
      );
    }

    const polosRecebidos =
      Array.isArray(data)
        ? data
        : data?.polos;

    const polosAtivos: Polo[] =
      Array.isArray(polosRecebidos)
        ? polosRecebidos.filter(
            (polo: Polo) =>
              polo.ativo === true &&
              polo.statusComercial ===
                "ATIVO"
          )
        : [];

    setPolos(polosAtivos);

    const idsAtivos = new Set(
      polosAtivos.map(
        (polo) => polo.id
      )
    );

    setPolosSelecionados(
      (selecionados) =>
        selecionados.filter((id) =>
          idsAtivos.has(id)
        )
    );
  } catch (error) {
    console.error(
      "Erro ao carregar polos:",
      error
    );

    setPolos([]);
    setPolosSelecionados([]);
  }
}

  function alternarPolo(id: number) {
    setPolosSelecionados((atual) =>
      atual.includes(id)
        ? atual.filter((item) => item !== id)
        : [...atual, id]
    );
  }

  function abrirEdicaoPolos(curso: Curso) {
  const polosFisicos =
    curso.cursosPolos?.map(
      (item) => item.poloId
    ) ?? [];

  const unidadesPublicadas =
    curso.publicacoesRedeOrigem
      ?.map((item) => item.poloId)
      .filter(
        (id): id is number =>
          typeof id === "number"
      ) ?? [];

  setPolosEdicaoSelecionados(
    Array.from(
      new Set([
        ...polosFisicos,
        ...unidadesPublicadas,
      ])
    )
  );

  setCursoEditandoPolos(curso);
}

function alternarPoloEdicao(id: number) {
  setPolosEdicaoSelecionados((atual) =>
    atual.includes(id)
      ? atual.filter((poloId) => poloId !== id)
      : [...atual, id]
  );
}

async function salvarPolosDoCurso() {
  if (!cursoEditandoPolos) return;

  try {
    setSalvandoPolosCurso(true);
    setModalErro("");

    const res = await fetch(
      `/api/admin/cursos/${cursoEditandoPolos.id}/ofertas`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          poloIds: polosEdicaoSelecionados,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        t("errors.updateCoursePoles")
      );
    }

    setCursoEditandoPolos(null);
    setPolosEdicaoSelecionados([]);

    await carregarCursos();

    mostrarFeedback(
      "sucesso",
      t("messages.coursePolesUpdated")
    );
  } catch (error: any) {
    setModalErro(
      error?.message || t("errors.updateCoursePoles")
    );
  } finally {
    setSalvandoPolosCurso(false);
  }
}

  async function criarCurso(e: React.FormEvent) {
    e.preventDefault();

    try {
      setCriando(true);
      setFeedback("");
      setFeedbackTipo("");

      const res = await fetch("/api/admin/cursos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          nome: form.nome,
          codigo: form.codigo || null,
          descricao: form.descricao || null,
          modalidadeCertificado: form.modalidadeCertificado,
          quantidadeSemestres: form.quantidadeSemestres
            ? Number(form.quantidadeSemestres)
            : null,
          valorMatricula: form.valorMatricula
            ? Number(form.valorMatricula)
            : null,
          valorMensalidade: form.valorMensalidade
            ? Number(form.valorMensalidade)
            : null,
          quantidadeParcelas: form.quantidadeParcelas
            ? Number(form.quantidadeParcelas)
            : null,
          poloIds: polosSelecionados,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(t("errors.createCourse"));
      }

      setForm({
        nome: "",
        codigo: "",
        descricao: "",
        modalidadeCertificado: "GERAL",
        quantidadeSemestres: "",
        valorMatricula: "",
        valorMensalidade: "",
        quantidadeParcelas: "",
      });
      setPolosSelecionados([]);
      setPolosAbertos(false);

      await carregarCursos();
      mostrarFeedback("sucesso", t("messages.courseCreated"));
    } catch (error: any) {
      console.error("Erro ao criar curso:", error);
      setModalErro(error?.message || t("errors.createCourse"));
    } finally {
      setCriando(false);
    }
  }

async function confirmarExclusaoCurso() {
  if (!cursoParaExcluir) return;

  try {
    setExcluindoCurso(true);

    const res = await fetch("/api/admin/cursos", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        id: cursoParaExcluir.id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(t("errors.deleteCourse"));
    }

    await carregarCursos();

    mostrarFeedback(
      "sucesso",
      t("messages.courseDeleted")
    );

    setCursoParaExcluir(null);
  } catch (error: any) {
    mostrarFeedback(
      "erro",
      error?.message || t("errors.deleteCourse")
    );
  } finally {
    setExcluindoCurso(false);
  }
}

async function restaurarCurso(id: number) {
  try {
    const res = await fetch("/api/admin/cursos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, ativo: true }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(t("errors.restoreCourse"));
    }

    await carregarCursos();
    mostrarFeedback("sucesso", t("messages.courseRestored"));
  } catch (error: any) {
    mostrarFeedback("erro", error?.message || t("errors.restoreCourse"));
  }
}

  useEffect(() => {
    carregarCursos();
    carregarPolos();
  }, []);

  useEffect(() => {
    const buscaUrl = searchParams.get("busca");
    if (buscaUrl) {
      setBusca(buscaUrl);
    }
  }, [searchParams]);

  const cursosFiltrados = useMemo(() => {
    const termoTexto = busca.trim().toLowerCase();
    const termoNumerico = busca.replace(/\D/g, "");

    const cursosPorStatus = cursos.filter((curso) => {
  if (filtroStatus === "ATIVOS") return curso.ativo;
  if (filtroStatus === "EXCLUIDOS") return !curso.ativo;
  return true;
});

if (!termoTexto) return cursosPorStatus;

    return cursosPorStatus.filter((curso) => {
      const nome = String(curso.nome || "").toLowerCase().trim();
      const codigo = String(curso.codigo || "").toLowerCase().trim();
      const descricao = String(curso.descricao || "").toLowerCase().trim();
      const quantidadeSemestres = String(curso.quantidadeSemestres ?? "")
        .toLowerCase()
        .trim();
      const valorMatricula = String(curso.valorMatricula ?? "")
        .toLowerCase()
        .trim();
      const valorMensalidade = String(curso.valorMensalidade ?? "")
        .toLowerCase()
        .trim();
      const quantidadeParcelas = String(curso.quantidadeParcelas ?? "")
        .toLowerCase()
        .trim();
      const ativo = curso.ativo ? t("status.active").toLowerCase() : t("status.inactive").toLowerCase();
      const polosTexto = String(
        curso.cursosPolos?.map((item) => item.polo?.nome || "").join(" | ") || ""
      )
        .toLowerCase()
        .trim();

      const quantidadeSemestresNumerico =
        quantidadeSemestres.replace(/\D/g, "");
      const valorMatriculaNumerico = valorMatricula.replace(/\D/g, "");
      const valorMensalidadeNumerico = valorMensalidade.replace(/\D/g, "");
      const quantidadeParcelasNumerico =
        quantidadeParcelas.replace(/\D/g, "");

      return (
        nome.includes(termoTexto) ||
        codigo.includes(termoTexto) ||
        descricao.includes(termoTexto) ||
        quantidadeSemestres.includes(termoTexto) ||
        valorMatricula.includes(termoTexto) ||
        valorMensalidade.includes(termoTexto) ||
        quantidadeParcelas.includes(termoTexto) ||
        ativo.includes(termoTexto) ||
        polosTexto.includes(termoTexto) ||
        (termoNumerico !== "" &&
          (quantidadeSemestresNumerico.includes(termoNumerico) ||
            valorMatriculaNumerico.includes(termoNumerico) ||
            valorMensalidadeNumerico.includes(termoNumerico) ||
            quantidadeParcelasNumerico.includes(termoNumerico)))
      );
    });
  }, [cursos, busca, filtroStatus, t]);

  return (
    <div className="space-y-8 text-slate-900 dark:text-slate-100">
      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
            feedbackTipo === "sucesso"
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          }`}
        >
          {feedback}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🎓 {t("list.header.title")}</h1>
          <p className="text-gray-600 dark:text-slate-300">
            {t("list.header.description")}
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-lg bg-gray-800 px-4 py-2 text-white"
        >
          {t("list.header.backDashboard")}
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-4 text-xl font-semibold">{t("list.create.title")}</h2>

        <form
          onSubmit={criarCurso}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <input
            type="text"
            placeholder={t("list.create.namePlaceholder")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            required
          />

          <input
            type="text"
            placeholder={t("list.create.codePlaceholder")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
          />

<div className="md:col-span-2">
  <label className="mb-1 block text-sm font-medium">
    {t("common.modality")}
  </label>

  <select
    value={form.modalidadeCertificado}
    onChange={(e) =>
      setForm({
        ...form,
        modalidadeCertificado:
          e.target.value as ModalidadeCertificado,
      })
    }
    className="phanyx-curso-modalidade-select phanyx-course-native-select w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
  >
    {OPCOES_MODALIDADE_CERTIFICADO.map((valor) => (
      <option key={valor} value={valor}>
        {t(`modalities.${valor}`)}
      </option>
    ))}
  </select>

  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
    {t("list.create.modalityHelp")}
  </p>
</div>

          <textarea
            placeholder={t("list.create.descriptionPlaceholder")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 md:col-span-2"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            rows={4}
          />

          <input
            type="number"
            placeholder={t("list.create.semestersPlaceholder")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            value={form.quantidadeSemestres}
            onChange={(e) =>
              setForm({ ...form, quantidadeSemestres: e.target.value })
            }
          />

          <input
            type="number"
            step="0.01"
            placeholder={t("list.create.enrollmentValuePlaceholder")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            value={form.valorMatricula}
            onChange={(e) =>
              setForm({ ...form, valorMatricula: e.target.value })
            }
          />

          <input
            type="number"
            step="0.01"
            placeholder={t("list.create.monthlyValuePlaceholder")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            value={form.valorMensalidade}
            onChange={(e) =>
              setForm({ ...form, valorMensalidade: e.target.value })
            }
          />

          <input
            type="number"
            placeholder={t("list.create.installmentsPlaceholder")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            value={form.quantidadeParcelas}
            onChange={(e) =>
              setForm({ ...form, quantidadeParcelas: e.target.value })
            }
          />

          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => setPolosAbertos((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-3 text-left dark:border-slate-700 dark:bg-slate-950"
            >
              <span className="font-medium text-gray-800 dark:text-slate-200">
                {t("list.create.poles.label")}
                {polosSelecionados.length > 0
                  ? ` (${t("list.create.poles.selectedCount", {
                      count: polosSelecionados.length,
                    })})`
                  : ""}
              </span>
              <span className="text-sm text-gray-500 dark:text-slate-400">
                {polosAbertos ? t("common.closeWithArrow") : t("common.openWithArrow")}
              </span>
            </button>

            {polosAbertos && (
              <div className="mt-2 max-h-52 overflow-auto rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                {polos.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {t("list.create.poles.none")}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {polos.map((polo) => (
                      <label
                        key={polo.id}
                        className="flex items-center gap-2 rounded px-2 py-1 text-slate-800 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <input
                          type="checkbox"
                          checked={polosSelecionados.includes(polo.id)}
                          onChange={() => alternarPolo(polo.id)}
                        />
                        <span>
                          {polo.nome}
                          {polo.codigo ? ` — ${polo.codigo}` : ""}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t("list.create.poles.help")}
            </p>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={criando}
              className="rounded-lg bg-purple-600 px-5 py-2 text-white disabled:opacity-50"
            >
              {criando ? t("common.saving") : t("list.create.saveCourse")}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold">{t("list.registered.title")}</h2>

          <input
            type="text"
            placeholder={t("list.registered.searchPlaceholder")}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 md:w-[460px]"
          />

<select
  value={filtroStatus}
  onChange={(e) =>
    setFiltroStatus(e.target.value as "ATIVOS" | "EXCLUIDOS" | "TODOS")
  }
  className="phanyx-course-native-select w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 md:w-[180px]"
>
  <option value="ATIVOS">{t("filters.active")}</option>
  <option value="EXCLUIDOS">{t("filters.deleted")}</option>
  <option value="TODOS">{t("filters.all")}</option>
</select>

        </div>

        {loading ? (
          <p className="text-gray-500 dark:text-slate-400">{t("list.registered.loading")}</p>
        ) : cursosFiltrados.length === 0 ? (
          <p className="text-gray-500 dark:text-slate-400">{t("list.registered.empty")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {cursosFiltrados.map((curso) => (
              <div
                key={curso.id}
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-sm dark:border-slate-700 dark:bg-slate-950/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {curso.nome}
                    </h3>

                    {curso.codigo ? (
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        {t("common.code")}: {curso.codigo}
                      </p>
                    ) : null}

                    {curso.descricao ? (
                      <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                        {curso.descricao}
                      </p>
                    ) : null}

                    <div className="mt-3 space-y-1 text-sm text-gray-700 dark:text-slate-300">
                      <p>
                        {t("common.semesters")}:{" "}
                        {curso.quantidadeSemestres != null
                          ? curso.quantidadeSemestres
                          : t("common.notInformed")}
                      </p>
                      <p>
                        {t("common.enrollmentValue")}:{" "}
                        {curso.valorMatricula != null
                          ? formatarMoeda(curso.valorMatricula, locale)
                          : t("common.notInformed")}
                      </p>
                      <p>
                        {t("common.monthlyValue")}:{" "}
                        {curso.valorMensalidade != null
                          ? formatarMoeda(curso.valorMensalidade, locale)
                          : t("common.notInformed")}
                      </p>
                      <p>
                        {t("common.installments")}:{" "}
                        {curso.quantidadeParcelas != null
                          ? curso.quantidadeParcelas
                          : t("common.notInformed")}
                      </p>
                      <p>
                        {t("common.poles")}:{" "}
                        {curso.cursosPolos && curso.cursosPolos.length > 0
                          ? curso.cursosPolos
                              .map((item) => item.polo?.nome)
                              .filter(Boolean)
                              .join(", ")
                          : t("list.cards.noPoles")}
                      </p>

<p>
  {t("list.cards.courseId")}: {curso.id}
</p>

<p>
  {t("list.cards.createdAt")}: {formatarDataHora(curso.createdAt, locale, t("common.notInformed"))}
</p>

<p>
  {t("list.cards.createdBy")}: {curso.criadoPor?.nome || t("common.notInformed")}
</p>

{!curso.ativo && (() => {
  const expiraCurso = obterDataExpiracaoCurso(curso);

  return (
    <>
      <p>
        {t("list.cards.deletedAt")}: {formatarDataHora(curso.excluidoEm, locale, t("common.notInformed"))}
      </p>

      <p>
        {t("list.cards.deletedBy")}: {curso.excluidoPor?.nome || t("common.notInformed")}
      </p>

      <p>
        {t("list.cards.restoreUntil")}:{" "}
        {formatarDataHora(expiraCurso, locale, t("common.notInformed"))}
      </p>

      <div
        className={`mt-3 rounded-xl border p-3 text-sm ${
          estaNoUltimoDia(expiraCurso)
            ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
            : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        }`}
      >
        {estaNoUltimoDia(expiraCurso)
          ? t("list.cards.lastRestoreDay", {
              date: formatarDataHora(
                expiraCurso,
                locale,
                t("common.notInformed")
              ),
            })
          : t("list.cards.restoreWindow")}
      </div>
    </>
  );
})()}

                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
  <Link
    href={`/admin/cursos/${curso.id}`}
    className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white"
  >
    {curso.publicacaoRedeDestino
      ? t("list.actions.viewStructure")
      : t("list.actions.buildCurriculum")}
  </Link>

  {!curso.publicacaoRedeDestino && curso.ativo && (
    <button
      type="button"
      onClick={() => abrirEdicaoPolos(curso)}
      className="rounded-lg bg-slate-700 px-4 py-2 text-white hover:bg-slate-800"
    >
      {t("list.actions.editPoles")}
    </button>
  )}

  {!curso.publicacaoRedeDestino &&
    (curso.ativo ? (
      <button
        type="button"
        onClick={() => setCursoParaExcluir(curso)}
        className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
      >
        {t("common.delete")}
      </button>
    ) : (
      <button
        type="button"
        onClick={() => restaurarCurso(curso.id)}
        className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
      >
        {t("common.restore")}
      </button>
    ))}
</div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      curso.ativo
                        ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-200"
                        : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-200"
                    }`}
                  >
                    {curso.ativo ? t("status.active") : t("status.inactive")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

{cursoEditandoPolos && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
    <div className="phanyx-curso-ofertas-modal w-full max-w-xl rounded-3xl border p-6 shadow-2xl">
      <h3 className="phanyx-curso-ofertas-titulo text-xl font-bold">
        {t("list.editPoles.title")}
      </h3>

      <p className="phanyx-curso-ofertas-subtitulo mt-2 text-sm">
        {t("common.course")}:{" "}
        <strong className="phanyx-curso-ofertas-nome">
          {cursoEditandoPolos.nome}
        </strong>
      </p>

      <div className="phanyx-curso-ofertas-lista mt-5 max-h-72 overflow-auto rounded-xl border p-3">
        {polos.length === 0 ? (
          <p className="phanyx-curso-ofertas-vazio text-sm">
            {t("list.editPoles.noActivePoles")}
          </p>
        ) : (
          <div className="space-y-2">
            {polos.map((polo) => (
              <label
                key={polo.id}
                className="phanyx-curso-ofertas-item flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={polosEdicaoSelecionados.includes(
                    polo.id
                  )}
                  onChange={() =>
                    alternarPoloEdicao(polo.id)
                  }
                  className="h-4 w-4"
                />

                <span className="phanyx-curso-ofertas-item-texto text-sm font-medium">
                  {polo.nome}
                  {polo.codigo
                    ? ` — ${polo.codigo}`
                    : ""}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <p className="phanyx-curso-ofertas-ajuda mt-3 text-xs leading-5">
        {t("list.editPoles.help")}
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setCursoEditandoPolos(null);
            setPolosEdicaoSelecionados([]);
          }}
          disabled={salvandoPolosCurso}
          className="phanyx-curso-ofertas-cancelar rounded-xl border px-4 py-2 font-medium disabled:opacity-50"
        >
          {t("common.cancel")}
        </button>

        <button
          type="button"
          onClick={salvarPolosDoCurso}
          disabled={salvandoPolosCurso}
          className="phanyx-curso-ofertas-salvar rounded-xl px-4 py-2 font-semibold disabled:opacity-50"
        >
          {salvandoPolosCurso
            ? t("common.saving")
            : t("list.editPoles.save")}
        </button>
      </div>
    </div>
  </div>
)}

      {cursoParaExcluir && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          {t("list.deleteModal.title")}
        </h3>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t.rich("list.deleteModal.confirmation", {
            course: cursoParaExcluir.nome,
            strong: (chunks) => (
              <span className="font-semibold">{chunks}</span>
            ),
          })}
        </p>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {t("list.deleteModal.help")}
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setCursoParaExcluir(null)}
          disabled={excluindoCurso}
          className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {t("common.cancel")}
        </button>

        <button
          type="button"
          onClick={confirmarExclusaoCurso}
          disabled={excluindoCurso}
          className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {excluindoCurso ? t("common.deleting") : t("list.deleteModal.deleteCourse")}
        </button>
      </div>
    </div>
  </div>
)}
{modalErro && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-red-700 dark:text-red-300">
          {t("errors.couldNotSave")}
        </h3>

        <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
          {modalErro}
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setModalErro("")}
          className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          {t("common.understood")}
        </button>
      </div>
    </div>
  </div>
)}
      <style jsx global>{`
        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-course-native-select,
        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-course-native-select option,
        html[data-theme="system"].dark
          .phanyx-course-native-select,
        html[data-theme="system"].dark
          .phanyx-course-native-select option {
          background-color: #18181b !important;
          color: #fafafa !important;
        }

        html[data-theme-choice="system"][data-theme="light"]
          .phanyx-course-native-select,
        html[data-theme-choice="system"][data-theme="light"]
          .phanyx-course-native-select option,
        html[data-theme="system"]:not(.dark)
          .phanyx-course-native-select,
        html[data-theme="system"]:not(.dark)
          .phanyx-course-native-select option {
          background-color: #ffffff !important;
          color: #0f172a !important;
        }
      `}</style>

    </div>
  );
}
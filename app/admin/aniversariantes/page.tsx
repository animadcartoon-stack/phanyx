"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type TipoPessoa = "ALUNO" | "PROFESSOR" | "FUNCIONARIO";

type Aniversariante = {
  chave: string;
  id: number;
  tipo: TipoPessoa;
  nome: string;
  dataNascimento: string;
  dataAniversario: string;
  dia: number;
  mes: number;
  telefone: string | null;
  whatsapp: string;
  temWhatsapp: boolean;
  userId: number;
  fotoPerfil: string | null;
  status: string;
  contexto: string;
  departamentoId: number | null;
  departamento: string | null;
};

type Departamento = {
  id: number;
  nome: string;
};

type InstituicaoAniversariantes = {
  nome: string;
  telefone: string | null;
  whatsapp: string;
};

function classeTipo(tipo: TipoPessoa) {
  if (tipo === "ALUNO") {
    return "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-800";
  }

  if (tipo === "PROFESSOR") {
    return "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:ring-purple-800";
  }

  return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800";
}

function classeStatus(status: string) {
  const normalizado = status.toLowerCase();

  if (
    normalizado.includes("cancel") ||
    normalizado.includes("inativo") ||
    normalizado.includes("deslig")
  ) {
    return "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-800";
  }

  if (
    normalizado.includes("afast") ||
    normalizado.includes("atestado") ||
    normalizado.includes("suspens")
  ) {
    return "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800";
  }

  if (normalizado.includes("ativo")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800";
  }

  return "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700";
}

export default function AdminAniversariantesPage() {
  const locale = useLocale();
  const t = useTranslations("AdminBirthdays");
  const mesAtual = String(new Date().getMonth() + 1);

  const meses = useMemo(
    () =>
      Array.from({ length: 12 }, (_, indice) => ({
        valor: String(indice + 1),
        nome: new Intl.DateTimeFormat(locale, {
          month: "long",
          timeZone: "UTC",
        }).format(new Date(Date.UTC(2026, indice, 1))),
      })),
    [locale]
  );

  const [mes, setMes] = useState(mesAtual);
  const [tipo, setTipo] = useState("TODOS");
  const [status, setStatus] = useState("TODOS");
  const [whatsapp, setWhatsapp] = useState("TODOS");
  const [departamentoId, setDepartamentoId] = useState("TODOS");
  const [busca, setBusca] = useState("");

  const [instituicao, setInstituicao] =
    useState<InstituicaoAniversariantes | null>(null);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>(
    []
  );
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const [modalMensagemAberto, setModalMensagemAberto] = useState(false);
  const [modalWhatsappAberto, setModalWhatsappAberto] = useState(false);
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [sucesso, setSucesso] = useState("");

  const TITULO_ANIVERSARIO_PADRAO = t("messageDefaults.title");

  const MENSAGEM_ANIVERSARIO_PADRAO = t("messageDefaults.body");

  const [tituloMensagem, setTituloMensagem] = useState(
    TITULO_ANIVERSARIO_PADRAO
  );

  const [textoMensagem, setTextoMensagem] = useState(
    MENSAGEM_ANIVERSARIO_PADRAO
  );

  const selecionadosSet = useMemo(
    () => new Set(selecionados),
    [selecionados]
  );

  const aniversariantesSelecionados = useMemo(() => {
    return aniversariantes.filter((item) => selecionadosSet.has(item.chave));
  }, [aniversariantes, selecionadosSet]);

  function primeiroNome(nome: string) {
    return String(nome || "").trim().split(" ")[0] || "";
  }

  function nomeTipo(tipoPessoa: TipoPessoa) {
    if (tipoPessoa === "ALUNO") return t("personTypes.student");
    if (tipoPessoa === "PROFESSOR") return t("personTypes.teacher");
    return t("personTypes.employee");
  }

  function nomeStatus(statusPessoa: string) {
    const chave = String(statusPessoa || "").toUpperCase();

    const traducoes: Record<string, string> = {
      ATIVO: t("statuses.active"),
      INATIVO: t("statuses.inactive"),
      CANCELADO: t("statuses.cancelled"),
      AFASTADO: t("statuses.onLeave"),
      ATESTADO: t("statuses.medicalLeave"),
      SUSPENSO: t("statuses.suspended"),
    };

    return traducoes[chave] || statusPessoa;
  }

  function formatarDataAniversario(item: Aniversariante) {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2026, item.mes - 1, item.dia)));
  }

  function aplicarTags(texto: string, item: Aniversariante) {
    return String(texto || "")
      .replaceAll("{{nome}}", item.nome || "")
      .replaceAll("{{primeiroNome}}", primeiroNome(item.nome))
      .replaceAll("{{instituicao}}", instituicao?.nome || t("fallback.institution"))
      .replaceAll("{{dataAniversario}}", formatarDataAniversario(item))
      .replaceAll("{{dia}}", String(item.dia || ""))
      .replaceAll("{{mes}}", String(item.mes || ""))
      .replaceAll("{{tipoPessoa}}", nomeTipo(item.tipo))
      .replaceAll("{{departamento}}", item.departamento || "")
      .replaceAll("{{contexto}}", item.contexto || "")
      .replaceAll("{{status}}", item.status || "");
  }

  function textoWhatsapp(item: Aniversariante) {
    return aplicarTags(textoMensagem, item);
  }

  function linkWhatsapp(item: Aniversariante) {
    const numero = String(item.whatsapp || "").replace(/\D/g, "");
    const mensagem = encodeURIComponent(textoWhatsapp(item));

    if (!numero) return "";

    const numeroFinal = numero.startsWith("55") ? numero : `55${numero}`;

    return `https://wa.me/${numeroFinal}?text=${mensagem}`;
  }

  async function enviarMensagemChat() {
    try {
      setErro("");
      setSucesso("");

      if (aniversariantesSelecionados.length === 0) {
        setErro(t("feedback.selectAtLeastOne"));
        return;
      }

      setEnviandoMensagem(true);

      const destinatarios = aniversariantesSelecionados.map((item) => ({
        chave: item.chave,
        id: item.id,
        tipo: item.tipo,
        userId: item.userId,
        nome: item.nome,
        titulo: aplicarTags(tituloMensagem, item),
        mensagem: aplicarTags(textoMensagem, item),
      }));

      const resposta = await fetch("/api/admin/aniversariantes/enviar-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          destinatarios,
        }),
      });

      const json = await resposta.json();

      if (!resposta.ok) {
        throw new Error(json.error || t("feedback.sendError"));
      }

      setSucesso(t("feedback.sent", { count: json.total }));
      setModalMensagemAberto(false);
    } catch (error: any) {
      console.error(error);
      setErro(error.message || t("feedback.sendError"));
    } finally {
      setEnviandoMensagem(false);
    }
  }

  async function carregarAniversariantes() {
    try {
      setCarregando(true);
      setErro("");

      const params = new URLSearchParams();

      params.set("mes", mes);
      params.set("tipo", tipo);
      params.set("status", status);
      params.set("whatsapp", whatsapp);

      if (departamentoId !== "TODOS") {
        params.set("departamentoId", departamentoId);
      }

      if (busca.trim()) {
        params.set("busca", busca.trim());
      }

      const resposta = await fetch(`/api/admin/aniversariantes?${params}`, {
        credentials: "include",
      });

      const json = await resposta.json();

      if (!resposta.ok) {
        throw new Error(json.error || t("feedback.loadError"));
      }

      setAniversariantes(json.aniversariantes || []);
      setDepartamentos(json.departamentos || []);
      setInstituicao(json.instituicao || null);
      setSelecionados([]);
    } catch (error: any) {
      console.error(error);
      setErro(error.message || t("feedback.loadError"));
    } finally {
      setCarregando(false);
    }
  }

  function montarParamsRelatorio() {
    const params = new URLSearchParams();

    params.set("mes", mes);
    params.set("tipo", tipo);
    params.set("status", status);
    params.set("whatsapp", whatsapp);

    if (departamentoId !== "TODOS") {
      params.set("departamentoId", departamentoId);
    }

    if (busca.trim()) {
      params.set("busca", busca.trim());
    }

    return params;
  }

  async function baixarRelatorio(formato: "pdf" | "excel") {
    try {
      setErro("");

      const params = montarParamsRelatorio();

      const endpoint =
        formato === "pdf"
          ? `/api/admin/aniversariantes/exportar-pdf?${params}`
          : `/api/admin/aniversariantes/exportar-excel?${params}`;

      const resposta = await fetch(endpoint, {
        credentials: "include",
      });

      if (!resposta.ok) {
        let mensagem =
          formato === "pdf"
            ? t("feedback.pdfError")
            : t("feedback.excelError");

        try {
          const json = await resposta.json();
          mensagem = json.error || mensagem;
        } catch { }

        throw new Error(mensagem);
      }

      const blob = await resposta.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download =
        formato === "pdf"
          ? `${t("reports.fileBase", { month: mes })}.pdf`
          : `${t("reports.fileBase", { month: mes })}.xls`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error(error);
      setErro(error.message || t("feedback.downloadError"));
    }
  }

  useEffect(() => {
    carregarAniversariantes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, tipo, status, whatsapp, departamentoId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarAniversariantes();
    }, 450);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  function alternarSelecionado(chave: string) {
    setSelecionados((atuais) => {
      if (atuais.includes(chave)) {
        return atuais.filter((item) => item !== chave);
      }

      return [...atuais, chave];
    });
  }

  function alternarTodos() {
    if (selecionados.length === aniversariantes.length) {
      setSelecionados([]);
      return;
    }

    setSelecionados(aniversariantes.map((item) => item.chave));
  }

  const todosSelecionados =
    aniversariantes.length > 0 &&
    selecionados.length === aniversariantes.length;

  return (
    <main className="phanyx-aniversariantes-page min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="phanyx-aniversariantes-card phanyx-aniversariantes-hero rounded-3xl border p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                {t("hero.eyebrow")}
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                {t("hero.title")}
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                {t("hero.description")}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-100">
              <p className="font-semibold">{t("hero.selected")}</p>
              <p className="text-2xl font-bold">{selecionados.length}</p>
            </div>
          </div>
        </section>

        <section className="phanyx-aniversariantes-card rounded-3xl border p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t("filters.month")}
              </span>
              <select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="phanyx-aniversariantes-campo w-full rounded-xl px-3 py-2 text-sm outline-none"
              >
                {meses.map((item) => (
                  <option key={item.valor} value={item.valor}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t("filters.type")}
              </span>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="phanyx-aniversariantes-campo w-full rounded-xl px-3 py-2 text-sm outline-none"
              >
                <option value="TODOS">{t("common.all")}</option>
                <option value="ALUNO">{t("personTypes.students")}</option>
                <option value="PROFESSOR">{t("personTypes.teachers")}</option>
                <option value="FUNCIONARIO">{t("personTypes.employees")}</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t("filters.status")}
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="phanyx-aniversariantes-campo w-full rounded-xl px-3 py-2 text-sm outline-none"
              >
                <option value="TODOS">{t("common.all")}</option>
                <option value="ATIVO">{t("statuses.active")}</option>
                <option value="INATIVO">{t("statuses.inactive")}</option>
                <option value="CANCELADO">{t("statuses.cancelled")}</option>
                <option value="AFASTADO">{t("statuses.onLeave")}</option>
                <option value="ATESTADO">{t("statuses.medicalLeave")}</option>
                <option value="SUSPENSO">{t("statuses.suspended")}</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t("filters.whatsapp")}
              </span>
              <select
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="phanyx-aniversariantes-campo w-full rounded-xl px-3 py-2 text-sm outline-none"
              >
                <option value="TODOS">{t("common.all")}</option>
                <option value="COM">{t("filters.withWhatsapp")}</option>
                <option value="SEM">{t("filters.withoutWhatsapp")}</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t("filters.department")}
              </span>
              <select
                value={departamentoId}
                onChange={(e) => setDepartamentoId(e.target.value)}
                className="phanyx-aniversariantes-campo w-full rounded-xl px-3 py-2 text-sm outline-none"
              >
                <option value="TODOS">{t("common.all")}</option>
                {departamentos.map((departamento) => (
                  <option key={departamento.id} value={departamento.id}>
                    {departamento.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t("filters.search")}
              </span>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder={t("filters.searchPlaceholder")}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900"
              />
            </label>
          </div>
        </section>

        {erro && (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-100">
            {erro}
          </section>
        )}

        {sucesso && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-100">
            {sucesso}
          </section>
        )}

        <section className="phanyx-aniversariantes-card overflow-hidden rounded-3xl border shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                {t("list.title")}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {carregando
                  ? t("common.loading")
                  : t("list.recordsFound", {
                      count: aniversariantes.length,
                    })}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => baixarRelatorio("pdf")}
                disabled={carregando}
                className="phanyx-aniversariantes-btn phanyx-aniversariantes-btn-pdf"
              >
                📄 {t("reports.downloadPdf")}
              </button>

              <button
                type="button"
                onClick={() => baixarRelatorio("excel")}
                disabled={carregando}
                className="phanyx-aniversariantes-btn phanyx-aniversariantes-btn-excel"
              >
                📊 {t("reports.downloadExcel")}
              </button>

              <button
                type="button"
                onClick={() => setModalMensagemAberto(true)}
                className="phanyx-aniversariantes-btn phanyx-aniversariantes-btn-mensagem"
              >
                {t("actions.sendMessage")}
              </button>

              <button
                type="button"
                onClick={() => setModalWhatsappAberto(true)}
                className="phanyx-aniversariantes-btn phanyx-aniversariantes-btn-whatsapp"
              >
                {t("actions.generateWhatsappLinks")}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-100 dark:bg-slate-950">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={todosSelecionados}
                      onChange={alternarTodos}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    {t("table.name")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    {t("table.type")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    {t("table.birthday")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    {t("table.departmentContext")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    {t("table.whatsapp")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    {t("table.status")}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {carregando && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-slate-600 dark:text-slate-300"
                    >
                      {t("list.loadingBirthdays")}
                    </td>
                  </tr>
                )}

                {!carregando && aniversariantes.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-slate-600 dark:text-slate-300"
                    >
                      {t("list.empty")}
                    </td>
                  </tr>
                )}

                {!carregando &&
                  aniversariantes.map((item) => (
                    <tr
                      key={item.chave}
                      className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                    >
                      <td className="px-4 py-4 align-middle">
                        <input
                          type="checkbox"
                          checked={selecionadosSet.has(item.chave)}
                          onChange={() => alternarSelecionado(item.chave)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700"
                        />
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-sm font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {item.fotoPerfil ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.fotoPerfil}
                                alt={item.nome}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              item.nome.slice(0, 1).toUpperCase()
                            )}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-950 dark:text-white">
                              {item.nome}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {t("table.identifiers", {
                                id: item.id,
                                userId: item.userId,
                              })}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${classeTipo(
                            item.tipo
                          )}`}
                        >
                          {nomeTipo(item.tipo)}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <span className="phanyx-aniversariante-data">
                          {formatarDataAniversario(item)}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <p className="text-sm text-slate-800 dark:text-slate-200">
                          {item.departamento || item.contexto || "—"}
                        </p>
                      </td>

                      <td className="px-4 py-4 align-middle">
                        {item.telefone ? (
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {item.telefone}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {item.temWhatsapp
                                ? t("table.hasNumber")
                                : t("table.incompleteNumber")}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {t("table.noPhone")}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${classeStatus(
                            item.status
                          )}`}
                        >
                          {nomeStatus(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      {modalMensagemAberto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4">
          <div className="phanyx-aniversariantes-modal w-full max-w-2xl rounded-3xl border p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2>{t("messageModal.title")}</h2>
                <p>
                  {t("messageModal.description")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalMensagemAberto(false)}
                className="phanyx-aniversariantes-modal-fechar"
                aria-label={t("common.close")}
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span>{t("messageModal.subject")}</span>
                <input
                  value={tituloMensagem}
                  onChange={(e) => setTituloMensagem(e.target.value)}
                  className="phanyx-aniversariantes-campo mt-1 w-full rounded-xl px-3 py-2 text-sm outline-none"
                />
              </label>

              <label className="block">
                <span>{t("messageModal.message")}</span>
                <textarea
                  value={textoMensagem}
                  onChange={(e) => setTextoMensagem(e.target.value)}
                  rows={6}
                  className="phanyx-aniversariantes-campo mt-1 w-full rounded-xl px-3 py-2 text-sm outline-none"
                />
              </label>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <strong>{t("messageModal.availableTags")}:</strong>{" "}
                {"{{nome}}, {{primeiroNome}}, {{instituicao}}, {{dataAniversario}}, {{dia}}, {{mes}}, {{tipoPessoa}}, {{departamento}}, {{contexto}}, {{status}}"}
              </div>

              <button
                type="button"
                onClick={() => {
                  setTituloMensagem(TITULO_ANIVERSARIO_PADRAO);
                  setTextoMensagem(MENSAGEM_ANIVERSARIO_PADRAO);
                }}
                className="phanyx-aniversariantes-btn phanyx-aniversariantes-btn-secundario"
              >
                {t("messageModal.restoreDefault")}
              </button>

              <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                <p className="text-sm font-bold">
                  {t("messageModal.selectedCount", {
                    count: aniversariantesSelecionados.length,
                  })}
                </p>

                {aniversariantesSelecionados[0] && (
                  <div className="mt-2 text-sm">
                    <p className="font-semibold">
                      {t("messageModal.preview")}:
                    </p>
                    <p className="mt-1">
                      {aplicarTags(textoMensagem, aniversariantesSelecionados[0])}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalMensagemAberto(false)}
                className="phanyx-aniversariantes-btn phanyx-aniversariantes-btn-secundario"
              >
                {t("common.cancel")}
              </button>

              <button
                type="button"
                onClick={enviarMensagemChat}
                disabled={enviandoMensagem}
                className="phanyx-aniversariantes-btn phanyx-aniversariantes-btn-mensagem"
              >
                {enviandoMensagem
                  ? t("common.sending")
                  : t("messageModal.sendNow")}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalWhatsappAberto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4">
          <div className="phanyx-aniversariantes-modal w-full max-w-3xl rounded-3xl border p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2>{t("whatsappModal.title")}</h2>
                <p>
                  {t("whatsappModal.description")}
                </p>

                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100">
                  <p>
                    {t("whatsappModal.institutionalNumber")}: {" "}
                    {instituicao?.telefone || t("fallback.notInformed")}
                  </p>

                  <p className="mt-2 font-medium">
                    {t("whatsappModal.connectedDeviceWarning")}
                  </p>

                  <p className="mt-2 font-medium">
                    {t("whatsappModal.futureIntegration")}
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={() => setModalWhatsappAberto(false)}
                className="phanyx-aniversariantes-modal-fechar"
                aria-label={t("common.close")}
              >
                ×
              </button>
            </div>

            <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {aniversariantesSelecionados.length === 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100">
                  {t("feedback.selectAtLeastOne")}
                </div>
              )}

              {aniversariantesSelecionados.map((item) => {
                const url = linkWhatsapp(item);

                return (
                  <div
                    key={item.chave}
                    className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-bold">{item.nome}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {item.telefone || t("table.noRegisteredPhone")}
                        </p>
                      </div>

                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="phanyx-aniversariantes-btn phanyx-aniversariantes-btn-whatsapp"
                        >
                          {t("whatsappModal.openWhatsapp")}
                        </a>
                      ) : (
                        <span className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
                          {t("whatsappModal.invalidNumber")}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-sm">
                      {textoWhatsapp(item)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setModalWhatsappAberto(false)}
                className="phanyx-aniversariantes-btn phanyx-aniversariantes-btn-secundario"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import PagamentoHoleriteModal from "@/components/rh/PagamentoHoleriteModal";
import AssinaturaRhHoleriteModal from "@/components/rh/AssinaturaRhHoleriteModal";
import ReciboAssinadoManualModal from "@/components/rh/ReciboAssinadoManualModal";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";

type Funcionario = {
  id: number;
  nome: string;
  cargo?: string | null;
  setor?: string | null;
  salario?: string | number | null;
  salarioBase?: string | number | null;
};

type Evento = {
  codigo: string;
  descricao: string;
  referencia: string;
  tipo: "VENCIMENTO" | "DESCONTO";
  valor: string;
};

type EventoFolhaPadrao = {
  id: number;
  codigo: string;
  descricao: string;
  tipo: "VENCIMENTO" | "DESCONTO" | "INFORMATIVO";
  natureza?: string | null;
};

type DocumentoAssinadoManualResumo = {
  id: number;
  arquivoNome: string;
  arquivoMime: string;
  criadoEm: string;
  dataAssinaturaDeclarada?: string | null;
  enviadoPorNomeSnapshot: string;
};

type PagamentoResumoHolerite = {
  id: number;
  status: string;
  reciboNumero: string;
  registradoEm?: string | null;
  pagoEm?: string | null;
  assinaturaSolicitadaEm?: string | null;
  confirmadoPeloFuncionarioEm?: string | null;
  assinaturaImagemUrl?: string | null;
  assinadoRhPorId?: number | null;
  assinadoRhEm?: string | null;
  tipoAssinaturaRh?: string | null;
  assinaturaRhImagemUrl?: string | null;
  assinadoRhNomeSnapshot?: string | null;
  assinadoRhEmailSnapshot?: string | null;
  tipoConfirmacaoRecebimento?:
  | "ASSINATURA_DIGITAL"
  | "DOCUMENTO_MANUAL"
  | null;

  documentosAssinadosManualmente?: DocumentoAssinadoManualResumo[];
};

type Holerite = {
  id: number;
  competenciaMes: number;
  competenciaAno: number;
  salarioBase: string | number;
  totalVencimentos: string | number;
  totalDescontos: string | number;
  valorLiquido: string | number;
  status: string;
  funcionario?: {
    id?: number;
    nome: string;
    cargo?: string | null;
    userId?: number | null;

    user?: {
      id: number;
      ativo: boolean;
    } | null;
  };
  eventos?: {
    id: number;
    codigo?: string | null;
    descricao: string;
    referencia?: string | null;
    tipo: string;
    valor: string | number;
  }[];
  pagamentos?: PagamentoResumoHolerite[];
};

type LinkAssinaturaRH = {
  pagamentoId: number;
  reciboNumero: string;
  urlAssinatura: string;
  caminhoAssinatura: string;
  expiraEm: string;

  funcionario: {
    id: number;
    nome: string;
    email: string;
  };
};

type AvisoCpfAssinaturaRH = {
  codigo:
  | "CPF_FUNCIONARIO_AUSENTE"
  | "CPF_FUNCIONARIO_INVALIDO";

  funcionarioId: number;
  funcionarioNome: string;
  cadastroCpfUrl: string;
  mensagem: string;
};

const eventoInicial: Evento = {
  codigo: "",
  descricao: "",
  referencia: "",
  tipo: "VENCIMENTO",
  valor: "",
};

function moeda(valor: number, locale: string) {
  return valor.toLocaleString(locale, {
    style: "currency",
    currency: "BRL",
  });
}

function numero(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return 0;
  const text = String(valor).trim().replace(/[^\d,.-]/g, "");
  const comma = text.lastIndexOf(",");
  const dot = text.lastIndexOf(".");
  const decimal = comma > dot ? "," : ".";
  const normalized = text.replace(decimal === "," ? /\./g : /,/g, "")
    .replace(decimal, ".");
  return Number(normalized) || 0;
}

function dataHoraLocal(valor: string | null | undefined, locale: string) {
  if (!valor) return "-";

  return new Date(valor).toLocaleString(locale, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function Page() {
  const t = useTranslations("AdminHRPayslips");
  const locale = useLocale();
  const formatMoney = (value: number) => moeda(value, locale);
  const formatDateTime = (value?: string | null) => dataHoraLocal(value, locale);
  function statusLabel(value: string) {
    switch (value.toUpperCase()) {
      case "GERADO": return t("statusGenerated");
      case "PAGO": return t("statusPaid");
      case "ARQUIVADO": return t("statusArchived");
      case "CANCELADO": return t("statusCancelled");
      case "AGUARDANDO_ASSINATURA": return t("statusAwaitingSignature");
      default: return value;
    }
  }
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [holerites, setHolerites] = useState<Holerite[]>([]);

  const [funcionarioBusca, setFuncionarioBusca] = useState("");
  const [funcionarioId, setFuncionarioId] = useState<number | null>(null);

  const hoje = new Date();
  const [competenciaMes, setCompetenciaMes] = useState(hoje.getMonth() + 1);
  const [competenciaAno, setCompetenciaAno] = useState(hoje.getFullYear());
  const [salarioBase, setSalarioBase] = useState("");

  const [eventos, setEventos] = useState<Evento[]>([{ ...eventoInicial }]);
  const [eventosPadrao, setEventosPadrao] = useState<EventoFolhaPadrao[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [holeriteParaArquivar, setHoleriteParaArquivar] =
    useState<Holerite | null>(null);

  const [holeriteParaPagar, setHoleriteParaPagar] = useState<Holerite | null>(
    null,
  );

  const [
    holeriteParaAssinaturaRh,
    setHoleriteParaAssinaturaRh,
  ] = useState<Holerite | null>(null);

  const [
    holeriteParaReciboManual,
    setHoleriteParaReciboManual,
  ] = useState<Holerite | null>(null);

  const [holeriteParaAssinatura, setHoleriteParaAssinatura] =
    useState<Holerite | null>(null);

  const [linkAssinatura, setLinkAssinatura] =
    useState<LinkAssinaturaRH | null>(null);

  const [gerandoLinkAssinatura, setGerandoLinkAssinatura] = useState(false);

  const [erroAssinatura, setErroAssinatura] = useState("");

  const [linkCopiado, setLinkCopiado] = useState(false);

  const [
    avisoCpfAssinatura,
    setAvisoCpfAssinatura,
  ] = useState<AvisoCpfAssinaturaRH | null>(null);

  const [motivoArquivo, setMotivoArquivo] = useState("");

  const [arquivando, setArquivando] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const funcionarioSelecionado = funcionarios.find(
    (f) => f.id === funcionarioId,
  );

  const funcionariosFiltrados = useMemo(() => {
    const termo = funcionarioBusca.trim().toLowerCase();
    if (!termo) return [];

    return funcionarios
      .filter((f) => f.nome.toLowerCase().includes(termo))
      .slice(0, 6);
  }, [funcionarioBusca, funcionarios]);

  const totalVencimentos = useMemo(() => {
    return eventos
      .filter((e) => e.tipo === "VENCIMENTO")
      .reduce((total, e) => total + numero(e.valor), 0);
  }, [eventos]);

  const totalDescontos = useMemo(() => {
    return eventos
      .filter((e) => e.tipo === "DESCONTO")
      .reduce((total, e) => total + numero(e.valor), 0);
  }, [eventos]);

  const valorLiquido = useMemo(() => {
    return numero(salarioBase) + totalVencimentos - totalDescontos;
  }, [salarioBase, totalVencimentos, totalDescontos]);

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const [resFuncionarios, resHolerites, resEventosFolha] =
        await Promise.all([
          fetch("/api/admin/funcionarios"),
          fetch("/api/admin/rh/holerites"),
          fetch("/api/admin/rh/eventos-folha"),
        ]);

      if (!resFuncionarios.ok) {
        throw new Error(t("loadError"));
      }

      if (!resHolerites.ok) {
        throw new Error(t("loadError"));
      }

      const dadosFuncionarios = await resFuncionarios.json();
      const dadosHolerites = await resHolerites.json();
      const dadosEventosFolha = await resEventosFolha.json();

      setFuncionarios(
        dadosFuncionarios.funcionarios ||
        dadosFuncionarios.items ||
        dadosFuncionarios ||
        [],
      );

      setHolerites(
        dadosHolerites.holerites ||
        dadosHolerites.items ||
        dadosHolerites ||
        [],
      );

      setEventosPadrao(
        Array.isArray(dadosEventosFolha) ? dadosEventosFolha : [],
      );
    } catch (error: any) {
      setErro(t("loadError"));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function selecionarFuncionario(funcionario: Funcionario) {
    setFuncionarioId(funcionario.id);
    setFuncionarioBusca(funcionario.nome);

    const salario = funcionario.salarioBase ?? funcionario.salario ?? "";

    setSalarioBase(salario ? String(salario) : "");
  }

  function atualizarEvento(index: number, campo: keyof Evento, valor: string) {
    setEventos((atuais) =>
      atuais.map((evento, i) =>
        i === index ? { ...evento, [campo]: valor } : evento,
      ),
    );
  }

  function adicionarEvento() {
    setEventos((atuais) => [...atuais, { ...eventoInicial }]);
  }

  function removerEvento(index: number) {
    setEventos((atuais) => atuais.filter((_, i) => i !== index));
  }

  async function arquivarHolerite() {
    if (!holeriteParaArquivar) return;

    if (!motivoArquivo.trim()) {
      setErro(t("archiveReasonRequired"));
      return;
    }

    try {
      setErro("");
      setSucesso("");
      setArquivando(true);

      const res = await fetch("/api/admin/rh/holerites", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          holeriteId: holeriteParaArquivar.id,
          motivoArquivo,
        }),
      });

      const dados = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          t("archiveError"),
        );
      }

      setSucesso(t("archiveSuccess"));
      setHoleriteParaArquivar(null);
      setMotivoArquivo("");
      await carregarDados();
    } catch (error: any) {
      setErro(t("archiveError"));
    } finally {
      setArquivando(false);
    }
  }

  async function gerarLinkAssinatura(holerite: Holerite) {
    try {
      setHoleriteParaAssinatura(holerite);
      setLinkAssinatura(null);
      setErroAssinatura("");
      setLinkCopiado(false);
      setAvisoCpfAssinatura(null);
      setGerandoLinkAssinatura(true);
      setErro("");
      setSucesso("");

      const resposta = await fetch(
        `/api/admin/rh/holerites/${holerite.id}/assinatura`,
        {
          method: "POST",
        },
      );

      const dados = await resposta.json().catch(() => null);

      const codigoErro = String(dados?.codigo || "");

      if (
        !resposta.ok &&
        [
          "CPF_FUNCIONARIO_AUSENTE",
          "CPF_FUNCIONARIO_INVALIDO",
        ].includes(codigoErro)
      ) {
        const funcionarioIdErro = Number(
          dados?.funcionarioId,
        );

        setAvisoCpfAssinatura({
          codigo:
            codigoErro as AvisoCpfAssinaturaRH["codigo"],

          funcionarioId: funcionarioIdErro,

          funcionarioNome: String(
            dados?.funcionarioNome ||
            holerite.funcionario?.nome ||
            t("employee"),
          ),

          cadastroCpfUrl: String(
            dados?.cadastroCpfUrl ||
            `/admin/funcionarios/${funcionarioIdErro}`,
          ),

          mensagem: String(
            t("cpfRequired"),
          ),
        });

        setHoleriteParaAssinatura(null);
        setLinkAssinatura(null);
        setErroAssinatura("");

        return;
      }

      if (!resposta.ok) {
        throw new Error(
          t("linkError"),
        );
      }

      setLinkAssinatura({
        pagamentoId: Number(dados.pagamentoId),
        reciboNumero: String(dados.reciboNumero || ""),
        urlAssinatura: String(dados.urlAssinatura || ""),
        caminhoAssinatura: String(dados.caminhoAssinatura || ""),
        expiraEm: String(dados.expiraEm || ""),

        funcionario: {
          id: Number(dados.funcionario?.id),
          nome: String(dados.funcionario?.nome || ""),
          email: String(dados.funcionario?.email || ""),
        },
      });

      setSucesso(
        t("linkSuccess"),
      );
    } catch (error: any) {
      setErroAssinatura(
        t("linkError"),
      );
    } finally {
      setGerandoLinkAssinatura(false);
    }
  }

  async function copiarLinkAssinatura() {
    const link = linkAssinatura?.urlAssinatura;

    if (!link) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const campoTemporario = document.createElement("textarea");

        campoTemporario.value = link;
        campoTemporario.style.position = "fixed";
        campoTemporario.style.opacity = "0";

        document.body.appendChild(campoTemporario);
        campoTemporario.select();
        document.execCommand("copy");
        campoTemporario.remove();
      }

      setLinkCopiado(true);

      window.setTimeout(() => {
        setLinkCopiado(false);
      }, 2500);
    } catch {
      setErroAssinatura(
        t("copyError"),
      );
    }
  }

  function fecharModalAssinatura() {
    setHoleriteParaAssinatura(null);
    setLinkAssinatura(null);
    setErroAssinatura("");
    setLinkCopiado(false);
  }

  async function gerarHolerite() {
    try {
      setErro("");
      setSucesso("");

      if (!funcionarioId) {
        setErro(t("employeeRequired"));
        return;
      }

      if (!competenciaMes || !competenciaAno) {
        setErro(t("periodRequired"));
        return;
      }

      if (numero(salarioBase) <= 0) {
        setErro(t("salaryRequired"));
        return;
      }

      const eventosValidos = eventos.filter(
        (e) => e.descricao.trim() && numero(e.valor) > 0,
      );

      if (eventosValidos.length === 0) {
        setErro(t("eventRequired"));
        return;
      }

      setSalvando(true);

      const res = await fetch("/api/admin/rh/holerites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          funcionarioId,
          competenciaMes,
          competenciaAno,
          salarioBase: numero(salarioBase),
          eventos: eventosValidos.map((e) => ({
            ...e,
            valor: numero(e.valor),
          })),
        }),
      });

      const dados = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(t("generateError"));
      }

      setSucesso(t("generateSuccess"));
      setEventos([{ ...eventoInicial }]);
      await carregarDados();
    } catch (error: any) {
      setErro(t("generateError"));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="phanyx-rh-page phanyx-holerite-page space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">{t("eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{t("heading")}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("description")}</p>
      </div>

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          {sucesso}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t("newPayslip")}</h2>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <label className="text-xs font-bold uppercase text-slate-500">{t("employee")}</label>
            <input
              value={funcionarioBusca}
              onChange={(e) => {
                setFuncionarioBusca(e.target.value);
                setFuncionarioId(null);
              }}
              placeholder={t("employeePlaceholder")}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />

            {funcionariosFiltrados.length > 0 && !funcionarioId && (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {funcionariosFiltrados.map((funcionario) => (
                  <button
                    key={funcionario.id}
                    type="button"
                    onClick={() => selecionarFuncionario(funcionario)}
                    className="block w-full px-4 py-3 text-left text-sm hover:bg-blue-50 dark:hover:bg-slate-800"
                  >
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {funcionario.nome}
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {funcionario.cargo || t("noRoleProvided")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500">{t("month")}</label>
            <input
              type="number"
              min={1}
              max={12}
              value={competenciaMes}
              onChange={(e) => setCompetenciaMes(Number(e.target.value))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500">{t("year")}</label>
            <input
              type="number"
              value={competenciaAno}
              onChange={(e) => setCompetenciaAno(Number(e.target.value))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500">{t("baseSalary")}</label>
            <input
              value={salarioBase}
              onChange={(e) => setSalarioBase(e.target.value)}
              placeholder={t("amountPlaceholder")}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-xs font-bold uppercase text-slate-500">{t("selectedEmployee")}</label>
            <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              {funcionarioSelecionado
                ? `${funcionarioSelecionado.nome} • ${funcionarioSelecionado.cargo || t("noRole")}`
                : t("noneSelected")}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-slate-900 dark:text-white">{t("payslipEvents")}</h3>

            <button
              type="button"
              onClick={adicionarEvento}
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >{t("addEvent")}</button>
          </div>

          {eventos.map((evento, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-6"
            >
              <select
                value={evento.codigo}
                onChange={(e) => {
                  const selecionado = eventosPadrao.find(
                    (item) => item.codigo === e.target.value,
                  );

                  if (!selecionado) return;

                  atualizarEvento(index, "codigo", selecionado.codigo);
                  atualizarEvento(index, "descricao", selecionado.descricao);

                  if (
                    selecionado.tipo === "VENCIMENTO" ||
                    selecionado.tipo === "DESCONTO"
                  ) {
                    atualizarEvento(index, "tipo", selecionado.tipo);
                  }
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white md:col-span-2"
              >
                <option value="">{t("selectEvent")}</option>

                {eventosPadrao
                  .filter((item) => item.tipo !== "INFORMATIVO")
                  .map((item) => (
                    <option key={item.id} value={item.codigo}>
                      {item.codigo} - {item.descricao}
                    </option>
                  ))}
              </select>

              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 md:col-span-1">
                {evento.descricao || t("eventDescription")}
              </div>

              <input
                value={evento.referencia}
                onChange={(e) =>
                  atualizarEvento(index, "referencia", e.target.value)
                }
                placeholder={t("reference")}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              <select
                value={evento.tipo}
                onChange={(e) =>
                  atualizarEvento(
                    index,
                    "tipo",
                    e.target.value as "VENCIMENTO" | "DESCONTO",
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="VENCIMENTO">{t("earning")}</option>
                <option value="DESCONTO">{t("deduction")}</option>
              </select>

              <div className="flex gap-2">
                <input
                  value={evento.valor}
                  onChange={(e) =>
                    atualizarEvento(index, "valor", e.target.value)
                  }
                  placeholder={t("value")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />

                {eventos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerEvento(index)}
                    className="rounded-xl border border-red-200 px-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">{t("totalEarnings")}</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
              {formatMoney(totalVencimentos)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">{t("totalDeductions")}</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
              {formatMoney(totalDescontos)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">{t("netPay")}</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
              {formatMoney(valorLiquido)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={gerarHolerite}
            disabled={salvando}
            className="phanyx-rh-primary-action"
          >
            {salvando ? t("generating") : t("generatePayslip")}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t("generatedPayslips")}</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                <th className="py-3">{t("employee")}</th>
                <th className="py-3">{t("period")}</th>
                <th className="py-3">{t("salary")}</th>
                <th className="py-3">{t("earnings")}</th>
                <th className="py-3">{t("deductions")}</th>
                <th className="py-3">{t("net")}</th>
                <th className="py-3">{t("status")}</th>
                <th className="py-3 text-right">{t("actions")}</th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">{t("loading")}</td>
                </tr>
              ) : holerites.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">{t("empty")}</td>
                </tr>
              ) : (
                holerites.map((holerite) => {
                  const pagamentoAtual = holerite.pagamentos?.[0] || null;

                  const statusPagamento = String(
                    pagamentoAtual?.status || "",
                  ).toUpperCase();

                  const possuiRecibo = Boolean(
                    pagamentoAtual?.id &&
                    pagamentoAtual?.reciboNumero,
                  );

                  const funcionarioPossuiLoginAtivo =
                    holerite.funcionario?.user?.ativo === true;

                  const documentoManualAtual =
                    pagamentoAtual
                      ?.documentosAssinadosManualmente?.[0] ||
                    null;

                  const tipoConfirmacaoRecebimento = String(
                    pagamentoAtual?.tipoConfirmacaoRecebimento ||
                    "",
                  ).toUpperCase();

                  const reciboAssinadoManual =
                    statusPagamento ===
                    "CONFIRMADO_FUNCIONARIO" &&
                    tipoConfirmacaoRecebimento ===
                    "DOCUMENTO_MANUAL" &&
                    Boolean(
                      pagamentoAtual
                        ?.confirmadoPeloFuncionarioEm &&
                      documentoManualAtual?.id,
                    );

                  const reciboAssinadoDigital =
                    statusPagamento ===
                    "CONFIRMADO_FUNCIONARIO" &&
                    tipoConfirmacaoRecebimento !==
                    "DOCUMENTO_MANUAL" &&
                    Boolean(
                      pagamentoAtual
                        ?.confirmadoPeloFuncionarioEm,
                    );

                  const reciboAssinado =
                    reciboAssinadoManual ||
                    reciboAssinadoDigital;

                  const podeGerarLink =
                    possuiRecibo &&
                    funcionarioPossuiLoginAtivo &&
                    statusPagamento === "REGISTRADO" &&
                    !pagamentoAtual
                      ?.confirmadoPeloFuncionarioEm;

                  const podeEnviarReciboManual =
                    possuiRecibo &&
                    !funcionarioPossuiLoginAtivo &&
                    statusPagamento === "REGISTRADO" &&
                    !pagamentoAtual
                      ?.confirmadoPeloFuncionarioEm &&
                    !documentoManualAtual;

                  const linkJaFoiGerado = Boolean(
                    pagamentoAtual
                      ?.assinaturaSolicitadaEm,
                  );

                  const reciboAssinadoPeloRh = Boolean(
                    pagamentoAtual?.assinadoRhPorId &&
                    pagamentoAtual?.assinadoRhEm,
                  );

                  const podeAssinarComoRh =
                    possuiRecibo &&
                    !reciboAssinadoPeloRh &&
                    [
                      "REGISTRADO",
                      "CONFIRMADO_FUNCIONARIO",
                    ].includes(statusPagamento);

                  return (
                    <tr
                      key={holerite.id}
                      className="border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">
                        {holerite.funcionario?.nome || t("employee")}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">
                        {String(holerite.competenciaMes).padStart(2, "0")}/
                        {holerite.competenciaAno}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">
                        {formatMoney(numero(holerite.salarioBase))}
                      </td>
                      <td className="py-3 text-emerald-700 dark:text-emerald-300">
                        {formatMoney(numero(holerite.totalVencimentos))}
                      </td>
                      <td className="py-3 text-red-700 dark:text-red-300">
                        {formatMoney(numero(holerite.totalDescontos))}
                      </td>
                      <td className="py-3 font-bold text-blue-700 dark:text-blue-300">
                        {formatMoney(numero(holerite.valorLiquido))}
                      </td>
                      <td className="py-3">
                        <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700">
                          {statusLabel(holerite.status || "GERADO")}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <a
                            href={`/api/admin/rh/holerites/${holerite.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl border border-emerald-500 px-3 py-1 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500 dark:text-emerald-300 hover:text-white"
                          >{t("pdf")}</a>

                          {possuiRecibo && (
                            <a
                              href={`/api/admin/rh/holerites/${holerite.id}/recibo-pagamento/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl border border-emerald-600 px-3 py-1 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white dark:text-emerald-300"
                              
                            >
                          {reciboAssinado
                            ? t("signedReceipt")
                            : t("viewReceipt")}
                        </a>
                          )}

                        {podeAssinarComoRh && (
                          <button
                            type="button"
                            onClick={() => {
                              setHoleriteParaAssinaturaRh(holerite);
                              setErro("");
                              setSucesso("");
                            }}
                            className="rounded-xl border border-emerald-600 px-3 py-1 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white dark:text-emerald-300"
                          >{t("signAsHR")}</button>
                        )}

                        {reciboAssinadoPeloRh && (
                          <span
                            title={
                              pagamentoAtual?.assinadoRhNomeSnapshot
                                ? t("signedByNameAt", { name: pagamentoAtual.assinadoRhNomeSnapshot,
                                  date: formatDateTime(pagamentoAtual.assinadoRhEm) })
                                : t("signedByHRAt", { date: formatDateTime(pagamentoAtual?.assinadoRhEm) })
                            }
                            className="inline-flex items-center rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                          >{t("signedByHR")}</span>
                        )}

                                                  {podeEnviarReciboManual && (
                            <button
                              type="button"
                              onClick={() => {
                                setHoleriteParaReciboManual(
                                  holerite,
                                );
                                setErro("");
                                setSucesso("");
                              }}
                              className="rounded-xl border border-amber-600 px-3 py-1 text-sm font-semibold text-amber-800 transition hover:bg-amber-600 hover:text-white dark:text-amber-300"
                            >{t("printAndUpload")}</button>
                          )}

                          {reciboAssinadoManual &&
  documentoManualAtual && (
    <>
      <span
        title={t("manualDocumentTooltip", { file: documentoManualAtual.arquivoNome,
          name: documentoManualAtual.enviadoPorNomeSnapshot,
          date: formatDateTime(documentoManualAtual.criadoEm) })}
        className="inline-flex items-center rounded-xl border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
      >{t("manualSignatureReceived")}</span>

      <a
        href={`/api/admin/rh/holerites/${holerite.id}/recibo-assinado-manual/${documentoManualAtual.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl border border-slate-400 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
      >{t("viewSignedDocument")}</a>

      <a
        href={`/api/admin/rh/holerites/${holerite.id}/recibo-assinado-manual/${documentoManualAtual.id}?download=1`}
        className="rounded-xl border border-emerald-600 px-3 py-1 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white dark:text-emerald-300"
      >{t("downloadSignedDocument")}</a>
    </>
  )}

                        {podeGerarLink && (
                          <button
                            type="button"
                            onClick={() => gerarLinkAssinatura(holerite)}
                            className="rounded-xl border border-violet-600 px-3 py-1 text-sm font-semibold text-violet-700 transition hover:bg-violet-600 hover:text-white dark:text-violet-300"
                          >
                            {linkJaFoiGerado
                              ? t("newLink")
                              : t("signatureLink")}
                          </button>
                        )}

                        {![
                          "PAGO",
                          "ARQUIVADO",
                          "CANCELADO",
                          "AGUARDANDO_ASSINATURA",
                        ].includes(
                          String(holerite.status || "").toUpperCase(),
                        ) && (
                            <button
                              type="button"
                              onClick={() => {
                                setHoleriteParaPagar(holerite);
                                setErro("");
                                setSucesso("");
                              }}
                              className="rounded-xl border border-emerald-600 px-3 py-1 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white dark:text-emerald-300"
                            >{t("registerPayment")}</button>
                          )}

                        <button
                          type="button"
                          onClick={() => {
                            setHoleriteParaArquivar(holerite);
                            setMotivoArquivo("");
                          }}
                          className="rounded-xl border border-amber-500 px-3 py-1 text-sm font-semibold text-amber-800 transition hover:bg-amber-500 dark:text-amber-300 hover:text-white"
                        >{t("archive")}</button>
                      </div>
                    </td>
                    </tr>
            );
                })
              )}
          </tbody>
        </table>
      </div>
    </div>

      {
    holeriteParaArquivar && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t("archivePayslip")}</h2>

          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{t("archiveDescription")}</p>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <p>
              <strong>{t("employeeColon")}</strong>{" "}
              {holeriteParaArquivar.funcionario?.nome || t("employee")}
            </p>
            <p className="mt-2">
              <strong>{t("periodColon")}</strong>{" "}
              {String(holeriteParaArquivar.competenciaMes).padStart(2, "0")}/
              {holeriteParaArquivar.competenciaAno}
            </p>
          </div>

          <label className="mt-5 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">{t("archiveReason")}</label>

          <textarea
            value={motivoArquivo}
            onChange={(e) => setMotivoArquivo(e.target.value)}
            rows={4}
            placeholder={t("archivePlaceholder")}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white outline-none focus:border-amber-500"
          />

          {erro && (
            <div className="mt-3 rounded-xl border border-red-500 bg-red-950/40 px-4 py-3 text-sm font-semibold text-red-200">
              {erro}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setHoleriteParaArquivar(null);
                setMotivoArquivo("");
                setErro("");
              }}
              disabled={arquivando}
              className="rounded-2xl border border-slate-300 px-5 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-60"
            >{t("cancel")}</button>

            <button
              type="button"
              onClick={arquivarHolerite}
              disabled={arquivando}
              className="rounded-2xl bg-amber-600 px-5 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {arquivando ? t("archiving") : t("archivePayslip")}
            </button>
          </div>
        </div>
      </div>
    )
  }

  {
    holeriteParaPagar && (
      <PagamentoHoleriteModal
        holerite={holeriteParaPagar}
        onFechar={() => {
          setHoleriteParaPagar(null);
          setErro("");
        }}
        onConcluido={async (mensagem) => {
          setErro("");
          setSucesso(t("actionSuccess"));
          await carregarDados();
        }}
      />
    )
  }

  {
    holeriteParaAssinaturaRh && (
      <AssinaturaRhHoleriteModal
        holerite={holeriteParaAssinaturaRh}
        onFechar={() => {
          setHoleriteParaAssinaturaRh(null);
        }}
        onConcluido={async (mensagem) => {
          setErro("");
          setSucesso(t("actionSuccess"));
          await carregarDados();
        }}
      />
    )
  }

        {holeriteParaReciboManual && (
        <ReciboAssinadoManualModal
          holerite={holeriteParaReciboManual}
          onFechar={() => {
            setHoleriteParaReciboManual(null);
            setErro("");
          }}
          onConcluido={async (mensagem) => {
            setErro("");
            setSucesso(t("actionSuccess"));
            await carregarDados();
          }}
        />
      )}

  {
    holeriteParaAssinatura && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-950 dark:text-white">
          <h2 className="text-xl font-bold">{t("digitalSignature")}</h2>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("digitalSignatureDescription")}</p>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
            <p>
              <strong>{t("employeeColon")}</strong>{" "}
              {holeriteParaAssinatura.funcionario?.nome || t("employee")}
            </p>

            <p className="mt-2">
              <strong>{t("periodColon")}</strong>{" "}
              {String(holeriteParaAssinatura.competenciaMes).padStart(2, "0")}/
              {holeriteParaAssinatura.competenciaAno}
            </p>

            <p className="mt-2">
              <strong>{t("receiptValueColon")}</strong>{" "}
              {formatMoney(numero(holeriteParaAssinatura.valorLiquido))}
            </p>
          </div>

          {gerandoLinkAssinatura && (
            <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-5 text-center text-sm font-semibold text-violet-800 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200">{t("creatingLink")}</div>
          )}

          {erroAssinatura && (
            <div className="mt-5 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
              {erroAssinatura}
            </div>
          )}

          {linkAssinatura && (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                <p className="font-bold">{t("linkCreated")}</p>

                <p className="mt-2">
                  <strong>{t("receiptColon")}</strong>{" "}
                  {linkAssinatura.reciboNumero}
                </p>

                <p className="mt-1">
                  <strong>{t("employeeColon")}</strong>{" "}
                  {linkAssinatura.funcionario.nome}
                </p>

                <p className="mt-1">
                  <strong>{t("registeredEmailColon")}</strong>{" "}
                  {linkAssinatura.funcionario.email}
                </p>

                <p className="mt-1">
                  <strong>{t("validUntilColon")}</strong>{" "}
                  {formatDateTime(linkAssinatura.expiraEm)}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{t("individualLink")}</label>

                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={linkAssinatura.urlAssinatura}
                    readOnly
                    onFocus={(event) => event.currentTarget.select()}
                    className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  />

                  <button
                    type="button"
                    onClick={copiarLinkAssinatura}
                    className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white hover:bg-violet-700"
                  >
                    {linkCopiado ? t("linkCopied") : t("copyLink")}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">{t("linkNote")}</div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            {erroAssinatura && !gerandoLinkAssinatura && (
              <button
                type="button"
                onClick={() => gerarLinkAssinatura(holeriteParaAssinatura)}
                className="rounded-2xl bg-violet-600 px-5 py-2 text-sm font-bold text-white hover:bg-violet-700"
              >{t("retry")}</button>
            )}

            {linkAssinatura && (
              <a
                href={linkAssinatura.urlAssinatura}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-violet-600 px-5 py-2 text-sm font-bold text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/40"
              >{t("openSignaturePage")}</a>
            )}

            <button
              type="button"
              onClick={fecharModalAssinatura}
              disabled={gerandoLinkAssinatura}
              className="rounded-2xl border border-slate-300 px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >{t("close")}</button>
          </div>
        </div>
      </div>
    )
  }

  <PhanyxConfirmModal
    aberto={Boolean(avisoCpfAssinatura)}
    titulo={
      avisoCpfAssinatura?.codigo ===
        "CPF_FUNCIONARIO_INVALIDO"
        ? t("invalidCpf")
        : t("missingCpf")
    }
    mensagem={
      avisoCpfAssinatura
        ? t("cpfExplanation", { message: avisoCpfAssinatura.mensagem })
        : ""
    }
    textoConfirmar={t("registerCpf")}
    textoCancelar={t("notNow")}
    onCancelar={() => {
      setAvisoCpfAssinatura(null);
    }}
    onConfirmar={() => {
      const destino =
        avisoCpfAssinatura?.cadastroCpfUrl;

      setAvisoCpfAssinatura(null);

      if (destino) {
        window.location.href = destino;
      }
    }}
  />

    </div >
  );
}

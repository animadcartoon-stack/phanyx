"use client";

import { useLocale, useTranslations } from "next-intl";

import { useEffect, useMemo, useState } from "react";

type Funcionario = {
  id: number;
  nome: string;
  cpf?: string | null;
  cargo?: string | null;
  salarioBase?: string | number | null;
  salario?: string | number | null;
  dataAdmissao?: string | null;
  departamento?: { nome?: string | null } | null;
};

type RescisaoRH = {
  id: number;
  tipo: string;
  dataAviso?: string | null;
  dataDesligamento: string;
  motivo?: string | null;
  saldoSalario?: string | number | null;
  feriasVencidas?: string | number | null;
  feriasProporcionais?: string | number | null;
  decimoTerceiroProporcional?: string | number | null;
  avisoPrevio?: string | number | null;
  valorRescisao?: string | number | null;
  status: string;
  observacoes?: string | null;
  funcionario?: Funcionario | null;
};

type TemplateDocumento = {
  id: number;
  nome: string;
  tipo: string;
  ativo: boolean;
  contexto?: string | null;
};

const tiposRescisao = [
  "Pedido de demissão",
  "Dispensa sem justa causa",
  "Dispensa por justa causa",
  "Término de contrato",
  "Acordo entre as partes",
  "Outros",
];

function dataBR(data: string | null | undefined, locale: string) {
  if (!data) return "-";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(locale);
}

function dataInput(data?: string | null) {
  if (!data) return "";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function numero(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return 0;
  return Number(String(valor).replace(",", ".")) || 0;
}

function moeda(valor: unknown, locale: string) {
  return numero(valor).toLocaleString(locale, {
    style: "currency",
    currency: "BRL",
  });
}

function diferencaMesesProporcionais(dataInicio: string, dataFim: string) {
  if (!dataInicio || !dataFim) return 0;

  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) return 0;

  let meses = fim.getMonth() - inicio.getMonth() + 12 * (fim.getFullYear() - inicio.getFullYear());

  if (fim.getDate() >= 15) {
    meses += 1;
  }

  return Math.max(0, Math.min(12, meses));
}

export default function RescisoesRHPage() {
  const t = useTranslations("AdminHRTerminations");
  const locale = useLocale();
  const money = (value: unknown) => moeda(value, locale);
  const date = (value?: string | null) => dataBR(value, locale);
  const numberPlaceholder = new Intl.NumberFormat(locale, { useGrouping: false, minimumFractionDigits: 2 }).format(0);
  const typeLabels: Record<string, string> = {
    "Pedido de demissão": t("typeResignation"),
    "Dispensa sem justa causa": t("typeDismissal"),
    "Dispensa por justa causa": t("typeForCause"),
    "Término de contrato": t("typeEndContract"),
    "Acordo entre as partes": t("typeAgreement"),
    "Outros": t("typeOther"),
  };
  const statusLabels: Record<string, string> = {
    EM_ANDAMENTO: t("statusInProgress"), FINALIZADA: t("statusFinalized"),
    CANCELADA: t("statusCancelled"), ARQUIVADA: t("statusArchived"),
  };
  const [rescisoes, setRescisoes] = useState<RescisaoRH[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [templatesRh, setTemplatesRh] = useState<TemplateDocumento[]>([]);
  const [templatePorRescisao, setTemplatePorRescisao] = useState<Record<number, string>>({});
  const [gerandoDocumentoId, setGerandoDocumentoId] = useState<number | null>(null);
  const [buscaRescisao, setBuscaRescisao] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("");

  const [funcionarioId, setFuncionarioId] = useState("");
  const [tipo, setTipo] = useState("Pedido de demissão");
  const [dataAviso, setDataAviso] = useState("");
  const [dataDesligamento, setDataDesligamento] = useState("");
  const [motivo, setMotivo] = useState("");

  const [dataAdmissaoBase, setDataAdmissaoBase] = useState("");
  const [dataComunicacaoOficial, setDataComunicacaoOficial] = useState("");
  const [salarioBaseMensal, setSalarioBaseMensal] = useState("");
  const [quantidadeDependentesIRRF, setQuantidadeDependentesIRRF] = useState("");
  const [quantidadeFilhosSalarioFamilia, setQuantidadeFilhosSalarioFamilia] = useState("");
  const [tipoAvisoPrevio, setTipoAvisoPrevio] = useState("Trabalhado");
  const [diasAvisoPrevioTrabalhado, setDiasAvisoPrevioTrabalhado] = useState("");
  const [diasAvisoPrevioIndenizado, setDiasAvisoPrevioIndenizado] = useState("");
  const [possuiFeriasVencidas, setPossuiFeriasVencidas] = useState(false);
  const [quantidadeFeriasVencidas, setQuantidadeFeriasVencidas] = useState("");
  const [mesesFeriasProporcionais, setMesesFeriasProporcionais] = useState("");
  const [mesesDecimoTerceiro, setMesesDecimoTerceiro] = useState("");
  const [saldoFgts, setSaldoFgts] = useState("");
  const [fgtsMesAnterior, setFgtsMesAnterior] = useState("");
  const [fgtsMesRescisao, setFgtsMesRescisao] = useState("");
  const [multaFgts, setMultaFgts] = useState("");
  const [descontoInss, setDescontoInss] = useState("");
  const [descontoIrrf, setDescontoIrrf] = useState("");
  const [outrosDescontos, setOutrosDescontos] = useState("");
  const [motivoRescisaoDetalhado, setMotivoRescisaoDetalhado] = useState("");

  const [saldoSalario, setSaldoSalario] = useState("");
  const [feriasVencidas, setFeriasVencidas] = useState("");
  const [feriasProporcionais, setFeriasProporcionais] = useState("");
  const [decimoTerceiroProporcional, setDecimoTerceiroProporcional] =
    useState("");
  const [avisoPrevio, setAvisoPrevio] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const valorBrutoRescisao = useMemo(() => {
  return (
    numero(saldoSalario) +
    numero(feriasVencidas) +
    numero(feriasProporcionais) +
    numero(decimoTerceiroProporcional) +
    numero(avisoPrevio) +
    numero(multaFgts)
  );
}, [
  saldoSalario,
  feriasVencidas,
  feriasProporcionais,
  decimoTerceiroProporcional,
  avisoPrevio,
  multaFgts,
]);

const valorLiquidoRescisao = useMemo(() => {
  return Math.max(
    0,
    valorBrutoRescisao -
      numero(descontoInss) -
      numero(descontoIrrf) -
      numero(outrosDescontos)
  );
}, [valorBrutoRescisao, descontoInss, descontoIrrf, outrosDescontos]);

const valorRescisao = valorLiquidoRescisao;

  const resumo = useMemo(() => {
    return {
      total: rescisoes.length,
      andamento: rescisoes.filter((r) => r.status === "EM_ANDAMENTO").length,
      finalizadas: rescisoes.filter((r) => r.status === "FINALIZADA").length,
      canceladas: rescisoes.filter((r) => r.status === "CANCELADA").length,
    };
  }, [rescisoes]);

  const rescisoesFiltradas = useMemo(() => {
  const termo = buscaRescisao.trim().toLowerCase();

  return rescisoes.filter((r) => {
    const nome = r.funcionario?.nome?.toLowerCase() || "";
    const cpf = r.funcionario?.cpf?.toLowerCase() || "";
    const cargo = r.funcionario?.cargo?.toLowerCase() || "";
    const departamento = r.funcionario?.departamento?.nome?.toLowerCase() || "";
    const tipoRescisao = r.tipo?.toLowerCase() || "";

    const bateBusca =
      !termo ||
      nome.includes(termo) ||
      cpf.includes(termo) ||
      cargo.includes(termo) ||
      departamento.includes(termo) ||
      tipoRescisao.includes(termo);

    const bateStatus = !filtroStatus || r.status === filtroStatus;
    const bateTipo = !filtroTipo || r.tipo === filtroTipo;
    const bateDepartamento =
      !filtroDepartamento ||
      departamento === filtroDepartamento.toLowerCase();

    return bateBusca && bateStatus && bateTipo && bateDepartamento;
  });
}, [rescisoes, buscaRescisao, filtroStatus, filtroTipo, filtroDepartamento]);

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
  const funcionario = funcionarios.find((f) => String(f.id) === funcionarioId);

  if (!funcionario) return;

  setDataAdmissaoBase(dataInput(funcionario.dataAdmissao));

  const salario = funcionario.salarioBase ?? funcionario.salario ?? "";
  setSalarioBaseMensal(String(salario || ""));
}, [funcionarioId, funcionarios]);

useEffect(() => {
  const salario = numero(salarioBaseMensal);

  if (!salario || !dataDesligamento) return;

  const desligamento = new Date(dataDesligamento);

  if (Number.isNaN(desligamento.getTime())) return;

  const diasTrabalhados = Math.max(1, Math.min(30, desligamento.getDate()));
  const saldo = (salario / 30) * diasTrabalhados;

  const mesesFerias =
    Number(mesesFeriasProporcionais || 0) ||
    diferencaMesesProporcionais(dataAdmissaoBase, dataDesligamento);

  const mesesDecimo =
    Number(mesesDecimoTerceiro || 0) ||
    diferencaMesesProporcionais(
      `${desligamento.getFullYear()}-01-01`,
      dataDesligamento
    );

  const valorFeriasVencidas = possuiFeriasVencidas
    ? salario * Math.max(1, Number(quantidadeFeriasVencidas || 1)) * (4 / 3)
    : 0;

  const valorFeriasProporcionais =
    ((salario / 12) * mesesFerias) * (4 / 3);

  const valorDecimo = (salario / 12) * mesesDecimo;

  const diasAviso =
    Number(diasAvisoPrevioIndenizado || 0) ||
    (tipoAvisoPrevio === "Indenizado pelo empregador" ? 30 : 0);

  const valorAviso = (salario / 30) * diasAviso;

  const valorMultaFgts =
    tipo === "Dispensa sem justa causa"
      ? numero(saldoFgts) * 0.4
      : tipo === "Acordo entre as partes"
      ? numero(saldoFgts) * 0.2
      : 0;

  setSaldoSalario(saldo.toFixed(2));
  setFeriasVencidas(valorFeriasVencidas.toFixed(2));
  setFeriasProporcionais(valorFeriasProporcionais.toFixed(2));
  setDecimoTerceiroProporcional(valorDecimo.toFixed(2));
  setAvisoPrevio(valorAviso.toFixed(2));
  setMultaFgts(valorMultaFgts.toFixed(2));

  if (!mesesFeriasProporcionais) {
    setMesesFeriasProporcionais(String(mesesFerias));
  }

  if (!mesesDecimoTerceiro) {
    setMesesDecimoTerceiro(String(mesesDecimo));
  }
}, [
  salarioBaseMensal,
  dataAdmissaoBase,
  dataDesligamento,
  tipo,
  tipoAvisoPrevio,
  diasAvisoPrevioIndenizado,
  saldoFgts,
  possuiFeriasVencidas,
  quantidadeFeriasVencidas,
]);

  async function lerJsonSeguro(res: Response, nomeRota: string) {
    const texto = await res.text();

    try {
      return JSON.parse(texto);
    } catch {
      throw new Error(
        t("invalidResponse", { route: nomeRota })
      );
    }
  }

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const resFuncionarios = await fetch("/api/admin/funcionarios", {
        credentials: "include",
        cache: "no-store",
      });

      const dataFuncionarios = await lerJsonSeguro(
        resFuncionarios,
        "/api/admin/funcionarios"
      );

      if (!resFuncionarios.ok) {
        throw new Error(
          t("employeesError")
        );
      }

      setFuncionarios(
        Array.isArray(dataFuncionarios)
          ? dataFuncionarios
          : Array.isArray(dataFuncionarios?.funcionarios)
          ? dataFuncionarios.funcionarios
          : []
      );

      const resRescisoes = await fetch("/api/admin/rh/rescisoes", {
        credentials: "include",
        cache: "no-store",
      });

      const dataRescisoes = await lerJsonSeguro(
        resRescisoes,
        "/api/admin/rh/rescisoes"
      );

      if (!resRescisoes.ok) {
        throw new Error(t("loadError"));
      }

      const resTemplates = await fetch("/api/admin/documentos/templates", {
  credentials: "include",
  cache: "no-store",
});

const dataTemplates = await lerJsonSeguro(
  resTemplates,
  "/api/admin/documentos/templates"
);

if (!resTemplates.ok) {
  throw new Error(t("templatesError"));
}

const tiposRescisaoTemplate = [
  "DEMISSAO",
  "PEDIDO_DEMISSAO",
  "AVISO_PREVIO",
  "TRCT",
];

setTemplatesRh(
  Array.isArray(dataTemplates)
    ? dataTemplates.filter(
        (t) => t?.ativo && tiposRescisaoTemplate.includes(t?.tipo)
      )
    : []
);

      setRescisoes(Array.isArray(dataRescisoes) ? dataRescisoes : []);
    } catch (error: any) {
      setErro(error?.message || t("dataError"));
    } finally {
      setLoading(false);
    }
  }

  function limparFormulario() {
    setFuncionarioId("");
    setTipo("Pedido de demissão");
    setDataAviso("");
    setDataDesligamento("");
    setMotivo("");
    setSaldoSalario("");
    setFeriasVencidas("");
    setFeriasProporcionais("");
    setDecimoTerceiroProporcional("");
    setAvisoPrevio("");
    setObservacoes("");
  }

  async function arquivarRescisao(id: number) {
  try {
    setErro("");
    setMensagem("");

    const res = await fetch(`/api/admin/rh/rescisoes/${id}/arquivar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        motivo: t("archiveAudit"),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(t("archiveError"));
    }

    setMensagem(t("archiveSuccess"));
    await carregarDados();
  } catch (error: any) {
    setErro(error?.message || t("archiveError"));
  }
}

async function cancelarRescisao(id: number) {
  try {
    setErro("");
    setMensagem("");

    const res = await fetch(`/api/admin/rh/rescisoes/${id}/cancelar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        motivo: t("cancelAudit"),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(t("cancelError"));
    }

    setMensagem(t("cancelSuccess"));
    await carregarDados();
  } catch (error: any) {
    setErro(error?.message || t("cancelError"));
  }
}

async function gerarDocumentoRescisao(item: RescisaoRH) {
  try {
    setErro("");
    setMensagem("");

    const templateId = Number(templatePorRescisao[item.id] || 0);

    if (!templateId) {
      setErro(t("templateRequired"));
      return;
    }

    if (!item.funcionario?.id) {
      setErro(t("employeeNotFound"));
      return;
    }

    setGerandoDocumentoId(item.id);

    const res = await fetch("/api/admin/rh/documentos/gerar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        funcionarioId: item.funcionario.id,
        templateId,
        rescisaoId: item.id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(t("documentError"));
    }

    setMensagem(t("documentSuccess"));

if (data?.id) {
  window.open(`/api/admin/rh/documentos/${data.id}/imprimir`, "_blank");
}
  } catch (error: any) {
    setErro(error?.message || t("documentError"));
  } finally {
    setGerandoDocumentoId(null);
  }
}

  async function salvarRescisao() {
    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      if (!funcionarioId) {
        setErro(t("employeeRequired"));
        return;
      }

      if (!tipo.trim()) {
        setErro(t("typeRequired"));
        return;
      }

      if (!dataDesligamento) {
        setErro(t("dateRequired"));
        return;
      }

      const res = await fetch("/api/admin/rh/rescisoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          funcionarioId,
          tipo,
          dataAviso,
          dataDesligamento,
          motivo,

          dataAdmissaoBase,
          dataComunicacaoOficial,
          salarioBaseMensal,

          quantidadeDependentesIRRF,
          quantidadeFilhosSalarioFamilia,

          tipoAvisoPrevio,
          diasAvisoPrevioTrabalhado,
          diasAvisoPrevioIndenizado,

          possuiFeriasVencidas,
          quantidadeFeriasVencidas,
          mesesFeriasProporcionais,
          mesesDecimoTerceiro,

          saldoFgts,
          fgtsMesAnterior,
          fgtsMesRescisao,
          multaFgts,

          descontoInss,
          descontoIrrf,
          outrosDescontos,

          motivoRescisaoDetalhado,

          saldoSalario,
          feriasVencidas,
          feriasProporcionais,
          decimoTerceiroProporcional,
          avisoPrevio,
          valorRescisao,
          valorBrutoRescisao,
          valorLiquidoRescisao,
          calculoAutomatico: true,
          status: "EM_ANDAMENTO",
          observacoes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(t("registerError"));
      }

      setMensagem(t("registerSuccess"));
      limparFormulario();
      await carregarDados();
    } catch (error: any) {
      setErro(error?.message || t("saveError"));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="phanyx-rh-page space-y-6 text-slate-950 dark:text-white">
      <div>
        <p className="text-sm font-bold uppercase text-red-700 dark:text-red-400">{t("department")}</p>

        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">{t("title")}</h1>

        <p className="text-sm text-slate-700 dark:text-slate-300">{t("description")}</p>
      </div>

      {mensagem && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {erro}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">{t("total")}</p>
          <p className="text-2xl font-bold">{resumo.total}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">{t("inProgress")}</p>
          <p className="text-2xl font-bold">{resumo.andamento}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">{t("finalized")}</p>
          <p className="text-2xl font-bold">{resumo.finalizadas}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">{t("cancelled")}</p>
          <p className="text-2xl font-bold">{resumo.canceladas}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
  <div className="mb-6 border-b border-slate-200 pb-4 dark:border-slate-700">
    <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">{t("department")}</p>

    <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{t("register")}</h2>

    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("formHelp")}</p>
  </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-3">
            <label className="text-sm font-medium">{t("employee")}</label>
            <select
              value={funcionarioId}
              onChange={(e) => setFuncionarioId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">{t("select")}</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome} {f.cargo ? `- ${f.cargo}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">{t("terminationType")}</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {tiposRescisao.map((item) => (
                <option key={item} value={item}>
                  {typeLabels[item] || item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">{t("noticeDate")}</label>
            <input
              type="date"
              value={dataAviso}
              onChange={(e) => setDataAviso(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t("terminationDate")}</label>
            <input
              type="date"
              value={dataDesligamento}
              onChange={(e) => setDataDesligamento(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

<div>
  <label className="text-sm font-medium">{t("hireDate")}</label>
  <input
    type="date"
    value={dataAdmissaoBase}
    onChange={(e) => setDataAdmissaoBase(e.target.value)}
    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  />
</div>

<div>
  <label className="text-sm font-medium">{t("officialNotice")}</label>
  <input
    type="date"
    value={dataComunicacaoOficial}
    onChange={(e) => setDataComunicacaoOficial(e.target.value)}
    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  />
</div>

<div>
  <label className="text-sm font-medium">{t("monthlySalary")}</label>
  <input
    value={salarioBaseMensal}
    onChange={(e) => setSalarioBaseMensal(e.target.value)}
    placeholder={numberPlaceholder}
    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  />
</div>

<div>
  <label className="text-sm font-medium">{t("dependents")}</label>
  <input
    type="number"
    min="0"
    value={quantidadeDependentesIRRF}
    onChange={(e) => setQuantidadeDependentesIRRF(e.target.value)}
    placeholder="0"
    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  />
</div>

<div>
  <label className="text-sm font-medium">{t("familyAllowanceChildren")}</label>
  <input
    type="number"
    min="0"
    value={quantidadeFilhosSalarioFamilia}
    onChange={(e) => setQuantidadeFilhosSalarioFamilia(e.target.value)}
    placeholder="0"
    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  />
</div>

<div>
  <label className="text-sm font-medium">{t("noticeType")}</label>
  <select
    value={tipoAvisoPrevio}
    onChange={(e) => setTipoAvisoPrevio(e.target.value)}
    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  >
    <option value="Trabalhado">{t("noticeWorked")}</option>
    <option value="Indenizado pelo empregador">{t("noticeEmployerPaid")}</option>
    <option value="Não cumprido pelo empregado">{t("noticeEmployeeNotServed")}</option>
    <option value="Dispensado">{t("noticeWaived")}</option>
  </select>
</div>

<div>
  <label className="text-sm font-medium">{t("workedNoticeDays")}</label>
  <input
    type="number"
    min="0"
    value={diasAvisoPrevioTrabalhado}
    onChange={(e) => setDiasAvisoPrevioTrabalhado(e.target.value)}
    placeholder="0"
    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  />
</div>

<div>
  <label className="text-sm font-medium">{t("paidNoticeDays")}</label>
  <input
    type="number"
    min="0"
    value={diasAvisoPrevioIndenizado}
    onChange={(e) => setDiasAvisoPrevioIndenizado(e.target.value)}
    placeholder="0"
    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  />
</div>

<div>
  <label className="text-sm font-medium">{t("fgtsBalance")}</label>
  <input
    value={saldoFgts}
    onChange={(e) => setSaldoFgts(e.target.value)}
    placeholder={numberPlaceholder}
    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  />
</div>

<div>
  <label className="text-sm font-medium">{t("fgtsPrevious")}</label>
  <input
    value={fgtsMesAnterior}
    onChange={(e) => setFgtsMesAnterior(e.target.value)}
    placeholder={numberPlaceholder}
    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  />
</div>

<div>
  <label className="text-sm font-medium">{t("fgtsCurrent")}</label>
  <input
    value={fgtsMesRescisao}
    onChange={(e) => setFgtsMesRescisao(e.target.value)}
    placeholder={numberPlaceholder}
    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  />
</div>

<div>
  <label className="text-sm font-medium">{t("fgtsPenalty")}</label>
  <input
    value={multaFgts}
    onChange={(e) => setMultaFgts(e.target.value)}
    placeholder={numberPlaceholder}
    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  />
</div>

<div>
  <label className="text-sm font-medium">{t("overdueVacationQuestion")}</label>
  <select
    value={possuiFeriasVencidas ? "SIM" : "NAO"}
    onChange={(e) => setPossuiFeriasVencidas(e.target.value === "SIM")}
    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  >
    <option value="NAO">{t("no")}</option>
    <option value="SIM">{t("yes")}</option>
  </select>
</div>

<div>
  <label className="text-sm font-medium">{t("overdueVacationCount")}</label>
  <input
    type="number"
    min="0"
    value={quantidadeFeriasVencidas}
    onChange={(e) => setQuantidadeFeriasVencidas(e.target.value)}
    placeholder="0"
    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  />
</div>

<div>
  <label className="text-sm font-medium">{t("proportionalVacationMonths")}</label>
  <input
    type="number"
    min="0"
    max="12"
    value={mesesFeriasProporcionais}
    onChange={(e) => setMesesFeriasProporcionais(e.target.value)}
    placeholder="0"
    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  />
</div>

<div>
  <label className="text-sm font-medium">{t("thirteenthMonths")}</label>
  <input
    type="number"
    min="0"
    max="12"
    value={mesesDecimoTerceiro}
    onChange={(e) => setMesesDecimoTerceiro(e.target.value)}
    placeholder="0"
    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  />
</div>

<div>
  <label className="text-sm font-medium">{t("inssDeduction")}</label>
  <input
    value={descontoInss}
    onChange={(e) => setDescontoInss(e.target.value)}
    placeholder={numberPlaceholder}
    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  />
</div>

<div>
  <label className="text-sm font-medium">{t("irrfDeduction")}</label>
  <input
    value={descontoIrrf}
    onChange={(e) => setDescontoIrrf(e.target.value)}
    placeholder={numberPlaceholder}
    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  />
</div>

<div>
  <label className="text-sm font-medium">{t("otherDeductions")}</label>
  <input
    value={outrosDescontos}
    onChange={(e) => setOutrosDescontos(e.target.value)}
    placeholder={numberPlaceholder}
    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  />
</div>

          <div className="md:col-span-3">
            <label className="text-sm font-medium">{t("reason")}</label>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={t("reasonPlaceholder")}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t("salaryBalance")}</label>
            <input
              value={saldoSalario}
              onChange={(e) => setSaldoSalario(e.target.value)}
              placeholder={numberPlaceholder}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t("overdueVacation")}</label>
            <input
              value={feriasVencidas}
              onChange={(e) => setFeriasVencidas(e.target.value)}
              placeholder={numberPlaceholder}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t("proportionalVacation")}</label>
            <input
              value={feriasProporcionais}
              onChange={(e) => setFeriasProporcionais(e.target.value)}
              placeholder={numberPlaceholder}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t("thirteenthSalary")}</label>
            <input
              value={decimoTerceiroProporcional}
              onChange={(e) => setDecimoTerceiroProporcional(e.target.value)}
              placeholder={numberPlaceholder}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t("notice")}</label>
            <input
              value={avisoPrevio}
              onChange={(e) => setAvisoPrevio(e.target.value)}
              placeholder={numberPlaceholder}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
  <p className="text-sm text-slate-700 dark:text-slate-300">{t("estimatedAmount")}</p>
  <p className="text-xl font-bold text-slate-950 dark:text-white">{money(valorRescisao)}</p>
</div>

          <div className="md:col-span-3">
            <label className="text-sm font-medium">{t("notes")}</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder={t("notesPlaceholder")}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={salvarRescisao}
          disabled={salvando}
          className="mt-5 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {salvando ? t("saving") : t("register")}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">{t("records")}</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                <th className="p-3">{t("employee")}</th>
                <th className="p-3">{t("type")}</th>
                <th className="p-3">{t("noticeShort")}</th>
                <th className="p-3">{t("terminationShort")}</th>
                <th className="p-3">{t("amount")}</th>
                <th className="p-3">{t("status")}</th>
                <th className="p-3">{t("actions")}</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="p-3 text-slate-500" colSpan={7}>{t("loading")}</td>
                </tr>
              ) : rescisoesFiltradas.length === 0 ? (
                <tr>
                  <td className="p-3 text-slate-500" colSpan={7}>{t("empty")}</td>
                </tr>
              ) : (
                rescisoesFiltradas.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 dark:border-slate-800"
                  >
                    <td className="p-3 font-medium">
                      {item.funcionario?.nome || "-"}
                    </td>

                    <td className="p-3">{typeLabels[item.tipo] || item.tipo}</td>

                    <td className="p-3">{date(item.dataAviso)}</td>

                    <td className="p-3">{date(item.dataDesligamento)}</td>

                    <td className="p-3">{money(item.valorRescisao)}</td>

                    <td className="p-3">
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-200">
                        {statusLabels[item.status] || item.status}
                      </span>
                    </td>
                    <td className="p-3">
  <div className="flex flex-wrap gap-2">
    <select
  value={templatePorRescisao[item.id] || ""}
  onChange={(e) =>
    setTemplatePorRescisao((atual) => ({
      ...atual,
      [item.id]: e.target.value,
    }))
  }
  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
>
  <option value="">{t("template")}</option>
  {templatesRh.map((template) => (
    <option key={template.id} value={template.id}>
      {template.nome}
    </option>
  ))}
</select>

<button
  type="button"
  onClick={() => gerarDocumentoRescisao(item)}
  disabled={gerandoDocumentoId === item.id}
  className="rounded-lg border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
>
  {gerandoDocumentoId === item.id ? t("generating") : t("generateDocument")}
</button>
    <button
  type="button"
  onClick={() => arquivarRescisao(item.id)}
  className="phanyx-rh-archive-action"
>{t("archive")}</button>

    {item.status !== "CANCELADA" && (
      <button
        type="button"
        onClick={() => cancelarRescisao(item.id)}
        className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
      >{t("cancel")}</button>
    )}
  </div>
</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

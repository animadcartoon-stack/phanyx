"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import jsPDF from "jspdf";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

type Lancamento = {
  id: number;
  tipo: string;
  descricao?: string | null;
  valorOriginal: number;
  valorFinal?: number | null;
  valorPago?: number | null;
  status: string;
  vencimento?: string | null;
  createdAt?: string | null;
  aluno?: {
    nome: string;
    matricula?: string | null;
  } | null;
  polo?: {
  id: number;
  nome: string;
  codigo?: string | null;
  cnpj?: string | null;
} | null;
};

type Polo = {
  id: number;
  nome: string;
  codigo?: string | null;
};

type RespostaApi = {
  resumo: {
    quantidadeLancamentos: number;
    totalLancado: number;
    totalPago: number;
    totalPendente: number;
    totalAtrasado: number;
    alunosInadimplentes: number;
    totalOnlineIbe?: number;
    quantidadeOnlineIbe?: number;
  };
  resumoPorTipo: {
    MATRICULA: number;
    MENSALIDADE: number;
    TAXA: number;
    DESCONTO: number;
    OUTRO: number;
  };
  lancamentos: Lancamento[];
};

function criarRelatoriosTourSteps(t: any) {
  return [
    {
      target: '[data-tour="relatorios-exportar"]',
      titulo: t("tour.export.title"),
      destaque: t("tour.export.highlight"),
      descricao: t("tour.export.description"),
      imagem: "/images/relatorios.png",
    },
    {
      target: '[data-tour="relatorios-periodo"]',
      titulo: t("tour.period.title"),
      destaque: t("tour.period.highlight"),
      descricao: t("tour.period.description"),
      imagem: "/images/financeiro.png",
    },
    {
      target: '[data-tour="relatorios-polo"]',
      titulo: t("tour.campus.title"),
      destaque: t("tour.campus.highlight"),
      descricao: t("tour.campus.description"),
      imagem: "/images/contador.png",
    },
    {
      target: '[data-tour="relatorios-resumo"]',
      titulo: t("tour.summary.title"),
      destaque: t("tour.summary.highlight"),
      descricao: t("tour.summary.description"),
      imagem: "/images/relatorios.png",
    },
    {
      target: '[data-tour="relatorios-graficos"]',
      titulo: t("tour.charts.title"),
      destaque: t("tour.charts.highlight"),
      descricao: t("tour.charts.description"),
      imagem: "/images/formix-inteligente.png",
    },
    {
      target: '[data-tour="relatorios-lancamentos"]',
      titulo: t("tour.entries.title"),
      destaque: t("tour.entries.highlight"),
      descricao: t("tour.entries.description"),
      imagem: "/images/financeiro.png",
    },
  ];
}

function hojeInput() {
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  const dd = String(hoje.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function primeiroDiaMes() {
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

function formatarMoeda(valor: number, locale: string) {
  return Number(valor || 0).toLocaleString(locale, {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataCurta(data: string, locale: string) {
  if (!data) return "-";

  const normalizada =
    /^\d{4}-\d{2}-\d{2}$/.test(data)
      ? `${data}T12:00:00`
      : data;

  return new Date(normalizada).toLocaleDateString(locale);
}

function statusLabel(status: string, t: any) {
  const chave = String(status || "").toUpperCase();

  const labels: Record<string, string> = {
    PAGO: t("status.paid"),
    PENDENTE: t("status.pending"),
    PARCIAL: t("status.partial"),
    ATRASADO: t("status.overdue"),
    CANCELADO: t("status.cancelled"),
  };

  return labels[chave] || status || "-";
}

function tipoLabel(tipo: string, t: any) {
  const chave = String(tipo || "").toUpperCase();

  const labels: Record<string, string> = {
    MATRICULA: t("types.enrollment"),
    MENSALIDADE: t("types.tuition"),
    TAXA: t("types.fee"),
    DESCONTO: t("types.discount"),
    OUTRO: t("types.other"),
  };

  return labels[chave] || tipo || "-";
}

async function carregarImagemComoDataUrl(src: string): Promise<string | null> {
  try {
    const response = await fetch(src);
    if (!response.ok) return null;

    const blob = await response.blob();

    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function RelatoriosTour({
  aberto,
  onClose,
}: {
  aberto: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("AdminFinanceiroRelatorios");
  const [stepAtual, setStepAtual] = useState(0);
  const [targetRect, setTargetRect] = useState<any>(null);

  const relatoriosTourSteps = criarRelatoriosTourSteps(t);
  const step = relatoriosTourSteps[stepAtual];

  useEffect(() => {
    if (!aberto || !step) return;

    function atualizar() {
      const el = document.querySelector(step.target);
      if (!el) return;

      el.scrollIntoView({ behavior: "smooth", block: "center" });

      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }, 260);
    }

    atualizar();

    window.addEventListener("resize", atualizar);
    window.addEventListener("scroll", atualizar, true);

    return () => {
      window.removeEventListener("resize", atualizar);
      window.removeEventListener("scroll", atualizar, true);
    };
  }, [aberto, stepAtual, step]);

  if (!aberto || !step) return null;

  const spotlight = targetRect
    ? {
        top: Math.max(targetRect.top - 8, 8),
        left: Math.max(targetRect.left - 8, 8),
        width: targetRect.width + 16,
        height: targetRect.height + 16,
      }
    : null;

  // Nos passos 5 e 6 o alvo ocupa uma ?rea grande da tela.
  // Neles, o bal?o fica acima do alvo para n?o cobrir gr?ficos
  // nem os lan?amentos do per?odo.
  const balaoAcima = stepAtual === 4 || stepAtual === 5;
  const ultimoPasso = stepAtual === 5;

  const topBalao = spotlight
    ? balaoAcima
      ? Math.max(24, spotlight.top - 18)
      : Math.min(
          spotlight.top + spotlight.height + 18,
          window.innerHeight - 330
        )
    : 160;

  const leftBalao = spotlight
    ? balaoAcima
      ? Math.max(
          24,
          Math.min(
            spotlight.left + spotlight.width / 2 - 210,
            window.innerWidth - 444
          )
        )
      : Math.max(
          320,
          Math.min(spotlight.left, window.innerWidth - 460)
        )
    : 360;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-slate-950/70" />

      {spotlight && (
        <div
          className="absolute rounded-2xl border-2 border-blue-400 shadow-[0_0_0_9999px_rgba(2,6,23,0.72)]"
          style={spotlight}
        />
      )}

      <div
        className="absolute w-[420px] rounded-[28px] border bg-white px-5 py-4 shadow-2xl"
        style={{
          top: topBalao,
          left: leftBalao,
          transform:
            balaoAcima && spotlight
              ? "translateY(-100%)"
              : undefined,
        }}
      >
        {balaoAcima ? (
          <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-r border-b bg-white" />
        ) : (
          <div className="absolute -top-2 left-10 h-4 w-4 rotate-45 border-l border-t bg-white" />
        )}

        <div className="flex gap-4">
          <img
            src={step.imagem}
            alt=""
            className="h-24 w-24 object-contain drop-shadow-lg"
          />

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
              {t("tour.label")}
            </p>

            <h3 className="mt-1 text-xl font-bold text-slate-900">
              {step.titulo}
            </h3>

            <p className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
              {step.destaque}
            </p>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              {step.descricao}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-sm text-slate-500">
            {t("tour.step", { current: stepAtual + 1, total: relatoriosTourSteps.length })}
          </span>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border px-3 py-2 text-sm"
            >
              {t("tour.close")}
            </button>

            {stepAtual > 0 && (
              <button
                onClick={() => setStepAtual((p) => p - 1)}
                className="rounded-xl border px-3 py-2 text-sm"
              >
                {t("tour.previous")}
              </button>
            )}

            {stepAtual < relatoriosTourSteps.length - 1 ? (
              <button
                onClick={() => setStepAtual((p) => p + 1)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                {t("tour.next")}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                {t("tour.finish")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminFinanceiroRelatoriosPage() {
  const t = useTranslations("AdminFinanceiroRelatorios");
  const locale = useLocale();

  const [inicio, setInicio] = useState(primeiroDiaMes());
  const [fim, setFim] = useState(hojeInput());
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [dados, setDados] = useState<RespostaApi | null>(null);
  const [poloId, setPoloId] = useState("");
  const [polos, setPolos] = useState<Polo[]>([]);
  const [tourAberto, setTourAberto] = useState(false);

  async function carregar() {
    try {
      setLoading(true);
      setErro("");

      const query = new URLSearchParams();
      if (inicio) query.set("inicio", inicio);
      if (fim) query.set("fim", fim);
      if (poloId) query.set("poloId", poloId);

      const res = await fetch(
        `/api/admin/financeiro/relatorios?${query.toString()}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || t("errors.loadReports"));
      }

      setDados(json);
    } catch (e: any) {
      setErro(e?.message || t("errors.loadReports"));
      setDados(null);
    } finally {
      setLoading(false);
    }
  }

async function carregarPolos() {
  try {
    const res = await fetch("/api/admin/polos", {
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json();

    if (res.ok) {
      setPolos(Array.isArray(data) ? data : []);
    }
  } catch (error) {
    console.error("Erro ao carregar polos:", error);
  }
}

  useEffect(() => {
  carregar();
}, [inicio, fim, poloId]);

useEffect(() => {
  carregarPolos();
}, []);

useEffect(() => {
  const continuar = sessionStorage.getItem("phanyx-continuar-tour");

  if (continuar === "relatorios") {
    sessionStorage.removeItem("phanyx-continuar-tour");

    setTimeout(() => {
      setTourAberto(true);
    }, 600);
  }
}, []);

  function exportarCsv() {
    const query = new URLSearchParams();
    if (inicio) query.set("inicio", inicio);
    if (fim) query.set("fim", fim);

    window.open(
      `/api/admin/financeiro/relatorios/exportar?${query.toString()}`,
      "_blank"
    );
  }

  function exportarExcel() {
    const query = new URLSearchParams();
    if (inicio) query.set("inicio", inicio);
    if (fim) query.set("fim", fim);

    window.open(
      `/api/admin/financeiro/relatorios/exportar-excel?${query.toString()}`,
      "_blank"
    );
  }

  async function exportarPdf() {
    if (!dados) return;

const resConfig = await fetch("/api/admin/configuracoes/instituicao");
const config = await resConfig.json();
    const doc = new jsPDF("p", "mm", "a4");
    const largura = doc.internal.pageSize.getWidth();
    const altura = doc.internal.pageSize.getHeight();
    const margem = 14;
    let y = 20;

    const logoDataUrl = await carregarImagemComoDataUrl(
  config?.logoUrl || "/logo.png"
);

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, largura, 48, "F");

    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, "PNG", 14, 7, 16, 16);
      } catch {
        // segue sem logo
      }
    } else {
      doc.setFillColor(255, 255, 255);
      doc.circle(22, 16, 7, "F");
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("F", 20.8, 17.5);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(config?.nomeFantasia || "PHANYX", 34, 14);

    doc.setFont("helvetica", "normal");
doc.setFontSize(10);
doc.text(
  config?.razaoSocial || t("pdf.institutionalReport"),
  34,
  20
);
doc.text(
  t("pdf.period", {
    start: formatarDataCurta(inicio, locale),
    end: formatarDataCurta(fim, locale),
  }),
  34,
  25
);

doc.setFontSize(9);
doc.text(
  `${t("pdf.registrationId")}: ${config?.cnpj || "-"}   •   ${t("pdf.phone")}: ${config?.telefone || "-"}`,
  34,
  30
);
doc.text(
  `${t("pdf.email")}: ${config?.email || "-"}   •   ${t("pdf.responsible")}: ${
    config?.responsavelNome || "-"
  }`,
  34,
  34
);
doc.text(
  `${t("pdf.role")}: ${config?.responsavelCargo || "-"}   •   ${t("pdf.location")}: ${
    config?.cidade || "-"
  }/${config?.estado || "-"}`,
  34,
  38
);
doc.text(`${t("pdf.address")}: ${config?.endereco || "-"}`, 34, 42);
    y = 58;

    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(t("pdf.executiveSummary"), margem, y);
    y += 8;

    const cards = [
      {
        titulo: t("summary.totalPosted"),
        valor: formatarMoeda(dados.resumo.totalLancado, locale),
      },
      {
        titulo: t("summary.totalPaid"),
        valor: formatarMoeda(dados.resumo.totalPago, locale),
      },
      {
        titulo: t("summary.pending"),
        valor: formatarMoeda(dados.resumo.totalPendente, locale),
      },
      {
        titulo: t("summary.overdue"),
        valor: formatarMoeda(dados.resumo.totalAtrasado, locale),
      },
      {
        titulo: t("summary.defaultingStudents"),
        valor: String(dados.resumo.alunosInadimplentes),
      },
      {
        titulo: t("summary.entries"),
        valor: String(dados.resumo.quantidadeLancamentos),
      },
    ];

    const cardLargura = 58;
    const cardAltura = 20;
    const gap = 5;

    cards.forEach((card, index) => {
      const coluna = index % 3;
      const linha = Math.floor(index / 3);
      const x = margem + coluna * (cardLargura + gap);
      const yy = y + linha * (cardAltura + 5);

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, yy, cardLargura, cardAltura, 3, 3, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(card.titulo, x + 3, yy + 6);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(card.valor, x + 3, yy + 14);
    });

    y += 54;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.text(t("pdf.summaryByType"), margem, y);
    y += 8;

    const tipos = [
      [t("types.enrollment"), formatarMoeda(dados.resumoPorTipo.MATRICULA, locale)],
      [t("types.tuition"), formatarMoeda(dados.resumoPorTipo.MENSALIDADE, locale)],
      [t("types.fee"), formatarMoeda(dados.resumoPorTipo.TAXA, locale)],
      [t("types.discount"), formatarMoeda(dados.resumoPorTipo.DESCONTO, locale)],
      [t("types.other"), formatarMoeda(dados.resumoPorTipo.OUTRO, locale)],
    ];

    tipos.forEach((item) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`${item[0]}:`, margem, y);
      doc.setFont("helvetica", "bold");
      doc.text(String(item[1]), 55, y);
      y += 6;
    });

    y += 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(t("pdf.entriesForPeriod"), margem, y);
    y += 8;

    const colunas = [
      { titulo: t("table.student"), x: 14, largura: 42 },
      { titulo: t("table.type"), x: 57, largura: 22 },
      { titulo: t("table.description"), x: 80, largura: 48 },
      { titulo: t("table.amount"), x: 129, largura: 20 },
      { titulo: t("table.paid"), x: 150, largura: 20 },
      { titulo: t("table.status"), x: 171, largura: 25 },
    ];

    function desenharCabecalhoTabela(posY: number) {
      doc.setFillColor(30, 41, 59);
      doc.rect(14, posY, 182, 8, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);

      colunas.forEach((col) => {
        doc.text(col.titulo, col.x + 1, posY + 5.2);
      });
    }

    function cortarTexto(texto: string, larguraMax: number) {
      return doc.splitTextToSize(String(texto || ""), larguraMax);
    }

    desenharCabecalhoTabela(y);
    y += 10;

    const lancamentosParaPdf = dados.lancamentos.slice(0, 18);

    for (const item of lancamentosParaPdf) {
      const aluno = item.aluno?.nome || "-";
      const tipo = tipoLabel(item.tipo, t);
      const descricao = item.descricao || "-";
      const valor = formatarMoeda(
        Number(item.valorFinal ?? item.valorOriginal ?? 0),
        locale
      );
      const pago = formatarMoeda(Number(item.valorPago || 0), locale);
      const status = statusLabel(item.status, t);

      const alunoLinhas = cortarTexto(aluno, 40);
      const descLinhas = cortarTexto(descricao, 46);
      const alturaLinha = Math.max(alunoLinhas.length, descLinhas.length, 1) * 5 + 3;

      if (y + alturaLinha > altura - 20) {
        doc.addPage();
        y = 20;
        desenharCabecalhoTabela(y);
        y += 10;
      }

      doc.setDrawColor(226, 232, 240);
      doc.rect(14, y - 3, 182, alturaLinha, "S");

      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);

      doc.text(alunoLinhas, 15, y);
      doc.text(String(tipo), 58, y);
      doc.text(descLinhas, 81, y);
      doc.text(String(valor), 130, y);
      doc.text(String(pago), 151, y);
      doc.text(String(status), 172, y);

      y += alturaLinha;
    }

    if (dados.lancamentos.length > lancamentosParaPdf.length) {
      if (y + 10 > altura - 15) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(
        t("pdf.firstEntriesNote", { count: lancamentosParaPdf.length }),
        14,
        y + 4
      );
    }

    const totalPaginas = (doc as any).getNumberOfPages();

    for (let i = 1; i <= totalPaginas; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 287, 196, 287);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
  `${config?.nomeFantasia || "PHANYX"} • ${t("pdf.institutionalReport")}`,
  14,
  292
);
doc.text(t("pdf.page", { current: i, total: totalPaginas }), 196, 292, { align: "right" });
    }

    const nomeArquivo = `${
  config?.nomeFantasia || "instituicao"
}_${t("pdf.fileSlug")}.pdf`
  .replace(/\s+/g, "_")
  .toLowerCase();

doc.save(nomeArquivo);
  }

  const graficoPorTipo = useMemo(() => {
    if (!dados) return [];

    return [
      {
        tipo: t("types.enrollment"),
        valor: Number(dados.resumoPorTipo.MATRICULA || 0),
      },
      {
        tipo: t("types.tuition"),
        valor: Number(dados.resumoPorTipo.MENSALIDADE || 0),
      },
      {
        tipo: t("types.fee"),
        valor: Number(dados.resumoPorTipo.TAXA || 0),
      },
      {
        tipo: t("types.discount"),
        valor: Number(dados.resumoPorTipo.DESCONTO || 0),
      },
      {
        tipo: t("types.other"),
        valor: Number(dados.resumoPorTipo.OUTRO || 0),
      },
    ];
  }, [dados, t]);

  const graficoPorStatus = useMemo(() => {
    if (!dados) return [];

    const mapa: Record<string, number> = {
      PAGO: 0,
      PENDENTE: 0,
      PARCIAL: 0,
      ATRASADO: 0,
      CANCELADO: 0,
    };

    for (const item of dados.lancamentos) {
      const status = String(item.status || "").toUpperCase();
      if (status in mapa) {
        mapa[status] += 1;
      } else {
        mapa[status] = 1;
      }
    }

    return Object.entries(mapa)
      .map(([status, quantidade]) => ({
        status: statusLabel(status, t),
        quantidade,
      }))
      .filter((item) => item.quantidade > 0);
  }, [dados, t]);

  const graficoReceitaPorDia = useMemo(() => {
    if (!dados) return [];

    const mapa = new Map<
      string,
      { data: string; pago: number; lancado: number }
    >();

    for (const item of dados.lancamentos) {
      const dataBase = item.createdAt || item.vencimento || new Date().toISOString();
      const chave = new Date(dataBase).toISOString().slice(0, 10);

      if (!mapa.has(chave)) {
        mapa.set(chave, {
          data: chave,
          pago: 0,
          lancado: 0,
        });
      }

      const linha = mapa.get(chave)!;
      linha.pago += Number(item.valorPago || 0);
      linha.lancado += Number(item.valorFinal ?? item.valorOriginal ?? 0);
    }

    return Array.from(mapa.values())
      .sort((a, b) => a.data.localeCompare(b.data))
      .map((item) => ({
        ...item,
        dataLabel: formatarDataCurta(item.data, locale),
      }));
  }, [dados, locale]);

  const pieColors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#6b7280"];

  return (
    <div className="phanyx-financeiro-relatorios-page space-y-6 max-w-7xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">📊 {t("title")}</h1>
          <p className="text-gray-600 mt-1">
            {t("subtitle")}
          </p>
          <button
  onClick={() => setTourAberto(true)}
  className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
>
  ✨ {t("openTour")}
</button>
        </div>

        <div data-tour="relatorios-exportar" className="flex gap-2">
          <button
            onClick={exportarCsv}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            CSV
          </button>

          <button
            onClick={exportarExcel}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Excel
          </button>

          <button
            onClick={exportarPdf}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            PDF
          </button>
        </div>
      </div>

      <div
  data-tour="relatorios-periodo"
  className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3"
>
        <div>
          <label className="text-sm font-medium text-gray-700">
            {t("filters.startDate")}
          </label>
          <input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="mt-1 w-full border rounded-lg p-2 bg-white"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            {t("filters.endDate")}
          </label>
          <input
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            className="mt-1 w-full border rounded-lg p-2 bg-white"
          />
        </div>
      </div>

<div data-tour="relatorios-polo">
  <label className="text-sm font-medium text-gray-700">
    {t("filters.campus")}
  </label>
  <select
    value={poloId}
    onChange={(e) => setPoloId(e.target.value)}
    className="mt-1 w-full border rounded-lg p-2 bg-white"
  >
    <option value="">{t("filters.allCampuses")}</option>
    {polos.map((polo) => (
      <option key={polo.id} value={polo.id}>
        {polo.nome}
      </option>
    ))}
  </select>
</div>

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {loading ? (
        <div className="bg-white border rounded-xl p-6 text-gray-600">
          {t("loading")}
        </div>
      ) : !dados ? null : (
        <>
          <div
  data-tour="relatorios-resumo"
  className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-4"
>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-sm text-gray-500">{t("summary.entries")}</p>
              <p className="text-2xl font-bold">
                {dados.resumo.quantidadeLancamentos}
              </p>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <p className="text-sm text-gray-500">{t("summary.totalPosted")}</p>
              <p className="text-2xl font-bold">
                {formatarMoeda(dados.resumo.totalLancado, locale)}
              </p>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <p className="text-sm text-gray-500">{t("summary.totalPaid")}</p>
              <p className="text-2xl font-bold">
                {formatarMoeda(dados.resumo.totalPago, locale)}
              </p>
            </div>

{Number(dados.resumo.totalOnlineIbe || 0) > 0 && (
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
    <p className="text-sm text-blue-700">{t("summary.onlineAsaasIbe")}</p>
    <p className="text-2xl font-bold text-blue-800">
      {formatarMoeda(Number(dados.resumo.totalOnlineIbe || 0), locale)}
    </p>
    <p className="mt-1 text-xs text-blue-700">
      {t("summary.paymentsCount", { count: Number(dados.resumo.quantidadeOnlineIbe || 0) })}
    </p>
  </div>
)}

            <div className="bg-white border rounded-xl p-4">
              <p className="text-sm text-gray-500">{t("summary.pending")}</p>
              <p className="text-2xl font-bold">
                {formatarMoeda(dados.resumo.totalPendente, locale)}
              </p>
            </div>

            <div className="bg-white border rounded-xl p-4 border-red-200 bg-red-50">
              <p className="text-sm text-red-700">{t("summary.overdue")}</p>
              <p className="text-2xl font-bold text-red-700">
                {formatarMoeda(dados.resumo.totalAtrasado, locale)}
              </p>
            </div>

            <div className="bg-white border rounded-xl p-4 border-yellow-200 bg-yellow-50">
              <p className="text-sm text-yellow-700">{t("summary.defaultingStudents")}</p>
              <p className="text-2xl font-bold text-yellow-700">
                {dados.resumo.alunosInadimplentes}
              </p>
            </div>
          </div>

          <div
  data-tour="relatorios-graficos"
  className="grid grid-cols-1 xl:grid-cols-2 gap-6"
>
            <div className="bg-white border rounded-xl p-5">
              <h2 className="text-lg font-semibold mb-4">{t("charts.revenueByDay")}</h2>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graficoReceitaPorDia}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dataLabel" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any) => formatarMoeda(Number(value || 0), locale)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="lancado"
                      name={t("charts.posted")}
                      stroke="#2563eb"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="pago"
                      name={t("charts.paid")}
                      stroke="#16a34a"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-5">
              <h2 className="text-lg font-semibold mb-4">
                {t("charts.countByStatus")}
              </h2>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={graficoPorStatus}
                      dataKey="quantidade"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label
                    >
                      {graficoPorStatus.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-4">
              {t("charts.summaryByType")}
            </h2>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graficoPorTipo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tipo" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => formatarMoeda(Number(value || 0), locale)}
                  />
                  <Bar dataKey="valor" name={t("charts.value")} fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-5">
            <h2
              data-tour="relatorios-lancamentos"
              className="w-fit text-lg font-semibold"
            >
              {t("entries.title")}
            </h2>

            {dados.lancamentos.length === 0 ? (
              <p className="text-sm text-gray-600 mt-3">
                {t("entries.empty")}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {dados.lancamentos.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">{t("table.student")}</p>
                        <p className="font-medium">{item.aluno?.nome || "-"}</p>
                      </div>

                      <div>
                        <p className="text-gray-500">{t("table.campus")}</p>
                        <p className="font-medium">{item.polo?.nome || "-"}</p>
                      </div>

                      <div>
                        <p className="text-gray-500">{t("table.type")}</p>
                        <p className="font-medium">{tipoLabel(item.tipo, t)}</p>
                      </div>

                      <div>
                        <p className="text-gray-500">{t("table.description")}</p>
                        <p className="font-medium">{item.descricao || "-"}</p>
                      </div>

                      <div>
                        <p className="text-gray-500">{t("table.finalAmount")}</p>
                        <p className="font-medium">
                          {formatarMoeda(
                            Number(item.valorFinal ?? item.valorOriginal ?? 0),
                            locale
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">{t("table.paid")}</p>
                        <p className="font-medium">
                          {formatarMoeda(Number(item.valorPago || 0), locale)}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">{t("table.status")}</p>
                        <p className="font-medium">{statusLabel(item.status, t)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      <RelatoriosTour
  aberto={tourAberto}
  onClose={() => setTourAberto(false)}
/>
    </div>
  );
}
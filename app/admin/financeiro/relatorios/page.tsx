"use client";

import { useEffect, useMemo, useState } from "react";
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

const relatoriosTourSteps = [
  {
    target: '[data-tour="relatorios-exportar"]',
    titulo: "Exportações financeiras",
    destaque: "Exporte os relatórios em CSV, Excel ou PDF.",
    descricao:
      "Esses botões permitem baixar os dados financeiros para conferência, prestação de contas ou arquivo interno.",
    imagem: "/images/relatorios.png",
  },
  {
    target: '[data-tour="relatorios-periodo"]',
    titulo: "Filtro por período",
    destaque: "Escolha a data inicial e final do relatório.",
    descricao:
      "O PHANYX recalcula os indicadores financeiros conforme o período selecionado.",
    imagem: "/images/financeiro.png",
  },
  {
    target: '[data-tour="relatorios-polo"]',
    titulo: "Filtro por polo",
    destaque: "Separe os resultados por unidade ou campus.",
    descricao:
      "Quando a instituição possui polos, você pode analisar os dados financeiros de cada unidade.",
    imagem: "/images/contador.png",
  },
  {
    target: '[data-tour="relatorios-resumo"]',
    titulo: "Resumo financeiro",
    destaque: "Veja os principais números do período.",
    descricao:
      "Aqui aparecem lançamentos, valores pagos, pendentes, atrasados e alunos inadimplentes.",
    imagem: "/images/relatorios.png",
  },
  {
    target: '[data-tour="relatorios-graficos"]',
    titulo: "Gráficos financeiros",
    destaque: "Acompanhe visualmente a evolução financeira.",
    descricao:
      "Os gráficos ajudam a entender receita por dia, status dos lançamentos e tipos de cobrança.",
    imagem: "/images/formix-inteligente.png",
  },
  {
    target: '[data-tour="relatorios-lancamentos"]',
    titulo: "Lançamentos do período",
    destaque: "Confira cada lançamento individualmente.",
    descricao:
      "Essa lista mostra aluno, polo, tipo, descrição, valor, pagamento e status.",
    imagem: "/images/financeiro.png",
  },
];

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

function formatarMoeda(valor: number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataCurta(data: string) {
  return new Date(data).toLocaleDateString("pt-BR");
}

function statusLabel(status: string) {
  const s = String(status || "").toUpperCase();
  if (s === "PAGO") return "Pago";
  if (s === "PENDENTE") return "Pendente";
  if (s === "PARCIAL") return "Parcial";
  if (s === "ATRASADO") return "Atrasado";
  if (s === "CANCELADO") return "Cancelado";
  return s;
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
  const [stepAtual, setStepAtual] = useState(0);
  const [targetRect, setTargetRect] = useState<any>(null);

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

  const topBalao = spotlight
    ? Math.min(spotlight.top + spotlight.height + 18, window.innerHeight - 330)
    : 160;

  const leftBalao = spotlight
    ? Math.max(320, Math.min(spotlight.left, window.innerWidth - 460))
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
        }}
      >
        <div className="absolute -top-2 left-10 h-4 w-4 rotate-45 border-l border-t bg-white" />

        <div className="flex gap-4">
          <img
            src={step.imagem}
            alt=""
            className="h-24 w-24 object-contain drop-shadow-lg"
          />

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
              Tutorial guiado
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
            Etapa {stepAtual + 1} de {relatoriosTourSteps.length}
          </span>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border px-3 py-2 text-sm"
            >
              Fechar
            </button>

            {stepAtual > 0 && (
              <button
                onClick={() => setStepAtual((p) => p - 1)}
                className="rounded-xl border px-3 py-2 text-sm"
              >
                Anterior
              </button>
            )}

            {stepAtual < relatoriosTourSteps.length - 1 ? (
              <button
                onClick={() => setStepAtual((p) => p + 1)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={onClose}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Finalizar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminFinanceiroRelatoriosPage() {
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
        throw new Error(json?.error || "Erro ao carregar relatórios");
      }

      setDados(json);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar relatórios");
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
    doc.rect(0, 0, largura, 32, "F");

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
  config?.razaoSocial || "Relatório Financeiro Institucional",
  34,
  20
);
doc.text(`Período: ${inicio} até ${fim}`, 34, 25);

doc.setFontSize(9);
doc.text(
  `CNPJ: ${config?.cnpj || "-"}   •   Telefone: ${config?.telefone || "-"}`,
  34,
  30
);
doc.text(
  `E-mail: ${config?.email || "-"}   •   Responsável: ${
    config?.responsavelNome || "-"
  }`,
  34,
  34
);
doc.text(
  `Cargo: ${config?.responsavelCargo || "-"}   •   Local: ${
    config?.cidade || "-"
  }/${config?.estado || "-"}`,
  34,
  38
);
doc.text(`Endereço: ${config?.endereco || "-"}`, 34, 42);
doc.setFontSize(9);
doc.text(
  `Responsável: ${config?.responsavelNome || "-"}`,
  34,
  30
);
    y = 54;

    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Resumo Executivo", margem, y);
    y += 8;

    const cards = [
      {
        titulo: "Total lançado",
        valor: formatarMoeda(dados.resumo.totalLancado),
      },
      {
        titulo: "Total pago",
        valor: formatarMoeda(dados.resumo.totalPago),
      },
      {
        titulo: "Pendente",
        valor: formatarMoeda(dados.resumo.totalPendente),
      },
      {
        titulo: "Atrasado",
        valor: formatarMoeda(dados.resumo.totalAtrasado),
      },
      {
        titulo: "Inadimplentes",
        valor: String(dados.resumo.alunosInadimplentes),
      },
      {
        titulo: "Lançamentos",
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
    doc.text("Resumo por Tipo", margem, y);
    y += 8;

    const tipos = [
      ["Matrícula", formatarMoeda(dados.resumoPorTipo.MATRICULA)],
      ["Mensalidade", formatarMoeda(dados.resumoPorTipo.MENSALIDADE)],
      ["Taxa", formatarMoeda(dados.resumoPorTipo.TAXA)],
      ["Desconto", formatarMoeda(dados.resumoPorTipo.DESCONTO)],
      ["Outro", formatarMoeda(dados.resumoPorTipo.OUTRO)],
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
    doc.text("Lançamentos do Período", margem, y);
    y += 8;

    const colunas = [
      { titulo: "Aluno", x: 14, largura: 42 },
      { titulo: "Tipo", x: 57, largura: 22 },
      { titulo: "Descrição", x: 80, largura: 48 },
      { titulo: "Valor", x: 129, largura: 20 },
      { titulo: "Pago", x: 150, largura: 20 },
      { titulo: "Status", x: 171, largura: 25 },
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
      const tipo = item.tipo || "-";
      const descricao = item.descricao || "-";
      const valor = formatarMoeda(
        Number(item.valorFinal ?? item.valorOriginal ?? 0)
      );
      const pago = formatarMoeda(Number(item.valorPago || 0));
      const status = statusLabel(item.status);

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
        `Observação: exibidos os primeiros ${lancamentosParaPdf.length} lançamentos no PDF.`,
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
  `${config?.nomeFantasia || "PHANYX"} • Relatório Financeiro Institucional`,
  14,
  292
);
doc.text(`Página ${i} de ${totalPaginas}`, 176, 292);
    }

    const nomeArquivo = `${
  config?.nomeFantasia || "instituicao"
}_relatorio_financeiro.pdf`
  .replace(/\s+/g, "_")
  .toLowerCase();

doc.save(nomeArquivo);
  }

  const graficoPorTipo = useMemo(() => {
    if (!dados) return [];

    return [
      {
        tipo: "Matrícula",
        valor: Number(dados.resumoPorTipo.MATRICULA || 0),
      },
      {
        tipo: "Mensalidade",
        valor: Number(dados.resumoPorTipo.MENSALIDADE || 0),
      },
      {
        tipo: "Taxa",
        valor: Number(dados.resumoPorTipo.TAXA || 0),
      },
      {
        tipo: "Desconto",
        valor: Number(dados.resumoPorTipo.DESCONTO || 0),
      },
      {
        tipo: "Outro",
        valor: Number(dados.resumoPorTipo.OUTRO || 0),
      },
    ];
  }, [dados]);

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
        status,
        quantidade,
      }))
      .filter((item) => item.quantidade > 0);
  }, [dados]);

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
        dataLabel: formatarDataCurta(item.data),
      }));
  }, [dados]);

  const pieColors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#6b7280"];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">📊 Relatórios Financeiros</h1>
          <p className="text-gray-600 mt-1">
            Acompanhe recebimentos, pendências, atrasos e inadimplência.
          </p>
          <button
  onClick={() => setTourAberto(true)}
  className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
>
  ✨ Abrir tutorial guiado
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
            Data inicial
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
            Data final
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
    Polo
  </label>
  <select
    value={poloId}
    onChange={(e) => setPoloId(e.target.value)}
    className="mt-1 w-full border rounded-lg p-2 bg-white"
  >
    <option value="">Todos os polos</option>
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
          Carregando relatórios...
        </div>
      ) : !dados ? null : (
        <>
          <div
  data-tour="relatorios-resumo"
  className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-4"
>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-sm text-gray-500">Lançamentos</p>
              <p className="text-2xl font-bold">
                {dados.resumo.quantidadeLancamentos}
              </p>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <p className="text-sm text-gray-500">Total lançado</p>
              <p className="text-2xl font-bold">
                {formatarMoeda(dados.resumo.totalLancado)}
              </p>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <p className="text-sm text-gray-500">Total pago</p>
              <p className="text-2xl font-bold">
                {formatarMoeda(dados.resumo.totalPago)}
              </p>
            </div>

{Number(dados.resumo.totalOnlineIbe || 0) > 0 && (
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
    <p className="text-sm text-blue-700">Online Asaas IBE</p>
    <p className="text-2xl font-bold text-blue-800">
      {formatarMoeda(Number(dados.resumo.totalOnlineIbe || 0))}
    </p>
    <p className="mt-1 text-xs text-blue-700">
      {Number(dados.resumo.quantidadeOnlineIbe || 0)} pagamento(s)
    </p>
  </div>
)}

            <div className="bg-white border rounded-xl p-4">
              <p className="text-sm text-gray-500">Pendente</p>
              <p className="text-2xl font-bold">
                {formatarMoeda(dados.resumo.totalPendente)}
              </p>
            </div>

            <div className="bg-white border rounded-xl p-4 border-red-200 bg-red-50">
              <p className="text-sm text-red-700">Atrasado</p>
              <p className="text-2xl font-bold text-red-700">
                {formatarMoeda(dados.resumo.totalAtrasado)}
              </p>
            </div>

            <div className="bg-white border rounded-xl p-4 border-yellow-200 bg-yellow-50">
              <p className="text-sm text-yellow-700">Inadimplentes</p>
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
              <h2 className="text-lg font-semibold mb-4">Receita por dia</h2>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graficoReceitaPorDia}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dataLabel" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any) => formatarMoeda(Number(value || 0))}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="lancado"
                      name="Lançado"
                      stroke="#2563eb"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="pago"
                      name="Pago"
                      stroke="#16a34a"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-5">
              <h2 className="text-lg font-semibold mb-4">
                Quantidade por status
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
              Resumo por tipo de lançamento
            </h2>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graficoPorTipo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tipo" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => formatarMoeda(Number(value || 0))}
                  />
                  <Bar dataKey="valor" name="Valor" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
  data-tour="relatorios-lancamentos"
  className="bg-white border rounded-xl p-5"
>
            <h2 className="text-lg font-semibold">Lançamentos do período</h2>

            {dados.lancamentos.length === 0 ? (
              <p className="text-sm text-gray-600 mt-3">
                Nenhum lançamento encontrado neste período.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {dados.lancamentos.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Aluno</p>
                        <div>
  <p className="text-gray-500">Polo</p>
  <p className="font-medium">
    {(item as any).polo?.nome || "-"}
  </p>
</div>

<div>
  <p className="text-gray-500">Polo</p>
  <p className="font-medium">{item.polo?.nome || "-"}</p>
</div>

                        <p className="font-medium">{item.aluno?.nome || "-"}</p>
                      </div>

                      <div>
                        <p className="text-gray-500">Tipo</p>
                        <p className="font-medium">{item.tipo}</p>
                      </div>

                      <div>
                        <p className="text-gray-500">Descrição</p>
                        <p className="font-medium">{item.descricao || "-"}</p>
                      </div>

                      <div>
                        <p className="text-gray-500">Valor final</p>
                        <p className="font-medium">
                          {formatarMoeda(
                            Number(item.valorFinal ?? item.valorOriginal ?? 0)
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Pago</p>
                        <p className="font-medium">
                          {formatarMoeda(Number(item.valorPago || 0))}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Status</p>
                        <p className="font-medium">{item.status}</p>
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
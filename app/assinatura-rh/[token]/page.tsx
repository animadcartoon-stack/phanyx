"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import PhanyxToast from "@/components/ui/PhanyxToast";

type TipoAssinatura = "DESENHO" | "DIGITAL";

type DocumentoAssinaturaRH = {
  tipoDocumento: "RECIBO_PAGAMENTO_HOLERITE";
  pagamentoId: number;
  holeriteId: number;
  reciboNumero: string;
  status: string;

  podeAssinar: boolean;
  podeContestar: boolean;
  expirado: boolean;
  confirmado: boolean;
  contestado: boolean;

  solicitadoEm?: string | null;
  expiraEm?: string | null;
  confirmadoEm?: string | null;
  tipoAssinatura?: string | null;

  instituicao: {
    id: number;
    nome: string;
    nomeFantasia?: string | null;
    cnpj?: string | null;
    logoUrl?: string | null;
  };

  funcionario: {
    id: number;
    nome: string;
    cpfMascarado?: string | null;
    cargo?: string | null;
    setor?: string | null;
    codigo?: string | null;
  };

  holerite: {
    id: number;
    competencia: string;
    competenciaMes: number;
    competenciaAno: number;
    salarioBase: number;
    totalVencimentos: number;
    totalDescontos: number;
    valorLiquido: number;

    eventos: Array<{
      id: number;
      codigo?: string | null;
      descricao: string;
      referencia?: string | null;
      tipo: string;
      valor: number;
    }>;
  };

  pagamento: {
    formaPagamento: string;
    formaPagamentoNome: string;
    valorPago: number;
    pagoEm: string;
    identificadorTransacao?: string | null;
    bancoOrigem?: string | null;
    contaDestinoMascarada?: string | null;
    observacoes?: string | null;
  };

  registradoPor?: {
    id: number;
    nome: string;
  } | null;
};

function moeda(valor: number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataHoraBR(valor?: string | null) {
  if (!valor) return "Não informado";

  return new Date(valor).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function AssinaturaReciboRHPage() {
  const params = useParams();

  const tokenParam = params?.token;

  const token = Array.isArray(tokenParam)
    ? String(tokenParam[0] || "")
    : String(tokenParam || "");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const resultadoAssinaturaRef = useRef<HTMLDivElement | null>(null);

  const [documento, setDocumento] = useState<DocumentoAssinaturaRH | null>(
    null,
  );

  const [carregando, setCarregando] = useState(true);

  const [assinando, setAssinando] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [nomeConfirmacao, setNomeConfirmacao] = useState("");

  const [cpfConfirmacao, setCpfConfirmacao] = useState("");

  const [tipoAssinatura, setTipoAssinatura] =
    useState<TipoAssinatura>("DESENHO");

  const [assinaturaDigital, setAssinaturaDigital] = useState("");

  const [assinaturaDesenhada, setAssinaturaDesenhada] = useState(false);

  const [aceitouTermos, setAceitouTermos] = useState(false);

  const desenhandoRef = useRef(false);

  function obterContexto() {
    const canvas = canvasRef.current;

    if (!canvas) return null;

    return canvas.getContext("2d");
  }

  function obterCoordenadas(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return {
        x: 0,
        y: 0,
      };
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),

      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function iniciarDesenho(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!documento?.podeAssinar) return;

    const canvas = canvasRef.current;
    const contexto = obterContexto();

    if (!canvas || !contexto) return;

    canvas.setPointerCapture(event.pointerId);

    const coordenadas = obterCoordenadas(event);

    desenhandoRef.current = true;

    contexto.beginPath();

    contexto.moveTo(coordenadas.x, coordenadas.y);
  }

  function desenhar(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!desenhandoRef.current) return;

    const contexto = obterContexto();

    if (!contexto) return;

    const coordenadas = obterCoordenadas(event);

    contexto.lineWidth = 4;
    contexto.lineCap = "round";
    contexto.lineJoin = "round";
    contexto.strokeStyle = "#111827";

    contexto.lineTo(coordenadas.x, coordenadas.y);

    contexto.stroke();

    setAssinaturaDesenhada(true);
  }

  function pararDesenho(event?: React.PointerEvent<HTMLCanvasElement>) {
    desenhandoRef.current = false;

    const contexto = obterContexto();

    contexto?.beginPath();

    if (event && canvasRef.current?.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }
  }

  function limparAssinatura() {
    const canvas = canvasRef.current;
    const contexto = obterContexto();

    if (!canvas || !contexto) return;

    contexto.clearRect(0, 0, canvas.width, canvas.height);

    setAssinaturaDesenhada(false);
  }

  function gerarAssinaturaDigitada() {
    const canvas = document.createElement("canvas");

    canvas.width = 900;
    canvas.height = 260;

    const contexto = canvas.getContext("2d");

    if (!contexto) return "";

    contexto.fillStyle = "#ffffff";

    contexto.fillRect(0, 0, canvas.width, canvas.height);

    contexto.fillStyle = "#111827";
    contexto.font = "italic 62px serif";

    contexto.fillText(assinaturaDigital.trim(), 45, 135);

    contexto.fillStyle = "#64748b";
    contexto.font = "18px Arial";

    contexto.fillText("Assinatura eletrônica gerada pelo PHANYX", 45, 195);

    contexto.fillText(`Recibo: ${documento?.reciboNumero || ""}`, 45, 222);

    return canvas.toDataURL("image/png");
  }

  async function carregarDocumento() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch(
        `/api/assinatura-rh/${encodeURIComponent(token)}`,
        {
          cache: "no-store",
        },
      );

      const dados = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        throw new Error(dados?.error || "Não foi possível carregar o recibo.");
      }

      setDocumento(dados);

      setNomeConfirmacao(dados?.funcionario?.nome || "");

      setAssinaturaDigital(dados?.funcionario?.nome || "");
    } catch (error: any) {
      setDocumento(null);

      setErro(error?.message || "Erro ao carregar o recibo de pagamento.");
    } finally {
      setCarregando(false);
    }
  }

  async function assinarRecibo() {
    if (!documento) return;

    if (!documento.podeAssinar) {
      mostrarErroAssinatura(
        "Este recibo não está disponível para assinatura.",
      );
      return;
    }

    if (!nomeConfirmacao.trim()) {
      mostrarErroAssinatura("Confirme seu nome completo.");
      return;
    }

    const cpfNumerico = cpfConfirmacao.replace(/\D/g, "");

    if (cpfNumerico.length !== 11) {
      mostrarErroAssinatura(
        "Informe um CPF válido com 11 números.",
      );
      return;
    }

    if (!aceitouTermos) {
      mostrarErroAssinatura(
        "Marque a declaração de recebimento antes de confirmar a assinatura.",
      );
      return;
    }

    let assinaturaBase64 = "";

    if (tipoAssinatura === "DESENHO") {
      if (!assinaturaDesenhada) {
        mostrarErroAssinatura(
          "Desenhe sua assinatura no campo indicado.",
        );

        return;
      }

      assinaturaBase64 = canvasRef.current?.toDataURL("image/png") || "";
    } else {
      if (!assinaturaDigital.trim()) {
        mostrarErroAssinatura(
          "Digite seu nome completo para gerar a assinatura.",
        );

        return;
      }

      assinaturaBase64 = gerarAssinaturaDigitada();
    }

    if (!assinaturaBase64) {
      setErro("Não foi possível gerar a imagem da assinatura.");

      return;
    }

    try {
      setAssinando(true);
      setErro("");
      setSucesso("");

      const resposta = await fetch("/api/assinatura-rh/assinar", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          token,
          nome: nomeConfirmacao.trim(),
          cpf: cpfConfirmacao.trim(),
          tipoAssinatura,
          assinaturaBase64,
          aceitouTermos: true,
        }),
      });

      const dados = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        throw new Error(dados?.error || "Não foi possível assinar o recibo.");
      }

      setSucesso(dados?.message || "Recibo assinado com sucesso.");

      await carregarDocumento();
    } catch (error: any) {
      setErro(error?.message || "Erro ao assinar o recibo.");
    } finally {
      setAssinando(false);
    }
  }

  function mostrarErroAssinatura(mensagem: string) {
    setSucesso("");
    setErro(mensagem);

    window.requestAnimationFrame(() => {
      resultadoAssinaturaRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

  useEffect(() => {
    if (token) {
      carregarDocumento();
    } else {
      setCarregando(false);

      setErro("Link de assinatura inválido.");
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      {erro && (
        <PhanyxToast
          tipo="erro"
          titulo="Não foi possível continuar"
          mensagem={erro}
          onClose={() => setErro("")}
        />
      )}

      {sucesso && (
        <PhanyxToast
          tipo="sucesso"
          titulo="Recibo assinado"
          mensagem={sucesso}
          onClose={() => setSucesso("")}
        />
      )}

      <main className="mx-auto w-full max-w-4xl rounded-3xl bg-white p-5 shadow-2xl sm:p-8">
        {carregando ? (
          <div className="py-16 text-center text-sm text-slate-600">
            Carregando recibo de pagamento...
          </div>
        ) : !documento ? (
          <div className="py-16 text-center">
            <h1 className="text-xl font-bold text-slate-900">
              Recibo não disponível
            </h1>

            <p className="mt-3 text-sm text-slate-600">
              O link pode estar incorreto, vencido ou ter sido substituído.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
              {documento.instituicao.logoUrl && (
                <img
                  src={documento.instituicao.logoUrl}
                  alt={`Logo de ${documento.instituicao.nome}`}
                  className="h-16 w-24 rounded-xl object-contain"
                />
              )}

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  Recibo de pagamento
                </p>

                <h1 className="mt-1 text-2xl font-black text-slate-900">
                  Assinatura do funcionário
                </h1>

                <p className="mt-1 text-sm text-slate-600">
                  {documento.instituicao.nome}
                </p>

                <p className="text-xs text-slate-500">
                  Recibo {documento.reciboNumero}
                </p>
              </div>
            </header>

            {documento.confirmado && (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-900">
                <p className="font-bold">Recebimento confirmado</p>

                <p className="mt-1 text-sm">
                  Este recibo foi assinado em{" "}
                  {dataHoraBR(documento.confirmadoEm)}.
                </p>
              </div>
            )}

            {documento.contestado && (
              <div className="rounded-2xl border border-red-300 bg-red-50 p-5 text-red-900">
                <p className="font-bold">Pagamento contestado</p>

                <p className="mt-1 text-sm">
                  Este recibo foi contestado pelo funcionário e aguarda análise
                  do RH.
                </p>
              </div>
            )}

            {documento.expirado && !documento.confirmado && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900">
                <p className="font-bold">Link expirado</p>

                <p className="mt-1 text-sm">
                  Solicite ao RH a geração de um novo link de assinatura.
                </p>
              </div>
            )}

            <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">
                  Funcionário
                </p>

                <p className="mt-1 font-bold text-slate-900">
                  {documento.funcionario.nome}
                </p>

                <p className="text-sm text-slate-600">
                  {documento.funcionario.cpfMascarado || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-500">
                  Competência
                </p>

                <p className="mt-1 font-bold text-slate-900">
                  {documento.holerite.competencia}
                </p>

                <p className="text-sm text-slate-600">
                  {documento.funcionario.cargo || "Cargo não informado"}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-500">
                  Valor recebido
                </p>

                <p className="mt-1 text-xl font-black text-emerald-700">
                  {moeda(documento.pagamento.valorPago)}
                </p>

                <p className="text-sm text-slate-600">
                  {documento.pagamento.formaPagamentoNome}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 p-5">
              <h2 className="font-bold text-slate-900">Dados do pagamento</h2>

              <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <p>
                  <strong>Data:</strong>{" "}
                  {dataHoraBR(documento.pagamento.pagoEm)}
                </p>

                <p>
                  <strong>Banco:</strong>{" "}
                  {documento.pagamento.bancoOrigem || "Não informado"}
                </p>

                <p>
                  <strong>Transação:</strong>{" "}
                  {documento.pagamento.identificadorTransacao ||
                    "Não informada"}
                </p>

                <p>
                  <strong>Destino:</strong>{" "}
                  {documento.pagamento.contaDestinoMascarada || "Não informado"}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 p-5">
              <h2 className="font-bold text-slate-900">
                Composição do holerite
              </h2>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <th className="py-2">Código</th>

                      <th className="py-2">Descrição</th>

                      <th className="py-2">Tipo</th>

                      <th className="py-2 text-right">Valor</th>
                    </tr>
                  </thead>

                  <tbody>
                    {documento.holerite.eventos.map((evento) => (
                      <tr key={evento.id} className="border-b border-slate-100">
                        <td className="py-2">{evento.codigo || "-"}</td>

                        <td className="py-2">{evento.descricao}</td>

                        <td className="py-2">
                          {evento.tipo === "DESCONTO"
                            ? "Desconto"
                            : "Vencimento"}
                        </td>

                        <td className="py-2 text-right font-semibold">
                          {evento.tipo === "DESCONTO" ? "- " : ""}
                          {moeda(evento.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 text-sm sm:grid-cols-3">
                <p>
                  <strong>Vencimentos:</strong>{" "}
                  {moeda(documento.holerite.totalVencimentos)}
                </p>

                <p>
                  <strong>Descontos:</strong>{" "}
                  {moeda(documento.holerite.totalDescontos)}
                </p>

                <p className="font-black text-emerald-700">
                  Líquido: {moeda(documento.holerite.valorLiquido)}
                </p>
              </div>
            </section>

            {documento.podeAssinar && (
              <section className="rounded-2xl border border-slate-200 p-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Confirmar recebimento
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                  Assine somente após conferir os dados e reconhecer o
                  recebimento do valor informado.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      Nome completo
                    </label>

                    <input
                      value={nomeConfirmacao}
                      onChange={(event) =>
                        setNomeConfirmacao(event.target.value)
                      }
                      disabled={assinando}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      CPF
                    </label>

                    <input
                      value={cpfConfirmacao}
                      onChange={(event) => {
                        const numeros = event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 11);

                        const formatado = numeros
                          .replace(/^(\d{3})(\d)/, "$1.$2")
                          .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
                          .replace(/\.(\d{3})(\d)/, ".$1-$2");

                        setCpfConfirmacao(formatado);
                        setErro("");
                      }}
                      disabled={assinando}
                      inputMode="numeric"
                      maxLength={14}
                      placeholder="Informe seu CPF"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={assinando}
                    onClick={() => setTipoAssinatura("DESENHO")}
                    className={`rounded-xl border px-4 py-3 text-sm font-bold ${tipoAssinatura === "DESENHO"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-slate-300 text-slate-700"
                      }`}
                  >
                    ✍️ Desenhar assinatura
                  </button>

                  <button
                    type="button"
                    disabled={assinando}
                    onClick={() => setTipoAssinatura("DIGITAL")}
                    className={`rounded-xl border px-4 py-3 text-sm font-bold ${tipoAssinatura === "DIGITAL"
                      ? "border-blue-500 bg-blue-50 text-blue-800"
                      : "border-slate-300 text-slate-700"
                      }`}
                  >
                    🔐 Assinatura digitada
                  </button>
                </div>

                {tipoAssinatura === "DESENHO" ? (
                  <div className="mt-5">
                    <p className="mb-2 text-sm font-semibold text-slate-700">
                      Assine no espaço abaixo
                    </p>

                    <canvas
                      ref={canvasRef}
                      width={900}
                      height={260}
                      onPointerDown={iniciarDesenho}
                      onPointerMove={desenhar}
                      onPointerUp={pararDesenho}
                      onPointerCancel={pararDesenho}
                      onPointerLeave={pararDesenho}
                      className="h-[220px] w-full touch-none rounded-xl border-2 border-dashed border-slate-300 bg-white"
                    />

                    <button
                      type="button"
                      disabled={assinando}
                      onClick={limparAssinatura}
                      className="mt-3 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                    >
                      Limpar assinatura
                    </button>
                  </div>
                ) : (
                  <div className="mt-5">
                    <label className="text-sm font-semibold text-slate-700">
                      Digite seu nome completo
                    </label>

                    <input
                      value={assinaturaDigital}
                      onChange={(event) =>
                        setAssinaturaDigital(event.target.value)
                      }
                      disabled={assinando}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-lg text-slate-900 outline-none focus:border-blue-500"
                    />

                    <div className="mt-4 rounded-xl border bg-slate-50 p-6 text-center">
                      <p className="font-serif text-4xl italic text-slate-900">
                        {assinaturaDigital || "Sua assinatura"}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        Assinatura eletrônica gerada pelo PHANYX
                      </p>
                    </div>
                  </div>
                )}

                <label className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={aceitouTermos}
                    onChange={(event) => setAceitouTermos(event.target.checked)}
                    disabled={assinando}
                    className="mt-1"
                  />

                  <span>
                    Declaro que conferi este recibo, reconheço o recebimento do
                    valor de{" "}
                    <strong>{moeda(documento.pagamento.valorPago)}</strong> e
                    autorizo o registro desta assinatura eletrônica.
                  </span>
                </label>

                <div
                  ref={resultadoAssinaturaRef}
                  aria-live="polite"
                  className="mt-5"
                >
                  {erro && (
                    <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                      <p className="font-bold">
                        Não foi possível confirmar a assinatura
                      </p>

                      <p className="mt-1">{erro}</p>
                    </div>
                  )}

                  {sucesso && (
                    <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                      <p className="font-bold">
                        Recebimento confirmado e assinatura registrada
                      </p>

                      <p className="mt-1">{sucesso}</p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={assinarRecibo}
                  disabled={assinando}
                  className="w-full rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {assinando
                    ? "Confirmando assinatura..."
                    : "Confirmar recebimento e registrar assinatura"}
                </button>
              </section>
            )}

            <footer className="border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
              Documento protegido por link individual. Não compartilhe esta
              página com terceiros.
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}

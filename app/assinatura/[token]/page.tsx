"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  renderizarCamposEscolha,
  validarRespostasCampos,
  type CampoEscolha,
  type RespostasCampos,
} from "@/lib/documentos/campos-interativos";
import PhanyxToast from "@/components/ui/PhanyxToast";

type ContratoApi = {
  id: number;
  tokenAssinatura?: string | null;
  status: string;
  conteudo: string;
  camposEscolha: CampoEscolha[];
  titular: { nome: string | null } | null;
  dataCriacao?: string;
  dataAssinatura?: string | null;
  aluno?: {
    id: number;
    nome: string;
    cpf?: string | null;
    matricula?: string | null;
  } | null;
  matricula?: {
    id: number;
    status?: string | null;
    semestre?: number | null;
    curso?: {
      id: number;
      nome: string;
    } | null;
  } | null;
  assinatura?: {
    id: number;
    nome: string;
    cpf: string;
    data: string;
    respostasCampos?: RespostasCampos | null;
  } | null;
};

export default function AssinaturaPorTokenPage() {
  const tCampos = useTranslations("DocumentInteractiveFields");
  const params = useParams();
  const token = String(params.token || "");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [desenhando, setDesenhando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [contrato, setContrato] = useState<ContratoApi | null>(null);
  const [tipoAssinatura, setTipoAssinatura] = useState<"DESENHO" | "DIGITAL">("DESENHO");
  const [assinaturaDigital, setAssinaturaDigital] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [respostas, setRespostas] = useState<RespostasCampos>({});
  const camposEscolha = contrato?.camposEscolha ?? [];

  const conteudoLegivel = contrato && camposEscolha.length
    ? new DOMParser().parseFromString(
        renderizarCamposEscolha(contrato.conteudo, respostas)
          .replace(/<br\s*\/?>|<\/(?:p|h[1-6]|li|tr|div)>/gi, "$&\n"),
        "text/html",
      ).body.textContent
    : contrato?.conteudo;

  function limparEscolha(id: string) {
    setRespostas(atuais => Object.fromEntries(Object.entries(atuais).filter(([chave]) => chave !== id)));
  }

  function iniciarDesenho(e: React.MouseEvent<HTMLCanvasElement>) {
    setDesenhando(true);
    desenhar(e);
  }

  function pararDesenho() {
    setDesenhando(false);
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.beginPath();
  }

  function desenhar(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!desenhando) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

function gerarAssinaturaDigitalBase64() {
  const canvas = document.createElement("canvas");
  canvas.width = 700;
  canvas.height = 220;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#111827";
  ctx.font = "48px cursive";
  ctx.fillText(assinaturaDigital.trim(), 40, 120);

  ctx.font = "14px Arial";
  ctx.fillStyle = "#64748b";
  ctx.fillText("Assinatura digital gerada pelo PHANYX", 40, 170);

  return canvas.toDataURL("image/png");
}

  function limparAssinatura() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function carregarContrato() {
    try {
      setLoading(true);
      setMensagem("");

      const res = await fetch(`/api/assinatura/${token}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar contrato");
      }

      setContrato(data);
      const nomeTitular = data.assinatura?.nome || (data.titular ? data.titular.nome : data.aluno?.nome) || "";
      setNome(nomeTitular);
      setCpf(data.assinatura?.cpf || data.aluno?.cpf || "");
      setAssinaturaDigital(nomeTitular);
      setRespostas(data.assinatura?.respostasCampos ?? {});
    } catch (error: any) {
      console.error(error);
      setMensagem(error?.message || "Erro ao carregar contrato");
      setContrato(null);
    } finally {
      setLoading(false);
    }
  }

  async function assinar() {
    try {
      if (!contrato) return;

      if (contrato.status === "ASSINADO") {
        setErro("Este contrato já foi assinado.");
        return;
      }

      const validacao = validarRespostasCampos(camposEscolha, respostas);
      if (validacao.erro) {
        setErro(tCampos(validacao.erro));
        return;
      }

      let assinaturaBase64 = "";

if (!aceitouTermos) {
  setErro("Você precisa declarar que leu e concorda com o documento antes de assinar.");
  return;
}

if (tipoAssinatura === "DESENHO") {
  const canvas = canvasRef.current;

  if (!canvas) {
    setErro("Canvas de assinatura não encontrado.");
    return;
  }

  assinaturaBase64 = canvas.toDataURL("image/png");
} else {
  if (!assinaturaDigital.trim()) {
    setErro("Digite seu nome completo para gerar a assinatura digital.");
    return;
  }

  assinaturaBase64 = gerarAssinaturaDigitalBase64();
}

console.log("ASSINATURA GERADA");

      if (!nome.trim()) {
        setErro("Informe o nome completo antes de assinar.");
        return;
      }

      if (!cpf.trim()) {
        setErro("Informe o CPF antes de assinar.");
        return;
      }

      setSaving(true);
      setMensagem("");

      const res = await fetch("/api/assinatura/assinar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          nome,
          cpf,
          assinaturaBase64,
          aceitouTermos,
          respostasCampos: validacao.respostas,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const codigos = ["respostaObrigatoria", "respostaInvalida", "campoInvalido", "acceptTerms", "holderCpf"];
        if (codigos.includes(data?.codigo)) throw new Error(tCampos(data.codigo));
        throw new Error(data?.error || "Erro ao assinar");
      }

      setSucesso("Contrato assinado com sucesso.");
      await carregarContrato();
    } catch (error: any) {
  console.error("ERRO ASSINATURA:", error);
  setErro(error?.message || "Erro ao assinar contrato");
} finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (token) {
      carregarContrato();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      {erro && (
  <PhanyxToast
    tipo="erro"
    titulo="Não foi possível assinar"
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
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="text-xl font-bold text-gray-900">
          Assinatura de Contrato
        </h1>

        {mensagem ? (
          <div className="mt-4 rounded-xl border bg-white p-3 text-sm text-gray-700">
            {mensagem}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 text-sm text-gray-600">Carregando contrato...</div>
        ) : !contrato ? (
          <div className="mt-6 text-sm text-red-600">
            Contrato não encontrado.
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nome completo
                </label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                  placeholder="Seu nome completo"
                  disabled={contrato.status === "ASSINADO"}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  CPF
                </label>
                <input
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                  placeholder="CPF"
                  disabled={contrato.status === "ASSINADO"}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-sm">
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-medium text-gray-800">{contrato.status}</p>
              </div>

              <div>
                <p className="text-gray-500">Aluno</p>
                <p className="font-medium text-gray-800">
                  {contrato.aluno?.nome || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Matrícula</p>
                <p className="font-medium text-gray-800">
                  {contrato.aluno?.matricula || "-"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Contrato</p>
              <div className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded-xl border bg-gray-50 p-4 text-sm leading-7 text-gray-800">
                {conteudoLegivel}
              </div>
            </div>

            {camposEscolha.length > 0 && (
              <section className="space-y-4 rounded-2xl border bg-white p-4 text-slate-900" aria-labelledby="escolhas-contrato">
                <h2 id="escolhas-contrato" className="font-semibold">{tCampos("choices")}</h2>
                {contrato.status === "PENDENTE" && <p className="text-sm text-slate-700">{tCampos("responseHelp")}</p>}
                {camposEscolha.map(campo => (
                  <fieldset key={campo.id} disabled={contrato.status !== "PENDENTE" || saving} className="space-y-2 rounded-lg border p-3">
                    <legend className="max-w-full px-1 font-medium">
                      {campo.pergunta} <span className="text-xs text-slate-600">({tCampos(campo.obrigatoria ? "requiredShort" : "optional")})</span>
                    </legend>
                    {campo.opcoes.map((opcao, indice) => (
                      <label key={opcao} className="flex min-h-10 items-center gap-3 rounded-lg border px-3 py-2 text-sm">
                        <input type="radio" name={`campo-${campo.id}`} required={campo.obrigatoria}
                          checked={respostas[campo.id] === indice}
                          onChange={() => setRespostas(atuais => ({ ...atuais, [campo.id]: indice }))} />
                        <span className="min-w-0 break-words">{opcao}</span>
                      </label>
                    ))}
                    {!campo.obrigatoria && respostas[campo.id] !== undefined && contrato.status === "PENDENTE" && (
                      <button type="button" className="text-sm font-semibold text-blue-700 underline"
                        onClick={() => limparEscolha(campo.id)}>{tCampos("clearResponse")}</button>
                    )}
                  </fieldset>
                ))}
              </section>
            )}

            <div>
              <div className="rounded-2xl border bg-white p-4">
  <p className="mb-3 text-sm font-semibold text-gray-800">
    Escolha como deseja assinar
  </p>

  <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
    <button
      type="button"
      onClick={() => setTipoAssinatura("DESENHO")}
      disabled={contrato.status === "ASSINADO"}
      className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
        tipoAssinatura === "DESENHO"
          ? "border-green-500 bg-green-50 text-green-700"
          : "bg-white text-gray-700"
      }`}
    >
      ✍️ Desenhar assinatura
    </button>

    <button
      type="button"
      onClick={() => setTipoAssinatura("DIGITAL")}
      disabled={contrato.status === "ASSINADO"}
      className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
        tipoAssinatura === "DIGITAL"
          ? "border-blue-500 bg-blue-50 text-blue-700"
          : "bg-white text-gray-700"
      }`}
    >
      🔐 Assinatura digital digitada
    </button>
  </div>

  {tipoAssinatura === "DESENHO" ? (
    <div>
      <p className="mb-2 text-sm text-gray-600">Assine abaixo:</p>

      <canvas
        ref={canvasRef}
        width={700}
        height={220}
        className="w-full rounded-xl border bg-white"
        onMouseDown={iniciarDesenho}
        onMouseUp={pararDesenho}
        onMouseMove={desenhar}
        onMouseLeave={pararDesenho}
      />
    </div>
  ) : (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Digite seu nome completo para gerar a assinatura digital
      </label>

      <input
        value={assinaturaDigital}
        onChange={(e) => setAssinaturaDigital(e.target.value)}
        disabled={contrato.status === "ASSINADO"}
        className="w-full rounded-xl border px-3 py-3 text-lg"
        placeholder="Seu nome completo"
      />

      <div className="mt-4 rounded-xl border bg-slate-50 p-6 text-center">
        <p className="font-serif text-4xl italic text-slate-900">
          {assinaturaDigital || "Sua assinatura"}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Assinatura digital gerada pelo PHANYX
        </p>
      </div>
    </div>
  )}

  <label className="mt-4 flex items-start gap-3 rounded-xl border bg-slate-50 p-3 text-sm text-slate-700">
    <input
      type="checkbox"
      checked={aceitouTermos}
      onChange={(e) => setAceitouTermos(e.target.checked)}
      disabled={contrato.status === "ASSINADO"}
      className="mt-1"
    />
    <span>
      Declaro que li integralmente este documento, concordo com seus termos
      e reconheço esta assinatura eletrônica como válida.
    </span>
  </label>
</div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
  onClick={() => {
    if (tipoAssinatura === "DESENHO") {
      limparAssinatura();
    } else {
      setAssinaturaDigital(nome);
    }
  }}
                className="rounded-xl bg-gray-500 px-4 py-2 text-white"
                disabled={contrato.status === "ASSINADO" || saving}
              >
                {tipoAssinatura === "DESENHO" ? "Limpar" : "Restaurar nome"}
              </button>

              <button
                onClick={assinar}
                className="rounded-xl bg-green-600 px-4 py-2 text-white"
                disabled={contrato.status === "ASSINADO" || saving}
              >
                {contrato.status === "ASSINADO"
                  ? "Contrato já assinado"
                  : saving
                  ? "Assinando..."
                  : "Assinar contrato"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
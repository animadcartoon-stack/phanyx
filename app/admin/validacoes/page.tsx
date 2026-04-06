"use client";

import { useMemo, useState } from "react";

type ValidacaoResponse = {
  valido?: boolean;
  codigo?: string;
  statusValidacao?: string;
  mensagem?: string;
  error?: string;
  documento?: {
    id: number;
    titulo: string;
    tipo: string;
    status: string;
    criadoEm?: string;
    atualizadoEm?: string;
    exigeAssinatura?: boolean;
    aluno?: {
      id: number;
      nome: string;
      nomeSocial?: string | null;
      matricula?: string | null;
      cpf?: string | null;
    } | null;
    matricula?: {
      id: number;
      semestre?: number | null;
      status?: string | null;
      curso?: {
        id: number;
        nome: string;
      } | null;
    } | null;
    template?: {
      id: number;
      nome: string;
    } | null;
    instituicao?: {
      id: number;
      nome?: string | null;
      nomeFantasia?: string | null;
      cnpj?: string | null;
    } | null;
  };
};

function formatarData(data?: string) {
  if (!data) return "-";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR");
}

function labelTipo(tipo?: string) {
  switch (tipo) {
    case "CONTRATO":
      return "Contrato";
    case "DECLARACAO":
      return "Declaração";
    case "RECIBO":
      return "Recibo";
    case "COMPROVANTE":
      return "Comprovante";
    case "TRANCAMENTO":
      return "Trancamento";
    case "COMPARECIMENTO":
      return "Comparecimento";
    case "HISTORICO":
      return "Histórico";
    default:
      return tipo || "-";
  }
}

export default function AdminValidacoesPage() {
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ValidacaoResponse | null>(null);
  const [erro, setErro] = useState("");

  const nomeExibicao = useMemo(() => {
    return (
      resultado?.documento?.aluno?.nomeSocial?.trim() ||
      resultado?.documento?.aluno?.nome ||
      "-"
    );
  }, [resultado]);

  const nomeInstituicao = useMemo(() => {
  return resultado?.documento?.instituicao?.nome || "Instituição";
}, [resultado]);

  async function validarCodigo() {
    const codigoLimpo = codigo.trim();

    if (!codigoLimpo) {
      setErro("Digite um código para validar.");
      setResultado(null);
      return;
    }

    try {
      setLoading(true);
      setErro("");

      const res = await fetch(
        `/api/validar-documento?codigo=${encodeURIComponent(codigoLimpo)}`,
        {
          cache: "no-store",
        }
      );

      const data = (await res.json()) as ValidacaoResponse;
      setResultado(data);

      if (!res.ok && !data?.valido) {
        setErro(data?.error || data?.mensagem || "Não foi possível validar.");
      }
    } catch (e) {
      console.error(e);
      setErro("Erro ao consultar a validação do documento.");
      setResultado(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Validação administrativa
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">
              Validar documento
            </h1>
            <p className="mt-4 max-w-2xl text-slate-600">
              Consulte a autenticidade de contratos e documentos emitidos pelo
              sistema digitando o código de validação.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Uso interno do administrativo
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Código de validação
            </label>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") validarCodigo();
              }}
              placeholder="Ex.: PHANYX-1774450530482"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={validarCodigo}
              disabled={loading}
              className="rounded-2xl bg-slate-900 px-6 py-3 font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Validando..." : "Validar documento"}
            </button>
          </div>
        </div>

        {erro ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        ) : null}
      </div>

      {resultado ? (
        <>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Resultado da consulta
                </p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">
                  {resultado.valido
                    ? "Documento localizado"
                    : "Documento inválido ou não encontrado"}
                </h2>
                <p className="mt-3 text-slate-600">
                  {resultado.mensagem ||
                    "Consulte os detalhes abaixo para conferência."}
                </p>
              </div>

              <div
                className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold ${
                  resultado.valido
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-red-300 bg-red-50 text-red-700"
                }`}
              >
                {resultado.valido ? "✔ Documento válido" : "✖ Não localizado"}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Código consultado
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {resultado.codigo || codigo}
              </p>
            </div>
          </div>

          {resultado.valido && resultado.documento ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  Dados do documento
                </h3>

                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <p>
                    <strong>Título:</strong> {resultado.documento.titulo}
                  </p>
                  <p>
                    <strong>Tipo:</strong>{" "}
                    {labelTipo(resultado.documento.tipo)}
                  </p>
                  <p>
                    <strong>Status:</strong> {resultado.documento.status || "-"}
                  </p>
                  <p>
                    <strong>Emitido em:</strong>{" "}
                    {formatarData(resultado.documento.criadoEm)}
                  </p>
                  <p>
                    <strong>Atualizado em:</strong>{" "}
                    {formatarData(resultado.documento.atualizadoEm)}
                  </p>
                  <p>
                    <strong>Template:</strong>{" "}
                    {resultado.documento.template?.nome || "-"}
                  </p>
                  <p>
                    <strong>Exige assinatura:</strong>{" "}
                    {resultado.documento.exigeAssinatura ? "Sim" : "Não"}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  Dados vinculados
                </h3>

                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <p>
                    <strong>Aluno:</strong> {nomeExibicao}
                  </p>
                  <p>
                    <strong>Matrícula:</strong>{" "}
                    {resultado.documento.aluno?.matricula || "-"}
                  </p>
                  <p>
                    <strong>CPF:</strong>{" "}
                    {resultado.documento.aluno?.cpf || "-"}
                  </p>
                  <p>
                    <strong>Curso:</strong>{" "}
                    {resultado.documento.matricula?.curso?.nome || "-"}
                  </p>
                  <p>
                    <strong>Semestre:</strong>{" "}
                    {resultado.documento.matricula?.semestre ?? "-"}
                  </p>
                  <p>
                    <strong>Status da matrícula:</strong>{" "}
                    {resultado.documento.matricula?.status || "-"}
                  </p>
                  <p>
                    <strong>Instituição:</strong> {nomeInstituicao}
                  </p>
                  <p>
                    <strong>CNPJ:</strong>{" "}
                    {resultado.documento.instituicao?.cnpj || "-"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Nenhum documento válido encontrado
              </h3>
              <p className="mt-3 text-sm text-slate-600">
                Verifique se o código foi digitado corretamente e se o documento
                foi salvo na base antes da validação.
              </p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
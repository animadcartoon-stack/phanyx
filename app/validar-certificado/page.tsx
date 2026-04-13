"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type CertificadoValidado = {
  codigo: string;
  emitidoEm: string;
  aluno: { nome: string };
  disciplina: { nome: string };
  instituicao: { nome: string };
};

function ValidarCertificadoConteudo() {
  const searchParams = useSearchParams();
  const codigo = searchParams.get("codigo") || "";

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [certificado, setCertificado] = useState<CertificadoValidado | null>(null);

  useEffect(() => {
    async function carregar() {
      if (!codigo) {
        setErro("Código não informado.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/validar-certificado?codigo=${encodeURIComponent(codigo)}`
        );
        const data = await res.json();

        if (!res.ok || !data?.valido) {
          setErro(data?.error || "Certificado não encontrado.");
          return;
        }

        setCertificado(data.certificado);
      } catch {
        setErro("Erro ao validar certificado.");
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [codigo]);

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-4 text-3xl font-bold text-slate-900">
        Validação de Certificado
      </h1>

      {loading && <p>Validando...</p>}

      {!loading && erro && <div className="text-red-600">{erro}</div>}

      {!loading && certificado && (
        <>
          <div className="mb-4 font-bold text-green-600">
            Certificado válido ✅
          </div>

          <div className="space-y-2">
            <p>
              <strong>Código:</strong> {certificado.codigo}
            </p>
            <p>
              <strong>Aluno:</strong> {certificado.aluno.nome}
            </p>
            <p>
              <strong>Disciplina:</strong> {certificado.disciplina.nome}
            </p>
            <p>
              <strong>Instituição:</strong> {certificado.instituicao.nome}
            </p>
            <p>
              <strong>Emitido em:</strong>{" "}
              {new Date(certificado.emitidoEm).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default function ValidarCertificadoPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <Suspense fallback={<div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">Carregando validação...</div>}>
        <ValidarCertificadoConteudo />
      </Suspense>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";

type CertificadoItem = {
  id: number;
  codigo: string;
  emitidoEm: string;
  disciplina: {
    id: number;
    nome: string;
  };
};

export default function AlunoCertificadosPage() {
  const [loading, setLoading] = useState(true);
  const [certificados, setCertificados] = useState<CertificadoItem[]>([]);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch("/api/aluno/certificados", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          setCertificados([]);
          return;
        }

        setCertificados(data?.certificados || []);
      } catch {
        setCertificados([]);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Meus Certificados</h1>
          <p className="mt-2 text-slate-600">
            Aqui ficam os certificados gerados automaticamente após sua aprovação.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            Carregando certificados...
          </div>
        ) : certificados.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            Você ainda não possui certificados disponíveis.
          </div>
        ) : (
          <div className="grid gap-4">
            {certificados.map((certificado) => (
              <div
                key={certificado.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {certificado.disciplina?.nome || "Disciplina"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Código: {certificado.codigo}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Emitido em:{" "}
                      {new Date(certificado.emitidoEm).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`/api/aluno/certificados/${certificado.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                      Baixar certificado
                    </a>

                    <a
                      href={`/validar-certificado?codigo=${encodeURIComponent(certificado.codigo)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Validar
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
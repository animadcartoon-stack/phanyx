"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type RespostaItem = {
  id: number;
  nota?: number | null;
  respostaTexto?: string | null;
  alternativa?: {
    id: number;
    texto: string;
  } | null;
  questao: {
    id: number;
    pergunta: string;
    tipo?: string;
  };
};

type TentativaDetalhe = {
  id: number;
  aluno?: {
    nome?: string | null;
    email?: string | null;
  };
  prova?: {
    titulo?: string | null;
  };
  respostas: RespostaItem[];
};

export default function VerTentativaPage() {
  const params = useParams<{ tentativaId: string }>();
  const router = useRouter();
  const tentativaId = params.tentativaId;

  const [tentativa, setTentativa] = useState<TentativaDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro("");

        const res = await fetch(`/api/professor/tentativas/${tentativaId}`, {
          credentials: "include",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Erro ao carregar tentativa");
        }

        setTentativa(json);
      } catch (e: any) {
        setErro(e?.message || "Erro ao carregar tentativa");
        setTentativa(null);
      } finally {
        setLoading(false);
      }
    }

    if (tentativaId) {
      carregar();
    }
  }, [tentativaId]);

  if (loading) {
    return <div className="p-8 text-gray-900">Carregando respostas...</div>;
  }

  if (erro) {
    return (
      <div className="p-8 text-gray-900 space-y-4">
        <p className="text-red-600 font-semibold">Erro</p>
        <p>{erro}</p>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline"
        >
          ← Voltar
        </button>
      </div>
    );
  }

  if (!tentativa) {
    return <div className="p-8 text-gray-900">Tentativa não encontrada.</div>;
  }

  return (
    <div className="p-8 space-y-6 text-gray-900">
      <div className="space-y-2">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline"
        >
          ← Voltar
        </button>

        <h1 className="text-2xl font-bold">📄 Respostas do aluno</h1>

        <p className="text-gray-600">
          Aluno:{" "}
          <strong>
            {tentativa.aluno?.nome || tentativa.aluno?.email || "Aluno"}
          </strong>
        </p>

        <p className="text-gray-600">
          Prova: <strong>{tentativa.prova?.titulo || "-"}</strong>
        </p>
      </div>

      <div className="space-y-4">
        {tentativa.respostas?.length === 0 && (
          <p className="text-gray-600">Nenhuma resposta encontrada.</p>
        )}

        {tentativa.respostas?.map((r, i) => (
          <div key={r.id} className="bg-white border rounded-xl p-6 space-y-3">
            <p className="text-sm text-gray-500">Questão {i + 1}</p>

            <p className="font-semibold">{r.questao?.pergunta}</p>

            <div>
              <p className="text-sm text-gray-500">Resposta do aluno</p>
              <p className="mt-1">
                {r.alternativa?.texto || r.respostaTexto || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Nota</p>
              <p className="mt-1 font-semibold">{r.nota ?? 0}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
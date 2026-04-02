"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAluno } from "@/app/context/AlunoContext";

type AulaItem = {
  id: number;
  titulo: string;
  videoUrl?: string | null;
};

type DisciplinaComAulas = {
  id: number;
  aulas: AulaItem[];
};

type StatusMatriculaResponse = {
  status: string | null;
  acessoAulasLiberado: boolean;
};

export default function AulaPage() {
  const params = useParams();
  const disciplinaId = Number(params.disciplinaId);
  const aulaId = Number(params.aulaId);

  const {
    disciplinasMatriculadas,
    marcarAulaComoConcluida,
    aulaConcluida,
  } = useAluno();

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [acessoAulasLiberado, setAcessoAulasLiberado] = useState(false);
  const [statusMatricula, setStatusMatricula] = useState<string | null>(null);

  useEffect(() => {
    async function carregarStatusMatricula() {
      try {
        const res = await fetch("/api/aluno/status-matricula", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          setAcessoAulasLiberado(false);
          setStatusMatricula(null);
          return;
        }

        const data: StatusMatriculaResponse = await res.json();
        setAcessoAulasLiberado(Boolean(data.acessoAulasLiberado));
        setStatusMatricula(data.status);
      } catch (error) {
        console.error("Erro ao carregar status da matrícula:", error);
        setAcessoAulasLiberado(false);
        setStatusMatricula(null);
      } finally {
        setLoadingStatus(false);
      }
    }

    carregarStatusMatricula();
  }, []);

  const disciplina = disciplinasMatriculadas.find(
  (d) => Number(d.id) === disciplinaId
) as unknown as DisciplinaComAulas | undefined;

if (!disciplina) {
  return <div className="p-8">Disciplina não encontrada.</div>;
}

const aula = disciplina.aulas.find((a) => Number(a.id) === aulaId);

  if (!aula) {
    return <div className="p-8">Aula não encontrada.</div>;
  }

  if (loadingStatus) {
    return <div className="p-8">Carregando status da matrícula...</div>;
  }

  if (!acessoAulasLiberado) {
    return (
      <div className="max-w-3xl rounded-2xl border border-orange-200 bg-orange-50 p-6">
        <h1 className="text-2xl font-bold text-orange-900">
          Acesso à aula indisponível
        </h1>

        <p className="mt-3 text-orange-800">
          Sua matrícula está com status{" "}
          <strong>{statusMatricula ?? "indisponível"}</strong>.
        </p>

        <p className="mt-2 text-orange-800">
          Por isso, o acesso às aulas está temporariamente bloqueado.
          Você ainda pode acessar sua área do aluno, acompanhar seu status e
          consultar informações acadêmicas.
        </p>

        <p className="mt-2 text-orange-800">
          Para regularização, entre em contato com a secretaria.
        </p>
      </div>
    );
  }

  const concluida = aulaConcluida(disciplinaId, aulaId);

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">🎥 {aula.titulo}</h1>

      <div className="aspect-video">
        <iframe
          src={aula.videoUrl}
          className="w-full h-full rounded-lg"
          allowFullScreen
        />
      </div>

      {!concluida && (
        <button
          onClick={async () => {
            try {
              await fetch("/api/aluno/progresso", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  alunoEmail: "aluno@ibe.com",
                  disciplinaId,
                  aulaId,
                }),
              });

              marcarAulaComoConcluida({
  disciplinaId,
  aulaId,
});
            } catch (error) {
              console.error("Erro ao salvar progresso", error);
            }
          }}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Marcar como concluída
        </button>
      )}

      {concluida && (
        <div className="text-green-600 font-semibold">✅ Aula concluída</div>
      )}
    </div>
  );
}
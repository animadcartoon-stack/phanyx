"use client";

import { useParams } from "next/navigation";
import { useAluno } from "@/app/context/AlunoContext";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";

export default function AtividadesAlunoPage() {
  const { disciplinaId } = useParams();
  const id = String(disciplinaId);

  const { registrarRespostaAtividade } = useAluno();
  const { user } = useAuth();

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [atividadeSelecionada, setAtividadeSelecionada] =
    useState<string | null>(null);

  function enviarResposta(atividadeId: string) {
    if (!arquivo || !user) return;

    registrarRespostaAtividade({
      atividadeId,
      disciplinaId: Number(id),
      alunoEmail: user.email,
      arquivoNome: arquivo.name,
    });

    setArquivo(null);
    setAtividadeSelecionada(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Atividades da disciplina
      </h1>

      <p className="text-gray-600">
        Nenhuma atividade disponível.
      </p>
    </div>
  );
}
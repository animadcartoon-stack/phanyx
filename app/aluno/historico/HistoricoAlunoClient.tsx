"use client";

import { useAluno } from "@/app/context/AlunoContext";

import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";

export default function HistoricoAlunoClient() {

const [historicoAcademico, setHistoricoAcademico] = useState("");
const [carregandoHistorico, setCarregandoHistorico] = useState(false);

const [modalErroHistorico, setModalErroHistorico] = useState("");

async function gerarHistoricoAcademico() {
  try {
    setCarregandoHistorico(true);
    setModalErroHistorico("");

    const resposta = await fetch("/api/aluno/historico/pdf");

    if (!resposta.ok) {
      setModalErroHistorico(
        "Não foi possível gerar o histórico acadêmico agora. Verifique se existe um template de Histórico ativo."
      );
      return;
    }

    const blob = await resposta.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "historico-academico.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch {
    setModalErroHistorico(
      "Erro ao gerar o histórico acadêmico. Tente novamente em instantes."
    );
  } finally {
    setCarregandoHistorico(false);
  }
}

  const { notas } = useAluno();
  
  const router = useRouter();

  // 📊 Média geral
  const mediaGeral =
    notas.length > 0
      ? (
          notas.reduce((acc, nota) => acc + nota.nota, 0) /
          notas.length
        ).toFixed(1)
      : null;

  // 📈 Dados do gráfico
  const dadosGrafico = notas.map((nota) => {
  return {
    nome: `Disciplina ID ${nota.disciplinaId}`,
    nota: nota.nota,
  };
});

  return (
    <main className="p-8 space-y-6">

<div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
  <h2 className="text-2xl font-bold text-blue-500">
    Histórico Acadêmico Oficial
  </h2>

  <p className="mt-2 text-blue-300">
    Consulte e imprima seu histórico acadêmico atualizado.
  </p>

  <div className="mt-4 flex gap-3 flex-wrap">
    <button
      onClick={gerarHistoricoAcademico}
      disabled={carregandoHistorico}
      className="rounded-xl bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700"
    >
      {carregandoHistorico
        ? "Gerando..."
        : "Gerar histórico acadêmico"}
    </button>

    {historicoAcademico && (
      <button
        onClick={() => window.print()}
        className="rounded-xl bg-emerald-600 px-5 py-3 text-white font-semibold hover:bg-emerald-700"
      >
        Imprimir histórico
      </button>
    )}
  </div>

  {historicoAcademico && (
    <div className="mt-6 rounded-2xl border bg-white p-6 whitespace-pre-wrap">
      {historicoAcademico}
    </div>
  )}
</div>

      <h1 className="text-2xl font-bold">
        📚 Histórico de Provas
      </h1>

      {/* 📊 Média */}
      {mediaGeral && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-lg font-semibold text-blue-700">
            📊 Média Geral: {mediaGeral}
          </p>
        </div>
      )}

      {/* 📈 Gráfico */}
      {notas.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            📈 Desempenho por Disciplina
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dadosGrafico}>
              <XAxis dataKey="nome" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Line type="monotone" dataKey="nota" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 📋 Lista de provas */}
      {notas.map((nota) => {
        
        return (
          <div
            key={nota.disciplinaId}
            className="border rounded-lg p-6 bg-white space-y-2"
          >
            <h2 className="text-lg font-semibold">
              {`Disciplina ID ${nota.disciplinaId}`}
            </h2>

            <p>
              📊 Nota: <strong>{nota.nota}</strong>
            </p>

            <p
              className={`font-semibold ${
                nota.aprovado
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {nota.aprovado
                ? "Aprovado 🎉"
                : "Reprovado ❌"}
            </p>

            <p className="text-sm text-gray-600">
              📅 Data: {nota.data}
            </p>

            <p className="text-sm text-gray-600">
              ⏱ Tempo: {Math.floor(nota.tempo / 60)} min{" "}
              {nota.tempo % 60} seg
            </p>

            <button
              onClick={() =>
                router.push(
                  `/aluno/historico/${nota.disciplinaId}`
                )
              }
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Ver detalhes
            </button>
          </div>
        );
      })}

{modalErroHistorico && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4">
    <div className="w-full max-w-md rounded-3xl border border-blue-200 bg-white p-6 shadow-2xl">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
        Aviso PHANYX
      </p>

      <h2 className="mt-2 text-xl font-black text-slate-900">
        Histórico acadêmico
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {modalErroHistorico}
      </p>

      <button
        type="button"
        onClick={() => setModalErroHistorico("")}
        className="mt-6 w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
      >
        Entendi
      </button>
    </div>
  </div>
)}

    </main>
  );
}

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { Disciplina as PrismaDisciplina } from "@prisma/client";

type DisciplinaComCount = PrismaDisciplina & {
  _count?: { aulas: number };
  turma?: {
    id: number;
    nome: string;
    semestre?: string | null;
  };
  professor?: {
    id: number;
    nome: string;
  };
};

type AulaConcluida = { disciplinaId: number; aulaId: number };

type ProgressoAula = {
  disciplinaId: number;
  aulaId: number;
  concluida: boolean;
  tempoAssistidoSegundos: number;
  tempoMinimoSegundos: number;
  concluidaEm?: string | null;
};

type Nota = {
  disciplinaId: number;
  nota: number;
  aprovado: boolean;
  data: string;
  tempo: number;
  respostas: number[];
};

type Certificado = {
  disciplinaId: number;
  data: string;
};

type RespostaAtividade = {
  id: string;
  atividadeId: string;
  disciplinaId: number;
  alunoEmail: string;
  arquivoNome: string;
  nota?: number;
  aprovado?: boolean;
};

type MarcarAulaPayload = {
  disciplinaId: number;
  aulaId: number;
  tempoAssistidoSegundos?: number;
  tempoMinimoSegundos?: number;
};

type AlunoContextType = {
  aulasConcluidas: AulaConcluida[];

  marcarAulaComoConcluida: (payload: MarcarAulaPayload) => Promise<void>;
  aulaConcluida: (disciplinaId: number, aulaId: number) => boolean;
  progressoDisciplina: (disciplinaId: number, totalAulas: number) => number;

  respostasAtividades: RespostaAtividade[];
  enviarRespostaAtividade: (data: {
    atividadeId: string;
    disciplinaId: number;
    alunoEmail: string;
    arquivoNome: string;
  }) => void;
  registrarRespostaAtividade: (data: {
    atividadeId: string;
    disciplinaId: number;
    alunoEmail: string;
    arquivoNome: string;
  }) => void;

  mediaGeral: () => number;

  notas: Nota[];
  salvarNota: (
    disciplinaId: number,
    nota: number,
    aprovado: boolean,
    tempo: number,
    respostas: number[]
  ) => Promise<void>;

  certificados: Certificado[];
  gerarCertificado: (disciplinaId: number) => void;

  disciplinasMatriculadas: DisciplinaComCount[];
};

const AlunoContext = createContext<AlunoContextType | null>(null);

export function AlunoProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [aulasConcluidas, setAulasConcluidas] = useState<AulaConcluida[]>([]);
  const [progressoAulas, setProgressoAulas] = useState<ProgressoAula[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [respostasAtividades, setRespostasAtividades] = useState<RespostaAtividade[]>([]);
  const [disciplinasMatriculadas, setDisciplinasMatriculadas] = useState<DisciplinaComCount[]>([]);

  useEffect(() => {
    if (!user?.email) return;

    fetch("/api/aluno/disciplinas", { credentials: "include" })
      .then((res) => res.json())
      .then((matriculas) => {
        const disciplinas: DisciplinaComCount[] = (matriculas ?? [])
          .map((m: any) => ({
            ...m?.turma?.disciplina,
            turma: m?.turma,
            professor: m?.turma?.disciplina?.professor,
          }))
          .filter((d: any) => Boolean(d?.id));

        setDisciplinasMatriculadas(disciplinas);
      })
      .catch(() => setDisciplinasMatriculadas([]));

    fetch(`/api/aluno/notas?email=${encodeURIComponent(user.email)}`)
      .then((res) => res.json())
      .then((data) => {
        const lista: Nota[] = (data?.notas ?? []).map((n: any) => ({
          disciplinaId: Number(n.disciplinaId),
          nota: Number(n.nota ?? n.valor ?? 0),
          aprovado: Boolean(n.aprovado),
          data: String(n.data ?? ""),
          tempo: Number(n.tempo ?? 0),
          respostas: Array.isArray(n.respostas) ? n.respostas.map((x: any) => Number(x)) : [],
        }));
        setNotas(lista);
      })
      .catch(() => setNotas([]));

    fetch(`/api/aluno/progresso?email=${encodeURIComponent(user.email)}`)
      .then((res) => res.json())
      .then((data) => {
  const progressoSalvo = data?.progresso ?? [];

  const progressoFormatado: ProgressoAula[] = progressoSalvo.map((p: any) => ({
    disciplinaId: Number(p.disciplinaId),
    aulaId: Number(p.aulaId),
    concluida: Boolean(p.concluida),
    tempoAssistidoSegundos: Number(p.tempoAssistidoSegundos ?? 0),
    tempoMinimoSegundos: Number(p.tempoMinimoSegundos ?? 0),
    concluidaEm: p.concluidaEm ?? null,
  }));

  setProgressoAulas(progressoFormatado);

  // mantém compatibilidade com código antigo
  const aulasConcluidasCompat: AulaConcluida[] = progressoFormatado
    .filter((p) => p.concluida)
    .map((p) => ({
      disciplinaId: p.disciplinaId,
      aulaId: p.aulaId,
    }));

  setAulasConcluidas(aulasConcluidasCompat);
})
      .catch(() => setAulasConcluidas([]));
  }, [user?.email]);

  const mediaGeral = useMemo(() => {
    return () => {
      if (notas.length === 0) return 0;
      const soma = notas.reduce((acc, n) => acc + Number(n.nota || 0), 0);
      return Math.round(soma / notas.length);
    };
  }, [notas]);

  async function marcarAulaComoConcluida({
    disciplinaId,
    aulaId,
    tempoAssistidoSegundos = 0,
    tempoMinimoSegundos = 0,
  }: MarcarAulaPayload) {
    if (!user?.email) return;

    const res = await fetch("/api/aluno/progresso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
  aulaId,
  tempoAssistidoSegundos,
  tempoMinimoSegundos,
  concluir: true,
}),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || "Não foi possível concluir a aula.");
    }

    setAulasConcluidas((prev) => {
      setProgressoAulas((prev) => {
  const existente = prev.find((p) => p.aulaId === aulaId);

  if (existente) {
    return prev.map((p) =>
      p.aulaId === aulaId
        ? { ...p, concluida: true }
        : p
    );
  }

  return [
    ...prev,
    {
      disciplinaId,
      aulaId,
      concluida: true,
      tempoAssistidoSegundos,
      tempoMinimoSegundos,
      concluidaEm: new Date().toISOString(),
    },
  ];
});
      const jaExiste = prev.some((a) => a.disciplinaId === disciplinaId && a.aulaId === aulaId);
      if (jaExiste) return prev;
      return [...prev, { disciplinaId, aulaId }];
    });
  }

  function aulaConcluida(disciplinaId: number, aulaId: number) {
    return aulasConcluidas.some((a) => a.disciplinaId === disciplinaId && a.aulaId === aulaId);
  }

  function progressoDisciplina(disciplinaId: number, totalAulas: number) {
    const concluidas = aulasConcluidas.filter((a) => a.disciplinaId === disciplinaId).length;
    if (totalAulas === 0) return 0;
    return Math.round((concluidas / totalAulas) * 100);
  }

  async function salvarNota(
    disciplinaId: number,
    nota: number,
    aprovado: boolean,
    tempo: number,
    respostas: number[]
  ) {
    if (!user?.email) return;

    await fetch("/api/aluno/notas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        alunoEmail: user.email,
        disciplinaId,
        nota,
        aprovado,
        tempo,
        respostas,
      }),
    });

    setNotas((prev) => {
      const filtradas = prev.filter((n) => n.disciplinaId !== disciplinaId);
      return [
        ...filtradas,
        {
          disciplinaId,
          nota,
          aprovado,
          data: new Date().toLocaleDateString("pt-BR"),
          tempo,
          respostas,
        },
      ];
    });
  }

 async function gerarCertificado(disciplinaId: number) {
  try {
    await fetch("/api/aluno/certificados/gerar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ disciplinaId }),
    });

    setCertificados((prev) => {
      const jaExiste = prev.some((c) => c.disciplinaId === disciplinaId);
      if (jaExiste) return prev;

      return [
        ...prev,
        {
          disciplinaId,
          data: new Date().toLocaleDateString("pt-BR"),
        },
      ];
    });
  } catch (error) {
    console.error("Erro ao gerar certificado:", error);
  }
}

  function enviarRespostaAtividade(data: {
    atividadeId: string;
    disciplinaId: number;
    alunoEmail: string;
    arquivoNome: string;
  }) {
    const nova: RespostaAtividade = { id: Date.now().toString(), ...data };
    setRespostasAtividades((prev) => [...prev, nova]);
  }

  function registrarRespostaAtividade(data: {
    atividadeId: string;
    disciplinaId: number;
    alunoEmail: string;
    arquivoNome: string;
  }) {
    const nova: RespostaAtividade = { id: Date.now().toString(), ...data };
    setRespostasAtividades((prev) => [...prev, nova]);
  }

  return (
    <AlunoContext.Provider
      value={{
        aulasConcluidas,
        marcarAulaComoConcluida,
        aulaConcluida,
        progressoDisciplina,
        notas,
        salvarNota,
        certificados,
        gerarCertificado,
        disciplinasMatriculadas,
        respostasAtividades,
        enviarRespostaAtividade,
        registrarRespostaAtividade,
        mediaGeral,
      }}
    >
      {children}
    </AlunoContext.Provider>
  );
}

export function useAluno() {
  const context = useContext(AlunoContext);
  if (!context) throw new Error("useAluno deve ser usado dentro de AlunoProvider");
  return context;
}
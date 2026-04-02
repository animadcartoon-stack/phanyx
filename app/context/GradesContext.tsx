"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Nota = {
  alunoId: string;
  alunoNome: string;
  email: string;
  disciplina: string;
  nota: number;
  feedback: string;
};

type GradesContextType = {
  notas: Nota[];
  salvarNota: (nota: Nota) => void;
};

const GradesContext = createContext<GradesContextType | null>(null);

export function GradesProvider({ children }: { children: ReactNode }) {
  const [notas, setNotas] = useState<Nota[]>([]);

  function salvarNota(novaNota: Nota) {
    setNotas((prev) => {
      const filtradas = prev.filter(
        (n) =>
          !(
            n.alunoId === novaNota.alunoId &&
            n.disciplina === novaNota.disciplina
          )
      );

      return [...filtradas, novaNota];
    });
  }

  return (
    <GradesContext.Provider value={{ notas, salvarNota }}>
      {children}
    </GradesContext.Provider>
  );
}

export function useGrades() {
  const context = useContext(GradesContext);
  if (!context) {
    throw new Error("useGrades deve ser usado dentro de GradesProvider");
  }
  return context;
}

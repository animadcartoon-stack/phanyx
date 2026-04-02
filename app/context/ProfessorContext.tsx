"use client";

import { createContext, useContext, useState } from "react";
import { useEffect } from "react";

type Material = {
  id: string;
  nome: string;
  tipo: "arquivo" | "link";
  url: string;
};

type Aula = {
  id: string;
  titulo: string;
  video: string;
  materiais: Material[];
};

type Pergunta = {
  id: string;
  enunciado: string;
  alternativas: string[];
  correta: number;
};

type Prova = {
  perguntas: Pergunta[];
};

type Atividade = {
  id: string;
  titulo: string;
  descricao?: string | null;
  disciplinaId: string;
};

type Disciplina = {
  id: string;
  nome: string;
  descricao?: string | null;
  professorEmail: string;
  cargaHoraria: number;
  aulas: Aula[];
  atividades: Atividade[];
  prova?: Prova;
};

type Professor = {
  nome: string;
  email: string;
};

type Nota = {
  alunoEmail: string;
  disciplinaId: string;
  nota: number;
  aprovado: boolean;
};

type Trabalho = {
  id: string;
  alunoEmail: string;
  disciplinaId: string;
  titulo: string;
  arquivoNome: string;
  nota?: number;
  aprovado?: boolean;
};

type ProfessorContextType = {
  disciplinas: Disciplina[];
  professores: Professor[];
  matriculas: {
    alunoEmail: string;
    disciplinaId: string;
  }[];
  notas: Nota[];
  trabalhos: Trabalho[];
alunos: {
  nome: string;
  email: string;
}[];

criarAluno: (nome: string, email: string) => void;

 criarDisciplina: (
  nome: string,
  professorEmail: string,
  cargaHoraria: number,
  descricao?: string | null
) => string;

criarAtividade: (
  disciplinaId: string,
  titulo: string,
  descricao?: string | null
) => void;

  registrarTrabalho: (data: {
    alunoEmail: string;
    disciplinaId: string;
    titulo: string;
    arquivoNome: string;
  }) => void;

  corrigirTrabalho: (
    trabalhoId: string,
    nota: number,
    aprovado: boolean
  ) => void;

  adicionarAula: (
    disciplinaId: string,
    titulo: string,
    video: string
  ) => void;

  editarAula: (
    disciplinaId: string,
    aulaId: string,
    titulo: string,
    video: string
  ) => void;

  excluirAula: (
    disciplinaId: string,
    aulaId: string
  ) => void;

  adicionarMaterial: (
    disciplinaId: string,
    aulaId: string,
    material: Material
  ) => void;

  salvarProva: (
    disciplinaId: string,
    perguntas: Pergunta[]
  ) => void;

  registrarNota: (
    alunoEmail: string,
    disciplinaId: string,
    nota: number,
    aprovado: boolean
  ) => void;

  matricularAluno: (
    alunoEmail: string,
    disciplinaId: string
  ) => void;

  criarProfessor: (
    nome: string,
    email: string
  ) => void;
};

const ProfessorContext =
  createContext<ProfessorContextType | null>(null);

export function ProfessorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
 const [disciplinas, setDisciplinas] = useState<Disciplina[]>(() => {
  if (typeof window === "undefined") return [];

  const salvo = localStorage.getItem("disciplinas");
  return salvo ? JSON.parse(salvo) : [];
});
type Aluno = {
  nome: string;
  email: string;
};

const [alunos, setAlunos] = useState<{ nome: string; email: string }[]>(() => {
  if (typeof window === "undefined") return [];

  const salvo = localStorage.getItem("alunos");
  return salvo ? JSON.parse(salvo) : [];
});



  const [professores, setProfessores] = useState<Professor[]>([
    { nome: "Pr. João", email: "prof@ibe.com" },
  ]);
  const [matriculas, setMatriculas] = useState<
    { alunoEmail: string; disciplinaId: string }[]
  >([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
useEffect(() => {
  localStorage.setItem("disciplinas", JSON.stringify(disciplinas));
}, [disciplinas]);
useEffect(() => {
  localStorage.setItem("alunos", JSON.stringify(alunos));
}, [alunos]);

  function criarDisciplina(
  nome: string,
  professorEmail: string,
  cargaHoraria: number,
  descricao?: string | null
) {
  const id = Date.now().toString();

  setDisciplinas((prev) => [
    ...prev,
    {
      id,
      nome,
      descricao: descricao ?? null,
      professorEmail,
      cargaHoraria,
      aulas: [],
      atividades: [],
    },
  ]);

  return id;
}

function criarAluno(nome: string, email: string) {
  setAlunos((prev) => [...prev, { nome, email }]);
}

 function criarAtividade(
  disciplinaId: string,
  titulo: string,
  descricao?: string | null
) {
  setDisciplinas((prev) =>
    prev.map((d) =>
      d.id === disciplinaId
        ? {
            ...d,
            atividades: [
              ...d.atividades,
              {
                id: Date.now().toString(),
                titulo,
                descricao: descricao ?? null,
                disciplinaId,
              },
            ],
          }
        : d
    )
  );
}

  function registrarTrabalho(data: {
    alunoEmail: string;
    disciplinaId: string;
    titulo: string;
    arquivoNome: string;
  }) {
    const novo: Trabalho = {
      id: Date.now().toString(),
      ...data,
    };

    setTrabalhos((prev) => [...prev, novo]);
  }

  function corrigirTrabalho(
    trabalhoId: string,
    nota: number,
    aprovado: boolean
  ) {
    setTrabalhos((prev) =>
      prev.map((t) =>
        t.id === trabalhoId
          ? { ...t, nota, aprovado }
          : t
      )
    );
  }

  function criarProfessor(nome: string, email: string) {
    setProfessores((prev) => [...prev, { nome, email }]);
  }

  function registrarNota(
    alunoEmail: string,
    disciplinaId: string,
    nota: number,
    aprovado: boolean
  ) {
    setNotas((prev) => [
      ...prev,
      { alunoEmail, disciplinaId, nota, aprovado },
    ]);
  }

  function matricularAluno(
    alunoEmail: string,
    disciplinaId: string
  ) {
    setMatriculas((prev) => {
      const jaExiste = prev.some(
        (m) =>
          m.alunoEmail === alunoEmail &&
          m.disciplinaId === disciplinaId
      );
      if (jaExiste) return prev;
      return [...prev, { alunoEmail, disciplinaId }];
    });
  }

  function adicionarAula(
    disciplinaId: string,
    titulo: string,
    video: string
  ) {
    setDisciplinas((prev) =>
      prev.map((d) =>
        d.id === disciplinaId
          ? {
              ...d,
              aulas: [
                ...d.aulas,
                {
                  id: Date.now().toString(),
                  titulo,
                  video,
                  materiais: [],
                },
              ],
            }
          : d
      )
    );
  }

  function editarAula(
    disciplinaId: string,
    aulaId: string,
    titulo: string,
    video: string
  ) {
    setDisciplinas((prev) =>
      prev.map((d) =>
        d.id === disciplinaId
          ? {
              ...d,
              aulas: d.aulas.map((a) =>
                a.id === aulaId
                  ? { ...a, titulo, video }
                  : a
              ),
            }
          : d
      )
    );
  }

  function excluirAula(
    disciplinaId: string,
    aulaId: string
  ) {
    setDisciplinas((prev) =>
      prev.map((d) =>
        d.id === disciplinaId
          ? {
              ...d,
              aulas: d.aulas.filter(
                (a) => a.id !== aulaId
              ),
            }
          : d
      )
    );
  }

  function adicionarMaterial(
    disciplinaId: string,
    aulaId: string,
    material: Material
  ) {
    setDisciplinas((prev) =>
      prev.map((d) =>
        d.id === disciplinaId
          ? {
              ...d,
              aulas: d.aulas.map((a) =>
                a.id === aulaId
                  ? {
                      ...a,
                      materiais: [
                        ...a.materiais,
                        material,
                      ],
                    }
                  : a
              ),
            }
          : d
      )
    );
  }

  function salvarProva(
    disciplinaId: string,
    perguntas: Pergunta[]
  ) {
    setDisciplinas((prev) =>
      prev.map((d) =>
        d.id === disciplinaId
          ? { ...d, prova: { perguntas } }
          : d
      )
    );
  }

  return (
    <ProfessorContext.Provider
    
    value={{
  disciplinas,
  professores,
  alunos,            
  matriculas,
  notas,
  trabalhos,
  criarDisciplina,
  criarAtividade,
  registrarTrabalho,
  corrigirTrabalho,
  adicionarAula,
  editarAula,
  excluirAula,
  adicionarMaterial,
  salvarProva,
  registrarNota,
  matricularAluno,
  criarProfessor,
  criarAluno,
}}

    >
      {children}
    </ProfessorContext.Provider>
    
  );
}

export function useProfessor() {
  const context = useContext(ProfessorContext);
  if (!context) {
    throw new Error(
      "useProfessor must be used within ProfessorProvider"
      
    );
  }
  return context;
}
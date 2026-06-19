"use client";

import { useEffect, useMemo, useState } from "react";

type PessoaOpcao = {
  id: number;
  userId: number;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  matricula?: string | null;
  setor?: string | null;
  role?: string | null;
};

type TurmaOpcao = {
  id: number;
  nome: string;
  semestre?: string | null;
  periodoLetivo?: string | null;
};

type CursoOpcao = {
  id: number;
  nome: string;
  codigo?: string | null;
};

type OpcoesReuniao = {
  setores: string[];
  funcionarios: PessoaOpcao[];
  professores: PessoaOpcao[];
  alunos: PessoaOpcao[];
  turmas: TurmaOpcao[];
  cursos: CursoOpcao[];
};

type Reuniao = {
  id: number;
  titulo: string;
  descricao?: string | null;
  link: string;
  dataHora: string;
  publicoTipo: string;
  status: string;
  setor?: string | null;
  participantes?: { id: number }[];
  turma?: { nome: string } | null;
  curso?: { nome: string } | null;
};

function normalizarTexto(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/y/g, "i")
    .trim();
}

const publicoLabel: Record<string, string> = {
  SETOR: "Setor",
  TODA_EQUIPE: "Toda equipe",
  INDIVIDUAL: "Individual",
  TURMA: "Turma",
  CURSO: "Curso",
  TODOS_ALUNOS: "Todos os alunos matriculados",
};

export default function ProfessorReunioesClient() {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [link, setLink] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [publicoTipo, setPublicoTipo] = useState("TURMA");

  const [setor, setSetor] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [buscaPessoa, setBuscaPessoa] = useState("");

  const [participantesUserIds, setParticipantesUserIds] = useState<number[]>([]);
  const [participantesAlunoIds, setParticipantesAlunoIds] = useState<number[]>([]);

  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [opcoes, setOpcoes] = useState<OpcoesReuniao>({
    setores: [],
    funcionarios: [],
    professores: [],
    alunos: [],
    turmas: [],
    cursos: [],
  });

  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const pessoasIndividuais = useMemo(() => {
    const mapa = new Map<string, PessoaOpcao>();

    [...opcoes.funcionarios, ...opcoes.professores].forEach((pessoa) => {
      mapa.set(`user-${pessoa.userId}`, pessoa);
    });

    opcoes.alunos.forEach((aluno) => {
      mapa.set(`aluno-${aluno.id}`, aluno);
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR")
    );
  }, [opcoes]);

  const pessoasFiltradas = useMemo(() => {
    const termo = normalizarTexto(buscaPessoa);

    if (!termo) return pessoasIndividuais.slice(0, 30);

    return pessoasIndividuais
      .filter((pessoa) => {
        const nome = normalizarTexto(pessoa.nome || "");
        const email = normalizarTexto(pessoa.email || "");
        const matricula = normalizarTexto(pessoa.matricula || "");
        const setorPessoa = normalizarTexto(pessoa.setor || "");

        return (
          nome.includes(termo) ||
          email.includes(termo) ||
          matricula.includes(termo) ||
          setorPessoa.includes(termo)
        );
      })
      .slice(0, 40);
  }, [buscaPessoa, pessoasIndividuais]);

  const participantesSelecionados = useMemo(() => {
    return pessoasIndividuais.filter((pessoa) => {
      if (pessoa.role === "ALUNO") return participantesAlunoIds.includes(pessoa.id);
      return participantesUserIds.includes(pessoa.userId);
    });
  }, [pessoasIndividuais, participantesUserIds, participantesAlunoIds]);

  function limparCamposPublico() {
    setSetor("");
    setTurmaId("");
    setCursoId("");
    setBuscaPessoa("");
    setParticipantesUserIds([]);
    setParticipantesAlunoIds([]);
  }

  function pessoaEstaSelecionada(pessoa: PessoaOpcao) {
    if (pessoa.role === "ALUNO") return participantesAlunoIds.includes(pessoa.id);
    return participantesUserIds.includes(pessoa.userId);
  }

  function alternarPessoa(pessoa: PessoaOpcao) {
    if (pessoa.role === "ALUNO") {
      setParticipantesAlunoIds((atuais) =>
        atuais.includes(pessoa.id)
          ? atuais.filter((id) => id !== pessoa.id)
          : [...atuais, pessoa.id]
      );
      return;
    }

    setParticipantesUserIds((atuais) =>
      atuais.includes(pessoa.userId)
        ? atuais.filter((id) => id !== pessoa.userId)
        : [...atuais, pessoa.userId]
    );
  }

  async function carregarTudo() {
    const [resReunioes, resOpcoes] = await Promise.all([
      fetch("/api/reunioes", { cache: "no-store" }),
      fetch("/api/reunioes/opcoes", { cache: "no-store" }),
    ]);

    const dataReunioes = await resReunioes.json();
    const dataOpcoes = await resOpcoes.json();

    setReunioes(Array.isArray(dataReunioes) ? dataReunioes : []);

    if (resOpcoes.ok) {
      setOpcoes({
        setores: Array.isArray(dataOpcoes.setores) ? dataOpcoes.setores : [],
        funcionarios: Array.isArray(dataOpcoes.funcionarios) ? dataOpcoes.funcionarios : [],
        professores: Array.isArray(dataOpcoes.professores) ? dataOpcoes.professores : [],
        alunos: Array.isArray(dataOpcoes.alunos) ? dataOpcoes.alunos : [],
        turmas: Array.isArray(dataOpcoes.turmas) ? dataOpcoes.turmas : [],
        cursos: Array.isArray(dataOpcoes.cursos) ? dataOpcoes.cursos : [],
      });
    }
  }

  async function criarReuniao() {
    try {
      setLoading(true);
      setMensagem("");
      setErro("");

      const res = await fetch("/api/reunioes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          descricao,
          link,
          dataHora,
          publicoTipo,
          setor: publicoTipo === "SETOR" ? setor : null,
          turmaId: publicoTipo === "TURMA" ? Number(turmaId) : null,
          cursoId: publicoTipo === "CURSO" ? Number(cursoId) : null,
          participantesUserIds:
            publicoTipo === "INDIVIDUAL" ? participantesUserIds : [],
          participantesAlunoIds:
            publicoTipo === "INDIVIDUAL" ? participantesAlunoIds : [],
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Erro ao criar reunião.");

      setMensagem("Reunião criada com sucesso.");
      setTitulo("");
      setDescricao("");
      setLink("");
      setDataHora("");
      setPublicoTipo("TURMA");
      limparCamposPublico();

      await carregarTudo();
    } catch (error: any) {
      setErro(error?.message || "Erro ao criar reunião.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="professor-reunioes-fix">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          📅 Reuniões
        </h1>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
  Agende reuniões por setor, equipe, participante individual, turma, curso ou todos os alunos.
</p>
      </div>

      {mensagem && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {erro}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md phanyx-theme-card">
        <h2 className="phanyx-reunioes-titulo mb-4 text-lg font-semibold">
  Nova reunião
</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />

          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Link da reunião"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />

          <input
            type="datetime-local"
            value={dataHora}
            onChange={(e) => setDataHora(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />

          <select
            value={publicoTipo}
            onChange={(e) => {
              setPublicoTipo(e.target.value);
              limparCamposPublico();
            }}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          >
            <option value="SETOR">Setor</option>
<option value="TODA_EQUIPE">Toda equipe</option>
<option value="INDIVIDUAL">Individual</option>
<option value="TURMA">Turma</option>
<option value="CURSO">Curso</option>
<option value="TODOS_ALUNOS">Todos os alunos matriculados</option>
          </select>

          {publicoTipo === "SETOR" && (
            <select
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              className="md:col-span-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Selecione o setor</option>
              {opcoes.setores.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          )}

          {publicoTipo === "TURMA" && (
            <select
              value={turmaId}
              onChange={(e) => setTurmaId(e.target.value)}
              className="md:col-span-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Selecione a turma</option>
              {opcoes.turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.nome}
                  {turma.periodoLetivo ? ` • ${turma.periodoLetivo}` : ""}
                  {turma.semestre ? ` • ${turma.semestre}` : ""}
                </option>
              ))}
            </select>
          )}

          {publicoTipo === "CURSO" && (
            <select
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value)}
              className="md:col-span-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Selecione o curso</option>
              {opcoes.cursos.map((curso) => (
                <option key={curso.id} value={curso.id}>
                  {curso.nome}
                  {curso.codigo ? ` • ${curso.codigo}` : ""}
                </option>
              ))}
            </select>
          )}

          {publicoTipo === "INDIVIDUAL" && (
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Selecione os participantes
              </label>

              <input
                value={buscaPessoa}
                onChange={(e) => setBuscaPessoa(e.target.value)}
                placeholder="Buscar por nome, matrícula, email ou setor"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />

              <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                {pessoasFiltradas.map((pessoa) => {
                  const selecionado = pessoaEstaSelecionada(pessoa);

                  return (
                    <button
                      key={`${pessoa.role}-${pessoa.id}-${pessoa.userId}`}
                      type="button"
                      onClick={() => alternarPessoa(pessoa)}
                      className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm transition last:border-b-0 dark:border-slate-800 ${
                        selecionado
                          ? "bg-blue-600 text-white"
                          : "text-slate-800 hover:bg-blue-50 dark:text-white dark:hover:bg-slate-800"
                      }`}
                    >
                      <span>
                        <span className="block font-semibold">{pessoa.nome}</span>
                        <span className={`block text-xs ${selecionado ? "text-blue-100" : "text-blue-500"}`}>
                          {pessoa.role}
                          {pessoa.matricula ? ` • ${pessoa.matricula}` : ""}
                          {pessoa.setor ? ` • ${pessoa.setor}` : ""}
                          {pessoa.email ? ` • ${pessoa.email}` : ""}
                        </span>
                      </span>

                      <span className="text-xs font-bold">
                        {selecionado ? "Selecionado" : "Adicionar"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {participantesSelecionados.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {participantesSelecionados.map((pessoa) => (
                    <button
                      key={`sel-${pessoa.role}-${pessoa.id}-${pessoa.userId}`}
                      type="button"
                      onClick={() => alternarPessoa(pessoa)}
                      className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
                    >
                      {pessoa.nome} ✕
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição"
            className="
md:col-span-2
min-h-28
rounded-2xl
border-2
border-slate-300
bg-white
px-4
py-3
text-slate-900
shadow-sm
transition-all
outline-none

hover:border-blue-400

focus:border-blue-600
focus:ring-4
focus:ring-blue-100

dark:border-slate-600
dark:bg-slate-950
dark:text-white
dark:focus:ring-blue-900/30
"
          />
        </div>

        <button
          onClick={criarReuniao}
          disabled={loading}
          className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-white disabled:bg-slate-400"
        >
          {loading ? "Criando..." : "Criar reunião"}
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="phanyx-reunioes-titulo mb-4 text-lg font-semibold">
  Reuniões agendadas
</h2>

        <div className="space-y-3">
          {reunioes.map((reuniao) => (
            <div key={reuniao.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {reuniao.titulo}
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-300">
                {new Date(reuniao.dataHora).toLocaleString("pt-BR")}
              </p>

              <p className="mt-1 text-xs text-blue-500">
                {publicoLabel[reuniao.publicoTipo] || reuniao.publicoTipo}
                {reuniao.setor ? ` • ${reuniao.setor}` : ""}
                {reuniao.turma?.nome ? ` • ${reuniao.turma.nome}` : ""}
                {reuniao.curso?.nome ? ` • ${reuniao.curso.nome}` : ""}
                {" • "}
                {reuniao.participantes?.length || 0} participante(s)
              </p>

              <a
                href={reuniao.link}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block rounded-xl bg-blue-600 px-4 py-2 text-white"
              >
                Entrar na reunião
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
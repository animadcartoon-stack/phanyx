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

const publicoLabel: Record<string, string> = {
  TODA_EQUIPE: "Toda equipe administrativa",
  TODOS_ALUNOS: "Todos os alunos matriculados",
  SETOR: "Setor",
  TURMA: "Turma",
  CURSO: "Curso",
  INDIVIDUAL: "Individual",
};

function normalizarTexto(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/y/g, "i")
    .trim();
}

export default function AdminReunioesPage() {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [link, setLink] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [publicoTipo, setPublicoTipo] = useState("TODA_EQUIPE");

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
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const [
    reuniaoParaExcluir,
    setReuniaoParaExcluir,
  ] = useState<Reuniao | null>(null);

  const [
    excluindoId,
    setExcluindoId,
  ] = useState<number | null>(null);

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
      .sort((a, b) => {
        const nomeA = normalizarTexto(a.nome || "");
        const nomeB = normalizarTexto(b.nome || "");

        const aComeca = nomeA.startsWith(termo);
        const bComeca = nomeB.startsWith(termo);

        if (aComeca && !bComeca) return -1;
        if (!aComeca && bComeca) return 1;

        return nomeA.localeCompare(nomeB, "pt-BR");
      })
      .slice(0, 40);
  }, [buscaPessoa, pessoasIndividuais]);

  const participantesSelecionados = useMemo(() => {
    return pessoasIndividuais.filter((pessoa) => {
      if (pessoa.role === "ALUNO") {
        return participantesAlunoIds.includes(pessoa.id);
      }

      return participantesUserIds.includes(pessoa.userId);
    });
  }, [pessoasIndividuais, participantesUserIds, participantesAlunoIds]);

  async function carregarReunioes() {
    const res = await fetch("/api/reunioes", { cache: "no-store" });
    const data = await res.json();
    setReunioes(Array.isArray(data) ? data : []);
  }

  async function carregarOpcoes() {
    try {
      setCarregandoOpcoes(true);
      const res = await fetch("/api/reunioes/opcoes", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar opções.");
      }

      setOpcoes({
        setores: Array.isArray(data.setores) ? data.setores : [],
        funcionarios: Array.isArray(data.funcionarios) ? data.funcionarios : [],
        professores: Array.isArray(data.professores) ? data.professores : [],
        alunos: Array.isArray(data.alunos) ? data.alunos : [],
        turmas: Array.isArray(data.turmas) ? data.turmas : [],
        cursos: Array.isArray(data.cursos) ? data.cursos : [],
      });
    } catch (error: any) {
      setErro(error?.message || "Erro ao carregar opções.");
    } finally {
      setCarregandoOpcoes(false);
    }
  }

  function limparCamposPublico() {
    setSetor("");
    setTurmaId("");
    setCursoId("");
    setBuscaPessoa("");
    setParticipantesUserIds([]);
    setParticipantesAlunoIds([]);
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

  function pessoaEstaSelecionada(pessoa: PessoaOpcao) {
    if (pessoa.role === "ALUNO") {
      return participantesAlunoIds.includes(pessoa.id);
    }

    return participantesUserIds.includes(pessoa.userId);
  }

  async function criarReuniao() {
    try {
      setLoading(true);
      setMensagem("");
      setErro("");

      const payload = {
        titulo,
        descricao,
        link,
        dataHora: dataHora
          ? new Date(dataHora).toISOString()
          : "",
        publicoTipo,
        setor: publicoTipo === "SETOR" ? setor : null,
        turmaId: publicoTipo === "TURMA" ? Number(turmaId) : null,
        cursoId: publicoTipo === "CURSO" ? Number(cursoId) : null,
        participantesUserIds:
          publicoTipo === "INDIVIDUAL" ? participantesUserIds : [],
        participantesAlunoIds:
          publicoTipo === "INDIVIDUAL" ? participantesAlunoIds : [],
      };

      const res = await fetch("/api/reunioes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao criar reunião.");
      }

      setMensagem("Reunião criada com sucesso e participantes vinculados.");
      setTitulo("");
      setDescricao("");
      setLink("");
      setDataHora("");
      setPublicoTipo("TODA_EQUIPE");
      limparCamposPublico();

      await carregarReunioes();
    } catch (error: any) {
      setErro(error?.message || "Erro ao criar reunião.");
    } finally {
      setLoading(false);
    }
  }

  async function excluirReuniao() {
    if (!reuniaoParaExcluir) {
      return;
    }

    try {
      setExcluindoId(
        reuniaoParaExcluir.id
      );

      setErro("");
      setMensagem("");

      const res = await fetch(
        `/api/reunioes?id=${reuniaoParaExcluir.id}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
          "Erro ao excluir reunião."
        );
      }

      setReunioes((atuais) =>
        atuais.filter(
          (item) =>
            item.id !==
            reuniaoParaExcluir.id
        )
      );

      setMensagem(
        "Reunião excluída com sucesso."
      );

      setReuniaoParaExcluir(null);
    } catch (error: any) {
      setErro(
        error?.message ||
        "Erro ao excluir reunião."
      );
    } finally {
      setExcluindoId(null);
    }
  }

  useEffect(() => {
    carregarReunioes();
    carregarOpcoes();
  }, []);

  return (
    <div className="phanyx-admin-reunioes-page mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          📅 Reuniões PHANYX
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Crie reuniões por equipe, setor, turma, curso, aluno individual ou todos os alunos.
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

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Criar nova reunião
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {carregandoOpcoes
                ? "Carregando setores, turmas, cursos e participantes..."
                : "Escolha o público e o PHANYX vincula os participantes automaticamente."}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Título
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              placeholder="Ex: Reunião pedagógica"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Link da reunião
            </label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              placeholder="https://meet.google.com/..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Data e hora
            </label>
            <input
              type="datetime-local"
              value={dataHora}
              onChange={(e) => setDataHora(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Público
            </label>
            <select
              value={publicoTipo}
              onChange={(e) => {
                setPublicoTipo(e.target.value);
                limparCamposPublico();
              }}
              className="phanyx-reuniao-publico-select w-full rounded-xl border px-4 py-3 outline-none"
            >
              <option value="TODA_EQUIPE">Toda equipe administrativa</option>
              <option value="SETOR">Setor</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="TURMA">Turma</option>
              <option value="CURSO">Curso</option>
              <option value="TODOS_ALUNOS">Todos os alunos matriculados</option>
            </select>
          </div>

          {publicoTipo === "SETOR" && (
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Setor
              </label>
              <select
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Selecione um setor</option>
                {opcoes.setores.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          )}

          {publicoTipo === "TURMA" && (
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Turma
              </label>
              <select
                value={turmaId}
                onChange={(e) => setTurmaId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Selecione uma turma</option>
                {opcoes.turmas.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.nome}
                    {turma.periodoLetivo ? ` • ${turma.periodoLetivo}` : ""}
                    {turma.semestre ? ` • ${turma.semestre}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {publicoTipo === "CURSO" && (
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Curso
              </label>
              <select
                value={cursoId}
                onChange={(e) => setCursoId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Selecione um curso</option>
                {opcoes.cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nome}
                    {curso.codigo ? ` • ${curso.codigo}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {publicoTipo === "INDIVIDUAL" && (
            <div className="phanyx-reuniao-individual-card md:col-span-2 rounded-2xl border p-4">
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Buscar participantes
              </label>

              <input
                value={buscaPessoa}
                onChange={(e) =>
                  setBuscaPessoa(e.target.value)
                }
                className="phanyx-reuniao-busca-participante w-full rounded-xl border px-4 py-3 outline-none"
                placeholder="Digite nome, matrícula, email ou setor"
              />

              <div className="phanyx-reuniao-lista-participantes mt-3 max-h-72 overflow-y-auto rounded-xl border">
                {pessoasFiltradas.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500 dark:text-slate-300">
                    Nenhuma pessoa encontrada.
                  </p>
                ) : (
                  pessoasFiltradas.map((pessoa) => {
                    const selecionado = pessoaEstaSelecionada(pessoa);

                    return (
                      <button
                        key={`${pessoa.role}-${pessoa.id}-${pessoa.userId}`}
                        type="button"
                        onClick={() => alternarPessoa(pessoa)}
                        className={`
  phanyx-reuniao-participante-item
  flex
  w-full
  items-center
  justify-between
  gap-3
  border-b
  px-4
  py-3
  text-left
  text-sm
  transition
  last:border-b-0
  ${selecionado ? "is-selected" : ""}
`}
                      >
                        <span>
                          <span className="block font-semibold">{pessoa.nome}</span>
                          <span
                            className="phanyx-reuniao-participante-detalhes block text-xs"
                          >
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
                  })
                )}
              </div>

              {participantesSelecionados.length > 0 && (
                <div className="phanyx-reuniao-selecionados-card mt-3 rounded-xl border p-3">
                  <p className="phanyx-reuniao-selecionados-titulo mb-2 text-xs font-bold uppercase tracking-[0.18em]">
                    Participantes selecionados
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {participantesSelecionados.map((pessoa) => (
                      <button
                        key={`sel-${pessoa.role}-${pessoa.id}-${pessoa.userId}`}
                        type="button"
                        onClick={() => alternarPessoa(pessoa)}
                        className="rounded-full bg-slate-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-700"
                      >
                        {pessoa.nome} ✕
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              placeholder="Descreva o objetivo da reunião..."
            />
          </div>
        </div>

        <button
          type="button"
          onClick={criarReuniao}
          disabled={loading}
          className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "Criando reunião..." : "Criar reunião"}
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Reuniões marcadas
        </h2>

        {reunioes.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Nenhuma reunião marcada ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {reunioes.map((reuniao) => (
              <div
                key={reuniao.id}
                className="phanyx-reuniao-card-marcada rounded-2xl border p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {reuniao.titulo}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
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
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={reuniao.link}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-600"
                    >
                      Abrir reunião
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        setReuniaoParaExcluir(
                          reuniao
                        )
                      }
                      disabled={
                        excluindoId === reuniao.id
                      }
                      className="
      rounded-xl
      border
      border-red-300
      bg-red-50
      px-4
      py-2
      text-sm
      font-semibold
      text-red-700
      hover:bg-red-100
      disabled:cursor-not-allowed
      disabled:opacity-50
      dark:border-red-800
      dark:bg-red-950/40
      dark:text-red-200
      dark:hover:bg-red-950/70
    "
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                {reuniao.descricao && (
                  <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                    {reuniao.descricao}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {reuniaoParaExcluir && (
        <div
          className="
      fixed
      inset-0
      z-[100]
      flex
      items-center
      justify-center
      bg-black/60
      p-4
    "
        >
          <div
            className="
        w-full
        max-w-md
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-6
        shadow-2xl
        dark:border-slate-700
        dark:bg-slate-900
      "
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Excluir reunião
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Tem certeza que deseja excluir
                a reunião{" "}
                <strong className="text-slate-900 dark:text-white">
                  {reuniaoParaExcluir.titulo}
                </strong>
                ?
              </p>

              <p className="mt-2 text-sm text-red-600 dark:text-red-300">
                A reunião e os participantes
                vinculados a ela serão removidos.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setReuniaoParaExcluir(null)
                }
                disabled={
                  excluindoId !== null
                }
                className="
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-2
            text-sm
            font-semibold
            text-slate-700
            hover:bg-slate-100
            disabled:opacity-50
            dark:border-slate-600
            dark:bg-slate-800
            dark:text-white
          "
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={excluirReuniao}
                disabled={
                  excluindoId !== null
                }
                className="
            rounded-xl
            bg-red-600
            px-4
            py-2
            text-sm
            font-semibold
            text-white
            hover:bg-red-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
              >
                {excluindoId !== null
                  ? "Excluindo..."
                  : "Excluir reunião"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
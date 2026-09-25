"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

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

export default function AdminReunioesPage() {
  const t = useTranslations("AdminOperations");
  const locale = useLocale();
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
      a.nome.localeCompare(b.nome, locale)
    );
  }, [opcoes, locale]);

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

        return nomeA.localeCompare(nomeB, locale);
      })
      .slice(0, 40);
  }, [buscaPessoa, pessoasIndividuais, locale]);

  const participantesSelecionados = useMemo(() => {
    return pessoasIndividuais.filter((pessoa) => {
      if (pessoa.role === "ALUNO") {
        return participantesAlunoIds.includes(pessoa.id);
      }

      return participantesUserIds.includes(pessoa.userId);
    });
  }, [pessoasIndividuais, participantesUserIds, participantesAlunoIds]);

  async function carregarReunioes() {
    try {
      const res = await fetch("/api/reunioes", { cache: "no-store" });
      if (!res.ok) throw new Error(t("meetingsLoadError"));
      const data = await res.json();
      setReunioes(Array.isArray(data) ? data : []);
    } catch {
      setErro(t("meetingsLoadError"));
    }
  }

  async function carregarOpcoes() {
    try {
      setCarregandoOpcoes(true);
      const res = await fetch("/api/reunioes/opcoes", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error((locale.startsWith("pt") ? (data?.error || t("meetingsOptionsError")) : t("meetingsOptionsError")));
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
      setErro((locale.startsWith("pt") ? (error?.message || t("meetingsOptionsError")) : t("meetingsOptionsError")));
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
        throw new Error((locale.startsWith("pt") ? (data?.error || t("meetingsCreateError")) : t("meetingsCreateError")));
      }

      setMensagem(t("meetingsCreated"));
      setTitulo("");
      setDescricao("");
      setLink("");
      setDataHora("");
      setPublicoTipo("TODA_EQUIPE");
      limparCamposPublico();

      await carregarReunioes();
    } catch (error: any) {
      setErro((locale.startsWith("pt") ? (error?.message || t("meetingsCreateError")) : t("meetingsCreateError")));
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
          (locale.startsWith("pt") ? (data?.error || t("meetingsDeleteError")) : t("meetingsDeleteError"))
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
        t("meetingsDeleted")
      );

      setReuniaoParaExcluir(null);
    } catch (error: any) {
      setErro(
        (locale.startsWith("pt") ? (error?.message || t("meetingsDeleteError")) : t("meetingsDeleteError"))
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
          {t("meetingsTitle")}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {t("meetingsIntro")}
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
              {t("meetingsNew")}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {carregandoOpcoes
                ? t("meetingsLoading")
                : t("meetingsHelp")}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("commonTitle")}
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              placeholder={t("meetingsExample")}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("meetingsLink")}
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
              {t("meetingsDate")}
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
              {t("meetingsAudience")}
            </label>
            <select
              value={publicoTipo}
              onChange={(e) => {
                setPublicoTipo(e.target.value);
                limparCamposPublico();
              }}
              className="phanyx-reuniao-publico-select w-full rounded-xl border px-4 py-3 outline-none"
            >
              <option value="TODA_EQUIPE">{t("meetingsWholeTeam")}</option>
              <option value="SETOR">{t("commonDepartment")}</option>
              <option value="INDIVIDUAL">{t("commonIndividual")}</option>
              <option value="TURMA">{t("commonClass")}</option>
              <option value="CURSO">{t("commonCourse")}</option>
              <option value="TODOS_ALUNOS">{t("meetingsAllStudents")}</option>
            </select>
          </div>

          {publicoTipo === "SETOR" && (
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("commonDepartment")}
              </label>
              <select
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              >
                <option value="">{t("meetingsSelectDepartment")}</option>
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
                {t("commonClass")}
              </label>
              <select
                value={turmaId}
                onChange={(e) => setTurmaId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              >
                <option value="">{t("meetingsSelectClass")}</option>
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
                {t("commonCourse")}
              </label>
              <select
                value={cursoId}
                onChange={(e) => setCursoId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              >
                <option value="">{t("meetingsSelectCourse")}</option>
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
                {t("meetingsSearchParticipants")}
              </label>

              <input
                value={buscaPessoa}
                onChange={(e) =>
                  setBuscaPessoa(e.target.value)
                }
                className="phanyx-reuniao-busca-participante w-full rounded-xl border px-4 py-3 outline-none"
                placeholder={t("meetingsSearchPlaceholder")}
              />

              <div className="phanyx-reuniao-lista-participantes mt-3 max-h-72 overflow-y-auto rounded-xl border">
                {pessoasFiltradas.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500 dark:text-slate-300">
                    {t("meetingsNobody")}
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
                            {pessoa.role === "ALUNO" ? t("roleStudent") : pessoa.role === "PROFESSOR" ? t("roleTeacher") : t("roleEmployee")}
                            {pessoa.matricula ? ` • ${pessoa.matricula}` : ""}
                            {pessoa.setor ? ` • ${pessoa.setor}` : ""}
                            {pessoa.email ? ` • ${pessoa.email}` : ""}
                          </span>
                        </span>

                        <span className="text-xs font-bold">
                          {selecionado ? t("meetingsSelected") : t("meetingsAdd")}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {participantesSelecionados.length > 0 && (
                <div className="phanyx-reuniao-selecionados-card mt-3 rounded-xl border p-3">
                  <p className="phanyx-reuniao-selecionados-titulo mb-2 text-xs font-bold uppercase tracking-[0.18em]">
                    {t("meetingsSelectedParticipants")}
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
              {t("meetingsDescription")}
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              placeholder={t("meetingsDescriptionPlaceholder")}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={criarReuniao}
          disabled={loading}
          className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? t("meetingsCreating") : t("meetingsCreate")}
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t("meetingsScheduled")}
        </h2>

        {reunioes.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">
            {t("meetingsEmpty")}
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
                      {new Date(reuniao.dataHora).toLocaleString(locale)}
                    </p>
                    <p className="mt-1 text-xs text-blue-500">
                      {({ TODA_EQUIPE: t("meetingsWholeTeam"), TODOS_ALUNOS: t("meetingsAllStudents"), SETOR: t("commonDepartment"), TURMA: t("commonClass"), CURSO: t("commonCourse"), INDIVIDUAL: t("commonIndividual") } as Record<string, string>)[reuniao.publicoTipo] || reuniao.publicoTipo}
                      {reuniao.setor ? ` • ${reuniao.setor}` : ""}
                      {reuniao.turma?.nome ? ` • ${reuniao.turma.nome}` : ""}
                      {reuniao.curso?.nome ? ` • ${reuniao.curso.nome}` : ""}
                      {" • "}
                      {t("meetingsParticipants", { count: reuniao.participantes?.length || 0 })}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={reuniao.link}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-600"
                    >
                      {t("meetingsOpen")}
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
  border-red-700
  bg-red-600
  px-4
  py-2
  text-sm
  font-semibold
  text-white
  shadow-sm
  hover:bg-red-700
  hover:border-red-800
  disabled:cursor-not-allowed
  disabled:opacity-50

  dark:border-red-600
  dark:bg-red-700
  dark:text-white
  dark:hover:bg-red-800
"
                    >
                      {t("commonDelete")}
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
                {t("meetingsDelete")}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t("meetingsDeleteAsk", { title: reuniaoParaExcluir.titulo })}
              </p>

              <p className="mt-2 text-sm text-red-600 dark:text-red-300">
                {t("meetingsDeleteWarning")}
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
  phanyx-reuniao-modal-cancelar
  rounded-xl
  border
  px-4
  py-2
  text-sm
  font-bold
  shadow-sm
  disabled:cursor-not-allowed
  disabled:opacity-50
"
              >
                {t("commonCancel")}
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
                  ? t("meetingsDeleting")
                  : t("meetingsDelete")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

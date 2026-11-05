"use client";

import { useEffect, useState } from "react";
import { mensagensOptativas } from "@/lib/matriculas/optativas-avulsas";

type Opcao = { id: number; nome: string };
type Sessao = {
  id: number; disciplina: { nome: string }; diaSemana: number; horaInicio: string; horaFim: string;
  capacidade: number; ocupadas: number; professorId: number | null; turmas: { turmaId: number }[];
};
type Dados = {
  ativo: boolean; disciplinas: Opcao[]; turmas: (Opcao & { turno: string | null; periodoLetivo: string | null })[];
  professores: Opcao[]; sessoes: Sessao[];
};
const dias = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const campo = "mt-1 block w-full rounded border border-slate-400 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100";
const campoHorario = campo + " [color-scheme:light] dark:[color-scheme:dark]";
const botao = "rounded bg-blue-700 px-3 py-2 font-medium text-white disabled:opacity-50";
const inicial = { disciplinaId: "", diaSemana: 2, horaInicio: "", horaFim: "", capacidade: "", professorId: "", turmaIds: [] as number[] };

export default function OptativasCursoAvulso({ cursoId }: { cursoId: number }) {
  const [dados, setDados] = useState<Dados | null>(null);
  const [novo, setNovo] = useState(inicial);
  const [edicao, setEdicao] = useState<{ id: number; capacidade: string; professorId: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const url = `/api/admin/cursos/${cursoId}/optativas-avulsas`;

  async function ler(signal?: AbortSignal) {
    const res = await fetch(url, { cache: "no-store", signal });
    if (!res.ok) throw new Error("Não foi possível carregar as atividades optativas.");
    const data: Dados = await res.json();
    if (!signal?.aborted) setDados(data);
  }

  useEffect(() => {
    const controller = new AbortController();
    setDados(null);
    ler(controller.signal).catch(error => { if (!controller.signal.aborted) setErro(error.message); });
    return () => controller.abort();
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  async function salvar(body: Record<string, unknown>) {
    setOcupado(true); setErro(""); setAviso("");
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const falha = await res.json().catch(() => null);
        throw new Error(mensagensOptativas[falha?.codigo] ||
          (falha?.codigo === "REGISTRO_DUPLICADO" ? "Já existe uma sessão nesse horário para uma das turmas." : "Não foi possível salvar. Atualize e tente novamente."));
      }
      await ler();
      if (body.acao === "CRIAR") setNovo(inicial);
      setEdicao(null);
      setAviso("Configuração salva.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally { setOcupado(false); }
  }

  return <section className="space-y-4 rounded-xl border border-slate-300 bg-white p-4 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
    <h2 className="text-lg font-semibold">Atividades optativas da matrícula direta</h2>
    {erro && <p role="alert" className="text-red-700 dark:text-red-300">{erro}</p>}
    {aviso && <p role="status" className="text-emerald-700 dark:text-emerald-300">{aviso}</p>}
    {dados && <label className="flex items-center gap-2">
      <input type="checkbox" checked={dados.ativo} disabled={ocupado}
        onChange={e => void salvar({ acao: "ATIVAR", ativo: e.target.checked })} />
      Oferecer optativas na matrícula deste curso
    </label>}
    {dados?.ativo && <>
      <p className="text-sm">Selecione atividades já cadastradas neste curso. Uma sessão pode atender várias turmas, com vagas compartilhadas entre elas.</p>
      <form className="space-y-3" onSubmit={e => { e.preventDefault(); void salvar({ acao: "CRIAR", ...novo }); }}>
        <fieldset disabled={ocupado} className="grid gap-3 md:grid-cols-3">
          <label>Disciplina<select required className={campo} value={novo.disciplinaId}
            onChange={e => setNovo({ ...novo, disciplinaId: e.target.value })}>
            <option value="">Selecione</option>
            {dados.disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select></label>
          <label>Dia da semana<select className={campo} value={novo.diaSemana}
            onChange={e => setNovo({ ...novo, diaSemana: Number(e.target.value) })}>
            {dias.map((dia, i) => <option key={dia} value={i}>{dia}</option>)}
          </select></label>
          <label>Capacidade<input required className={campo} type="number" min="1" max="2000" value={novo.capacidade}
            onChange={e => setNovo({ ...novo, capacidade: e.target.value })} /></label>
          <label>Início<input required className={campoHorario} type="time" value={novo.horaInicio}
            onChange={e => setNovo({ ...novo, horaInicio: e.target.value })} /></label>
          <label>Fim<input required className={campoHorario} type="time" value={novo.horaFim}
            onChange={e => setNovo({ ...novo, horaFim: e.target.value })} /></label>
          <label>Professor da atividade<select className={campo} value={novo.professorId}
            onChange={e => setNovo({ ...novo, professorId: e.target.value })}>
            <option value="">Definir depois</option>
            {dados.professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select></label>
        </fieldset>
        <fieldset disabled={ocupado} className="space-y-1">
          <legend className="font-medium">Turmas que podem escolher esta sessão</legend>
          {dados.turmas.map(t => <label key={t.id} className="flex items-center gap-2">
            <input type="checkbox" checked={novo.turmaIds.includes(t.id)} onChange={e => {
              const turmaIds = e.target.checked ? [...novo.turmaIds, t.id] : novo.turmaIds.filter(id => id !== t.id);
              setNovo({ ...novo, turmaIds });
            }} />
            {[t.nome, t.turno, t.periodoLetivo].filter(Boolean).join(" · ")}
          </label>)}
        </fieldset>
        <button className={botao} disabled={ocupado || !novo.turmaIds.length || !dados.disciplinas.length}>Criar sessão</button>
      </form>
      <ul className="space-y-2">
        {dados.sessoes.map(s => <li key={s.id} className="space-y-2 rounded border border-slate-300 p-3 dark:border-slate-700">
          <p><strong>{s.disciplina.nome}</strong> · {dias[s.diaSemana]} · {s.horaInicio}–{s.horaFim} · {s.ocupadas}/{s.capacidade} vagas ocupadas</p>
          <p className="text-sm">{s.turmas.map(t => dados.turmas.find(item => item.id === t.turmaId)?.nome ?? `Turma #${t.turmaId}`).join(", ")}</p>
          {edicao?.id === s.id ? <form className="flex flex-wrap items-end gap-2" onSubmit={e => {
            e.preventDefault(); void salvar({ acao: "ATUALIZAR", sessaoId: s.id, capacidade: edicao.capacidade, professorId: edicao.professorId });
          }}>
            <label>Capacidade<input required className={campo} type="number" min={Math.max(1, s.ocupadas)} max="2000" value={edicao.capacidade}
              onChange={e => setEdicao({ ...edicao, capacidade: e.target.value })} /></label>
            <label>Professor<select className={campo} value={edicao.professorId} onChange={e => setEdicao({ ...edicao, professorId: e.target.value })}>
              <option value="">Definir depois</option>
              {dados.professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select></label>
            <button className={botao} disabled={ocupado}>Salvar sessão</button>
            <button type="button" disabled={ocupado} onClick={() => setEdicao(null)}>Cancelar</button>
          </form> : <div className="flex flex-wrap items-center gap-3 text-sm">
            <span>{dados.professores.find(p => p.id === s.professorId)?.nome ?? "Professor a definir"}</span>
            <button type="button" disabled={ocupado} className="font-semibold text-blue-700 dark:text-blue-300"
              onClick={() => setEdicao({ id: s.id, capacidade: String(s.capacidade), professorId: String(s.professorId ?? "") })}>Editar sessão</button>
            {s.ocupadas === 0 && <button type="button" disabled={ocupado} className="font-semibold text-red-700 dark:text-red-300"
              onClick={() => void salvar({ acao: "ARQUIVAR", sessaoId: s.id })}>Arquivar sessão</button>}
          </div>}
        </li>)}
      </ul>
    </>}
  </section>;
}

"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";
import Link from "next/link";

type Horario = { diaSemana: number; horaInicio: string; horaFim: string };
type Curso = { id: number; nome: string; matriculaDiretaTurma: boolean; organizacaoCurricular: string };
type Referencia = { id: number; nome: string };
type Turma = {
  id: number; cursoId: number; nome: string; codigo: string | null; periodoLetivo: string | null;
  turno: string | null; professorId: number | null; poloId: number | null;
  capacidadeMaxima: number | null; ativa: boolean; horariosAvulsos: Horario[];
};
type Dados = { cursos: Curso[]; turmas: Turma[]; professores: Referencia[]; polos: Referencia[]; ativacaoHabilitada: boolean };
const dias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const padrao = { cursoId: "", nome: "", codigo: "", periodoLetivo: "", turno: "", professorId: "", poloId: "", capacidadeMaxima: "", horarios: [{ diaSemana: 1, horaInicio: "", horaFim: "" }] as Horario[] };
const entrada = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

export default function TurmasAvulsasSemGrade() {
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [editarId, setEditarId] = useState<number | null>(null);
  const [turmaParaAtivar, setTurmaParaAtivar] = useState<Turma | null>(null);
  const [ativando, setAtivando] = useState(false);
  const [form, setForm] = useState({ ...padrao, horarios: [...padrao.horarios] });
  const carregar = useCallback(async (signal?: AbortSignal) => {
    const resposta = await fetch("/api/admin/turmas/avulsas", { credentials: "include", cache: "no-store", signal });
    const corpo = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(corpo?.error || "Não foi possível consultar as turmas avulsas.");
    if (!signal?.aborted) setDados(corpo);
  }, []);
  useEffect(() => {
    const ctrl = new AbortController();
    setCarregando(true);
    carregar(ctrl.signal).catch(e => { if (!ctrl.signal.aborted) setErro(e.message || "Falha na consulta."); })
      .finally(() => { if (!ctrl.signal.aborted) setCarregando(false); });
    return () => ctrl.abort();
  }, [carregar]);

  const habilitados = (dados?.cursos || []).filter(c => c.matriculaDiretaTurma);
  function editar(turma: Turma) {
    setEditarId(turma.id); setErro(""); setSucesso("");
    setForm({ cursoId: String(turma.cursoId), nome: turma.nome, codigo: turma.codigo || "",
      periodoLetivo: turma.periodoLetivo || "", turno: turma.turno || "",
      professorId: turma.professorId ? String(turma.professorId) : "",
      poloId: turma.poloId ? String(turma.poloId) : "",
      capacidadeMaxima: turma.capacidadeMaxima === null ? "" : String(turma.capacidadeMaxima),
      horarios: turma.horariosAvulsos.map(h => ({ ...h })) });
  }
  function novo() {
    setEditarId(null); setForm({ ...padrao, horarios: [{ ...padrao.horarios[0] }] });
    setErro(""); setSucesso("");
  }
  function alterarHorario(index: number, campo: keyof Horario, valor: string) {
    setForm(anterior => ({ ...anterior, horarios: anterior.horarios.map((h, i) => i !== index ? h : {
      ...h, [campo]: campo === "diaSemana" ? Number(valor) : valor,
    }) }));
  }
  async function salvar(event: FormEvent) {
    event.preventDefault(); setErro(""); setSucesso("");
    try {
      setSalvando(true);
      const resposta = await fetch("/api/admin/turmas/avulsas", {
        method: editarId ? "PATCH" : "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, cursoId: Number(form.cursoId), turmaId: editarId,
          acao: editarId ? "EDITAR_TURMA" : "CRIAR_TURMA" }),
      });
      const corpo = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(corpo.error || "Não foi possível salvar a turma.");
      setSucesso(editarId ? "Turma inativa atualizada." : "Turma avulsa criada como inativa para revisão.");
      await carregar();
      setEditarId(null); setForm({ ...padrao, horarios: [{ ...padrao.horarios[0] }] });
    } catch (falha) { setErro(falha instanceof Error ? falha.message : "Falha ao salvar."); }
    finally { setSalvando(false); }
  }

  async function confirmarAtivacao() {
    if (!turmaParaAtivar || !dados?.ativacaoHabilitada || ativando) return;
    setErro(""); setSucesso("");
    try {
      setAtivando(true);
      const resposta = await fetch("/api/admin/turmas/avulsas", {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "ATIVAR_TURMA", turmaId: turmaParaAtivar.id }),
      });
      const corpo = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(corpo.error || "Não foi possível ativar a turma.");
      setTurmaParaAtivar(null);
      setSucesso("Turma ativada com sucesso.");
      await carregar();
    } catch (falha) { setErro(falha instanceof Error ? falha.message : "Falha na ativação."); }
    finally { setAtivando(false); }
  }

  return <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-slate-900 dark:border-blue-800 dark:bg-slate-900 dark:text-slate-100">
    <h2 className="font-bold">Turmas de cursos avulsos sem disciplinas</h2>
    <p className="mt-1 text-sm">Escolha o curso e defina professor, vagas, ano letivo e horários. Não é necessário cadastrar disciplinas. A turma é salva inativa para revisão antes da ativação.</p>
    {dados && !dados.ativacaoHabilitada && <p role="status" className="mt-2 text-sm font-semibold text-amber-800 dark:text-amber-200">Você pode preparar a turma. A ativação para receber matrículas ainda não está liberada para sua instituição.</p>}
    {carregando && <p role="status" className="mt-2 text-sm">Consultando cursos avulsos...</p>}
    {erro && <p role="alert" className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{erro}</p>}
    {sucesso && <p role="status" className="mt-3 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">{sucesso}</p>}
    {!carregando && dados && <div className="mt-3 rounded-lg border border-blue-200 p-3 text-sm dark:border-blue-800">
      <p>{habilitados.length === 0 ? "Nenhum curso está habilitado para turmas sem disciplinas." : "Seu curso não aparece na lista?"} No cadastro do curso, marque “Curso avulso sem grade — matrícula diretamente na turma” e salve.</p>
      <p className="mt-1">Se o curso possui grade ou matrículas anteriores, preserve os registros. A configuração precisa ser revisada antes de usar este modo.</p>
      <Link href="/admin/cursos" className="mt-2 inline-block font-semibold text-blue-800 underline dark:text-blue-200">Abrir cadastro de cursos</Link>
      {habilitados.length === 0 && dados.cursos.length > 0 && <ul className="mt-2 flex flex-wrap gap-3" aria-label="Configurar curso">
        {dados.cursos.map(curso => <li key={curso.id}><Link href={`/admin/cursos/${curso.id}`} className="text-blue-800 underline dark:text-blue-200">{curso.nome}</Link></li>)}
      </ul>}
    </div>}
    {habilitados.length > 0 && <div className="mt-4 space-y-4">
      <form onSubmit={salvar} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
        <h3 className="font-semibold">{editarId ? "Editar turma inativa" : "Preparar nova turma avulsa"}</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm font-medium">Curso avulso
            <select required disabled={Boolean(editarId)} value={form.cursoId} onChange={e => setForm(f => ({ ...f, cursoId: e.target.value }))} className={entrada + " mt-1"}>
              <option value="">Selecione o curso...</option>
              {habilitados.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Nome da turma
            <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex.: RB27 Matutino" className={entrada + " mt-1"}/>
          </label>
          <label className="text-sm font-medium">Código (opcional)
            <input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} className={entrada + " mt-1"}/>
          </label>
          <label className="text-sm font-medium">Ano letivo
            <input required inputMode="numeric" pattern="[0-9]{4}" placeholder="Ex.: 2027" maxLength={4} value={form.periodoLetivo} onChange={e => setForm(f => ({ ...f, periodoLetivo: e.target.value }))} className={entrada + " mt-1"}/>
          </label>
          <label className="text-sm font-medium">Turno
            <select required value={form.turno} onChange={e => setForm(f => ({ ...f, turno: e.target.value }))} className={entrada + " mt-1"}>
              <option value="">Selecione...</option>
              <option value="MATUTINO">Matutino</option><option value="VESPERTINO">Vespertino</option>
              <option value="NOTURNO">Noturno</option><option value="INTEGRAL">Integral</option>
              <option value="FLEXIVEL">Flexível</option>
            </select>
          </label>
          <label className="text-sm font-medium">Vagas máximas
            <input required type="number" min="1" max="5000" value={form.capacidadeMaxima} onChange={e => setForm(f => ({ ...f, capacidadeMaxima: e.target.value }))} className={entrada + " mt-1"}/>
          </label>
          <label className="text-sm font-medium">Professor
            <select value={form.professorId} onChange={e => setForm(f => ({ ...f, professorId: e.target.value }))} className={entrada + " mt-1"}>
              <option value="">Não definido</option>{(dados?.professores || []).map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Polo
            <select value={form.poloId} onChange={e => setForm(f => ({ ...f, poloId: e.target.value }))} className={entrada + " mt-1"}>
              <option value="">Sem polo</option>{(dados?.polos || []).map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </label>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2"><h4 className="font-semibold">Dias e horários da turma</h4>
            <button type="button" disabled={form.horarios.length >= 30} onClick={() => setForm(f => ({ ...f, horarios: [...f.horarios, { diaSemana: 1, horaInicio: "", horaFim: "" }] }))} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Adicionar horário</button></div>
          {form.horarios.map((h, i) => <div key={i} className="grid grid-cols-1 gap-2 rounded-lg border p-2 sm:grid-cols-[1fr_110px_110px_auto]">
            <select aria-label="Dia da semana" value={h.diaSemana} onChange={e => alterarHorario(i, "diaSemana", e.target.value)} className={entrada}>
              {dias.map((d, n) => <option key={n} value={n}>{d}</option>)}
            </select>
            <input aria-label="Início da aula" required type="time" value={h.horaInicio} onChange={e => alterarHorario(i, "horaInicio", e.target.value)} className={entrada}/>
            <input aria-label="Fim da aula" required type="time" value={h.horaFim} onChange={e => alterarHorario(i, "horaFim", e.target.value)} className={entrada}/>
            <button type="button" disabled={form.horarios.length === 1} onClick={() => setForm(f => ({ ...f, horarios: f.horarios.filter((_, j) => j !== i) }))} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 disabled:opacity-40 dark:text-red-300">Remover</button>
          </div>)}
        </div>
        <div className="flex gap-2">
          <button disabled={salvando} type="submit" className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-40">{salvando ? "Salvando..." : editarId ? "Salvar alterações" : "Criar turma inativa"}</button>
          {editarId && <button type="button" onClick={novo} className="rounded-lg border px-4 py-2">Cancelar edição</button>}
        </div>
      </form>
      <div className="space-y-2">
        <h3 className="font-semibold">Turmas avulsas preparadas</h3>
        {!dados?.turmas.length && <p className="text-sm text-slate-600 dark:text-slate-300">Nenhuma turma sem grade cadastrada.</p>}
        {dados?.turmas.map(turma => <div key={turma.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
          <div className="text-sm"><strong>{turma.nome}</strong> — {habilitados.find(c => c.id === turma.cursoId)?.nome || "Curso"}
            <p className="text-slate-600 dark:text-slate-300">{turma.turno || "Sem turno"} · {turma.capacidadeMaxima ?? "?"} vagas · {turma.ativa ? "Ativa (edição bloqueada)" : "Inativa"}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">{turma.horariosAvulsos.map(h => `${dias[h.diaSemana]} ${h.horaInicio}–${h.horaFim}`).join(" · ")}</p>
          </div>
          {!turma.ativa && <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => editar(turma)} className="rounded-lg border border-blue-300 px-3 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300">Editar</button>
            <button type="button" disabled={!dados?.ativacaoHabilitada || ativando || salvando}
              title={!dados?.ativacaoHabilitada ? "Ativação bloqueada até homologação em banco isolado" : "Revisar e ativar esta turma"}
              onClick={() => setTurmaParaAtivar(turma)}
              className="rounded-lg border border-emerald-600 px-3 py-2 text-sm font-semibold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-300">Ativar turma</button>
          </div>}
        </div>)}
      </div>
    </div>}
    <PhanyxConfirmModal
      aberto={turmaParaAtivar !== null}
      titulo="Confirmar ativação da turma avulsa"
      mensagem={`Deseja ativar ${turmaParaAtivar?.nome || "esta turma"}? O servidor irá conferir o curso, os horários, o professor, os valores e as vagas. Esta ação não confirma matrículas.`}
      textoConfirmar="Ativar turma"
      carregando={ativando}
      onConfirmar={() => void confirmarAtivacao()}
      onCancelar={() => setTurmaParaAtivar(null)}
    />
  </section>;
}

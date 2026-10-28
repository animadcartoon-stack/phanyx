"use client";
import { useEffect, useMemo, useState } from "react";

type Curso = { id: number; nome: string; ativo: boolean; disponivelComoAdicional?: boolean };
type Combo = { id: number; nome: string; ativo: boolean; cursoIds: number[] };
type Oferta = {
  id: number; nome: string; cursoId: number; poloId: number | null;
  periodoLetivo: string | null; turno: string | null; vagas: number | null;
  horariosPendentes: boolean; disciplinaIds: number[];
  curso: { id: number; nome: string };
};
export type PreviaComboMatricula = {
  versao: string;
  turmaIds: number[];
  disciplinasPrincipais: number[];
  cursosEscolhidos: number[];
  calculo: { matriculaCentavos: number; mensalidadeCentavos: number; quantidadeParcelas: number; nome: string; quantidadeModalidades: number };
};
type Props = {
  cursoPrincipalId: number;
  alunoId: string;
  turmaPrincipalId: number | null;
  dataInicioCurso: string;
  escolhidos: number[];
  onChange: (ids: number[]) => void;
  onPreviaChange: (previa: PreviaComboMatricula | null) => void;
};
const campo = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
export default function SeletorAdicionaisMatricula({ cursoPrincipalId, alunoId, turmaPrincipalId, dataInicioCurso, escolhidos, onChange, onPreviaChange }: Props) {
  const [aberto, setAberto] = useState(false);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [porCurso, setPorCurso] = useState<Record<number, number>>({});
  const [erroConsulta, setErroConsulta] = useState("");
  const [erroPrevia, setErroPrevia] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [calculando, setCalculando] = useState(false);
  const [previa, setPrevia] = useState<PreviaComboMatricula | null>(null);
  const idsEscolhidos = escolhidos.join(",");
  const selecoes = escolhidos.map(id => Number(porCurso[id] || 0));
  const idsTurmas = turmaPrincipalId && selecoes.every(id => id > 0)
    ? [turmaPrincipalId, ...selecoes] : [];
  const chaveTurmas = idsTurmas.join(",");
  const chaveOpcoes = selecoes.join(",");

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true); setErroConsulta(""); setPorCurso({}); setPrevia(null); onPreviaChange(null);
    Promise.all([
      fetch("/api/admin/combos", { credentials: "include", cache: "no-store", signal: controller.signal }).then(async r => {
        const data = await r.json(); if (!r.ok) throw Error(data?.error || "Falha ao consultar combos"); return data;
      }),
      fetch(
        "/api/admin/matriculas/modalidades?cursoPrincipalId=" + encodeURIComponent(cursoPrincipalId),
        { credentials: "include", cache: "no-store", signal: controller.signal },
      ).then(async r => {
        const data = await r.json(); if (!r.ok) throw Error(data?.codigo || "Falha ao consultar turmas"); return data;
      }),
    ]).then(([c, o]) => {
      if (controller.signal.aborted) return;
      setCursos(Array.isArray(c.cursos) ? c.cursos : []);
      setCombos(Array.isArray(c.combos) ? c.combos : []);
      setOfertas(Array.isArray(o.ofertas) ? o.ofertas : []);
    }).catch(e => { if (!controller.signal.aborted) setErroConsulta(e?.message || "Falha na consulta"); })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [cursoPrincipalId, onPreviaChange]);

  const elegiveis = useMemo(() => {
    const pacotes = combos.filter(c => c.ativo && c.cursoIds.includes(cursoPrincipalId));
    const ids = new Set(pacotes.flatMap(c => c.cursoIds));
    return cursos.filter(c => c.ativo && c.id !== cursoPrincipalId && c.disponivelComoAdicional &&
      (pacotes.length === 0 || ids.has(c.id))).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [combos, cursos, cursoPrincipalId]);
  const turmaPrincipal = ofertas.find(o => o.id === turmaPrincipalId && o.cursoId === cursoPrincipalId);
  const ofertasDoCurso = (cursoId: number) => ofertas.filter(o => o.cursoId === cursoId &&
    turmaPrincipal && o.poloId === turmaPrincipal.poloId &&
    (o.periodoLetivo || "") === (turmaPrincipal.periodoLetivo || ""));

  useEffect(() => {
    setPrevia(null); onPreviaChange(null); setErroPrevia("");
    if (!escolhidos.length || !alunoId || !turmaPrincipalId || !chaveTurmas ||
      !turmaPrincipal || idsTurmas.length !== escolhidos.length + 1 || carregando) return;
    const controller = new AbortController();
    setCalculando(true);
    fetch("/api/admin/matriculas/modalidades", {
      method: "POST", credentials: "include", signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "PREVIA", alunoId: Number(alunoId), cursoPrincipalId,
        turmaIds: idsTurmas, dataInicioCurso: dataInicioCurso || null }),
    }).then(async r => {
      const d = await r.json().catch(() => null);
      if (!r.ok) throw Error(String(d?.codigo || d?.error || "Não foi possível calcular a matrícula"));
      return d;
    }).then(d => {
      if (controller.signal.aborted) return;
      const p: PreviaComboMatricula = {
        versao: String(d.versao), turmaIds: idsTurmas,
        disciplinasPrincipais: turmaPrincipal.disciplinaIds,
        cursosEscolhidos: [...escolhidos].sort((a,b)=>a-b),
        calculo: d.calculo,
      };
      setPrevia(p); onPreviaChange(p);
    }).catch(e => { if (!controller.signal.aborted) setErroPrevia(e?.message || "Falha na prévia"); })
      .finally(() => { if (!controller.signal.aborted) setCalculando(false); });
    return () => controller.abort();
  }, [alunoId, cursoPrincipalId, turmaPrincipalId, dataInicioCurso, idsEscolhidos, chaveTurmas, chaveOpcoes, carregando, ofertas, onPreviaChange]);

  const moeda = (centavos: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);
  return <section className="rounded-xl border border-blue-300 bg-blue-50 p-4 text-slate-900 dark:border-blue-800 dark:bg-slate-900 dark:text-slate-100">
    <label className="flex cursor-pointer items-center gap-2 font-semibold">
      <input type="checkbox" checked={aberto || escolhidos.length > 0} onChange={e => {
        setAberto(e.target.checked); if (!e.target.checked) { onChange([]); setPorCurso({}); }
      }} /> Vincular outro curso nesta matrícula (opcional)
    </label>
    <p className="mt-1 text-sm">A matrícula com apenas o curso principal continua disponível. Escolha outra modalidade somente se desejar.</p>
    {(aberto || escolhidos.length > 0) && <div className="mt-3 space-y-3">
      {carregando && <p>Consultando as modalidades e as turmas...</p>}
      {erroConsulta && <p role="alert" className="text-red-700">{erroConsulta}</p>}
      {!carregando && !erroConsulta && elegiveis.length === 0 && <p>Não há cursos adicionais habilitados para este curso.</p>}
      {elegiveis.map(c => {
        const marcado = escolhidos.includes(c.id);
        const turmas = ofertasDoCurso(c.id);
        return <div key={c.id} className="rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
          <label className="flex items-center gap-3 font-medium">
            <input type="checkbox" checked={marcado} onChange={e => {
              setPorCurso(anteriores => { const atual = { ...anteriores }; delete atual[c.id]; return atual; });
              onChange(e.target.checked ? [...escolhidos, c.id] : escolhidos.filter(id => id !== c.id));
            }} /> {c.nome}
          </label>
          {marcado && <div className="mt-3 space-y-2 pl-6">
            {!turmaPrincipal ? <p className="text-sm text-amber-700 dark:text-amber-300">Selecione primeiro a turma do curso principal.</p> :
              turmas.length === 0 ? <p className="text-sm text-amber-700 dark:text-amber-300">Este curso ainda não tem turma ativa compatível com o período da matrícula. Configure a turma em Turmas.</p> :
              <label className="block text-sm font-medium">Turma de {c.nome}
                <select className={campo + " mt-1"} value={porCurso[c.id] || ""} onChange={e => setPorCurso(p => ({ ...p, [c.id]: Number(e.target.value) }))}>
                  <option value="">Selecione a turma...</option>
                  {turmas.map(o => <option key={o.id} value={o.id} disabled={o.horariosPendentes || o.vagas === 0}>
                    {o.nome}{o.turno ? " — " + o.turno : ""}{o.horariosPendentes ? " — horários pendentes" : ""}{o.vagas === 0 ? " — sem vagas" : ""}
                  </option>)}
                </select>
              </label>}
          </div>}
        </div>;
      })}
      {escolhidos.length > 0 && !turmaPrincipal && <p role="alert" className="text-amber-700">O curso principal precisa ter uma turma disponível antes de calcular o combo.</p>}
      {calculando && <p role="status">Calculando matrícula e verificando horários, vagas e descontos...</p>}
      {erroPrevia && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">Prévia indisponível: {erroPrevia}. A matrícula conjunta não será gravada.</p>}
      {previa && <div className="rounded-lg border border-blue-300 bg-white p-3 text-sm text-slate-900 dark:bg-slate-950 dark:text-white">
        <strong>Prévia da contratação: {previa.calculo.nome}</strong>
        <p>Modalidades: {previa.calculo.quantidadeModalidades} · Taxa única: {moeda(previa.calculo.matriculaCentavos)}</p>
        <p>Mensalidade antes de bolsa adicional: {moeda(previa.calculo.mensalidadeCentavos)} · {previa.calculo.quantidadeParcelas} parcelas</p>
        <p className="mt-1 text-xs">A confirmação fará uma nova validação do preço, das vagas e dos horários no servidor.</p>
      </div>}
    </div>}
  </section>;
}

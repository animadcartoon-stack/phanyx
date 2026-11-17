"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

type Funcionario = { id: number; nome: string };
type Previa = { id: number; nome: string; departamentoId: number | null; departamentoNome: string | null;
  cargoId: number | null; cargo: string | null; perfil: string | null; temAcesso: boolean;
  possuiVinculoDocente: boolean; pendencias: { turmas: number; disciplinasTurmas: number; sessoesOptativas: number } | null;
  perfisPermitidos: string[] };
type Opcao = { id: number; nome: string; ativo?: boolean };

const idiomas = {
  "pt-BR": { titulo: "Movimentação funcional", departamento: "Departamento de destino", cargo: "Novo cargo", perfil: "Perfil de acesso ao PHANYX", manter: "Manter perfil atual", semAcesso: "Sem login vinculado (gerencie o acesso separadamente)", data: "Data de vigência", motivo: "Motivo da movimentação", confirmar: "Registrar movimentação", cancelar: "Cancelar", carregando: "Consultando RH...", salvando: "Registrando...", concluido: "Movimentação registrada no histórico do RH.", selecione: "Selecione", aviso: "O cargo e o departamento pertencem ao RH; o perfil define acesso ao sistema e não é automaticamente determinado pelo cargo.", docente: "O histórico docente será preservado. Ao retirar o perfil de professor, o vínculo docente será inativado, nunca excluído.", pendencias: "Há atividades docentes vinculadas. Para retirar o perfil PROFESSOR, será necessário reatribuir turmas, disciplinas e sessões primeiro.", erro: "Não foi possível concluir a movimentação.", selecionar: "Selecione departamento e cargo, informe o motivo e a data." },
  "pt-PT": { titulo: "Movimentação funcional", departamento: "Departamento de destino", cargo: "Nova função", perfil: "Perfil de acesso ao PHANYX", manter: "Manter perfil atual", semAcesso: "Sem acesso associado (gerir separadamente)", data: "Data de vigência", motivo: "Motivo da movimentação", confirmar: "Registar movimentação", cancelar: "Cancelar", carregando: "A consultar RH...", salvando: "A registar...", concluido: "Movimentação registada no histórico de RH.", selecione: "Selecionar", aviso: "A função e o departamento pertencem ao RH; o perfil controla o acesso ao sistema.", docente: "O histórico docente mantém-se. Ao retirar o perfil docente, o vínculo é desativado, não eliminado.", pendencias: "Reatribua turmas, disciplinas e sessões antes de retirar o perfil docente.", erro: "Não foi possível registar a movimentação.", selecionar: "Selecione o departamento e a função, o motivo e a data." },
  "en-US": { titulo: "Employee role transfer", departamento: "Destination department", cargo: "New job title", perfil: "PHANYX access role", manter: "Keep current access role", semAcesso: "No linked login (manage access separately)", data: "Effective date", motivo: "Reason for transfer", confirmar: "Record transfer", cancelar: "Cancel", carregando: "Loading HR details...", salvando: "Saving...", concluido: "Transfer recorded in HR history.", selecione: "Select", aviso: "Job title and department are HR fields; the access role is independent.", docente: "Teaching history is retained. Removing the teacher access role deactivates, but never deletes, the teaching record.", pendencias: "Reassign classes, subjects and sessions before removing teacher access.", erro: "The transfer could not be saved.", selecionar: "Select a department and title, reason and date." },
  "es-ES": { titulo: "Movimiento funcional", departamento: "Departamento de destino", cargo: "Nuevo cargo", perfil: "Perfil de acceso a PHANYX", manter: "Mantener perfil actual", semAcesso: "Sin acceso asociado (gestionar por separado)", data: "Fecha de vigencia", motivo: "Motivo del cambio", confirmar: "Registrar cambio", cancelar: "Cancelar", carregando: "Consultando RR. HH....", salvando: "Guardando...", concluido: "Cambio registrado en el historial de RR. HH.", selecione: "Seleccionar", aviso: "El cargo y el departamento pertenecen a RR. HH.; el perfil define el acceso independientemente.", docente: "Se preserva el historial docente. El vínculo docente se desactiva, nunca se elimina.", pendencias: "Reasigne clases, asignaturas y sesiones antes de retirar el perfil docente.", erro: "No se pudo registrar el cambio.", selecionar: "Seleccione departamento, cargo, motivo y fecha." },
  "fr-FR": { titulo: "Mobilité fonctionnelle", departamento: "Département de destination", cargo: "Nouvelle fonction", perfil: "Profil d'accès à PHANYX", manter: "Conserver le profil actuel", semAcesso: "Aucun compte lié (gérer séparément)", data: "Date d'effet", motivo: "Motif du changement", confirmar: "Enregistrer", cancelar: "Annuler", carregando: "Chargement RH...", salvando: "Enregistrement...", concluido: "Changement enregistré dans l'historique RH.", selecione: "Sélectionner", aviso: "La fonction et le département relèvent des RH; le profil détermine l'accès indépendamment.", docente: "L'historique enseignant est conservé; le lien est désactivé, jamais supprimé.", pendencias: "Réaffectez cours, matières et séances avant de retirer le profil enseignant.", erro: "Impossible d'enregistrer le changement.", selecionar: "Sélectionnez le département, la fonction, le motif et la date." },
} as const;

const rotulosPerfil: Record<string, string> = {
  ADMIN: "Administrador / Administrator", PROFESSOR: "Professor / Teacher",
  SECRETARIA: "Secretaria / Office", COORDENADOR: "Coordenador / Coordinator",
  FINANCEIRO: "Financeiro / Finance",
};

function dataLocal() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,"0")}-${String(agora.getDate()).padStart(2,"0")}`;
}

export default function MovimentacaoFuncionalModal({ funcionario, onClose, onConcluido }: {
  funcionario: Funcionario; onClose: () => void; onConcluido: () => Promise<void> | void;
}) {
  const locale = useLocale();
  const t = idiomas[locale as keyof typeof idiomas] || idiomas["en-US"];
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [departamentos, setDepartamentos] = useState<Opcao[]>([]);
  const [cargos, setCargos] = useState<Opcao[]>([]);
  const [departamentoId, setDepartamentoId] = useState("");
  const [cargoId, setCargoId] = useState("");
  const [perfil, setPerfil] = useState("MANTER");
  const [vigenciaEm, setVigenciaEm] = useState(dataLocal);
  const [motivo, setMotivo] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [carregandoCargos, setCarregandoCargos] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [concluido, setConcluido] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setCarregando(true);
      try {
        const [res, deps] = await Promise.all([
          fetch(`/api/admin/funcionarios/${funcionario.id}/movimentacao-funcional`, { credentials: "include", cache: "no-store", signal: controller.signal }),
          fetch("/api/departamento", { credentials: "include", cache: "no-store", signal: controller.signal }),
        ]);
        const dados = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(dados.error || t.erro);
        const lista = await deps.json().catch(() => null);
        if (!deps.ok || !Array.isArray(lista)) throw new Error(t.erro);
        if (controller.signal.aborted) return;
        setPrevia(dados as Previa);
        setDepartamentoId(dados.departamentoId ? String(dados.departamentoId) : "");
        setCargoId(dados.cargoId ? String(dados.cargoId) : "");
        setDepartamentos(lista.filter((d: Opcao) => d.ativo !== false));
      } catch(e) {
        if (!controller.signal.aborted) setErro(e instanceof Error ? e.message : t.erro);
      } finally { if (!controller.signal.aborted) setCarregando(false); }
    })();
    return () => controller.abort();
  }, [funcionario.id, t.erro]);

  useEffect(() => {
    if (!departamentoId) { setCargos([]); return; }
    const controller = new AbortController();
    (async () => {
      setCarregandoCargos(true);
      try {
        const res = await fetch(`/api/departamento/${departamentoId}/cargos`, { credentials: "include", cache: "no-store", signal: controller.signal });
        const dados = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(dados.error || t.erro);
        const lista: Opcao[] = Array.isArray(dados) ? dados : Array.isArray(dados.cargos) ? dados.cargos : [];
        if (!controller.signal.aborted) setCargos(lista.filter(c => c.ativo !== false));
      } catch(e) { if (!controller.signal.aborted) { setCargos([]); setErro(e instanceof Error ? e.message : t.erro); } }
      finally { if (!controller.signal.aborted) setCarregandoCargos(false); }
    })();
    return () => controller.abort();
  }, [departamentoId, t.erro]);

  const perfilNovo = perfil === "MANTER" ? previa?.perfil : perfil;
  const conflitos = previa?.pendencias;
  const temPendencias = Boolean(conflitos && (conflitos.turmas + conflitos.disciplinasTurmas + conflitos.sessoesOptativas > 0));
  const trocandoPerfilDocente = previa?.perfil === "PROFESSOR" && perfilNovo !== "PROFESSOR";

  async function confirmar() {
    if (salvando || !departamentoId || !cargoId || motivo.trim().length < 5 || !vigenciaEm) {
      setErro(t.selecionar); return;
    }
    setErro(""); setSalvando(true);
    try {
      const res = await fetch(`/api/admin/funcionarios/${funcionario.id}/movimentacao-funcional`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departamentoId: Number(departamentoId), cargoId: Number(cargoId), perfil, motivo, vigenciaEm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.erro);
      setConcluido(true);
      try { await onConcluido(); } catch { /* A movimentação já foi registrada. */ }
    } catch(e) { setErro(e instanceof Error ? e.message : t.erro); }
    finally { setSalvando(false); }
  }

  const campo = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-950 dark:text-white";
  return <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="titulo-movimentacao-funcional">
    <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      <h2 className="text-lg font-bold" id="titulo-movimentacao-funcional">{t.titulo}</h2>
      <p className="mt-2 font-semibold">{funcionario.nome} · #{funcionario.id}</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t.aviso}</p>
      {carregando && <p className="mt-4 text-sm">{t.carregando}</p>}
      {previa && !concluido && <div className="mt-4 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium">{t.departamento}
            <select className={`${campo} mt-1`} value={departamentoId} onChange={e => { setDepartamentoId(e.target.value); setCargoId(""); }}>
              <option value="">{t.selecione}</option>
              {departamentos.map(d => <option value={d.id} key={d.id}>{d.nome}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium">{t.cargo}
            <select className={`${campo} mt-1`} value={cargoId} disabled={!departamentoId || carregandoCargos} onChange={e => setCargoId(e.target.value)}>
              <option value="">{t.selecione}</option>
              {cargos.map(c => <option value={c.id} key={c.id}>{c.nome}</option>)}
            </select>
          </label>
        </div>
        <label className="block text-sm font-medium">{t.perfil}
          {previa.temAcesso ? <select className={`${campo} mt-1`} value={perfil} onChange={e => setPerfil(e.target.value)}>
            <option value="MANTER">{t.manter} ({previa.perfil})</option>
            {previa.perfisPermitidos.map(item => <option key={item} value={item}>{rotulosPerfil[item] || item}</option>)}
          </select> : <p className="mt-1 rounded-lg border p-2 text-sm">{t.semAcesso}</p>}
        </label>
        {previa.possuiVinculoDocente && <p className="rounded-lg border border-blue-200 p-3 text-sm dark:border-blue-700">{t.docente}</p>}
        {trocandoPerfilDocente && temPendencias && <p className="rounded-lg border border-amber-300 p-3 text-sm text-amber-800 dark:text-amber-300" role="alert">{t.pendencias} ({conflitos?.turmas} / {conflitos?.disciplinasTurmas} / {conflitos?.sessoesOptativas})</p>}
        <label className="block text-sm font-medium">{t.data}
          <input className={`${campo} mt-1`} type="date" max={dataLocal()} value={vigenciaEm} onChange={e => setVigenciaEm(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">{t.motivo}
          <textarea className={`${campo} mt-1`} rows={3} maxLength={2000} value={motivo} onChange={e => setMotivo(e.target.value)} />
        </label>
      </div>}
      {concluido && <p className="mt-4 rounded-xl border border-emerald-300 p-4 text-sm text-emerald-800 dark:text-emerald-200">{t.concluido}</p>}
      {erro && <p className="mt-4 rounded-lg border border-red-300 p-3 text-sm text-red-700 dark:text-red-300" role="alert">{erro}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="rounded-lg border border-slate-400 px-4 py-2 text-sm font-semibold" disabled={salvando} onClick={onClose}>{concluido ? "OK" : t.cancelar}</button>
        {previa && !concluido && <button type="button" onClick={() => void confirmar()} disabled={salvando || !cargoId || !departamentoId || motivo.trim().length < 5 || (trocandoPerfilDocente && temPendencias)} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{salvando ? t.salvando : t.confirmar}</button>}
      </div>
    </div>
  </div>;
}

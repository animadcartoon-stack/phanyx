"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

type Previa = {
  professorId: number;
  funcionarioId: number;
  nome: string;
  email: string;
  perfilAtual: string;
  perfilNovo: string;
  cargoNovo: string;
  historicosPermissoes: number;
  permissoes: number;
  pendencias: { tipo: string; quantidade: number }[];
  podeCorrigir: boolean;
  motivoBloqueio: string | null;
};

type Resultado = {
  professorIdExcluido: number;
  usuarioProfessorIdInativado: number;
  funcionarioIdPreservado: number;
  usuarioAdministrativoIdCriado: number;
  email: string;
};

const idiomas = {
  "pt-BR": {
    acao: "Corrigir cadastro indevido",
    titulo: "Corrigir professora para administradora",
    explicacao: "Esta operação remove definitivamente o ID de professora, preserva o cadastro de funcionária e cria outro ID de login com perfil ADMIN. O acesso antigo será bloqueado.",
    carregando: "Conferindo vínculos e históricos...",
    erroConsulta: "Não foi possível conferir os vínculos deste cadastro.",
    docente: "ID de professora (será excluído)",
    funcionario: "ID de funcionária (será preservado)",
    perfil: "Novo perfil de login",
    cargo: "Novo cargo de RH",
    email: "E-mail preservado",
    historico: "Os históricos de permissões docentes serão registrados no histórico do RH antes da exclusão.",
    bloqueado: "Esta correção está bloqueada porque existem vínculos ou registros que exigem análise individual:",
    confirmacao: "Para confirmar, digite exatamente CORRIGIR CADASTRO:",
    cancelar: "Cancelar",
    confirmar: "Excluir ID docente e criar ID ADMIN",
    processando: "Corrigindo cadastro...",
    concluido: "Cadastro corrigido com sucesso",
    novoId: "Novo ID administrativo",
    senha: "Para definir a senha, use 'Esqueci minha senha' no login do portal administrativo, com o e-mail existente. Não crie outro funcionário.",
    fechar: "Concluir",
    erro: "Não foi possível corrigir este cadastro.",
  },
  "pt-PT": {
    acao: "Corrigir registo indevido",
    titulo: "Corrigir docente para administradora",
    explicacao: "Esta operação elimina o ID de docente, mantém o registo de funcionária e cria outro ID de acesso com perfil ADMIN. O acesso antigo será bloqueado.",
    carregando: "A verificar vínculos e históricos...",
    erroConsulta: "Não foi possível verificar os vínculos deste registo.",
    docente: "ID de docente (será eliminado)",
    funcionario: "ID de funcionária (será mantido)",
    perfil: "Novo perfil de acesso",
    cargo: "Nova função no RH",
    email: "E-mail mantido",
    historico: "O histórico de permissões docentes será guardado no histórico do RH antes da eliminação.",
    bloqueado: "Existem vínculos ou registos que exigem análise individual:",
    confirmacao: "Para confirmar, escreva exatamente CORRIGIR CADASTRO:",
    cancelar: "Cancelar",
    confirmar: "Eliminar ID docente e criar ID ADMIN",
    processando: "A corrigir registo...",
    concluido: "Registo corrigido com sucesso",
    novoId: "Novo ID administrativo",
    senha: "Para definir a palavra-passe, use 'Esqueci a minha palavra-passe' no acesso administrativo. Não crie outra funcionária.",
    fechar: "Concluir",
    erro: "Não foi possível corrigir este registo.",
  },
  "en-US": {
    acao: "Correct incorrect registration",
    titulo: "Convert teacher registration to administrator",
    explicacao: "This operation deletes the teacher record ID, preserves the employee record, and creates a new ADMIN account ID. The old sign-in is disabled.",
    carregando: "Checking assignments and history...",
    erroConsulta: "Could not verify this registration's dependencies.",
    docente: "Teacher ID (will be deleted)",
    funcionario: "Employee ID (will be preserved)",
    perfil: "New account role",
    cargo: "New HR job title",
    email: "Email retained",
    historico: "The teacher permission history will be copied to the HR history before deletion.",
    bloqueado: "This correction is blocked because some records require individual review:",
    confirmacao: "To confirm, enter exactly CORRIGIR CADASTRO:",
    cancelar: "Cancel",
    confirmar: "Delete teacher ID and create ADMIN ID",
    processando: "Correcting registration...",
    concluido: "Registration corrected",
    novoId: "New administrator ID",
    senha: "To set the password, use 'Forgot password' on the admin login page with the existing email. Do not create another employee.",
    fechar: "Done",
    erro: "Could not safely correct this registration.",
  },
  "es-ES": {
    acao: "Corregir registro incorrecto",
    titulo: "Cambiar registro docente a administradora",
    explicacao: "La operación elimina el ID docente, conserva el registro de empleada y crea otro ID de usuario ADMIN. El acceso anterior quedará bloqueado.",
    carregando: "Comprobando vínculos e historial...",
    erroConsulta: "No se pudieron comprobar los vínculos.",
    docente: "ID docente (se eliminará)",
    funcionario: "ID de empleada (se conservará)",
    perfil: "Nuevo perfil de usuario",
    cargo: "Nuevo cargo en RR. HH.",
    email: "Correo conservado",
    historico: "El historial de permisos docentes se guardará en RR. HH. antes de la eliminación.",
    bloqueado: "Existen vínculos que requieren revisión individual:",
    confirmacao: "Para confirmar, escriba exactamente CORRIGIR CADASTRO:",
    cancelar: "Cancelar",
    confirmar: "Eliminar ID docente y crear ID ADMIN",
    processando: "Corrigiendo registro...",
    concluido: "Registro corregido correctamente",
    novoId: "Nuevo ID administrativo",
    senha: "Para definir la contraseña, utilice 'Olvidé mi contraseña' en el acceso administrativo. No cree otra empleada.",
    fechar: "Finalizar",
    erro: "No se pudo corregir el registro.",
  },
  "fr-FR": {
    acao: "Corriger une inscription erronée",
    titulo: "Transformer le compte enseignant en compte administrateur",
    explicacao: "Cette opération supprime l'ID enseignant, conserve le dossier RH et crée un nouvel ID ADMIN. L'ancien accès est désactivé.",
    carregando: "Vérification des liens et de l'historique...",
    erroConsulta: "Impossible de vérifier les dépendances du dossier.",
    docente: "ID enseignant (sera supprimé)",
    funcionario: "ID employé (sera conservé)",
    perfil: "Nouveau rôle de compte",
    cargo: "Nouvelle fonction RH",
    email: "Adresse e-mail conservée",
    historico: "L'historique des autorisations sera sauvegardé dans l'historique RH avant suppression.",
    bloqueado: "Certains liens nécessitent un examen individuel :",
    confirmacao: "Pour confirmer, saisissez exactement CORRIGIR CADASTRO :",
    cancelar: "Annuler",
    confirmar: "Supprimer l'ID enseignant et créer l'ID ADMIN",
    processando: "Correction en cours...",
    concluido: "Dossier corrigé avec succès",
    novoId: "Nouvel ID administrateur",
    senha: "Pour définir le mot de passe, utilisez 'Mot de passe oublié' sur la page de connexion administrative. Ne recréez pas l'employé.",
    fechar: "Terminer",
    erro: "Impossible de corriger le dossier.",
  },
} as const;

export function rotuloCorrecaoProfessor(locale: string): string {
  const chave = locale in idiomas ? (locale as keyof typeof idiomas) : "en-US";
  return idiomas[chave].acao;
}

export default function CorrecaoProfessorAdminModal({
  professor,
  onClose,
  onConcluido,
}: {
  professor: { id: number; nome: string };
  onClose: () => void;
  onConcluido: () => Promise<void> | void;
}) {
  const locale = useLocale();
  const chave = locale in idiomas ? (locale as keyof typeof idiomas) : "en-US";
  const t = idiomas[chave];
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function carregar() {
      try {
        setCarregando(true);
        const res = await fetch(`/api/admin/professores/${professor.id}/corrigir-para-admin`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || t.erroConsulta);
        setPrevia(data as Previa);
        setErro("");
      } catch (e) {
        if (controller.signal.aborted) return;
        setErro(e instanceof Error ? e.message : t.erroConsulta);
      } finally {
        if (!controller.signal.aborted) setCarregando(false);
      }
    }
    void carregar();
    return () => controller.abort();
  }, [professor.id, t.erroConsulta]);

  async function corrigir() {
    if (!previa || !previa.podeCorrigir || enviando || confirmacao.trim() !== "CORRIGIR CADASTRO") return;
    setEnviando(true);
    setErro("");
    try {
      const res = await fetch(`/api/admin/professores/${professor.id}/corrigir-para-admin`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmacao: "CORRIGIR CADASTRO", funcionarioId: previa.funcionarioId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.erro);
      setResultado(data as Resultado);
      await onConcluido();
    } catch (e) {
      setErro(e instanceof Error ? e.message : t.erro);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="titulo-correcao-professor-admin">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-300 bg-white p-6 text-slate-950 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
        <h2 id="titulo-correcao-professor-admin" className="text-lg font-bold">{t.titulo}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t.explicacao}</p>
        <p className="mt-3 font-semibold">{professor.nome}</p>

        {carregando && <p className="mt-3 text-sm">{t.carregando}</p>}

        {previa && !resultado && (
          <>
            <dl className="mt-4 grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700 sm:grid-cols-2">
              <div><dt className="text-slate-500 dark:text-slate-400">{t.docente}</dt><dd className="font-semibold">#{previa.professorId}</dd></div>
              <div><dt className="text-slate-500 dark:text-slate-400">{t.funcionario}</dt><dd className="font-semibold">#{previa.funcionarioId}</dd></div>
              <div><dt className="text-slate-500 dark:text-slate-400">{t.perfil}</dt><dd className="font-semibold">{previa.perfilNovo}</dd></div>
              <div><dt className="text-slate-500 dark:text-slate-400">{t.cargo}</dt><dd className="font-semibold">{previa.cargoNovo}</dd></div>
              <div className="sm:col-span-2"><dt className="text-slate-500 dark:text-slate-400">{t.email}</dt><dd className="break-all font-semibold">{previa.email}</dd></div>
            </dl>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{t.historico} ({previa.historicosPermissoes} / {previa.permissoes})</p>
            {!previa.podeCorrigir && (
              <div className="mt-4 rounded-lg border border-red-300 p-3 text-sm text-red-800 dark:text-red-300">
                <p>{t.bloqueado}</p>
                {previa.motivoBloqueio && <p className="mt-1">{previa.motivoBloqueio}</p>}
                {previa.pendencias.map((p) => <p key={p.tipo}>{p.tipo}: {p.quantidade}</p>)}
              </div>
            )}
            {previa.podeCorrigir && (
              <label className="mt-4 block text-sm font-semibold">
                {t.confirmacao}
                <input type="text" autoComplete="off" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-950 dark:border-slate-600 dark:bg-slate-950 dark:text-white" />
              </label>
            )}
          </>
        )}

        {resultado && (
          <div className="mt-4 rounded-xl border border-emerald-300 p-4 text-sm dark:border-emerald-700">
            <p className="font-bold text-emerald-800 dark:text-emerald-300">{t.concluido}</p>
            <p className="mt-2">{t.novoId}: <strong>#{resultado.usuarioAdministrativoIdCriado}</strong></p>
            <p>{t.funcionario}: <strong>#{resultado.funcionarioIdPreservado}</strong></p>
            <p className="mt-3">{t.senha}</p>
          </div>
        )}

        {erro && <p className="mt-4 rounded-lg border border-red-300 p-3 text-sm text-red-800 dark:text-red-300" role="alert">{erro}</p>}

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" disabled={enviando} onClick={onClose} className="rounded-lg border border-slate-400 px-4 py-2 text-sm font-semibold disabled:opacity-50">{resultado ? t.fechar : t.cancelar}</button>
          {!resultado && previa?.podeCorrigir && (
            <button type="button" disabled={enviando || confirmacao.trim() !== "CORRIGIR CADASTRO"} onClick={() => void corrigir()} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{enviando ? t.processando : t.confirmar}</button>
          )}
        </div>
      </div>
    </div>
  );
}

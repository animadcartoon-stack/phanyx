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
    acao: "Reclassificar vínculo e acesso",
    titulo: "Reclassificação de vínculo e perfil de acesso",
    explicacao: "Esta operação substitui o cadastro docente por um acesso administrativo. O ID de professora será excluído, o registro de funcionária e o histórico de RH serão preservados, e um novo usuário ADMIN será criado. O login anterior será desativado.",
    carregando: "Conferindo vínculos e históricos...",
    erroConsulta: "Não foi possível conferir os vínculos deste cadastro.",
    docente: "ID de professora (será excluído)",
    funcionario: "ID de funcionária (será preservado)",
    perfil: "Novo perfil de login",
    cargo: "Novo cargo de RH",
    email: "E-mail preservado",
    historico: "Os históricos de permissões docentes serão registrados no histórico do RH antes da exclusão.",
    bloqueado: "A reclassificação requer análise individual porque existem vínculos ou registros associados:",
    confirmacao: "Para confirmar a reclassificação, digite CONFIRMAR:",
    palavraConfirmacao: "CONFIRMAR",
    cancelar: "Cancelar",
    confirmar: "Confirmar reclassificação",
    processando: "Reclassificando vínculo...",
    concluido: "Reclassificação concluída com sucesso",
    novoId: "Novo ID administrativo",
    senha: "Para definir a senha, use 'Esqueci minha senha' no login do portal administrativo, com o e-mail existente. Não crie outro funcionário.",
    fechar: "Concluir",
    erro: "Não foi possível concluir a reclassificação.",
  },
  "pt-PT": {
    acao: "Reclassificar vínculo e acesso",
    titulo: "Reclassificação de vínculo e perfil de acesso",
    explicacao: "Esta operação substitui o registo de docente por um acesso administrativo. O ID de docente será eliminado, o registo de funcionária e o histórico de RH serão mantidos, e será criado um novo utilizador ADMIN. O acesso anterior será desativado.",
    carregando: "A verificar vínculos e históricos...",
    erroConsulta: "Não foi possível verificar os vínculos deste registo.",
    docente: "ID de docente (será eliminado)",
    funcionario: "ID de funcionária (será mantido)",
    perfil: "Novo perfil de acesso",
    cargo: "Nova função no RH",
    email: "E-mail mantido",
    historico: "O histórico de permissões docentes será guardado no histórico do RH antes da eliminação.",
    bloqueado: "A reclassificação requer análise individual devido a vínculos ou registos associados:",
    confirmacao: "Para confirmar a reclassificação, escreva CONFIRMAR:",
    palavraConfirmacao: "CONFIRMAR",
    cancelar: "Cancelar",
    confirmar: "Confirmar reclassificação",
    processando: "A reclassificar vínculo...",
    concluido: "Reclassificação concluída com sucesso",
    novoId: "Novo ID administrativo",
    senha: "Para definir a palavra-passe, use 'Esqueci a minha palavra-passe' no acesso administrativo. Não crie outra funcionária.",
    fechar: "Concluir",
    erro: "Não foi possível concluir a reclassificação.",
  },
  "en-US": {
    acao: "Reclassify role and access",
    titulo: "Role and access reclassification",
    explicacao: "This operation replaces a teacher registration with administrative access. The teacher record ID will be deleted, the employee and HR history retained, and a new ADMIN account created. The previous sign-in will be disabled.",
    carregando: "Checking assignments and history...",
    erroConsulta: "Could not verify this registration's dependencies.",
    docente: "Teacher ID (will be deleted)",
    funcionario: "Employee ID (will be preserved)",
    perfil: "New account role",
    cargo: "New HR job title",
    email: "Email retained",
    historico: "The teacher permission history will be copied to the HR history before deletion.",
    bloqueado: "Reclassification requires individual review because related records exist:",
    confirmacao: "To confirm the reclassification, type CONFIRM:",
    palavraConfirmacao: "CONFIRM",
    cancelar: "Cancel",
    confirmar: "Confirm reclassification",
    processando: "Reclassifying role...",
    concluido: "Reclassification completed successfully",
    novoId: "New administrator ID",
    senha: "To set the password, use 'Forgot password' on the admin login page with the existing email. Do not create another employee.",
    fechar: "Done",
    erro: "Could not complete the reclassification.",
  },
  "es-ES": {
    acao: "Reclasificar vínculo y acceso",
    titulo: "Reclasificación de vínculo y perfil de acceso",
    explicacao: "Esta operación sustituye el registro docente por un acceso administrativo. Se eliminará el ID docente, se conservarán los datos laborales y el historial de RR. HH. y se creará un nuevo usuario ADMIN. El acceso anterior quedará desactivado.",
    carregando: "Comprobando vínculos e historial...",
    erroConsulta: "No se pudieron comprobar los vínculos.",
    docente: "ID docente (se eliminará)",
    funcionario: "ID de empleada (se conservará)",
    perfil: "Nuevo perfil de usuario",
    cargo: "Nuevo cargo en RR. HH.",
    email: "Correo conservado",
    historico: "El historial de permisos docentes se guardará en RR. HH. antes de la eliminación.",
    bloqueado: "La reclasificación requiere una revisión individual debido a vínculos existentes:",
    confirmacao: "Para confirmar la reclasificación, escriba CONFIRMAR:",
    palavraConfirmacao: "CONFIRMAR",
    cancelar: "Cancelar",
    confirmar: "Confirmar reclasificación",
    processando: "Reclasificando vínculo...",
    concluido: "Reclasificación completada correctamente",
    novoId: "Nuevo ID administrativo",
    senha: "Para definir la contraseña, utilice 'Olvidé mi contraseña' en el acceso administrativo. No cree otra empleada.",
    fechar: "Finalizar",
    erro: "No se pudo completar la reclasificación.",
  },
  "fr-FR": {
    acao: "Reclasser le statut et les accès",
    titulo: "Reclassification du statut et des accès",
    explicacao: "Cette opération remplace le dossier enseignant par un accès administratif. L'ID enseignant sera supprimé, le dossier salarié et l'historique RH conservés, et un nouveau compte ADMIN sera créé. L'ancien accès sera désactivé.",
    carregando: "Vérification des liens et de l'historique...",
    erroConsulta: "Impossible de vérifier les dépendances du dossier.",
    docente: "ID enseignant (sera supprimé)",
    funcionario: "ID employé (sera conservé)",
    perfil: "Nouveau rôle de compte",
    cargo: "Nouvelle fonction RH",
    email: "Adresse e-mail conservée",
    historico: "L'historique des autorisations sera sauvegardé dans l'historique RH avant suppression.",
    bloqueado: "La reclassification nécessite un examen individuel en raison de dossiers liés :",
    confirmacao: "Pour confirmer la reclassification, saisissez CONFIRMER :",
    palavraConfirmacao: "CONFIRMER",
    cancelar: "Annuler",
    confirmar: "Confirmer la reclassification",
    processando: "Reclassification en cours...",
    concluido: "Reclassification effectuée avec succès",
    novoId: "Nouvel ID administrateur",
    senha: "Pour définir le mot de passe, utilisez 'Mot de passe oublié' sur la page de connexion administrative. Ne recréez pas l'employé.",
    fechar: "Terminer",
    erro: "Impossible de terminer la reclassification.",
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
    if (!previa || !previa.podeCorrigir || enviando || confirmacao.trim().toLocaleUpperCase(locale) !== t.palavraConfirmacao) return;
    setEnviando(true);
    setErro("");
    try {
      const res = await fetch(`/api/admin/professores/${professor.id}/corrigir-para-admin`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmacao: "RECLASSIFICAR", funcionarioId: previa.funcionarioId }),
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
            <button type="button" disabled={enviando || confirmacao.trim().toLocaleUpperCase(locale) !== t.palavraConfirmacao} onClick={() => void corrigir()} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{enviando ? t.processando : t.confirmar}</button>
          )}
        </div>
      </div>
    </div>
  );
}

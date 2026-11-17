"use client";

import { useState } from "react";
import { useLocale } from "next-intl";

const idiomas = {
  "pt-BR": { titulo: "Enviar credenciais de acesso", descricao: "O PHANYX vai gerar uma nova senha temporária e enviar o login e a senha ao e-mail cadastrado. A senha atual deixará de funcionar. O funcionário deverá trocá-la no primeiro acesso.", confirmar: "Gerar senha e enviar por e-mail", cancelar: "Cancelar", enviando: "Enviando...", enviado: "Novas credenciais enviadas ao e-mail de acesso do funcionário.", erro: "Falha ao enviar as credenciais." },
  "pt-PT": { titulo: "Enviar credenciais de acesso", descricao: "O PHANYX vai gerar uma nova palavra-passe temporária e enviar as credenciais para o e-mail registado. A atual deixa de funcionar e deve ser alterada no primeiro acesso.", confirmar: "Gerar e enviar por e-mail", cancelar: "Cancelar", enviando: "A enviar...", enviado: "Credenciais enviadas para o e-mail do funcionário.", erro: "Falha ao enviar as credenciais." },
  "en-US": { titulo: "Send login credentials", descricao: "PHANYX will generate a new temporary password and email the login and password to the employee. The previous password will stop working; the temporary password must be changed at first sign-in.", confirmar: "Generate and email credentials", cancelar: "Cancel", enviando: "Sending...", enviado: "New credentials sent to the employee's registered email.", erro: "Could not send credentials." },
  "es-ES": { titulo: "Enviar credenciales de acceso", descricao: "PHANYX generará una nueva contraseña temporal y la enviará junto al usuario al correo registrado. La contraseña anterior dejará de funcionar y se deberá cambiar en el primer acceso.", confirmar: "Generar y enviar credenciales", cancelar: "Cancelar", enviando: "Enviando...", enviado: "Credenciales enviadas al correo del empleado.", erro: "No se pudieron enviar las credenciales." },
  "fr-FR": { titulo: "Envoyer les identifiants d'accès", descricao: "PHANYX génère un nouveau mot de passe temporaire et l'envoie avec l'identifiant à l'adresse enregistrée. L'ancien mot de passe ne fonctionnera plus et devra être changé dès la première connexion.", confirmar: "Générer et envoyer", cancelar: "Annuler", enviando: "Envoi...", enviado: "Identifiants envoyés à l'adresse de l'employé.", erro: "Échec de l'envoi des identifiants." },
} as const;

export default function EnviarCredenciaisFuncionarioModal({ funcionario, onClose }: {
  funcionario: { id: number; nome: string; email: string };
  onClose: () => void;
}) {
  const locale = useLocale();
  const t = idiomas[locale as keyof typeof idiomas] || idiomas["en-US"];
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar() {
    setEnviando(true); setErro("");
    try {
      const res = await fetch(`/api/admin/funcionarios/${funcionario.id}/enviar-credenciais`, { method: "POST", credentials: "include" });
      const dados = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(dados.error || t.erro);
      setEnviado(true);
    } catch (e) { setErro(e instanceof Error ? e.message : t.erro); }
    finally { setEnviando(false); }
  }

  return <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="titulo-envio-credenciais-funcionario">
    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      <h2 className="text-lg font-bold" id="titulo-envio-credenciais-funcionario">{t.titulo}</h2>
      <p className="mt-3 font-semibold">{funcionario.nome}</p>
      <p className="mt-1 break-all text-sm text-slate-600 dark:text-slate-300">{funcionario.email}</p>
      {!enviado && <p className="mt-4 rounded-lg border border-amber-200 p-3 text-sm dark:border-amber-700">{t.descricao}</p>}
      {enviado && <p className="mt-4 rounded-lg border border-emerald-300 p-3 text-sm text-emerald-800 dark:text-emerald-200">{t.enviado}</p>}
      {erro && <p className="mt-4 rounded-lg border border-red-300 p-3 text-sm text-red-700 dark:text-red-300" role="alert">{erro}</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onClose} disabled={enviando} className="rounded-lg border border-slate-400 px-4 py-2 text-sm font-semibold">{enviado ? "OK" : t.cancelar}</button>
        {!enviado && <button type="button" onClick={() => void enviar()} disabled={enviando} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{enviando ? t.enviando : t.confirmar}</button>}
      </div>
    </div>
  </div>;
}

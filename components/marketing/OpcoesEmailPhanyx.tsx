"use client";

import { useState } from "react";
import type { LocalePhanyx } from "@/i18n/config";
import { canaisEmailPhanyx, linksEmailPhanyx, type CanalEmailPhanyx } from "@/lib/contatos-phanyx";

const textos = {
  "pt-BR": {
    titulo: "Enviar e-mail ao PHANYX", fechar: "Fechar", gmail: "Abrir Gmail", outlook: "Abrir Outlook",
    aplicativo: "Usar meu aplicativo de e-mail", copiar: "Copiar endereço",
    copiado: "Endereço copiado.", selecione: "Selecione o endereço acima para copiar.",
  },
  "pt-PT": {
    titulo: "Enviar e-mail para a PHANYX", fechar: "Fechar", gmail: "Abrir Gmail", outlook: "Abrir Outlook",
    aplicativo: "Usar a minha aplicação de e-mail", copiar: "Copiar endereço",
    copiado: "Endereço copiado.", selecione: "Selecione o endereço acima para o copiar.",
  },
  "en-US": {
    titulo: "Email PHANYX", fechar: "Close", gmail: "Open Gmail", outlook: "Open Outlook",
    aplicativo: "Use my email app", copiar: "Copy email address",
    copiado: "Email address copied.", selecione: "Select the email address above to copy it.",
  },
  "es-ES": {
    titulo: "Enviar un correo a PHANYX", fechar: "Cerrar", gmail: "Abrir Gmail", outlook: "Abrir Outlook",
    aplicativo: "Usar mi aplicación de correo", copiar: "Copiar dirección",
    copiado: "Dirección copiada.", selecione: "Selecciona la dirección de arriba para copiarla.",
  },
  "fr-FR": {
    titulo: "Écrire à PHANYX", fechar: "Fermer", gmail: "Ouvrir Gmail", outlook: "Ouvrir Outlook",
    aplicativo: "Utiliser mon application de messagerie", copiar: "Copier l’adresse",
    copiado: "Adresse copiée.", selecione: "Sélectionnez l’adresse ci-dessus pour la copier.",
  },
} satisfies Record<LocalePhanyx, Record<"titulo" | "fechar" | "gmail" | "outlook" | "aplicativo" | "copiar" | "copiado" | "selecione", string>>;

export type OpcoesEmailPhanyxProps = {
  canal: CanalEmailPhanyx;
  assunto?: string;
  locale?: LocalePhanyx;
};

export function textosEmailPhanyx(locale: LocalePhanyx) {
  return textos[locale];
}

export default function OpcoesEmailPhanyx({ canal, assunto, locale = "pt-BR" }: OpcoesEmailPhanyxProps) {
  const t = textos[locale];
  const { email } = canaisEmailPhanyx[canal];
  const links = linksEmailPhanyx(canal, assunto);
  const [status, setStatus] = useState("");

  async function copiar() {
    try {
      await navigator.clipboard.writeText(email);
      setStatus(t.copiado);
    } catch {
      setStatus(t.selecione);
    }
  }

  return (
    <div className="space-y-3">
      <p className="select-all break-all font-semibold text-slate-900 dark:text-slate-100">{email}</p>
      <div className="flex flex-wrap gap-2">
        {([["gmail", t.gmail], ["outlook", t.outlook]] as const).map(([provedor, texto]) => (
          <a
            key={provedor}
            href={links[provedor]}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold !text-white hover:bg-blue-600"
          >
            {texto}
          </a>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <a href={links.aplicativo} className="font-semibold !text-blue-700 underline dark:!text-blue-300">
          {t.aplicativo}
        </a>
        <button type="button" onClick={copiar} className="cursor-pointer font-semibold text-blue-700 underline dark:text-blue-300">
          {t.copiar}
        </button>
      </div>
      <p role="status" className="text-sm text-slate-700 empty:hidden dark:text-slate-300">{status}</p>
    </div>
  );
}

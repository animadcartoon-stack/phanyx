import type { LocalePhanyx } from "@/i18n/config";

const helpLinks = {
  "pt-BR": { href: "/ajuda/pt-br", label: "Central de Ajuda", newTab: "abre em uma nova guia" },
  "pt-PT": { href: "/ajuda/pt-pt", label: "Centro de Ajuda", newTab: "abre num novo separador" },
  "en-US": { href: "/ajuda", label: "Help Center", newTab: "opens in a new tab" },
  "es-ES": { href: "/ajuda/es", label: "Centro de ayuda", newTab: "se abre en una pestaña nueva" },
  "fr-FR": { href: "/ajuda/fr", label: "Centre d’aide", newTab: "s’ouvre dans un nouvel onglet" },
} satisfies Record<LocalePhanyx, { href: string; label: string; newTab: string }>;

export default function HelpCenterLink({
  locale,
  className,
}: {
  locale: LocalePhanyx;
  className?: string;
}) {
  const { href, label, newTab } = helpLinks[locale];

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {label}
      <span className="sr-only"> ({newTab})</span>
    </a>
  );
}

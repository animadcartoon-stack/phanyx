import Link from "next/link";
import type { LocalePhanyx } from "@/i18n/config";
import { backgroundRemoverPath } from "@/lib/background-remover-i18n";
import { phanyxPrintPath } from "@/lib/phanyx-print-i18n";

const copyByLocale: Record<
  LocalePhanyx,
  {
    heading: string;
    backgroundLabel: string;
    backgroundDescription: string;
    printDescription: string;
  }
> = {
  "pt-BR": {
    heading: "Ferramentas grátis do PHANYX",
    backgroundLabel: "Removedor de fundo",
    backgroundDescription: "Remova o fundo de uma imagem e salve em PNG transparente.",
    printDescription: "Extensão para capturar uma página inteira ou uma área da tela.",
  },
  "pt-PT": {
    heading: "Ferramentas gratuitas do PHANYX",
    backgroundLabel: "Removedor de fundo",
    backgroundDescription: "Remova o fundo de uma imagem e guarde-a em PNG transparente.",
    printDescription: "Extensão para capturar uma página inteira ou uma área do ecrã.",
  },
  "en-US": {
    heading: "Free tools from PHANYX",
    backgroundLabel: "Background remover",
    backgroundDescription: "Remove an image background and save a transparent PNG.",
    printDescription: "A browser extension for full-page or selected-area screenshots.",
  },
  "es-ES": {
    heading: "Herramientas gratuitas de PHANYX",
    backgroundLabel: "Eliminador de fondos",
    backgroundDescription: "Elimina el fondo de una imagen y guárdala como PNG transparente.",
    printDescription: "Extensión para capturar una página completa o un área de la pantalla.",
  },
  "fr-FR": {
    heading: "Outils gratuits de PHANYX",
    backgroundLabel: "Suppression d’arrière-plan",
    backgroundDescription: "Supprimez l’arrière-plan d’une image et exportez-la en PNG transparent.",
    printDescription: "Extension pour capturer une page entière ou une zone de l’écran.",
  },
};

export default function FreeToolsPromo({ locale }: { locale: LocalePhanyx }) {
  const copy = copyByLocale[locale];
  const tools = [
    {
      href: backgroundRemoverPath(locale),
      label: copy.backgroundLabel,
      description: copy.backgroundDescription,
    },
    {
      href: phanyxPrintPath(locale),
      label: "PHANYX Print",
      description: copy.printDescription,
    },
  ];

  return (
    <section aria-labelledby="free-tools-heading" className="border-b border-blue-200 bg-blue-50">
      <div className="mx-auto max-w-7xl px-5 py-7 md:px-10 lg:px-12">
        <h2 id="free-tools-heading" className="text-xl font-bold text-slate-950">
          {copy.heading}
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {tools.map(({ href, label, description }) => (
            <li key={href}>
              <Link
                href={href}
                prefetch={false}
                className="flex h-full items-start justify-between gap-4 rounded-xl border border-blue-200 bg-white px-4 py-3 transition hover:border-blue-400 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                <div>
                  <span className="block font-semibold text-blue-800">{label}</span>
                  <span className="mt-1 block text-sm leading-5 text-slate-700">{description}</span>
                </div>
                <span aria-hidden="true" className="shrink-0 font-semibold text-blue-800">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

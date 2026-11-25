"use client";

import Link from "next/link";
import Image from "next/image";
import HelpCenterLink from "./HelpCenterLink";
import ContatoEmailLink from "@/components/marketing/ContatoEmailLink";
import { emailContatoPhanyx, emailSuportePhanyx } from "@/lib/contatos-phanyx";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 lg:px-12">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="hidden md:flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-sm">
                <Image
                  src="/icon.png"
                  alt="PHANYX"
                  fill
                  className="object-contain p-1.5"
                />
              </div>

              <div>
                <div className="text-[15px] font-bold tracking-[0.18em] text-white">
                  PHANYX
                </div>
                <div className="text-[11px] text-slate-400">
                  Plataforma acadêmica SaaS
                </div>
              </div>
            </div>

            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400 md:leading-7">
              Plataforma acadêmica SaaS para instituições que buscam gestão,
              ensino digital, segurança institucional e escalabilidade real.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">
              Produto
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
              <Link href="/planos" className="transition hover:text-white">
                Planos
              </Link>
              <Link href="/aluno" className="transition hover:text-white">
                Área do aluno
              </Link>
              <Link href="/professor" className="transition hover:text-white">
                Área do professor
              </Link>
              <Link href="/login" className="transition hover:text-white">
                Login administrativo
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">
              Empresa
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
              <Link href="/suporte" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">
                Suporte
              </Link>
              <HelpCenterLink locale="pt-BR" className="transition hover:text-white" />

              <ContatoEmailLink
                canal="comercial"
                className="transition hover:text-white"
              >
                Falar com comercial
              </ContatoEmailLink>

              <Link href="/politica-de-privacidade" className="transition hover:text-white">
                Política de privacidade
              </Link>

              <Link href="/termos-de-uso" className="transition hover:text-white">
                Termos de uso
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">
              Contato
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
              <ContatoEmailLink
                canal="comercial"
                className="transition hover:text-white"
              >
                {emailContatoPhanyx}
              </ContatoEmailLink>

              <ContatoEmailLink
                canal="suporte"
                className="transition hover:text-white"
              >
                {emailSuportePhanyx}
              </ContatoEmailLink>

              <span>São José / SC • Brasil</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 PHANYX. Todos os direitos reservados.</p>
          <p>Gestão acadêmica, EAD, documentos e segurança institucional.</p>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import OpcoesEmailPhanyx from "@/components/marketing/OpcoesEmailPhanyx";
import type { CanalEmailPhanyx } from "@/lib/contatos-phanyx";

type Props = {
  titulo: string;
  orientacao: string;
  canal: CanalEmailPhanyx;
};

export default function PaginaInstitucionalPhanyx({ titulo, orientacao, canal }: Props) {
  return (
    <>
      <Header />

      <main lang="pt-BR" className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto max-w-3xl px-6 py-12 sm:py-20">
          <h1 className="text-3xl font-bold sm:text-4xl">{titulo}</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-700 dark:text-slate-300">
            A versão pública deste documento está em preparação.
          </p>

          <section className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold">Fale com o PHANYX</h2>
            <p className="max-w-xl leading-7 text-slate-700 dark:text-slate-300">{orientacao}</p>
            <OpcoesEmailPhanyx canal={canal} assunto={titulo} />
          </section>

          <Link href="/" className="mt-8 inline-block font-semibold !text-blue-700 underline dark:!text-blue-300">
            Voltar à página inicial
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}

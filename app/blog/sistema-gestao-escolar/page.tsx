import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Melhor sistema de gestão escolar em 2026",
  description:
    "Veja como escolher o melhor sistema de gestão escolar para sua instituição. Compare recursos e descubra a melhor plataforma.",
};

export default function ArticlePage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-4xl px-6 py-20">

          <h1 className="text-4xl font-bold mb-6">
            Melhor sistema de gestão escolar em 2026
          </h1>

          <p className="text-lg text-slate-600 mb-6">
            Escolher o melhor sistema de gestão escolar é uma decisão essencial para o crescimento de qualquer instituição de ensino.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">
            O que é um sistema de gestão escolar
          </h2>

          <p className="text-slate-600 mb-6">
            Um sistema de gestão escolar é uma plataforma que centraliza todas as operações da instituição, incluindo alunos, professores, financeiro e acadêmico.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">
            Principais funcionalidades
          </h2>

          <ul className="list-disc ml-6 text-slate-600 mb-6">
            <li>Cadastro de alunos e professores</li>
            <li>Controle financeiro</li>
            <li>Gestão acadêmica</li>
            <li>Plataforma EAD integrada</li>
            <li>Certificados automáticos</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-10 mb-4">
            Como escolher o melhor sistema
          </h2>

          <p className="text-slate-600 mb-6">
            Avalie recursos, facilidade de uso, suporte e escalabilidade antes de escolher um sistema.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">
            PHANYX como solução completa
          </h2>

          <p className="text-slate-600 mb-6">
            O PHANYX é uma plataforma completa que reúne gestão escolar, acadêmica e EAD em um único sistema.
          </p>

          <a
            href="/"
            className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Conhecer o PHANYX
          </a>

        </section>
      </main>

      <Footer />
    </>
  );
}
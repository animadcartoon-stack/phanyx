import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Plataforma para ensino online | PHANYX",
  description:
    "Veja como escolher uma plataforma para ensino online e estruturar cursos digitais com qualidade.",
};

export default function PlataformaEnsinoOnlinePage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Plataforma para ensino online
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            O ensino online se tornou essencial para instituições que desejam
            crescer e alcançar mais alunos. Para isso, é fundamental contar com
            uma plataforma que permita organizar conteúdos, acompanhar alunos e
            estruturar cursos digitais de forma profissional.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            O que é uma plataforma de ensino online
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            É um sistema que permite criar cursos, publicar aulas, acompanhar o
            progresso dos alunos e oferecer uma experiência completa de ensino digital.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Principais funcionalidades
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Publicação de aulas e conteúdos</li>
            <li>Controle de alunos</li>
            <li>Atividades e avaliações</li>
            <li>Relatórios de progresso</li>
            <li>Certificados automáticos</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            Benefícios do ensino online
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O ensino online permite alcançar mais alunos, reduzir custos e
            oferecer flexibilidade, tornando-se uma das principais estratégias
            de crescimento para instituições de ensino.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como plataforma de ensino online
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX oferece uma plataforma completa para ensino online,
            integrando gestão acadêmica, financeiro e EAD em uma única solução.
          </p>

          <a
            href="/plataforma-ead"
            className="mt-6 inline-block text-blue-600 underline"
          >
            Conheça a plataforma EAD do PHANYX
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
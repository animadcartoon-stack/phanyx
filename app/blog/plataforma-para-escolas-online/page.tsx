import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Plataforma para escolas online | PHANYX",
  description:
    "Descubra como funciona uma plataforma para escolas online e veja como organizar ensino, gestão e experiência do aluno em um só lugar.",
};

export default function PlataformaParaEscolasOnlinePage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Plataforma para escolas online
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Uma plataforma para escolas online permite organizar aulas,
            conteúdos, alunos, professores e gestão acadêmica em um ambiente
            digital mais moderno, escalável e profissional.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            O que é uma plataforma para escolas online
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Trata-se de um sistema que combina ensino digital com gestão
            escolar, permitindo que instituições operem com mais controle,
            flexibilidade e alcance.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Principais funcionalidades
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Aulas e conteúdos digitais</li>
            <li>Controle de alunos e professores</li>
            <li>Gestão acadêmica integrada</li>
            <li>Atividades e avaliações online</li>
            <li>Relatórios e acompanhamento de progresso</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            Benefícios para instituições
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Com uma plataforma online, a instituição amplia seu alcance,
            melhora a organização da operação e oferece uma experiência mais
            moderna para toda a comunidade escolar.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como plataforma completa
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX oferece uma plataforma para escolas online que reúne
            gestão escolar, gestão acadêmica, plataforma EAD, financeiro e
            documentos em uma única solução.
          </p>

          <a
            href="/plataforma-ead"
            className="mt-6 inline-block text-blue-600 underline"
          >
            Conheça a plataforma online do PHANYX
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
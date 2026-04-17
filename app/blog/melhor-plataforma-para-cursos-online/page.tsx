import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Melhor plataforma para cursos online | PHANYX",
  description:
    "Descubra qual é a melhor plataforma para cursos online e veja como escolher a solução ideal para seu negócio.",
};

export default function MelhorPlataformaCursosPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Qual é a melhor plataforma para cursos online?
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Escolher a melhor plataforma para cursos online é essencial para quem
            deseja criar, vender e escalar cursos digitais com qualidade e organização.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            O que uma boa plataforma precisa ter
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Uma plataforma completa deve oferecer estrutura para criação de cursos,
            controle de alunos, acompanhamento de progresso, avaliações e uma
            experiência simples para o usuário.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Principais funcionalidades
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Publicação de aulas e conteúdos</li>
            <li>Controle de alunos</li>
            <li>Atividades e avaliações</li>
            <li>Relatórios de desempenho</li>
            <li>Certificados automáticos</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            Plataforma isolada vs sistema completo
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Muitas plataformas focam apenas no ensino online, mas não oferecem
            gestão acadêmica e financeira. Um sistema completo permite controlar
            toda a operação em um único ambiente.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como plataforma completa
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX reúne plataforma EAD, gestão acadêmica, financeiro e operação
            institucional em uma única solução, ideal para quem deseja crescer com
            cursos online de forma profissional.
          </p>

          <a
            href="/plataforma-ead"
            className="mt-6 inline-block text-blue-600 underline"
          >
            Conheça a plataforma do PHANYX
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
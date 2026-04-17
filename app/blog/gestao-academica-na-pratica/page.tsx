import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Gestão acadêmica na prática | PHANYX",
  description:
    "Entenda como aplicar gestão acadêmica na prática e melhorar a organização da sua instituição de ensino.",
};

export default function GestaoAcademicaPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Gestão acadêmica na prática
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            A gestão acadêmica é um dos pilares mais importantes de uma
            instituição de ensino. Quando bem estruturada, ela garante
            organização, eficiência e melhor experiência para alunos e professores.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            O que é gestão acadêmica
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            A gestão acadêmica envolve o controle de alunos, professores,
            turmas, disciplinas, notas, frequência e toda a organização
            pedagógica da instituição.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Principais desafios
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Organização de turmas e disciplinas</li>
            <li>Controle de notas e avaliações</li>
            <li>Gestão de frequência</li>
            <li>Comunicação com alunos</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            Como aplicar na prática
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Utilizar um sistema de gestão acadêmica permite centralizar todas
            essas informações, reduzir erros e facilitar o trabalho da equipe
            pedagógica.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como solução acadêmica
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX oferece um sistema completo para gestão acadêmica,
            permitindo controle total da instituição com mais organização e
            eficiência.
          </p>

          <a
            href="/gestao-academica"
            className="mt-6 inline-block text-blue-600 underline"
          >
            Conheça a gestão acadêmica do PHANYX
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
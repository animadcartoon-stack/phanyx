import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Sistema acadêmico completo | PHANYX",
  description:
    "Descubra como um sistema acadêmico completo pode transformar a gestão de instituições de ensino.",
};

export default function SistemaAcademicoCompletoPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Sistema acadêmico completo
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Um sistema acadêmico completo é essencial para instituições que
            desejam organizar suas operações, melhorar a produtividade e
            oferecer uma experiência moderna para alunos e professores.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            O que é um sistema acadêmico
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Trata-se de uma plataforma que gerencia todas as informações
            acadêmicas, como disciplinas, turmas, notas, avaliações e histórico
            dos alunos.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Principais funcionalidades
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Gestão de disciplinas e turmas</li>
            <li>Controle de notas e avaliações</li>
            <li>Histórico escolar</li>
            <li>Gestão de professores</li>
            <li>Relatórios acadêmicos</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            Benefícios para instituições
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Com um sistema completo, a instituição ganha organização,
            agilidade e controle sobre todos os processos acadêmicos.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como sistema acadêmico
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX é um sistema acadêmico completo que integra gestão
            escolar, ensino digital e financeiro em uma única plataforma.
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
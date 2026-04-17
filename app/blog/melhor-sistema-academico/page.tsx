import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Melhor sistema acadêmico em 2026 | PHANYX",
  description:
    "Descubra qual é o melhor sistema acadêmico e como escolher a plataforma ideal para sua instituição de ensino.",
};

export default function MelhorSistemaAcademicoPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Qual é o melhor sistema acadêmico em 2026?
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Escolher o melhor sistema acadêmico é essencial para instituições
            que desejam organizar cursos, alunos, turmas e toda a estrutura
            pedagógica de forma eficiente e escalável.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            O que é um sistema acadêmico
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Um sistema acadêmico é uma plataforma que gerencia toda a estrutura
            educacional, incluindo matrículas, disciplinas, turmas, notas,
            frequência e histórico escolar.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Principais funcionalidades
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Gestão de alunos e matrículas</li>
            <li>Controle de disciplinas e turmas</li>
            <li>Registro de notas e avaliações</li>
            <li>Controle de frequência</li>
            <li>Relatórios acadêmicos</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            Como escolher o melhor sistema acadêmico
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Avalie facilidade de uso, integração com financeiro e EAD,
            suporte, estabilidade e capacidade de crescimento da plataforma.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como sistema acadêmico completo
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX oferece um sistema acadêmico completo integrado com gestão
            escolar, financeiro e plataforma EAD, permitindo controle total da
            instituição em um único ambiente.
          </p>

          <a
            href="/gestao-academica"
            className="mt-6 inline-block text-blue-600 underline"
          >
            Conheça o sistema acadêmico do PHANYX
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
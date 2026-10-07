import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Melhor sistema acadÃƒÂªmico em 2027 | PHANYX",
  description:
    "Descubra qual ÃƒÂ© o melhor sistema acadÃƒÂªmico e como escolher a plataforma ideal para sua instituiÃƒÂ§ÃƒÂ£o de ensino.",
};

export default function MelhorSistemaAcademicoPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Qual ÃƒÂ© o melhor sistema acadÃƒÂªmico em 2027?
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Escolher o melhor sistema acadÃƒÂªmico ÃƒÂ© essencial para instituiÃƒÂ§ÃƒÂµes
            que desejam organizar cursos, alunos, turmas e toda a estrutura
            pedagÃƒÂ³gica de forma eficiente e escalÃƒÂ¡vel.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            O que ÃƒÂ© um sistema acadÃƒÂªmico
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Um sistema acadÃƒÂªmico ÃƒÂ© uma plataforma que gerencia toda a estrutura
            educacional, incluindo matrÃƒÂ­culas, disciplinas, turmas, notas,
            frequÃƒÂªncia e histÃƒÂ³rico escolar.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Principais funcionalidades
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>GestÃƒÂ£o de alunos e matrÃƒÂ­culas</li>
            <li>Controle de disciplinas e turmas</li>
            <li>Registro de notas e avaliaÃƒÂ§ÃƒÂµes</li>
            <li>Controle de frequÃƒÂªncia</li>
            <li>RelatÃƒÂ³rios acadÃƒÂªmicos</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            Como escolher o melhor sistema acadÃƒÂªmico
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Avalie facilidade de uso, integraÃƒÂ§ÃƒÂ£o com financeiro e EAD,
            suporte, estabilidade e capacidade de crescimento da plataforma.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como sistema acadÃƒÂªmico completo
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX oferece um sistema acadÃƒÂªmico completo integrado com gestÃƒÂ£o
            escolar, financeiro e plataforma EAD, permitindo controle total da
            instituiÃƒÂ§ÃƒÂ£o em um ÃƒÂºnico ambiente.
          </p>

          <a
            href="/gestao-academica"
            className="mt-6 inline-block text-blue-600 underline"
          >
            ConheÃƒÂ§a o sistema acadÃƒÂªmico do PHANYX
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
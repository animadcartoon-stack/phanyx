import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Sistema para cursos profissionalizantes | PHANYX",
  description:
    "Descubra o melhor sistema para cursos profissionalizantes e como organizar alunos, aulas e gestão acadêmica.",
};

export default function SistemaCursosPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Sistema para cursos profissionalizantes
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Cursos profissionalizantes exigem organização, controle de alunos,
            acompanhamento de aulas e gestão eficiente para garantir qualidade
            e crescimento da instituição.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            O que um sistema para cursos precisa ter
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Um bom sistema deve permitir gestão de turmas, matrículas, professores,
            frequência, avaliações e emissão de certificados.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Principais funcionalidades
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Controle de alunos e matrículas</li>
            <li>Gestão de turmas e cursos</li>
            <li>Acompanhamento de frequência</li>
            <li>Provas e avaliações</li>
            <li>Certificados automáticos</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            Desafios dos cursos profissionalizantes
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Sem um sistema adequado, a instituição pode enfrentar problemas
            como desorganização, perda de dados e dificuldade para escalar.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como solução completa
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX oferece um sistema completo para cursos profissionalizantes,
            integrando gestão acadêmica, financeiro e ensino digital em uma única
            plataforma moderna.
          </p>

          <a
            href="/software-para-cursos"
            className="mt-6 inline-block text-blue-600 underline"
          >
            Conheça o sistema para cursos do PHANYX
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
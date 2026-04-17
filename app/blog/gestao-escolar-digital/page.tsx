import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Gestão escolar digital | PHANYX",
  description:
    "Entenda o que é gestão escolar digital e como modernizar sua instituição com tecnologia.",
};

export default function GestaoEscolarDigitalPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Gestão escolar digital
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            A gestão escolar digital é o uso de tecnologia para organizar,
            controlar e melhorar todos os processos de uma instituição de ensino.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            O que é gestão escolar digital
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Trata-se da substituição de processos manuais por sistemas digitais,
            permitindo maior eficiência, controle e tomada de decisão.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Principais vantagens
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Automatização de processos</li>
            <li>Redução de erros</li>
            <li>Maior controle acadêmico</li>
            <li>Melhor gestão financeira</li>
            <li>Relatórios em tempo real</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            Impacto na instituição
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            A digitalização melhora a organização interna, aumenta a
            produtividade e oferece uma experiência mais moderna para alunos e professores.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como solução digital
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX é uma plataforma completa de gestão escolar digital,
            integrando todas as áreas da instituição em um único sistema.
          </p>

          <a
            href="/sistema-escolar"
            className="mt-6 inline-block text-blue-600 underline"
          >
            Conheça o sistema escolar do PHANYX
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
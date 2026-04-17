import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Software para gestão escolar | PHANYX",
  description:
    "Descubra como um software para gestão escolar pode transformar a organização e o crescimento da sua instituição.",
};

export default function SoftwareGestaoEscolarPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Software para gestão escolar
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Um software para gestão escolar permite organizar todos os processos
            da instituição, desde o controle de alunos até a gestão financeira,
            trazendo mais eficiência e profissionalismo.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            O que é um software de gestão escolar
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            É uma plataforma que centraliza informações acadêmicas, administrativas
            e financeiras, permitindo uma gestão integrada e mais eficiente.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Principais funcionalidades
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Gestão de alunos e matrículas</li>
            <li>Controle financeiro</li>
            <li>Gestão acadêmica</li>
            <li>Relatórios e indicadores</li>
            <li>Plataforma EAD integrada</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            Benefícios para a instituição
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            A utilização de um software reduz erros, melhora a produtividade e
            proporciona uma visão completa da operação da instituição.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como solução completa
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX é um software completo para gestão escolar, reunindo
            administração, ensino digital e financeiro em uma única plataforma.
          </p>

          <a
            href="/sistema-escolar"
            className="mt-6 inline-block text-blue-600 underline"
          >
            Conheça o sistema do PHANYX
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
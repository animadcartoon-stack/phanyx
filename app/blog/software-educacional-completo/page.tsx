import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Software educacional completo | PHANYX",
  description:
    "Descubra o que é um software educacional completo e como ele pode transformar a gestão de instituições de ensino.",
};

export default function SoftwareEducacionalPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Software educacional completo
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Um software educacional completo é uma solução que integra todas as
            áreas de uma instituição de ensino, permitindo mais organização,
            eficiência e crescimento estruturado.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            O que é um software educacional
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Trata-se de uma plataforma que reúne gestão acadêmica, controle
            financeiro, organização de alunos e professores, além de recursos
            para ensino digital.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Principais funcionalidades
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Gestão de alunos e matrículas</li>
            <li>Controle financeiro</li>
            <li>Gestão acadêmica completa</li>
            <li>Plataforma EAD</li>
            <li>Relatórios e indicadores</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            Benefícios para instituições
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Com um sistema completo, a instituição ganha produtividade, reduz
            erros, melhora a comunicação e oferece uma experiência mais moderna
            para alunos e professores.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como software educacional
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX é um software educacional completo que integra todas as
            áreas da instituição em uma única plataforma moderna, escalável e
            fácil de usar.
          </p>

          <a href="/" className="mt-6 inline-block text-blue-600 underline">
            Conheça o PHANYX
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
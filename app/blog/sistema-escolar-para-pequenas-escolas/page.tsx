import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Sistema escolar para pequenas escolas | PHANYX",
  description:
    "Veja como escolher um sistema escolar para pequenas escolas e organizar sua instituição com mais eficiência.",
};

export default function SistemaPequenasEscolasPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Sistema escolar para pequenas escolas
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Pequenas escolas precisam de organização e controle para crescer,
            mas nem sempre contam com grandes equipes ou estruturas complexas.
            Por isso, um sistema escolar simples e eficiente faz toda a diferença.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Desafios das pequenas escolas
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Falta de organização, uso de planilhas, controle manual de alunos e
            financeiro são alguns dos principais desafios enfrentados por
            instituições menores.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            O que um sistema ideal precisa ter
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Cadastro simples de alunos</li>
            <li>Controle financeiro básico</li>
            <li>Gestão de turmas</li>
            <li>Relatórios claros</li>
            <li>Facilidade de uso</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            Benefícios para pequenas instituições
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Com um sistema adequado, a escola ganha organização, reduz erros,
            melhora o atendimento e consegue crescer de forma estruturada.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como solução acessível
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX é um sistema completo que atende desde pequenas escolas até
            instituições maiores, oferecendo uma plataforma simples de usar e
            preparada para crescimento.
          </p>

          <a
            href="/planos"
            className="mt-6 inline-block text-blue-600 underline"
          >
            Conheça os planos do PHANYX
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
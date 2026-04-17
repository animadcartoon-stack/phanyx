import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Controle financeiro para escolas | PHANYX",
  description:
    "Aprenda como fazer controle financeiro para escolas e melhorar a gestão da sua instituição de ensino.",
};

export default function ControleFinanceiroPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Controle financeiro para escolas
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            O controle financeiro é fundamental para a sustentabilidade de
            qualquer instituição de ensino. Sem organização, a escola pode
            enfrentar dificuldades para crescer e manter suas operações.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            O que é controle financeiro escolar
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Trata-se do acompanhamento de receitas, despesas, mensalidades,
            inadimplência e fluxo de caixa da instituição.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Principais desafios
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Falta de organização</li>
            <li>Controle manual</li>
            <li>Atrasos de pagamento</li>
            <li>Dificuldade de análise</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            Como melhorar o controle financeiro
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Utilizar um sistema de gestão financeira permite automatizar processos,
            gerar relatórios e acompanhar tudo em tempo real.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Benefícios da automação
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Mais controle e organização</li>
            <li>Redução de erros</li>
            <li>Melhor tomada de decisão</li>
            <li>Visão estratégica</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como solução financeira
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX oferece um sistema financeiro completo para escolas,
            permitindo controlar mensalidades, inadimplência, fluxo de caixa
            e relatórios de forma simples e eficiente.
          </p>

          <a
            href="/admin/financeiro"
            className="mt-6 inline-block text-blue-600 underline"
          >
            Conheça o controle financeiro do PHANYX
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
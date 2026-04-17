import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Como reduzir inadimplência escolar com tecnologia | PHANYX",
  description:
    "Veja como reduzir inadimplência escolar utilizando tecnologia e sistemas de gestão financeira para instituições de ensino.",
};

export default function InadimplenciaPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Como reduzir inadimplência escolar com tecnologia
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            A inadimplência é um dos maiores desafios financeiros das instituições
            de ensino. A falta de controle e acompanhamento pode gerar prejuízos
            e dificultar o crescimento da escola ou curso.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Por que a inadimplência acontece
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Atrasos no pagamento podem ocorrer por diversos fatores, como falta
            de organização financeira, ausência de lembretes, dificuldade de
            pagamento e processos manuais que dificultam o controle.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Como a tecnologia pode ajudar
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Sistemas modernos permitem automatizar cobranças, enviar lembretes,
            controlar pagamentos e acompanhar a situação financeira dos alunos
            em tempo real.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Benefícios de um sistema integrado
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Redução de atrasos</li>
            <li>Melhor controle financeiro</li>
            <li>Automação de cobranças</li>
            <li>Relatórios e indicadores</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como solução financeira
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX oferece um módulo financeiro completo com controle de
            inadimplência, geração de cobranças e acompanhamento em tempo real,
            ajudando instituições a manterem saúde financeira.
          </p>

          <a
            href="/admin/financeiro"
            className="mt-6 inline-block text-blue-600 underline"
          >
            Conheça o módulo financeiro do PHANYX
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
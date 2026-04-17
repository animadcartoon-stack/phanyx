import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Como vender cursos online | PHANYX",
  description:
    "Aprenda como vender cursos online e estruturar seu negócio digital com uma plataforma completa.",
};

export default function VenderCursosPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Como vender cursos online
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Vender cursos online se tornou uma das principais formas de gerar
            renda no mercado educacional. Com a estrutura certa, é possível
            criar, organizar e escalar cursos digitais com consistência.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Estrutura básica para vender cursos online
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Para vender cursos, você precisa de conteúdo estruturado, uma
            plataforma para hospedar aulas e um sistema que permita gerenciar
            alunos, pagamentos e acesso.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Escolha da plataforma
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            A plataforma escolhida deve permitir publicação de aulas,
            acompanhamento de alunos, avaliações e controle completo da operação.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Estratégias de venda
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Marketing digital</li>
            <li>Conteúdo gratuito</li>
            <li>Redes sociais</li>
            <li>Parcerias</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            Escalando seu negócio
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Com um sistema estruturado, você pode automatizar processos e crescer
            sem aumentar a complexidade da operação.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como solução completa
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX oferece uma plataforma completa para criação e venda de
            cursos online, integrando gestão acadêmica, financeiro e ensino
            digital em um único sistema.
          </p>

          <a
            href="/plataforma-ead"
            className="mt-6 inline-block text-blue-600 underline"
          >
            Conheça a plataforma do PHANYX
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
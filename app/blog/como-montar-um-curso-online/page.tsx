import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Como montar um curso online | PHANYX",
  description:
    "Aprenda como montar um curso online passo a passo e estruturar sua operação digital com uma plataforma completa.",
};

export default function MontarCursoPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Como montar um curso online
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Criar um curso online é uma excelente oportunidade para gerar renda
            e compartilhar conhecimento. Com a estrutura certa, é possível
            construir um negócio digital escalável.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Definição do conteúdo
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O primeiro passo é definir o tema do curso, público-alvo e estrutura
            das aulas, organizando o conteúdo de forma clara e progressiva.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Produção das aulas
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            As aulas podem ser em vídeo, texto ou materiais complementares,
            dependendo da proposta do curso e da experiência desejada.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Escolha da plataforma
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            É essencial escolher uma plataforma que permita organizar conteúdos,
            gerenciar alunos e acompanhar o progresso.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Estrutura de vendas
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Para vender o curso, é necessário estruturar páginas de venda,
            meios de pagamento e estratégias de divulgação.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como solução completa
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX oferece uma plataforma completa para criação, gestão e
            venda de cursos online, integrando ensino, financeiro e gestão
            acadêmica em um único sistema.
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
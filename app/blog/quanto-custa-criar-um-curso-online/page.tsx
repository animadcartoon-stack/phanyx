import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Quanto custa criar um curso online | PHANYX",
  description:
    "Descubra quanto custa criar um curso online e quais são os principais investimentos para estruturar seu negócio digital.",
};

export default function CustoCursoOnlinePage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Quanto custa criar um curso online
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Criar um curso online pode ter custos variados, dependendo da
            estrutura, ferramentas e nível de profissionalização do projeto.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Principais custos envolvidos
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Equipamentos (câmera, áudio)</li>
            <li>Produção de conteúdo</li>
            <li>Plataforma de ensino</li>
            <li>Marketing e divulgação</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            Curso simples vs profissional
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Um curso simples pode ser criado com baixo investimento, enquanto
            um curso profissional exige estrutura mais robusta e planejamento.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Reduzindo custos com tecnologia
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Utilizar uma plataforma completa evita gastos com várias ferramentas
            separadas e facilita a gestão do curso.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como solução completa
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX oferece uma estrutura completa para criação e venda de cursos
            online, integrando ensino, financeiro e gestão em uma única plataforma.
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
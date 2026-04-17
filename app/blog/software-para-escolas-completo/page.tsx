import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Software para escolas completo | PHANYX",
  description:
    "Descubra o melhor software para escolas. Veja como um sistema completo pode transformar a gestão educacional.",
};

export default function SoftwareEscolasPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Software para escolas completo
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Um software para escolas completo é essencial para instituições que
            desejam organizar sua operação acadêmica, financeira e administrativa
            de forma eficiente e profissional.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            O que é um software para escolas
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Trata-se de um sistema que permite gerenciar alunos, professores,
            turmas, financeiro, documentos e todo o funcionamento da instituição
            em uma única plataforma.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Principais funcionalidades
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Cadastro de alunos e professores</li>
            <li>Controle financeiro</li>
            <li>Gestão acadêmica completa</li>
            <li>Relatórios e indicadores</li>
            <li>Plataforma EAD integrada</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            Benefícios para a instituição
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Com um sistema completo, a instituição reduz retrabalho, melhora a
            organização, aumenta produtividade e oferece uma experiência melhor
            para alunos e professores.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como solução completa
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX é um software completo para escolas que reúne gestão
            acadêmica, financeiro, EAD e documentos em uma única plataforma
            moderna e escalável.
          </p>

          <a
            href="/sistema-escolar"
            className="mt-6 inline-block text-blue-600 underline"
          >
            Conheça o sistema completo do PHANYX
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
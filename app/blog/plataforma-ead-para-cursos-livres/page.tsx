import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Plataforma EAD para cursos livres | PHANYX",
  description:
    "Descubra a melhor plataforma EAD para cursos livres. Veja como estruturar cursos online com gestão completa.",
};

export default function PlataformaEadCursosLivresPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Plataforma EAD para cursos livres
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Cursos livres e profissionalizantes cresceram muito nos últimos anos.
            Para acompanhar essa evolução, é essencial contar com uma plataforma
            EAD que permita organizar conteúdos, alunos e toda a operação.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            O que é uma plataforma EAD para cursos livres
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            É uma solução que permite criar cursos online, publicar aulas,
            acompanhar alunos e estruturar o ensino digital de forma profissional.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Recursos essenciais
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Publicação de aulas e conteúdos</li>
            <li>Controle de alunos</li>
            <li>Atividades e avaliações</li>
            <li>Certificados automáticos</li>
            <li>Relatórios de progresso</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            Por que usar uma plataforma integrada
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Usar ferramentas separadas pode gerar retrabalho. Uma plataforma
            integrada permite controlar gestão acadêmica, financeiro e ensino
            online em um único sistema.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como solução para cursos livres
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX oferece uma plataforma completa para cursos livres,
            integrando gestão escolar, EAD, financeiro e documentos em uma única
            solução profissional.
          </p>

          <a
            href="/plataforma-ead"
            className="mt-6 inline-block text-blue-600 underline"
          >
            Conheça a plataforma EAD do PHANYX
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
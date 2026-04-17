import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Sistema de gestão escolar online | PHANYX",
  description:
    "Conheça um sistema de gestão escolar online completo e veja como organizar sua instituição com tecnologia.",
};

export default function SistemaOnlinePage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Sistema de gestão escolar online
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Um sistema de gestão escolar online permite que instituições de ensino
            organizem sua operação de forma digital, acessível e eficiente, sem
            depender de processos manuais ou planilhas.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            O que é um sistema escolar online
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Trata-se de uma plataforma acessível pela internet que permite gerenciar
            alunos, professores, turmas, financeiro e toda a estrutura acadêmica
            da instituição.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Vantagens do sistema online
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Acesso de qualquer lugar</li>
            <li>Dados centralizados</li>
            <li>Mais segurança</li>
            <li>Redução de erros</li>
            <li>Escalabilidade</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            Diferença entre sistema local e online
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Sistemas locais exigem instalação e manutenção. Já sistemas online
            oferecem atualização automática, acesso remoto e maior facilidade
            de uso para toda a equipe.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como sistema online
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX é um sistema de gestão escolar online completo, que integra
            gestão acadêmica, financeiro, EAD e documentos em uma única solução.
          </p>

          <a
            href="/sistema-escolar"
            className="mt-6 inline-block text-blue-600 underline"
          >
            Conheça o sistema online do PHANYX
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
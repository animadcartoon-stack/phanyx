import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "PHANYX | O que é a plataforma PHANYX",
  description:
    "Conheça o PHANYX, plataforma de gestão escolar, acadêmica e EAD. Entenda o nome correto da marca e como a solução funciona para instituições de ensino.",
};

export default function PhanyxPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20 md:px-10 lg:px-12">
          <h1 className="text-4xl font-bold md:text-5xl">
            O que é o PHANYX
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            O PHANYX é uma plataforma completa de gestão escolar, gestão acadêmica
            e ensino EAD desenvolvida para instituições de ensino que precisam de
            organização, controle e crescimento em uma única solução.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Como se escreve PHANYX
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O nome correto da plataforma é PHANYX.
          </p>

          <p className="mt-4 text-lg text-slate-600">
            Algumas pessoas podem procurar por variações como “phanix”, “fanix”,
            “fanics” ou “panix”, mas o nome oficial e correto é PHANYX.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Plataforma completa para instituições de ensino
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX reúne em um único sistema recursos de gestão escolar,
            gestão acadêmica, plataforma EAD, controle financeiro, documentos
            institucionais e experiência digital para alunos, professores e
            administração.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Para quem o PHANYX é indicado
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            A plataforma é ideal para escolas, faculdades, cursos técnicos,
            cursos livres e operações de ensino digital que precisam de uma
            estrutura profissional e escalável.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como sistema escolar e plataforma EAD
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Além de ser um sistema de gestão escolar e acadêmica, o PHANYX
            também funciona como plataforma EAD, permitindo criar aulas,
            acompanhar alunos, aplicar avaliações e organizar cursos online
            com uma experiência moderna.
          </p>
          <h2 className="mt-10 text-3xl font-bold">
  Variações de busca pelo PHANYX
</h2>

<p className="mt-4 text-lg text-slate-600">
  Algumas pessoas procuram pela plataforma utilizando grafias diferentes,
  como por exemplo:
</p>

<ul className="list-disc ml-6 mt-4 text-slate-600">
  <li>phanix sistema escolar</li>
  <li>fanix plataforma de ensino</li>
  <li>fanics sistema acadêmico</li>
  <li>panix software para cursos</li>
  <li>phany sistema educacional</li>
</ul>

<p className="mt-4 text-lg text-slate-600">
  Independentemente da forma como você pesquisou, o nome correto da
  plataforma é <strong>PHANYX</strong>, um sistema completo para gestão
  escolar, acadêmica e ensino EAD.
</p>
        </section>
      </main>

      <Footer />
    </>
  );
}
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Blog PHANYX | Gestão Escolar, EAD e Ferramentas Online",
  description:
    "Conteúdos sobre gestão escolar, plataforma EAD, gestão acadêmica e ferramentas online gratuitas do PHANYX.",
};

const managementArticles = [
  {
    href: "/blog/sistema-gestao-escolar",
    title: "Melhor sistema de gestão escolar em 2026",
    description:
      "Descubra como escolher o melhor sistema escolar para sua instituição.",
  },
  {
    href: "/blog/sistema-escolar-gratis-vs-pago",
    title: "Sistema escolar grátis vs pago: qual escolher?",
    description:
      "Compare vantagens e descubra qual opção faz mais sentido para sua instituição.",
  },
  {
    href: "/blog/como-aumentar-matriculas-com-sistema-escolar-moderno",
    title: "Como aumentar matrículas com um sistema escolar moderno",
    description:
      "Veja como organizar sua instituição e aumentar conversão de alunos.",
  },
  {
    href: "/blog/plataforma-ead-para-cursos-livres",
    title: "Plataforma EAD para cursos livres",
    description:
      "Veja como estruturar cursos online com uma plataforma profissional.",
  },
  {
    href: "/blog/gestao-academica-na-pratica",
    title: "Gestão acadêmica na prática",
    description:
      "Veja como organizar sua instituição com gestão acadêmica eficiente.",
  },
  {
    href: "/blog/como-reduzir-inadimplencia-escolar-com-tecnologia",
    title: "Como reduzir inadimplência escolar com tecnologia",
    description:
      "Veja como controlar pagamentos e reduzir atrasos em sua instituição.",
  },
  {
    href: "/blog/controle-financeiro-para-escolas",
    title: "Controle financeiro para escolas",
    description:
      "Veja como organizar o financeiro da sua instituição de ensino.",
  },
  {
    href: "/blog/sistema-para-cursos-profissionalizantes",
    title: "Sistema para cursos profissionalizantes",
    description:
      "Veja como organizar cursos técnicos e profissionalizantes com tecnologia.",
  },
  {
    href: "/blog/sistema-de-gestao-escolar-online",
    title: "Sistema de gestão escolar online",
    description:
      "Veja como organizar sua instituição com um sistema online completo.",
  },
  {
    href: "/blog/melhor-sistema-academico",
    title: "Melhor sistema acadêmico em 2026",
    description:
      "Veja como escolher a melhor plataforma acadêmica para sua instituição.",
  },
  {
    href: "/blog/sistema-escolar-para-pequenas-escolas",
    title: "Sistema escolar para pequenas escolas",
    description:
      "Veja como pequenas escolas podem se organizar com tecnologia.",
  },
  {
    href: "/blog/plataforma-para-ensino-online",
    title: "Plataforma para ensino online",
    description:
      "Veja como estruturar cursos digitais com uma plataforma completa.",
  },
  {
    href: "/blog/melhor-plataforma-para-cursos-online",
    title: "Melhor plataforma para cursos online",
    description:
      "Veja como escolher a melhor plataforma para vender cursos online.",
  },
  {
    href: "/blog/como-vender-cursos-online",
    title: "Como vender cursos online",
    description:
      "Veja como criar e vender cursos digitais com uma plataforma profissional.",
  },
  {
    href: "/blog/como-montar-um-curso-online",
    title: "Como montar um curso online",
    description: "Veja como criar um curso digital do zero.",
  },
  {
    href: "/blog/quanto-custa-criar-um-curso-online",
    title: "Quanto custa criar um curso online",
    description: "Veja quanto investir para começar no ensino digital.",
  },
  {
    href: "/blog/plataforma-para-escolas-online",
    title: "Plataforma para escolas online",
    description:
      "Veja como modernizar sua instituição com uma plataforma digital completa.",
  },
  {
    href: "/blog/gestao-escolar-digital",
    title: "Gestão escolar digital",
    description: "Veja como modernizar a gestão da sua instituição.",
  },
  {
    href: "/blog/sistema-academico-completo",
    title: "Sistema acadêmico completo",
    description:
      "Veja como organizar toda a gestão acadêmica da sua instituição.",
  },
];

export default function BlogPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold mb-6">Blog PHANYX</h1>

          <p className="mb-12 max-w-3xl text-lg leading-8 text-slate-600">
            Conteúdos completos sobre gestão escolar, plataformas EAD,
            tecnologia educacional e ferramentas online gratuitas para tarefas
            de imagem no navegador.
          </p>

          <section aria-labelledby="ferramentas-gratuitas" className="mb-16">
            <div className="mb-6">
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                Ferramentas gratuitas PHANYX
              </p>
              <h2 id="ferramentas-gratuitas" className="text-3xl font-bold">
                Guias para editar imagens e remover fundos online
              </h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                Acesse os nossos guias sobre remoção de fundo e edição de
                imagens. As ferramentas básicas do PHANYX funcionam online e
                são gratuitas; tratamentos avançados com IA são opcionais.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <p className="text-sm font-semibold text-blue-600">
                  Comparativo 2027
                </p>
                <h3 className="mt-2 text-2xl font-bold">
                  <Link
                    href="/blog/melhores-removedores-de-fundo-gratis"
                    className="hover:text-blue-700"
                  >
                    5 melhores removedores de fundo grátis online
                  </Link>
                </h3>
                <p className="mt-3 leading-7 text-slate-600">
                  Compare PHANYX, Pixlr, Pixelcut, Photoroom e remove.bg e veja
                  qual ferramenta combina melhor com o seu fluxo de trabalho.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/blog/melhores-removedores-de-fundo-gratis"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Ler comparativo
                  </Link>
                  <Link
                    href="/removedor-de-fundo"
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400"
                  >
                    Remover fundo agora
                  </Link>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <p className="text-sm font-semibold text-blue-600">
                  Edição de imagem online
                </p>
                <h3 className="mt-2 text-2xl font-bold">
                  <Link
                    href="/blog/editor-de-imagens-gratis-online"
                    className="hover:text-blue-700"
                  >
                    Editor de imagens grátis e online
                  </Link>
                </h3>
                <p className="mt-3 leading-7 text-slate-600">
                  Veja como recortar, apagar, restaurar, ajustar bordas e
                  exportar imagens direto no navegador, sem instalar programas
                  pesados.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/blog/editor-de-imagens-gratis-online"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Ler guia de edição
                  </Link>
                  <Link
                    href="/removedor-de-fundo"
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400"
                  >
                    Abrir editor PHANYX
                  </Link>
                </div>
              </article>
            </div>
          </section>

          <section aria-labelledby="conteudos-gestao">
            <h2 id="conteudos-gestao" className="mb-6 text-3xl font-bold">
              Conteúdos sobre gestão escolar e ensino digital
            </h2>

            <div className="space-y-6">
              {managementArticles.map((article) => (
                <Link
                  key={article.href}
                  href={article.href}
                  className="block rounded-lg border p-6 hover:shadow"
                >
                  <h3 className="text-2xl font-semibold">{article.title}</h3>
                  <p className="mt-2 text-slate-600">{article.description}</p>
                </Link>
              ))}
            </div>
          </section>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="text-3xl font-bold text-slate-900">
              Blog sobre sistema de gestão escolar, plataforma EAD e gestão
              acadêmica
            </h2>

            <p className="mt-4 text-lg leading-8 text-slate-600">
              O blog do PHANYX reúne conteúdos sobre sistema de gestão escolar,
              plataforma EAD, gestão acadêmica, tecnologia educacional e
              crescimento de instituições de ensino. O objetivo é ajudar
              escolas, faculdades e cursos a escolherem soluções mais modernas
              para organizar sua operação.
            </p>

            <h2 className="mt-10 text-3xl font-bold text-slate-900">
              Ferramentas online para tarefas rápidas de imagem
            </h2>

            <p className="mt-4 text-lg leading-8 text-slate-600">
              O PHANYX também disponibiliza ferramentas online para remover
              fundos, recortar, apagar, restaurar e preparar imagens para uso
              acadêmico e profissional. Os guias desta página ajudam a escolher
              a ferramenta adequada e explicam como usar os recursos gratuitos
              diretamente no navegador.
            </p>

            <h2 className="mt-10 text-3xl font-bold text-slate-900">
              Conteúdos para escolas, faculdades e cursos
            </h2>

            <p className="mt-4 text-lg leading-8 text-slate-600">
              Aqui você encontra artigos sobre como escolher um sistema escolar,
              diferenças entre Moodle e plataformas completas, comparação entre
              sistemas gratuitos e pagos, além de guias para instituições que
              desejam melhorar a gestão acadêmica e o ensino digital.
            </p>

            <h2 className="mt-10 text-3xl font-bold text-slate-900">
              PHANYX como referência em tecnologia educacional
            </h2>

            <p className="mt-4 text-lg leading-8 text-slate-600">
              O PHANYX foi desenvolvido para unir gestão escolar, gestão
              acadêmica, controle financeiro, documentos e plataforma EAD em uma
              única solução. Por isso, este blog também funciona como um centro
              de conteúdo para instituições que desejam crescer com mais
              controle, organização e visão estratégica.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

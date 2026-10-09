import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { marketingAlternates } from "@/lib/public-marketing";

const pageUrl = "https://www.phanyx.com.br/gestao-academica";
const seoTitle = "Sistema de Gestão Acadêmica para Instituições | PHANYX";
const seoDescription =
  "Sistema e software de gestão acadêmica para escolas, faculdades e instituições de ensino. Centralize cursos, matrículas, turmas, notas, histórico e acompanhamento dos alunos.";

export const metadata = {
  alternates: marketingAlternates("academic"),
  title: { absolute: seoTitle },
  description: seoDescription,
  keywords: [
    "gestão acadêmica",
    "sistema de gestão acadêmica",
    "software de gestão acadêmica",
    "plataforma de gestão acadêmica",
    "software acadêmico",
    "controle acadêmico",
    "sistema para faculdade",
    "sistema para instituição de ensino",
  ],
  openGraph: {
    title: seoTitle,
    description: seoDescription,
    type: "website",
    locale: "pt_BR",
    url: pageUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: seoTitle,
    description: seoDescription,
  },
};

const beneficios = [
  {
    titulo: "Organização acadêmica completa",
    descricao:
      "Gerencie cursos, disciplinas, turmas, matrículas, professores e alunos com uma estrutura centralizada e profissional.",
  },
  {
    titulo: "Visão estratégica da instituição",
    descricao:
      "Tenha controle sobre desempenho, estrutura acadêmica e evolução dos alunos em um único ambiente.",
  },
  {
    titulo: "Processos acadêmicos automatizados",
    descricao:
      "Reduza tarefas manuais com fluxos organizados para matrícula, avaliações, notas e histórico escolar.",
  },
  {
    titulo: "Integração com ensino digital",
    descricao:
      "Combine gestão acadêmica com LMS para oferecer uma experiência moderna de ensino presencial e EAD.",
  },
];

const destaques = [
  "Gestão de cursos, disciplinas e turmas",
  "Controle de matrículas e histórico acadêmico",
  "Boletim com notas e média por disciplina",
  "Provas e avaliações online integradas",
  "Acompanhamento do progresso do aluno",
  "Estrutura SaaS multi-instituição escalável",
];

const faqs = [
  {
    pergunta: "O que é gestão acadêmica no PHANYX?",
    resposta:
      "É o conjunto de ferramentas que permite organizar cursos, disciplinas, alunos, professores e todo o fluxo acadêmico da instituição em um único sistema.",
  },
  {
    pergunta: "O sistema substitui planilhas e controles manuais?",
    resposta:
      "Sim. O PHANYX centraliza e automatiza os principais processos acadêmicos, reduzindo erros e aumentando a organização institucional.",
  },
  {
    pergunta: "É possível acompanhar o desempenho dos alunos?",
    resposta:
      "Sim. O sistema permite acompanhar notas, médias, progresso em disciplinas e histórico acadêmico completo.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: seoTitle,
      description: seoDescription,
      inLanguage: "pt-BR",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${pageUrl}#software`,
      name: "PHANYX",
      url: pageUrl,
      applicationCategory: "EducationalApplication",
      applicationSubCategory: "Academic Management Software",
      operatingSystem: "Web",
      description: seoDescription,
      featureList: destaques,
      inLanguage: "pt-BR",
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "PHANYX",
          item: "https://www.phanyx.com.br/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Gestão acadêmica",
          item: pageUrl,
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.pergunta,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.resposta,
        },
      })),
    },
  ],
};

export default function GestaoAcademicaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      <Header />

      <main className="bg-white text-slate-900">
        {/* HERO */}
        <section className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12 lg:py-20">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
                Gestão acadêmica
              </p>

<h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
  Sistema de gestão acadêmica para escolas, faculdades e instituições de ensino
</h1>

              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
  O PHANYX é um sistema de gestão acadêmica completo para instituições que
  precisam organizar cursos, disciplinas, turmas, matrículas, notas,
  histórico escolar e acompanhamento de alunos com mais eficiência,
  clareza e controle em uma plataforma moderna e escalável.
</p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/planos"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  Ver planos
                </Link>

                <Link
                  href="/contato"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/15"
                >
                  Falar com especialista
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Benefícios
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Mais controle acadêmico e menos complexidade na operação
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Um software de gestão acadêmica ajuda a reunir dados e processos
              que, sem uma plataforma central, costumam ficar divididos entre
              planilhas, documentos, mensagens e sistemas diferentes.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {beneficios.map((item) => (
              <div
                key={item.titulo}
                className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-bold text-slate-900">
                  {item.titulo}
                </h3>
                <p className="mt-3 text-slate-600">{item.descricao}</p>
              </div>
            ))}
          </div>
        </section>

        {/* DESTAQUES */}
        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                  Recursos
                </p>
                <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                  Uma plataforma de gestão acadêmica para organizar a rotina institucional
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  O PHANYX foi desenvolvido para atender a rotina acadêmica com
                  organização, automação e visão estratégica.
                </p>
              </div>

              <div className="grid gap-4">
                {destaques.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <p className="font-medium text-slate-800">✓ {item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>


        <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Para quem é
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Gestão acadêmica para diferentes modelos de instituição
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              O PHANYX pode apoiar escolas, faculdades, cursos livres e outras
              instituições que precisam organizar sua operação acadêmica sem
              depender de controles dispersos.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold">Escolas e colégios</h3>
              <p className="mt-3 leading-7 text-slate-600">
                Organize turmas, matrículas, professores, avaliações, frequência
                e documentos acadêmicos em um fluxo centralizado.
              </p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold">Faculdades e instituições de ensino superior</h3>
              <p className="mt-3 leading-7 text-slate-600">
                Centralize cursos, disciplinas, períodos, vínculos acadêmicos,
                notas, histórico e acompanhamento dos estudantes.
              </p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold">Cursos livres e profissionalizantes</h3>
              <p className="mt-3 leading-7 text-slate-600">
                Estruture cursos, turmas, alunos, avaliações, documentos e ensino
                digital em uma mesma plataforma.
              </p>
            </article>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:px-10 lg:grid-cols-2 lg:px-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                Jornada acadêmica
              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Da matrícula ao histórico escolar
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                A gestão acadêmica funciona melhor quando cada etapa faz parte do
                mesmo fluxo de informação, reduzindo duplicidade de dados e
                facilitando o acompanhamento da instituição.
              </p>
            </div>

            <ol className="grid gap-4">
              {[
                "Cadastro e organização de cursos, disciplinas e turmas",
                "Matrícula e vínculo do aluno com a estrutura acadêmica",
                "Registro de frequência, avaliações, notas e médias",
                "Acompanhamento do desempenho e do progresso estudantil",
                "Emissão e organização de documentos e histórico acadêmico",
              ].map((etapa, index) => (
                <li
                  key={etapa}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-800">
                    {index + 1}
                  </span>
                  <span className="pt-1 font-medium text-slate-800">{etapa}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Para quem é
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Gestão acadêmica para diferentes modelos de instituição
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold">Escolas e colégios</h3>
              <p className="mt-3 leading-7 text-slate-600">
                Organize turmas, matrículas, professores, avaliações, frequência
                e documentos acadêmicos sem depender de controles espalhados.
              </p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold">Faculdades e instituições de ensino superior</h3>
              <p className="mt-3 leading-7 text-slate-600">
                Centralize cursos, disciplinas, períodos, vínculos acadêmicos,
                notas, histórico e acompanhamento dos estudantes.
              </p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold">Cursos livres e profissionalizantes</h3>
              <p className="mt-3 leading-7 text-slate-600">
                Estruture ofertas de cursos, turmas, alunos, avaliações,
                documentos e ensino digital em uma plataforma integrada.
              </p>
            </article>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:px-10 lg:grid-cols-2 lg:px-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                Jornada acadêmica
              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Da matrícula ao histórico escolar
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                A gestão acadêmica funciona melhor quando cada etapa faz parte
                do mesmo fluxo de informação, reduzindo duplicidade de dados e
                facilitando o acompanhamento da instituição.
              </p>
            </div>

            <ol className="grid gap-4">
              {[
                "Cadastro e organização de cursos, disciplinas e turmas",
                "Matrícula e vínculo do aluno com a estrutura acadêmica",
                "Registro de frequência, avaliações, notas e médias",
                "Acompanhamento do desempenho e do progresso estudantil",
                "Emissão e organização de documentos e histórico acadêmico",
              ].map((etapa, index) => (
                <li
                  key={etapa}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-800">
                    {index + 1}
                  </span>
                  <span className="pt-1 font-medium text-slate-800">{etapa}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-5xl px-6 py-16 md:px-10 lg:px-12">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Perguntas frequentes
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Dúvidas sobre sistema de gestão acadêmica
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.pergunta}
                className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold text-slate-900">
                  {faq.pergunta}
                </h3>
                <p className="mt-3 text-slate-600">{faq.resposta}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="bg-slate-950">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-white md:p-10">
              <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
                    Próximo passo
                  </p>
                  <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                    Estruture sua gestão acadêmica com uma plataforma profissional
                  </h2>
                  <p className="mt-4 text-blue-100">
                    O PHANYX foi pensado para dar mais controle, organização e
                    visão estratégica para instituições de ensino.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Link
                    href="/planos"
                    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-500"
                  >
                    Ver planos
                  </Link>

                  <Link
                    href="/contato"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/15"
                  >
                    Entrar em contato
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

<section className="mx-auto max-w-5xl px-6 py-16 md:px-10 lg:px-12">
  <h2 className="text-3xl font-bold text-slate-900">
    Sistema de gestão acadêmica online completo
  </h2>
  <p className="mt-4 text-lg text-slate-600">
    O PHANYX é um sistema de gestão acadêmica online completo para escolas,
    faculdades e instituições de ensino que precisam controlar cursos,
    disciplinas, turmas, matrículas, alunos, notas e histórico escolar
    em uma única plataforma.
  </p>

  <h2 className="mt-10 text-3xl font-bold text-slate-900">
    Software de gestão acadêmica para organizar a operação institucional
  </h2>
  <p className="mt-4 text-lg text-slate-600">
    Com o PHANYX, a instituição consegue centralizar o controle acadêmico,
    automatizar processos, acompanhar o desempenho dos alunos e reduzir
    tarefas manuais com mais clareza, segurança e escalabilidade.
  </p>

  <h2 className="mt-10 text-3xl font-bold text-slate-900">
    Controle acadêmico para ensino presencial, híbrido e EAD
  </h2>
  <p className="mt-4 text-lg text-slate-600">
    Ideal para instituições presenciais, híbridas e digitais, o sistema
    oferece estrutura moderna para gestão acadêmica, avaliações, boletins,
    progresso do aluno e integração com ensino digital.
  </p>
  <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
  <h3 className="text-xl font-bold text-slate-900">
    Veja também outras soluções do PHANYX
  </h3>

  <div className="mt-4 flex flex-col gap-3">
    <Link href="/sistema-escolar" className="text-blue-700 hover:text-blue-600">
      Sistema de gestão escolar
    </Link>

    <Link href="/gestao-escolar" className="text-blue-700 hover:text-blue-600">
      Gestão escolar
    </Link>


    <Link href="/gestao-de-matriculas-escolares" className="text-blue-700 hover:text-blue-600">
      Sistema de matrícula escolar
    </Link>

    <Link href="/plataforma-ead" className="text-blue-700 hover:text-blue-600">
      Plataforma EAD
    </Link>

    <Link href="/software-para-cursos" className="text-blue-700 hover:text-blue-600">
      Software para cursos
    </Link>
  </div>
</div>

  <div className="mt-12">
    <h2 className="text-3xl font-bold text-slate-900">
      Conteúdo relacionado sobre gestão acadêmica
    </h2>
    <p className="mt-4 text-lg leading-8 text-slate-600">
      Aprofunde os critérios de escolha e a organização da operação acadêmica
      com conteúdos que apoiam esta página principal.
    </p>

    <div className="mt-6 grid gap-4">
      <Link
        href="/blog/gestao-academica-na-pratica"
        className="rounded-2xl border border-slate-200 bg-slate-50 p-5 font-semibold text-blue-800 hover:border-blue-300 hover:bg-blue-50"
      >
        Gestão acadêmica na prática →
      </Link>
      <Link
        href="/blog/sistema-academico-completo"
        className="rounded-2xl border border-slate-200 bg-slate-50 p-5 font-semibold text-blue-800 hover:border-blue-300 hover:bg-blue-50"
      >
        O que é um sistema acadêmico completo →
      </Link>
      <Link
        href="/blog/melhor-sistema-academico"
        className="rounded-2xl border border-slate-200 bg-slate-50 p-5 font-semibold text-blue-800 hover:border-blue-300 hover:bg-blue-50"
      >
        Como escolher o melhor sistema acadêmico →
      </Link>
    </div>
  </div>
</section>

      </main>

      <Footer />
    </>
  );
}

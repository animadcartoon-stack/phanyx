import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const pageUrl = "https://www.phanyx.com.br/sistema-escolar";
const seoTitle = "Sistema de Gestão Escolar para Escolas | PHANYX";
const seoDescription =
  "Sistema e software de gestão escolar para centralizar alunos, professores, turmas, matrículas, financeiro, documentos e ensino digital em uma única plataforma.";

export const metadata: Metadata = {
  title: { absolute: seoTitle },
  description: seoDescription,
  alternates: { canonical: "/sistema-escolar" },
  keywords: [
    "sistema de gestão escolar",
    "software de gestão escolar",
    "software escolar",
    "plataforma de gestão escolar",
    "sistema para escolas",
    "controle escolar",
    "gestão escolar",
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
    titulo: "Controle escolar em um só lugar",
    descricao:
      "Gerencie alunos, professores, turmas, cursos, disciplinas, matrículas e documentos em um ambiente centralizado.",
  },
  {
    titulo: "Mais organização para a rotina institucional",
    descricao:
      "Reduza processos manuais e tenha mais clareza sobre a operação escolar com uma plataforma moderna.",
  },
  {
    titulo: "Experiência completa para gestão e ensino",
    descricao:
      "Ofereça áreas próprias para administração, professores e alunos com uma navegação mais profissional.",
  },
  {
    titulo: "Base preparada para crescer",
    descricao:
      "Use uma arquitetura SaaS multi-instituição pronta para expansão comercial e escalabilidade operacional.",
  },
];

const destaques = [
  "Gestão de alunos, professores, disciplinas e turmas",
  "Controle de matrículas e rotina acadêmica",
  "Boletim, notas e progresso dos alunos",
  "Plataforma EAD integrada ao sistema escolar",
  "Documentos com validação e rastreabilidade",
  "Estrutura escalável para instituições de ensino",
];

const faqs = [
  {
    pergunta: "O PHANYX é um sistema escolar completo?",
    resposta:
      "Sim. O PHANYX foi pensado para reunir gestão escolar, experiência acadêmica digital, documentos, segurança e base para crescimento institucional.",
  },
  {
    pergunta: "Ele atende ensino presencial e ensino digital?",
    resposta:
      "Sim. O sistema foi desenhado para operar escolas, faculdades, cursos e também ambientes EAD com aulas, materiais, provas e progresso.",
  },
  {
    pergunta: "O sistema escolar do PHANYX também possui área do aluno e professor?",
    resposta:
      "Sim. A plataforma possui experiência separada para administração, professores e alunos, com foco em usabilidade e organização.",
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
      applicationSubCategory: "School Management Software",
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
          name: "Sistema de gestão escolar",
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

export default function SistemaEscolarPage() {
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
        <section className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12 lg:py-20">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
                Sistema escolar
              </p>

              <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
                Sistema de gestão escolar para escolas e instituições de ensino
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
                O PHANYX é um sistema de gestão escolar que centraliza alunos,
                professores, turmas, matrículas, financeiro, documentos e ensino
                digital. A instituição trabalha com mais organização e uma visão
                integrada da operação em uma plataforma online.
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

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Benefícios
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Mais do que controles separados: gestão escolar centralizada
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Um software de gestão escolar ajuda a reduzir planilhas e cadastros
              duplicados ao reunir as informações usadas pela secretaria, gestão,
              professores e alunos em um mesmo ambiente.
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

        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                  Recursos estratégicos
                </p>
                <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                  Software de gestão escolar para centralizar a operação
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  O PHANYX ajuda instituições a centralizarem sua operação em um
                  sistema mais profissional, mais seguro e preparado para evoluir.
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

        <section className="mx-auto max-w-5xl px-6 py-16 md:px-10 lg:px-12">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Para quem o PHANYX é indicado
            </p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Um sistema escolar para instituições que precisam de imagem profissional e estrutura forte
            </h2>

            <p className="mt-4 text-lg text-slate-600">
              O PHANYX atende instituições de ensino que precisam de um sistema
              capaz de organizar processos, melhorar a experiência dos usuários
              e apoiar o crescimento institucional de forma escalável.
            </p>
          </div>
        </section>

        <section className="bg-slate-50">
          <div className="mx-auto max-w-5xl px-6 py-16 md:px-10 lg:px-12">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                Perguntas frequentes
              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Dúvidas sobre sistema de gestão escolar
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
          </div>
        </section>

        <section className="bg-slate-950">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-white md:p-10">
              <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
                    Próximo passo
                  </p>
                  <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                    Coloque sua instituição em um sistema escolar mais moderno e escalável
                  </h2>
                  <p className="mt-4 max-w-3xl text-blue-100">
                    O PHANYX foi pensado para unir organização escolar, operação
                    acadêmica e crescimento institucional em uma única plataforma.
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
    Sistema de gestão escolar online para centralizar a rotina
  </h2>
  <p className="mt-4 text-lg leading-8 text-slate-600">
    O PHANYX funciona pela internet e reúne processos escolares em uma base
    centralizada. Isso facilita o trabalho entre áreas e unidades sem depender
    de uma instalação isolada em cada computador.
  </p>

  <h2 className="mt-10 text-3xl font-bold text-slate-900">
    Software de gestão escolar para escolas e instituições de ensino
  </h2>
  <p className="mt-4 text-lg leading-8 text-slate-600">
    A plataforma organiza alunos, professores, turmas, matrículas, registros,
    financeiro, documentos e acessos por perfil. Os módulos contratados podem
    acompanhar a evolução da operação da instituição.
  </p>

  <h2 className="mt-10 text-3xl font-bold text-slate-900">
    Gestão escolar, gestão acadêmica e ensino digital têm funções diferentes
  </h2>
  <p className="mt-4 text-lg leading-8 text-slate-600">
    Esta página apresenta o sistema de gestão escolar como solução para a
    operação institucional. Para aprofundar processos acadêmicos, consulte a
    página de gestão acadêmica; para aulas e aprendizagem online, veja a
    plataforma EAD.
  </p>
  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
    <Link
      href="/gestao-academica"
      className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-blue-800 hover:bg-slate-50"
    >
      Conhecer gestão acadêmica
    </Link>
    <Link
      href="/plataforma-ead"
      className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-blue-800 hover:bg-slate-50"
    >
      Conhecer plataforma EAD
    </Link>
  </div>
  <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
  <h3 className="text-xl font-bold text-slate-900">
    Veja também outras soluções do PHANYX
  </h3>

  <div className="mt-4 flex flex-col gap-3">

    <Link href="/gestao-escolar" className="text-blue-700 hover:text-blue-600">
      Gestão escolar
    </Link>

    <Link href="/gestao-academica" className="text-blue-700 hover:text-blue-600">
      Gestão acadêmica
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
      Conteúdo relacionado sobre sistema de gestão escolar
    </h2>
    <p className="mt-4 text-lg leading-8 text-slate-600">
      Use estes guias para comparar soluções, entender o modelo online e avaliar
      como um sistema escolar se diferencia de uma plataforma de ensino.
    </p>

    <div className="mt-6 grid gap-4">
      <Link
        href="/blog/sistema-gestao-escolar"
        className="rounded-2xl border border-slate-200 bg-slate-50 p-5 font-semibold text-blue-800 hover:border-blue-300 hover:bg-blue-50"
      >
        Como escolher o melhor sistema de gestão escolar →
      </Link>
      <Link
        href="/blog/sistema-de-gestao-escolar-online"
        className="rounded-2xl border border-slate-200 bg-slate-50 p-5 font-semibold text-blue-800 hover:border-blue-300 hover:bg-blue-50"
      >
        Como funciona um sistema de gestão escolar online →
      </Link>
      <Link
        href="/blog/sistema-escolar-vs-moodle"
        className="rounded-2xl border border-slate-200 bg-slate-50 p-5 font-semibold text-blue-800 hover:border-blue-300 hover:bg-blue-50"
      >
        Sistema escolar x Moodle: entenda as diferenças →
      </Link>
    </div>
  </div>
</section>

      </main>

      <Footer />
    </>
  );
}

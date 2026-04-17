import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const beneficios = [
  {
    titulo: "Controle acadêmico centralizado",
    descricao:
      "Organize cursos, disciplinas, turmas, matrículas, alunos e professores em um único ambiente institucional.",
  },
  {
    titulo: "Mais visão para a gestão escolar",
    descricao:
      "Tenha uma operação mais clara com informações acadêmicas, administrativas e financeiras conectadas.",
  },
  {
    titulo: "Experiência moderna para toda a instituição",
    descricao:
      "Ofereça áreas específicas para administração, professores e alunos com navegação profissional e intuitiva.",
  },
  {
    titulo: "Base pronta para ensino presencial e EAD",
    descricao:
      "Acompanhe progresso, materiais, provas, documentos e processos escolares em uma plataforma escalável.",
  },
];

const destaques = [
  "Gestão de alunos, professores, cursos, turmas e matrículas",
  "Ambiente digital para ensino presencial, híbrido e EAD",
  "Boletim, progresso acadêmico e avaliações online",
  "Documentos institucionais com validação e rastreabilidade",
  "Estrutura SaaS multi-instituição com separação de dados",
  "Base pronta para crescimento comercial e operacional",
];

const faqs = [
  {
    pergunta: "O PHANYX serve para escolas, faculdades e cursos?",
    resposta:
      "Sim. O PHANYX foi pensado para operações educacionais de diferentes portes, incluindo escolas, faculdades, cursos técnicos, cursos livres e ensino a distância.",
  },
  {
    pergunta: "O sistema ajuda na rotina da gestão escolar?",
    resposta:
      "Sim. A proposta é centralizar a rotina institucional em um sistema escolar moderno, com controle acadêmico, experiência digital e organização operacional.",
  },
  {
    pergunta: "O PHANYX pode ser usado como plataforma EAD também?",
    resposta:
      "Sim. A plataforma já possui estrutura para aulas, materiais, progresso, avaliações e experiência acadêmica digital.",
  },
];

export default function GestaoEscolarPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12 lg:py-20">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
                Gestão escolar
              </p>

              <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
                Sistema de gestão escolar com operação acadêmica, experiência moderna e visão institucional
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
                O PHANYX é uma plataforma desenvolvida para instituições que
                precisam de mais controle, organização e escalabilidade. Com ele,
                sua gestão escolar pode operar cursos, turmas, matrículas,
                professores, alunos, documentos e ensino digital em um único lugar.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/planos"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Ver planos
                </Link>

                <Link
                  href="/contato"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15"
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
              Por que usar o PHANYX
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Mais do que um sistema escolar: uma base sólida para crescer com organização
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {beneficios.map((item) => (
              <div
                key={item.titulo}
                className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-bold text-slate-900">{item.titulo}</h3>
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
                  Um software para gestão escolar preparado para a rotina real da instituição
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  O PHANYX foi desenhado para unir gestão acadêmica, experiência
                  digital e organização institucional em uma plataforma com visão SaaS.
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
              Uma plataforma para instituições que precisam de controle, imagem profissional e escala
            </h2>

            <p className="mt-4 text-lg text-slate-600">
              Se sua instituição busca um sistema de gestão escolar com operação
              moderna, estrutura para ensino digital e organização institucional,
              o PHANYX foi pensado exatamente para esse cenário.
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
                Dúvidas comuns sobre gestão escolar com o PHANYX
              </h2>
            </div>

            <div className="mt-12 space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.pergunta}
                  className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-lg font-bold text-slate-900">{faq.pergunta}</h3>
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
                    Coloque sua gestão escolar em um ambiente mais forte, moderno e escalável
                  </h2>
                  <p className="mt-4 max-w-3xl text-blue-100">
                    O PHANYX ajuda instituições a evoluírem com mais controle,
                    mais experiência e mais capacidade de crescimento.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Link
                    href="/planos"
                    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    Ver planos
                  </Link>

                  <Link
                    href="/contato"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    Entrar em contato
                  </Link>
                </div>
              </div>
            </div>
          </div>
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

    <Link href="/gestao-academica" className="text-blue-700 hover:text-blue-600">
      Gestão acadêmica
    </Link>

    <Link href="/plataforma-ead" className="text-blue-700 hover:text-blue-600">
      Plataforma EAD
    </Link>

    <Link href="/software-para-cursos" className="text-blue-700 hover:text-blue-600">
      Software para cursos
    </Link>
  </div>
</div>
        </section>

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

    <Link href="/gestao-academica" className="text-blue-700 hover:text-blue-600">
      Gestão acadêmica
    </Link>

    <Link href="/plataforma-ead" className="text-blue-700 hover:text-blue-600">
      Plataforma EAD
    </Link>

    <Link href="/software-para-cursos" className="text-blue-700 hover:text-blue-600">
      Software para cursos
    </Link>
  </div>
</div>

      </main>

      <Footer />
    </>
  );
}

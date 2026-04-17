import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Sistema de Gestão Escolar Completo | PHANYX",
  description:
    "Sistema de gestão escolar completo para escolas, faculdades e EAD. Controle acadêmico, financeiro, alunos, professores, provas e certificados em uma única plataforma.",
  keywords: [
    "sistema de gestão escolar",
    "software escolar",
    "plataforma escolar",
    "gestão acadêmica",
    "sistema para escolas",
    "sistema acadêmico",
    "controle escolar",
  ],
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

export default function SistemaEscolarPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12 lg:py-20">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
                Sistema escolar
              </p>

              <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
  Sistema de gestão escolar completo para escolas, faculdades e instituições de ensino
</h1>

              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
                O PHANYX é um sistema de gestão escolar completo desenvolvido para escolas, faculdades e instituições de ensino que precisam de mais controle, organização e visão estratégica. Com ele, sua instituição pode gerenciar alunos, professores, cursos, financeiro, documentos e ensino digital em uma única plataforma.
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
              Mais do que um sistema escolar: uma plataforma para operar e crescer com mais controle
            </h2>
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
                  Uma solução para rotina escolar, operação acadêmica e experiência digital
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
                Dúvidas sobre o sistema escolar PHANYX
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
    Sistema de gestão escolar online completo
  </h2>
  <p className="mt-4 text-lg text-slate-600">
    O PHANYX é um sistema de gestão escolar online completo que permite controlar alunos, professores, cursos, turmas, disciplinas e financeiro escolar em uma única plataforma. Ideal para instituições que buscam modernizar sua operação e ganhar mais eficiência.
  </p>

  <h2 className="mt-10 text-3xl font-bold text-slate-900">
    Software para escolas, faculdades e cursos
  </h2>
  <p className="mt-4 text-lg text-slate-600">
    Este software para escolas e faculdades oferece recursos completos de gestão acadêmica, controle de notas, emissão de documentos, acompanhamento de alunos e integração com ensino digital (EAD). Tudo com segurança e escalabilidade.
  </p>

  <h2 className="mt-10 text-3xl font-bold text-slate-900">
    Plataforma de gestão acadêmica moderna
  </h2>
  <p className="mt-4 text-lg text-slate-600">
    A plataforma de gestão acadêmica PHANYX foi desenvolvida para atender instituições de ensino que precisam de organização, controle e crescimento. Com tecnologia SaaS, permite expansão multi-institucional com alta performance.
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

import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Sistema de Gestão Acadêmica | PHANYX",
  description:
    "Sistema de gestão acadêmica para escolas, faculdades e instituições de ensino. Controle cursos, disciplinas, matrículas, notas, histórico escolar e desempenho dos alunos.",
  keywords: [
    "gestão acadêmica",
    "sistema de gestão acadêmica",
    "software acadêmico",
    "controle acadêmico",
    "sistema para faculdade",
    "sistema para instituição de ensino",
  ],
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

export default function GestaoAcademicaPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        {/* HERO */}
        <section className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12 lg:py-20">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
                Gestão acadêmica
              </p>

              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
  O PHANYX é um sistema de gestão acadêmica completo para instituições que
  precisam organizar cursos, disciplinas, turmas, matrículas, notas,
  histórico escolar e acompanhamento de alunos com mais eficiência,
  clareza e controle em uma plataforma moderna e escalável.
</p>

              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
                O PHANYX permite estruturar toda a operação acadêmica da sua
                instituição com mais controle, clareza e eficiência. Gerencie
                cursos, alunos, disciplinas, notas e processos educacionais em
                uma plataforma moderna e escalável.
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
                  Um software acadêmico completo para sua instituição
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

        {/* FAQ */}
        <section className="mx-auto max-w-5xl px-6 py-16 md:px-10 lg:px-12">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Perguntas frequentes
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Dúvidas sobre gestão acadêmica
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

<section className="hidden">
  <h2>Sistema de gestão acadêmica online</h2>
  <p>
    O PHANYX é um software de gestão acadêmica online para escolas,
    faculdades e instituições de ensino que precisam controlar alunos,
    professores, cursos, disciplinas, matrículas e boletins em um só lugar.
  </p>

  <h2>Software acadêmico completo</h2>
  <p>
    A plataforma centraliza histórico escolar, avaliações, notas, desempenho
    acadêmico e organização institucional com foco em automação e escalabilidade.
  </p>

  <h2>Controle acadêmico para instituições de ensino</h2>
  <p>
    Ideal para operações presenciais, híbridas e EAD, o sistema ajuda a reduzir
    processos manuais e melhorar a gestão acadêmica da instituição.
  </p>
</section>

      </main>

      <Footer />
    </>
  );
}
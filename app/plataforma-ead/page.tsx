import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const beneficios = [
  {
    titulo: "Ambiente completo de ensino online",
    descricao:
      "Crie aulas, disponibilize materiais, acompanhe o progresso dos alunos e gerencie toda a experiência EAD em um único lugar.",
  },
  {
    titulo: "Experiência moderna para alunos",
    descricao:
      "Interface intuitiva com acesso a aulas, atividades, provas e progresso acadêmico em tempo real.",
  },
  {
    titulo: "Controle total para professores",
    descricao:
      "Gerencie conteúdos, avalie alunos, acompanhe desempenho e organize suas disciplinas com facilidade.",
  },
  {
    titulo: "Integração com gestão acadêmica",
    descricao:
      "Conecte o ensino digital com matrícula, boletim, histórico e gestão institucional.",
  },
];

const destaques = [
  "Aulas em vídeo integradas (YouTube ou arquivos)",
  "Controle de progresso por tempo assistido",
  "Liberação de provas após conclusão de aulas",
  "Envio de atividades com arquivos",
  "Avaliações online com correção automática",
  "Experiência completa para ensino EAD",
];

const faqs = [
  {
    pergunta: "O PHANYX substitui o Moodle?",
    resposta:
      "Sim. O PHANYX oferece uma alternativa moderna ao Moodle, com interface mais intuitiva, integração com gestão acadêmica e visão SaaS.",
  },
  {
    pergunta: "Posso usar para cursos online?",
    resposta:
      "Sim. O sistema foi pensado para cursos EAD, cursos livres, ensino híbrido e operações educacionais digitais.",
  },
  {
    pergunta: "Os alunos conseguem acompanhar progresso?",
    resposta:
      "Sim. O sistema acompanha tempo assistido, aulas concluídas, notas e evolução acadêmica em tempo real.",
  },
];

export default function PlataformaEadPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        {/* HERO */}
        <section className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12 lg:py-20">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
                Plataforma EAD
              </p>

              <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
                Plataforma EAD para cursos online, ensino digital e gestão acadêmica integrada
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
                O PHANYX é uma plataforma EAD completa que permite criar aulas,
                acompanhar alunos, aplicar avaliações e estruturar cursos online
                com uma experiência moderna e profissional.
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
              Um ambiente completo para ensino digital e cursos online
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
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                  Recursos EAD
                </p>
                <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                  Mais controle, mais experiência e mais resultado no ensino online
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  O PHANYX oferece ferramentas modernas para criação de cursos,
                  acompanhamento de alunos e organização da experiência digital.
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
              Dúvidas sobre plataforma EAD
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.pergunta}
                className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold">{faq.pergunta}</h3>
                <p className="mt-3 text-slate-600">{faq.resposta}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="bg-slate-950">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-white md:p-10">
              <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
                    Comece agora
                  </p>
                  <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                    Leve seus cursos para o digital com uma plataforma profissional
                  </h2>
                  <p className="mt-4 text-blue-100">
                    O PHANYX foi criado para transformar ensino em uma experiência moderna, organizada e escalável.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
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
      </main>

      <Footer />
    </>
  );
}
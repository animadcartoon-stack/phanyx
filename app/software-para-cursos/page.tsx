import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Software para Cursos Online e Presenciais | PHANYX",
  description:
    "Software para cursos online e presenciais com gestão acadêmica, área do aluno, conteúdos, avaliações, matrículas e acompanhamento completo da operação.",
  keywords: [
    "software para cursos",
    "sistema para cursos",
    "plataforma para cursos online",
    "software para cursos presenciais",
    "gestão de cursos",
    "sistema para cursos livres",
  ],
};
const beneficios = [
  {
    titulo: "Plataforma completa para cursos",
    descricao:
      "Gerencie cursos, alunos, conteúdos, atividades e avaliações em um único sistema profissional.",
  },
  {
    titulo: "Experiência moderna para alunos",
    descricao:
      "Ofereça um ambiente organizado com acesso a aulas, progresso, atividades e acompanhamento acadêmico.",
  },
  {
    titulo: "Controle total da operação",
    descricao:
      "Tenha visão sobre matrículas, desempenho, estrutura de cursos e evolução dos alunos.",
  },
  {
    titulo: "Pronto para escalar",
    descricao:
      "Estrutura SaaS que permite crescer com organização e controle institucional.",
  },
];

const destaques = [
  "Criação e gestão de cursos online e presenciais",
  "Controle de alunos e matrículas",
  "Aulas com vídeo e materiais",
  "Atividades e avaliações integradas",
  "Boletim e acompanhamento de desempenho",
  "Base para crescimento comercial do curso",
];

const faqs = [
  {
    pergunta: "O PHANYX serve para cursos online?",
    resposta:
      "Sim. O sistema foi pensado para cursos EAD, cursos livres, ensino híbrido e operações educacionais completas.",
  },
  {
    pergunta: "Posso usar para cursos presenciais?",
    resposta:
      "Sim. O PHANYX atende tanto cursos presenciais quanto digitais, centralizando toda a operação.",
  },
  {
    pergunta: "É possível acompanhar alunos?",
    resposta:
      "Sim. Você pode acompanhar progresso, notas, atividades e desempenho acadêmico dos alunos.",
  },
];

export default function SoftwareParaCursosPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        {/* HERO */}
        <section className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
            <div className="max-w-4xl">
              <p className="text-sm uppercase tracking-[0.2em] text-blue-200">
                Software para cursos
              </p>

<h1 className="mt-4 text-4xl font-bold md:text-5xl">
  Software para cursos online e presenciais com gestão, ensino digital e controle completo
</h1>

              <p className="mt-6 text-lg text-slate-300">
  O PHANYX é um software para cursos online e presenciais que reúne gestão
  acadêmica, plataforma EAD, controle de matrículas, acompanhamento de alunos,
  atividades, avaliações e organização institucional em um sistema moderno e escalável.
</p>

              <div className="mt-8 flex gap-4">
                <Link
                  href="/planos"
                  className="rounded-2xl bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-500"
                >
                  Ver planos
                </Link>

                <Link
                  href="/contato"
                  className="rounded-2xl border border-white/20 px-6 py-3 text-white hover:bg-white/10"
                >
                  Falar com especialista
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold mb-10">
            Um software completo para gestão de cursos
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {beneficios.map((item) => (
              <div
                key={item.titulo}
                className="p-6 border rounded-2xl shadow-sm"
              >
                <h3 className="text-xl font-bold">{item.titulo}</h3>
                <p className="mt-3 text-gray-600">{item.descricao}</p>
              </div>
            ))}
          </div>
        </section>

        {/* DESTAQUES */}
        <section className="bg-slate-50 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-10">
              Recursos do sistema para cursos
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {destaques.map((item) => (
                <div
                  key={item}
                  className="p-5 border bg-white rounded-xl shadow-sm"
                >
                  ✓ {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-center mb-10">
            Perguntas frequentes
          </h2>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.pergunta} className="border rounded-2xl p-6">
                <h3 className="font-bold">{faq.pergunta}</h3>
                <p className="mt-2 text-gray-600">{faq.resposta}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="bg-slate-950 text-white py-16">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold">
              Organize seus cursos com uma plataforma profissional
            </h2>

            <p className="mt-4 text-slate-300">
              O PHANYX foi desenvolvido para estruturar cursos com mais controle,
              organização e experiência moderna.
            </p>

            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/planos"
                className="bg-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-500"
              >
                Ver planos
              </Link>

              <Link
                href="/contato"
                className="border border-white/20 px-6 py-3 rounded-xl hover:bg-white/10"
              >
                Falar com especialista
              </Link>
            </div>
          </div>
        </section>

<section className="max-w-5xl mx-auto px-6 py-16">
  <h2 className="text-3xl font-bold text-slate-900">
    Software para cursos online e presenciais
  </h2>
  <p className="mt-4 text-lg text-slate-600">
    O PHANYX é um software para cursos online e presenciais que ajuda instituições
    a organizar alunos, matrículas, conteúdos, aulas, avaliações e acompanhamento
    acadêmico em uma plataforma profissional e escalável.
  </p>

  <h2 className="mt-10 text-3xl font-bold text-slate-900">
    Sistema para cursos livres, técnicos e profissionalizantes
  </h2>
  <p className="mt-4 text-lg text-slate-600">
    A plataforma atende cursos livres, cursos técnicos, operações híbridas e
    ensino digital com recursos para controle acadêmico, experiência do aluno
    e gestão institucional em um único ambiente.
  </p>

  <h2 className="mt-10 text-3xl font-bold text-slate-900">
    Plataforma de gestão para cursos com ensino digital integrado
  </h2>
  <p className="mt-4 text-lg text-slate-600">
    Com o PHANYX, instituições podem controlar matrículas, histórico,
    desempenho, professores, conteúdos e progresso do aluno com mais
    organização, eficiência e visão de crescimento.
  </p>
</section>

      </main>

      <Footer />
    </>
  );
}
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const comparativo = [
  {
    titulo: "Interface moderna",
    descricao:
      "O PHANYX oferece uma experiência mais moderna, intuitiva e fácil de usar em comparação com sistemas tradicionais como o Moodle.",
  },
  {
    titulo: "Gestão acadêmica integrada",
    descricao:
      "Enquanto o Moodle foca apenas no ensino, o PHANYX integra gestão acadêmica, alunos, matrículas, boletim e documentos.",
  },
  {
    titulo: "Experiência completa",
    descricao:
      "O PHANYX une LMS + gestão + financeiro + documentos em uma única plataforma.",
  },
  {
    titulo: "Modelo SaaS escalável",
    descricao:
      "Arquitetura pronta para múltiplas instituições, com separação de dados e visão de crescimento.",
  },
];

const vantagens = [
  "Alternativa moderna ao Moodle",
  "Interface mais simples e intuitiva",
  "Gestão acadêmica integrada ao LMS",
  "Controle de alunos, turmas e matrículas",
  "Progresso e avaliações automatizadas",
  "Base pronta para crescimento institucional",
];

const faqs = [
  {
    pergunta: "O PHANYX substitui o Moodle?",
    resposta:
      "Sim. O PHANYX pode substituir o Moodle oferecendo uma experiência mais moderna, integrada e com gestão acadêmica completa.",
  },
  {
    pergunta: "Qual a principal diferença entre PHANYX e Moodle?",
    resposta:
      "O Moodle é focado apenas em ensino, enquanto o PHANYX integra ensino, gestão acadêmica, financeiro e documentos em um único sistema.",
  },
  {
    pergunta: "É mais fácil de usar que o Moodle?",
    resposta:
      "Sim. O PHANYX foi desenvolvido com foco em usabilidade, facilitando o uso para alunos, professores e administradores.",
  },
];

export default function MoodleParaEscolasPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        {/* HERO */}
        <section className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
            <div className="max-w-4xl">
              <p className="text-sm uppercase tracking-[0.2em] text-blue-200">
                Moodle para escolas
              </p>

              <h1 className="mt-4 text-4xl font-bold md:text-5xl">
                Alternativa ao Moodle para escolas, cursos e instituições de ensino
              </h1>

              <p className="mt-6 text-lg text-slate-300">
                O PHANYX é uma plataforma moderna que vai além do Moodle,
                oferecendo não apenas ensino digital, mas também gestão
                acadêmica completa, organização institucional e experiência
                profissional para alunos e professores.
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

        {/* COMPARATIVO */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold mb-10">
            Por que escolher PHANYX em vez de Moodle?
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {comparativo.map((item) => (
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

        {/* VANTAGENS */}
        <section className="bg-slate-50 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-10">
              Vantagens do PHANYX como plataforma educacional
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {vantagens.map((item) => (
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

        {/* CTA */}
        <section className="bg-slate-950 text-white py-16">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold">
              Evolua do Moodle para uma plataforma mais moderna
            </h2>

            <p className="mt-4 text-slate-300">
              O PHANYX oferece mais controle, mais integração e uma experiência
              superior para sua instituição.
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
      </main>

      <Footer />
    </>
  );
}
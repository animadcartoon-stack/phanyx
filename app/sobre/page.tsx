import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const pilares = [
  {
    titulo: "Gestão acadêmica moderna",
    descricao:
      "O PHANYX foi pensado para organizar cursos, disciplinas, turmas, matrículas, alunos e professores com mais controle e clareza.",
  },
  {
    titulo: "Ensino digital integrado",
    descricao:
      "A plataforma une gestão institucional com experiência EAD, permitindo aulas, materiais, progresso e avaliações em um só ambiente.",
  },
  {
    titulo: "Base SaaS escalável",
    descricao:
      "A arquitetura multi-instituição foi pensada para crescimento comercial, separação de dados e operação profissional.",
  },
];

export default function SobrePage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12 lg:py-20">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
                Sobre o PHANYX
              </p>

              <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
                Uma plataforma acadêmica criada para unir gestão, ensino digital e crescimento institucional
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
                O PHANYX nasceu com a proposta de oferecer às instituições de ensino
                uma plataforma moderna, organizada e escalável. Mais do que um sistema,
                ele foi pensado como uma base SaaS para operação acadêmica, experiência
                EAD, documentos, segurança e expansão comercial.
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
                  Falar com nossa equipe
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Nossa proposta
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Tecnologia para instituições que precisam de mais controle, imagem profissional e escala
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {pilares.map((item) => (
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
          <div className="mx-auto max-w-5xl px-6 py-16 md:px-10 lg:px-12">
            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                Visão
              </p>

              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Ser uma base sólida para instituições que desejam evoluir com organização e experiência moderna
              </h2>

              <p className="mt-4 text-lg leading-8 text-slate-600">
                O PHANYX foi pensado para apoiar instituições que buscam uma plataforma
                capaz de organizar a rotina acadêmica, fortalecer a experiência digital
                e transmitir mais credibilidade para alunos, professores e administração.
              </p>
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
                    Conheça o PHANYX e veja como sua instituição pode crescer com mais estrutura
                  </h2>
                  <p className="mt-4 max-w-3xl text-blue-100">
                    Entre em contato com nossa equipe e descubra como o PHANYX pode
                    fortalecer sua operação acadêmica e digital.
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
      </main>

      <Footer />
    </>
  );
}

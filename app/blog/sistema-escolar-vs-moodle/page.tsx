import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Sistema escolar vs Moodle: qual é melhor? | PHANYX",
  description:
    "Compare sistema escolar e Moodle. Veja diferenças, vantagens e qual solução é ideal para sua instituição de ensino.",
};

export default function SistemaVsMoodlePage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Sistema escolar vs Moodle: qual é melhor?
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Muitas instituições ficam em dúvida entre usar Moodle ou um sistema
            de gestão escolar completo. Cada opção atende necessidades diferentes.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            O que é o Moodle
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O Moodle é uma plataforma EAD focada em ensino online. Ele permite
            criar cursos, aulas e avaliações, mas não cobre toda a gestão da instituição.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            O que é um sistema de gestão escolar
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Um sistema de gestão escolar é uma solução completa que integra
            gestão acadêmica, financeira e administrativa em uma única plataforma.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Principais diferenças
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Moodle é focado em aulas online</li>
            <li>Sistema escolar cobre toda a instituição</li>
            <li>Moodle não tem financeiro completo</li>
            <li>Sistemas completos integram tudo</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            Qual escolher?
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Se sua instituição precisa apenas de ensino online, o Moodle pode
            atender. Mas se você precisa de gestão completa, o ideal é um sistema
            de gestão escolar integrado.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como solução completa
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX combina gestão escolar e plataforma EAD em um único sistema,
            eliminando a necessidade de múltiplas ferramentas.
          </p>

          <a
            href="/sistema-escolar"
            className="mt-6 inline-block text-blue-600 underline"
          >
            Conheça o sistema completo do PHANYX
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
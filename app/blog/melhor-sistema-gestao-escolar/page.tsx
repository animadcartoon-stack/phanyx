import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Melhor sistema de gestão escolar em 2026 | PHANYX",
  description:
    "Descubra qual é o melhor sistema de gestão escolar em 2026. Compare funcionalidades, vantagens e veja como escolher a melhor plataforma para sua instituição.",
};

export default function MelhorSistemaEscolarPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Qual é o melhor sistema de gestão escolar em 2026?
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Escolher o melhor sistema de gestão escolar é uma das decisões mais
            importantes para escolas, faculdades e instituições de ensino que
            desejam crescer com organização, eficiência e controle.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            O que um sistema de gestão escolar precisa ter
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Um bom sistema escolar deve integrar gestão acadêmica, financeira e
            administrativa em uma única plataforma. Isso inclui controle de alunos,
            professores, turmas, provas, presença e emissão de certificados.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Principais funcionalidades
          </h2>

          <ul className="mt-4 list-disc pl-6 text-lg text-slate-600">
            <li>Gestão de alunos e matrículas</li>
            <li>Controle financeiro e inadimplência</li>
            <li>Plataforma EAD integrada</li>
            <li>Provas e avaliações online</li>
            <li>Relatórios e indicadores</li>
          </ul>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX: uma solução completa
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX é uma plataforma completa que reúne todas essas
            funcionalidades em um único sistema, permitindo que instituições
            tenham controle total da operação acadêmica e financeira.
          </p>

          <a
            href="/sistema-escolar"
            className="mt-6 inline-block text-blue-600 underline"
          >
            Conheça o sistema de gestão escolar do PHANYX
          </a>

          <h2 className="mt-10 text-3xl font-bold">
            Como escolher o melhor sistema
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Para escolher o melhor sistema, é importante avaliar facilidade de uso,
            suporte, funcionalidades e capacidade de crescimento da plataforma.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Conclusão
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O melhor sistema de gestão escolar é aquele que integra todas as áreas
            da instituição e permite crescimento sem limitações. Plataformas como
            o PHANYX se destacam por oferecer uma solução completa e moderna.
          </p>
          <div className="mt-10 border-t pt-6">
  <h3 className="text-xl font-bold text-slate-900">
    Leia também
  </h3>

  <ul className="mt-4 space-y-2">
    <li>
      <a href="/blog/sistema-escolar-vs-moodle" className="text-blue-600 underline">
        Sistema escolar vs Moodle: qual é melhor?
      </a>
    </li>

    <li>
      <a href="/blog/como-escolher-sistema-escolar" className="text-blue-600 underline">
        Como escolher um sistema de gestão escolar
      </a>
    </li>

    <li>
      <a href="/blog/sistema-escolar-gratis-vs-pago" className="text-blue-600 underline">
        Sistema escolar grátis vs pago: qual escolher?
      </a>
    </li>
  </ul>
</div>
        </section>
      </main>

      <Footer />
    </>
  );
}
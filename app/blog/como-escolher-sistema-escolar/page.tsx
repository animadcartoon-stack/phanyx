import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Como escolher um sistema de gestão escolar | PHANYX",
  description:
    "Veja como escolher um sistema de gestão escolar para sua instituição. Entenda os critérios mais importantes antes de contratar uma plataforma.",
};

export default function ComoEscolherSistemaEscolarPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Como escolher um sistema de gestão escolar
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Escolher um sistema de gestão escolar é uma decisão estratégica para
            escolas, faculdades, cursos técnicos e instituições de ensino que
            precisam de mais organização, controle e crescimento sustentável.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Entenda o que sua instituição realmente precisa
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Antes de contratar qualquer plataforma, é importante mapear as
            necessidades da instituição. Algumas precisam apenas de gestão
            acadêmica, enquanto outras precisam também de financeiro, documentos,
            plataforma EAD, provas online e acompanhamento do aluno.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Avalie se o sistema integra gestão acadêmica e financeira
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Um bom sistema escolar deve centralizar a rotina acadêmica e também
            permitir controle financeiro, acompanhamento de inadimplência,
            relatórios e visão mais ampla da operação. Quanto mais integrado for
            o sistema, menos retrabalho a instituição terá.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Verifique a experiência para alunos, professores e administração
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Não basta o sistema funcionar apenas para o administrativo. A
            plataforma ideal deve oferecer áreas próprias para alunos,
            professores e administração, com navegação clara, lógica e moderna.
            Isso melhora o uso diário e reduz dificuldades operacionais.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Considere recursos de ensino digital e EAD
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Muitas instituições precisam de aulas online, materiais, atividades,
            provas e acompanhamento de progresso. Por isso, escolher um sistema
            com plataforma EAD integrada pode ser uma decisão muito mais
            inteligente do que usar várias ferramentas separadas.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Analise escalabilidade e visão de crescimento
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O sistema precisa acompanhar o crescimento da instituição. Isso
            significa suportar mais alunos, mais cursos, mais professores e mais
            processos sem virar um problema no futuro. Plataformas SaaS
            modernas costumam oferecer essa base com mais segurança.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como plataforma completa
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX foi desenvolvido para unir gestão escolar, gestão
            acadêmica, financeiro, documentos e plataforma EAD em um único
            sistema. Isso permite mais controle, menos retrabalho e uma visão
            mais estratégica para instituições que desejam crescer.
          </p>

          <a
            href="/sistema-escolar"
            className="mt-6 inline-block text-blue-600 underline"
          >
            Conheça o sistema de gestão escolar do PHANYX
          </a>
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
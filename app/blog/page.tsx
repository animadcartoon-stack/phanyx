import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Blog PHANYX | Sistema de Gestão Escolar e EAD",
  description:
    "Conteúdos sobre sistema de gestão escolar, plataforma EAD, gestão acadêmica e tecnologia educacional.",
};

export default function BlogPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold mb-6">
            Blog PHANYX
          </h1>

          <p className="text-lg text-slate-600 mb-10">
            Conteúdos completos sobre gestão escolar, plataformas EAD e tecnologia educacional.
          </p>

          <div className="space-y-6">

            <Link href="/blog/sistema-gestao-escolar" className="block border p-6 rounded-lg hover:shadow">
              <h2 className="text-2xl font-semibold">
                Melhor sistema de gestão escolar em 2026
              </h2>
              <p className="text-slate-600 mt-2">
                Descubra como escolher o melhor sistema escolar para sua instituição.
              </p>
            </Link>
<Link href="/blog/como-escolher-sistema-escolar" className="block border p-6 rounded-lg hover:shadow">
  <h2 className="text-2xl font-semibold">
    Como escolher um sistema de gestão escolar
  </h2>
  <p className="text-slate-600 mt-2">
    Entenda os critérios mais importantes antes de contratar uma plataforma para sua instituição.
  </p>
</Link>
<Link href="/blog/sistema-escolar-gratis-vs-pago" className="block border p-6 rounded-lg hover:shadow">
  <h2 className="text-2xl font-semibold">
    Sistema escolar grátis vs pago: qual escolher?
  </h2>
  <p className="text-slate-600 mt-2">
    Compare vantagens e descubra qual opção faz mais sentido para sua instituição.
  </p>
</Link>
<Link href="/blog/como-aumentar-matriculas-com-sistema-escolar-moderno" className="block border p-6 rounded-lg hover:shadow">
  <h2 className="text-2xl font-semibold">
    Como aumentar matrículas com um sistema escolar moderno
  </h2>
  <p className="text-slate-600 mt-2">
    Veja como organizar sua instituição e aumentar conversão de alunos.
  </p>
</Link>
<Link href="/blog/plataforma-ead-para-cursos-livres" className="block border p-6 rounded-lg hover:shadow">
  <h2 className="text-2xl font-semibold">
    Plataforma EAD para cursos livres
  </h2>
  <p className="text-slate-600 mt-2">
    Veja como estruturar cursos online com uma plataforma profissional.
  </p>
</Link>
<Link href="/blog/software-para-escolas-completo" className="block border p-6 rounded-lg hover:shadow">
  <h2 className="text-2xl font-semibold">
    Software para escolas completo
  </h2>
  <p className="text-slate-600 mt-2">
    Veja como um sistema pode transformar a gestão educacional.
  </p>
</Link>
<Link href="/blog/gestao-academica-na-pratica" className="block border p-6 rounded-lg hover:shadow">
  <h2 className="text-2xl font-semibold">
    Gestão acadêmica na prática
  </h2>
  <p className="text-slate-600 mt-2">
    Veja como organizar sua instituição com gestão acadêmica eficiente.
  </p>
</Link>
<Link href="/blog/como-reduzir-inadimplencia-escolar-com-tecnologia" className="block border p-6 rounded-lg hover:shadow">
  <h2 className="text-2xl font-semibold">
    Como reduzir inadimplência escolar com tecnologia
  </h2>
  <p className="text-slate-600 mt-2">
    Veja como controlar pagamentos e reduzir atrasos em sua instituição.
  </p>
</Link>
<Link href="/blog/controle-financeiro-para-escolas" className="block border p-6 rounded-lg hover:shadow">
  <h2 className="text-2xl font-semibold">
    Controle financeiro para escolas
  </h2>
  <p className="text-slate-600 mt-2">
    Veja como organizar o financeiro da sua instituição de ensino.
  </p>
</Link>
<Link href="/blog/sistema-para-cursos-profissionalizantes" className="block border p-6 rounded-lg hover:shadow">
  <h2 className="text-2xl font-semibold">
    Sistema para cursos profissionalizantes
  </h2>
  <p className="text-slate-600 mt-2">
    Veja como organizar cursos técnicos e profissionalizantes com tecnologia.
  </p>
</Link>
<Link href="/blog/sistema-de-gestao-escolar-online" className="block border p-6 rounded-lg hover:shadow">
  <h2 className="text-2xl font-semibold">
    Sistema de gestão escolar online
  </h2>
  <p className="text-slate-600 mt-2">
    Veja como organizar sua instituição com um sistema online completo.
  </p>
</Link>
<Link href="/blog/melhor-sistema-academico" className="block border p-6 rounded-lg hover:shadow">
  <h2 className="text-2xl font-semibold">
    Melhor sistema acadêmico em 2026
  </h2>
  <p className="text-slate-600 mt-2">
    Veja como escolher a melhor plataforma acadêmica para sua instituição.
  </p>
</Link>
<Link href="/blog/sistema-escolar-para-pequenas-escolas" className="block border p-6 rounded-lg hover:shadow">
  <h2 className="text-2xl font-semibold">
    Sistema escolar para pequenas escolas
  </h2>
  <p className="text-slate-600 mt-2">
    Veja como pequenas escolas podem se organizar com tecnologia.
  </p>
</Link>
<Link href="/blog/software-educacional-completo" className="block border p-6 rounded-lg hover:shadow">
  <h2 className="text-2xl font-semibold">
    Software educacional completo
  </h2>
  <p className="text-slate-600 mt-2">
    Veja como um sistema pode transformar a gestão educacional.
  </p>
</Link>
<Link href="/blog/plataforma-para-ensino-online" className="block border p-6 rounded-lg hover:shadow">
  <h2 className="text-2xl font-semibold">
    Plataforma para ensino online
  </h2>
  <p className="text-slate-600 mt-2">
    Veja como estruturar cursos digitais com uma plataforma completa.
  </p>
</Link>
<Link href="/blog/melhor-plataforma-para-cursos-online" className="block border p-6 rounded-lg hover:shadow">
  <h2 className="text-2xl font-semibold">
    Melhor plataforma para cursos online
  </h2>
  <p className="text-slate-600 mt-2">
    Veja como escolher a melhor plataforma para vender cursos online.
  </p>
</Link>
<Link href="/blog/como-vender-cursos-online" className="block border p-6 rounded-lg hover:shadow">
  <h2 className="text-2xl font-semibold">
    Como vender cursos online
  </h2>
  <p className="text-slate-600 mt-2">
    Veja como criar e vender cursos digitais com uma plataforma profissional.
  </p>
</Link>
          </div>
        </section>
        <section className="bg-white">
  <div className="mx-auto max-w-5xl px-6 py-20">
    <h2 className="text-3xl font-bold text-slate-900">
      Blog sobre sistema de gestão escolar, plataforma EAD e gestão acadêmica
    </h2>

    <p className="mt-4 text-lg leading-8 text-slate-600">
      O blog do PHANYX reúne conteúdos sobre sistema de gestão escolar,
      plataforma EAD, gestão acadêmica, tecnologia educacional e crescimento
      de instituições de ensino. O objetivo é ajudar escolas, faculdades e
      cursos a escolherem soluções mais modernas para organizar sua operação.
    </p>

    <h2 className="mt-10 text-3xl font-bold text-slate-900">
      Conteúdos para escolas, faculdades e cursos
    </h2>

    <p className="mt-4 text-lg leading-8 text-slate-600">
      Aqui você encontra artigos sobre como escolher um sistema escolar,
      diferenças entre Moodle e plataformas completas, comparação entre
      sistemas gratuitos e pagos, além de guias para instituições que desejam
      melhorar a gestão acadêmica e o ensino digital.
    </p>

    <h2 className="mt-10 text-3xl font-bold text-slate-900">
      PHANYX como referência em tecnologia educacional
    </h2>

    <p className="mt-4 text-lg leading-8 text-slate-600">
      O PHANYX foi desenvolvido para unir gestão escolar, gestão acadêmica,
      controle financeiro, documentos e plataforma EAD em uma única solução.
      Por isso, este blog também funciona como um centro de conteúdo para
      instituições que desejam crescer com mais controle, organização e visão
      estratégica.
    </p>
  </div>
</section>
      </main>

      <Footer />
    </>
  );
}
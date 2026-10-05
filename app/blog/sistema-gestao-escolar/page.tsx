import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Melhor sistema de gestão escolar: como escolher em 2026",
  description:
    "Compare critérios para escolher um sistema de gestão escolar: matrículas, frequência, financeiro, documentos, ensino digital, segurança e implantação.",
  alternates: { canonical: "/blog/sistema-gestao-escolar" },
  openGraph: {
    title: "Como escolher o melhor sistema de gestão escolar em 2026 | PHANYX",
    description:
      "Um guia prático para comparar sistemas de gestão escolar conforme a rotina da sua instituição.",
    type: "article",
    url: "/blog/sistema-gestao-escolar",
  },
};

const criterios = [
  {
    titulo: "Matrículas e estrutura acadêmica",
    detalhe:
      "Peça uma demonstração com um aluno fictício: cadastro, vínculo ao curso e à turma, documentos e acompanhamento ao longo do período. Veja se a equipe encontra essas informações sem refazer registros.",
  },
  {
    titulo: "Presença, notas e acompanhamento",
    detalhe:
      "Teste o lançamento de presença e notas na rotina docente, a consulta pelo aluno e a visão da coordenação. Confirme como faltas e desempenho entram nos indicadores de acompanhamento.",
  },
  {
    titulo: "Financeiro e documentos",
    detalhe:
      "Verifique cobranças, recebimentos, permissões e emissão de documentos com um cenário real da instituição. Confirme quais integrações, modelos e fluxos estão disponíveis no plano avaliado.",
  },
  {
    titulo: "Ensino presencial e digital",
    detalhe:
      "Se a instituição oferece ensino online ou híbrido, percorra a experiência de aula, materiais, atividades e avaliações. A plataforma de ensino precisa conversar com a gestão acadêmica.",
  },
  {
    titulo: "Acessos, implantação e suporte",
    detalhe:
      "Confira o que cada perfil pode ver, como os dados existentes serão migrados, qual apoio a equipe receberá e quais condições de suporte constam na proposta.",
  },
];

export default function ArticlePage() {
  return (
    <>
      <Header />
      <main className="bg-white text-slate-900">
        <article className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Guia de escolha</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
            Qual é o melhor sistema de gestão escolar para sua instituição?
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-700">
            A resposta depende da rotina que a instituição precisa organizar. Uma escola pequena, uma faculdade e um curso online podem exigir processos e permissões diferentes. Em vez de escolher pela lista de recursos, compare o caminho completo de alunos, professores e equipe administrativa.
          </p>

          <nav aria-label="Nesta página" className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold">Neste guia</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-blue-700">
              <li><a href="#criterios" className="underline">Cinco critérios para comparar sistemas</a></li>
              <li><a href="#demonstracao" className="underline">O que testar na demonstração</a></li>
              <li><a href="#phanyx" className="underline">Como avaliar o PHANYX</a></li>
            </ul>
          </nav>

          <section id="criterios" className="mt-14 scroll-mt-24">
            <h2 className="text-3xl font-bold">Cinco critérios para comparar sistemas de gestão escolar</h2>
            <p className="mt-4 leading-7 text-slate-700">
              Use os mesmos casos de teste em cada demonstração. Assim fica mais fácil comparar a experiência da equipe e os limites de cada proposta.
            </p>
            <ol className="mt-8 space-y-5">
              {criterios.map((item, index) => (
                <li key={item.titulo} className="rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-xl font-semibold"><span className="mr-2 text-blue-700">{index + 1}.</span>{item.titulo}</h3>
                  <p className="mt-3 leading-7 text-slate-700">{item.detalhe}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="demonstracao" className="mt-14 scroll-mt-24">
            <h2 className="text-3xl font-bold">O que pedir durante a demonstração</h2>
            <p className="mt-4 leading-7 text-slate-700">
              Comece com um aluno fictício e peça para a equipe percorrer matrícula, turma, chamada, consulta de notas, documento e situação financeira. Repita uma etapa com o acesso do professor e outra com o acesso do aluno. Anote tarefas que dependem de planilhas, configurações adicionais ou serviços externos.
            </p>
            <p className="mt-4 leading-7 text-slate-700">
              Solicite por escrito os módulos incluídos, o processo de migração, o prazo de implantação e as condições comerciais. Isso evita comparar uma tela de demonstração com um plano que não inclui o mesmo fluxo.
            </p>
          </section>

          <section id="phanyx" className="mt-14 scroll-mt-24 rounded-2xl bg-slate-950 p-7 text-white md:p-9">
            <h2 className="text-3xl font-bold">Avalie o PHANYX com esse roteiro</h2>
            <p className="mt-4 leading-7 text-slate-200">
              O PHANYX reúne matrículas, cursos e turmas, registro de presenças, acompanhamento acadêmico, financeiro, documentos e ensino digital. Peça uma demonstração dos fluxos que sua instituição utiliza e confirme o escopo do plano e da implantação com a equipe.
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link href="/sistema-escolar" className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500">Conhecer o sistema escolar</Link>
              <Link href="/planos" className="rounded-xl border border-white/30 px-5 py-3 font-semibold text-white hover:bg-white/10">Comparar planos</Link>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-3xl font-bold">Perguntas frequentes</h2>
            <h3 className="mt-7 text-xl font-semibold">Existe um único melhor sistema para todas as escolas?</h3>
            <p className="mt-3 leading-7 text-slate-700">Não. A escolha depende dos processos, do porte, das modalidades de ensino, do orçamento e da capacidade de implantação da instituição.</p>
            <h3 className="mt-7 text-xl font-semibold">Como comparar o custo total?</h3>
            <p className="mt-3 leading-7 text-slate-700">Considere mensalidade, cobrança por aluno ou unidade, módulos adicionais, migração, treinamento e suporte. Confirme tudo na proposta comercial.</p>
          </section>

          <nav aria-label="Leituras relacionadas" className="mt-14 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold">Leia também</h2>
            <ul className="mt-4 space-y-3 text-blue-700">
              <li><Link className="underline" href="/blog/como-escolher-sistema-escolar">Como escolher um sistema de gestão escolar</Link></li>
              <li><Link className="underline" href="/blog/sistema-escolar-vs-moodle">Sistema escolar e Moodle: diferenças</Link></li>
              <li><Link className="underline" href="/blog/sistema-escolar-gratis-vs-pago">Sistema escolar grátis ou pago?</Link></li>
            </ul>
          </nav>
        </article>
      </main>
      <Footer />
    </>
  );
}

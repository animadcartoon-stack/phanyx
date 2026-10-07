import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { marketingCopy } from "@/lib/public-marketing";
import { schoolGuideAlternates, schoolGuideLocales, schoolGuidePath } from "@/lib/school-guide";

export const metadata: Metadata = {
  title: "Melhor sistema de gestÃƒÂ£o escolar: como escolher em 2027",
  description:
    "Compare critÃƒÂ©rios para escolher um sistema de gestÃƒÂ£o escolar: matrÃƒÂ­culas, frequÃƒÂªncia, financeiro, documentos, ensino digital, seguranÃƒÂ§a e implantaÃƒÂ§ÃƒÂ£o.",
  alternates: { canonical: "/blog/sistema-gestao-escolar", ...schoolGuideAlternates() },
  openGraph: {
    title: "Como escolher o melhor sistema de gestÃƒÂ£o escolar em 2027 | PHANYX",
    description:
      "Um guia prÃƒÂ¡tico para comparar sistemas de gestÃƒÂ£o escolar conforme a rotina da sua instituiÃƒÂ§ÃƒÂ£o.",
    type: "article",
    url: "/blog/sistema-gestao-escolar",
    images: ["/images/guia-sistema-gestao-escolar-sala.webp"],
  },
};

const criterios = [
  {
    titulo: "MatrÃƒÂ­culas e estrutura acadÃƒÂªmica",
    detalhe:
      "PeÃƒÂ§a uma demonstraÃƒÂ§ÃƒÂ£o com um aluno fictÃƒÂ­cio: cadastro, vÃƒÂ­nculo ao curso e ÃƒÂ  turma, documentos e acompanhamento ao longo do perÃƒÂ­odo. Veja se a equipe encontra essas informaÃƒÂ§ÃƒÂµes sem refazer registros.",
  },
  {
    titulo: "PresenÃƒÂ§a, notas e acompanhamento",
    detalhe:
      "Teste o lanÃƒÂ§amento de presenÃƒÂ§a e notas na rotina docente, a consulta pelo aluno e a visÃƒÂ£o da coordenaÃƒÂ§ÃƒÂ£o. Confirme como faltas e desempenho entram nos indicadores de acompanhamento.",
  },
  {
    titulo: "Financeiro e documentos",
    detalhe:
      "Verifique cobranÃƒÂ§as, recebimentos, permissÃƒÂµes e emissÃƒÂ£o de documentos com um cenÃƒÂ¡rio real da instituiÃƒÂ§ÃƒÂ£o. Confirme quais integraÃƒÂ§ÃƒÂµes, modelos e fluxos estÃƒÂ£o disponÃƒÂ­veis no plano avaliado.",
  },
  {
    titulo: "Ensino presencial e digital",
    detalhe:
      "Se a instituiÃƒÂ§ÃƒÂ£o oferece ensino online ou hÃƒÂ­brido, percorra a experiÃƒÂªncia de aula, materiais, atividades e avaliaÃƒÂ§ÃƒÂµes. A plataforma de ensino precisa conversar com a gestÃƒÂ£o acadÃƒÂªmica.",
  },
  {
    titulo: "Acessos, implantaÃƒÂ§ÃƒÂ£o e suporte",
    detalhe:
      "Confira o que cada perfil pode ver, como os dados existentes serÃƒÂ£o migrados, qual apoio a equipe receberÃƒÂ¡ e quais condiÃƒÂ§ÃƒÂµes de suporte constam na proposta.",
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
            Qual ÃƒÂ© o melhor sistema de gestÃƒÂ£o escolar para sua instituiÃƒÂ§ÃƒÂ£o?
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-700">
            A resposta depende da rotina que a instituiÃƒÂ§ÃƒÂ£o precisa organizar. Uma escola pequena, uma faculdade e um curso online podem exigir processos e permissÃƒÂµes diferentes. Em vez de escolher pela lista de recursos, compare o caminho completo de alunos, professores e equipe administrativa.
          </p>

          <figure className="mt-10 overflow-hidden rounded-2xl border border-slate-200">
            <Image
              src="/images/guia-sistema-gestao-escolar-sala.webp"
              alt="Professora acompanha trÃƒÂªs alunos em uma atividade com computador na sala de aula"
              width={1672}
              height={941}
              sizes="(max-width: 896px) 100vw, 896px"
              className="h-auto w-full"
              priority
            />
          </figure>

          <nav aria-label="Nesta pÃƒÂ¡gina" className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold">Neste guia</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-blue-700">
              <li><a href="#criterios" className="underline">Cinco critÃƒÂ©rios para comparar sistemas</a></li>
              <li><a href="#demonstracao" className="underline">O que testar na demonstraÃƒÂ§ÃƒÂ£o</a></li>
              <li><a href="#phanyx" className="underline">Como avaliar o PHANYX</a></li>
            </ul>
          </nav>

          <section id="criterios" className="mt-14 scroll-mt-24">
            <h2 className="text-3xl font-bold">Cinco critÃƒÂ©rios para comparar sistemas de gestÃƒÂ£o escolar</h2>
            <p className="mt-4 leading-7 text-slate-700">
              Use os mesmos casos de teste em cada demonstraÃƒÂ§ÃƒÂ£o. Assim fica mais fÃƒÂ¡cil comparar a experiÃƒÂªncia da equipe e os limites de cada proposta.
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
            <h2 className="text-3xl font-bold">O que pedir durante a demonstraÃƒÂ§ÃƒÂ£o</h2>
            <p className="mt-4 leading-7 text-slate-700">
              Comece com um aluno fictÃƒÂ­cio e peÃƒÂ§a para a equipe percorrer matrÃƒÂ­cula, turma, chamada, consulta de notas, documento e situaÃƒÂ§ÃƒÂ£o financeira. Repita uma etapa com o acesso do professor e outra com o acesso do aluno. Anote tarefas que dependem de planilhas, configuraÃƒÂ§ÃƒÂµes adicionais ou serviÃƒÂ§os externos.
            </p>
            <p className="mt-4 leading-7 text-slate-700">
              Solicite por escrito os mÃƒÂ³dulos incluÃƒÂ­dos, o processo de migraÃƒÂ§ÃƒÂ£o, o prazo de implantaÃƒÂ§ÃƒÂ£o e as condiÃƒÂ§ÃƒÂµes comerciais. Isso evita comparar uma tela de demonstraÃƒÂ§ÃƒÂ£o com um plano que nÃƒÂ£o inclui o mesmo fluxo.
            </p>
          </section>

          <section id="phanyx" className="mt-14 scroll-mt-24 rounded-2xl bg-slate-950 p-7 text-white md:p-9">
            <h2 className="text-3xl font-bold">Avalie o PHANYX com esse roteiro</h2>
            <p className="mt-4 leading-7 text-slate-200">
              O PHANYX reÃƒÂºne matrÃƒÂ­culas, cursos e turmas, registro de presenÃƒÂ§as, acompanhamento acadÃƒÂªmico, financeiro, documentos e ensino digital. PeÃƒÂ§a uma demonstraÃƒÂ§ÃƒÂ£o dos fluxos que sua instituiÃƒÂ§ÃƒÂ£o utiliza e confirme o escopo do plano e da implantaÃƒÂ§ÃƒÂ£o com a equipe.
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link href="/sistema-escolar" className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500">Conhecer o sistema escolar</Link>
              <Link href="/planos" className="rounded-xl border border-white/30 px-5 py-3 font-semibold text-white hover:bg-white/10">Comparar planos</Link>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-3xl font-bold">Perguntas frequentes</h2>
            <h3 className="mt-7 text-xl font-semibold">Existe um ÃƒÂºnico melhor sistema para todas as escolas?</h3>
            <p className="mt-3 leading-7 text-slate-700">NÃƒÂ£o. A escolha depende dos processos, do porte, das modalidades de ensino, do orÃƒÂ§amento e da capacidade de implantaÃƒÂ§ÃƒÂ£o da instituiÃƒÂ§ÃƒÂ£o.</p>
            <h3 className="mt-7 text-xl font-semibold">Como comparar o custo total?</h3>
            <p className="mt-3 leading-7 text-slate-700">Considere mensalidade, cobranÃƒÂ§a por aluno ou unidade, mÃƒÂ³dulos adicionais, migraÃƒÂ§ÃƒÂ£o, treinamento e suporte. Confirme tudo na proposta comercial.</p>
          </section>

          <nav aria-label="Leituras relacionadas" className="mt-14 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold">Leia tambÃƒÂ©m</h2>
            <ul className="mt-4 space-y-3 text-blue-700">
              <li><Link className="underline" href="/blog/sistema-de-gestao-escolar-online">O que ÃƒÂ© um sistema de gestÃƒÂ£o escolar online</Link></li>
              <li><Link className="underline" href="/blog/sistema-escolar-vs-moodle">Sistema escolar e Moodle: diferenÃƒÂ§as</Link></li>
              <li><Link className="underline" href="/blog/sistema-escolar-gratis-vs-pago">Sistema escolar grÃƒÂ¡tis ou pago?</Link></li>
            </ul>
          </nav>
          <nav aria-label="Outros idiomas" className="mt-10 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold">Leia este guia em outro idioma</h2>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-blue-700">
              {schoolGuideLocales.filter((locale) => locale !== "pt-BR").map((locale) => (
                <li key={locale}><Link href={schoolGuidePath(locale)} hrefLang={locale} className="underline">{marketingCopy[locale].name}</Link></li>
              ))}
            </ul>
          </nav>
        </article>
      </main>
      <Footer />
    </>
  );
}

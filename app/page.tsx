"use client";

import Link from "next/link";
import Header from "@/components/layout/Header";
import Image from "next/image";
import Footer from "@/components/layout/Footer";

const modulos = [
  {
    titulo: "Gestão Acadêmica",
    descricao:
      "Controle de cursos, disciplinas, turmas, matrículas, alunos, professores e operações acadêmicas em um só lugar.",
    emoji: "🎓",
  },
  {
    titulo: "LMS / Ensino EAD",
    descricao:
      "Aulas, materiais, progresso do aluno, avaliações online e experiência moderna para ensino presencial e a distância.",
    emoji: "💻",
  },
  {
    titulo: "Financeiro Inteligente",
    descricao:
      "Recebimentos, lançamentos, baixas, controle financeiro institucional e base pronta para automações avançadas.",
    emoji: "💰",
  },
  {
    titulo: "Documentos Validados",
    descricao:
      "Geração de documentos com QR Code, código único e validação pública para mais confiança institucional.",
    emoji: "📄",
  },
  {
    titulo: "Segurança e Antifraude",
    descricao:
      "Auditoria, score de risco, validação documental e recursos de bloqueio para proteção do ambiente institucional.",
    emoji: "🛡️",
  },
  {
    titulo: "Arquitetura SaaS",
    descricao:
      "Estrutura multi-instituição com separação por instituicaoId, pronta para escalar com segurança e organização.",
    emoji: "🏢",
  },
];

const diferenciais = [
  "Multi-instituição com isolamento de dados",
  "Experiência moderna para administração, professor e aluno",
  "Base preparada para universidades, faculdades, escolas técnicas e EAD",
  "Documentação e validação institucional integradas",
  "Estrutura pronta para crescimento comercial do produto",
  "Segurança elevada para operações acadêmicas e administrativas",
];

const faqs = [
  {
    pergunta: "O PHANYX atende apenas uma instituição?",
    resposta:
      "Não. O PHANYX foi estruturado como SaaS multi-instituição, permitindo operar várias instituições com separação de dados e organização escalável.",
  },
  {
    pergunta: "O sistema possui área para aluno, professor e administração?",
    resposta:
      "Sim. A plataforma foi pensada para atender os principais perfis institucionais com experiência própria para cada tipo de usuário.",
  },
  {
    pergunta: "O PHANYX já possui recursos de segurança?",
    resposta:
      "Sim. O projeto já contempla autenticação por JWT, validação documental, auditoria e recursos antifraude em evolução.",
  },
  {
    pergunta: "É possível usar para ensino presencial e EAD?",
    resposta:
      "Sim. A proposta do PHANYX é atender operações acadêmicas e também ensino digital, com estrutura para aulas, materiais, progresso e provas.",
  },
];

const paginasSeo = [
  {
    titulo: "Gestão escolar",
    descricao:
      "Conheça a solução PHANYX para gestão escolar com controle acadêmico, financeiro e experiência moderna.",
    href: "/gestao-escolar",
  },
  {
    titulo: "Gestão acadêmica",
    descricao:
      "Veja como o PHANYX organiza cursos, turmas, matrículas, documentos e operação institucional.",
    href: "/gestao-academica",
  },
  {
    titulo: "Plataforma EAD",
    descricao:
      "Aulas, materiais, progresso do aluno, avaliações online e ambiente digital completo para sua instituição.",
    href: "/plataforma-ead",
  },
  {
    titulo: "Sistema escolar",
    descricao:
      "Uma plataforma preparada para escolas, faculdades, cursos livres e operações educacionais escaláveis.",
    href: "/sistema-escolar",
  },
  {
    titulo: "Moodle para escolas",
    descricao:
      "Entenda as diferenças entre o PHANYX e soluções tradicionais para ensino digital e gestão acadêmica.",
    href: "/moodle-para-escolas",
  },
  {
    titulo: "Software para cursos",
    descricao:
      "Uma solução profissional para cursos presenciais, híbridos e EAD com visão SaaS real.",
    href: "/software-para-cursos",
  },
];

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="bg-white text-gray-900">
        <section className="relative overflow-hidden border-b border-slate-800 bg-[#06133a] text-white">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_30%)]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#020817] via-[#081a52] to-[#142863]" />
          </div>

          <div className="absolute right-0 top-0 hidden h-full w-[42%] lg:block">
  <div
    className="absolute inset-0 overflow-hidden"
    style={{
      clipPath: "polygon(1% 0%, 100% 0%, 100% 100%, 16% 100%)"
    }}
  >
    <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#06133a] via-[#06133a]/40 to-transparent" />
    <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#020817]/65 via-transparent to-transparent" />

    <Image
      src="/images/formax-hero.jpg"
      alt="PHANYX plataforma acadêmica"
      fill
      priority
      className="object-cover object-[68%_center] scale-[1.04]"
    />
  </div>

  <div className="absolute left-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-blue-500/15 blur-3xl" />
  <div className="absolute left-[-20px] top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-blue-500/12 blur-3xl" />
  <div className="absolute bottom-[-30px] left-[-10px] h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
</div>

          <div className="relative z-10 mx-auto max-w-7xl px-6 pb-12 pt-8 md:px-10 md:pb-14 md:pt-10 lg:px-12 lg:pb-16 lg:pt-12">
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="max-w-2xl -mt-1 md:-mt-2">
                <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-blue-200 backdrop-blur">
                  Plataforma acadêmica SaaS multi-instituição
                </div>

                <h1 className="mt-3 text-3xl font-semibold leading-[1.02] tracking-[-0.03em] text-white md:text-4xl xl:text-[3.1rem]">
                  <span className="block text-white">
                    PHANYX para gestão escolar, gestão acadêmica e plataforma EAD
                  </span>

                  <span className="mt-2 block bg-gradient-to-r from-blue-300 via-blue-200 to-blue-400 bg-clip-text text-transparent">
                    mais controle institucional, experiência moderna e base SaaS real
                  </span>
                </h1>

                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 md:text-base">
                  Estruture sua instituição com uma plataforma moderna, escalável
                  e preparada para universidades, faculdades, escolas técnicas,
                  cursos livres e ensino a distância. O PHANYX une gestão
                  acadêmica, LMS, financeiro, documentos e segurança institucional
                  em um só ambiente.
                </p>

                <div className="mt-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                    <Link
                      href="/planos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(37,99,235,0.45)] transition duration-300 hover:-translate-y-0.5 hover:bg-blue-500"
                    >
                      Ver planos
                    </Link>

                    <a
                      href="https://wa.me/5548988101240?text=Olá!%20Quero%20saber%20mais%20sobre%20o%20PHANYX."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white/15"
                    >
                      Falar com comercial
                    </a>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      href="/login?portal=aluno"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-blue-300 px-4 py-2 text-sm text-white hover:bg-blue-700"
                    >
                      Área do aluno
                    </a>

                    <a
                      href="/login?portal=professor"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-blue-300 px-4 py-2 text-sm text-white hover:bg-blue-700"
                    >
                      Área do professor
                    </a>

                    <a
                      href="/login?portal=admin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-gray-100"
                    >
                      Admin
                    </a>
                  </div>
                </div>

                <div className="mt-6 hidden gap-4 xl:grid xl:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <p className="text-xl font-bold text-white">Multi-tenant</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      Estrutura pronta para várias instituições com separação de
                      dados.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <p className="text-xl font-bold text-white">LMS + Gestão</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      Acadêmico, ensino digital, documentos e financeiro em um
                      só sistema.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <p className="text-xl font-bold text-white">Segurança</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      Auditoria, validação e base antifraude para uso
                      institucional.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative lg:hidden">
                <div className="relative h-[260px] overflow-hidden rounded-[28px] border border-white/10 shadow-2xl sm:h-[300px]">
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#020817]/70 via-transparent to-transparent" />
                  <Image
                    src="/images/formax-hero.jpg"
                    alt="PHANYX plataforma acadêmica"
                    fill
                    priority
                    className="object-cover object-[78%_center]"
                  />

                  <div className="absolute bottom-3 left-3 right-3 z-20 rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur md:bottom-4 md:left-4 md:right-4 md:p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200 md:text-xs">
                      Plataforma pronta para crescer
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-100 md:text-sm md:leading-6">
                      Mais controle acadêmico, mais credibilidade institucional
                      e uma experiência moderna para administração, professores e
                      alunos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <a
            href="https://wa.me/5548988101240"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 hidden items-center gap-2 rounded-full bg-green-500 px-5 py-3 text-sm font-semibold text-white shadow-2xl transition hover:bg-green-400 md:inline-flex"
          >
            💬 Suporte
          </a>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Plataforma para instituições de ensino
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Um sistema escolar completo para operação, crescimento e venda
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              O PHANYX reúne os pilares principais de uma operação educacional
              moderna em uma plataforma com visão SaaS, posicionamento
              institucional e base comercial forte.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {modulos.map((modulo) => (
              <div
                key={modulo.titulo}
                className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="text-3xl">{modulo.emoji}</div>
                <h3 className="mt-4 text-xl font-bold">{modulo.titulo}</h3>
                <p className="mt-3 text-gray-600">{modulo.descricao}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                  Diferenciais
                </p>
                <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                  O PHANYX foi pensado para ter cara de produto sério e escalável
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  Não é apenas uma tela de login. É uma plataforma com visão de
                  negócio, organização institucional e base para expansão
                  comercial.
                </p>
              </div>

              <div className="grid gap-4">
                {diferenciais.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <p className="font-medium text-gray-800">✓ {item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="rounded-[32px] bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-8 text-white md:p-12">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
              Segurança institucional
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Mais credibilidade para documentos, acessos e operações sensíveis
            </h2>
            <p className="mt-4 max-w-3xl text-blue-100">
              O PHANYX evolui com foco em segurança, validação e
              rastreabilidade, fortalecendo a confiança institucional e ajudando
              a reduzir riscos em processos importantes.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                <h3 className="font-bold">QR Code</h3>
                <p className="mt-2 text-sm text-blue-100">
                  Validação pública de documentos com acesso rápido.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                <h3 className="font-bold">Auditoria</h3>
                <p className="mt-2 text-sm text-blue-100">
                  Registro de ações e eventos importantes da plataforma.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                <h3 className="font-bold">Score de risco</h3>
                <p className="mt-2 text-sm text-blue-100">
                  Camada adicional para leitura de comportamento suspeito.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                <h3 className="font-bold">Bloqueios</h3>
                <p className="mt-2 text-sm text-blue-100">
                  Base pronta para contenção manual e automática quando
                  necessário.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                Páginas estratégicas
              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Conteúdos pensados para posicionamento orgânico no Google
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Estas páginas ajudam o PHANYX a competir por buscas importantes
                como gestão escolar, sistema escolar, plataforma EAD e software
                para cursos.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {paginasSeo.map((pagina) => (
                <Link
                  key={pagina.href}
                  href={pagina.href}
                  className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <h3 className="text-xl font-bold text-gray-900">
                    {pagina.titulo}
                  </h3>
                  <p className="mt-3 text-gray-600">{pagina.descricao}</p>
                  <span className="mt-5 inline-flex text-sm font-semibold text-blue-700">
                    Acessar página →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-6 py-20 md:px-10 lg:px-12">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                Perguntas frequentes
              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                O que instituições precisam saber sobre o PHANYX
              </h2>
            </div>

            <div className="mt-12 space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.pergunta}
                  className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-lg font-bold">{faq.pergunta}</h3>
                  <p className="mt-3 text-gray-600">{faq.resposta}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-950">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-white md:p-10">
              <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
                    Pronto para crescer
                  </p>
                  <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                    Leve sua instituição para uma plataforma acadêmica mais forte
                  </h2>
                  <p className="mt-4 max-w-3xl text-blue-100">
                    O PHANYX foi pensado para unir experiência moderna, operação
                    institucional, crescimento comercial e visão SaaS real.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Link
                    href="/planos"
                    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    Ver planos
                  </Link>

                  <Link
                    href="/contato"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15"
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

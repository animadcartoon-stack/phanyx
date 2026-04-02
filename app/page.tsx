"use client";

import Link from "next/link";
import Header from "@/components/layout/Header";
import Image from "next/image";

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

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="bg-white text-gray-900">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-slate-800 bg-[#06133a] text-white">
          {/* FUNDO */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_30%)]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#020817] via-[#081a52] to-[#142863]" />
          </div>

          {/* FOTO NA DIREITA COM CORTE DIAGONAL */}
          <div className="absolute right-0 top-0 hidden h-full w-[40%] lg:block">
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                clipPath: "polygon(18% 0%, 100% 0%, 100% 100%, 0% 100%)",
              }}
            >
              <div className="absolute inset-0 z-10 bg-gradient-to-l from-transparent via-blue-950/20 to-[#06133a]" />
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#020817]/70 via-transparent to-transparent" />

              <Image
                src="/images/formax-hero.jpg"
                alt="PHANYX plataforma acadêmica"
                fill
                priority
                className="object-cover object-center scale-[1.02]"
              />
            </div>

            <div className="absolute left-10 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-blue-500/20 blur-3xl" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-6 pb-12 pt-8 md:px-10 md:pb-14 md:pt-10 lg:px-12 lg:pb-16 lg:pt-12">
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              {/* ESQUERDA */}
              <div className="max-w-2xl -mt-1 md:-mt-2">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-blue-200 backdrop-blur mb-3">
                  Plataforma acadêmica SaaS multi-instituição
                </div>

                <h1 className="mt-3 text-3xl font-semibold leading-[1.02] tracking-[-0.03em] text-white md:text-4xl xl:text-[3.1rem]">
                  <span className="block text-white">PHANYX</span>

                  <span className="mt-2 block bg-gradient-to-r from-blue-300 via-blue-200 to-blue-400 bg-clip-text text-transparent">
                    gestão acadêmica, EAD
                  </span>

                  <span className="mt-1 block text-blue-200">
                    financeiro e segurança institucional
                  </span>
                </h1>

                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 md:text-base">
                  Estruture sua instituição com uma plataforma moderna, escalável e
                  preparada para universidades, faculdades, escolas técnicas e operações
                  de ensino a distância. Tudo em um ambiente com experiência
                  profissional, controle institucional e base SaaS real.
                </p>

                <div className="mt-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                    <Link
                      href="/planos"
                      className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(37,99,235,0.45)] transition duration-300 hover:-translate-y-0.5 hover:bg-blue-500"
                    >
                      Ver planos
                    </Link>

                    <a
                      href="https://wa.me/5548988101240?text=Olá!%20Quero%20saber%20mais%20sobre%20o%20PHANYX."
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white/15"
                    >
                      Falar com comercial
                    </a>

                    <div className="flex items-center gap-3">
  <Link
    href="/aluno"
    className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-100 transition hover:border-blue-400/50 hover:bg-blue-500/20"
  >
    Área do aluno
  </Link>

  <Link
    href="/professor"
    className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
  >
    Área do professor
  </Link>

  <Link
    href="/login"
    className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
  >
    Admin
  </Link>
</div>
                  </div>

                  <div className="mt-3">
                    <Link
                      href="/suporte"
                      className="inline-flex w-fit items-center justify-center rounded-xl border border-blue-400/25 bg-white/5 px-4 py-2 text-sm font-medium text-blue-200 transition hover:border-blue-300/40 hover:bg-white/10 hover:text-white"
                    >
                      💬 Suporte e atendimento
                    </Link>
                  </div>
                </div>

                <div className="mt-6 hidden gap-4 xl:grid xl:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <p className="text-xl font-bold text-white">Multi-tenant</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      Estrutura pronta para várias instituições com separação de dados.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <p className="text-xl font-bold text-white">LMS + Gestão</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      Acadêmico, ensino digital, documentos e financeiro em um só sistema.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <p className="text-xl font-bold text-white">Segurança</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      Auditoria, validação e base antifraude para uso institucional.
                    </p>
                  </div>
                </div>
              </div>

              {/* DIREITA MOBILE/TABLET */}
              <div className="relative lg:hidden">
                <div className="relative h-[320px] overflow-hidden rounded-[28px] border border-white/10 shadow-2xl">
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#020817]/70 via-transparent to-transparent" />
                  <Image
                    src="/images/formax-hero.jpg"
                    alt="PHANYX plataforma acadêmica"
                    fill
                    priority
                    className="object-cover object-center"
                  />

                  <div className="absolute bottom-4 left-4 right-4 z-20 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                      Plataforma pronta para crescer
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-100">
                      Mais controle acadêmico, mais credibilidade institucional e uma
                      experiência moderna para administração, professores e alunos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <a
            href="https://wa.me/5548988101240"
            target="_blank"
            rel="noreferrer"
            className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-green-500 px-5 py-3 text-sm font-semibold text-white shadow-2xl transition hover:bg-green-400"
          >
            💬 Suporte
          </a>
        </section>

        {/* MÓDULOS */}
        <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Módulos estratégicos
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Uma base sólida para operar, crescer e vender o PHANYX
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              O PHANYX reúne os pilares principais de uma operação educacional
              moderna em uma plataforma com visão SaaS e posicionamento
              institucional.
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

        {/* DIFERENCIAIS */}
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
                  negócio, organização institucional e base para expansão comercial.
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

        {/* SEGURANÇA */}
        <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="rounded-[32px] bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-8 text-white md:p-12">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
              Segurança institucional
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Mais credibilidade para documentos, acessos e operações sensíveis
            </h2>
            <p className="mt-4 max-w-3xl text-blue-100">
              O PHANYX evolui com foco em segurança, validação e rastreabilidade,
              fortalecendo a confiança institucional e ajudando a reduzir riscos
              em processos importantes.
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
                  Base pronta para contenção manual e automática quando necessário.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-slate-50">
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

        {/* CTA FINAL */}
        <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="rounded-[32px] border border-gray-200 bg-white p-8 shadow-lg md:p-12">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                  Próximo passo
                </p>
                <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                  Prepare o PHANYX para vender como uma startup SaaS profissional
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  A base do produto já está forte. Agora é hora de fortalecer a
                  marca, apresentar planos, facilitar adesão e transformar a
                  plataforma em um produto comercial de alto valor percebido.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <Link
                  href="/planos"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Conhecer planos do PHANYX
                </Link>

                <Link
                  href="/ibe/matricula"
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Ir para matrícula do IBE
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-gray-300 px-6 py-4 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                >
                  Acessar login do sistema
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
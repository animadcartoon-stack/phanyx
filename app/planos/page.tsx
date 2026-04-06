"use client";

import Link from "next/link";
import Header from "@/components/layout/Header";

const planos = [
  {
  nome: "Essencial",
  subtitulo: "Para instituições em fase inicial de estruturação digital",
  preco: "R$ 49",
  periodo: "/mês + R$ 3 por aluno ativo",
  destaque: false,
  descricao:
    "Plano ideal para instituições que precisam organizar sua base acadêmica com um modelo acessível, profissional e escalável conforme o número de alunos ativos.",
  recursos: [
    "Cadastro de alunos, professores e cursos",
    "Gestão de disciplinas, turmas e matrículas",
    "Área administrativa, professor e aluno",
    "Login seguro com controle por perfil",
    "Base acadêmica organizada por instituição",
    "Suporte inicial para operação",
    "Modelo comercial escalável por aluno ativo",
  ],
  idealPara:
    "Escolas técnicas, cursos livres, seminários menores e instituições em início de implantação",
  cta: "Contratar Essencial",
  descricaoCta: "Falar com comercial",
  corCard: "border-slate-200 bg-white text-slate-900",
  corBotao: "bg-slate-900 text-white hover:bg-slate-800",
  badge: null,
},
  {
  nome: "Profissional",
  subtitulo: "Para instituições que querem operação forte e maior valor percebido",
  preco: "R$ 99",
  periodo: "/mês + R$ 5 por aluno ativo",
  destaque: true,
  descricao:
    "Plano mais indicado para instituições que precisam de uma operação acadêmica mais completa, com LMS, financeiro, documentos validados e crescimento escalável baseado em alunos ativos.",
  recursos: [
    "Tudo do plano Essencial",
    "Módulo LMS com aulas, materiais e progresso",
    "Provas online com correção automática",
    "Financeiro com recebimentos e controle institucional",
    "Documentos com QR Code e validação pública",
    "Arquitetura multi-instituição (SaaS)",
    "Experiência mais robusta para operação educacional",
  ],
  idealPara:
    "Faculdades, EADs, institutos, seminários e operações acadêmicas em crescimento",
  cta: "Contratar Profissional",
  descricaoCta: "Falar com especialista",
  corCard: "border-blue-600 bg-slate-950 text-white shadow-2xl ring-1 ring-blue-500/30",
  corBotao: "bg-blue-600 text-white hover:bg-blue-500",
  badge: "Mais recomendado",
},
  {
  nome: "Enterprise",
  subtitulo: "Para instituições que precisam de mais escala, prioridade e recursos avançados",
  preco: "R$ 199",
  periodo: "/mês + R$ 7 por aluno ativo",
  destaque: false,
  descricao:
    "Plano ideal para operações maiores que precisam de mais capacidade institucional, prioridade de suporte, personalização ampliada e recursos avançados com cobrança automática.",
  recursos: [
    "Tudo do plano Profissional",
    "Maior prioridade operacional",
    "Suporte prioritário",
    "Recursos avançados de segurança",
    "Maior capacidade de expansão institucional",
    "Personalização ampliada",
    "Modelo automático para operações maiores",
  ],
  idealPara:
    "Universidades, grupos educacionais, operações com mais alunos e instituições com maior exigência",
  cta: "Contratar Enterprise",
  descricaoCta: "Solicitar proposta",
  corCard: "border-slate-200 bg-white text-slate-900",
  corBotao: "bg-slate-900 text-white hover:bg-slate-800",
  badge: "Escala avançada",
},
];

const comparativo = [
  {
    recurso: "Gestão acadêmica",
    essencial: "Sim",
    profissional: "Sim",
    enterprise: "Sim",
  },
  {
    recurso: "Área do aluno, professor e admin",
    essencial: "Sim",
    profissional: "Sim",
    enterprise: "Sim",
  },
  {
    recurso: "LMS com aulas e materiais",
    essencial: "Base",
    profissional: "Completo",
    enterprise: "Completo",
  },
  {
    recurso: "Provas online",
    essencial: "Não",
    profissional: "Sim",
    enterprise: "Sim",
  },
  {
    recurso: "Financeiro institucional",
    essencial: "Base",
    profissional: "Sim",
    enterprise: "Avançado",
  },
  {
    recurso: "Documentos com QR Code",
    essencial: "Não",
    profissional: "Sim",
    enterprise: "Sim",
  },
  {
    recurso: "Prioridade de suporte",
    essencial: "Não",
    profissional: "Padrão",
    enterprise: "Alta",
  },
  {
    recurso: "Personalização ampliada",
    essencial: "Não",
    profissional: "Parcial",
    enterprise: "Sim",
  },
];

const diferenciais = [
  {
    titulo: "Estrutura pronta para crescer",
    descricao:
      "O PHANYX foi construído para sair do nível interno e alcançar padrão de produto comercial SaaS para instituições de ensino.",
  },
  {
    titulo: "Base acadêmica e operacional forte",
    descricao:
      "A proposta une gestão acadêmica, ensino digital, documentos, financeiro e segurança institucional em uma base única.",
  },
  {
    titulo: "Mais valor percebido para vender",
    descricao:
      "Os planos foram organizados para comunicar evolução, robustez e profissionalismo para instituições de diferentes portes.",
  },
];

const indicadores = [
  {
    titulo: "Multi-instituição",
    descricao:
      "Base preparada para operar mais de uma instituição com isolamento por tenant.",
  },
  {
    titulo: "Acadêmico + LMS + Financeiro",
    descricao:
      "Uma proposta única para reduzir retrabalho operacional e aumentar controle.",
  },
  {
    titulo: "Segurança e validação",
    descricao:
      "Perfis de acesso, documentos com QR Code e estrutura de auditoria.",
  },
  {
    titulo: "Escalável por aluno ativo",
    descricao:
      "Modelo comercial alinhado ao crescimento real da operação.",
  },
];

const provasConfianca = [
  "Base pronta para operação acadêmica real",
  "Controle por perfil: admin, professor e aluno",
  "Arquitetura multi-instituição para SaaS",
  "Documentos e validação com QR Code",
];

const provaSocialMetricas = [
  { valor: "100%", titulo: "Acesso por perfil", descricao: "Admin, professor e aluno com autenticação separada e segura." },
  { valor: "3 em 1", titulo: "Acadêmico + LMS + financeiro", descricao: "Uma base unificada para reduzir retrabalho institucional." },
  { valor: "QR", titulo: "Documentos validados", descricao: "Com verificação pública e mais confiança para a instituição." },
  { valor: "SaaS", titulo: "Arquitetura multi-instituição", descricao: "Preparada para operar diferentes instituições com isolamento por tenant." },
];

const selosConfianca = [
  "Login separado por portal",
  "Controle institucional por perfil",
  "Documentos com validação pública",
  "Base escalável para implantação",
  "Experiência profissional para operação educacional",
];

const depoimentos = [
  {
    titulo: "Organização operacional",
    texto:
      "O PHANYX foi pensado para transmitir estrutura, clareza e profissionalismo já no primeiro contato com a instituição.",
  },
  {
    titulo: "Mais confiança comercial",
    texto:
      "A proposta combina gestão acadêmica, ensino digital e segurança institucional em uma plataforma mais forte para apresentação comercial.",
  },
  {
    titulo: "Escalabilidade real",
    texto:
      "A arquitetura foi desenhada para crescer com a operação, sem perder controle, separação por instituição e valor percebido.",
  },
];

const whatsappBase = "https://wa.me/5548988101240?text=";

function montarLinkComercial(plano: string) {
  const mensagem = encodeURIComponent(
    `Olá! Quero saber mais sobre o plano ${plano} do PHANYX.`
  );
  return `${whatsappBase}${mensagem}`;
}

export default function PlanosPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-white text-slate-900">
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_32%)]" />

          <div className="relative mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12 lg:py-24">
            <div className="mx-auto max-w-5xl text-center">
              <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
                Planos PHANYX • Plataforma acadêmica SaaS nível profissional
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight md:text-5xl xl:text-6xl">
                Planos para instituições que buscam
                <span className="block bg-gradient-to-r from-blue-200 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                  operação acadêmica forte, moderna e escalável
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100">
                O PHANYX foi pensado para entregar a solidez de uma plataforma
                acadêmica robusta, com experiência moderna, estrutura
                multi-instituição, recursos EAD, financeiro, documentos validados
                e base para evolução contínua.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href={montarLinkComercial("Profissional")}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-500"
                >
                  Agendar demonstração
                </a>

                <a
                  href={montarLinkComercial("PHANYX")}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Falar com comercial
                </a>
              </div>

              <div className="mt-12 grid gap-4 text-left sm:grid-cols-2 xl:grid-cols-4">
                {indicadores.map((item) => (
                  <div
                    key={item.titulo}
                    className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur"
                  >
                    <p className="text-sm font-semibold text-white">
                      {item.titulo}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-blue-100">
                      {item.descricao}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm text-blue-100">
                {provasConfianca.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 lg:px-12">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                Prova social
              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Estrutura pensada para transmitir confiança desde a primeira apresentação
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                A página de planos não comunica apenas preço. Ela reforça
                robustez, segurança, maturidade operacional e prontidão para
                implantação.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {provaSocialMetricas.map((item) => (
                <div
                  key={item.titulo}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 shadow-sm"
                >
                  <div className="text-3xl font-extrabold text-blue-700">
                    {item.valor}
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-slate-900">
                    {item.titulo}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.descricao}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {selosConfianca.map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-3xl">🎓</div>
              <h2 className="mt-4 text-xl font-bold">Acadêmico completo</h2>
              <p className="mt-3 text-slate-600">
                Cursos, disciplinas, turmas, matrículas, alunos e professores
                organizados em uma estrutura profissional.
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-3xl">💻</div>
              <h2 className="mt-4 text-xl font-bold">LMS nível institucional</h2>
              <p className="mt-3 text-slate-600">
                Aulas, materiais, progresso, avaliações e jornada do aluno
                dentro de uma plataforma pensada para operação real.
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-3xl">🛡️</div>
              <h2 className="mt-4 text-xl font-bold">Segurança e confiança</h2>
              <p className="mt-3 text-slate-600">
                Validação documental, auditoria, controle de acesso e base
                antifraude para ambientes institucionais mais seguros.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                Planos SaaS
              </p>

              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Escolha o plano ideal para o porte e a maturidade da instituição
              </h2>

              <p className="mt-4 text-lg text-slate-600">
                Você pode começar com uma base sólida e evoluir conforme a
                operação, a quantidade de alunos e a necessidade institucional
                crescem.
              </p>

              <p className="mt-4 text-sm text-slate-500">
                * Cobrança variável baseada na quantidade de alunos ativos da
                instituição. Implantação inicial e condições comerciais podem
                variar conforme o porte e a necessidade do projeto.
              </p>
            </div>

            <div className="mt-12 grid gap-8 xl:grid-cols-3">
              {planos.map((plano) => (
                <div
                  key={plano.nome}
                  className={`relative rounded-[28px] border p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${plano.corCard}`}
                >
                  {plano.badge && (
                    <div
                      className={`absolute -top-3 left-6 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-[0.15em] shadow-lg ${
                        plano.destaque
                          ? "bg-blue-600 text-white"
                          : "bg-slate-900 text-white"
                      }`}
                    >
                      {plano.badge}
                    </div>
                  )}

                  <p
                    className={`text-sm font-semibold uppercase tracking-[0.2em] ${
                      plano.destaque ? "text-blue-200" : "text-blue-700"
                    }`}
                  >
                    {plano.nome}
                  </p>

                  <h3 className="mt-3 text-2xl font-bold">{plano.subtitulo}</h3>

                  <div className="mt-6">
                    <div className="flex flex-wrap items-end gap-2">
                      <span className="text-4xl font-extrabold">{plano.preco}</span>
                      <span
                        className={`pb-1 text-sm ${
                          plano.destaque ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        {plano.periodo}
                      </span>
                    </div>

                    <p
                      className={`mt-4 text-sm leading-7 ${
                        plano.destaque ? "text-slate-200" : "text-slate-600"
                      }`}
                    >
                      {plano.descricao}
                    </p>
                  </div>

                  <div className="mt-8 space-y-3">
  <a
    href={`/adesao?plano=${plano.nome.toUpperCase()}`}
    className={`inline-flex w-full items-center justify-center rounded-2xl px-6 py-4 text-sm font-semibold transition ${plano.corBotao}`}
  >
    {plano.cta}
  </a>

  <a
    href={montarLinkComercial(plano.nome)}
    target="_blank"
    rel="noreferrer"
    className={`inline-flex w-full items-center justify-center rounded-2xl border px-6 py-4 text-sm font-semibold transition ${
      plano.destaque
        ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
    }`}
  >
    {plano.descricaoCta}
  </a>
</div>

<div
  className={`mt-3 text-xs ${
    plano.destaque ? "text-slate-300" : "text-slate-400"
  }`}
>
  Contratação direta ou conversa comercial com mensagem pronta no WhatsApp.
</div>

                  <div
                    className={`mt-8 border-t pt-8 ${
                      plano.destaque ? "border-white/10" : "border-slate-200"
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                        plano.destaque ? "text-blue-200" : "text-slate-900"
                      }`}
                    >
                      Inclui:
                    </p>

                    <ul className="mt-4 space-y-3">
                      {plano.recursos.map((recurso) => (
                        <li
                          key={recurso}
                          className={`flex gap-3 text-sm ${
                            plano.destaque ? "text-slate-200" : "text-slate-600"
                          }`}
                        >
                          <span className="mt-0.5">✓</span>
                          <span>{recurso}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    className={`mt-8 rounded-2xl p-4 ${
                      plano.destaque ? "bg-white/10" : "bg-slate-50"
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                        plano.destaque ? "text-blue-200" : "text-blue-700"
                      }`}
                    >
                      Ideal para
                    </p>

                    <p
                      className={`mt-2 text-sm ${
                        plano.destaque ? "text-slate-200" : "text-slate-600"
                      }`}
                    >
                      {plano.idealPara}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Comparativo
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Compare os planos de forma simples
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Estruturamos os planos para facilitar a evolução da instituição sem
              perder robustez acadêmica e tecnológica.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-[28px] border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Recurso
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Essencial
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Profissional
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Enterprise
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {comparativo.map((item, index) => (
                    <tr
                      key={item.recurso}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {item.recurso}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.essencial}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.profissional}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.enterprise}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                Posicionamento comercial
              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Uma proposta mais forte para vender o PHANYX com confiança
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Os planos não servem apenas para cobrar. Eles ajudam a comunicar
                valor, maturidade e evolução institucional.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {diferenciais.map((item) => (
                <div
                  key={item.titulo}
                  className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-xl font-bold">{item.titulo}</h3>
                  <p className="mt-3 text-slate-600">{item.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                Confiança comercial
              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Uma apresentação mais forte para instituições que precisam decidir com segurança
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Estes blocos ajudam a transmitir valor, maturidade e confiança
                para quem está avaliando implantação, migração ou modernização da operação.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {depoimentos.map((item) => (
                <div
                  key={item.titulo}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 shadow-sm"
                >
                  <div className="text-2xl">★</div>
                  <h3 className="mt-4 text-xl font-bold text-slate-900">
                    {item.titulo}
                  </h3>
                  <p className="mt-3 text-slate-600 leading-7">
                    {item.texto}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="rounded-[32px] bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-8 text-white shadow-xl md:p-12">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
                  Crescimento institucional
                </p>
                <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                  Leve sua instituição para uma operação mais moderna e profissional
                </h2>
                <p className="mt-4 text-lg text-blue-100">
                  O PHANYX foi desenhado para ser mais do que um painel interno:
                  ele é uma base de produto, gestão, ensino digital, segurança e
                  crescimento.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <a
                  href={montarLinkComercial("PHANYX")}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Solicitar apresentação comercial
                </a>

                <Link
                  href="/suporte"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Tirar dúvidas
                </Link>

                <a
  href="/adesao?plano=PROFISSIONAL"
  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white"
>
  Contratar plano
</a>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-6 py-4 pb-20 md:px-10 lg:px-12">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-8 text-center shadow-sm md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                Demonstração
              </p>

              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Quer ver o PHANYX em operação?
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                Fale com o comercial para conhecer a proposta, entender o melhor
                plano para sua instituição e avançar para o próximo passo da
                implantação.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href={montarLinkComercial("Profissional")}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Agendar demonstração
                </a>

                <Link
                  href="/ibe/matricula"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  Ver matrícula do IBE
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
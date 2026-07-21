"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";

const planos = [
  {
  nome: "Essencial",
  subtitulo: "Para instituições em fase inicial de estruturação digital",
  preco: "R$ 49",
  periodo: "/mês + R$ 3 por aluno ativo + 1 polo incluso",
  destaque: false,
  descricao:
    "Plano ideal para instituições que precisam organizar sua base acadêmica com um modelo acessível, profissional e escalável conforme o número de alunos ativos.",
  recursos: [
  "Cadastro de alunos, professores, funcionários e cursos",
  "Cadastro de disciplinas, semestres e turmas",
  "Matrícula de alunos",
  "Criação de setores institucionais",
  "Área administrativa, professor e aluno",
  "Login seguro com controle por perfil",
  "Sistema financeiro institucional",
  "Avisos e feriados institucionais",
  "Documentos institucionais básicos",
  "Editor básico de certificados com 1 modelo ativo",
  "1 polo incluso no plano",
],
  idealPara:
    "Escolas técnicas, cursos livres, seminários menores e instituições em início de implantação",
  cta: "Começar 60 dias grátis",
  descricaoCta: "Falar com especialista",
  corCard: "border-slate-200 bg-white text-slate-900",
  corBotao: "bg-slate-900 text-white hover:bg-slate-800",
  badge: null,
},
  {
  nome: "Profissional",
  subtitulo: "Para instituições que querem operação forte e maior valor percebido",
  preco: "R$ 99",
  periodo: "/mês + R$ 5 por aluno ativo + até 3 polos inclusos",
  destaque: true,
  descricao:
    "Plano mais indicado para instituições que precisam de uma operação acadêmica mais completa, com LMS, financeiro, documentos validados e crescimento escalável baseado em alunos ativos.",
  recursos: [
  "Tudo do plano Essencial",

  "LMS completo com aulas, materiais e progresso",
  "Provas online com correção automática",

  "Editor PHANYX de Certificados com até 20 modelos ativos",
  "Certificados automáticos por modalidade e curso, com QR Code",
  "Emissões ilimitadas e certificados no portal do aluno",

  "Editor PHANYX de Crachás",
  "Criação, QR Code e emissão individual ou em lote",

  "RH completo com ponto, banco de horas, holerites, benefícios, férias, exames e rescisões",
  "PHANYX RH Ponto Mobile institucional com link e QR Code, foto, localização e liberação individual",
  "Histórico com correções autorizadas pelo RH por prazo determinado e auditoria",

  "RH completo com ponto, banco de horas, holerites, benefícios, férias, exames e rescisões",
  "PHANYX RH Ponto Mobile com link e QR Code exclusivos da instituição",
  "Registro pelo celular com foto, localização e locais autorizados",
  "Histórico de pontos com correções autorizadas pelo RH por prazo determinado",

  "Contratos e documentos com preenchimento automático",
  "Histórico acadêmico em PDF e no portal do aluno",

  "Chat interno, Ouvidoria e Reputação PHANYX",
  "Integrações Google básicas",

  "Até 3 polos inclusos",
],
  idealPara:
    "Faculdades, EADs, institutos, seminários e operações acadêmicas em crescimento",
  cta: "Começar 60 dias grátis",
  descricaoCta: "Falar com especialista",
  corCard: "border-blue-600 bg-slate-950 text-white shadow-2xl ring-1 ring-blue-500/30",
  corBotao: "bg-blue-600 text-white hover:bg-blue-500",
  badge: "Mais recomendado",
},
  {
  nome: "Enterprise",
  subtitulo: "Para instituições que precisam de mais escala, prioridade e recursos avançados",
  preco: "R$ 199",
  periodo: "/mês + R$ 7 por aluno ativo + polos sob negociação",
  destaque: false,
  descricao:
    "Plano ideal para operações maiores que precisam de mais capacidade institucional, prioridade de suporte, personalização ampliada e recursos avançados com cobrança automática.",
  recursos: [
  "Tudo do plano Profissional",

  "Modelos ativos de certificado ilimitados",
  "Certificados e crachás avançados para múltiplos polos",
  "Modelos institucionais com personalização ampliada",

  "RH e Ponto Mobile avançados para múltiplos polos",
  "Regras ampliadas de localização, perímetro e auditoria",

  "RH e Ponto Mobile avançados para múltiplos polos",
  "Regras ampliadas de localização, auditoria e reconhecimento facial",

  "PHANYX Growth avançado",

  "Painel de reputação institucional",
  "Reputação multi-canal",

  "Integrações Google avançadas",
  "Integrações Meta/Facebook",
  "Google Business",

  "Marketing institucional e indicadores",

  "Gestão multi-polos avançada",

  "Personalizações exclusivas",
  "Automações avançadas",

  "Histórico acadêmico avançado para operações multi-polo",
  "Documentos acadêmicos com auditoria e personalização ampliada",

  "Suporte prioritário",
  "Condições comerciais personalizadas",
],
  idealPara:
    "Universidades, grupos educacionais, operações com mais alunos e instituições com maior exigência",
  cta: "Começar 60 dias grátis",
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
  recurso: "Editor visual de certificados",
  essencial: "Básico — 1 modelo",
  profissional: "Completo — até 20 modelos",
  enterprise: "Completo — ilimitado",
},
{
  recurso: "Modelos ativos de certificado",
  essencial: "1 modelo",
  profissional: "Até 20",
  enterprise: "Ilimitados",
},
{
  recurso: "Certificados por modalidade e curso",
  essencial: "Não",
  profissional: "Sim",
  enterprise: "Sim",
},
{
  recurso: "Emissão de certificados aos alunos",
  essencial: "Base",
  profissional: "Ilimitada",
  enterprise: "Ilimitada",
},
{
  recurso: "Editor PHANYX de Crachás",
  essencial: "Não",
  profissional: "Completo",
  enterprise: "Completo + multi-polo",
},
{
  recurso: "Emissão de crachás em lote",
  essencial: "Não",
  profissional: "Sim",
  enterprise: "Avançada",
},
{
  recurso: "Gestão de RH",
  essencial: "Base",
  profissional: "Completa",
  enterprise: "Completa + multi-polo",
},
{
  recurso: "PHANYX RH Ponto Mobile",
  essencial: "Não",
  profissional: "Sim",
  enterprise: "Avançado",
},
{
  recurso: "Aplicativo web móvel institucional",
  essencial: "Não",
  profissional: "Link e QR Code próprios",
  enterprise: "Multi-polo",
},
{
  recurso: "Foto, localização e locais autorizados",
  essencial: "Não",
  profissional: "Sim",
  enterprise: "Regras avançadas",
},
{
  recurso: "Histórico e correções de ponto",
  essencial: "Não",
  profissional: "Autorizadas pelo RH por prazo",
  enterprise: "Auditoria ampliada",
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
  { valor: "3 perfis dedicados", titulo: "Admin, professor e aluno com acessos independentes e seguros.", descricao: "Admin, professor e aluno com autenticação separada e segura." },
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
const PROMO_DIAS_GRATIS = 60;

function montarLinkComercial(plano: string) {
  const mensagem = encodeURIComponent(
    `Olá! Quero saber mais sobre o plano ${plano} do PHANYX.`
  );
  return `${whatsappBase}${mensagem}`;
}

export default function PlanosPage() {
  const [alunosSimulacao, setAlunosSimulacao] = useState(250);

  const [polosSimulacao, setPolosSimulacao] = useState(1);

const polosExtrasEssencial = Math.max(0, polosSimulacao - 1);
const polosExtrasProfissional = Math.max(0, polosSimulacao - 3);
const polosExtrasEnterprise = Math.max(0, polosSimulacao - 10);

const valorPoloExtraEssencial = 49;
const valorPoloExtraProfissional = 79;
const valorPoloExtraEnterprise = 99;

 const totalEssencial =
  49 + alunosSimulacao * 3 + polosExtrasEssencial * valorPoloExtraEssencial;

const totalProfissional =
  99 + alunosSimulacao * 5 + polosExtrasProfissional * valorPoloExtraProfissional;

const totalEnterprise =
  199 + alunosSimulacao * 7 + polosExtrasEnterprise * valorPoloExtraEnterprise;

  const custoAlunoEssencial = totalEssencial / alunosSimulacao;
const custoAlunoProfissional = totalProfissional / alunosSimulacao;
const custoAlunoEnterprise = totalEnterprise / alunosSimulacao;

useEffect(() => {
  const timer = setTimeout(() => {
    const alvo = document.getElementById("calculadora-planos");

if (alvo) {
  window.scrollTo({
    top: alvo.offsetTop + 800,
    behavior: "smooth",
  });
}
  }, 150);

  return () => clearTimeout(timer);
}, []);

  return (
    <>
      <Header />

      <main className="min-h-screen bg-white text-slate-900">
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_32%)]" />

          <div className="relative mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12 lg:py-24">
            <div className="mx-auto max-w-5xl text-center">
              <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
                60 dias grátis • Plataforma acadêmica SaaS para instituições reais
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight md:text-5xl xl:text-6xl">
  Teste o PHANYX por {PROMO_DIAS_GRATIS} dias grátis
  <span className="block bg-gradient-to-r from-blue-200 via-sky-300 to-blue-400 bg-clip-text text-transparent">
    e leve sua instituição para uma gestão mais moderna
  </span>
</h1>

              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100">
  Instituições reais podem iniciar agora com {PROMO_DIAS_GRATIS} dias de uso gratuito.
  Durante esse período, sua equipe testa gestão acadêmica, LMS, financeiro,
  documentos, certificados, áreas do aluno e professor, sem cobrança inicial.
  Após o período gratuito, a cobrança mensal passa a seguir o plano escolhido,
  a quantidade de alunos ativos e os polos cadastrados.
</p>

              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
  <a
    href="#planos"
    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-blue-500"
  >
    Começar {PROMO_DIAS_GRATIS} dias grátis
  </a>

  <a
    href={montarLinkComercial("PHANYX - 60 dias grátis")}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/15"
  >
    Falar com especialista
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
                POR QUE ESCOLHER A PHANYX
              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Tecnologia preparada para instituições que buscam crescimento e eficiência
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                O PHANYX reúne gestão acadêmica, LMS, financeiro e documentos em uma única solução, reduzindo retrabalho e fortalecendo a operação institucional.              </p>
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

              <div className="mt-5 rounded-3xl border border-blue-300 bg-blue-50 px-6 py-5 text-left shadow-sm">
  <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
    Promoção de implantação
  </p>

  <h3 className="mt-2 text-2xl font-black text-blue-950">
    Comece com {PROMO_DIAS_GRATIS} dias grátis para testar com sua instituição real
  </h3>

  <p className="mt-3 text-sm leading-7 text-blue-900">
    O PHANYX libera o ambiente da instituição para uso real durante o período gratuito.
    Sua equipe poderá cadastrar alunos, professores, cursos, turmas, documentos,
    certificados, aulas, financeiro e acompanhar a operação na prática.
  </p>

  <div className="mt-4 grid gap-3 md:grid-cols-3">
    <div className="rounded-2xl border border-blue-200 bg-white p-4">
      <p className="text-sm font-bold text-blue-950">
        Sem cobrança inicial
      </p>
      <p className="mt-1 text-xs leading-5 text-blue-800">
        A instituição usa o PHANYX por {PROMO_DIAS_GRATIS} dias antes da primeira cobrança.
      </p>
    </div>

    <div className="rounded-2xl border border-blue-200 bg-white p-4">
      <p className="text-sm font-bold text-blue-950">
        Cobrança por uso real
      </p>
      <p className="mt-1 text-xs leading-5 text-blue-800">
        Após o teste, o valor acompanha o plano escolhido, alunos ativos e polos cadastrados.
      </p>
    </div>

    <div className="rounded-2xl border border-blue-200 bg-white p-4">
      <p className="text-sm font-bold text-blue-950">
        Cancelamento antes da cobrança
      </p>
      <p className="mt-1 text-xs leading-5 text-blue-800">
        A instituição pode cancelar antes do fim do período gratuito para não iniciar a cobrança.
      </p>
    </div>
  </div>
</div>

<div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
  <section
  id="calculadora-planos"
  className="scroll-mt-12 mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
>
    <h3 className="text-xl font-bold text-slate-900">
  Simule o valor após os {PROMO_DIAS_GRATIS} dias gratuitos
</h3>

<p className="mt-2 text-sm text-slate-600">
  Informe a quantidade de alunos ativos e polos/unidades para visualizar
  a mensalidade estimada que poderá ser cobrada após o período gratuito.
</p>
  </section>

  <div className="mt-6">
    <label className="mb-2 block text-sm font-semibold text-slate-700">
      Quantidade de alunos ativos
    </label>

    <input
  type="number"
  min={0}
  value={alunosSimulacao}
  onChange={(e) => {
    const valor = Number(e.target.value);

    if (Number.isNaN(valor)) {
      setAlunosSimulacao(0);
      return;
    }

    setAlunosSimulacao(Math.max(0, valor));
  }}
  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-lg font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
/>

<label className="mb-2 mt-5 block text-sm font-semibold text-slate-700">
  Quantidade de polos/unidades
</label>

<input
  type="number"
  min={1}
  value={polosSimulacao}
  onChange={(e) => {
    const valor = Number(e.target.value);

    if (Number.isNaN(valor)) {
      setPolosSimulacao(1);
      return;
    }

    setPolosSimulacao(Math.max(1, valor));
  }}
  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-lg font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
/>
  </div>

  <div className="mt-6 grid gap-4 md:grid-cols-3">
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="font-bold text-slate-900">
        Essencial
      </p>

      <p className="mt-2 text-sm text-slate-500">
        R$ 49 + ({alunosSimulacao} × R$ 3) + ({polosExtrasEssencial} polos extras × R$ 49)
      </p>

      <p className="mt-3 text-2xl font-extrabold text-slate-900">
        R$ {totalEssencial.toLocaleString("pt-BR")}
      </p>

      <p className="text-sm text-slate-500">
        Total estimado / mês
      </p>
      <p className="mt-2 text-xs font-medium text-blue-700">
  ≈ R$ {custoAlunoEssencial.toFixed(2)} por aluno ativo
</p>
      <p className="mt-3 text-xs text-slate-500">
  {polosSimulacao <= 1
    ? "Todos os polos estão inclusos."
    : `${polosSimulacao - 1} polo(s) extra(s) além do 1 incluso.`}
</p>
    </div>

    <div className="rounded-2xl border border-blue-500 bg-blue-50 p-4">
      <p className="font-bold text-blue-900">
        Profissional
      </p>

      <p className="mt-2 text-sm text-blue-700">
        R$ 99 + ({alunosSimulacao} × R$ 5) + ({polosExtrasProfissional} polos extras × R$ 79)
      </p>

      <p className="mt-3 text-2xl font-extrabold text-blue-900">
        R$ {totalProfissional.toLocaleString("pt-BR")}
      </p>

      <p className="text-sm text-blue-700">
        Total estimado / mês
      </p>
      <p className="mt-2 text-xs font-medium text-blue-700">
  ≈ R$ {custoAlunoProfissional.toFixed(2)} por aluno ativo
</p>
      <p className="mt-3 text-xs text-slate-500">
  {polosSimulacao <= 3
    ? "Todos os polos estão inclusos."
    : `${polosSimulacao - 3} polo(s) extra(s) além dos 3 inclusos.`}
</p>
    </div>

    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="font-bold text-slate-900">
        Enterprise
      </p>

      <p className="mt-2 text-sm text-slate-500">
        R$ 199 + ({alunosSimulacao} × R$ 7) + ({polosExtrasEnterprise} polos extras × R$ 99)
      </p>

      <p className="mt-3 text-2xl font-extrabold text-slate-900">
        R$ {totalEnterprise.toLocaleString("pt-BR")}
      </p>

      <p className="text-sm text-slate-500">
        Total estimado / mês
      </p>
      <p className="mt-2 text-xs font-medium text-blue-700">
  ≈ R$ {custoAlunoEnterprise.toFixed(2)} por aluno ativo
</p>
      <p className="mt-3 text-xs text-slate-500">
  Condições comerciais personalizadas para universidades e operações de grande escala.
</p>
    </div>
  </div>

  <p className="mt-5 text-xs leading-6 text-slate-500">
  * Durante os primeiros {PROMO_DIAS_GRATIS} dias, a instituição usa o PHANYX sem cobrança.
  Após esse período, se não houver cancelamento, a cobrança mensal será iniciada
  conforme o plano escolhido, a quantidade real de alunos ativos e os polos cadastrados.
</p>

  <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-center">
  <h4 className="text-lg font-bold text-blue-950">
  Quer testar o PHANYX com sua instituição por {PROMO_DIAS_GRATIS} dias?
</h4>

<p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-blue-800">
  Comece com um ambiente real para sua instituição, valide a operação com sua equipe
  e veja na prática como o PHANYX centraliza gestão acadêmica, LMS, financeiro,
  documentos e certificados.
</p>

  <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
    <a
      href={montarLinkComercial("Demonstração PHANYX")}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
    >
      Começar teste gratuito
    </a>

    <a
      href={montarLinkComercial("Especialista PHANYX")}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center rounded-2xl border border-blue-300 bg-white px-6 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
    >
      Falar com especialista
    </a>
  </div>
</div>
</div>

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
  className={`inline-flex w-full items-center justify-center rounded-2xl px-6 py-4 text-sm font-black transition ${plano.corBotao}`}
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
  60 dias grátis para implantação. Depois, cobrança mensal conforme uso real, se a instituição não cancelar.
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

        <section id="planos" className="scroll-mt-24 bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                BENEFÍCIOS DA PLATAFORMA

              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Uma solução preparada para reduzir retrabalho e aumentar a eficiência institucional
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                A PHANYX centraliza processos acadêmicos, financeiros, documentais e administrativos em um único ambiente.
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
                POR QUE ESCOLHER A PHANYX
              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Tecnologia preparada para instituições que buscam crescimento sustentável
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Arquitetura moderna, documentos validados, controle por perfil e operação multi-instituição para acompanhar a evolução da sua organização.
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
  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white transition hover:bg-blue-500"
>
  Começar {PROMO_DIAS_GRATIS} dias grátis
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
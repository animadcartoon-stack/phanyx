"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

const modulos = [
  {
    titulo: "Módulo 1",
    carga: "436 h/a",
    disciplinas: [
      "Antigo Testamento A",
      "Canonicidade",
      "Missões Urbanas",
      "Introdução à Teologia",
      "Fé e Crescimento Pessoal",
      "Metodologia da Pesquisa Científica",
      "Atividade Extracurricular 1",
    ],
  },
  {
    titulo: "Módulo 2",
    carga: "468 h/a",
    disciplinas: [
      "Antigo Testamento B",
      "Novo Testamento A",
      "Antropologia e Missões Transculturais",
      "Teologia Bíblica",
      "Noções de Grego Bíblico",
      "Liderança Cristã",
      "Atividade Extracurricular 2",
    ],
  },
  {
    titulo: "Módulo 3",
    carga: "436 h/a",
    disciplinas: [
      "Profecias Bíblicas",
      "Novo Testamento B",
      "Teologia Bíblica de Missões",
      "Teologia Sistemática A",
      "Hermenêutica",
      "História do Cristianismo 1",
      "Atividade Extracurricular 3",
    ],
  },
  {
    titulo: "Módulo 4",
    carga: "404 h/a",
    disciplinas: [
      "Novo Testamento C",
      "Teologia e Prática da Evangelização",
      "Teologia Sistemática B",
      "Homilética",
      "Exegese do Novo Testamento",
      "História do Cristianismo 2",
      "Atividade Extracurricular 4",
    ],
  },
  {
    titulo: "Módulo 5",
    carga: "468 h/a",
    disciplinas: [
      "Novo Testamento D",
      "A Igreja e os Desafios do Terceiro Setor",
      "Teologia Sistemática C",
      "Noções de Hebraico Bíblico",
      "Aconselhamento Pastoral",
      "TCC A",
      "Atividade Extracurricular 5",
    ],
  },
  {
    titulo: "Módulo 6",
    carga: "360 h/a",
    disciplinas: [
      "Teologia Sistemática D",
      "Ética Pastoral",
      "Religiões Comparadas",
      "Discipulado Cristão",
      "TCC B",
      "Atividade Extracurricular 6",
    ],
  },
];

const diferenciais = [
  {
    titulo: "100% EAD",
    descricao:
      "Curso totalmente online, com aulas gravadas e acesso pensado para quem precisa de flexibilidade real.",
    emoji: "🌐",
  },
  {
    titulo: "Estude no seu ritmo",
    descricao:
      "Você organiza seus horários e avança no conteúdo com mais liberdade, sem perder profundidade de formação.",
    emoji: "⏱",
  },
  {
    titulo: "Aulas gravadas",
    descricao:
      "Revise o conteúdo quantas vezes precisar e acompanhe sua formação com mais tranquilidade.",
    emoji: "🎥",
  },
  {
    titulo: "Formação sólida",
    descricao:
      "Base bíblica, reflexão teológica, preparação ministerial e desenvolvimento espiritual em uma jornada estruturada.",
    emoji: "📖",
  },
];

const passos = [
  {
    passo: "1",
    titulo: "Fale com a equipe",
    descricao:
      "Tire suas dúvidas, entenda como funciona a formação e receba orientação para iniciar sua matrícula.",
  },
  {
    passo: "2",
    titulo: "Envie seus dados",
    descricao:
      "Deixe seu contato ou converse pelo WhatsApp para que a equipe organize seu atendimento.",
  },
  {
    passo: "3",
    titulo: "Finalize sua entrada",
    descricao:
      "Após o atendimento e confirmação, você segue para os próximos passos da matrícula e acesso ao curso.",
  },
];

const publicos = [
  "Líderes cristãos que desejam formação teológica sólida",
  "Obreiros, professores e vocacionados ao ministério",
  "Quem busca estudar com flexibilidade e profundidade",
  "Pessoas que precisam conciliar estudo, família e trabalho",
];

const depoimentos = [
  {
    nome: "Marcos A.",
    cargo: "Aluno do curso",
    texto:
      "Eu precisava de uma formação séria, mas sem abandonar minha rotina de trabalho e ministério. O formato EAD do IBE me deu exatamente isso.",
  },
  {
    nome: "Priscila R.",
    cargo: "Aluna do curso",
    texto:
      "Consegui estudar no meu tempo, rever as aulas e aprofundar minha base bíblica com muito mais segurança e clareza.",
  },
  {
    nome: "Samuel L.",
    cargo: "Líder cristão",
    texto:
      "O curso une conteúdo consistente, visão ministerial e flexibilidade. Foi uma decisão importante para meu crescimento espiritual e teológico.",
  },
];

const perguntasFaq = [
  {
    pergunta: "O curso é realmente 100% EAD?",
    resposta:
      "Sim. O curso foi estruturado na modalidade EAD, com aulas gravadas e acesso pensado para quem precisa de flexibilidade para estudar.",
  },
  {
    pergunta: "Posso estudar mesmo tendo rotina corrida?",
    resposta:
      "Sim. Essa é uma das principais vantagens. Você pode organizar seus horários e acompanhar os conteúdos no seu ritmo.",
  },
  {
    pergunta: "Preciso falar com alguém antes de me matricular?",
    resposta:
      "Sim, e isso é positivo para a conversão. A equipe do IBE orienta você em cada passo, esclarece dúvidas e conduz o processo com atendimento direto.",
  },
  {
    pergunta: "O curso é indicado para quem já atua no ministério?",
    resposta:
      "Sim. O curso atende tanto quem já serve no ministério quanto quem deseja aprofundar sua formação bíblica e teológica com mais estrutura.",
  },
  {
    pergunta: "Como faço para começar?",
    resposta:
      "Basta clicar no WhatsApp ou deixar seus dados no formulário. A equipe entrará em contato para orientar os próximos passos da matrícula.",
  },
];

function criarLinkWhatsapp({
  nome,
  whatsapp,
  email,
  mensagem,
}: {
  nome?: string;
  whatsapp?: string;
  email?: string;
  mensagem?: string;
}) {
  const texto = [
    "Olá! Quero iniciar minha matrícula no curso Bacharel Livre em Teologia do IBE.",
    nome ? `Nome: ${nome}` : "",
    whatsapp ? `WhatsApp: ${whatsapp}` : "",
    email ? `Email: ${email}` : "",
    mensagem ? `Mensagem: ${mensagem}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/5548988101240?text=${encodeURIComponent(texto)}`;
}

const mensagemWhatsappPadrao =
  "Olá! Quero iniciar minha matrícula no curso Bacharel Livre em Teologia do IBE.\n\nPode me explicar como funciona e quais são os próximos passos?";

const linkWhatsappPadrao = `https://wa.me/5548988101240?text=${encodeURIComponent(
  mensagemWhatsappPadrao
)}`;

export default function IbeMatriculaPage() {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [erro, setErro] = useState("");
  const [faqAberto, setFaqAberto] = useState<number | null>(0);

  const whatsappLinkDinamico = useMemo(() => {
    return criarLinkWhatsapp({
      nome,
      whatsapp,
      email,
      mensagem,
    });
  }, [nome, whatsapp, email, mensagem]);

  async function enviarLead(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  try {
    setEnviando(true);
    setErro("");
    setSucesso("");

    const link = criarLinkWhatsapp({
      nome,
      whatsapp,
      email,
      mensagem,
    });

    setSucesso("Abrindo o WhatsApp com sua mensagem pronta.");

    window.open(link, "_blank");

    setTimeout(() => {
      setEnviando(false);
    }, 500);
  } catch {
    setErro("Não foi possível abrir o WhatsApp agora.");
    setEnviando(false);
  }
}

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* BOTÃO FLUTUANTE INTELIGENTE */}
      <a
        href={whatsappLinkDinamico}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-full bg-green-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(34,197,94,0.45)] transition hover:-translate-y-0.5 hover:bg-green-400"
      >
        <span className="text-lg">💬</span>
        <span>Quero falar no WhatsApp</span>
      </a>

            {/* HERO PREMIUM */}
<section className="relative overflow-hidden bg-[#080b1f] text-white">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.35),transparent_32%),radial-gradient(circle_at_85%_35%,rgba(34,197,94,0.18),transparent_28%)]" />

  <div className="relative mx-auto max-w-7xl px-6 py-6 md:px-10 lg:px-12 lg:py-8">
    {/* TOPO */}
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-4">
        <Image
          src="/ibe/logo-branca.png"
          alt="IBE Instituto Batista de Educação"
          width={230}
          height={90}
          className="h-auto w-[150px] object-contain md:w-[210px]"
          priority
        />

        <div className="hidden md:block">
          <p className="text-sm text-white/75">
            Instituto Batista de Educação Ltda
          </p>
          <p className="text-xs uppercase tracking-[0.24em] text-blue-300">
            Formação Teológica de Excelência
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href="#matricula"
          className="inline-flex items-center justify-center rounded-2xl bg-green-500 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_35px_rgba(34,197,94,0.35)] transition hover:-translate-y-0.5 hover:bg-green-400"
        >
          Quero me matricular
        </a>

        <a
          href={linkWhatsappPadrao}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
        >
          Falar no WhatsApp
        </a>
      </div>
    </div>

    {/* CONTEÚDO PRINCIPAL */}
    <div className="mt-8 grid items-start gap-10 lg:grid-cols-[0.92fr_1.08fr] xl:gap-16">
      {/* TEXTO */}
      <div>
        <div className="inline-flex items-center rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-sm font-semibold text-yellow-200">
          🎓 Matrículas abertas para 2026
        </div>

        <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-[-0.04em] md:text-5xl xl:text-6xl">
          Bacharel Livre em Teologia
          <span className="block bg-gradient-to-r from-blue-200 via-white to-blue-300 bg-clip-text text-transparent">
            100% EAD e com formação completa
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-8 text-slate-200 md:text-lg">
          Estude teologia com profundidade, flexibilidade e orientação direta.
          Uma formação bíblica sólida para quem deseja crescer no ministério,
          na liderança cristã e na vida espiritual.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="#matricula"
            className="inline-flex items-center justify-center rounded-2xl bg-green-500 px-7 py-4 text-base font-bold text-white shadow-[0_18px_50px_rgba(34,197,94,0.42)] transition hover:-translate-y-0.5 hover:bg-green-400"
          >
            Quero garantir minha vaga agora
          </a>

          <a
            href={linkWhatsappPadrao}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-7 py-4 text-base font-semibold text-white transition hover:bg-white/15"
          >
            Tirar dúvidas no WhatsApp
          </a>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p className="text-2xl font-black">+1.200</p>
            <p className="mt-1 text-xs text-slate-300">alunos formados</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p className="text-2xl font-black">+10 anos</p>
            <p className="mt-1 text-xs text-slate-300">de experiência</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p className="text-2xl font-black">100%</p>
            <p className="mt-1 text-xs text-slate-300">online</p>
          </div>
        </div>

        <p className="mt-6 text-sm text-slate-300">
          ✔ Aulas gravadas • ✔ Estude no seu ritmo • ✔ Atendimento direto da equipe
        </p>
      </div>

      {/* VÍDEO EM EVIDÊNCIA */}
      <div className="relative -mt-10 lg:-mt-14">
        <div className="absolute -inset-6 rounded-[42px] bg-blue-500/20 blur-3xl" />

        <div className="relative rounded-[34px] border border-white/15 bg-white/10 p-4 shadow-[0_35px_100px_rgba(0,0,0,0.65)] backdrop-blur">
          <div className="mb-4 flex items-center justify-between gap-3 px-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">
                Assista antes de se matricular
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Conheça a proposta do curso em vídeo.
              </p>
            </div>

            <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
              Vídeo oficial
            </span>
          </div>

         <div className="group relative overflow-hidden rounded-[28px] bg-black shadow-[0_30px_90px_rgba(0,0,0,0.75)] ring-1 ring-white/10">
  <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black/55 via-transparent to-black/20" />

  <div className="absolute left-5 top-5 z-20 rounded-full bg-black/55 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
    ▶ Apresentação oficial
  </div>

  <div className="absolute bottom-5 left-5 right-5 z-20 flex items-end justify-between gap-4 pointer-events-none">
    <div>
      <p className="text-lg font-black text-white drop-shadow md:text-xl">
        Conheça o Bacharel Livre em Teologia
      </p>
      <p className="mt-1 text-sm text-white/80">
        Assista antes de iniciar sua matrícula
      </p>
    </div>

    <div className="hidden h-14 w-14 items-center justify-center rounded-full bg-red-600 text-2xl text-white shadow-2xl md:flex">
      ▶
    </div>
  </div>

  <div className="aspect-video w-full transition duration-500 group-hover:scale-[1.02]">
    <iframe
      className="h-full w-full"
      src="https://www.youtube.com/embed/KEBx6SLeNBc?autoplay=1&mute=1&loop=1&playlist=KEBx6SLeNBc&controls=1&rel=0&modestbranding=1"
      title="Apresentação do curso de Teologia IBE"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  </div>
</div>

          <div className="mt-5 grid gap-3 rounded-[26px] bg-white p-5 text-slate-900 md:grid-cols-3">
            <div>
              <p className="text-sm font-bold">Curso 100% EAD</p>
              <p className="mt-1 text-xs text-slate-500">Aulas gravadas</p>
            </div>

            <div>
              <p className="text-sm font-bold">6 módulos</p>
              <p className="mt-1 text-xs text-slate-500">Formação estruturada</p>
            </div>

            <div>
              <p className="text-sm font-bold">2.616 h/a</p>
              <p className="mt-1 text-xs text-slate-500">Carga total</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* TRANSIÇÃO PREMIUM */}
<section className="bg-white py-16">
  <div className="mx-auto max-w-5xl px-6 text-center">

    <div className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
      Formação flexível e estruturada
    </div>

    <h2 className="mt-6 text-3xl font-bold leading-tight md:text-4xl">
      Estude teologia com profundidade,
      <br className="hidden md:block" />
      sem abrir mão da sua rotina
    </h2>

    <p className="mt-6 text-lg leading-8 text-slate-600 max-w-3xl mx-auto">
      Uma formação pensada para quem precisa conciliar estudo, trabalho, família
      e ministério, sem perder qualidade, profundidade e propósito.
    </p>

    <div className="mt-10 flex justify-center">
      <a
        href={linkWhatsappPadrao}
        target="_blank"
        rel="noreferrer"
        className="rounded-2xl bg-green-500 px-8 py-4 text-base font-semibold text-white shadow-xl transition hover:bg-green-400"
      >
        Quero iniciar minha matrícula agora
      </a>
    </div>

  </div>
</section>

      {/* DESTAQUES */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {diferenciais.map((item) => (
            <div
              key={item.titulo}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="text-3xl">{item.emoji}</div>
              <h3 className="mt-4 text-xl font-bold">{item.titulo}</h3>
              <p className="mt-3 leading-7 text-slate-600">{item.descricao}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <a
            href={linkWhatsappPadrao}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl bg-green-500 px-8 py-4 text-base font-semibold text-white shadow-xl transition hover:bg-green-400"
          >
            Quero iniciar minha matrícula agora
          </a>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Depoimentos
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Uma decisão importante para quem quer crescer com profundidade
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              <p className="mt-4 text-lg text-slate-600 max-w-2xl">
  Veja como este curso tem impactado a vida de alunos que decidiram investir em sua formação teológica.
</p>
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {depoimentos.map((item) => (
              <div
                key={item.nome}
                className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm"
              >
                <div className="text-2xl">⭐️⭐️⭐️⭐️⭐️</div>
                <p className="mt-5 leading-8 text-slate-600">“{item.texto}”</p>
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <p className="font-bold text-slate-900">{item.nome}</p>
                  <p className="text-sm text-slate-500">{item.cargo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Sobre o IBE
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Formação em Teologia de Excelência
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              O Instituto Batista de Educação de Santa Catarina nasceu para atender
              a um grande desafio: formar líderes cristãos comprometidos, preparados
              e capacitados para fazer a diferença no ministério e na sociedade.
            </p>
          </div>
        </div>
      </section>

      {/* PARA QUEM É */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                Para quem é este curso
              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Uma formação pensada para quem quer crescer com propósito
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                O curso foi estruturado para pessoas que desejam aprofundar sua
                formação teológica, desenvolver maturidade espiritual e ampliar sua
                capacidade de servir com responsabilidade e visão bíblica.
              </p>
            </div>

            <div className="grid gap-4">
              {publicos.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="font-medium text-slate-800">✓ {item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MISSÃO, VISÃO, VALORES */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Missão
              </p>
              <p className="mt-4 leading-8 text-slate-600">
                Promover a formação de líderes comprometidos, primeiramente, com
                Deus, que desenvolvam a reflexão religiosa e teológica de maneira
                crítica e criativa; que primem por uma conduta cristã digna e
                busquem excelência em sua atuação ministerial.
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Visão
              </p>
              <p className="mt-4 leading-8 text-slate-600">
                Ser uma instituição de ensino teológico dedicada à capacitação de
                líderes cristãos, reconhecida pelo compromisso com a Palavra de Deus,
                com os princípios cristãos e com o pensamento responsável.
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Valores
              </p>
              <ul className="mt-4 space-y-3 text-slate-600">
                <li>• Dependência total e irrestrita de Deus</li>
                <li>• Compromisso com a Bíblia, a Palavra de Deus</li>
                <li>• Ética e integridade cristã</li>
                <li>• Responsabilidade social</li>
                <li>• Respeito à dignidade da pessoa humana</li>
                <li>• Compromisso com o desenvolvimento espiritual e ministerial dos alunos</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Como funciona
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Seu caminho para iniciar a matrícula
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {passos.map((item) => (
              <div
                key={item.passo}
                className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {item.passo}
                </div>
                <h3 className="mt-5 text-xl font-bold">{item.titulo}</h3>
                <p className="mt-3 leading-7 text-slate-600">{item.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* METODOLOGIA E ESTRUTURA */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Metodologia
              </p>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                As aulas são ministradas integralmente na modalidade Educação a
                Distância (EAD), com acesso a conteúdos gravados e liberdade para
                acompanhar a formação no seu próprio ritmo.
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Estrutura do curso
              </p>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Carga horária total de <strong>2.616 horas</strong>, distribuídas ao
                longo de <strong>6 módulos</strong>, com disciplinas bíblicas,
                teológicas, missionárias, pastorais e de pesquisa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MATRIZ CURRICULAR */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Matriz curricular
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Organização do curso por módulos
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Uma formação estruturada em seis módulos, com disciplinas voltadas à
              interpretação bíblica, teologia sistemática, missão, evangelização,
              liderança, aconselhamento e produção acadêmica.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {modulos.map((modulo) => (
              <div
                key={modulo.titulo}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-bold">{modulo.titulo}</h3>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                    {modulo.carga}
                  </span>
                </div>

                <ul className="mt-5 space-y-2 text-slate-600">
                  {modulo.disciplinas.map((disciplina) => (
                    <li key={disciplina}>• {disciplina}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600 shadow-sm">
            As atividades extracurriculares devem ser desenvolvidas ao longo dos
            seis módulos, com média de 20 horas por módulo, totalizando no mínimo
            120 horas ao final do curso.
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
              Tire suas dúvidas antes de iniciar sua matrícula
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Esta seção foi pensada para quebrar objeções e facilitar a decisão de quem
              está considerando entrar no curso.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {perguntasFaq.map((item, index) => {
              const aberto = faqAberto === index;

              return (
                <div
                  key={item.pergunta}
                  className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setFaqAberto(aberto ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-base font-bold text-slate-900 md:text-lg">
                      {item.pergunta}
                    </span>
                    <span className="text-xl font-bold text-blue-700">
                      {aberto ? "−" : "+"}
                    </span>
                  </button>

                  {aberto ? (
                    <div className="border-t border-slate-100 px-6 pb-6 pt-4 text-slate-600 leading-8">
                      {item.resposta}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <a
              href={linkWhatsappPadrao}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-2xl bg-green-500 px-8 py-4 text-base font-semibold text-white shadow-xl transition hover:bg-green-400"
            >
              Tirar dúvidas no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="rounded-[32px] bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-8 text-white shadow-xl md:p-12">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
                  Matrículas abertas
                </p>
                <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                  Dê o próximo passo na sua formação teológica
                </h2>
                <p className="mt-4 text-lg leading-8 text-slate-200">
                  Fale com a equipe do IBE, tire suas dúvidas e inicie seu processo
                  de matrícula para 2026 com orientação e atendimento direto.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <a
                  href={linkWhatsappPadrao}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl bg-green-500 px-6 py-4 text-sm font-semibold text-white transition hover:bg-green-400"
                >
                  Falar no WhatsApp agora
                </a>

                <a
                  href="#contato"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Solicitar atendimento
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
<div className="mt-12 flex justify-center">
  <a
    href={linkWhatsappPadrao}
    target="_blank"
    rel="noreferrer"
    className="rounded-2xl bg-green-500 px-8 py-4 text-base font-semibold text-white shadow-xl transition hover:bg-green-400"
  >
    Quero iniciar minha matrícula agora
  </a>
</div>
      {/* CONTATO */}
      <section id="contato" className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
                Matrícula e atendimento
              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Deixe seu contato abaixo para falar com a nossa equipe
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
                Você também pode usar nosso WhatsApp para atendimento rápido.
                Nossa equipe está pronta para orientar sobre matrícula, curso,
                funcionamento e próximos passos.
              </p>

              <div className="mt-8 space-y-3 text-slate-200">
                <p>📞 Comercial: (48) 98810-1240</p>
                <p>📞 Fixo: (48) 3208-1353</p>
                <p>📧 atendimento@institutobatista.com</p>
                <p>📧 roberto@institutobatista.org</p>
              </div>

              <div className="mt-8">
                <a
                  href={whatsappLinkDinamico}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl bg-green-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-green-400"
                >
                  Falar no WhatsApp agora
                </a>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
              <h3 className="text-2xl font-bold">Solicitar atendimento</h3>
              <p className="mt-3 text-slate-300">
                Preencha seus dados para que nossa equipe entre em contato.
              </p>

              <div className="mt-8 space-y-5">

  <div className="rounded-2xl border border-green-400/20 bg-green-500/10 px-5 py-4 text-sm text-green-200">
    Atendimento direto com a equipe do IBE. Ao clicar no botão abaixo, você será atendido no WhatsApp com orientação completa para iniciar sua matrícula.
  </div>

  <a
    href={linkWhatsappPadrao}
    target="_blank"
    rel="noreferrer"
    className="flex w-full items-center justify-center rounded-2xl bg-green-500 px-6 py-4 text-base font-semibold text-white shadow-[0_15px_40px_rgba(34,197,94,0.4)] transition hover:-translate-y-0.5 hover:bg-green-400"
  >
    Quero falar no WhatsApp agora
  </a>

  <div className="grid gap-3 text-sm text-slate-300">
    <div className="rounded-xl bg-white/5 px-4 py-3">✔ Atendimento rápido e direto</div>
    <div className="rounded-xl bg-white/5 px-4 py-3">✔ Tiramos todas as suas dúvidas</div>
    <div className="rounded-xl bg-white/5 px-4 py-3">✔ Orientação completa para matrícula</div>
  </div>
<div className="mt-16">
  <h3 className="text-2xl font-semibold text-white">
    Saiba mais antes de se matricular
  </h3>

  <ul className="mt-4 space-y-2">
    <li>
      <a href="/blog/como-montar-um-curso-online" className="text-blue-400 underline">
        Como funciona um curso online
      </a>
    </li>
    <li>
      <a href="/blog/plataforma-ead-para-cursos-livres" className="text-blue-400 underline">
        O que é EAD na prática
      </a>
    </li>
  </ul>
</div>
  <p className="text-xs text-slate-400 text-center">
    Atendimento ativo agora • recomendamos iniciar sua conversa
  </p>

</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
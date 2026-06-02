"use client";

function calcularPascoa(ano: number) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(ano, mes - 1, dia);
}

function addDias(data: Date, dias: number) {
  const nova = new Date(data);
  nova.setDate(nova.getDate() + dias);
  return nova;
}

function chaveData(data: Date) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(data.getDate()).padStart(2, "0")}`;
}

function formatarDataFeriado(data: Date) {
  const dias = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ];

  return `${dias[data.getDay()]}, dia ${String(data.getDate()).padStart(
    2,
    "0"
  )}/${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function feriadoNacionalHoje() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const ano = hoje.getFullYear();
  const pascoa = calcularPascoa(ano);

  const feriados: Record<
    string,
    { nome: string; mensagem: string; emoji: string }
  > = {
    [`${ano}-01-01`]: {
      nome: "Confraternização Universal",
      emoji: "✨",
      mensagem:
        "Que este novo ciclo venha com organização, aprendizado e boas conquistas para toda a comunidade acadêmica.",
    },
    [`${ano}-04-21`]: {
      nome: "Tiradentes",
      emoji: "🇧🇷",
      mensagem:
        "Hoje lembramos a história do Brasil. Aproveite o feriado com responsabilidade e tranquilidade.",
    },
    [`${ano}-05-01`]: {
      nome: "Dia do Trabalhador",
      emoji: "💼",
      mensagem:
        "Uma homenagem especial a todos que constroem a educação todos os dias com dedicação e compromisso.",
    },
    [`${ano}-09-07`]: {
      nome: "Independência do Brasil",
      emoji: "🇧🇷",
      mensagem:
        "Bom feriado! Que este dia inspire cidadania, conhecimento e orgulho pela nossa história.",
    },
    [`${ano}-10-12`]: {
      nome: "Nossa Senhora Aparecida",
      emoji: "🌷",
      mensagem:
        "Bom feriado! Desejamos um dia de paz, descanso e bons momentos com quem você ama.",
    },
    [`${ano}-11-02`]: {
      nome: "Finados",
      emoji: "🕊️",
      mensagem:
        "Hoje é um dia de memória, respeito e reflexão. Desejamos serenidade a toda comunidade acadêmica.",
    },
    [`${ano}-11-15`]: {
      nome: "Proclamação da República",
      emoji: "🇧🇷",
      mensagem:
        "Bom feriado! Um dia para lembrar a história do país e valorizar a educação como base da cidadania.",
    },
    [`${ano}-12-25`]: {
      nome: "Natal",
      emoji: "🎄",
      mensagem:
        "Feliz Natal! Que este dia seja de paz, união, esperança e renovação para todos.",
    },
    [chaveData(addDias(pascoa, -48))]: {
      nome: "Carnaval",
      emoji: "🎭",
      mensagem:
        "Bom feriado de Carnaval! Aproveite com alegria, cuidado e responsabilidade.",
    },
    [chaveData(addDias(pascoa, -47))]: {
      nome: "Carnaval",
      emoji: "🎭",
      mensagem:
        "Bom feriado de Carnaval! Aproveite com alegria, cuidado e responsabilidade.",
    },
    [chaveData(addDias(pascoa, -2))]: {
      nome: "Sexta-feira Santa",
      emoji: "🕊️",
      mensagem:
        "Hoje é um dia de reflexão, respeito e serenidade. Bom feriado a toda comunidade acadêmica.",
    },
    [chaveData(addDias(pascoa, 60))]: {
      nome: "Corpus Christi",
      emoji: "🌿",
      mensagem:
        "Bom feriado de Corpus Christi! Verifique se sua instituição mantém aulas, atividades EAD ou reposições.",
    },
  };

  for (let i = 0; i <= 2; i++) {
    const dataVerificada = addDias(hoje, i);
    const feriado = feriados[chaveData(dataVerificada)];

    if (feriado) {
      return {
  ...feriado,
  diasRestantes: i,
  dataTexto: formatarDataFeriado(dataVerificada),
};
    }
  }

  return null;
}
export default function PhanyxFeriadoAviso() {
  const feriado = feriadoNacionalHoje();

  if (!feriado) return null;

  return (
  <div className="mb-6 rounded-3xl border border-amber-300 bg-amber-50 p-5 shadow-sm dark:border-amber-400 dark:bg-[#2b2108]">
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
        {feriado.emoji}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
          Aviso PHANYX
        </p>

        <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">
          {feriado.diasRestantes === 0
          ? `Hoje é feriado: ${feriado.nome}`
          : feriado.diasRestantes === 1
          ? `Amanhã será feriado: ${feriado.nome}`
          : `Feriado chegando: ${feriado.nome}`}
        </h2>

        <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-amber-100">
          {feriado.dataTexto}
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-100">
  {feriado.diasRestantes === 0
    ? `Hoje (${feriado.dataTexto}) é ${feriado.nome}. ${feriado.mensagem}`
    : feriado.diasRestantes === 1
    ? `Amanhã (${feriado.dataTexto}) será celebrado ${feriado.nome}. ${feriado.mensagem}`
    : `Nesta ${feriado.dataTexto} será celebrado ${feriado.nome}. ${feriado.mensagem}`}
</p>
      </div>
    </div>
  </div>
);
}
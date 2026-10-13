export type FeriadoBrasil = {
  dataFeriado: string;
  chave: string;
  nome: string;
  emoji: string;
};

function dataISO(ano: number, mes: number, dia: number): string {
  return [
    String(ano).padStart(4, "0"),
    String(mes).padStart(2, "0"),
    String(dia).padStart(2, "0"),
  ].join("-");
}

function adicionarDiasUTC(data: Date, dias: number): Date {
  const resultado = new Date(data.getTime());
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado;
}

function dataUTCISO(data: Date): string {
  return data.toISOString().slice(0, 10);
}

function calcularPascoaUTC(ano: number): Date {
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

  return new Date(Date.UTC(ano, mes - 1, dia));
}

export function listarFeriadosNacionaisBrasil(
  ano: number
): FeriadoBrasil[] {
  const pascoa = calcularPascoaUTC(ano);

  const feriados: FeriadoBrasil[] = [
    {
      dataFeriado: dataISO(ano, 1, 1),
      chave: "newYear",
      nome: "Confraternização Universal",
      emoji: "✨",
    },
    {
      dataFeriado: dataUTCISO(adicionarDiasUTC(pascoa, -2)),
      chave: "goodFriday",
      nome: "Paixão de Cristo",
      emoji: "🕊️",
    },
    {
      dataFeriado: dataISO(ano, 4, 21),
      chave: "tiradentes",
      nome: "Tiradentes",
      emoji: "🇧🇷",
    },
    {
      dataFeriado: dataISO(ano, 5, 1),
      chave: "laborDay",
      nome: "Dia Mundial do Trabalho",
      emoji: "💼",
    },
    {
      dataFeriado: dataISO(ano, 9, 7),
      chave: "independence",
      nome: "Independência do Brasil",
      emoji: "🇧🇷",
    },
    {
      dataFeriado: dataISO(ano, 10, 12),
      chave: "aparecida",
      nome: "Nossa Senhora Aparecida",
      emoji: "🌷",
    },
    {
      dataFeriado: dataISO(ano, 11, 2),
      chave: "allSouls",
      nome: "Finados",
      emoji: "🕊️",
    },
    {
      dataFeriado: dataISO(ano, 11, 15),
      chave: "republic",
      nome: "Proclamação da República",
      emoji: "🇧🇷",
    },
    {
      dataFeriado: dataISO(ano, 11, 20),
      chave: "blackConsciousness",
      nome: "Dia Nacional de Zumbi e da Consciência Negra",
      emoji: "✊🏿",
    },
    {
      dataFeriado: dataISO(ano, 12, 25),
      chave: "christmas",
      nome: "Natal",
      emoji: "🎄",
    },
  ];

  return feriados.sort((a, b) =>
    a.dataFeriado.localeCompare(b.dataFeriado)
  );
}

export function buscarFeriadoNacionalBrasil(
  dataLocal: string
): (FeriadoBrasil & { diasRestantes: number }) | null {
  const ano = Number(dataLocal.slice(0, 4));

  if (!Number.isInteger(ano) || ano < 1900 || ano > 2200) {
    return null;
  }

  const hojeUTC = new Date(`${dataLocal}T00:00:00.000Z`);

  if (Number.isNaN(hojeUTC.getTime())) {
    return null;
  }

  const candidatos = [
    ...listarFeriadosNacionaisBrasil(ano),
    ...listarFeriadosNacionaisBrasil(ano + 1),
  ];

  for (const feriado of candidatos) {
    const dataFeriadoUTC = new Date(
      `${feriado.dataFeriado}T00:00:00.000Z`
    );

    const diasRestantes = Math.round(
      (dataFeriadoUTC.getTime() - hojeUTC.getTime()) /
        86400000
    );

    if (diasRestantes >= 0 && diasRestantes <= 3) {
      return {
        ...feriado,
        diasRestantes,
      };
    }
  }

  return null;
}
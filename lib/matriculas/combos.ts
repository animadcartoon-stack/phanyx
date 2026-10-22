// Funções compartilhadas pelo cálculo do servidor, pela interface e pelos testes.
export class ErroModalidades extends Error {
  constructor(
    public codigo: string,
    public status = 400,
    public detalhes?: unknown,
  ) {
    super(codigo);
    this.name = "ErroModalidades";
  }
}

export type PrecoCursoModalidade = {
  id: number;
  nome: string;
  participaCombo: boolean;
  valorMatricula: number | string | null;
  valorMensalidade: number | string | null;
  valorMensalidadeCombo: number | string | null;
  quantidadeParcelas: number | null;
};
export type RegraCombo = {
  id: number;
  nome: string;
  ativo: boolean;
  minimoModalidades: number;
  maximoModalidades: number | null;
  modoPreco: "FIXO" | "SOMA";
  valorMatricula: number | string;
  valorMensalidade: number | string | null;
  quantidadeParcelas: number;
  cursoIds: number[];
};

export function centavos(valor: unknown): number {
  if (
    (typeof valor !== "number" && typeof valor !== "string") ||
    String(valor).trim() === ""
  ) {
    throw new ErroModalidades("PRECO_NAO_CONFIGURADO");
  }
  const texto = String(valor).trim();
  // Os inputs de moeda usam o formato decimal canônico do navegador/API.
  if (!/^\d+(?:\.\d{1,2})?$/.test(texto))
    throw new ErroModalidades("VALOR_INVALIDO");
  const [inteiro, decimal = ""] = texto.split(".");
  const total = Number(inteiro) * 100 + Number(decimal.padEnd(2, "0"));
  if (!Number.isSafeInteger(total) || total > 9999999999)
    throw new ErroModalidades("VALOR_INVALIDO");
  return total;
}

export function idsPositivos(valor: unknown, limite = 100): number[] {
  if (
    !Array.isArray(valor) ||
    valor.length > limite ||
    valor.some(
      (id) =>
        (typeof id !== "number" && typeof id !== "string") ||
        !/^\d+$/.test(String(id)) ||
        !Number.isSafeInteger(Number(id)) ||
        Number(id) <= 0,
    )
  ) {
    throw new ErroModalidades("SELECAO_INVALIDA");
  }
  const ids = valor.map(Number);
  if (new Set(ids).size !== ids.length)
    throw new ErroModalidades("SELECAO_DUPLICADA");
  return ids;
}

export function calcularContratacaoModalidades(
  cursos: PrecoCursoModalidade[],
  combos: RegraCombo[],
) {
  if (
    !cursos.length ||
    new Set(cursos.map((c) => c.id)).size !== cursos.length
  ) {
    throw new ErroModalidades("SELECAO_INVALIDA");
  }
  const ordenados = [...cursos].sort((a, b) => a.id - b.id);
  const avulso = {
    comboId: null as number | null,
    nome: "AVULSO",
    cursoIdsCombo: [] as number[],
    cursoIdsAvulsos: ordenados.map((c) => c.id),
    matriculaCentavos: ordenados.reduce(
      (s, c) => s + centavos(c.valorMatricula),
      0,
    ),
    mensalidadeCentavos: ordenados.reduce(
      (s, c) => s + centavos(c.valorMensalidade),
      0,
    ),
    quantidadeParcelas: ordenados[0].quantidadeParcelas || 1,
  };
  const candidatos = combos
    .filter((c) => c.ativo)
    .flatMap((combo) => {
      const elegiveis = ordenados.filter(
        (c) => c.participaCombo && combo.cursoIds.includes(c.id),
      );
      if (
        elegiveis.length < combo.minimoModalidades ||
        (combo.maximoModalidades !== null &&
          elegiveis.length > combo.maximoModalidades)
      )
        return [];
      // Um curso sem preço de combo não pode entrar silenciosamente com valor zero.
      if (
        combo.modoPreco === "SOMA" &&
        elegiveis.some((c) => c.valorMensalidadeCombo == null)
      )
        return [];
      const extras = ordenados.filter(
        (c) => !elegiveis.some((e) => e.id === c.id),
      );
      if (extras.some((c) => c.quantidadeParcelas !== combo.quantidadeParcelas))
        return [];
      return [
        {
          comboId: combo.id,
          nome: combo.nome,
          cursoIdsCombo: elegiveis.map((c) => c.id),
          cursoIdsAvulsos: extras.map((c) => c.id),
          matriculaCentavos:
            centavos(combo.valorMatricula) +
            extras.reduce((s, c) => s + centavos(c.valorMatricula), 0),
          mensalidadeCentavos:
            (combo.modoPreco === "FIXO"
              ? centavos(combo.valorMensalidade)
              : elegiveis.reduce(
                  (s, c) => s + centavos(c.valorMensalidadeCombo),
                  0,
                )) +
            extras.reduce((s, c) => s + centavos(c.valorMensalidade), 0),
          quantidadeParcelas: combo.quantidadeParcelas,
        },
      ];
    });
  // Atingido o mínimo, aplica um combo. Entre combos elegíveis, usa o menor
  // total contratual, com desempate estável, independente da ordem dos cliques.
  candidatos.sort(
    (a, b) =>
      a.matriculaCentavos +
        a.mensalidadeCentavos * a.quantidadeParcelas -
        (b.matriculaCentavos + b.mensalidadeCentavos * b.quantidadeParcelas) ||
      a.comboId - b.comboId,
  );
  if (
    !candidatos.length &&
    ordenados.some(
      (c) =>
        !Number.isInteger(c.quantidadeParcelas) ||
        c.quantidadeParcelas < 1 ||
        c.quantidadeParcelas > 120 ||
        c.quantidadeParcelas !== avulso.quantidadeParcelas,
    )
  ) {
    throw new ErroModalidades("PARCELAS_INCOMPATIVEIS");
  }
  const resultado = candidatos[0] || avulso;
  if (
    !Number.isSafeInteger(resultado.matriculaCentavos) ||
    resultado.matriculaCentavos > 9999999999 ||
    !Number.isSafeInteger(resultado.mensalidadeCentavos) ||
    resultado.mensalidadeCentavos > 9999999999
  ) {
    throw new ErroModalidades("VALOR_INVALIDO");
  }
  return { ...resultado, quantidadeModalidades: cursos.length, avulso };
}

export type HorarioModalidade = {
  diaSemana: number;
  horaInicio: string;
  horaFim: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  turmaId: number;
  disciplinaId: number;
  turmaNome: string;
  disciplinaNome: string;
};

export function minutos(hora: string | null): number | null {
  if (!hora || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) return null;
  return Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3));
}

export function horarioValido(h: HorarioModalidade) {
  return (
    Number.isInteger(h.diaSemana) &&
    h.diaSemana >= 0 &&
    h.diaSemana <= 6 &&
    minutos(h.horaInicio) !== null &&
    minutos(h.horaFim) !== null &&
    minutos(h.horaInicio)! < minutos(h.horaFim)! &&
    (!h.dataInicio || !h.dataFim || h.dataInicio <= h.dataFim)
  );
}

export function horariosSobrepostos(
  a: HorarioModalidade,
  b: HorarioModalidade,
) {
  if (!horarioValido(a) || !horarioValido(b) || a.diaSemana !== b.diaSemana)
    return false;
  if (
    minutos(a.horaInicio)! >= minutos(b.horaFim)! ||
    minutos(b.horaInicio)! >= minutos(a.horaFim)!
  )
    return false;
  const inicio = [a.dataInicio, b.dataInicio].filter(Boolean).sort().pop();
  const fim = [a.dataFim, b.dataFim].filter(Boolean).sort()[0];
  if (inicio && fim) {
    if (inicio > fim) return false;
    const data = new Date(`${inicio}T00:00:00.000Z`);
    data.setUTCDate(
      data.getUTCDate() + ((a.diaSemana - data.getUTCDay() + 7) % 7),
    );
    return data.toISOString().slice(0, 10) <= fim;
  }
  return true;
}

export function encontrarConflitos(
  horarios: HorarioModalidade[],
  existentes: HorarioModalidade[] = [],
) {
  const conflitos: {
    primeiro: HorarioModalidade;
    segundo: HorarioModalidade;
  }[] = [];
  horarios.forEach((a, i) => {
    for (const b of [...horarios.slice(i + 1), ...existentes]) {
      // Dois registros do mesmo encontro não são dois compromissos distintos.
      if (a.turmaId === b.turmaId && a.disciplinaId === b.disciplinaId)
        continue;
      if (horariosSobrepostos(a, b))
        conflitos.push({ primeiro: a, segundo: b });
    }
  });
  return conflitos;
}

export function vencimentoMensal(data: string, deslocamento: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data))
    throw new ErroModalidades("DATA_INVALIDA");
  const inicial = new Date(`${data}T12:00:00.000Z`);
  if (
    Number.isNaN(inicial.getTime()) ||
    inicial.toISOString().slice(0, 10) !== data ||
    inicial.getUTCFullYear() < 1900
  ) {
    throw new ErroModalidades("DATA_INVALIDA");
  }
  const ultimo = new Date(
    Date.UTC(
      inicial.getUTCFullYear(),
      inicial.getUTCMonth() + deslocamento + 1,
      0,
      12,
    ),
  );
  ultimo.setUTCDate(Math.min(inicial.getUTCDate(), ultimo.getUTCDate()));
  return ultimo;
}

export function nomeContratacaoModalidades(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot))
    return null;
  const s = snapshot as { versao?: unknown; nome?: unknown };
  return s.versao === 1 && typeof s.nome === "string" && s.nome.trim()
    ? s.nome.trim()
    : null;
}



export type AvisoInteligenteTipo =
  | "FERIADO"
  | "CAMPANHA_MES"
  | "PADRAO"
  | "ACADEMICO"
  | "FINANCEIRO"
  | "SISTEMA";

export type AvisoInteligenteCor =
  | "cinza"
  | "azul"
  | "preto"
  | "rosa"
  | "amarelo"
  | "verde"
  | "laranja"
  | "vermelho"
  | "roxo";

export type AvisoInteligente = {
  tipo: AvisoInteligenteTipo;
  titulo: string;
  descricao: string;
  frase: string;
  icone: string;
  categoria: string;
  cor: AvisoInteligenteCor;
  texto: "claro" | "escuro";
  link?: string;
  textoBotao?: string;
  prioridade: number;
};

const campanhasPorMes: Record<number, AvisoInteligente> = {
  1: {
    tipo: "CAMPANHA_MES",
    titulo: "Janeiro Branco",
    descricao: "Mês de conscientização sobre a saúde mental.",
    frase: "Cuidar da mente é tão importante quanto cuidar do corpo. Reserve um tempo para você.",
    icone: "🤍",
    categoria: "Saúde",
    cor: "cinza",
    texto: "escuro",
    prioridade: 20,
  },
  2: {
    tipo: "CAMPANHA_MES",
    titulo: "Fevereiro Laranja",
    descricao: "Mês de conscientização sobre a leucemia.",
    frase: "A informação, o diagnóstico precoce e a doação de medula óssea podem salvar vidas.",
    icone: "🧡",
    categoria: "Saúde",
    cor: "laranja",
    texto: "escuro",
    prioridade: 20,
  },
  3: {
    tipo: "CAMPANHA_MES",
    titulo: "Março Vermelho",
    descricao: "Mês de conscientização sobre a saúde dos rins e prevenção do câncer renal.",
    frase: "Hábitos saudáveis e exames preventivos contribuem para uma vida mais longa e saudável.",
    icone: "❤️",
    categoria: "Saúde",
    cor: "vermelho",
    texto: "claro",
    prioridade: 20,
  },
  4: {
    tipo: "CAMPANHA_MES",
    titulo: "Abril Azul",
    descricao: "Mês de conscientização sobre o Transtorno do Espectro Autista (TEA).",
    frase: "Respeito, inclusão e compreensão transformam a sociedade e promovem oportunidades para todos.",
    icone: "💙",
    categoria: "Saúde",
    cor: "azul",
    texto: "claro",
    prioridade: 20,
  },
  5: {
    tipo: "CAMPANHA_MES",
    titulo: "Maio Cinza",
    descricao: "Mês de conscientização sobre o câncer cerebral.",
    frase: "Valorize sua saúde. A prevenção e o acompanhamento médico fazem toda a diferença.",
    icone: "🩶",
    categoria: "Saúde",
    cor: "cinza",
    texto: "escuro",
    prioridade: 20,
  },
  6: {
    tipo: "CAMPANHA_MES",
    titulo: "Junho Vermelho",
    descricao: "Mês de incentivo à doação de sangue.",
    frase: "Uma única doação pode salvar várias vidas. Doe sangue, compartilhe esperança.",
    icone: "🩸",
    categoria: "Saúde",
    cor: "vermelho",
    texto: "claro",
    prioridade: 20,
  },
  7: {
    tipo: "CAMPANHA_MES",
    titulo: "Julho Verde",
    descricao: "Mês de prevenção ao câncer de cabeça e pescoço.",
    frase: "A prevenção começa com informação e consultas médicas regulares.",
    icone: "💚",
    categoria: "Saúde",
    cor: "verde",
    texto: "claro",
    prioridade: 20,
  },
  8: {
    tipo: "CAMPANHA_MES",
    titulo: "Agosto Dourado",
    descricao: "Mês de incentivo ao aleitamento materno.",
    frase: "O aleitamento fortalece vínculos, promove saúde e oferece um começo de vida mais saudável.",
    icone: "💛",
    categoria: "Saúde",
    cor: "amarelo",
    texto: "escuro",
    prioridade: 20,
  },
  9: {
    tipo: "CAMPANHA_MES",
    titulo: "Setembro Amarelo",
    descricao: "Mês de valorização da vida e prevenção ao suicídio.",
    frase: "Ouvir, acolher e demonstrar empatia podem fazer a diferença na vida de alguém.",
    icone: "💛",
    categoria: "Saúde",
    cor: "amarelo",
    texto: "escuro",
    prioridade: 20,
  },
  10: {
    tipo: "CAMPANHA_MES",
    titulo: "Outubro Rosa",
    descricao: "Mês de prevenção ao câncer de mama.",
    frase: "O diagnóstico precoce salva vidas. Cuide da sua saúde e incentive quem você ama a fazer o mesmo.",
    icone: "🎀",
    categoria: "Saúde",
    cor: "rosa",
    texto: "claro",
    prioridade: 20,
  },
  11: {
    tipo: "CAMPANHA_MES",
    titulo: "Novembro Azul",
    descricao: "Mês de conscientização sobre a saúde do homem e prevenção ao câncer de próstata.",
    frase: "Prevenir é um ato de cuidado. Consultas e exames periódicos fazem a diferença.",
    icone: "💙",
    categoria: "Saúde",
    cor: "azul",
    texto: "claro",
    prioridade: 20,
  },
  12: {
    tipo: "CAMPANHA_MES",
    titulo: "Dezembro Vermelho",
    descricao: "Mês de conscientização sobre HIV, AIDS e outras infecções sexualmente transmissíveis.",
    frase: "Informação, prevenção e respeito são essenciais para proteger a saúde de todos.",
    icone: "❤️",
    categoria: "Saúde",
    cor: "vermelho",
    texto: "claro",
    prioridade: 20,
  },
};

export function getAvisoInteligente(dataBase = new Date()): AvisoInteligente {
  const mes = dataBase.getMonth() + 1;

  return (
    campanhasPorMes[mes] ?? {
      tipo: "PADRAO",
      titulo: "Saúde • Campanha Nacional",
      descricao: "Informação, prevenção e cuidado durante todo o ano.",
      frase:
        "Pequenas atitudes de hoje podem fazer uma grande diferença no futuro.",
      icone: "✨",
      categoria: "Informativo",
      cor: "verde",
      texto: "claro",
      prioridade: 1,
    }
  );
}
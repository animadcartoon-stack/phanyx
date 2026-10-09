export type LicencaLeitura = {
  permitirVisualizacao: boolean;
  permitirDownload?: boolean;
  permitirCopia?: boolean;
  permitirImpressao?: boolean;
};

/** Uma licença vigente restringe também obras marcadas como acesso livre. */
export function direitosLeituraBiblioteca(item: {
  modalidade: string;
  acessoLivre: boolean;
  licencas: LicencaLeitura[];
}) {
  const modalidades = ["LEITURA_INTERNA", "ACESSO_LIVRE", "DOWNLOAD_AUTORIZADO"];
  const autorizadas = item.licencas.filter((licenca) => licenca.permitirVisualizacao);
  const visualizar = item.licencas.length > 0 ? autorizadas.length > 0 : item.acessoLivre;
  return {
    visualizar,
    lerPdf: visualizar && modalidades.includes(item.modalidade),
    copiarTrecho: visualizar && (item.licencas.length > 0
      ? autorizadas.some((licenca) => licenca.permitirCopia)
      : false),
    imprimir: visualizar && (item.licencas.length > 0
      ? autorizadas.some((licenca) => licenca.permitirImpressao)
      : false),
  };
}

export const LIMITE_TRECHO_BIBLIOTECA = 1000;
export const LIMITE_PAGINAS_BIBLIOTECA = 50000;

export function validarPosicaoLeitura(pagina: unknown, total: unknown) {
  if (!Number.isSafeInteger(pagina) || !Number.isSafeInteger(total) ||
      Number(total) < 1 || Number(total) > LIMITE_PAGINAS_BIBLIOTECA ||
      Number(pagina) < 1 || Number(pagina) > Number(total)) return null;
  return { paginaAtual: Number(pagina), totalPaginas: Number(total),
    percentual: Math.round(Number(pagina) / Number(total) * 10000) / 100 };
}

export function areasAnotacaoValidas(valor: unknown) {
  return Array.isArray(valor) && valor.length <= 100 && valor.every((area) =>
    area && typeof area === "object" && ["x", "y", "largura", "altura"].every((chave) =>
      typeof area[chave] === "number" && Number.isFinite(area[chave]) && area[chave] >= 0 && area[chave] <= 1
    ) && area.largura > 0 && area.altura > 0 &&
    area.x + area.largura <= 1.001 && area.y + area.altura <= 1.001
  );
}

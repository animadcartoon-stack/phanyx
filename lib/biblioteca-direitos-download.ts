/** Recebe todas as licenças vigentes; uma licença existente restringe o acesso livre. */
export function podeBaixarPdfBiblioteca({
  configuracao,
  item,
  licencas,
}: {
  configuracao: { permitirDownload: boolean } | null;
  item: { permitirDownload: boolean; acessoLivre: boolean };
  licencas: Array<{ permitirVisualizacao: boolean; permitirDownload: boolean }>;
}) {
  if (!configuracao?.permitirDownload || !item.permitirDownload) return false;
  return licencas.length > 0
    ? licencas.some((licenca) => licenca.permitirVisualizacao && licenca.permitirDownload)
    : item.acessoLivre;
}

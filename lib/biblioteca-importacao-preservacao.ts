import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { OriginalImportacao } from "./biblioteca-importacao-marc-completa";

type Transacao = Prisma.TransactionClient;

export async function preservarOriginalImportacao(
  transacao: Transacao, instituicaoId: number, itemId: number,
  original: OriginalImportacao, loteId: string,
) {
  const identidade = createHash("sha256").update(JSON.stringify(original)).digest("hex");
  const atual = await transacao.bibliotecaItem.findFirst({
    where: { id: itemId, instituicaoId }, select: { registrosImportados: true },
  });
  const registros = Array.isArray(atual?.registrosImportados) ? atual.registrosImportados : [];
  if (registros.some(r => r && typeof r === "object" && !Array.isArray(r) && r.identidade === identidade)) return false;
  const novo = JSON.parse(JSON.stringify({ identidade, loteId, importadoEm: new Date().toISOString(), original })) as Prisma.InputJsonValue;
  await transacao.bibliotecaItem.update({ where: { id: itemId, instituicaoId }, data: {
    registrosImportados: [...registros, novo] as Prisma.InputJsonValue,
  } });
  return true;
}

export async function preservarImagensImportacao(
  transacao: Transacao, instituicaoId: number, itemId: number,
  imagens: { referencia: string; descricao: string; url: string | null; erro?: string }[],
) {
  const atual = await transacao.bibliotecaItem.findFirst({
    where: { id: itemId, instituicaoId }, select: { imagensImportadas: true },
  });
  const existentes = Array.isArray(atual?.imagensImportadas) ? atual.imagensImportadas : [];
  await transacao.bibliotecaItem.update({ where: { id: itemId, instituicaoId }, data: {
    imagensImportadas: JSON.parse(JSON.stringify([...existentes, ...imagens])) as Prisma.InputJsonValue,
  } });
}

export function camposCatalograficosImportados(dados: Record<string, string>) {
  const texto = (chave: string) => dados[chave]?.trim() || null;
  const lista = (chave: string) => (dados[chave] ?? "").split(/\s*\|\s*/).map(v => v.trim()).filter(Boolean);
  return {
    tituloAlternativo: texto("tituloAlternativo"), tituloUniforme: texto("tituloUniforme"),
    mencaoResponsabilidade: texto("mencaoResponsabilidade"),
    // The MARC 001 is scoped to the exporting system. Keep it in the original;
    // use it natively only after the importer has checked institutional uniqueness.
    sinopse: texto("sinopse"), descricao: texto("descricao"),
    regraCatalogacao: texto("regraCatalogacao"), fonteCatalogacao: texto("fonteCatalogacao"),
    idiomaCatalogacao: texto("idiomaCatalogacao"), idiomaOriginal: texto("idiomaOriginal"),
    localPublicacao: texto("localPublicacao"), serie: texto("serie"), numeroSerie: texto("numeroSerie"),
    detalhesFisicos: texto("detalhesFisicos"), dimensoes: texto("dimensoes"),
    materialAcompanhante: texto("materialAcompanhante"), tiposConteudoRda: lista("tiposConteudoRda"),
    tiposMidiaRda: lista("tiposMidiaRda"), tiposSuporteRda: lista("tiposSuporteRda"),
    notaGeral: texto("notaGeral"), notaBibliografia: texto("notaBibliografia"), notaConteudo: texto("notaConteudo"),
    classificacaoIndicativa: texto("classificacaoIndicativa"), observacoesInternas: texto("observacoesInternas"),
  };
}

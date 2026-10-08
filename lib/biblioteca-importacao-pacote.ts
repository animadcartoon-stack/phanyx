import JSZip from "jszip";
import { ErroArquivoImportacao } from "./biblioteca-importacao";

export async function abrirArquivoImportacao(buffer: Buffer, nomeArquivo: string) {
  if (!/\.zip$/i.test(nomeArquivo)) return { buffer, nomeArquivo, pacoteCapas: null as File | null };
  const zip = await JSZip.loadAsync(buffer);
  const entradas = Object.values(zip.files).filter(e => !e.dir && !/(^|\/)__MACOSX\//.test(e.name));
  if (entradas.length > 5000) throw new ErroArquivoImportacao("ZIP_MUITOS_ARQUIVOS", "O ZIP contém mais de 5.000 arquivos.", 413);
  const catalogos = entradas.filter(e => /\.(mrc|marc|xml|csv|xlsx?)$/i.test(e.name));
  const prioridade = (nome: string) => /\.(mrc|marc)$/i.test(nome) ? 0 : /\.xml$/i.test(nome) ? 1 : /\.xlsx?$/i.test(nome) ? 2 : 3;
  catalogos.sort((a, b) => prioridade(a.name) - prioridade(b.name));
  if (!catalogos.length) throw new ErroArquivoImportacao("ZIP_SEM_CATALOGO", "O ZIP não contém um catálogo MARC, MARCXML, CSV ou Excel.");
  const primeiro = catalogos[0];
  const escolhidos = prioridade(primeiro.name) === 0 ? catalogos.filter(e => prioridade(e.name) === 0) : [primeiro];
  let total = 0;
  const partes: Buffer[] = [];
  for (const entrada of escolhidos) {
    // JSZip exposes the declared uncompressed size before allocation.
    const tamanho = (entrada as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize;
    if (typeof tamanho === "number" && tamanho + total > 4 * 1024 * 1024)
      throw new ErroArquivoImportacao("ZIP_CATALOGO_MUITO_GRANDE", "O catálogo descompactado ultrapassa 4 MB.", 413);
    const parte = await entrada.async("nodebuffer");
    total += parte.length;
    if (total > 4 * 1024 * 1024) throw new ErroArquivoImportacao("ZIP_CATALOGO_MUITO_GRANDE", "O catálogo descompactado ultrapassa 4 MB.", 413);
    partes.push(parte);
  }
  return {
    buffer: Buffer.concat(partes), nomeArquivo: primeiro.name,
    pacoteCapas: new File([Uint8Array.from(buffer)], nomeArquivo, { type: "application/zip" }),
  };
}

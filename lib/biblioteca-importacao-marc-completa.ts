import type { CampoMarcImportacao, RegistroMarcImportacao } from "./biblioteca-importacao";

export type ReferenciaImagemImportacao = {
  referencia: string;
  descricao: string;
  capa: boolean;
};

// MARC has repeatable, local and system-specific fields. Keep the complete
// source alongside the native catalog fields instead of dropping unknown tags.
export type OriginalImportacao = {
  formato: string;
  arquivo: string;
  registro: number;
  conteudoBase64?: string;
  marc?: RegistroMarcImportacao;
  colunas?: string[];
  valores?: string[];
};

export const CAMPOS_AVANCADOS_IMPORTACAO = [
  ["tituloAlternativo", "OBRA"], ["tituloUniforme", "OBRA"],
  ["mencaoResponsabilidade", "OBRA"], ["numeroControleBibliografico", "OBRA"],
  ["sinopse", "OBRA"], ["descricao", "OBRA"],
  ["regraCatalogacao", "PUBLICACAO"], ["fonteCatalogacao", "PUBLICACAO"],
  ["idiomaCatalogacao", "PUBLICACAO"], ["idiomaOriginal", "PUBLICACAO"],
  ["localPublicacao", "PUBLICACAO"], ["dataPublicacao", "PUBLICACAO"],
  ["serie", "PUBLICACAO"], ["numeroSerie", "PUBLICACAO"],
  ["detalhesFisicos", "PUBLICACAO"], ["dimensoes", "PUBLICACAO"],
  ["materialAcompanhante", "PUBLICACAO"], ["tiposConteudoRda", "PUBLICACAO"],
  ["tiposMidiaRda", "PUBLICACAO"], ["tiposSuporteRda", "PUBLICACAO"],
  ["notaGeral", "OBRA"], ["notaBibliografia", "OBRA"], ["notaConteudo", "OBRA"],
  ["classificacaoIndicativa", "OBRA"], ["observacoesInternas", "OBRA"],
  ["edicaoClassificacao", "CLASSIFICACAO"],
  ["statusExemplar", "EXEMPLAR"], ["permiteEmprestimo", "EXEMPLAR"],
  ["unidadeSnapshot", "EXEMPLAR"],
  ["editor", "AUTORIA"], ["duracaoSegundos", "PUBLICACAO"],
] as const;

const limpar = (v: string) => v.trim().replace(/\s*[\/:;,]\s*$/, "");
const campos = (r: RegistroMarcImportacao, tag: string) => r.campos.filter(c => c.tag === tag);
const valores = (r: RegistroMarcImportacao, tag: string, codes: string) =>
  campos(r, tag).flatMap(c => c.subcampos.filter(s => codes.includes(s.codigo)).map(s => s.valor));
const primeiro = (r: RegistroMarcImportacao, tag: string, code: string) => valores(r, tag, code)[0] ?? "";
const controle = (r: RegistroMarcImportacao, tag: string) => campos(r, tag)[0]?.valorControle ?? "";
const juntar = (r: RegistroMarcImportacao, tags: string[], codes: string, separador = "\n") =>
  tags.flatMap(tag => campos(r, tag).map(c => c.subcampos.filter(s => codes.includes(s.codigo))
    .map(s => limpar(s.valor)).filter(Boolean).join(" "))).filter(Boolean).join(separador);

export function imagensRegistroMarc(r: RegistroMarcImportacao): ReferenciaImagemImportacao[] {
  const imagens: ReferenciaImagemImportacao[] = [];
  for (const c of campos(r, "856")) {
    const descricao = c.subcampos.filter(s => "3y".includes(s.codigo)).map(s => s.valor).join(" ");
    const formato = c.subcampos.filter(s => s.codigo === "q").map(s => s.valor).join(" ");
    const capa = /\b(capa|cover|thumbnail|miniatura)\b/i.test(descricao);
    const refs = c.subcampos.filter(s => s.codigo === "u").map(s => s.valor.trim());
    if (!refs.length) {
      const pasta = c.subcampos.find(s => s.codigo === "d")?.valor ?? "";
      refs.push(...c.subcampos.filter(s => s.codigo === "f").map(s => `${pasta.replace(/[\\/]?$/, "/")}${s.valor}`));
    }
    for (const referencia of refs) {
      if (referencia && (capa || /image\//i.test(formato) ||
          /\.(png|jpe?g|webp|gif)(?:[?#]|$)/i.test(referencia) || /^data:image\//i.test(referencia))) {
        imagens.push({ referencia, descricao, capa });
      }
    }
  }
  return imagens.filter((im, i, all) => all.findIndex(x => x.referencia === im.referencia) === i);
}

export function dadosMarcAvancados(r: RegistroMarcImportacao): Record<string, string> {
  const serieTag = campos(r, "490").length ? "490" : campos(r, "440").length ? "440" : "830";
  const imagem = imagensRegistroMarc(r).find(im => im.capa) ?? imagensRegistroMarc(r)[0];
  const dados: Record<string, string> = {
    tituloAlternativo: juntar(r, ["246"], "abnp", " | "),
    tituloUniforme: juntar(r, ["130", "240"], "adfklmnopr", " | "),
    mencaoResponsabilidade: valores(r, "245", "c").join(" | "),
    numeroControleBibliografico: controle(r, "001").trim(),
    sinopse: juntar(r, ["520"], "ab"),
    descricao: juntar(r, ["521"], "ab"),
    regraCatalogacao: valores(r, "040", "e").join(" | "),
    fonteCatalogacao: valores(r, "040", "ac").join(" | "),
    idiomaCatalogacao: primeiro(r, "040", "b"),
    idiomaOriginal: valores(r, "041", "h").join(" | "),
    localPublicacao: juntar(r, campos(r, "264").length ? ["264"] : ["260"], "a", " | "),
    serie: juntar(r, [serieTag], "ap", " | "),
    numeroSerie: valores(r, serieTag, "v").join(" | "),
    detalhesFisicos: juntar(r, ["300"], "b", " | "),
    dimensoes: juntar(r, ["300"], "c", " | "),
    materialAcompanhante: juntar(r, ["300"], "e", " | "),
    tiposConteudoRda: valores(r, "336", "a").map(limpar).join(" | "),
    tiposMidiaRda: valores(r, "337", "a").map(limpar).join(" | "),
    tiposSuporteRda: valores(r, "338", "a").map(limpar).join(" | "),
    notaGeral: juntar(r, ["500", "501", "502", "506", "508", "511", "518", "533", "534", "538", "540", "546", "550", "561", "563", "590"], "abcdefghijklmnopqrstuvwxyz"),
    notaBibliografia: juntar(r, ["504"], "ab"),
    notaConteudo: juntar(r, ["505"], "agrt"),
    classificacaoIndicativa: juntar(r, ["521"], "a", " | "),
    edicaoClassificacao: primeiro(r, "082", "2") || primeiro(r, "080", "2"),
    paisPublicacao: controle(r, "008").slice(15, 18).trim(),
    idioma: primeiro(r, "041", "a"),
    palavrasChave: juntar(r, ["600", "610", "611", "630", "648", "650", "651", "653", "655"], "abcdefghjklmnopqrstuvxyz", " | "),
    capaUrl: imagem?.referencia ?? "",
    arquivoCapa: imagem && !/^https?:|^data:/i.test(imagem.referencia) ? imagem.referencia : "",
  };
  const autorias: Record<string, string[]> = { autor: [], coautor: [], organizador: [], editor: [], tradutor: [], orientador: [], colaborador: [] };
  for (const c of r.campos.filter(c => /^(100|110|111|700|710|711)$/.test(c.tag))) {
    const nome = c.subcampos.filter(s => "abcdq".includes(s.codigo)).map(s => limpar(s.valor)).filter(Boolean).join(" ");
    if (!nome) continue;
    const papel = c.subcampos.filter(s => "e4".includes(s.codigo)).map(s => s.valor.toLowerCase()).join(" ");
    const chave = c.tag.startsWith("1") ? "autor" : /tradut|tradu[cç]|translat|traduct|\btrl\b/i.test(papel) ? "tradutor" :
      /organiz|\borg\b/i.test(papel) ? "organizador" : /editor|\bedt\b/i.test(papel) ? "editor" :
      /orientad|supervisor|advisor|\bths\b/i.test(papel) ? "orientador" :
      /colabor|contribut|ilustr|illustr|revis|\b(ill|ctb)\b/i.test(papel) ? "colaborador" : "coautor";
    autorias[chave].push(nome);
  }
  if (!autorias.autor.length && autorias.coautor.length) autorias.autor.push(autorias.coautor.shift()!);
  for (const [chave, nomes] of Object.entries(autorias)) if (nomes.length) dados[chave] = [...new Set(nomes)].join(" | ");
  const duracao = primeiro(r, "306", "a");
  if (/^\d{6}$/.test(duracao)) dados.duracaoSegundos = String(Number(duracao.slice(0, 2)) * 3600 + Number(duracao.slice(2, 4)) * 60 + Number(duracao.slice(4, 6)));
  const preenchidos = Object.fromEntries(Object.entries(dados).filter(([, v]) => v.trim()));
  for (const chave of Object.keys(autorias)) preenchidos[chave] = dados[chave] ?? "";
  return preenchidos;
}

function sub(c: CampoMarcImportacao, code: string) { return c.subcampos.find(s => s.codigo === code)?.valor.trim() ?? ""; }

export function exemplaresRegistroMarc(r: RegistroMarcImportacao): Record<string, string>[] {
  const koha = campos(r, "952").map(c => ({
    codigoBarras: sub(c, "p"), codigoInterno: sub(c, "9") || sub(c, "p"),
    numeroTombo: sub(c, "i"), unidadeSnapshot: sub(c, "b") || sub(c, "a"),
    localizacaoCompleta: [sub(c, "a"), sub(c, "b"), sub(c, "c"), sub(c, "o")].filter(Boolean).join(" / "),
    prateleira: sub(c, "c"), dataAquisicao: sub(c, "d"), fornecedor: sub(c, "e"),
    valorAquisicao: sub(c, "g"), observacoes: [sub(c, "x"), sub(c, "z")].filter(Boolean).join("\n"),
    permiteEmprestimo: Number(sub(c, "7") || 0) === 0 ? "true" : "false",
    statusExemplar: Number(sub(c, "0") || 0) !== 0 ? "BAIXADO" : Number(sub(c, "1") || 0) !== 0 ? "EXTRAVIADO" :
      Number(sub(c, "4") || 0) !== 0 ? "DANIFICADO" : Number(sub(c, "7") || 0) !== 0 || sub(c, "q") ? "INDISPONIVEL" : "DISPONIVEL",
  }));
  // Biblivre's documented 949$a is the accession number, not a barcode.
  const biblivre = campos(r, "949").flatMap(c => c.subcampos.filter(s => s.codigo === "a" && s.valor.trim())
    .map(s => ({ numeroTombo: s.valor.trim(), observacoes: juntar(r, ["500"], "a"),
      localizacaoCompleta: juntar(r, ["090"], "abcdef", " / ") })));
  if (koha.length || biblivre.length) {
    // Keep distinct holdings from either profile; matching accession numbers
    // represent one copy, not two fabricated copies.
    return [...koha, ...biblivre].filter((c, i, all) => !c.numeroTombo ||
      all.findIndex(x => x.numeroTombo === c.numeroTombo) === i);
  }
  // Standard location-only 852 does not prove the number of physical copies.
  return campos(r, "852").filter(c => sub(c, "p")).map(c => ({
    codigoInterno: sub(c, "p"), unidadeSnapshot: sub(c, "a"), prateleira: sub(c, "c"),
    localizacaoCompleta: c.subcampos.filter(s => "abcefhijklm".includes(s.codigo)).map(s => s.valor).join(" / "),
    observacoes: [sub(c, "x"), sub(c, "z")].filter(Boolean).join("\n"),
  }));
}

export function associarExemplaresMarc(registros: RegistroMarcImportacao[]) {
  const obras = registros.filter(r => campos(r, "245").length);
  const porControle = new Map(obras.map(r => [controle(r, "001").trim().replace(/^0+(?=\d)/, ""), r]));
  for (const r of registros.filter(r => !campos(r, "245").length)) {
    const vinculo = controle(r, "004").trim().replace(/^0+(?=\d)/, "");
    const obra = vinculo ? porControle.get(vinculo) : undefined;
    if (!obra) throw new Error(`O registro MARC ${controle(r, "001") || "sem título"} não possui uma obra correspondente. Inclua a exportação das obras e dos exemplares no mesmo ZIP.`);
    obra.exemplaresVinculados ??= [];
    obra.exemplaresVinculados.push(r);
  }
  return obras;
}

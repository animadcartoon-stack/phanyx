export type AreaAnotacaoLeitor = { x: number; y: number; largura: number; altura: number };
export type AnotacaoLeitor = {
  id: string; tipo: "MARCADOR" | "DESTAQUE" | "NOTA"; pagina: number;
  trecho: string | null; conteudo: string | null; cor: string; areas: AreaAnotacaoLeitor[];
  criadoEm?: string;
};

export function filtrarAnotacoesLeitor(anotacoes: AnotacaoLeitor[], busca: string) {
  const normalizar = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const termo = normalizar(busca);
  return termo ? anotacoes.filter(a => normalizar(`${a.pagina} ${a.trecho || ""} ${a.conteudo || ""}`).includes(termo)) : anotacoes;
}

export function anotacaoTemTrecho(a: AnotacaoLeitor) {
  return (a.tipo === "DESTAQUE" || a.tipo === "NOTA") && Array.isArray(a.areas) && a.areas.length > 0;
}

/** Respostas de proxy/limite da Vercel podem ser texto ou HTML, nao JSON. */
export async function lerRespostaPerfilJson(resposta: Response, mensagem: string): Promise<any> {
  let dados: any = null;
  try { dados = await resposta.json(); } catch { /* A falha HTTP ainda precisa de mensagem util. */ }
  if (!resposta.ok) {
    const detalhe = typeof dados?.error === "string" && dados.error.trim() ? dados.error : null;
    if (resposta.status === 413) {
      throw new Error("A fotografia excede o limite de envio da plataforma. Utilize uma imagem menor.");
    }
    throw new Error(detalhe || `${mensagem} (HTTP ${resposta.status}). Tente novamente ou consulte o suporte.`);
  }
  if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
    throw new Error(`${mensagem}: resposta invalida do servidor (HTTP ${resposta.status}).`);
  }
  return dados;
}

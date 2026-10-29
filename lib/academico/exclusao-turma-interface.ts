export class ErroExclusaoTurma extends Error {
  constructor(public codigo: "RECUSADA" | "NAO_CONFIRMADA", mensagem = "") { super(mensagem); }
}

// Não basta um HTTP 200: a API precisa confirmar o ID e a leitura deve retornar 404.
export async function excluirTurmaConferida(id: number, consultar: typeof fetch = fetch) {
  if (!Number.isSafeInteger(id) || id <= 0) throw new ErroExclusaoTurma("NAO_CONFIRMADA");
  const resposta = await consultar(`/api/turma/${id}`, { method: "DELETE", credentials: "include", cache: "no-store" });
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) throw new ErroExclusaoTurma("RECUSADA", typeof dados?.error === "string" ? dados.error : "");
  if (dados?.ok !== true || dados?.id !== id) throw new ErroExclusaoTurma("NAO_CONFIRMADA");
  const conferir = await consultar(`/api/turma/${id}`, { credentials: "include", cache: "no-store" });
  if (conferir.status !== 404) throw new ErroExclusaoTurma("NAO_CONFIRMADA");
}

export function mensagemExclusaoNaoConfirmada(locale: string, nome: string) {
  const textos: Record<string, string> = {
    "pt-BR": `Não foi possível confirmar a exclusão da turma “${nome}”. Atualize a lista e confira esse cadastro antes de tentar novamente.`,
    "pt-PT": `Não foi possível confirmar a eliminação da turma «${nome}». Atualize a lista e confira este registo antes de tentar novamente.`,
    "en-US": `Could not confirm deletion of class “${nome}”. Refresh the list and check this record before trying again.`,
    "es-ES": `No se pudo confirmar la eliminación de la clase «${nome}». Actualice la lista y revise este registro antes de volver a intentarlo.`,
    "fr-FR": `La suppression de la classe « ${nome} » n’a pas pu être confirmée. Actualisez la liste et vérifiez cette fiche avant de réessayer.`,
  };
  return textos[locale] || textos["en-US"];
}

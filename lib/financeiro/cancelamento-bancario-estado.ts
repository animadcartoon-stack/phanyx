function objeto(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? valor as Record<string, unknown> : {};
}
export function estadoCancelamentoBancario(metadata: unknown): Record<string, unknown> & { estado: string } {
  const dados = objeto(objeto(metadata).cancelamentoBancario);
  return { ...dados, estado: String(dados.estado || "") };
}
export function cancelamentoBancarioPendente(metadata: unknown) {
  return ["PROCESSANDO", "PENDENTE", "REVISAO"].includes(estadoCancelamentoBancario(metadata).estado);
}

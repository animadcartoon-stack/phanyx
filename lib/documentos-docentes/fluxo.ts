export function professorPodeEditarDocumentoDocente(status: string): boolean {
  return ["RASCUNHO", "DEVOLVIDO", "AGUARDANDO_PROFESSOR"].includes(status);
}

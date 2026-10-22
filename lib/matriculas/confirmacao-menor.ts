export function calcularIdade(
  dataNascimento: Date,
  dataReferencia = new Date(),
) {
  let idade = dataReferencia.getUTCFullYear() - dataNascimento.getUTCFullYear();

  const mesReferencia = dataReferencia.getUTCMonth();

  const mesNascimento = dataNascimento.getUTCMonth();

  const diaReferencia = dataReferencia.getUTCDate();

  const diaNascimento = dataNascimento.getUTCDate();

  const aindaNaoFezAniversario =
    mesReferencia < mesNascimento ||
    (mesReferencia === mesNascimento && diaReferencia < diaNascimento);

  if (aindaNaoFezAniversario) {
    idade -= 1;
  }

  return idade;
}

export function verificarDadosResponsavel(aluno: {
  nomeResponsavel?: string | null;
  cpfResponsavel?: string | null;
  telefoneResponsavel?: string | null;
  emailResponsavel?: string | null;
  parentescoResponsavel?: string | null;
}) {
  const pendentes: string[] = [];

  const nomeResponsavel = String(aluno.nomeResponsavel || "").trim();

  const cpfResponsavel = String(aluno.cpfResponsavel || "").replace(/\D/g, "");

  const telefoneResponsavel = String(aluno.telefoneResponsavel || "").replace(
    /\D/g,
    "",
  );

  const emailResponsavel = String(aluno.emailResponsavel || "")
    .trim()
    .toLowerCase();

  const parentescoResponsavel = String(
    aluno.parentescoResponsavel || "",
  ).trim();

  if (!nomeResponsavel) {
    pendentes.push("nome do responsável");
  }

  if (cpfResponsavel.length !== 11) {
    pendentes.push("CPF do responsável");
  }

  if (telefoneResponsavel.length < 10) {
    pendentes.push("telefone do responsável");
  }

  if (!emailResponsavel || !emailResponsavel.includes("@")) {
    pendentes.push("e-mail do responsável");
  }

  if (!parentescoResponsavel) {
    pendentes.push("parentesco do responsável");
  }

  return pendentes;
}

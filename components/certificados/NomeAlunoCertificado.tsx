"use client";
import { memo } from "react";
import TextoVariavelCertificado from "./TextoVariavelCertificado";
function NomeAlunoCertificado({ nome, abreviar = false }: { nome: string; abreviar?: boolean }) {
  return <TextoVariavelCertificado campo={{ tipo: "NOME_ALUNO", dadosJson: { abreviarVariavel: abreviar } }} texto={nome} />;
}
export default memo(NomeAlunoCertificado);

"use client";

import {
  useParams,
  useSearchParams,
} from "next/navigation";

import CursoTurmaTransferencia from "./CursoTurmaTransferencia";
import ReatribuicaoAlunoAnalise from "@/components/admin/ReatribuicaoAlunoAnalise";
import DestinoTransferenciaLegacy from "./DestinoTransferenciaLegacy";

export default function DestinoTransferenciaPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const searchParams =
    useSearchParams();

  const tipo =
    searchParams.get(
      "tipo"
    );

  const matriculaId =
    Number(params.id);

  if (
    tipo ===
    "CURSO_TURMA"
  ) {
    return (
      <CursoTurmaTransferencia
        matriculaId={
          matriculaId
        }
      />
    );
  }

  if (tipo === "REATRIBUICAO_ALUNO") {
    return <ReatribuicaoAlunoAnalise matriculaId={matriculaId} />;
  }

  return (
    <DestinoTransferenciaLegacy />
  );
}
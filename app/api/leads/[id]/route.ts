import { NextResponse } from "next/server";

function responderMetodoNaoPermitido() {
  return NextResponse.json(
    {
      error:
        "Esta rota pública não permite alterar ou excluir leads.",
    },
    {
      status: 405,
    }
  );
}

/*
 * A captação pública acontece somente por:
 * POST /api/leads
 *
 * Consulta, edição e exclusão são realizadas pelas rotas
 * autenticadas em /api/admin/leads.
 */
export async function PATCH() {
  return responderMetodoNaoPermitido();
}

export async function DELETE() {
  return responderMetodoNaoPermitido();
}
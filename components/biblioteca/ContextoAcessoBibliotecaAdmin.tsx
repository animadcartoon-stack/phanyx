"use client";

import { createContext } from "react";

export type BibliotecaAcessoMenu = {
  disponivel?: boolean;
  operador?: {
    id: number;
    ativo: boolean;
    podeCatalogar: boolean;
    podePublicar: boolean;
    podeArquivar: boolean;
    podeGerenciarEmprestimo: boolean;
    podeGerenciarReserva: boolean;
    podeGerenciarColecao: boolean;
    podeGerenciarLicenca: boolean;
    podeGerenciarOperador: boolean;
    podeVisualizarRelatorio: boolean;
    podeGerenciarConfiguracao: boolean;
  } | null;
};

// O layout comunica o resultado confirmado pela API ao menu do Admin.
export const AtualizarAcessoBibliotecaContext = createContext<
  ((acesso: BibliotecaAcessoMenu | null) => void) | null
>(null);

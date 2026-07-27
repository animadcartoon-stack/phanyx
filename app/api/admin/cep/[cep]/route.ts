import { NextResponse } from "next/server";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";

type RespostaViaCep = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { cep: string } }
) {
  const user = await getUserFromToken();

  if (!user) {
    return NextResponse.json(
      { error: "Não autenticado" },
      { status: 401 }
    );
  }

  if (!isAdminLike(user.role)) {
    return NextResponse.json(
      { error: "Sem permissão para consultar CEP" },
      { status: 403 }
    );
  }

  const cep = String(params.cep || "").replace(/\D/g, "");

  if (!/^\d{8}$/.test(cep)) {
    return NextResponse.json(
      { error: "Informe um CEP válido com 8 números" },
      { status: 400 }
    );
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 8000);

  try {
    const resposta = await fetch(
      `https://viacep.com.br/ws/${cep}/json/`,
      {
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!resposta.ok) {
      return NextResponse.json(
        {
          error:
            "O serviço de consulta de CEP não respondeu corretamente.",
        },
        { status: 502 }
      );
    }

    const dados =
      (await resposta.json()) as RespostaViaCep;

    if (dados.erro === true) {
      return NextResponse.json(
        { error: "CEP não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      cep: dados.cep || cep,
      endereco: dados.logradouro || "",
      complemento: dados.complemento || "",
      bairro: dados.bairro || "",
      cidade: dados.localidade || "",
      estado: dados.uf || "",
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      return NextResponse.json(
        {
          error:
            "A consulta do CEP demorou demais. Tente novamente.",
        },
        { status: 504 }
      );
    }

    console.error("Erro ao consultar CEP:", error);

    return NextResponse.json(
      {
        error:
          "Não foi possível consultar o CEP neste momento.",
      },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
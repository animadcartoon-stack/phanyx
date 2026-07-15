import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContextoRota = {
  params: {
    cep: string;
  };
};

type EnderecoCep = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  latitude: number | null;
  longitude: number | null;
  fonte: "BRASILAPI" | "VIACEP";
};

function limparCep(valor: unknown) {
  return String(valor || "").replace(/\D/g, "");
}

function textoSeguro(
  valor: unknown,
  tamanhoMaximo = 200
) {
  return String(valor || "")
    .trim()
    .slice(0, tamanhoMaximo);
}

function numeroValido(
  valor: unknown,
  minimo: number,
  maximo: number
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  if (
    !Number.isFinite(numero) ||
    numero < minimo ||
    numero > maximo
  ) {
    return null;
  }

  return numero;
}

function formatarCep(cep: string) {
  return cep.replace(
    /^(\d{5})(\d{3})$/,
    "$1-$2"
  );
}

async function buscarBrasilApi(
  cep: string
): Promise<EnderecoCep | null> {
  const controlador =
    new AbortController();

  const timer = setTimeout(() => {
    controlador.abort();
  }, 8000);

  try {
    const resposta = await fetch(
      `https://brasilapi.com.br/api/cep/v2/${encodeURIComponent(
        cep
      )}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controlador.signal,
        cache: "no-store",
      }
    );

    if (!resposta.ok) {
      return null;
    }

    const dados = await resposta.json();

    const latitude = numeroValido(
      dados?.location?.coordinates?.latitude,
      -90,
      90
    );

    const longitude = numeroValido(
      dados?.location?.coordinates?.longitude,
      -180,
      180
    );

    return {
      cep: formatarCep(cep),

      logradouro: textoSeguro(
        dados?.street,
        200
      ),

      complemento: "",

      bairro: textoSeguro(
        dados?.neighborhood,
        120
      ),

      cidade: textoSeguro(
        dados?.city,
        120
      ),

      estado: textoSeguro(
        dados?.state,
        2
      ).toUpperCase(),

      latitude,
      longitude,

      fonte: "BRASILAPI",
    };
  } catch (error) {
    console.warn(
      "Falha ao consultar CEP na BrasilAPI:",
      error
    );

    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function buscarViaCep(
  cep: string
): Promise<EnderecoCep | null> {
  const controlador =
    new AbortController();

  const timer = setTimeout(() => {
    controlador.abort();
  }, 8000);

  try {
    const resposta = await fetch(
      `https://viacep.com.br/ws/${encodeURIComponent(
        cep
      )}/json/`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controlador.signal,
        cache: "no-store",
      }
    );

    if (!resposta.ok) {
      return null;
    }

    const dados = await resposta.json();

    if (dados?.erro === true) {
      return null;
    }

    return {
      cep: textoSeguro(
        dados?.cep || formatarCep(cep),
        9
      ),

      logradouro: textoSeguro(
        dados?.logradouro,
        200
      ),

      complemento: textoSeguro(
        dados?.complemento,
        120
      ),

      bairro: textoSeguro(
        dados?.bairro,
        120
      ),

      cidade: textoSeguro(
        dados?.localidade,
        120
      ),

      estado: textoSeguro(
        dados?.uf,
        2
      ).toUpperCase(),

      latitude: null,
      longitude: null,

      fonte: "VIACEP",
    };
  } catch (error) {
    console.warn(
      "Falha ao consultar CEP no ViaCEP:",
      error
    );

    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(
  _req: NextRequest,
  contexto: ContextoRota
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error: "Usuário não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    const podeGerenciar =
      await usuarioPossuiPermissao(
        user,
        "rh.ponto.mobile.locais.gerenciar"
      );

    if (!podeGerenciar) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para consultar endereços dos locais do Ponto Mobile.",
        },
        {
          status: 403,
        }
      );
    }

    const cep = limparCep(
      contexto.params.cep
    );

    if (!/^\d{8}$/.test(cep)) {
      return NextResponse.json(
        {
          error:
            "Informe um CEP válido com 8 números.",
        },
        {
          status: 400,
        }
      );
    }

    let endereco =
      await buscarBrasilApi(cep);

    if (!endereco) {
      endereco = await buscarViaCep(cep);
    }

    if (!endereco) {
      return NextResponse.json(
        {
          error:
            "CEP não encontrado. Confira os números informados.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        sucesso: true,

        endereco,

        coordenadasDisponiveis:
          endereco.latitude !== null &&
          endereco.longitude !== null,

        aviso:
          endereco.latitude !== null &&
          endereco.longitude !== null
            ? "Endereço localizado. Confira os dados antes de salvar."
            : "O endereço foi encontrado, mas não foi possível obter as coordenadas. Use sua localização atual para confirmar o local.",
      },
      {
        status: 200,

        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro ao consultar CEP do local do Ponto Mobile:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível consultar o CEP neste momento.",
      },
      {
        status: 500,
      }
    );
  }
}
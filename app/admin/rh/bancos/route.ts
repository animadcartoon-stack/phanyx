import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type BancoBrasilApi = {
  ispb?: string | null;
  name?: string | null;
  code?: number | null;
  fullName?: string | null;
};

type BancoPHANYX = {
  codigo: string | null;
  ispb: string;
  nome: string;
  nomeCompleto: string;
};

const bancosFallback: BancoPHANYX[] = [
  {
    codigo: "001",
    ispb: "00000000",
    nome: "Banco do Brasil",
    nomeCompleto: "Banco do Brasil S.A.",
  },
  {
    codigo: "033",
    ispb: "90400888",
    nome: "Santander",
    nomeCompleto: "Banco Santander (Brasil) S.A.",
  },
  {
    codigo: "041",
    ispb: "92702067",
    nome: "Banrisul",
    nomeCompleto: "Banco do Estado do Rio Grande do Sul S.A.",
  },
  {
    codigo: "077",
    ispb: "00416968",
    nome: "Banco Inter",
    nomeCompleto: "Banco Inter S.A.",
  },
  {
    codigo: "104",
    ispb: "00360305",
    nome: "Caixa Econômica Federal",
    nomeCompleto: "Caixa Econômica Federal",
  },
  {
    codigo: "208",
    ispb: "30306294",
    nome: "BTG Pactual",
    nomeCompleto: "Banco BTG Pactual S.A.",
  },
  {
    codigo: "212",
    ispb: "92874270",
    nome: "Banco Original",
    nomeCompleto: "Banco Original S.A.",
  },
  {
    codigo: "237",
    ispb: "60746948",
    nome: "Bradesco",
    nomeCompleto: "Banco Bradesco S.A.",
  },
  {
    codigo: "260",
    ispb: "18236120",
    nome: "Nubank",
    nomeCompleto: "Nu Pagamentos S.A.",
  },
  {
    codigo: "290",
    ispb: "08561701",
    nome: "PagBank",
    nomeCompleto: "PagSeguro Internet Instituição de Pagamento S.A.",
  },
  {
    codigo: "323",
    ispb: "10573521",
    nome: "Mercado Pago",
    nomeCompleto: "Mercado Pago Instituição de Pagamento Ltda.",
  },
  {
    codigo: "336",
    ispb: "31872495",
    nome: "C6 Bank",
    nomeCompleto: "Banco C6 S.A.",
  },
  {
    codigo: "341",
    ispb: "60701190",
    nome: "Itaú",
    nomeCompleto: "Itaú Unibanco S.A.",
  },
  {
    codigo: "380",
    ispb: "22896431",
    nome: "PicPay",
    nomeCompleto: "PicPay Instituição de Pagamento S.A.",
  },
  {
    codigo: "422",
    ispb: "58160789",
    nome: "Banco Safra",
    nomeCompleto: "Banco Safra S.A.",
  },
  {
    codigo: "623",
    ispb: "59285411",
    nome: "Banco Pan",
    nomeCompleto: "Banco Pan S.A.",
  },
  {
    codigo: "735",
    ispb: "03152156",
    nome: "Banco Neon",
    nomeCompleto: "Banco Neon S.A.",
  },
  {
    codigo: "748",
    ispb: "01181521",
    nome: "Sicredi",
    nomeCompleto: "Banco Cooperativo Sicredi S.A.",
  },
  {
    codigo: "756",
    ispb: "02038232",
    nome: "Sicoob",
    nomeCompleto: "Banco Cooperativo Sicoob S.A.",
  },
];

function limparTexto(valor: unknown) {
  return String(valor || "").trim();
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
        },
        {
          status: 401,
        },
      );
    }

    try {
      const resposta = await fetch(
        "https://brasilapi.com.br/api/banks/v1",
        {
          headers: {
            Accept: "application/json",
          },

          next: {
            revalidate: 86_400,
          },
        },
      );

      if (!resposta.ok) {
        throw new Error("Serviço bancário indisponível.");
      }

      const resultado = (await resposta.json()) as BancoBrasilApi[];

      const bancos = resultado
        .map((banco): BancoPHANYX | null => {
          const codigo =
            banco.code === null || banco.code === undefined
              ? null
              : String(banco.code).padStart(3, "0");

          const ispb = limparTexto(banco.ispb);
          const nome = limparTexto(banco.name);
          const nomeCompleto = limparTexto(banco.fullName) || nome;

          if (!nome && !nomeCompleto) {
            return null;
          }

          return {
            codigo,
            ispb,
            nome: nome || nomeCompleto,
            nomeCompleto,
          };
        })
        .filter((banco): banco is BancoPHANYX => banco !== null)
        .filter(
          (banco, indice, lista) =>
            lista.findIndex(
              (item) =>
                item.codigo === banco.codigo &&
                item.ispb === banco.ispb &&
                item.nomeCompleto === banco.nomeCompleto,
            ) === indice,
        )
        .sort((a, b) => {
          if (a.codigo && b.codigo) {
            return a.codigo.localeCompare(b.codigo, "pt-BR");
          }

          if (a.codigo) return -1;
          if (b.codigo) return 1;

          return a.nomeCompleto.localeCompare(b.nomeCompleto, "pt-BR");
        });

      return NextResponse.json({
        bancos,
        origem: "catalogo_atualizado",
      });
    } catch (error) {
      console.error(
        "Não foi possível atualizar a lista completa de bancos:",
        error,
      );

      return NextResponse.json({
        bancos: bancosFallback,
        origem: "catalogo_reserva",
      });
    }
  } catch (error: any) {
    console.error("Erro ao consultar bancos:", error);

    return NextResponse.json(
      {
        error: error?.message || "Erro ao consultar os bancos.",
      },
      {
        status: 500,
      },
    );
  }
}
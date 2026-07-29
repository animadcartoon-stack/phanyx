import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, PDFFont, PDFImage, StandardFonts, rgb } from "pdf-lib";
import {
  FormaPagamentoHoleriteRH,
  StatusPagamentoHoleriteRH,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { get } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function moeda(valor: unknown) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function texto(valor: unknown) {
  return valor === null || valor === undefined ? "" : String(valor);
}

function dataHoraBR(valor: unknown) {
  if (!valor) return "-";

  return new Date(String(valor)).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function limparNomeArquivo(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function mascararCpf(cpf?: string | null) {
  const numeros = String(cpf || "").replace(/\D/g, "");

  if (numeros.length !== 11) {
    return cpf || "Não informado";
  }

  return `${numeros.slice(0, 3)}.${numeros.slice(
    3,
    6,
  )}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
}

function nomeFormaPagamento(forma: FormaPagamentoHoleriteRH) {
  const nomes: Record<FormaPagamentoHoleriteRH, string> = {
    FOLHA_BANCARIA: "Folha bancária",
    PIX: "PIX",
    TRANSFERENCIA: "Transferência bancária",
    CONTA_SALARIO: "Conta-salário",
    DINHEIRO: "Dinheiro",
    CHEQUE: "Cheque",
    OUTRO: "Outro",
  };

  return nomes[forma] || forma;
}

function nomeStatusPagamento(status: StatusPagamentoHoleriteRH) {
  const nomes: Record<StatusPagamentoHoleriteRH, string> = {
    REGISTRADO: "Pagamento registrado - assinatura pendente",

    CONFIRMADO_FUNCIONARIO: "Recebimento confirmado pelo funcionário",

    CONTESTADO: "Recebimento contestado pelo funcionário",

    CANCELADO: "Registro cancelado",

    SUBSTITUIDO: "Registro substituído por nova versão",
  };

  return nomes[status] || status;
}

function limparTextoPdf(valor: unknown) {
  return texto(valor)
    .replace(/[^\x20-\x7EÀ-ÿ]/g, "")
    .trim();
}

function quebrarTexto(
  valor: string,
  fonte: PDFFont,
  tamanho: number,
  larguraMaxima: number,
) {
  const palavras = limparTextoPdf(valor).split(/\s+/);

  const linhas: string[] = [];
  let linhaAtual = "";

  for (const palavra of palavras) {
    const tentativa = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;

    if (fonte.widthOfTextAtSize(tentativa, tamanho) <= larguraMaxima) {
      linhaAtual = tentativa;
    } else {
      if (linhaAtual) {
        linhas.push(linhaAtual);
      }

      linhaAtual = palavra;
    }
  }

  if (linhaAtual) {
    linhas.push(linhaAtual);
  }

  return linhas;
}

async function carregarLogo(
  pdfDoc: PDFDocument,
  logoUrl?: string | null,
  origem?: string,
): Promise<PDFImage | null> {
  if (!logoUrl) return null;

  const urlResolvida =
    /^https?:\/\//i.test(logoUrl)
      ? logoUrl
      : origem
        ? new URL(logoUrl, origem).toString()
        : logoUrl;

  async function incorporarImagem(
    bytes: Uint8Array,
  ): Promise<PDFImage | null> {
    const ehPng =
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47;

    const ehJpeg =
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff;

    if (ehPng) {
      return pdfDoc.embedPng(bytes);
    }

    if (ehJpeg) {
      return pdfDoc.embedJpg(bytes);
    }

    return null;
  }

  try {
    const resposta = await fetch(urlResolvida, {
      cache: "no-store",
    });

    if (resposta.ok) {
      const bytes = new Uint8Array(
        await resposta.arrayBuffer(),
      );

      const imagem = await incorporarImagem(bytes);

      if (imagem) {
        return imagem;
      }
    }
  } catch (error) {
    console.error(
      "Não foi possível carregar a logo por URL pública:",
      error,
    );
  }

  const tokens = [
    process.env.BLOB_READ_WRITE_TOKEN?.trim(),
    process.env.RH_PONTO_READ_WRITE_TOKEN?.trim(),
  ].filter(
    (token): token is string =>
      Boolean(token),
  );

  for (const token of tokens) {
    try {
      const resultado = await get(urlResolvida, {
        access: "private",
        token,
        useCache: false,
      });

      if (
        resultado?.statusCode === 200 &&
        resultado.stream
      ) {
        const bytes = new Uint8Array(
          await new Response(
            resultado.stream,
          ).arrayBuffer(),
        );

        const imagem =
          await incorporarImagem(bytes);

        if (imagem) {
          return imagem;
        }
      }
    } catch {
      // Tenta o próximo token configurado.
    }
  }

  console.error(
    "Não foi possível carregar a logo institucional:",
    urlResolvida,
  );

  return null;
}

async function carregarAssinaturaPrivada(
  pdfDoc: PDFDocument,
  assinaturaUrl?: string | null,
): Promise<PDFImage | null> {
  if (!assinaturaUrl) return null;

  const token = process.env.RH_PONTO_READ_WRITE_TOKEN?.trim();

  if (!token) {
    console.error(
      "RH_PONTO_READ_WRITE_TOKEN não configurado para leitura da assinatura.",
    );

    return null;
  }

  try {
    const resultado = await get(assinaturaUrl, {
      access: "private",
      token,
      useCache: false,
    });

    if (!resultado || resultado.statusCode !== 200 || !resultado.stream) {
      return null;
    }

    const bytes = new Uint8Array(
      await new Response(resultado.stream).arrayBuffer(),
    );

    const ehPng =
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a;

    if (!ehPng) {
      return null;
    }

    return await pdfDoc.embedPng(bytes);
  } catch (error) {
    console.error("Não foi possível carregar a assinatura privada:", error);

    return null;
  }
}

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
    };
  },
) {
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

    const holeriteId = Number(params.id);

    if (!Number.isInteger(holeriteId) || holeriteId <= 0) {
      return NextResponse.json(
        {
          error: "Informe um holerite válido.",
        },
        {
          status: 400,
        },
      );
    }

    const holerite = await prisma.holeriteRH.findFirst({
      where: {
        id: holeriteId,
        instituicaoId: Number(user.instituicaoId),
      },

      include: {
        funcionario: {
          include: {
            departamento: true,
          },
        },

        instituicao: {
          include: {
            configuracaoInstituicao: true,
          },
        },

        eventos: {
          orderBy: {
            id: "asc",
          },
        },

        pagamentos: {
          where: {
            status: {
              notIn: [
                StatusPagamentoHoleriteRH.CANCELADO,
                StatusPagamentoHoleriteRH.SUBSTITUIDO,
              ],
            },
          },

          orderBy: {
            registradoEm: "desc",
          },

          take: 1,

          include: {
            registradoPor: {
              select: {
                id: true,
                nome: true,
              },
            },

            confirmadoPorUser: {
              select: {
                id: true,
                nome: true,
              },
            },
            assinadoRhPor: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!holerite) {
      return NextResponse.json(
        {
          error: "Holerite não encontrado.",
        },
        {
          status: 404,
        },
      );
    }

    const pagamento = holerite.pagamentos[0];

    if (!pagamento) {
      return NextResponse.json(
        {
          error:
            "Este holerite ainda não possui um registro de pagamento para gerar o recibo.",
        },
        {
          status: 409,
        },
      );
    }

    const configuracao = holerite.instituicao.configuracaoInstituicao;

    const nomeInstituicao =
      configuracao?.razaoSocial ||
      configuracao?.nomeFantasia ||
      holerite.instituicao.nome ||
      "Instituição";

    const nomeFantasia = configuracao?.nomeFantasia || nomeInstituicao;

    const enderecoInstituicao = [
      configuracao?.endereco,
      configuracao?.numero,
      configuracao?.cidade,
      configuracao?.estado,
    ]
      .filter(Boolean)
      .join(" - ");

    const competencia = `${String(holerite.competenciaMes).padStart(2, "0")}/${holerite.competenciaAno
      }`;

    const pdfDoc = await PDFDocument.create();

    pdfDoc.setTitle(`Recibo de pagamento - ${holerite.funcionario.nome}`);

    pdfDoc.setAuthor(nomeInstituicao);
    pdfDoc.setCreator("PHANYX");
    pdfDoc.setProducer("PHANYX");
    pdfDoc.setSubject("Recibo de pagamento de holerite");

    const pagina = pdfDoc.addPage([595.28, 841.89]);

    const fonteNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const fonteBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const logo = await carregarLogo(
      pdfDoc,
      configuracao?.logoUrl,
      _req.nextUrl.origin,
    );

    const assinaturaFuncionario = await carregarAssinaturaPrivada(
      pdfDoc,
      pagamento.assinaturaImagemUrl,
    );

    const assinaturaRh = await carregarAssinaturaPrivada(
      pdfDoc,
      pagamento.assinaturaRhImagemUrl,
    );

    const assinaturaConfirmada =
      pagamento.status === StatusPagamentoHoleriteRH.CONFIRMADO_FUNCIONARIO &&
      Boolean(pagamento.confirmadoPeloFuncionarioEm && assinaturaFuncionario);

    const assinaturaRhConfirmada = Boolean(
      pagamento.assinadoRhPorId &&
      pagamento.assinadoRhEm,
    );

    const nomeAssinanteRh =
      pagamento.assinadoRhNomeSnapshot ||
      pagamento.assinadoRhPor?.nome ||
      "Representante autorizado do RH";

    const { width, height } = pagina.getSize();

    function escrever(
      valor: unknown,
      x: number,
      y: number,
      tamanho = 8,
      negrito = false,
      larguraMaxima?: number,
    ) {
      let conteudo = limparTextoPdf(valor);

      const fonte = negrito ? fonteBold : fonteNormal;

      if (larguraMaxima) {
        while (
          conteudo.length > 0 &&
          fonte.widthOfTextAtSize(conteudo, tamanho) > larguraMaxima
        ) {
          conteudo = conteudo.slice(0, -1);
        }
      }

      pagina.drawText(conteudo, {
        x,
        y,
        size: tamanho,
        font: fonte,
        color: rgb(0.08, 0.11, 0.17),
      });
    }

    function escreverDireita(
      valor: unknown,
      direitaX: number,
      y: number,
      tamanho = 8,
      negrito = false,
    ) {
      const conteudo = limparTextoPdf(valor);

      const fonte = negrito ? fonteBold : fonteNormal;

      const largura = fonte.widthOfTextAtSize(conteudo, tamanho);

      escrever(conteudo, direitaX - largura, y, tamanho, negrito);
    }

    function escreverCentro(
      valor: unknown,
      centroX: number,
      y: number,
      tamanho = 8,
      negrito = false,
    ) {
      const conteudo = limparTextoPdf(valor);

      const fonte = negrito ? fonteBold : fonteNormal;

      const largura = fonte.widthOfTextAtSize(conteudo, tamanho);

      escrever(conteudo, centroX - largura / 2, y, tamanho, negrito);
    }

    function linha(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      espessura = 0.7,
    ) {
      pagina.drawLine({
        start: {
          x: x1,
          y: y1,
        },
        end: {
          x: x2,
          y: y2,
        },
        thickness: espessura,
        color: rgb(0.25, 0.3, 0.38),
      });
    }

    function retangulo(x: number, y: number, largura: number, altura: number) {
      pagina.drawRectangle({
        x,
        y,
        width: largura,
        height: altura,
        borderWidth: 0.8,
        borderColor: rgb(0.55, 0.6, 0.68),
      });
    }

    function desenharLogo(
      x: number,
      y: number,
      larguraMaxima: number,
      alturaMaxima: number,
    ) {
      if (!logo) return;

      const escala = Math.min(
        larguraMaxima / logo.width,
        alturaMaxima / logo.height,
      );

      const largura = logo.width * escala;
      const altura = logo.height * escala;

      pagina.drawImage(logo, {
        x: x + (larguraMaxima - largura) / 2,

        y: y + (alturaMaxima - altura) / 2,

        width: largura,
        height: altura,
      });
    }

    function desenharAssinaturaFuncionario(
      x: number,
      y: number,
      larguraMaxima: number,
      alturaMaxima: number,
    ) {
      if (!assinaturaFuncionario) return;

      const escala = Math.min(
        larguraMaxima / assinaturaFuncionario.width,

        alturaMaxima / assinaturaFuncionario.height,
      );

      const largura = assinaturaFuncionario.width * escala;

      const altura = assinaturaFuncionario.height * escala;

      pagina.drawImage(assinaturaFuncionario, {
        x: x + (larguraMaxima - largura) / 2,

        y: y + (alturaMaxima - altura) / 2,

        width: largura,
        height: altura,
      });
    }

    function desenharVia(topo: number, base: number, nomeVia: string) {
      const margem = 28;
      const largura = width - margem * 2;
      const altura = topo - base;

      retangulo(margem, base, largura, altura);

      desenharLogo(margem + 10, topo - 61, 52, 48);

      const inicioCabecalhoX = margem + 72;

      escrever(
        nomeInstituicao.toUpperCase(),
        inicioCabecalhoX,
        topo - 20,
        10,
        true,
        300,
      );

      if (nomeFantasia && nomeFantasia !== nomeInstituicao) {
        escrever(nomeFantasia, inicioCabecalhoX, topo - 33, 7, false, 300);
      }

      escrever(
        configuracao?.cnpj
          ? `CNPJ: ${configuracao.cnpj}`
          : "CNPJ não informado",
        inicioCabecalhoX,
        topo - 46,
        7,
      );

      escrever(
        enderecoInstituicao,
        inicioCabecalhoX,
        topo - 57,
        6.5,
        false,
        320,
      );

      escreverDireita(nomeVia, margem + largura - 10, topo - 20, 7, true);

      escreverDireita(
        `Recibo: ${pagamento.reciboNumero}`,
        margem + largura - 10,
        topo - 34,
        6.5,
      );

      escreverCentro(
        "RECIBO DE PAGAMENTO DE HOLERITE",
        width / 2,
        topo - 78,
        11,
        true,
      );

      linha(margem, topo - 88, margem + largura, topo - 88);

      const coluna2 = margem + 282;
      let y = topo - 105;

      escrever("Funcionário:", margem + 12, y, 7, true);

      escrever(holerite.funcionario.nome, margem + 78, y, 8, true, 195);

      escrever("CPF:", coluna2, y, 7, true);

      escrever(mascararCpf(holerite.funcionario.cpf), coluna2 + 30, y, 8);

      y -= 15;

      escrever("Código:", margem + 12, y, 7, true);

      escrever(
        holerite.funcionario.codigoFuncionario || holerite.funcionario.id,
        margem + 55,
        y,
        8,
      );

      escrever("Cargo:", coluna2, y, 7, true);

      escrever(
        holerite.funcionario.cargo || "Não informado",
        coluna2 + 39,
        y,
        8,
        false,
        205,
      );

      y -= 15;

      escrever("Competência:", margem + 12, y, 7, true);

      escrever(competencia, margem + 84, y, 8);

      escrever("Departamento:", coluna2, y, 7, true);

      escrever(
        holerite.funcionario.departamento?.nome ||
        holerite.funcionario.setor ||
        "Não informado",
        coluna2 + 82,
        y,
        8,
        false,
        160,
      );

      y -= 22;

      const caixaPagamentoY = y - 54;

      pagina.drawRectangle({
        x: margem + 10,
        y: caixaPagamentoY,
        width: largura - 20,
        height: 62,
        color: rgb(0.96, 0.98, 0.97),
        borderWidth: 0.7,
        borderColor: rgb(0.36, 0.55, 0.45),
      });

      escrever("DADOS DO PAGAMENTO", margem + 20, y - 4, 7, true);

      escrever("Data:", margem + 20, y - 20, 7, true);

      escrever(dataHoraBR(pagamento.pagoEm), margem + 52, y - 20, 7.5);

      escrever("Forma:", margem + 208, y - 20, 7, true);

      escrever(
        nomeFormaPagamento(pagamento.formaPagamento),
        margem + 249,
        y - 20,
        7.5,
        false,
        125,
      );

      escrever("Valor recebido:", margem + 392, y - 20, 7, true);

      escreverDireita(
        moeda(pagamento.valorPago),
        margem + largura - 20,
        y - 20,
        9,
        true,
      );

      escrever("Banco:", margem + 20, y - 37, 7, true);

      escrever(
        pagamento.bancoOrigem || "Não informado",
        margem + 58,
        y - 37,
        7,
        false,
        125,
      );

      escrever("Transação:", margem + 208, y - 37, 7, true);

      escrever(
        pagamento.identificadorTransacao || "Não informada",
        margem + 266,
        y - 37,
        7,
        false,
        138,
      );

      escrever("Destino:", margem + 410, y - 37, 7, true);

      escreverDireita(
        pagamento.contaDestinoMascarada || "Não informado",
        margem + largura - 20,
        y - 37,
        7,
      );

      escrever("Situação:", margem + 20, y - 51, 7, true);

      escrever(
        nomeStatusPagamento(pagamento.status),
        margem + 70,
        y - 51,
        7,
        true,
        315,
      );

      y = caixaPagamentoY - 15;

      escrever("COMPOSIÇÃO DO HOLERITE", margem + 12, y, 7, true);

      y -= 13;

      const eventosVisiveis = holerite.eventos.slice(0, 4);

      eventosVisiveis.forEach((evento) => {
        escrever(evento.codigo || "-", margem + 12, y, 6.5, false, 42);

        escrever(evento.descricao, margem + 60, y, 6.5, false, 310);

        escreverDireita(
          evento.tipo === "DESCONTO"
            ? `- ${moeda(evento.valor)}`
            : moeda(evento.valor),
          margem + largura - 12,
          y,
          7,
          evento.tipo === "VENCIMENTO",
        );

        y -= 12;
      });

      if (holerite.eventos.length > eventosVisiveis.length) {
        escrever(
          `Outros ${holerite.eventos.length - eventosVisiveis.length
          } evento(s) constam no holerite.`,
          margem + 60,
          y,
          6,
        );

        y -= 11;
      }

      linha(margem + 10, y + 4, margem + largura - 10, y + 4);

      escrever(
        `Vencimentos: ${moeda(holerite.totalVencimentos)}`,
        margem + 15,
        y - 9,
        7,
        true,
      );

      escrever(
        `Descontos: ${moeda(holerite.totalDescontos)}`,
        margem + 205,
        y - 9,
        7,
        true,
      );

      escreverDireita(
        `Líquido: ${moeda(holerite.valorLiquido)}`,
        margem + largura - 15,
        y - 9,
        8,
        true,
      );

      const declaracao =
        `Declaro, para os devidos fins, que recebi de ${nomeInstituicao} ` +
        `o valor líquido de ${moeda(
          pagamento.valorPago,
        )}, referente ao holerite da competência ${competencia}, ` +
        `incluindo as verbas e comissões discriminadas neste documento.`;

      const linhasDeclaracao = quebrarTexto(
        declaracao,
        fonteNormal,
        6.5,
        largura - 40,
      ).slice(0, 2);

      let declaracaoY = base + 88;

      linhasDeclaracao.forEach((linhaDeclaracao) => {
        escrever(linhaDeclaracao, margem + 20, declaracaoY, 6.5);

        declaracaoY -= 10;
      });

      const assinaturaY = base + 40;
      const assinaturaLargura = 205;

      const assinaturaFuncionarioX = margem + largura - 35 - assinaturaLargura;

      const centroAssinaturaFuncionario =
        assinaturaFuncionarioX + assinaturaLargura / 2;

      linha(
        margem + 35,
        assinaturaY,
        margem + 35 + assinaturaLargura,
        assinaturaY,
        0.8,
      );

      linha(
        margem + largura - 35 - assinaturaLargura,
        assinaturaY,
        margem + largura - 35,
        assinaturaY,
        0.8,
      );

      const assinaturaRhX = margem + 35;

const centroAssinaturaRh =
  assinaturaRhX + assinaturaLargura / 2;

const tituloAssinaturaRhY =
  pagamento.tipoAssinaturaRh === "DIGITAL_AUTENTICADA"
    ? assinaturaY + 18
    : assinaturaY + 34;

const dataAssinaturaRhY =
  pagamento.tipoAssinaturaRh === "DIGITAL_AUTENTICADA"
    ? assinaturaY + 10
    : assinaturaY + 27;

if (assinaturaRhConfirmada) {
  escreverCentro(
    pagamento.tipoAssinaturaRh === "DIGITAL_AUTENTICADA"
      ? "ASSINADO DIGITALMENTE PELO RH"
      : "ASSINADO ELETRONICAMENTE PELO RH",
    centroAssinaturaRh,
    tituloAssinaturaRhY,
    5.2,
    true,
  );

  escreverCentro(
    dataHoraBR(pagamento.assinadoRhEm),
    centroAssinaturaRh,
    dataAssinaturaRhY,
    4.8,
  );

  if (assinaturaRh) {
    const escala = Math.min(
      (assinaturaLargura - 36) / assinaturaRh.width,
      20 / assinaturaRh.height,
    );

    const larguraImagem =
      assinaturaRh.width * escala;

    const alturaImagem =
      assinaturaRh.height * escala;

    pagina.drawImage(assinaturaRh, {
      x:
        assinaturaRhX +
        (assinaturaLargura - larguraImagem) / 2,

      y: assinaturaY + 3,

      width: larguraImagem,
      height: alturaImagem,
    });
  }
}

      if (assinaturaConfirmada) {
        escreverCentro(
          "ASSINADO ELETRONICAMENTE",
          centroAssinaturaFuncionario,
          assinaturaY + 34,
          5.2,
          true,
        );

        escreverCentro(
          dataHoraBR(pagamento.confirmadoPeloFuncionarioEm),
          centroAssinaturaFuncionario,
          assinaturaY + 27,
          4.8,
        );

        desenharAssinaturaFuncionario(
          assinaturaFuncionarioX + 18,
          assinaturaY + 3,
          assinaturaLargura - 36,
          20,
        );
      }

      escreverCentro(
        assinaturaRhConfirmada
          ? nomeAssinanteRh
          : "Assinatura do RH pendente",
        margem + 35 + assinaturaLargura / 2,
        assinaturaY - 12,
        6.5,
        true,
      );

      escreverCentro(
        assinaturaRhConfirmada
          ? `Representante do RH • Usuário ID ${pagamento.assinadoRhPorId}`
          : "Assinatura do RH / Empregador",
        margem + 35 + assinaturaLargura / 2,
        assinaturaY - 22,
        6,
      );

      escreverCentro(
        holerite.funcionario.nome,
        centroAssinaturaFuncionario,
        assinaturaY - 12,
        6.5,
        true,
      );

      escreverCentro(
        assinaturaConfirmada
          ? "Assinatura eletrônica do funcionário"
          : "Assinatura do Funcionário",

        centroAssinaturaFuncionario,
        assinaturaY - 22,
        6,
      );

      escrever(
        `Documento gerado pelo PHANYX em ${dataHoraBR(
          new Date(),
        )}. Recibo ${pagamento.reciboNumero}.`,
        margem + 12,
        base + 9,
        5.5,
        false,
        largura - 24,
      );
      if (assinaturaConfirmada) {
        const assinaturaHashCurto = pagamento.assinaturaImagemHash
          ?.slice(0, 16)
          .toUpperCase();

        const confirmacaoHashCurto = pagamento.confirmacaoHash
          ?.slice(0, 16)
          .toUpperCase();

        escrever(
          [
            assinaturaHashCurto
              ? `Assinatura SHA-256: ${assinaturaHashCurto}...`
              : null,

            confirmacaoHashCurto
              ? `Confirmação SHA-256: ${confirmacaoHashCurto}...`
              : null,
          ]
            .filter(Boolean)
            .join(" | "),

          margem + 250,
          base + 9,
          4.3,
          false,
          largura - 262,
        );
      }
    }

    const margemSuperior = 26;
    const margemInferior = 26;
    const areaCorte = 22;

    const alturaDisponivel =
      height - margemSuperior - margemInferior - areaCorte;

    const alturaVia = alturaDisponivel / 2;

    const centroCorte = height / 2;

    desenharVia(
      height - margemSuperior,
      centroCorte + areaCorte / 2,
      "VIA DO EMPREGADOR",
    );

    desenharVia(
      centroCorte - areaCorte / 2,
      margemInferior,
      "VIA DO FUNCIONÁRIO",
    );

    for (let x = 28; x < width - 28; x += 14) {
      linha(x, centroCorte, Math.min(x + 7, width - 28), centroCorte, 0.6);
    }

    pagina.drawRectangle({
      x: width / 2 - 40,
      y: centroCorte - 6,
      width: 80,
      height: 12,
      color: rgb(1, 1, 1),
    });

    escreverCentro("CORTE AQUI", width / 2, centroCorte - 3, 6, true);

    const bytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(bytes), {
      status: 200,

      headers: {
        "Content-Type": "application/pdf",

        "Content-Disposition": `inline; filename="${limparNomeArquivo(
          `recibo-pagamento-${holerite.funcionario.nome}-${competencia}.pdf`,
        )}"`,

        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar recibo do holerite:", error);

    return NextResponse.json(
      {
        error: error?.message || "Erro ao gerar o recibo de pagamento.",
      },
      {
        status: 500,
      },
    );
  }
}

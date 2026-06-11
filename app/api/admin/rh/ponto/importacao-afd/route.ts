import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function somenteNumeros(v: any) {
  return String(v || "").replace(/\D/g, "");
}

function inicioDia(data: Date) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function fimDia(data: Date) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate() + 1);
}

function montarData(ddmmyyyy: string, hhmm: string) {
  const dia = Number(ddmmyyyy.slice(0, 2));
  const mes = Number(ddmmyyyy.slice(2, 4)) - 1;
  const ano = Number(ddmmyyyy.slice(4, 8));
  const hora = Number(hhmm.slice(0, 2));
  const minuto = Number(hhmm.slice(2, 4));

  return new Date(ano, mes, dia, hora, minuto, 0);
}

function calcularHoras(marcacoes: Date[]) {
  if (marcacoes.length < 2) return null;

  const entrada = marcacoes[0];
  const saida = marcacoes[3] || marcacoes[1];

  let minutos = (saida.getTime() - entrada.getTime()) / 60000;

  if (marcacoes[1] && marcacoes[2]) {
    minutos -= (marcacoes[2].getTime() - marcacoes[1].getTime()) / 60000;
  }

  if (minutos <= 0) return null;

  return Number((minutos / 60).toFixed(2));
}

function extrairMarcacaoAFD(linha: string) {
  const limpa = linha.trim();

  const match = limpa.match(/(\d{8})(\d{4})/);

  if (!match || match.index === undefined) {
    return null;
  }

  const dataTexto = match[1];
  const horaTexto = match[2];

  const dataHora = montarData(dataTexto, horaTexto);

  if (Number.isNaN(dataHora.getTime())) {
    return null;
  }

  const depois = limpa.slice(match.index + 12);
  const identificador = somenteNumeros(depois).slice(0, 20);

  if (!identificador) {
    return null;
  }

  return {
    dataHora,
    identificador,
    linha: limpa,
  };
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || !isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const formData = await req.formData();
    const arquivo = formData.get("arquivo");

    if (!arquivo || !(arquivo instanceof File)) {
      return NextResponse.json(
        { error: "Envie um arquivo AFD." },
        { status: 400 }
      );
    }

    const conteudo = await arquivo.text();
    const linhas = conteudo.split(/\r?\n/).filter(Boolean);

    const funcionarios = await prisma.funcionario.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        codigoPonto: true,
        pisPasep: true,
      },
    });

    const mapaFuncionarios = new Map<string, number>();

    funcionarios.forEach((f) => {
      const codigoPonto = somenteNumeros(f.codigoPonto);
      const pisPasep = somenteNumeros(f.pisPasep);

      if (codigoPonto) mapaFuncionarios.set(codigoPonto, f.id);
      if (pisPasep) mapaFuncionarios.set(pisPasep, f.id);
    });

    const grupos = new Map<string, Date[]>();
    let linhasLidas = 0;
    let linhasIgnoradas = 0;

    for (const linha of linhas) {
      const marcacao = extrairMarcacaoAFD(linha);

      if (!marcacao) {
        linhasIgnoradas++;
        continue;
      }

      linhasLidas++;

      let funcionarioId: number | null = null;

      for (const [codigo, id] of mapaFuncionarios.entries()) {
        if (
          marcacao.identificador === codigo ||
          marcacao.identificador.endsWith(codigo) ||
          codigo.endsWith(marcacao.identificador)
        ) {
          funcionarioId = id;
          break;
        }
      }

      if (!funcionarioId) {
        linhasIgnoradas++;
        continue;
      }

      const dia = inicioDia(marcacao.dataHora);
      const chave = `${funcionarioId}-${dia.toISOString().slice(0, 10)}`;

      const lista = grupos.get(chave) || [];
      lista.push(marcacao.dataHora);
      grupos.set(chave, lista);
    }

    let registrosCriados = 0;
    let registrosAtualizados = 0;

    for (const [chave, marcacoes] of grupos.entries()) {
      const [funcionarioIdTexto] = chave.split("-");
      const funcionarioId = Number(funcionarioIdTexto);

      const ordenadas = marcacoes.sort(
        (a, b) => a.getTime() - b.getTime()
      );

      const data = inicioDia(ordenadas[0]);

      const existente = await prisma.pontoFuncionarioRH.findFirst({
        where: {
          funcionarioId,
          instituicaoId: user.instituicaoId,
          data: {
            gte: inicioDia(data),
            lt: fimDia(data),
          },
        },
      });

      const horasTrabalhadas = calcularHoras(ordenadas);

      const dados = {
        data,
        entrada: ordenadas[0] || null,
        saidaAlmoco: ordenadas[1] || null,
        retornoAlmoco: ordenadas[2] || null,
        saida: ordenadas[3] || null,
        horasTrabalhadas: horasTrabalhadas as any,
        horasExtras: null,
        horasAtraso: null,
        status: "IMPORTADO_AFD",
        observacoes: `Importado via arquivo AFD. Marcações encontradas: ${ordenadas.length}.`,
      };

      if (existente) {
        await prisma.pontoFuncionarioRH.update({
          where: { id: existente.id },
          data: dados,
        });

        registrosAtualizados++;
      } else {
        await prisma.pontoFuncionarioRH.create({
          data: {
            funcionarioId,
            instituicaoId: user.instituicaoId,
            ...dados,
          },
        });

        registrosCriados++;
      }
    }

    return NextResponse.json({
      message: "Arquivo AFD processado com sucesso.",
      resumo: {
        linhasArquivo: linhas.length,
        linhasLidas,
        linhasIgnoradas,
        funcionariosEncontrados: grupos.size,
        registrosCriados,
        registrosAtualizados,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao importar arquivo AFD." },
      { status: 500 }
    );
  }
}
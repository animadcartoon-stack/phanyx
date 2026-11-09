import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { criarContratoPendenteMatricula } from "@/lib/contratos/contrato-matricula";
import { ErroContratoMatricula } from "@/lib/contratos/validacao-contrato";
import { administradorCombos, erroCombos } from "@/lib/matriculas/combos-api";
import { encontrarConflitos, horarioValido, type HorarioModalidade } from "@/lib/matriculas/combos";
import { validarDataInicioCurso } from "@/lib/matriculas/dataInicioCurso";
import { carregarOfertasModalidades, horariosAtuaisAluno } from "@/lib/matriculas/modalidades-servidor";
import { prisma } from "@/lib/prisma";

function objetoJson(valor: Prisma.JsonValue | undefined): Prisma.JsonObject | null {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? valor : null;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { instituicaoId, id: usuarioId } = await administradorCombos();
    const id = Number(params.id);
    const body = await request.json().catch(() => null);
    const inicio = validarDataInicioCurso(body?.dataInicioCurso);
    if (!Number.isSafeInteger(id) || id <= 0 || !inicio.valida || !inicio.data) {
      return NextResponse.json({ error: "Informe uma data de início válida para a matrícula." }, { status: 400 });
    }
    const dataInicioCurso = inicio.data;
    const dataCivil = dataInicioCurso.toISOString().slice(0, 10);
    const agora = new Date();
    const hoje = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
    }).format(agora);

    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT a."id" FROM "Aluno" a JOIN "Matricula" m
        ON m."alunoId" = a."id" AND m."instituicaoId" = a."instituicaoId"
        WHERE m."id" = ${id} AND m."instituicaoId" = ${instituicaoId} FOR UPDATE OF a`;
      await tx.$queryRaw`SELECT "id" FROM "Matricula" WHERE "id" = ${id} AND "instituicaoId" = ${instituicaoId} FOR UPDATE`;
      const where = { id, instituicaoId, excluidaEm: null };
      const matricula = await tx.matricula.findFirst({
        where,
        select: {
          alunoId: true, status: true, dataInicioCurso: true, contratacaoModalidades: true,
          turmaPrincipal: { select: { dataFim: true } },
          turmasAvulsas: { select: { turma: { select: { dataFim: true } } } },
          itens: { select: { turma: { select: { dataFim: true } } } },
        },
      });
      if (!matricula) {
        return NextResponse.json({ error: "Matrícula não encontrada." }, { status: 404 });
      }
      const snapshot = objetoJson(matricula.contratacaoModalidades);
      if (!snapshot || !["ATIVA", "A_INICIAR", "AGUARDANDO"].includes(matricula.status)) {
        throw new ErroContratoMatricula("Essa matrícula não está disponível para editar a data de início.");
      }
      const dataAnterior = matricula.dataInicioCurso?.toISOString().slice(0, 10) ?? null;
      if (dataAnterior === dataCivil) return NextResponse.json({ dataInicioCurso: dataCivil });
      if ((body.dataInicioAnterior ?? null) !== dataAnterior) {
        throw new ErroContratoMatricula("A data foi atualizada por outra pessoa. Recarregue a lista antes de editar.");
      }
      if (dataAnterior && (dataAnterior <= hoje || dataCivil < hoje)) {
        throw new ErroContratoMatricula("Datas de atendimento já iniciado exigem revisão da contratação.");
      }
      const turmas = [
        matricula.turmaPrincipal,
        ...matricula.turmasAvulsas.map(vinculo => vinculo.turma),
        ...matricula.itens.map(item => item.turma),
      ];
      if (turmas.some(turma => turma?.dataFim && turma.dataFim.toISOString().slice(0, 10) < dataCivil)) {
        throw new ErroContratoMatricula("A data de início é posterior ao término de uma das turmas da matrícula.");
      }

      const anteciparInicio = dataAnterior !== null && dataCivil < dataAnterior;
      const erroAgenda = () => new ErroContratoMatricula(
        "Os horários atuais não conferem com a contratação. Revise a agenda antes de antecipar o início.",
      );
      if (anteciparInicio && (!Array.isArray(snapshot.ofertas) || !snapshot.ofertas.length)) throw erroAgenda();
      const atuais = anteciparInicio ? await carregarOfertasModalidades(tx, instituicaoId) : [];
      const novosHorarios: HorarioModalidade[] = [];
      const ofertas = Array.isArray(snapshot.ofertas) ? snapshot.ofertas.map(valor => {
        const oferta = objetoJson(valor);
        if (!oferta || !Array.isArray(oferta.horarios)) {
          if (anteciparInicio) throw erroAgenda();
          return valor;
        }
        const atual = anteciparInicio ? atuais.find(turma => turma.id === oferta.turmaId) : null;
        if (anteciparInicio && (!atual || atual.horariosPendentes || atual.horarios.length !== oferta.horarios.length)) {
          throw erroAgenda();
        }
        return { ...oferta, horarios: oferta.horarios.map(item => {
          const horario = objetoJson(item);
          if (!horario) {
            if (anteciparInicio) throw erroAgenda();
            return item;
          }
          const registrado = typeof horario.dataInicio === "string" ? horario.dataInicio : "";
          let inicioAtual = registrado;
          const horarioAtual = atual?.horarios.find(h => h.disciplinaId === horario.disciplinaId &&
            h.diaSemana === horario.diaSemana && h.horaInicio === horario.horaInicio &&
            h.horaFim === horario.horaFim && h.dataFim === horario.dataFim);
          if (anteciparInicio) {
            if (!horarioAtual) throw erroAgenda();
            inicioAtual = horarioAtual.dataInicio ?? "";
            if (registrado !== (inicioAtual > dataAnterior ? inicioAtual : dataAnterior)) throw erroAgenda();
          }
          const novoInicio = inicioAtual > dataCivil ? inicioAtual : dataCivil;
          if (typeof horario.dataFim === "string" && horario.dataFim < novoInicio) {
            throw new ErroContratoMatricula("A data de início é posterior ao término de uma atividade contratada.");
          }
          if (horarioAtual) novosHorarios.push({ ...horarioAtual, dataInicio: novoInicio });
          return { ...horario, dataInicio: novoInicio };
        }) };
      }) : undefined;
      if (anteciparInicio) {
        const { horarios } = await horariosAtuaisAluno(tx, instituicaoId, matricula.alunoId, id);
        if (novosHorarios.some(horario => !horarioValido(horario)) ||
            encontrarConflitos(novosHorarios, horarios).length) {
          throw new ErroContratoMatricula("A nova data cria um conflito com os horários do aluno. Confira a agenda.");
        }
      }

      const vinculo = { matriculaId: id, instituicaoId };
      const contratos = await tx.contrato.findMany({
        where: { ...vinculo, status: { not: "CANCELADO" } },
        select: {
          id: true, status: true, conteudo: true, dataAssinatura: true, assinaturaSecretariaEm: true,
          assinatura: { select: { id: true } },
        },
      });
      const documentoAssinado = await tx.documentoGerado.findFirst({
        where: { ...vinculo, tipo: "CONTRATO", status: "ASSINADO" }, select: { id: true },
      });
      const erroAssinado = "Já existe uma assinatura para esta matrícula. A data exige revisão do contrato.";
      if (documentoAssinado || contratos.some(contrato => contrato.status !== "PENDENTE" ||
          contrato.dataAssinatura || contrato.assinaturaSecretariaEm || contrato.assinatura)) {
        throw new ErroContratoMatricula(erroAssinado);
      }

      if (contratos.length) {
        const antigos = await tx.contrato.updateMany({
          where: { ...vinculo, id: { in: contratos.map(contrato => contrato.id) }, status: "PENDENTE",
            dataAssinatura: null, assinaturaSecretariaEm: null, assinatura: { is: null } },
          data: { status: "CANCELADO", tokenAssinatura: null },
        });
        if (antigos.count !== contratos.length) throw new ErroContratoMatricula(erroAssinado);
        await tx.documentoAluno.updateMany({
          where: { ...vinculo, tipo: "CONTRATO", arquivado: false,
            conteudo: { in: contratos.map(contrato => contrato.conteudo) } },
          data: { arquivado: true, arquivadoEm: agora, arquivadoPorId: usuarioId,
            motivoArquivamento: "Contrato substituído após corrigir a data de início." },
        });
      }
      await tx.matricula.update({
        where: { id, instituicaoId },
        data: {
          dataInicioCurso,
          contratacaoModalidades: {
            ...snapshot, ...(ofertas ? { ofertas } : {}), dataInicioCurso: dataCivil,
            ...(dataAnterior ? {
              revisoesInicio: [
                ...(Array.isArray(snapshot.revisoesInicio) ? snapshot.revisoesInicio : []),
                { anterior: dataAnterior, data: dataCivil, usuarioId, registradoEm: agora.toISOString() },
              ],
            } : { complementoInicio: { data: dataCivil, usuarioId, registradoEm: agora.toISOString() } }),
          } as Prisma.InputJsonObject,
        },
      });
      const contrato = await criarContratoPendenteMatricula({ ...vinculo, db: tx });
      await tx.documentoAluno.create({
        data: { ...vinculo, alunoId: matricula.alunoId, tipo: "CONTRATO",
          titulo: "Contrato de matrícula", conteudo: contrato.conteudo },
      });
      return NextResponse.json({ dataInicioCurso: dataCivil });
    }, { isolationLevel: "Serializable", maxWait: 5000, timeout: 30000 });
  } catch (error) {
    return erroCombos(error);
  }
}

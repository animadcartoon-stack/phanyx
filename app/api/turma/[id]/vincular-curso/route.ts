import { NextResponse } from "next/server";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { etapaDaOferta } from "@/lib/academico/organizacao";
import {
  ErroIntegridadeAcademica,
  idOpcionalOferta,
  idsOferta,
  respostaErroAcademico,
  validarEtapaDoCurso,
  validarDisciplinasDaOferta,
  validarResponsaveisDaOferta,
} from "@/lib/academico/integridade-ofertas";

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const usuario = await getUserFromToken();
    if (!usuario || !isAdminLike(usuario.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    const origemId = idOpcionalOferta(context.params.id);
    const corpo = await request.json();
    const destinoId = idOpcionalOferta(corpo?.cursoDestinoId);
    if (!origemId || !destinoId) throw new ErroIntegridadeAcademica("VINCULO_INVALIDO");
    const disciplinaIds = idsOferta(corpo?.disciplinaIds);
    if (disciplinaIds.length === 0) {
      return NextResponse.json({ error: "Selecione uma disciplina para a oferta." }, { status: 400 });
    }
    const instituicaoId = usuario.instituicaoId;
    const criada = await prisma.$transaction(async tx => {
      const origem = await tx.turma.findFirst({
        where: { id: origemId, instituicaoId },
        include: {
          disciplinas: {
            where: { instituicaoId },
            include: { horarios: { where: { instituicaoId, ativo: true } } },
          },
        },
      });
      if (!origem) throw new ErroIntegridadeAcademica("TURMA_INVALIDA");
      if (origem.cursoId === destinoId) {
        return { error: "A turma já pertence a esse curso." };
      }
      const destino = await tx.curso.findFirst({
        where: { id: destinoId, instituicaoId, ativo: true, excluidoEm: null },
        select: { id: true, nome: true, organizacaoCurricular: true },
      });
      if (!destino) throw new ErroIntegridadeAcademica("CURSO_INDISPONIVEL");
      const selecionadas = origem.disciplinas.filter(d => disciplinaIds.includes(d.disciplinaId));
      if (selecionadas.length !== disciplinaIds.length) {
        throw new ErroIntegridadeAcademica("DISCIPLINAS_INVALIDAS");
      }
      const codigo = `OFERTA-${origem.id}-${destinoId}`;
      const jaExiste = await tx.turma.findFirst({ where: { instituicaoId, cursoId: destinoId, codigo }, select: { id: true } });
      if (jaExiste) return { error: "Esta turma já foi disponibilizada nesse curso. Edite a oferta existente na lista de turmas." };
      const etapa = await validarEtapaDoCurso(tx, instituicaoId, destinoId, etapaDaOferta(origem) ?? 1, destino.organizacaoCurricular);
      // Cursos anuais/semestrais podem ainda nao ter etapa cadastrada.
      // Organiza somente as disciplinas explicitamente selecionadas para esta oferta.
      if (etapa.etapaNumero !== null) {
        const grade = await tx.cursoSemestre.upsert({
          where: { cursoId_numero: { cursoId: destinoId, numero: etapa.etapaNumero } },
          update: {},
          create: { instituicaoId, cursoId: destinoId, numero: etapa.etapaNumero,
            organizacaoCurricular: etapa.organizacaoCurricular },
        });
        await tx.cursoSemestreDisciplina.createMany({
          data: disciplinaIds.map(disciplinaId => ({
            instituicaoId, cursoSemestreId: grade.id, disciplinaId,
          })),
          skipDuplicates: true,
        });
      }
      await validarDisciplinasDaOferta(tx, instituicaoId, destinoId, etapa.etapaNumero, disciplinaIds);
      await validarResponsaveisDaOferta(tx, instituicaoId, origem.poloId, origem.professorId,
        disciplinaIds, Object.fromEntries(selecionadas.map(d => [d.disciplinaId, d.professorId])));
      const nova = await tx.turma.create({
        data: {
          nome: `${origem.nome} — ${destino.nome}`,
          codigo,
          instituicaoId,
          cursoId: destinoId,
          organizacaoCurricular: etapa.organizacaoCurricular,
          etapaNumero: etapa.etapaNumero,
          semestre: etapa.semestre,
          periodoLetivo: origem.periodoLetivo,
          turno: origem.turno,
          modalidade: origem.modalidade,
          predio: origem.predio,
          ala: origem.ala,
          andar: origem.andar,
          sala: origem.sala,
          professorId: origem.professorId,
          poloId: origem.poloId,
          // Permanece inativa ate revisar capacidade compartilhada e horarios.
          ativa: false,
          statusTurma: origem.statusTurma,
          capacidadeMaxima: origem.capacidadeMaxima,
          capacidadeMinima: origem.capacidadeMinima,
          dataInicio: origem.dataInicio,
          dataFim: origem.dataFim,
        },
      });
      const turmaSemestre = etapa.etapaNumero === null ? null : await tx.turmaSemestre.create({
        data: { turmaId: nova.id, instituicaoId, numero: etapa.etapaNumero,
          organizacaoCurricular: etapa.organizacaoCurricular, status: "A_INICIAR" },
      });
      for (const vinculo of selecionadas) {
        await tx.turmaDisciplina.create({
          data: {
            turmaId: nova.id,
            instituicaoId,
            disciplinaId: vinculo.disciplinaId,
            professorId: vinculo.professorId,
            dataInicio: vinculo.dataInicio,
            dataFim: vinculo.dataFim,
            status: vinculo.status,
            turmaSemestreId: turmaSemestre?.id ?? null,
            horarios: {
              create: vinculo.horarios.map(h => ({
                instituicaoId, diaSemana: h.diaSemana,
                horaInicio: h.horaInicio, horaFim: h.horaFim, ativo: true,
              })),
            },
          },
        });
      }
      return { id: nova.id, nome: nova.nome };
    }, { isolationLevel: "Serializable", timeout: 20000 });
    if ("error" in criada) return NextResponse.json(criada, { status: 409 });
    return NextResponse.json({ oferta: criada }, { status: 201 });
  } catch (erro) {
    const academico = respostaErroAcademico(erro);
    if (academico) return academico;
    console.error("Falha ao disponibilizar turma em curso:", erro);
    return NextResponse.json({ error: "Não foi possível criar a oferta. Consulte os registros da aplicação." }, { status: 500 });
  }
}

import fs from "node:fs";

const arquivo =
  "app/api/admin/mobilidade/candidaturas/route.ts";

let s = fs.readFileSync(
  arquivo,
  "utf8"
);

const marcador =
  "mobilidadeOfertaDocumentoRequisito.findMany";

if (s.includes(marcador)) {
  console.log(
    "✓ O POST já parece possuir geração automática do checklist. Nada foi alterado."
  );
  process.exit(0);
}

const inicioPost =
  s.indexOf(
    "export async function POST"
  );

if (inicioPost < 0) {
  throw new Error(
    "POST de candidaturas não encontrado."
  );
}

const inicio =
  s.indexOf(
    "      const candidatura =",
    inicioPost
  );

if (inicio < 0) {
  throw new Error(
    "Ponto inicial da criação da candidatura não encontrado."
  );
}

const fim =
  s.indexOf(
    "\n\n      return NextResponse.json(",
    inicio
  );

if (fim < 0) {
  throw new Error(
    "Ponto final da criação da candidatura não encontrado."
  );
}

const novo = `      const candidatura =
        await prisma.$transaction(
          async (tx) => {
            const requisitos =
              await tx.mobilidadeOfertaDocumentoRequisito.findMany({
                where: {
                  instituicaoId,
                  ofertaId,
                  ativo: true,
                },

                orderBy: [
                  {
                    ordem: "asc",
                  },
                  {
                    id: "asc",
                  },
                ],

                select: {
                  id: true,
                  tipo: true,
                  titulo: true,
                  descricao: true,
                  obrigatorio: true,
                  exigeValidade: true,
                  ordem: true,
                },
              });

            const criada =
              await tx.mobilidadeCandidatura.create({
                data: {
                  instituicaoId,
                  ofertaId,

                  alunoId,
                  matriculaId,

                  vinculoCandidato:
                    vinculo,

                  nomeSnapshot,
                  emailSnapshot,
                  telefoneSnapshot,

                  instituicaoOrigemNome,
                  paisOrigemCodigo,

                  status,

                  motivoStatus:
                    textoOpcional(
                      corpo.motivoStatus,
                      5000
                    ),

                  enviadaEm,

                  analisadaEm:
                    analisada
                      ? agora
                      : null,

                  notaFinal,

                  classificacao,

                  criadoPorId:
                    usuario?.id ??
                    null,

                  analisadoPorId:
                    analisada
                      ? (
                          usuario?.id ??
                          null
                        )
                      : null,
                },

                select: {
                  id: true,
                },
              });

            if (
              requisitos.length >
              0
            ) {
              await tx.mobilidadeCandidaturaDocumento.createMany({
                data:
                  requisitos.map(
                    (requisito) => ({
                      instituicaoId,

                      candidaturaId:
                        criada.id,

                      requisitoOfertaId:
                        requisito.id,

                      tipo:
                        requisito.tipo,

                      titulo:
                        requisito.titulo,

                      descricaoRequisito:
                        requisito.descricao,

                      obrigatorio:
                        requisito.obrigatorio,

                      exigeValidade:
                        requisito.exigeValidade,

                      ordem:
                        requisito.ordem,
                    })
                  ),
              });
            }

            return criada;
          }
        );`;

s =
  s.slice(0, inicio) +
  novo +
  s.slice(fim);

fs.writeFileSync(
  arquivo,
  s,
  "utf8"
);

console.log(
  "✓ POST atualizado: candidatura e checklist agora são criados na mesma transação."
);

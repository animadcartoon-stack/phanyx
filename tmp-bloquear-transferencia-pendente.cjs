const fs = require("fs");

const file =
  "app/api/admin/matriculas/[id]/transferencias/route.ts";

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

const ancora =
`          if (
            STATUS_MATRICULA_BLOQUEADOS.has(
              matricula.status
            )
          ) {
            throw new ErroApi(
              409,
              "Esta matricula nao pode ser transferida no status atual.",
              "STATUS_NAO_TRANSFERIVEL"
            );
          }

          if (
            matricula.poloId ===
            poloDestinoId
          ) {`;

if (!s.includes(ancora)) {
  throw new Error(
    "Ancora de validacao da matricula nao encontrada."
  );
}

const novo =
`          if (
            STATUS_MATRICULA_BLOQUEADOS.has(
              matricula.status
            )
          ) {
            throw new ErroApi(
              409,
              "Esta matricula nao pode ser transferida no status atual.",
              "STATUS_NAO_TRANSFERIVEL"
            );
          }

          /*
           * Uma matricula nao pode possuir duas
           * transferencias pendentes ao mesmo tempo.
           *
           * A transferencia anterior precisa ser
           * concluida ou cancelada antes de iniciar
           * outra movimentacao.
           */
          const transferenciaPendente =
            await tx.transferenciaMatricula.findFirst(
              {
                where: {
                  instituicaoId:
                    matricula.instituicaoId,

                  matriculaId:
                    matricula.id,

                  status:
                    StatusTransferenciaMatricula.PENDENTE,
                },

                select: {
                  id: true,
                  tipo: true,
                  poloDestinoId: true,
                  poloDestinoNomeSnapshot:
                    true,
                  turmaDestinoId: true,
                  turmaDestinoNomeSnapshot:
                    true,
                  dataTransferencia:
                    true,
                },
              }
            );

          if (transferenciaPendente) {
            throw new ErroApi(
              409,
              "Esta matricula ja possui uma transferencia pendente. Conclua a alocacao da transferencia atual antes de iniciar outra.",
              "TRANSFERENCIA_PENDENTE_EXISTENTE"
            );
          }

          if (
            matricula.poloId ===
            poloDestinoId
          ) {`;

s = s.replace(
  ancora,
  novo
);

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log(
  "Bloqueio de transferencia pendente adicionado."
);

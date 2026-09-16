const fs = require("fs");

const file =
  "prisma/schema.prisma";

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

const backup =
  "prisma/schema.prisma.antes-documentos-transferencia.bak";

if (!fs.existsSync(backup)) {
  fs.copyFileSync(
    file,
    backup
  );
}

function closingBraceOfModel(
  source,
  modelName
) {
  const marker =
    `model ${modelName} {`;

  const start =
    source.indexOf(
      marker
    );

  if (start < 0) {
    throw new Error(
      `Modelo ${modelName} nao encontrado.`
    );
  }

  let depth = 0;

  for (
    let i = start;
    i < source.length;
    i++
  ) {
    if (source[i] === "{") {
      depth++;
    }

    if (source[i] === "}") {
      depth--;

      if (depth === 0) {
        return i;
      }
    }
  }

  throw new Error(
    `Fechamento de ${modelName} nao encontrado.`
  );
}

if (
  !s.includes(
    "documentos TransferenciaMatriculaDocumento[]"
  )
) {
  const end =
    closingBraceOfModel(
      s,
      "TransferenciaMatricula"
    );

  s =
    s.slice(
      0,
      end
    ) +
    `  documentos TransferenciaMatriculaDocumento[]\n` +
    s.slice(
      end
    );
}

if (
  !s.includes(
    "enum TipoDocumentoTransferenciaMatricula"
  )
) {
  s += `

enum TipoDocumentoTransferenciaMatricula {
  REQUERIMENTO
  AUTORIZACAO_RESPONSAVEL
  HISTORICO_ESCOLAR
  DECLARACAO_MATRICULA
  EMENTAS
  PARECER_EQUIVALENCIA
  DOCUMENTO_DESTINO
  DOCUMENTO_PESSOAL
  TERMO_ASSINADO
  OUTRO
}

enum StatusDocumentoTransferenciaMatricula {
  PENDENTE
  VINCULADO
  REMOVIDO
}

model TransferenciaMatriculaDocumento {
  id                         Int                                    @id @default(autoincrement())
  instituicaoId              Int
  transferenciaId            Int?
  sessaoUpload               String?
  tipo                       TipoDocumentoTransferenciaMatricula
  status                     StatusDocumentoTransferenciaMatricula @default(PENDENTE)

  nomeOriginal               String
  nomeArquivo                String
  urlArquivo                 String
  pathnameBlob               String?
  mimeType                   String?
  tamanhoBytes               Int?

  descricao                  String?
  numeroDocumento            String?
  emitidoEm                  DateTime?
  validadeEm                 DateTime?
  visivelAoAluno             Boolean                                @default(false)

  enviadoPorId               Int?
  enviadoPorNomeSnapshot     String?
  ip                         String?
  userAgent                  String?

  criadoEm                   DateTime                               @default(now())
  vinculadoEm                DateTime?

  removidoEm                 DateTime?
  removidoPorId              Int?
  removidoPorNomeSnapshot    String?
  motivoRemocao              String?

  transferencia TransferenciaMatricula? @relation(
    fields: [transferenciaId],
    references: [id],
    onDelete: Cascade
  )

  @@index([instituicaoId])
  @@index([transferenciaId])
  @@index([sessaoUpload])
  @@index([tipo])
  @@index([status])
  @@index([enviadoPorId])
}
`;
}

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log(
  "Schema de documentos da transferencia preparado."
);

import fs from "node:fs";
import path from "node:path";

const schemaPath = path.resolve("prisma/schema.prisma");

if (!fs.existsSync(schemaPath)) {
  throw new Error(`schema.prisma não encontrado em: ${schemaPath}`);
}

let schema = fs.readFileSync(schemaPath, "utf8");

if (schema.includes("model MobilidadeInstituicaoParceira {")) {
  console.log("ℹ Núcleo de Mobilidade Internacional já existe. Nenhuma alteração realizada.");
  process.exit(0);
}

function addToModel(modelName, marker, lines) {
  const regex = new RegExp(
    `model ${modelName} \\{([\\s\\S]*?)\\n\\}`,
    "m"
  );

  const match = schema.match(regex);

  if (!match) {
    throw new Error(`Model ${modelName} não encontrado.`);
  }

  const original = match[0];

  if (original.includes(marker)) {
    console.log(`ℹ Relações já presentes em ${modelName}`);
    return;
  }

  const fechamento = original.lastIndexOf("\n}");

  if (fechamento === -1) {
    throw new Error(`Não foi possível localizar o fechamento de ${modelName}.`);
  }

  const atualizado =
    original.slice(0, fechamento) +
    "\n" +
    lines.trimEnd() +
    "\n" +
    original.slice(fechamento);

  schema = schema.replace(original, atualizado);

  console.log(`✓ ${modelName}`);
}

addToModel(
  "Instituicao",
  "mobilidadeInstituicoesParceiras",
`  mobilidadeInstituicoesParceiras MobilidadeInstituicaoParceira[]
  mobilidadeConvenios             MobilidadeConvenio[]
  mobilidadeConvenioCursos        MobilidadeConvenioCurso[]
  mobilidadeProgramas             MobilidadePrograma[]
  mobilidadeOfertas               MobilidadeOferta[]
  mobilidadeOfertaCursos          MobilidadeOfertaCurso[]
  mobilidadeCandidaturas          MobilidadeCandidatura[]
  mobilidadeCandidaturaDocumentos MobilidadeCandidaturaDocumento[]`
);

addToModel(
  "User",
  "mobilidadeInstituicoesParceirasCriadas",
`  mobilidadeInstituicoesParceirasCriadas MobilidadeInstituicaoParceira[]    @relation("MobilidadeInstituicaoParceiraCriadaPor")
  mobilidadeConveniosCriados             MobilidadeConvenio[]                @relation("MobilidadeConvenioCriadoPor")
  mobilidadeProgramasCriados             MobilidadePrograma[]                @relation("MobilidadeProgramaCriadoPor")
  mobilidadeOfertasCriadas               MobilidadeOferta[]                  @relation("MobilidadeOfertaCriadaPor")
  mobilidadeCandidaturasCriadas          MobilidadeCandidatura[]             @relation("MobilidadeCandidaturaCriadaPor")
  mobilidadeCandidaturasAnalisadas       MobilidadeCandidatura[]             @relation("MobilidadeCandidaturaAnalisadaPor")
  mobilidadeDocumentosAnalisados         MobilidadeCandidaturaDocumento[]    @relation("MobilidadeCandidaturaDocumentoAnalisadoPor")`
);

addToModel(
  "Aluno",
  "candidaturasMobilidade",
`  candidaturasMobilidade MobilidadeCandidatura[]`
);

addToModel(
  "Curso",
  "conveniosMobilidade",
`  conveniosMobilidade MobilidadeConvenioCurso[]
  ofertasMobilidade   MobilidadeOfertaCurso[]`
);

addToModel(
  "Matricula",
  "candidaturasMobilidade",
`  candidaturasMobilidade MobilidadeCandidatura[]`
);

const blocoMobilidade = `

// ============================================================================
// MOBILIDADE ACADÊMICA E INTERCÂMBIO INTERNACIONAL
// ============================================================================

enum MobilidadeDirecao {
  SAIDA
  ENTRADA
  BIDIRECIONAL
}

enum MobilidadeTipoPrograma {
  SEMESTRE_ACADEMICO
  ANO_ACADEMICO
  CURTA_DURACAO
  PROGRAMA_IDIOMAS
  ESTAGIO
  PESQUISA
  SUMMER_SCHOOL
  WINTER_SCHOOL
  DUPLA_TITULACAO
  HIBRIDA
  VIRTUAL
  OUTRO
}

enum MobilidadeStatusConvenio {
  RASCUNHO
  ATIVO
  SUSPENSO
  ENCERRADO
  EXPIRADO
}

enum MobilidadeStatusPrograma {
  RASCUNHO
  ATIVO
  INATIVO
  ARQUIVADO
}

enum MobilidadeStatusOferta {
  RASCUNHO
  INSCRICOES_AGENDADAS
  INSCRICOES_ABERTAS
  INSCRICOES_ENCERRADAS
  EM_SELECAO
  FINALIZADA
  CANCELADA
}

enum MobilidadeVinculoCandidato {
  ALUNO_PHANYX
  ALUNO_EXTERNO
}

enum MobilidadeStatusCandidatura {
  RASCUNHO
  ENVIADA
  EM_ANALISE
  DOCUMENTACAO_PENDENTE
  ELEGIVEL
  INELEGIVEL
  EM_SELECAO
  CLASSIFICADA
  LISTA_ESPERA
  APROVADA
  REPROVADA
  DESISTENTE
  CANCELADA
}

enum MobilidadeTipoDocumento {
  PASSAPORTE
  IDENTIDADE
  FOTO
  HISTORICO_ACADEMICO
  COMPROVANTE_MATRICULA
  CURRICULO
  CARTA_MOTIVACAO
  CARTA_RECOMENDACAO
  CERTIFICADO_IDIOMA
  PORTFOLIO
  PLANO_ESTUDOS
  CARTA_ACEITE
  VISTO
  SEGURO
  COMPROVANTE_FINANCEIRO
  AUTORIZACAO_RESPONSAVEL
  OUTRO
}

enum MobilidadeStatusDocumento {
  NAO_ENVIADO
  ENVIADO
  EM_ANALISE
  APROVADO
  REJEITADO
  CORRECAO_SOLICITADA
  EXPIRADO
}

model MobilidadeInstituicaoParceira {
  id             Int      @id @default(autoincrement())
  instituicaoId  Int
  nome           String
  sigla          String?
  codigo         String?
  paisCodigo     String   @db.VarChar(2)
  paisNome       String?
  cidade         String?
  estadoProvincia String?
  endereco       String?
  cep            String?
  site           String?
  emailGeral     String?
  telefone       String?
  nomeContato    String?
  cargoContato   String?
  emailContato   String?
  telefoneContato String?
  observacoes    String?  @db.Text
  ativo          Boolean  @default(true)
  criadoPorId    Int?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  instituicao Instituicao @relation(fields: [instituicaoId], references: [id], onDelete: Cascade)
  criadoPor   User?       @relation("MobilidadeInstituicaoParceiraCriadaPor", fields: [criadoPorId], references: [id], onDelete: SetNull)

  convenios MobilidadeConvenio[]
  programas MobilidadePrograma[]

  @@unique([instituicaoId, nome, paisCodigo])
  @@index([instituicaoId])
  @@index([paisCodigo])
  @@index([ativo])
  @@index([criadoPorId])
}

model MobilidadeConvenio {
  id                     Int                       @id @default(autoincrement())
  instituicaoId          Int
  instituicaoParceiraId  Int
  nome                   String
  codigo                 String?
  descricao              String?                   @db.Text
  direcao                MobilidadeDirecao         @default(BIDIRECIONAL)
  status                 MobilidadeStatusConvenio  @default(RASCUNHO)
  vigenciaInicio         DateTime?
  vigenciaFim            DateTime?
  reciprocidade          Boolean                   @default(true)
  vagasSaidaAno          Int?
  vagasEntradaAno        Int?
  isencaoTaxaAcademica   Boolean                   @default(false)
  observacoes            String?                   @db.Text
  criadoPorId            Int?
  createdAt              DateTime                  @default(now())
  updatedAt              DateTime                  @updatedAt

  instituicao         Instituicao                    @relation(fields: [instituicaoId], references: [id], onDelete: Cascade)
  instituicaoParceira MobilidadeInstituicaoParceira @relation(fields: [instituicaoParceiraId], references: [id], onDelete: Cascade)
  criadoPor           User?                          @relation("MobilidadeConvenioCriadoPor", fields: [criadoPorId], references: [id], onDelete: SetNull)

  cursos    MobilidadeConvenioCurso[]
  programas MobilidadePrograma[]

  @@unique([instituicaoId, codigo])
  @@index([instituicaoId])
  @@index([instituicaoParceiraId])
  @@index([status])
  @@index([vigenciaFim])
  @@index([criadoPorId])
}

model MobilidadeConvenioCurso {
  id            Int      @id @default(autoincrement())
  instituicaoId Int
  convenioId    Int
  cursoId       Int
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  instituicao Instituicao       @relation(fields: [instituicaoId], references: [id], onDelete: Cascade)
  convenio    MobilidadeConvenio @relation(fields: [convenioId], references: [id], onDelete: Cascade)
  curso       Curso              @relation(fields: [cursoId], references: [id], onDelete: Cascade)

  @@unique([convenioId, cursoId])
  @@index([instituicaoId])
  @@index([convenioId])
  @@index([cursoId])
}

model MobilidadePrograma {
  id                    Int                       @id @default(autoincrement())
  instituicaoId         Int
  convenioId            Int?
  instituicaoParceiraId Int?
  nome                  String
  codigo                String?
  descricao             String?                   @db.Text
  tipo                  MobilidadeTipoPrograma
  direcao               MobilidadeDirecao         @default(SAIDA)
  status                MobilidadeStatusPrograma  @default(RASCUNHO)
  idiomaPrincipal       String?
  nivelIdiomaMinimo     String?
  duracaoMinimaDias     Int?
  duracaoMaximaDias     Int?
  ativo                 Boolean                   @default(true)
  criadoPorId           Int?
  createdAt             DateTime                  @default(now())
  updatedAt             DateTime                  @updatedAt

  instituicao         Instituicao                     @relation(fields: [instituicaoId], references: [id], onDelete: Cascade)
  convenio            MobilidadeConvenio?             @relation(fields: [convenioId], references: [id], onDelete: SetNull)
  instituicaoParceira MobilidadeInstituicaoParceira?  @relation(fields: [instituicaoParceiraId], references: [id], onDelete: SetNull)
  criadoPor           User?                           @relation("MobilidadeProgramaCriadoPor", fields: [criadoPorId], references: [id], onDelete: SetNull)

  ofertas MobilidadeOferta[]

  @@unique([instituicaoId, codigo])
  @@index([instituicaoId])
  @@index([convenioId])
  @@index([instituicaoParceiraId])
  @@index([tipo])
  @@index([direcao])
  @@index([status])
  @@index([ativo])
  @@index([criadoPorId])
}

model MobilidadeOferta {
  id                       Int                      @id @default(autoincrement())
  instituicaoId            Int
  programaId               Int
  titulo                   String
  codigo                   String?
  descricao                String?                  @db.Text
  status                   MobilidadeStatusOferta  @default(RASCUNHO)
  ano                      Int?
  periodo                  String?
  inscricoesInicio         DateTime?
  inscricoesFim            DateTime?
  mobilidadeInicio         DateTime?
  mobilidadeFim            DateTime?
  vagas                    Int?
  permiteListaEspera       Boolean                  @default(true)
  criteriosElegibilidade   Json?
  instrucoes               String?                  @db.Text
  publicadoEm              DateTime?
  criadoPorId              Int?
  createdAt                DateTime                 @default(now())
  updatedAt                DateTime                 @updatedAt

  instituicao Instituicao       @relation(fields: [instituicaoId], references: [id], onDelete: Cascade)
  programa    MobilidadePrograma @relation(fields: [programaId], references: [id], onDelete: Cascade)
  criadoPor   User?              @relation("MobilidadeOfertaCriadaPor", fields: [criadoPorId], references: [id], onDelete: SetNull)

  cursos       MobilidadeOfertaCurso[]
  candidaturas MobilidadeCandidatura[]

  @@unique([instituicaoId, codigo])
  @@index([instituicaoId])
  @@index([programaId])
  @@index([status])
  @@index([inscricoesInicio])
  @@index([inscricoesFim])
  @@index([mobilidadeInicio])
  @@index([mobilidadeFim])
  @@index([criadoPorId])
}

model MobilidadeOfertaCurso {
  id            Int      @id @default(autoincrement())
  instituicaoId Int
  ofertaId      Int
  cursoId       Int
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  instituicao Instituicao      @relation(fields: [instituicaoId], references: [id], onDelete: Cascade)
  oferta      MobilidadeOferta @relation(fields: [ofertaId], references: [id], onDelete: Cascade)
  curso       Curso             @relation(fields: [cursoId], references: [id], onDelete: Cascade)

  @@unique([ofertaId, cursoId])
  @@index([instituicaoId])
  @@index([ofertaId])
  @@index([cursoId])
}

model MobilidadeCandidatura {
  id                     Int                          @id @default(autoincrement())
  instituicaoId          Int
  ofertaId               Int
  alunoId                Int?
  matriculaId            Int?
  vinculoCandidato       MobilidadeVinculoCandidato  @default(ALUNO_PHANYX)
  nomeSnapshot           String
  emailSnapshot          String?
  telefoneSnapshot       String?
  instituicaoOrigemNome  String?
  paisOrigemCodigo       String?                      @db.VarChar(2)
  status                 MobilidadeStatusCandidatura @default(RASCUNHO)
  motivoStatus           String?                      @db.Text
  enviadaEm              DateTime?
  analisadaEm            DateTime?
  notaFinal              Decimal?                     @db.Decimal(8, 2)
  classificacao          Int?
  criadoPorId            Int?
  analisadoPorId         Int?
  createdAt              DateTime                     @default(now())
  updatedAt              DateTime                     @updatedAt

  instituicao Instituicao     @relation(fields: [instituicaoId], references: [id], onDelete: Cascade)
  oferta      MobilidadeOferta @relation(fields: [ofertaId], references: [id], onDelete: Cascade)
  aluno       Aluno?           @relation(fields: [alunoId], references: [id], onDelete: SetNull)
  matricula   Matricula?       @relation(fields: [matriculaId], references: [id], onDelete: SetNull)
  criadoPor   User?            @relation("MobilidadeCandidaturaCriadaPor", fields: [criadoPorId], references: [id], onDelete: SetNull)
  analisadoPor User?           @relation("MobilidadeCandidaturaAnalisadaPor", fields: [analisadoPorId], references: [id], onDelete: SetNull)

  documentos MobilidadeCandidaturaDocumento[]

  @@unique([ofertaId, alunoId])
  @@index([instituicaoId])
  @@index([ofertaId])
  @@index([alunoId])
  @@index([matriculaId])
  @@index([status])
  @@index([vinculoCandidato])
  @@index([classificacao])
  @@index([criadoPorId])
  @@index([analisadoPorId])
}

model MobilidadeCandidaturaDocumento {
  id               Int                       @id @default(autoincrement())
  instituicaoId    Int
  candidaturaId    Int
  tipo             MobilidadeTipoDocumento
  titulo           String
  obrigatorio      Boolean                   @default(true)
  arquivoUrl       String?
  arquivoNome      String?
  mimeType         String?
  tamanho          Int?
  validadeAte      DateTime?
  status           MobilidadeStatusDocumento @default(NAO_ENVIADO)
  enviadoEm        DateTime?
  analisadoEm      DateTime?
  analisadoPorId   Int?
  motivoRejeicao   String?                   @db.Text
  observacoes      String?                   @db.Text
  createdAt        DateTime                  @default(now())
  updatedAt        DateTime                  @updatedAt

  instituicao  Instituicao         @relation(fields: [instituicaoId], references: [id], onDelete: Cascade)
  candidatura MobilidadeCandidatura @relation(fields: [candidaturaId], references: [id], onDelete: Cascade)
  analisadoPor User?                @relation("MobilidadeCandidaturaDocumentoAnalisadoPor", fields: [analisadoPorId], references: [id], onDelete: SetNull)

  @@index([instituicaoId])
  @@index([candidaturaId])
  @@index([tipo])
  @@index([status])
  @@index([validadeAte])
  @@index([analisadoPorId])
}
`;

schema = schema.trimEnd() + blocoMobilidade + "\n";

fs.writeFileSync(schemaPath, schema, "utf8");

console.log("");
console.log("✓ NÚCLEO DE MOBILIDADE INTERNACIONAL ADICIONADO AO PRISMA");
console.log("✓ Instituições parceiras");
console.log("✓ Convênios");
console.log("✓ Cursos abrangidos por convênio");
console.log("✓ Programas");
console.log("✓ Ofertas/Editais");
console.log("✓ Cursos elegíveis");
console.log("✓ Candidaturas internas e externas");
console.log("✓ Documentação de candidatura");
console.log("✓ Auditoria inicial por User");
console.log("✓ Estrutura multi-tenant por instituicaoId");

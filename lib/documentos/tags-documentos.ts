/*
 * PHANYX - Document tag compatibility layer
 *
 * IMPORTANT:
 * - Legacy Portuguese tags remain valid permanently.
 * - International English aliases are the preferred public tags.
 * - Do not rename persisted templates in the database automatically.
 */

export const DOCUMENT_TAG_ALIASES = {
  "assinaturaDiretor": "directorSignature",
  "atoLegalCriacao": "legalCreationAct",
  "avisoPrevio": "noticePeriod",
  "baseFgts": "fgtsBase",
  "baseInss": "inssBase",
  "baseIrrf": "irrfBase",
  "blocoAssinaturaDiretor": "directorSignatureBlock",
  "blocoAssinaturasRescisao": "terminationSignaturesBlock",
  "blocoDadosFuncionarioRescisao": "employeeTerminationDataBlock",
  "blocoEmpregadorColaborador": "employerEmployeeBlock",
  "blocoInstituicao": "institutionBlock",
  "blocoPolo": "campusBlock",
  "blocoRescisaoAssinaturaCompleto": "completeTerminationSignatureBlock",
  "blocoValoresRescisao": "terminationAmountsBlock",
  "blocoVerbasRescisorias": "terminationPayItemsBlock",
  "cargaHorariaCurso": "courseWorkload",
  "cargaHorariaMaximaCurso": "maximumCourseWorkload",
  "cargaHorariaMensalFuncionario": "employeeMonthlyWorkload",
  "cargaHorariaMinimaCurso": "minimumCourseWorkload",
  "cargoFuncionario": "employeeJobTitle",
  "cepInstituicao": "institutionPostalCode",
  "cepPolo": "campusPostalCode",
  "certificacaoDeclaracao": "declarationCertification",
  "cidadeAssinatura": "signatureCity",
  "cidadeInstituicao": "institutionCity",
  "cidadePolo": "campusCity",
  "cidAfastamento": "leaveIcdCode",
  "cnpjInstituicao": "institutionCnpj",
  "codigoFuncionario": "employeeCode",
  "codigoValidacao": "validationCode",
  "competenciaAno": "payrollReferenceYear",
  "competenciaHolerite": "payslipReferencePeriod",
  "competenciaMes": "payrollReferenceMonth",
  "cpfAluno": "studentCpf",
  "cpfFuncionario": "employeeCpf",
  "cpfTitularContrato": "contractHolderCpf",
  "crmMedico": "physicianCrm",
  "curriculoAluno": "studentCurriculum",
  "curso": "course",
  "dataAdmissaoFuncionario": "employeeHireDate",
  "dataAdvertencia": "warningDate",
  "dataAso": "occupationalHealthExamDate",
  "dataAtual": "currentDate",
  "dataConclusao": "completionDate",
  "dataConclusaoAluno": "studentCompletionDate",
  "dataDemissao": "dismissalDate",
  "dataDesligamentoFuncionario": "employeeTerminationDate",
  "dataEmissao": "issueDate",
  "dataFimAfastamento": "leaveEndDate",
  "dataFimSuspensao": "suspensionEndDate",
  "dataHoraEmissao": "issueDateTime",
  "dataInicioAfastamento": "leaveStartDate",
  "dataInicioAluno": "studentStartDate",
  "dataInicioSuspensao": "suspensionStartDate",
  "dataMatricula": "enrollmentDate",
  "dataNascimentoAluno": "studentBirthDate",
  "dataPagamentoFerias": "vacationPaymentDate",
  "dataPericia": "medicalAssessmentDate",
  "dataPublicacaoAutorizacao": "authorizationPublicationDate",
  "dataRetornoTrabalho": "returnToWorkDate",
  "decimoTerceiroProporcional": "proportionalThirteenthSalary",
  "departamentoFuncionario": "employeeDepartment",
  "descricaoAdvertencia": "warningDescription",
  "descricaoSuspensao": "suspensionDescription",
  "diarioOficialAutorizacao": "authorizationOfficialGazette",
  "diasAfastamento": "leaveDays",
  "diasFerias": "vacationDays",
  "diasSuspensao": "suspensionDays",
  "disciplinas": "subjects",
  "disciplinasBaseNacionalComum": "nationalCommonCoreSubjects",
  "disciplinasParteDiversificada": "diversifiedCurriculumSubjects",
  "disciplinasPorSemestre": "subjectsBySemester",
  "emailInstituicao": "institutionEmail",
  "emailPolo": "campusEmail",
  "emailTitularContrato": "contractHolderEmail",
  "enderecoInstituicao": "institutionAddress",
  "enderecoPolo": "campusAddress",
  "escolaOrigem": "previousSchool",
  "estadoInstituicao": "institutionState",
  "estadoPolo": "campusState",
  "eventosHolerite": "payslipEvents",
  "feriasProporcionais": "proportionalVacationPay",
  "feriasVencidas": "accruedVacationPay",
  "fgtsMes": "monthlyFgts",
  "formaIngressoAluno": "studentAdmissionMethod",
  "haMaximaCurso": "maximumCourseClassHours",
  "haTotalAprovada": "totalApprovedClassHours",
  "haTotalCursada": "totalCompletedClassHours",
  "horaEmissao": "issueTime",
  "indiceAproveitamentoAcumulado": "cumulativePerformanceIndex",
  "indiceAproveitamentoAprovadas": "approvedPerformanceIndex",
  "indiceAproveitamentoSemestral": "semesterPerformanceIndex",
  "legendaHistorico": "transcriptLegend",
  "logoInstituicao": "institutionLogo",
  "matriculaAluno": "studentEnrollment",
  "medicoResponsavel": "responsiblePhysician",
  "motivoAdvertencia": "warningReason",
  "motivoAfastamento": "leaveReason",
  "motivoDemissao": "dismissalReason",
  "motivoSuspensao": "suspensionReason",
  "nacionalidadeAluno": "studentNationality",
  "naturalidadeAluno": "studentPlaceOfBirth",
  "nomeAluno": "studentName",
  "nomeFuncionario": "employeeName",
  "nomeInstituicao": "institutionName",
  "nomePolo": "campusName",
  "nomeTitularContrato": "contractHolderName",
  "numeroAso": "occupationalHealthExamNumber",
  "numeroAutorizacaoCurso": "courseAuthorizationNumber",
  "numeroDocumento": "documentNumber",
  "numeroMatricula": "enrollmentNumber",
  "observacoesAso": "occupationalHealthExamNotes",
  "observacoesHistorico": "transcriptNotes",
  "orgaoExpedidorAluno": "studentIdIssuingAuthority",
  "parentescoTitularContrato": "contractHolderRelationship",
  "percentualConclusao": "completionPercentage",
  "periodoAquisitivoFim": "accrualPeriodEnd",
  "periodoAquisitivoInicio": "accrualPeriodStart",
  "periodoGozoFim": "vacationPeriodEnd",
  "periodoGozoInicio": "vacationPeriodStart",
  "pisPasepFuncionario": "employeePisPasep",
  "prazoIntegralizacao": "completionTimeLimit",
  "provavelSemestreFormatura": "expectedGraduationSemester",
  "referenciaFinanceira": "financialReference",
  "responsavelLegal": "legalRepresentative",
  "resultadoAso": "occupationalHealthExamResult",
  "resultadoPericia": "medicalAssessmentResult",
  "rgAluno": "studentRg",
  "rgFuncionario": "employeeRg",
  "salarioBaseFuncionario": "employeeBaseSalary",
  "saldoSalario": "salaryBalance",
  "semestreAtual": "currentSemester",
  "semestresCursados": "completedSemesters",
  "semestresRevalidados": "validatedSemesters",
  "sexoAluno": "studentSex",
  "situacaoAcademicaAluno": "studentAcademicStatus",
  "statusAluno": "studentStatus",
  "statusMatricula": "enrollmentStatus",
  "telefoneInstituicao": "institutionPhone",
  "telefonePolo": "campusPhone",
  "telefoneTitularContrato": "contractHolderPhone",
  "tipoAfastamento": "leaveType",
  "tipoAso": "occupationalHealthExamType",
  "tipoContratoFuncionario": "employeeContractType",
  "tipoRescisao": "terminationType",
  "tipoTitularContrato": "contractHolderType",
  "tituloDocumento": "documentTitle",
  "totalAulasBaseNacionalComum": "nationalCommonCoreTotalClasses",
  "totalAulasParteDiversificada": "diversifiedCurriculumTotalClasses",
  "totalCargaHorariaAnualAulas": "annualClassHoursTotal",
  "totalCargaHorariaAnualHoras": "annualClockHoursTotal",
  "totalDescontos": "totalDeductions",
  "totalVencimentos": "totalEarnings",
  "urlValidacao": "validationUrl",
  "valorContrato": "contractAmount",
  "valorFerias": "vacationPayAmount",
  "valorLiquido": "netAmount",
  "valorLiquidoFerias": "netVacationPay",
  "valorRescisao": "terminationAmount",
  "valorTercoConstitucional": "constitutionalVacationBonus",
} as const;

export type LegacyDocumentTag =
  keyof typeof DOCUMENT_TAG_ALIASES;

export type InternationalDocumentTag =
  (typeof DOCUMENT_TAG_ALIASES)[LegacyDocumentTag];

const DOCUMENT_TAG_LEGACY_BY_ALIAS =
  Object.fromEntries(
    Object.entries(
      DOCUMENT_TAG_ALIASES
    ).map(
      ([legacy, alias]) => [
        alias,
        legacy,
      ]
    )
  ) as Record<
    InternationalDocumentTag,
    LegacyDocumentTag
  >;

export function normalizeDocumentTagKey(
  value: string
) {
  return String(value || "")
    .trim()
    .replace(/^\{\{\s*/, "")
    .replace(/\s*\}\}$/, "");
}

export function getLegacyDocumentTagKey(
  value: string
) {
  const key =
    normalizeDocumentTagKey(
      value
    );

  return (
    DOCUMENT_TAG_LEGACY_BY_ALIAS[
      key as InternationalDocumentTag
    ] ??
    key
  );
}

export function getInternationalDocumentTagKey(
  value: string
) {
  const legacy =
    getLegacyDocumentTagKey(
      value
    );

  return (
    DOCUMENT_TAG_ALIASES[
      legacy as LegacyDocumentTag
    ] ??
    legacy
  );
}

export function getInternationalDocumentTag(
  value: string
) {
  return `{{${getInternationalDocumentTagKey(
    value
  )}}}`;
}

export function getLegacyDocumentTag(
  value: string
) {
  return `{{${getLegacyDocumentTagKey(
    value
  )}}}`;
}

function escapeDocumentTagRegex(
  value: string
) {
  return value.replace(
    /[.*+?^\${}()|[\]\\]/g,
    "\\$&"
  );
}

export function expandDocumentTagValues(
  values: Record<
    string,
    string | null | undefined
  >
) {
  const expanded: Record<
    string,
    string | null | undefined
  > = {};

  for (
    const [rawKey, rawValue]
    of Object.entries(values)
  ) {
    const suppliedKey =
      normalizeDocumentTagKey(
        rawKey
      );

    if (!suppliedKey) {
      continue;
    }

    const legacyKey =
      getLegacyDocumentTagKey(
        suppliedKey
      );

    const internationalKey =
      getInternationalDocumentTagKey(
        legacyKey
      );

    expanded[suppliedKey] =
      rawValue;

    expanded[legacyKey] =
      rawValue;

    expanded[internationalKey] =
      rawValue;
  }

  return expanded;
}

export function replaceDocumentTags(
  source: string,
  values: Record<
    string,
    string | null | undefined
  >
) {
  let result =
    String(source ?? "");

  for (
    const [rawKey, rawValue]
    of Object.entries(values)
  ) {
    const suppliedKey =
      normalizeDocumentTagKey(
        rawKey
      );

    const legacyKey =
      getLegacyDocumentTagKey(
        suppliedKey
      );

    const internationalKey =
      getInternationalDocumentTagKey(
        legacyKey
      );

    const value =
      rawValue == null
        ? ""
        : String(rawValue);

    const candidates =
      new Set([
        suppliedKey,
        legacyKey,
        internationalKey,
      ]);

    for (
      const candidate
      of candidates
    ) {
      if (!candidate) {
        continue;
      }

      const safe =
        escapeDocumentTagRegex(
          candidate
        );

      result =
        result.replace(
          new RegExp(
            `{{\\s*${safe}\\s*}}`,
            "g"
          ),
          () => value
        );
    }
  }

  return result;
}

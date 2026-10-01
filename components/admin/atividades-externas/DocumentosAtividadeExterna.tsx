"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocale,
  useTranslations,
} from "next-intl";

type TipoDocumento =
  | "ROTEIRO"
  | "TERMO_AUTORIZACAO"
  | "AUTORIZACAO_ASSINADA"
  | "CONTRATO_TRANSPORTE"
  | "CONTRATO_HOSPEDAGEM"
  | "SEGURO_VIAGEM"
  | "APOLICE_TRANSPORTE"
  | "LICENCA_PRESTADOR"
  | "DOCUMENTO_VEICULO"
  | "DOCUMENTO_CONDUTOR"
  | "AVALIACAO_RISCO"
  | "PLANO_EMERGENCIA"
  | "COMPROVANTE_RESERVA"
  | "PASSAGEM"
  | "HOSPEDAGEM"
  | "PASSAPORTE"
  | "VISTO"
  | "DOCUMENTO_MEDICO"
  | "LISTA_PARTICIPANTES"
  | "OUTRO";

type StatusDocumento =
  | "ATIVO"
  | "PENDENTE"
  | "EM_ANALISE"
  | "APROVADO"
  | "REJEITADO"
  | "VENCIDO"
  | "SUBSTITUIDO"
  | "ARQUIVADO";

type Participante = {
  id: number;
  alunoId: number;
  nome: string;
  matricula?: string | null;
  statusParticipacao: string;
};

type Prestador = {
  id: number;
  nome: string;
  nomeFantasia?: string | null;
  tipo?: string | null;
};

type Veiculo = {
  id: number;
  prestadorTransporteId?: number | null;
  nomeIdentificacao?: string | null;
  placa?: string | null;
  marca?: string | null;
  modelo?: string | null;

  prestadorTransporte?: {
    id: number;
    nome: string;
    nomeFantasia?: string | null;
  } | null;
};

type Documento = {
  id: number;
  tipo: TipoDocumento;
  titulo: string;

  descricao?: string | null;

  arquivoNome?: string | null;
  mimeType?: string | null;
  tamanho?: number | null;
  temArquivo: boolean;
  conteudoUrl?: string | null;

  numeroDocumento?: string | null;

  emitidoEm?: string | null;
  validoAte?: string | null;

  obrigatorio: boolean;
  confidencial: boolean;

  status: StatusDocumento;

  observacao?: string | null;

  participanteId?: number | null;
  prestadorTransporteId?: number | null;
  veiculoId?: number | null;

  participante?: {
    id: number;
    nome: string;
    matricula?: string | null;
  } | null;

  prestadorTransporte?: Prestador | null;

  veiculo?: {
    id: number;
    nomeIdentificacao?: string | null;
    placa?: string | null;
    marca?: string | null;
    modelo?: string | null;
  } | null;

  enviadoPor?: {
    id: number;
    nome: string;
  } | null;

  atualizadoPor?: {
    id: number;
    nome: string;
  } | null;

  createdAt: string;
  updatedAt: string;

  vencidoPorData: boolean;
  venceEmBreve: boolean;
  diasParaVencer?: number | null;
};

type Resumo = {
  total: number;
  obrigatorios: number;
  pendentesOuEmAnalise: number;
  vencidos: number;
  vencemEmBreve: number;
  confidenciais: number;
};

type RespostaApi = {
  ok?: boolean;

  podeGerenciar?: boolean;

  tipos?: TipoDocumento[];

  statusDisponiveis?: StatusDocumento[];

  resumo?: Resumo;

  documentos?: Documento[];

  participantes?: Participante[];

  prestadores?: Prestador[];

  veiculos?: Veiculo[];

  error?: string;
};

type Formulario = {
  tipo: TipoDocumento | "";

  titulo: string;
  descricao: string;

  numeroDocumento: string;

  emitidoEm: string;
  validoAte: string;

  participanteId: string;
  prestadorTransporteId: string;
  veiculoId: string;

  obrigatorio: boolean;
  confidencial: boolean;

  status: StatusDocumento;

  observacao: string;
};

type Props = {
  atividadeId: number;

  onDocumentosAlterados?: () => void;
};

const TIPOS: TipoDocumento[] = [
  "ROTEIRO",
  "TERMO_AUTORIZACAO",
  "AUTORIZACAO_ASSINADA",
  "CONTRATO_TRANSPORTE",
  "CONTRATO_HOSPEDAGEM",
  "SEGURO_VIAGEM",
  "APOLICE_TRANSPORTE",
  "LICENCA_PRESTADOR",
  "DOCUMENTO_VEICULO",
  "DOCUMENTO_CONDUTOR",
  "AVALIACAO_RISCO",
  "PLANO_EMERGENCIA",
  "COMPROVANTE_RESERVA",
  "PASSAGEM",
  "HOSPEDAGEM",
  "PASSAPORTE",
  "VISTO",
  "DOCUMENTO_MEDICO",
  "LISTA_PARTICIPANTES",
  "OUTRO",
];

const STATUS_EDITAVEIS: StatusDocumento[] = [
  "ATIVO",
  "PENDENTE",
  "EM_ANALISE",
  "APROVADO",
  "REJEITADO",
  "VENCIDO",
];

const LIMITE_BYTES =
  25 * 1024 * 1024;

const ACCEPT =
  ".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.doc,.docx,.xls,.xlsx";

function formularioVazio(): Formulario {
  return {
    tipo:
      "",

    titulo:
      "",

    descricao:
      "",

    numeroDocumento:
      "",

    emitidoEm:
      "",

    validoAte:
      "",

    participanteId:
      "",

    prestadorTransporteId:
      "",

    veiculoId:
      "",

    obrigatorio:
      false,

    confidencial:
      false,

    status:
      "PENDENTE",

    observacao:
      "",
  };
}

function dataCampo(
  valor?: string | null
) {
  if (!valor) {
    return "";
  }

  return valor.slice(
    0,
    10
  );
}

function bytesLegiveis(
  bytes?: number | null
) {
  if (
    !bytes ||
    bytes <= 0
  ) {
    return "";
  }

  if (
    bytes <
    1024
  ) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes /
      1024
    ).toFixed(
      1
    )} KB`;
  }

  return `${(
    bytes /
    (
      1024 *
      1024
    )
  ).toFixed(
    1
  )} MB`;
}

function mimeArquivo(
  arquivo: File
) {
  const informado =
    String(
      arquivo.type ||
        ""
    )
      .trim()
      .toLowerCase();

  if (informado) {
    return informado;
  }

  const extensao =
    arquivo.name
      .split(".")
      .pop()
      ?.toLowerCase() ||
    "";

  const porExtensao:
    Record<
      string,
      string
    > = {
      pdf:
        "application/pdf",

      jpg:
        "image/jpeg",

      jpeg:
        "image/jpeg",

      png:
        "image/png",

      webp:
        "image/webp",

      heic:
        "image/heic",

      heif:
        "image/heif",

      doc:
        "application/msword",

      docx:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

      xls:
        "application/vnd.ms-excel",

      xlsx:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };

  return (
    porExtensao[
      extensao
    ] ||
    ""
  );
}

export default function DocumentosAtividadeExterna({
  atividadeId,
  onDocumentosAlterados,
}: Props) {
  const t =
    useTranslations(
      "AdminExternalActivityDocuments"
    );

  const locale =
    useLocale();

  const [
    carregando,
    setCarregando,
  ] =
    useState(
      true
    );

  const [
    salvando,
    setSalvando,
  ] =
    useState(
      false
    );

  const [
    enviandoArquivo,
    setEnviandoArquivo,
  ] =
    useState(
      false
    );

  const [
    podeGerenciar,
    setPodeGerenciar,
  ] =
    useState(
      false
    );

  const [
    documentos,
    setDocumentos,
  ] =
    useState<
      Documento[]
    >(
      []
    );

  const [
    participantes,
    setParticipantes,
  ] =
    useState<
      Participante[]
    >(
      []
    );

  const [
    prestadores,
    setPrestadores,
  ] =
    useState<
      Prestador[]
    >(
      []
    );

  const [
    veiculos,
    setVeiculos,
  ] =
    useState<
      Veiculo[]
    >(
      []
    );

  const [
    resumo,
    setResumo,
  ] =
    useState<Resumo>({
      total:
        0,

      obrigatorios:
        0,

      pendentesOuEmAnalise:
        0,

      vencidos:
        0,

      vencemEmBreve:
        0,

      confidenciais:
        0,
    });

  const [
    busca,
    setBusca,
  ] =
    useState(
      ""
    );

  const [
    filtroTipo,
    setFiltroTipo,
  ] =
    useState<
      TipoDocumento |
      "TODOS"
    >(
      "TODOS"
    );

  const [
    filtroStatus,
    setFiltroStatus,
  ] =
    useState<
      StatusDocumento |
      "TODOS"
    >(
      "TODOS"
    );

  const [
    filtroVinculo,
    setFiltroVinculo,
  ] =
    useState<
      "TODOS" |
      "PARTICIPANTE" |
      "VEICULO" |
      "PRESTADOR" |
      "GERAL"
    >(
      "TODOS"
    );

  const [
    mostrarHistorico,
    setMostrarHistorico,
  ] =
    useState(
      false
    );

  const [
    formulario,
    setFormulario,
  ] =
    useState<Formulario>(
      formularioVazio()
    );

  const [
    arquivoSelecionado,
    setArquivoSelecionado,
  ] =
    useState<
      File | null
    >(
      null
    );

  const [
    modalAberto,
    setModalAberto,
  ] =
    useState(
      false
    );

  const [
    documentoEditando,
    setDocumentoEditando,
  ] =
    useState<
      Documento | null
    >(
      null
    );

  const [
    documentoSubstituindo,
    setDocumentoSubstituindo,
  ] =
    useState<
      Documento | null
    >(
      null
    );

  const [
    erro,
    setErro,
  ] =
    useState(
      ""
    );

  const [
    sucesso,
    setSucesso,
  ] =
    useState(
      ""
    );

  async function carregar() {
    setCarregando(
      true
    );

    setErro(
      ""
    );

    try {
      const resposta =
        await fetch(
          `/api/admin/atividades-externas/${atividadeId}/documentos`,
          {
            credentials:
              "include",

            cache:
              "no-store",
          }
        );

      const corpo =
        (
          await resposta.json()
        ) as RespostaApi;

      if (
        !resposta.ok ||
        !corpo.ok
      ) {
        throw new Error(
          corpo.error ||
            "ERRO"
        );
      }

      setPodeGerenciar(
        Boolean(
          corpo
            .podeGerenciar
        )
      );

      setDocumentos(
        corpo.documentos ||
          []
      );

      setParticipantes(
        corpo.participantes ||
          []
      );

      setPrestadores(
        corpo.prestadores ||
          []
      );

      setVeiculos(
        corpo.veiculos ||
          []
      );

      setResumo(
        corpo.resumo || {
          total:
            0,

          obrigatorios:
            0,

          pendentesOuEmAnalise:
            0,

          vencidos:
            0,

          vencemEmBreve:
            0,

          confidenciais:
            0,
        }
      );
    } catch {
      setErro(
        t(
          "errors.load"
        )
      );
    } finally {
      setCarregando(
        false
      );
    }
  }

  useEffect(
    () => {
      void carregar();
    },
    [
      atividadeId,
    ]
  );

  const documentosFiltrados =
    useMemo(
      () => {
        const termo =
          busca
            .trim()
            .toLocaleLowerCase(
              locale
            );

        return documentos.filter(
          (
            documento
          ) => {
            if (
              !mostrarHistorico &&
              (
                documento.status ===
                  "ARQUIVADO" ||
                documento.status ===
                  "SUBSTITUIDO"
              )
            ) {
              return false;
            }

            if (
              filtroTipo !==
                "TODOS" &&
              documento.tipo !==
                filtroTipo
            ) {
              return false;
            }

            if (
              filtroStatus !==
                "TODOS" &&
              documento.status !==
                filtroStatus
            ) {
              return false;
            }

            if (
              filtroVinculo ===
                "PARTICIPANTE" &&
              !documento
                .participanteId
            ) {
              return false;
            }

            if (
              filtroVinculo ===
                "VEICULO" &&
              !documento
                .veiculoId
            ) {
              return false;
            }

            if (
              filtroVinculo ===
                "PRESTADOR" &&
              !documento
                .prestadorTransporteId
            ) {
              return false;
            }

            if (
              filtroVinculo ===
                "GERAL" &&
              (
                documento
                  .participanteId ||
                documento
                  .veiculoId ||
                documento
                  .prestadorTransporteId
              )
            ) {
              return false;
            }

            if (!termo) {
              return true;
            }

            const texto =
              [
                documento
                  .titulo,

                documento
                  .numeroDocumento,

                documento
                  .arquivoNome,

                documento
                  .participante
                  ?.nome,

                documento
                  .prestadorTransporte
                  ?.nome,

                documento
                  .prestadorTransporte
                  ?.nomeFantasia,

                documento
                  .veiculo
                  ?.nomeIdentificacao,

                documento
                  .veiculo
                  ?.placa,
              ]
                .filter(
                  Boolean
                )
                .join(
                  " "
                )
                .toLocaleLowerCase(
                  locale
                );

            return texto.includes(
              termo
            );
          }
        );
      },
      [
        busca,
        documentos,
        filtroStatus,
        filtroTipo,
        filtroVinculo,
        locale,
        mostrarHistorico,
      ]
    );

  const veiculosFormulario =
    useMemo(
      () => {
        const prestadorId =
          Number(
            formulario
              .prestadorTransporteId
          );

        if (
          !Number.isInteger(
            prestadorId
          ) ||
          prestadorId <=
            0
        ) {
          return veiculos;
        }

        return veiculos.filter(
          (
            veiculo
          ) =>
            veiculo
              .prestadorTransporteId ===
            prestadorId
        );
      },
      [
        formulario
          .prestadorTransporteId,
        veiculos,
      ]
    );

  function limparMensagens() {
    setErro(
      ""
    );

    setSucesso(
      ""
    );
  }

  function fecharModal() {
    if (
      salvando ||
      enviandoArquivo
    ) {
      return;
    }

    setModalAberto(
      false
    );

    setDocumentoEditando(
      null
    );

    setDocumentoSubstituindo(
      null
    );

    setArquivoSelecionado(
      null
    );

    setFormulario(
      formularioVazio()
    );

    limparMensagens();
  }

  function abrirNovo() {
    limparMensagens();

    setDocumentoEditando(
      null
    );

    setDocumentoSubstituindo(
      null
    );

    setArquivoSelecionado(
      null
    );

    setFormulario(
      formularioVazio()
    );

    setModalAberto(
      true
    );
  }

  function abrirEdicao(
    documento: Documento
  ) {
    limparMensagens();

    setDocumentoEditando(
      documento
    );

    setDocumentoSubstituindo(
      null
    );

    setArquivoSelecionado(
      null
    );

    setFormulario({
      tipo:
        documento.tipo,

      titulo:
        documento.titulo,

      descricao:
        documento
          .descricao ||
        "",

      numeroDocumento:
        documento
          .numeroDocumento ||
        "",

      emitidoEm:
        dataCampo(
          documento
            .emitidoEm
        ),

      validoAte:
        dataCampo(
          documento
            .validoAte
        ),

      participanteId:
        documento
          .participanteId
          ?.toString() ||
        "",

      prestadorTransporteId:
        documento
          .prestadorTransporteId
          ?.toString() ||
        "",

      veiculoId:
        documento
          .veiculoId
          ?.toString() ||
        "",

      obrigatorio:
        documento
          .obrigatorio,

      confidencial:
        documento
          .confidencial,

      status:
        documento.status,

      observacao:
        documento
          .observacao ||
        "",
    });

    setModalAberto(
      true
    );
  }

  function abrirSubstituicao(
    documento: Documento
  ) {
    limparMensagens();

    setDocumentoEditando(
      null
    );

    setDocumentoSubstituindo(
      documento
    );

    setArquivoSelecionado(
      null
    );

    setFormulario({
      tipo:
        documento.tipo,

      titulo:
        documento.titulo,

      descricao:
        documento
          .descricao ||
        "",

      numeroDocumento:
        documento
          .numeroDocumento ||
        "",

      emitidoEm:
        dataCampo(
          documento
            .emitidoEm
        ),

      validoAte:
        dataCampo(
          documento
            .validoAte
        ),

      participanteId:
        documento
          .participanteId
          ?.toString() ||
        "",

      prestadorTransporteId:
        documento
          .prestadorTransporteId
          ?.toString() ||
        "",

      veiculoId:
        documento
          .veiculoId
          ?.toString() ||
        "",

      obrigatorio:
        documento
          .obrigatorio,

      confidencial:
        documento
          .confidencial,

      status:
        "PENDENTE",

      observacao:
        documento
          .observacao ||
        "",
    });

    setModalAberto(
      true
    );
  }

  function alterarCampo<
    K extends keyof Formulario
  >(
    campo: K,
    valor: Formulario[K]
  ) {
    setFormulario(
      (
        atual
      ) => ({
        ...atual,
        [campo]:
          valor,
      })
    );
  }

  function selecionarArquivo(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    limparMensagens();

    const arquivo =
      event.target
        .files?.[0] ||
      null;

    if (!arquivo) {
      setArquivoSelecionado(
        null
      );

      return;
    }

    if (
      arquivo.size >
      LIMITE_BYTES
    ) {
      setArquivoSelecionado(
        null
      );

      event.target.value =
        "";

      setErro(
        t(
          "errors.fileTooLarge"
        )
      );

      return;
    }

    const mime =
      mimeArquivo(
        arquivo
      );

    if (!mime) {
      setArquivoSelecionado(
        null
      );

      event.target.value =
        "";

      setErro(
        t(
          "errors.invalidFile"
        )
      );

      return;
    }

    setArquivoSelecionado(
      arquivo
    );
  }

  async function enviarArquivo(
    documentoId: number,
    arquivo: File
  ) {
    setEnviandoArquivo(
      true
    );

    try {
      const mimeType =
        mimeArquivo(
          arquivo
        );

      const respostaInicio =
        await fetch(
          `/api/admin/atividades-externas/${atividadeId}/documentos/${documentoId}/upload`,
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                nomeOriginal:
                  arquivo.name,

                mimeType,

                tamanhoBytes:
                  arquivo.size,
              }),
          }
        );

      const corpoInicio =
        (
          await respostaInicio.json()
        ) as {
          ok?: boolean;
          error?: string;
          presignedUrl?: string;
          pathname?: string;
          mimeType?: string;
        };

      if (
        !respostaInicio.ok ||
        !corpoInicio.ok ||
        !corpoInicio
          .presignedUrl ||
        !corpoInicio
          .pathname ||
        !corpoInicio
          .mimeType
      ) {
        throw new Error(
          corpoInicio.error ||
            "UPLOAD"
        );
      }

      const respostaBlob =
        await fetch(
          corpoInicio
            .presignedUrl,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                corpoInicio
                  .mimeType,
            },

            body:
              arquivo,
          }
        );

      if (
        !respostaBlob.ok
      ) {
        throw new Error(
          "BLOB"
        );
      }

      const respostaFinal =
        await fetch(
          `/api/admin/atividades-externas/${atividadeId}/documentos/${documentoId}/upload/finalizar`,
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                pathname:
                  corpoInicio
                    .pathname,

                nomeOriginal:
                  arquivo.name,
              }),
          }
        );

      const corpoFinal =
        (
          await respostaFinal.json()
        ) as {
          ok?: boolean;
          error?: string;
        };

      if (
        !respostaFinal.ok ||
        !corpoFinal.ok
      ) {
        throw new Error(
          corpoFinal.error ||
            "FINALIZAR"
        );
      }
    } finally {
      setEnviandoArquivo(
        false
      );
    }
  }

  async function salvar(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    limparMensagens();

    if (
      !formulario.tipo ||
      !formulario
        .titulo.trim()
    ) {
      setErro(
        t(
          "errors.required"
        )
      );

      return;
    }

    if (
      documentoSubstituindo &&
      !arquivoSelecionado
    ) {
      setErro(
        t(
          "errors.replacementFileRequired"
        )
      );

      return;
    }

    setSalvando(
      true
    );

    try {
      let documentoId:
        number;

      if (
        documentoSubstituindo
      ) {
        const preparar =
          await fetch(
            `/api/admin/atividades-externas/${atividadeId}/documentos`,
            {
              method:
                "POST",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  acao:
                    "PREPARAR_SUBSTITUICAO",

                  documentoId:
                    documentoSubstituindo
                      .id,
                }),
            }
          );

        const corpoPreparar =
          (
            await preparar.json()
          ) as {
            ok?: boolean;
            error?: string;

            substituicao?: {
              documentoAnteriorId:
                number;

              documentoNovoId:
                number;
            };
          };

        if (
          !preparar.ok ||
          !corpoPreparar.ok ||
          !corpoPreparar
            .substituicao
        ) {
          throw new Error(
            corpoPreparar.error ||
              "PREPARAR"
          );
        }

        documentoId =
          corpoPreparar
            .substituicao
            .documentoNovoId;

        /*
         * Permite atualizar datas, numero,
         * descricao e observacao da nova versao
         * antes do arquivo ser enviado.
         */
        const respostaMetadados =
          await fetch(
            `/api/admin/atividades-externas/${atividadeId}/documentos`,
            {
              method:
                "POST",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  acao:
                    "ATUALIZAR",

                  documentoId,

                  ...formulario,
                }),
            }
          );

        const corpoMetadados =
          (
            await respostaMetadados.json()
          ) as {
            ok?: boolean;
            error?: string;
          };

        if (
          !respostaMetadados.ok ||
          !corpoMetadados.ok
        ) {
          throw new Error(
            corpoMetadados.error ||
              "METADADOS"
          );
        }

        await enviarArquivo(
          documentoId,
          arquivoSelecionado!
        );

        const finalizar =
          await fetch(
            `/api/admin/atividades-externas/${atividadeId}/documentos`,
            {
              method:
                "POST",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  acao:
                    "FINALIZAR_SUBSTITUICAO",

                  documentoAnteriorId:
                    documentoSubstituindo
                      .id,

                  documentoNovoId:
                    documentoId,
                }),
            }
          );

        const corpoFinalizar =
          (
            await finalizar.json()
          ) as {
            ok?: boolean;
            error?: string;
          };

        if (
          !finalizar.ok ||
          !corpoFinalizar.ok
        ) {
          throw new Error(
            corpoFinalizar.error ||
              "SUBSTITUIR"
          );
        }
      } else if (
        documentoEditando
      ) {
        documentoId =
          documentoEditando.id;

        const resposta =
          await fetch(
            `/api/admin/atividades-externas/${atividadeId}/documentos`,
            {
              method:
                "POST",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  acao:
                    "ATUALIZAR",

                  documentoId,

                  ...formulario,
                }),
            }
          );

        const corpo =
          (
            await resposta.json()
          ) as {
            ok?: boolean;
            error?: string;
          };

        if (
          !resposta.ok ||
          !corpo.ok
        ) {
          throw new Error(
            corpo.error ||
              "ATUALIZAR"
          );
        }

        if (
          arquivoSelecionado &&
          !documentoEditando
            .temArquivo
        ) {
          await enviarArquivo(
            documentoId,
            arquivoSelecionado
          );
        }
      } else {
        const resposta =
          await fetch(
            `/api/admin/atividades-externas/${atividadeId}/documentos`,
            {
              method:
                "POST",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  acao:
                    "CRIAR",

                  ...formulario,
                }),
            }
          );

        const corpo =
          (
            await resposta.json()
          ) as {
            ok?: boolean;
            error?: string;

            documento?: {
              id: number;
            };
          };

        if (
          !resposta.ok ||
          !corpo.ok ||
          !corpo.documento
        ) {
          throw new Error(
            corpo.error ||
              "CRIAR"
          );
        }

        documentoId =
          corpo.documento.id;

        if (
          arquivoSelecionado
        ) {
          await enviarArquivo(
            documentoId,
            arquivoSelecionado
          );
        }
      }

      await carregar();

      onDocumentosAlterados?.();

      setSucesso(
        documentoSubstituindo
          ? t(
              "messages.replaced"
            )
          : documentoEditando
          ? t(
              "messages.updated"
            )
          : t(
              "messages.created"
            )
      );

      setModalAberto(
        false
      );

      setDocumentoEditando(
        null
      );

      setDocumentoSubstituindo(
        null
      );

      setArquivoSelecionado(
        null
      );

      setFormulario(
        formularioVazio()
      );
    } catch {
      setErro(
        t(
          "errors.save"
        )
      );
    } finally {
      setSalvando(
        false
      );
    }
  }

  async function alterarStatus(
    documento: Documento,
    status: StatusDocumento
  ) {
    limparMensagens();

    try {
      const resposta =
        await fetch(
          `/api/admin/atividades-externas/${atividadeId}/documentos`,
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                acao:
                  "ALTERAR_STATUS",

                documentoId:
                  documento.id,

                status,
              }),
          }
        );

      const corpo =
        (
          await resposta.json()
        ) as {
          ok?: boolean;
          error?: string;
        };

      if (
        !resposta.ok ||
        !corpo.ok
      ) {
        throw new Error(
          corpo.error ||
            "STATUS"
        );
      }

      await carregar();

      onDocumentosAlterados?.();

      setSucesso(
        t(
          status ===
            "ARQUIVADO"
            ? "messages.archived"
            : "messages.statusChanged"
        )
      );
    } catch {
      setErro(
        t(
          "errors.status"
        )
      );
    }
  }

  function abrirDocumento(
    documento: Documento,
    download:
      boolean
  ) {
    if (
      !documento
        .conteudoUrl
    ) {
      return;
    }

    const url =
      download
        ? `${documento.conteudoUrl}?download=1`
        : documento
            .conteudoUrl;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function vinculoDocumento(
    documento: Documento
  ) {
    if (
      documento
        .participante
    ) {
      return documento
        .participante
        .nome;
    }

    if (
      documento
        .veiculo
    ) {
      return (
        documento
          .veiculo
          .nomeIdentificacao ||
        documento
          .veiculo
          .placa ||
        t(
          "links.vehicle"
        )
      );
    }

    if (
      documento
        .prestadorTransporte
    ) {
      return (
        documento
          .prestadorTransporte
          .nomeFantasia ||
        documento
          .prestadorTransporte
          .nome
      );
    }

    return t(
      "links.general"
    );
  }

  function classeStatus(
    documento: Documento
  ) {
    if (
      documento
        .vencidoPorData ||
      documento.status ===
        "VENCIDO"
    ) {
      return "border-red-200 bg-red-50 text-red-700";
    }

    if (
      documento.status ===
        "APROVADO" ||
      documento.status ===
        "ATIVO"
    ) {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (
      documento.status ===
        "REJEITADO"
    ) {
      return "border-rose-200 bg-rose-50 text-rose-700";
    }

    if (
      documento.status ===
        "EM_ANALISE"
    ) {
      return "border-blue-200 bg-blue-50 text-blue-700";
    }

    if (
      documento.status ===
        "ARQUIVADO" ||
      documento.status ===
        "SUBSTITUIDO"
    ) {
      return "border-slate-200 bg-slate-100 text-slate-600";
    }

    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  function statusVisual(
    documento: Documento
  ) {
    if (
      documento
        .vencidoPorData &&
      documento.status !==
        "ARQUIVADO" &&
      documento.status !==
        "SUBSTITUIDO"
    ) {
      return "VENCIDO";
    }

    return documento.status;
  }

  const processando =
    salvando ||
    enviandoArquivo;

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="text-2xl"
              >
                {"\u{1F4C4}"}
              </span>

              <h2 className="text-xl font-semibold text-slate-900">
                {t(
                  "title"
                )}
              </h2>
            </div>

            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              {t(
                "subtitle"
              )}
            </p>
          </div>

          {podeGerenciar ? (
            <button
              type="button"
              onClick={
                abrirNovo
              }
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              +{" "}
              {t(
                "actions.new"
              )}
            </button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            {
              label:
                t(
                  "summary.total"
                ),

              value:
                resumo.total,
            },
            {
              label:
                t(
                  "summary.required"
                ),

              value:
                resumo
                  .obrigatorios,
            },
            {
              label:
                t(
                  "summary.pending"
                ),

              value:
                resumo
                  .pendentesOuEmAnalise,
            },
            {
              label:
                t(
                  "summary.expired"
                ),

              value:
                resumo
                  .vencidos,
            },
            {
              label:
                t(
                  "summary.expiring"
                ),

              value:
                resumo
                  .vencemEmBreve,
            },
          ].map(
            (
              item
            ) => (
              <div
                key={
                  item.label
                }
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {
                    item.label
                  }
                </div>

                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {
                    item.value
                  }
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {erro ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {erro}
        </div>
      ) : null}

      {sucesso ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          {sucesso}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-4">
          <label className="lg:col-span-1">
            <span className="sr-only">
              {t(
                "filters.search"
              )}
            </span>

            <input
              value={
                busca
              }
              onChange={(
                event
              ) =>
                setBusca(
                  event
                    .target
                    .value
                )
              }
              placeholder={t(
                "filters.search"
              )}
              className="min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <select
            value={
              filtroTipo
            }
            onChange={(
              event
            ) =>
              setFiltroTipo(
                event
                  .target
                  .value as
                  | TipoDocumento
                  | "TODOS"
              )
            }
            className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="TODOS">
              {t(
                "filters.allTypes"
              )}
            </option>

            {TIPOS.map(
              (
                tipo
              ) => (
                <option
                  key={
                    tipo
                  }
                  value={
                    tipo
                  }
                >
                  {t(
                    `types.${tipo}`
                  )}
                </option>
              )
            )}
          </select>

          <select
            value={
              filtroStatus
            }
            onChange={(
              event
            ) =>
              setFiltroStatus(
                event
                  .target
                  .value as
                  | StatusDocumento
                  | "TODOS"
              )
            }
            className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="TODOS">
              {t(
                "filters.allStatuses"
              )}
            </option>

            {[
              "ATIVO",
              "PENDENTE",
              "EM_ANALISE",
              "APROVADO",
              "REJEITADO",
              "VENCIDO",
              "SUBSTITUIDO",
              "ARQUIVADO",
            ].map(
              (
                status
              ) => (
                <option
                  key={
                    status
                  }
                  value={
                    status
                  }
                >
                  {t(
                    `statuses.${status}`
                  )}
                </option>
              )
            )}
          </select>

          <select
            value={
              filtroVinculo
            }
            onChange={(
              event
            ) =>
              setFiltroVinculo(
                event
                  .target
                  .value as
                  typeof filtroVinculo
              )
            }
            className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="TODOS">
              {t(
                "filters.allLinks"
              )}
            </option>

            <option value="GERAL">
              {t(
                "links.general"
              )}
            </option>

            <option value="PARTICIPANTE">
              {t(
                "links.participant"
              )}
            </option>

            <option value="PRESTADOR">
              {t(
                "links.provider"
              )}
            </option>

            <option value="VEICULO">
              {t(
                "links.vehicle"
              )}
            </option>
          </select>
        </div>

        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={
              mostrarHistorico
            }
            onChange={(
              event
            ) =>
              setMostrarHistorico(
                event
                  .target
                  .checked
              )
            }
            className="h-4 w-4 rounded border-slate-300"
          />

          {t(
            "filters.showHistory"
          )}
        </label>
      </div>

      {carregando ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {t(
            "loading"
          )}
        </div>
      ) : documentosFiltrados.length ===
        0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="text-3xl">
            {"\u{1F4C2}"}
          </div>

          <div className="mt-2 font-semibold text-slate-800">
            {t(
              "empty.title"
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {t(
              "empty.description"
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documentosFiltrados.map(
            (
              documento
            ) => {
              const status =
                statusVisual(
                  documento
                );

              return (
                <article
                  key={
                    documento.id
                  }
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {
                            documento
                              .titulo
                          }
                        </h3>

                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classeStatus(
                            documento
                          )}`}
                        >
                          {t(
                            `statuses.${status}`
                          )}
                        </span>

                        {documento
                          .obrigatorio ? (
                          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            {t(
                              "badges.required"
                            )}
                          </span>
                        ) : null}

                        {documento
                          .confidencial ? (
                          <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                            ??{" "}
                            {t(
                              "badges.confidential"
                            )}
                          </span>
                        ) : null}

                        {documento
                          .venceEmBreve &&
                        !documento
                          .vencidoPorData ? (
                          <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                            {t(
                              "badges.expiring"
                            )}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                        <span>
                          {t(
                            `types.${documento.tipo}`
                          )}
                        </span>

                        <span>
                          {t(
                            "card.link"
                          )}
                          :{" "}
                          {vinculoDocumento(
                            documento
                          )}
                        </span>

                        {documento
                          .numeroDocumento ? (
                          <span>
                            {t(
                              "card.number"
                            )}
                            :{" "}
                            {
                              documento
                                .numeroDocumento
                            }
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                        {documento
                          .arquivoNome ? (
                          <span>
                            {"\u{1F4CE}"}{" "}
                            {
                              documento
                                .arquivoNome
                            }
                            {documento
                              .tamanho
                              ? ` \u00B7 ${bytesLegiveis(
                                  documento
                                    .tamanho
                                )}`
                              : ""}
                          </span>
                        ) : (
                          <span>
                            {t(
                              "card.noFile"
                            )}
                          </span>
                        )}

                        {documento
                          .validoAte ? (
                          <span>
                            {t(
                              "card.validUntil"
                            )}
                            :{" "}
                            {new Intl.DateTimeFormat(
                              locale
                            ).format(
                              new Date(
                                documento
                                  .validoAte
                              )
                            )}
                          </span>
                        ) : null}
                      </div>

                      {documento
                        .descricao ? (
                        <p className="mt-3 max-w-4xl text-sm text-slate-600">
                          {
                            documento
                              .descricao
                          }
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {documento
                        .temArquivo ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              abrirDocumento(
                                documento,
                                false
                              )
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            {t(
                              "actions.open"
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              abrirDocumento(
                                documento,
                                true
                              )
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            {t(
                              "actions.download"
                            )}
                          </button>
                        </>
                      ) : null}

                      {podeGerenciar &&
                      documento.status !==
                        "ARQUIVADO" &&
                      documento.status !==
                        "SUBSTITUIDO" ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              abrirEdicao(
                                documento
                              )
                            }
                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            {t(
                              "actions.edit"
                            )}
                          </button>

                          {documento
                            .temArquivo ? (
                            <button
                              type="button"
                              onClick={() =>
                                abrirSubstituicao(
                                  documento
                                )
                              }
                              className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                            >
                              {t(
                                "actions.replace"
                              )}
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() =>
                              alterarStatus(
                                documento,
                                "ARQUIVADO"
                              )
                            }
                            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            {t(
                              "actions.archive"
                            )}
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}

      {modalAberto ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="documento-modal-title"
        >
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <form
              onSubmit={
                salvar
              }
            >
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
                <div>
                  <h3
                    id="documento-modal-title"
                    className="text-lg font-semibold text-slate-900"
                  >
                    {documentoSubstituindo
                      ? t(
                          "modal.replaceTitle"
                        )
                      : documentoEditando
                      ? t(
                          "modal.editTitle"
                        )
                      : t(
                          "modal.newTitle"
                        )}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {documentoSubstituindo
                      ? t(
                          "modal.replaceDescription"
                        )
                      : t(
                          "modal.description"
                        )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    fecharModal
                  }
                  disabled={
                    processando
                  }
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                >
                  {"\u2715"}
                </button>
              </div>

              <div className="space-y-5 p-5">
                {erro ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                  >
                    {erro}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">
                      {t(
                        "form.type"
                      )}
                      *
                    </span>

                    <select
                      required
                      value={
                        formulario
                          .tipo
                      }
                      onChange={(
                        event
                      ) =>
                        alterarCampo(
                          "tipo",
                          event
                            .target
                            .value as
                            | TipoDocumento
                            | ""
                        )
                      }
                      disabled={
                        Boolean(
                          documentoSubstituindo
                        )
                      }
                      className="min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 disabled:bg-slate-100"
                    >
                      <option value="">
                        {t(
                          "form.select"
                        )}
                      </option>

                      {TIPOS.map(
                        (
                          tipo
                        ) => (
                          <option
                            key={
                              tipo
                            }
                            value={
                              tipo
                            }
                          >
                            {t(
                              `types.${tipo}`
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">
                      {t(
                        "form.title"
                      )}
                      *
                    </span>

                    <input
                      required
                      value={
                        formulario
                          .titulo
                      }
                      onChange={(
                        event
                      ) =>
                        alterarCampo(
                          "titulo",
                          event
                            .target
                            .value
                        )
                      }
                      className="min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900"
                    />
                  </label>

                  <label className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      {t(
                        "form.description"
                      )}
                    </span>

                    <textarea
                      rows={
                        3
                      }
                      value={
                        formulario
                          .descricao
                      }
                      onChange={(
                        event
                      ) =>
                        alterarCampo(
                          "descricao",
                          event
                            .target
                            .value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">
                      {t(
                        "form.number"
                      )}
                    </span>

                    <input
                      value={
                        formulario
                          .numeroDocumento
                      }
                      onChange={(
                        event
                      ) =>
                        alterarCampo(
                          "numeroDocumento",
                          event
                            .target
                            .value
                        )
                      }
                      className="min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">
                      {t(
                        "form.status"
                      )}
                    </span>

                    <select
                      value={
                        formulario
                          .status
                      }
                      onChange={(
                        event
                      ) =>
                        alterarCampo(
                          "status",
                          event
                            .target
                            .value as
                            StatusDocumento
                        )
                      }
                      disabled={
                        Boolean(
                          documentoSubstituindo
                        )
                      }
                      className="min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 disabled:bg-slate-100"
                    >
                      {STATUS_EDITAVEIS.map(
                        (
                          status
                        ) => (
                          <option
                            key={
                              status
                            }
                            value={
                              status
                            }
                          >
                            {t(
                              `statuses.${status}`
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">
                      {t(
                        "form.issuedAt"
                      )}
                    </span>

                    <input
                      type="date"
                      value={
                        formulario
                          .emitidoEm
                      }
                      onChange={(
                        event
                      ) =>
                        alterarCampo(
                          "emitidoEm",
                          event
                            .target
                            .value
                        )
                      }
                      className="min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">
                      {t(
                        "form.validUntil"
                      )}
                    </span>

                    <input
                      type="date"
                      value={
                        formulario
                          .validoAte
                      }
                      onChange={(
                        event
                      ) =>
                        alterarCampo(
                          "validoAte",
                          event
                            .target
                            .value
                        )
                      }
                      className="min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">
                      {t(
                        "form.participant"
                      )}
                    </span>

                    <select
                      value={
                        formulario
                          .participanteId
                      }
                      onChange={(
                        event
                      ) =>
                        alterarCampo(
                          "participanteId",
                          event
                            .target
                            .value
                        )
                      }
                      disabled={
                        Boolean(
                          documentoSubstituindo
                        )
                      }
                      className="min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 disabled:bg-slate-100"
                    >
                      <option value="">
                        {t(
                          "form.none"
                        )}
                      </option>

                      {participantes.map(
                        (
                          participante
                        ) => (
                          <option
                            key={
                              participante.id
                            }
                            value={
                              participante.id
                            }
                          >
                            {
                              participante.nome
                            }
                            {participante
                              .matricula
                              ? ` ? ${participante.matricula}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">
                      {t(
                        "form.provider"
                      )}
                    </span>

                    <select
                      value={
                        formulario
                          .prestadorTransporteId
                      }
                      onChange={(
                        event
                      ) => {
                        alterarCampo(
                          "prestadorTransporteId",
                          event
                            .target
                            .value
                        );

                        alterarCampo(
                          "veiculoId",
                          ""
                        );
                      }}
                      disabled={
                        Boolean(
                          documentoSubstituindo
                        )
                      }
                      className="min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 disabled:bg-slate-100"
                    >
                      <option value="">
                        {t(
                          "form.none"
                        )}
                      </option>

                      {prestadores.map(
                        (
                          prestador
                        ) => (
                          <option
                            key={
                              prestador.id
                            }
                            value={
                              prestador.id
                            }
                          >
                            {prestador
                              .nomeFantasia ||
                              prestador
                                .nome}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">
                      {t(
                        "form.vehicle"
                      )}
                    </span>

                    <select
                      value={
                        formulario
                          .veiculoId
                      }
                      onChange={(
                        event
                      ) =>
                        alterarCampo(
                          "veiculoId",
                          event
                            .target
                            .value
                        )
                      }
                      disabled={
                        Boolean(
                          documentoSubstituindo
                        )
                      }
                      className="min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 disabled:bg-slate-100"
                    >
                      <option value="">
                        {t(
                          "form.none"
                        )}
                      </option>

                      {veiculosFormulario.map(
                        (
                          veiculo
                        ) => (
                          <option
                            key={
                              veiculo.id
                            }
                            value={
                              veiculo.id
                            }
                          >
                            {veiculo
                              .nomeIdentificacao ||
                              veiculo
                                .placa ||
                              `#${veiculo.id}`}
                            {veiculo
                              .placa &&
                            veiculo
                              .nomeIdentificacao
                              ? ` ? ${veiculo.placa}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <div className="space-y-2 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      {t(
                        "form.file"
                      )}
                    </span>

                    {documentoEditando
                      ?.temArquivo ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                        {t(
                          "form.fileAlreadyExists"
                        )}
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          accept={
                            ACCEPT
                          }
                          onChange={
                            selecionarArquivo
                          }
                          className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700"
                        />

                        <p className="text-xs text-slate-500">
                          {t(
                            "form.fileHelp"
                          )}
                        </p>
                      </>
                    )}

                    {arquivoSelecionado ? (
                      <div className="text-xs font-medium text-slate-600">
                        ??{" "}
                        {
                          arquivoSelecionado
                            .name
                        }{" "}
                        ?{" "}
                        {bytesLegiveis(
                          arquivoSelecionado
                            .size
                        )}
                      </div>
                    ) : null}
                  </div>

                  <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <input
                      type="checkbox"
                      checked={
                        formulario
                          .obrigatorio
                      }
                      onChange={(
                        event
                      ) =>
                        alterarCampo(
                          "obrigatorio",
                          event
                            .target
                            .checked
                        )
                      }
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />

                    <span>
                      <span className="block text-sm font-medium text-slate-700">
                        {t(
                          "form.required"
                        )}
                      </span>

                      <span className="text-xs text-slate-500">
                        {t(
                          "form.requiredHelp"
                        )}
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2 rounded-xl border border-violet-200 bg-violet-50 p-3">
                    <input
                      type="checkbox"
                      checked={
                        formulario
                          .confidencial
                      }
                      onChange={(
                        event
                      ) =>
                        alterarCampo(
                          "confidencial",
                          event
                            .target
                            .checked
                        )
                      }
                      className="mt-1 h-4 w-4 rounded border-violet-300"
                    />

                    <span>
                      <span className="block text-sm font-medium text-violet-800">
                        {t(
                          "form.confidential"
                        )}
                      </span>

                      <span className="text-xs text-violet-700">
                        {t(
                          "form.confidentialHelp"
                        )}
                      </span>
                    </span>
                  </label>

                  <label className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      {t(
                        "form.notes"
                      )}
                    </span>

                    <textarea
                      rows={
                        3
                      }
                      value={
                        formulario
                          .observacao
                      }
                      onChange={(
                        event
                      ) =>
                        alterarCampo(
                          "observacao",
                          event
                            .target
                            .value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                  </label>
                </div>
              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    fecharModal
                  }
                  disabled={
                    processando
                  }
                  className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {t(
                    "actions.cancel"
                  )}
                </button>

                <button
                  type="submit"
                  disabled={
                    processando
                  }
                  className="min-h-10 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enviandoArquivo
                    ? t(
                        "actions.uploading"
                      )
                    : salvando
                    ? t(
                        "actions.saving"
                      )
                    : documentoSubstituindo
                    ? t(
                        "actions.confirmReplace"
                      )
                    : t(
                        "actions.save"
                      )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

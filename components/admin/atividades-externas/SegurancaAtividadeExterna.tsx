"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useLocale,
  useTranslations,
} from "next-intl";

type CategoriaRisco =
  | "TRANSPORTE"
  | "SAUDE"
  | "CLIMA"
  | "AMBIENTE"
  | "ATIVIDADE_FISICA"
  | "AQUATICO"
  | "SEGURANCA"
  | "ALIMENTACAO"
  | "ACESSIBILIDADE"
  | "COMPORTAMENTO"
  | "TECNOLOGIA"
  | "OUTRO";

type ProbabilidadeRisco =
  | "MUITO_BAIXA"
  | "BAIXA"
  | "MEDIA"
  | "ALTA"
  | "MUITO_ALTA";

type GravidadeRisco =
  | "LEVE"
  | "MODERADA"
  | "GRAVE"
  | "MUITO_GRAVE"
  | "CRITICA";

type StatusRisco =
  | "IDENTIFICADO"
  | "EM_TRATAMENTO"
  | "MITIGADO"
  | "ACEITO"
  | "ENCERRADO";

type MembroEquipe = {
  id: number;
  nomeSnapshot: string;
  papel: string;
  principal: boolean;
};

type Risco = {
  id: number;
  titulo: string;
  descricao?: string | null;
  categoria: CategoriaRisco;
  probabilidade: ProbabilidadeRisco;
  gravidade: GravidadeRisco;
  medidasPreventivas?: string | null;
  planoResposta?: string | null;
  responsavelEquipeId?: number | null;
  status: StatusRisco;
  observacao?: string | null;

  responsavelEquipe?: {
    id: number;
    nomeSnapshot: string;
    papel: string;
    principal: boolean;
  } | null;
};

type TipoCheckpoint =
  | "SAIDA_ORIGEM"
  | "CHEGADA_DESTINO"
  | "SAIDA_DESTINO"
  | "RETORNO_ORIGEM"
  | "EMBARQUE"
  | "DESEMBARQUE"
  | "PONTO_ENCONTRO"
  | "CONTAGEM"
  | "PERSONALIZADO";

type Checkpoint = {
  id: number;
  nome: string;

  tipo:
    TipoCheckpoint;

  ordem:
    number;

  localNome?:
    string | null;

  localEndereco?:
    string | null;

  previstoEm?:
    string | null;

  obrigatorio:
    boolean;

  ativo:
    boolean;

  observacao?:
    string | null;

  _count?: {
    registros: number;
  };
};

type FormularioCheckpoint = {
  nome: string;

  tipo:
    TipoCheckpoint;

  localNome:
    string;

  localEndereco:
    string;

  previstoEm:
    string;

  obrigatorio:
    boolean;

  ativo:
    boolean;

  observacao:
    string;
};

type StatusPlanoEmergencia =
  | "RASCUNHO"
  | "EM_REVISAO"
  | "APROVADO"
  | "ATIVO"
  | "ARQUIVADO";

type PlanoEmergencia = {
  id: number;

  status:
    StatusPlanoEmergencia;

  contatoEmergenciaEscola?:
    string | null;

  telefoneEmergenciaEscola?:
    string | null;

  responsavelEmergenciaNome?:
    string | null;

  responsavelEmergenciaTelefone?:
    string | null;

  numeroEmergenciaLocal?:
    string | null;

  hospitalReferencia?:
    string | null;

  enderecoHospitalReferencia?:
    string | null;

  telefoneHospitalReferencia?:
    string | null;

  servicoAlternativoEmergencia?:
    string | null;

  telefoneServicoAlternativo?:
    string | null;

  pontoEncontroEmergencia?:
    string | null;

  procedimentoEvacuacao?:
    string | null;

  procedimentoAcidente?:
    string | null;

  procedimentoPessoaDesaparecida?:
    string | null;

  procedimentoEmergenciaMedica?:
    string | null;

  procedimentoClimaSevero?:
    string | null;

  instrucoesGerais?:
    string | null;

  observacao?:
    string | null;
};

type FormularioPlanoEmergencia = {
  status:
    StatusPlanoEmergencia;

  contatoEmergenciaEscola:
    string;

  telefoneEmergenciaEscola:
    string;

  responsavelEmergenciaNome:
    string;

  responsavelEmergenciaTelefone:
    string;

  numeroEmergenciaLocal:
    string;

  hospitalReferencia:
    string;

  enderecoHospitalReferencia:
    string;

  telefoneHospitalReferencia:
    string;

  servicoAlternativoEmergencia:
    string;

  telefoneServicoAlternativo:
    string;

  pontoEncontroEmergencia:
    string;

  procedimentoEvacuacao:
    string;

  procedimentoAcidente:
    string;

  procedimentoPessoaDesaparecida:
    string;

  procedimentoEmergenciaMedica:
    string;

  procedimentoClimaSevero:
    string;

  instrucoesGerais:
    string;

  observacao:
    string;
};

type RespostaApi = {
  ok?: boolean;
  podeGerenciar?: boolean;
  riscos?: Risco[];
  checkpoints?: Checkpoint[];
  equipe?: MembroEquipe[];

  planoEmergencia?:
    PlanoEmergencia | null;

  error?: string;
  message?: string;
  detalhe?: string;
};

type FormularioRisco = {
  titulo: string;
  descricao: string;
  categoria: CategoriaRisco;
  probabilidade: ProbabilidadeRisco;
  gravidade: GravidadeRisco;
  medidasPreventivas: string;
  planoResposta: string;
  responsavelEquipeId: string;
  status: StatusRisco;
  observacao: string;
};

type Props = {
  atividadeId: number;

  onSegurancaAlterada?:
    () =>
      | void
      | Promise<void>;
};

const CATEGORIAS: CategoriaRisco[] = [
  "TRANSPORTE",
  "SAUDE",
  "CLIMA",
  "AMBIENTE",
  "ATIVIDADE_FISICA",
  "AQUATICO",
  "SEGURANCA",
  "ALIMENTACAO",
  "ACESSIBILIDADE",
  "COMPORTAMENTO",
  "TECNOLOGIA",
  "OUTRO",
];

const PROBABILIDADES: ProbabilidadeRisco[] = [
  "MUITO_BAIXA",
  "BAIXA",
  "MEDIA",
  "ALTA",
  "MUITO_ALTA",
];

const GRAVIDADES: GravidadeRisco[] = [
  "LEVE",
  "MODERADA",
  "GRAVE",
  "MUITO_GRAVE",
  "CRITICA",
];

const STATUS: StatusRisco[] = [
  "IDENTIFICADO",
  "EM_TRATAMENTO",
  "MITIGADO",
  "ACEITO",
  "ENCERRADO",
];

const FORMULARIO_INICIAL: FormularioRisco = {
  titulo: "",
  descricao: "",
  categoria: "SEGURANCA",
  probabilidade: "MEDIA",
  gravidade: "MODERADA",
  medidasPreventivas: "",
  planoResposta: "",
  responsavelEquipeId: "",
  status: "IDENTIFICADO",
  observacao: "",
};

const TIPOS_CHECKPOINT:
  TipoCheckpoint[] = [
    "SAIDA_ORIGEM",
    "CHEGADA_DESTINO",
    "SAIDA_DESTINO",
    "RETORNO_ORIGEM",
    "EMBARQUE",
    "DESEMBARQUE",
    "PONTO_ENCONTRO",
    "CONTAGEM",
    "PERSONALIZADO",
  ];

const FORMULARIO_CHECKPOINT_INICIAL:
  FormularioCheckpoint = {
    nome:
      "",

    tipo:
      "PONTO_ENCONTRO",

    localNome:
      "",

    localEndereco:
      "",

    previstoEm:
      "",

    obrigatorio:
      true,

    ativo:
      true,

    observacao:
      "",
  };

const STATUS_PLANO:
  StatusPlanoEmergencia[] = [
    "RASCUNHO",
    "EM_REVISAO",
    "APROVADO",
    "ATIVO",
    "ARQUIVADO",
  ];

const FORMULARIO_PLANO_INICIAL:
  FormularioPlanoEmergencia = {
    status:
      "RASCUNHO",

    contatoEmergenciaEscola:
      "",

    telefoneEmergenciaEscola:
      "",

    responsavelEmergenciaNome:
      "",

    responsavelEmergenciaTelefone:
      "",

    numeroEmergenciaLocal:
      "",

    hospitalReferencia:
      "",

    enderecoHospitalReferencia:
      "",

    telefoneHospitalReferencia:
      "",

    servicoAlternativoEmergencia:
      "",

    telefoneServicoAlternativo:
      "",

    pontoEncontroEmergencia:
      "",

    procedimentoEvacuacao:
      "",

    procedimentoAcidente:
      "",

    procedimentoPessoaDesaparecida:
      "",

    procedimentoEmergenciaMedica:
      "",

    procedimentoClimaSevero:
      "",

    instrucoesGerais:
      "",

    observacao:
      "",
  };

export default function SegurancaAtividadeExterna({
  atividadeId,
  onSegurancaAlterada,
}: Props) {
  const t =
    useTranslations(
      "AdminExternalActivitySafety"
    );

  const locale =
    useLocale();

  const [
    riscos,
    setRiscos,
  ] =
    useState<Risco[]>([]);

  const [
    checkpoints,
    setCheckpoints,
  ] =
    useState<
      Checkpoint[]
    >([]);

  const [
    formularioCheckpoint,
    setFormularioCheckpoint,
  ] =
    useState<
      FormularioCheckpoint
    >({
      ...FORMULARIO_CHECKPOINT_INICIAL,
    });

  const [
    checkpointAberto,
    setCheckpointAberto,
  ] =
    useState(false);

  const [
    checkpointEditandoId,
    setCheckpointEditandoId,
  ] =
    useState<
      number | null
    >(null);

  const [
    checkpointRemoverId,
    setCheckpointRemoverId,
  ] =
    useState<
      number | null
    >(null);

  const [
    salvandoCheckpoint,
    setSalvandoCheckpoint,
  ] =
    useState(false);

  const [
    equipe,
    setEquipe,
  ] =
    useState<
      MembroEquipe[]
    >([]);

  const [
    planoEmergencia,
    setPlanoEmergencia,
  ] =
    useState<
      PlanoEmergencia | null
    >(null);

  const [
    formularioPlano,
    setFormularioPlano,
  ] =
    useState<
      FormularioPlanoEmergencia
    >({
      ...FORMULARIO_PLANO_INICIAL,
    });

  const [
    planoAberto,
    setPlanoAberto,
  ] =
    useState(false);

  const [
    salvandoPlano,
    setSalvandoPlano,
  ] =
    useState(false);

  const [
    podeGerenciar,
    setPodeGerenciar,
  ] =
    useState(false);

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    salvando,
    setSalvando,
  ] =
    useState(false);

  const [
    erro,
    setErro,
  ] =
    useState("");

  const [
    sucesso,
    setSucesso,
  ] =
    useState("");

  const [
    formularioAberto,
    setFormularioAberto,
  ] =
    useState(false);

  const [
    riscoEditandoId,
    setRiscoEditandoId,
  ] =
    useState<
      number | null
    >(null);

  const [
    riscoRemoverId,
    setRiscoRemoverId,
  ] =
    useState<
      number | null
    >(null);

  const [
    formulario,
    setFormulario,
  ] =
    useState<FormularioRisco>({
      ...FORMULARIO_INICIAL,
    });

  const endpoint =
    "/api/admin/atividades-externas/" +
    atividadeId +
    "/seguranca";

  async function carregar() {
    try {
      setCarregando(true);
      setErro("");

      const resposta =
        await fetch(
          endpoint,
          {
            credentials:
              "include",

            cache:
              "no-store",
          }
        );

      const dados: RespostaApi =
        await resposta.json();

      if (
        !resposta.ok ||
        !dados.ok
      ) {
        throw new Error(
          dados.message ||
          dados.detalhe ||
          t(
            "messages.loadError"
          )
        );
      }

      setRiscos(
        dados.riscos || []
      );

      setCheckpoints(
        dados.checkpoints || []
      );

      setEquipe(
        dados.equipe || []
      );

      setPlanoEmergencia(
        dados.planoEmergencia ||
        null
      );

      setPodeGerenciar(
        Boolean(
          dados.podeGerenciar
        )
      );
    } catch (e: unknown) {
      setErro(
        e instanceof Error
          ? e.message
          : t(
              "messages.loadError"
            )
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atividadeId]);

  function abrirNovo() {
    setErro("");
    setSucesso("");

    setRiscoEditandoId(
      null
    );

    setFormulario({
      ...FORMULARIO_INICIAL,
    });

    setFormularioAberto(
      true
    );
  }

  function editar(
    risco: Risco
  ) {
    setErro("");
    setSucesso("");

    setRiscoEditandoId(
      risco.id
    );

    setFormulario({
      titulo:
        risco.titulo,

      descricao:
        risco.descricao || "",

      categoria:
        risco.categoria,

      probabilidade:
        risco.probabilidade,

      gravidade:
        risco.gravidade,

      medidasPreventivas:
        risco.medidasPreventivas ||
        "",

      planoResposta:
        risco.planoResposta ||
        "",

      responsavelEquipeId:
        risco.responsavelEquipeId
          ? String(
              risco
                .responsavelEquipeId
            )
          : "",

      status:
        risco.status,

      observacao:
        risco.observacao || "",
    });

    setFormularioAberto(
      true
    );
  }

  function fecharFormulario() {
    if (salvando) {
      return;
    }

    setFormularioAberto(
      false
    );

    setRiscoEditandoId(
      null
    );

    setFormulario({
      ...FORMULARIO_INICIAL,
    });
  }

  async function salvarRisco() {
    if (
      !formulario.titulo
        .trim()
    ) {
      setErro(
        t(
          "messages.titleRequired"
        )
      );

      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const editando =
        riscoEditandoId !==
        null;

      const resposta =
        await fetch(
          endpoint,
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
                  editando
                    ? "ATUALIZAR_RISCO"
                    : "CRIAR_RISCO",

                ...(editando
                  ? {
                      riscoId:
                        riscoEditandoId,
                    }
                  : {}),

                titulo:
                  formulario.titulo,

                descricao:
                  formulario.descricao,

                categoria:
                  formulario.categoria,

                probabilidade:
                  formulario.probabilidade,

                gravidade:
                  formulario.gravidade,

                medidasPreventivas:
                  formulario
                    .medidasPreventivas,

                planoResposta:
                  formulario
                    .planoResposta,

                responsavelEquipeId:
                  formulario
                    .responsavelEquipeId
                    ? Number(
                        formulario
                          .responsavelEquipeId
                      )
                    : null,

                status:
                  formulario.status,

                observacao:
                  formulario.observacao,
              }),
          }
        );

      const dados =
        await resposta.json();

      if (
        !resposta.ok ||
        !dados?.ok
      ) {
        throw new Error(
          dados?.message ||
          dados?.detalhe ||
          t(
            "messages.saveError"
          )
        );
      }

      setFormularioAberto(
        false
      );

      setRiscoEditandoId(
        null
      );

      setFormulario({
        ...FORMULARIO_INICIAL,
      });

      setSucesso(
        editando
          ? t(
              "messages.updated"
            )
          : t(
              "messages.created"
            )
      );

      await carregar();

      await onSegurancaAlterada?.();
    } catch (e: unknown) {
      setErro(
        e instanceof Error
          ? e.message
          : t(
              "messages.saveError"
            )
      );
    } finally {
      setSalvando(false);
    }
  }

  async function removerRisco(
    riscoId: number
  ) {
    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const resposta =
        await fetch(
          endpoint,
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
                  "REMOVER_RISCO",

                riscoId,
              }),
          }
        );

      const dados =
        await resposta.json();

      if (
        !resposta.ok ||
        !dados?.ok
      ) {
        throw new Error(
          dados?.message ||
          dados?.detalhe ||
          t(
            "messages.removeError"
          )
        );
      }

      setRiscoRemoverId(
        null
      );

      setSucesso(
        t(
          "messages.removed"
        )
      );

      await carregar();

      await onSegurancaAlterada?.();
    } catch (e: unknown) {
      setErro(
        e instanceof Error
          ? e.message
          : t(
              "messages.removeError"
            )
      );
    } finally {
      setSalvando(false);
    }
  }

  function dataParaInput(
    valor?:
      string | null
  ) {
    if (!valor) {
      return "";
    }

    const data =
      new Date(valor);

    if (
      Number.isNaN(
        data.getTime()
      )
    ) {
      return "";
    }

    const local =
      new Date(
        data.getTime() -
        data.getTimezoneOffset() *
          60000
      );

    return local
      .toISOString()
      .slice(
        0,
        16
      );
  }

  function formatarDataCheckpoint(
    valor?:
      string | null
  ) {
    if (!valor) {
      return t(
        "common.notInformed"
      );
    }

    const data =
      new Date(valor);

    if (
      Number.isNaN(
        data.getTime()
      )
    ) {
      return t(
        "common.notInformed"
      );
    }

    return new Intl.DateTimeFormat(
      locale,
      {
        dateStyle:
          "short",

        timeStyle:
          "short",
      }
    ).format(
      data
    );
  }

  function atualizarCampoCheckpoint<
    K extends keyof FormularioCheckpoint
  >(
    campo: K,
    valor:
      FormularioCheckpoint[K]
  ) {
    setFormularioCheckpoint(
      (atual) => ({
        ...atual,

        [campo]:
          valor,
      })
    );
  }

  function abrirNovoCheckpoint() {
    setErro("");
    setSucesso("");

    setCheckpointEditandoId(
      null
    );

    setFormularioCheckpoint({
      ...FORMULARIO_CHECKPOINT_INICIAL,
    });

    setCheckpointAberto(
      true
    );
  }

  function editarCheckpoint(
    checkpoint:
      Checkpoint
  ) {
    setErro("");
    setSucesso("");

    setCheckpointEditandoId(
      checkpoint.id
    );

    setFormularioCheckpoint({
      nome:
        checkpoint.nome,

      tipo:
        checkpoint.tipo,

      localNome:
        checkpoint.localNome ||
        "",

      localEndereco:
        checkpoint.localEndereco ||
        "",

      previstoEm:
        dataParaInput(
          checkpoint.previstoEm
        ),

      obrigatorio:
        checkpoint.obrigatorio,

      ativo:
        checkpoint.ativo,

      observacao:
        checkpoint.observacao ||
        "",
    });

    setCheckpointAberto(
      true
    );
  }

  function fecharCheckpoint() {
    if (
      salvandoCheckpoint
    ) {
      return;
    }

    setCheckpointAberto(
      false
    );

    setCheckpointEditandoId(
      null
    );

    setFormularioCheckpoint({
      ...FORMULARIO_CHECKPOINT_INICIAL,
    });
  }

  async function salvarCheckpoint() {
    if (
      !formularioCheckpoint
        .nome
        .trim()
    ) {
      setErro(
        t(
          "messages.checkpointNameRequired"
        )
      );

      return;
    }

    try {
      setSalvandoCheckpoint(
        true
      );

      setErro("");
      setSucesso("");

      const editando =
        checkpointEditandoId !==
        null;

      let previstoEm:
        string | null =
          null;

      if (
        formularioCheckpoint
          .previstoEm
      ) {
        const data =
          new Date(
            formularioCheckpoint
              .previstoEm
          );

        if (
          Number.isNaN(
            data.getTime()
          )
        ) {
          setErro(
            t(
              "messages.checkpointDateInvalid"
            )
          );

          return;
        }

        previstoEm =
          data.toISOString();
      }

      const resposta =
        await fetch(
          endpoint,
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
                  editando
                    ? "ATUALIZAR_CHECKPOINT"
                    : "CRIAR_CHECKPOINT",

                ...(editando
                  ? {
                      checkpointId:
                        checkpointEditandoId,
                    }
                  : {}),

                nome:
                  formularioCheckpoint
                    .nome,

                tipo:
                  formularioCheckpoint
                    .tipo,

                localNome:
                  formularioCheckpoint
                    .localNome,

                localEndereco:
                  formularioCheckpoint
                    .localEndereco,

                previstoEm,

                obrigatorio:
                  formularioCheckpoint
                    .obrigatorio,

                ativo:
                  formularioCheckpoint
                    .ativo,

                observacao:
                  formularioCheckpoint
                    .observacao,
              }),
          }
        );

      const dados =
        await resposta.json();

      if (
        !resposta.ok ||
        !dados?.ok
      ) {
        throw new Error(
          dados?.message ||
          dados?.detalhe ||
          t(
            "messages.checkpointSaveError"
          )
        );
      }

      setCheckpointAberto(
        false
      );

      setCheckpointEditandoId(
        null
      );

      setFormularioCheckpoint({
        ...FORMULARIO_CHECKPOINT_INICIAL,
      });

      setSucesso(
        editando
          ? t(
              "messages.checkpointUpdated"
            )
          : t(
              "messages.checkpointCreated"
            )
      );

      await carregar();

      await onSegurancaAlterada?.();
    } catch (e: unknown) {
      setErro(
        e instanceof Error
          ? e.message
          : t(
              "messages.checkpointSaveError"
            )
      );
    } finally {
      setSalvandoCheckpoint(
        false
      );
    }
  }

  async function removerCheckpoint(
    checkpointId:
      number
  ) {
    try {
      setSalvandoCheckpoint(
        true
      );

      setErro("");
      setSucesso("");

      const resposta =
        await fetch(
          endpoint,
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
                  "REMOVER_CHECKPOINT",

                checkpointId,
              }),
          }
        );

      const dados =
        await resposta.json();

      if (
        !resposta.ok ||
        !dados?.ok
      ) {
        throw new Error(
          dados?.message ||
          dados?.detalhe ||
          t(
            "messages.checkpointRemoveError"
          )
        );
      }

      setCheckpointRemoverId(
        null
      );

      setSucesso(
        dados?.modo ===
          "DESATIVADO"
          ? t(
              "messages.checkpointDisabled"
            )
          : t(
              "messages.checkpointRemoved"
            )
      );

      await carregar();

      await onSegurancaAlterada?.();
    } catch (e: unknown) {
      setErro(
        e instanceof Error
          ? e.message
          : t(
              "messages.checkpointRemoveError"
            )
      );
    } finally {
      setSalvandoCheckpoint(
        false
      );
    }
  }

  function atualizarCampoPlano<
    K extends keyof FormularioPlanoEmergencia
  >(
    campo: K,
    valor:
      FormularioPlanoEmergencia[K]
  ) {
    setFormularioPlano(
      (atual) => ({
        ...atual,
        [campo]:
          valor,
      })
    );
  }

  function abrirPlano() {
    setErro("");
    setSucesso("");

    const plano =
      planoEmergencia;

    setFormularioPlano({
      status:
        plano?.status ||
        "RASCUNHO",

      contatoEmergenciaEscola:
        plano
          ?.contatoEmergenciaEscola ||
        "",

      telefoneEmergenciaEscola:
        plano
          ?.telefoneEmergenciaEscola ||
        "",

      responsavelEmergenciaNome:
        plano
          ?.responsavelEmergenciaNome ||
        "",

      responsavelEmergenciaTelefone:
        plano
          ?.responsavelEmergenciaTelefone ||
        "",

      numeroEmergenciaLocal:
        plano
          ?.numeroEmergenciaLocal ||
        "",

      hospitalReferencia:
        plano
          ?.hospitalReferencia ||
        "",

      enderecoHospitalReferencia:
        plano
          ?.enderecoHospitalReferencia ||
        "",

      telefoneHospitalReferencia:
        plano
          ?.telefoneHospitalReferencia ||
        "",

      servicoAlternativoEmergencia:
        plano
          ?.servicoAlternativoEmergencia ||
        "",

      telefoneServicoAlternativo:
        plano
          ?.telefoneServicoAlternativo ||
        "",

      pontoEncontroEmergencia:
        plano
          ?.pontoEncontroEmergencia ||
        "",

      procedimentoEvacuacao:
        plano
          ?.procedimentoEvacuacao ||
        "",

      procedimentoAcidente:
        plano
          ?.procedimentoAcidente ||
        "",

      procedimentoPessoaDesaparecida:
        plano
          ?.procedimentoPessoaDesaparecida ||
        "",

      procedimentoEmergenciaMedica:
        plano
          ?.procedimentoEmergenciaMedica ||
        "",

      procedimentoClimaSevero:
        plano
          ?.procedimentoClimaSevero ||
        "",

      instrucoesGerais:
        plano
          ?.instrucoesGerais ||
        "",

      observacao:
        plano
          ?.observacao ||
        "",
    });

    setPlanoAberto(
      true
    );
  }

  function fecharPlano() {
    if (salvandoPlano) {
      return;
    }

    setPlanoAberto(
      false
    );
  }

  async function salvarPlano() {
    try {
      setSalvandoPlano(true);
      setErro("");
      setSucesso("");

      const resposta =
        await fetch(
          endpoint,
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
                  "SALVAR_PLANO_EMERGENCIA",

                ...formularioPlano,
              }),
          }
        );

      const dados =
        await resposta.json();

      if (
        !resposta.ok ||
        !dados?.ok
      ) {
        throw new Error(
          dados?.message ||
          dados?.detalhe ||
          t(
            "messages.planSaveError"
          )
        );
      }

      setPlanoAberto(
        false
      );

      setSucesso(
        t(
          "messages.planSaved"
        )
      );

      await carregar();

      await onSegurancaAlterada?.();
    } catch (e: unknown) {
      setErro(
        e instanceof Error
          ? e.message
          : t(
              "messages.planSaveError"
            )
      );
    } finally {
      setSalvandoPlano(false);
    }
  }

  const riscosAbertos =
    riscos.filter(
      (item) =>
        item.status ===
          "IDENTIFICADO" ||
        item.status ===
          "EM_TRATAMENTO"
    ).length;

  const riscosGraves =
    riscos.filter(
      (item) =>
        item.gravidade ===
          "GRAVE" ||
        item.gravidade ===
          "MUITO_GRAVE" ||
        item.gravidade ===
          "CRITICA"
    ).length;

  if (carregando) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />

        <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
          {t(
            "loading"
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
            {t(
              "eyebrow"
            )}
          </p>

          <h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">
            {t(
              "title"
            )}
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t(
              "description"
            )}
          </p>
        </div>

        {podeGerenciar ? (
          <button
            type="button"
            onClick={
              abrirNovo
            }
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-800"
          >
            {t(
              "actions.newRisk"
            )}
          </button>
        ) : null}
      </section>

      {erro ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
        >
          {erro}
        </div>
      ) : null}

      {sucesso ? (
        <div
          role="status"
          className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
        >
          {sucesso}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-4">

        <Resumo
          titulo={t(
            "summary.total"
          )}
          valor={
            riscos.length
          }
        />

        <Resumo
          titulo={t(
            "summary.open"
          )}
          valor={
            riscosAbertos
          }
        />

        <Resumo
          titulo={t(
            "summary.severe"
          )}
          valor={
            riscosGraves
          }
        />

        <Resumo
          titulo={t(
            "summary.checkpoints"
          )}
          valor={
            checkpoints.length
          }
        />
      </section>

      {formularioAberto ? (
        <section className="rounded-3xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900 dark:bg-blue-950/20 sm:p-6">

          <h3 className="text-lg font-black text-slate-950 dark:text-white">
            {riscoEditandoId
              ? t(
                  "form.editTitle"
                )
              : t(
                  "form.newTitle"
                )}
          </h3>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t(
              "form.description"
            )}
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">

            <Campo
              label={t(
                "form.title"
              )}
            >
              <input
                value={
                  formulario.titulo
                }
                onChange={(e) =>
                  setFormulario(
                    (atual) => ({
                      ...atual,

                      titulo:
                        e.target
                          .value,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </Campo>

            <Campo
              label={t(
                "form.responsible"
              )}
            >
              <select
                value={
                  formulario
                    .responsavelEquipeId
                }
                onChange={(e) =>
                  setFormulario(
                    (atual) => ({
                      ...atual,

                      responsavelEquipeId:
                        e.target
                          .value,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="">
                  {t(
                    "form.noResponsible"
                  )}
                </option>

                {equipe.map(
                  (membro) => (
                    <option
                      key={
                        membro.id
                      }
                      value={
                        membro.id
                      }
                    >
                      {
                        membro.nomeSnapshot
                      }
                    </option>
                  )
                )}
              </select>
            </Campo>

            <Campo
              label={t(
                "form.category"
              )}
            >
              <select
                value={
                  formulario.categoria
                }
                onChange={(e) =>
                  setFormulario(
                    (atual) => ({
                      ...atual,

                      categoria:
                        e.target
                          .value as CategoriaRisco,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {CATEGORIAS.map(
                  (item) => (
                    <option
                      key={
                        item
                      }
                      value={
                        item
                      }
                    >
                      {t(
                        "categories." +
                          item
                      )}
                    </option>
                  )
                )}
              </select>
            </Campo>

            <Campo
              label={t(
                "form.status"
              )}
            >
              <select
                value={
                  formulario.status
                }
                onChange={(e) =>
                  setFormulario(
                    (atual) => ({
                      ...atual,

                      status:
                        e.target
                          .value as StatusRisco,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {STATUS.map(
                  (item) => (
                    <option
                      key={
                        item
                      }
                      value={
                        item
                      }
                    >
                      {t(
                        "statuses." +
                          item
                      )}
                    </option>
                  )
                )}
              </select>
            </Campo>

            <Campo
              label={t(
                "form.probability"
              )}
            >
              <select
                value={
                  formulario
                    .probabilidade
                }
                onChange={(e) =>
                  setFormulario(
                    (atual) => ({
                      ...atual,

                      probabilidade:
                        e.target
                          .value as ProbabilidadeRisco,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {PROBABILIDADES.map(
                  (item) => (
                    <option
                      key={
                        item
                      }
                      value={
                        item
                      }
                    >
                      {t(
                        "probabilities." +
                          item
                      )}
                    </option>
                  )
                )}
              </select>
            </Campo>

            <Campo
              label={t(
                "form.severity"
              )}
            >
              <select
                value={
                  formulario.gravidade
                }
                onChange={(e) =>
                  setFormulario(
                    (atual) => ({
                      ...atual,

                      gravidade:
                        e.target
                          .value as GravidadeRisco,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {GRAVIDADES.map(
                  (item) => (
                    <option
                      key={
                        item
                      }
                      value={
                        item
                      }
                    >
                      {t(
                        "severities." +
                          item
                      )}
                    </option>
                  )
                )}
              </select>
            </Campo>
          </div>

          <div className="mt-4 space-y-4">

            <Campo
              label={t(
                "form.details"
              )}
            >
              <textarea
                rows={3}
                value={
                  formulario.descricao
                }
                onChange={(e) =>
                  setFormulario(
                    (atual) => ({
                      ...atual,

                      descricao:
                        e.target
                          .value,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </Campo>

            <Campo
              label={t(
                "form.preventiveMeasures"
              )}
            >
              <textarea
                rows={3}
                value={
                  formulario
                    .medidasPreventivas
                }
                onChange={(e) =>
                  setFormulario(
                    (atual) => ({
                      ...atual,

                      medidasPreventivas:
                        e.target
                          .value,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </Campo>

            <Campo
              label={t(
                "form.responsePlan"
              )}
            >
              <textarea
                rows={3}
                value={
                  formulario
                    .planoResposta
                }
                onChange={(e) =>
                  setFormulario(
                    (atual) => ({
                      ...atual,

                      planoResposta:
                        e.target
                          .value,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </Campo>

            <Campo
              label={t(
                "form.notes"
              )}
            >
              <textarea
                rows={2}
                value={
                  formulario.observacao
                }
                onChange={(e) =>
                  setFormulario(
                    (atual) => ({
                      ...atual,

                      observacao:
                        e.target
                          .value,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </Campo>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-3">

            <button
              type="button"
              onClick={
                fecharFormulario
              }
              disabled={
                salvando
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              {t(
                "actions.cancel"
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                void salvarRisco()
              }
              disabled={
                salvando
              }
              className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              {salvando
                ? t(
                    "actions.saving"
                  )
                : t(
                    "actions.save"
                  )}
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">

        <h3 className="text-lg font-black text-slate-950 dark:text-white">
          {t(
            "risks.title"
          )}
        </h3>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {t(
            "risks.description"
          )}
        </p>

        {riscos.length ===
        0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">

            <p className="font-black text-slate-800 dark:text-slate-100">
              {t(
                "risks.emptyTitle"
              )}
            </p>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t(
                "risks.emptyDescription"
              )}
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {riscos.map(
              (risco) => (
                <article
                  key={
                    risco.id
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
                >

                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

                    <div className="min-w-0">

                      <div className="flex flex-wrap gap-2">

                        <Etiqueta>
                          {t(
                            "categories." +
                              risco.categoria
                          )}
                        </Etiqueta>

                        <Etiqueta>
                          {t(
                            "probabilities." +
                              risco.probabilidade
                          )}
                        </Etiqueta>

                        <Etiqueta>
                          {t(
                            "severities." +
                              risco.gravidade
                          )}
                        </Etiqueta>

                        <Etiqueta>
                          {t(
                            "statuses." +
                              risco.status
                          )}
                        </Etiqueta>
                      </div>

                      <h4 className="mt-3 text-base font-black text-slate-950 dark:text-white">
                        {
                          risco.titulo
                        }
                      </h4>

                      {risco.descricao ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {
                            risco.descricao
                          }
                        </p>
                      ) : null}

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">

                        <Detalhe
                          titulo={t(
                            "risks.preventiveMeasures"
                          )}
                          valor={
                            risco.medidasPreventivas ||
                            t(
                              "common.notInformed"
                            )
                          }
                        />

                        <Detalhe
                          titulo={t(
                            "risks.responsePlan"
                          )}
                          valor={
                            risco.planoResposta ||
                            t(
                              "common.notInformed"
                            )
                          }
                        />

                        <Detalhe
                          titulo={t(
                            "risks.responsible"
                          )}
                          valor={
                            risco
                              .responsavelEquipe
                              ?.nomeSnapshot ||
                            t(
                              "common.noResponsible"
                            )
                          }
                        />
                      </div>
                    </div>

                    {podeGerenciar ? (
                      <div className="flex flex-wrap gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            editar(
                              risco
                            )
                          }
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                        >
                          {t(
                            "actions.edit"
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setRiscoRemoverId(
                              risco.id
                            )
                          }
                          className="rounded-xl border border-red-300 bg-white px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-300"
                        >
                          {t(
                            "actions.remove"
                          )}
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {riscoRemoverId ===
                  risco.id ? (
                    <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20">

                      <p className="text-sm font-bold text-red-800 dark:text-red-200">
                        {t(
                          "removeConfirm"
                        )}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            setRiscoRemoverId(
                              null
                            )
                          }
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          {t(
                            "actions.cancel"
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={
                            salvando
                          }
                          onClick={() =>
                            void removerRisco(
                              risco.id
                            )
                          }
                          className="rounded-lg bg-red-700 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                        >
                          {t(
                            "actions.confirmRemove"
                          )}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              )
            )}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

          <div>
            <h3 className="text-lg font-black text-slate-950 dark:text-white">
              {t(
                "plan.title"
              )}
            </h3>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t(
                "plan.description"
              )}
            </p>
          </div>

          {podeGerenciar ? (
            <button
              type="button"
              onClick={
                abrirPlano
              }
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200"
            >
              {planoEmergencia
                ? t(
                    "actions.editPlan"
                  )
                : t(
                    "actions.configurePlan"
                  )}
            </button>
          ) : null}
        </div>

        {planoAberto ? (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-900 dark:bg-blue-950/20 sm:p-5">

            <div className="grid gap-4 lg:grid-cols-2">

              <Campo
                label={t(
                  "plan.fields.status"
                )}
              >
                <select
                  value={
                    formularioPlano.status
                  }
                  onChange={(e) =>
                    atualizarCampoPlano(
                      "status",
                      e.target
                        .value as StatusPlanoEmergencia
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {STATUS_PLANO.map(
                    (status) => (
                      <option
                        key={
                          status
                        }
                        value={
                          status
                        }
                      >
                        {t(
                          "plan.statuses." +
                            status
                        )}
                      </option>
                    )
                  )}
                </select>
              </Campo>
            </div>

            <h4 className="mt-6 text-sm font-black text-slate-950 dark:text-white">
              {t(
                "plan.sections.contacts"
              )}
            </h4>

            <div className="mt-3 grid gap-4 lg:grid-cols-2">

              <Campo
                label={t(
                  "plan.fields.schoolContact"
                )}
              >
                <input
                  value={
                    formularioPlano
                      .contatoEmergenciaEscola
                  }
                  onChange={(e) =>
                    atualizarCampoPlano(
                      "contatoEmergenciaEscola",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </Campo>

              <Campo
                label={t(
                  "plan.fields.schoolPhone"
                )}
              >
                <input
                  value={
                    formularioPlano
                      .telefoneEmergenciaEscola
                  }
                  onChange={(e) =>
                    atualizarCampoPlano(
                      "telefoneEmergenciaEscola",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </Campo>

              <Campo
                label={t(
                  "plan.fields.emergencyResponsible"
                )}
              >
                <input
                  value={
                    formularioPlano
                      .responsavelEmergenciaNome
                  }
                  onChange={(e) =>
                    atualizarCampoPlano(
                      "responsavelEmergenciaNome",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </Campo>

              <Campo
                label={t(
                  "plan.fields.emergencyResponsiblePhone"
                )}
              >
                <input
                  value={
                    formularioPlano
                      .responsavelEmergenciaTelefone
                  }
                  onChange={(e) =>
                    atualizarCampoPlano(
                      "responsavelEmergenciaTelefone",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </Campo>

              <Campo
                label={t(
                  "plan.fields.localEmergencyNumber"
                )}
              >
                <input
                  value={
                    formularioPlano
                      .numeroEmergenciaLocal
                  }
                  onChange={(e) =>
                    atualizarCampoPlano(
                      "numeroEmergenciaLocal",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </Campo>
            </div>

            <h4 className="mt-6 text-sm font-black text-slate-950 dark:text-white">
              {t(
                "plan.sections.medical"
              )}
            </h4>

            <div className="mt-3 grid gap-4 lg:grid-cols-2">

              <Campo
                label={t(
                  "plan.fields.hospital"
                )}
              >
                <input
                  value={
                    formularioPlano
                      .hospitalReferencia
                  }
                  onChange={(e) =>
                    atualizarCampoPlano(
                      "hospitalReferencia",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </Campo>

              <Campo
                label={t(
                  "plan.fields.hospitalPhone"
                )}
              >
                <input
                  value={
                    formularioPlano
                      .telefoneHospitalReferencia
                  }
                  onChange={(e) =>
                    atualizarCampoPlano(
                      "telefoneHospitalReferencia",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </Campo>

              <div className="lg:col-span-2">
                <Campo
                  label={t(
                    "plan.fields.hospitalAddress"
                  )}
                >
                  <input
                    value={
                      formularioPlano
                        .enderecoHospitalReferencia
                    }
                    onChange={(e) =>
                      atualizarCampoPlano(
                        "enderecoHospitalReferencia",
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </Campo>
              </div>

              <Campo
                label={t(
                  "plan.fields.alternativeService"
                )}
              >
                <input
                  value={
                    formularioPlano
                      .servicoAlternativoEmergencia
                  }
                  onChange={(e) =>
                    atualizarCampoPlano(
                      "servicoAlternativoEmergencia",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </Campo>

              <Campo
                label={t(
                  "plan.fields.alternativeServicePhone"
                )}
              >
                <input
                  value={
                    formularioPlano
                      .telefoneServicoAlternativo
                  }
                  onChange={(e) =>
                    atualizarCampoPlano(
                      "telefoneServicoAlternativo",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </Campo>
            </div>

            <h4 className="mt-6 text-sm font-black text-slate-950 dark:text-white">
              {t(
                "plan.sections.procedures"
              )}
            </h4>

            <div className="mt-3 space-y-4">

              <Campo
                label={t(
                  "plan.fields.meetingPoint"
                )}
              >
                <textarea
                  rows={2}
                  value={
                    formularioPlano
                      .pontoEncontroEmergencia
                  }
                  onChange={(e) =>
                    atualizarCampoPlano(
                      "pontoEncontroEmergencia",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </Campo>

              <Campo
                label={t(
                  "plan.fields.evacuation"
                )}
              >
                <textarea
                  rows={3}
                  value={
                    formularioPlano
                      .procedimentoEvacuacao
                  }
                  onChange={(e) =>
                    atualizarCampoPlano(
                      "procedimentoEvacuacao",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </Campo>

              <Campo
                label={t(
                  "plan.fields.accident"
                )}
              >
                <textarea
                  rows={3}
                  value={
                    formularioPlano
                      .procedimentoAcidente
                  }
                  onChange={(e) =>
                    atualizarCampoPlano(
                      "procedimentoAcidente",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </Campo>

              <Campo
                label={t(
                  "plan.fields.missingPerson"
                )}
              >
                <textarea
                  rows={3}
                  value={
                    formularioPlano
                      .procedimentoPessoaDesaparecida
                  }
                  onChange={(e) =>
                    atualizarCampoPlano(
                      "procedimentoPessoaDesaparecida",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </Campo>

              <Campo
                label={t(
                  "plan.fields.medicalEmergency"
                )}
              >
                <textarea
                  rows={3}
                  value={
                    formularioPlano
                      .procedimentoEmergenciaMedica
                  }
                  onChange={(e) =>
                    atualizarCampoPlano(
                      "procedimentoEmergenciaMedica",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </Campo>

              <Campo
                label={t(
                  "plan.fields.severeWeather"
                )}
              >
                <textarea
                  rows={3}
                  value={
                    formularioPlano
                      .procedimentoClimaSevero
                  }
                  onChange={(e) =>
                    atualizarCampoPlano(
                      "procedimentoClimaSevero",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </Campo>

              <Campo
                label={t(
                  "plan.fields.generalInstructions"
                )}
              >
                <textarea
                  rows={3}
                  value={
                    formularioPlano
                      .instrucoesGerais
                  }
                  onChange={(e) =>
                    atualizarCampoPlano(
                      "instrucoesGerais",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </Campo>

              <Campo
                label={t(
                  "plan.fields.notes"
                )}
              >
                <textarea
                  rows={2}
                  value={
                    formularioPlano
                      .observacao
                  }
                  onChange={(e) =>
                    atualizarCampoPlano(
                      "observacao",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </Campo>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-3">

              <button
                type="button"
                onClick={
                  fecharPlano
                }
                disabled={
                  salvandoPlano
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                {t(
                  "actions.cancelPlan"
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  void salvarPlano()
                }
                disabled={
                  salvandoPlano
                }
                className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-800 disabled:opacity-60"
              >
                {salvandoPlano
                  ? t(
                      "actions.savingPlan"
                    )
                  : t(
                      "actions.savePlan"
                    )}
              </button>
            </div>
          </div>
        ) : null}

        {!planoAberto ? (
          planoEmergencia ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">

              <div className="flex flex-wrap gap-2">
                <Etiqueta>
                  {t(
                    "plan.statuses." +
                      planoEmergencia.status
                  )}
                </Etiqueta>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">

                <Detalhe
                  titulo={t(
                    "plan.fields.emergencyResponsible"
                  )}
                  valor={
                    planoEmergencia
                      .responsavelEmergenciaNome ||
                    t(
                      "common.notInformed"
                    )
                  }
                />

                <Detalhe
                  titulo={t(
                    "plan.fields.localEmergencyNumber"
                  )}
                  valor={
                    planoEmergencia
                      .numeroEmergenciaLocal ||
                    t(
                      "common.notInformed"
                    )
                  }
                />

                <Detalhe
                  titulo={t(
                    "plan.fields.hospital"
                  )}
                  valor={
                    planoEmergencia
                      .hospitalReferencia ||
                    t(
                      "common.notInformed"
                    )
                  }
                />

                <Detalhe
                  titulo={t(
                    "plan.fields.meetingPoint"
                  )}
                  valor={
                    planoEmergencia
                      .pontoEncontroEmergencia ||
                    t(
                      "common.notInformed"
                    )
                  }
                />
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">

              <p className="font-black text-slate-800 dark:text-slate-100">
                {t(
                  "plan.emptyTitle"
                )}
              </p>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "plan.emptyDescription"
                )}
              </p>
            </div>
          )
        ) : null}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

          <div>
            <h3 className="text-lg font-black text-slate-950 dark:text-white">
              {t(
                "checkpoints.title"
              )}
            </h3>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t(
                "checkpoints.description"
              )}
            </p>
          </div>

          {podeGerenciar &&
          !checkpointAberto ? (
            <button
              type="button"
              onClick={
                abrirNovoCheckpoint
              }
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-800"
            >
              {t(
                "actions.newCheckpoint"
              )}
            </button>
          ) : null}
        </div>

        {checkpointAberto ? (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-900 dark:bg-blue-950/20 sm:p-5">

            <h4 className="text-base font-black text-slate-950 dark:text-white">
              {checkpointEditandoId
                ? t(
                    "checkpoints.form.editTitle"
                  )
                : t(
                    "checkpoints.form.newTitle"
                  )}
            </h4>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t(
                "checkpoints.form.orderInfo"
              )}
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">

              <Campo
                label={t(
                  "checkpoints.fields.name"
                )}
              >
                <input
                  value={
                    formularioCheckpoint
                      .nome
                  }
                  onChange={(e) =>
                    atualizarCampoCheckpoint(
                      "nome",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </Campo>

              <Campo
                label={t(
                  "checkpoints.fields.type"
                )}
              >
                <select
                  value={
                    formularioCheckpoint
                      .tipo
                  }
                  onChange={(e) =>
                    atualizarCampoCheckpoint(
                      "tipo",
                      e.target
                        .value as TipoCheckpoint
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {TIPOS_CHECKPOINT.map(
                    (tipo) => (
                      <option
                        key={
                          tipo
                        }
                        value={
                          tipo
                        }
                      >
                        {t(
                          "checkpoints.types." +
                            tipo
                        )}
                      </option>
                    )
                  )}
                </select>
              </Campo>

              <Campo
                label={t(
                  "checkpoints.fields.location"
                )}
              >
                <input
                  value={
                    formularioCheckpoint
                      .localNome
                  }
                  onChange={(e) =>
                    atualizarCampoCheckpoint(
                      "localNome",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </Campo>

              <Campo
                label={t(
                  "checkpoints.fields.scheduledAt"
                )}
              >
                <input
                  type="datetime-local"
                  value={
                    formularioCheckpoint
                      .previstoEm
                  }
                  onChange={(e) =>
                    atualizarCampoCheckpoint(
                      "previstoEm",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </Campo>

              <div className="lg:col-span-2">
                <Campo
                  label={t(
                    "checkpoints.fields.address"
                  )}
                >
                  <input
                    value={
                      formularioCheckpoint
                        .localEndereco
                    }
                    onChange={(e) =>
                      atualizarCampoCheckpoint(
                        "localEndereco",
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </Campo>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                <input
                  type="checkbox"
                  checked={
                    formularioCheckpoint
                      .obrigatorio
                  }
                  onChange={(e) =>
                    atualizarCampoCheckpoint(
                      "obrigatorio",
                      e.target.checked
                    )
                  }
                  className="h-4 w-4"
                />

                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {t(
                    "checkpoints.fields.required"
                  )}
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                <input
                  type="checkbox"
                  checked={
                    formularioCheckpoint
                      .ativo
                  }
                  onChange={(e) =>
                    atualizarCampoCheckpoint(
                      "ativo",
                      e.target.checked
                    )
                  }
                  className="h-4 w-4"
                />

                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {t(
                    "checkpoints.fields.active"
                  )}
                </span>
              </label>

              <div className="lg:col-span-2">
                <Campo
                  label={t(
                    "checkpoints.fields.notes"
                  )}
                >
                  <textarea
                    rows={3}
                    value={
                      formularioCheckpoint
                        .observacao
                    }
                    onChange={(e) =>
                      atualizarCampoCheckpoint(
                        "observacao",
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </Campo>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-3">

              <button
                type="button"
                onClick={
                  fecharCheckpoint
                }
                disabled={
                  salvandoCheckpoint
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                {t(
                  "actions.cancelCheckpoint"
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  void salvarCheckpoint()
                }
                disabled={
                  salvandoCheckpoint
                }
                className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-800 disabled:opacity-60"
              >
                {salvandoCheckpoint
                  ? t(
                      "actions.savingCheckpoint"
                    )
                  : t(
                      "actions.saveCheckpoint"
                    )}
              </button>
            </div>
          </div>
        ) : null}

        {checkpoints.length === 0 ? (
          !checkpointAberto ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">

              <p className="font-black text-slate-800 dark:text-slate-100">
                {t(
                  "checkpoints.emptyTitle"
                )}
              </p>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "checkpoints.emptyDescription"
                )}
              </p>
            </div>
          ) : null
        ) : (
          <div className="mt-5 space-y-3">

            {checkpoints.map(
              (checkpoint) => (
                <article
                  key={
                    checkpoint.id
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
                >

                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

                    <div className="min-w-0">

                      <div className="flex flex-wrap gap-2">

                        <Etiqueta>
                          {"#" +
                            checkpoint.ordem}
                        </Etiqueta>

                        <Etiqueta>
                          {t(
                            "checkpoints.types." +
                              checkpoint.tipo
                          )}
                        </Etiqueta>

                        <Etiqueta>
                          {checkpoint.obrigatorio
                            ? t(
                                "checkpoints.badges.required"
                              )
                            : t(
                                "checkpoints.badges.optional"
                              )}
                        </Etiqueta>

                        <Etiqueta>
                          {checkpoint.ativo
                            ? t(
                                "checkpoints.badges.active"
                              )
                            : t(
                                "checkpoints.badges.inactive"
                              )}
                        </Etiqueta>
                      </div>

                      <h4 className="mt-3 text-base font-black text-slate-950 dark:text-white">
                        {
                          checkpoint.nome
                        }
                      </h4>

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">

                        <Detalhe
                          titulo={t(
                            "checkpoints.fields.location"
                          )}
                          valor={
                            checkpoint.localNome ||
                            t(
                              "common.notInformed"
                            )
                          }
                        />

                        <Detalhe
                          titulo={t(
                            "checkpoints.fields.scheduledAt"
                          )}
                          valor={
                            formatarDataCheckpoint(
                              checkpoint.previstoEm
                            )
                          }
                        />

                        <Detalhe
                          titulo={t(
                            "checkpoints.fields.address"
                          )}
                          valor={
                            checkpoint.localEndereco ||
                            t(
                              "common.notInformed"
                            )
                          }
                        />

                        <Detalhe
                          titulo={t(
                            "checkpoints.fields.records"
                          )}
                          valor={
                            String(
                              checkpoint
                                ._count
                                ?.registros ||
                              0
                            )
                          }
                        />
                      </div>

                      {checkpoint.observacao ? (
                        <div className="mt-4">
                          <Detalhe
                            titulo={t(
                              "checkpoints.fields.notes"
                            )}
                            valor={
                              checkpoint.observacao
                            }
                          />
                        </div>
                      ) : null}
                    </div>

                    {podeGerenciar ? (
                      <div className="flex flex-wrap gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            editarCheckpoint(
                              checkpoint
                            )
                          }
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                        >
                          {t(
                            "actions.edit"
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setCheckpointRemoverId(
                              checkpoint.id
                            )
                          }
                          className="rounded-xl border border-red-300 bg-white px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-300"
                        >
                          {t(
                            "actions.remove"
                          )}
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {checkpointRemoverId ===
                  checkpoint.id ? (
                    <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20">

                      <p className="text-sm font-bold text-red-800 dark:text-red-200">
                        {checkpoint
                          ._count
                          ?.registros
                          ? t(
                              "checkpoints.deactivateConfirm"
                            )
                          : t(
                              "checkpoints.removeConfirm"
                            )}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            setCheckpointRemoverId(
                              null
                            )
                          }
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          {t(
                            "actions.cancelCheckpoint"
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={
                            salvandoCheckpoint
                          }
                          onClick={() =>
                            void removerCheckpoint(
                              checkpoint.id
                            )
                          }
                          className="rounded-lg bg-red-700 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                        >
                          {checkpoint
                            ._count
                            ?.registros
                            ? t(
                                "actions.deactivateCheckpoint"
                              )
                            : t(
                                "actions.confirmRemoveCheckpoint"
                              )}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Resumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">

      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {titulo}
      </p>

      <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
        {valor}
      </p>
    </div>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;

  children:
    React.ReactNode;
}) {
  return (
    <label className="block">

      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">
        {label}
      </span>

      {children}
    </label>
  );
}

function Etiqueta({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-black text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
      {children}
    </span>
  );
}

function Detalhe({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div>

      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {titulo}
      </p>

      <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-700 dark:text-slate-200">
        {valor}
      </p>
    </div>
  );
}

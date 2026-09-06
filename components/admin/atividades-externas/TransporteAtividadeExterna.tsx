"use client";

import { useEffect, useRef, useState } from "react";

import { useLocale, useTranslations } from "next-intl";

import CadastrosTransporte from "@/components/admin/atividades-externas/CadastrosTransporte";

type TipoModal =
  | "ONIBUS"
  | "MICRO_ONIBUS"
  | "VAN"
  | "AUTOMOVEL"
  | "VEICULO_AUTONOMO"
  | "AVIAO"
  | "HELICOPTERO"
  | "TREM"
  | "METRO"
  | "BONDE"
  | "BARCO"
  | "FERRY"
  | "NAVIO"
  | "TRANSPORTE_PUBLICO"
  | "BICICLETA"
  | "CAMINHADA"
  | "OUTRO";

type StatusTrecho =
  | "PLANEJADO"
  | "CONFIRMADO"
  | "EM_EMBARQUE"
  | "EM_TRANSITO"
  | "CONCLUIDO"
  | "CANCELADO";

type Prestador = {
  id: number;
  nome: string;
  nomeFantasia?: string | null;
  tipo: string;
};

type Trecho = {
  id: number;
  ordem: number;

  titulo?: string | null;

  modal: TipoModal;

  prestadorTransporteId?: number | null;

  origemNome: string;
  origemEndereco?: string | null;
  origemCidade?: string | null;
  origemRegiao?: string | null;
  origemPais?: string | null;

  destinoNome: string;
  destinoEndereco?: string | null;
  destinoCidade?: string | null;
  destinoRegiao?: string | null;
  destinoPais?: string | null;

  partidaPrevista?: string | null;
  chegadaPrevista?: string | null;

  partidaReal?: string | null;
  chegadaReal?: string | null;

  numeroReferencia?: string | null;

  observacao?: string | null;

  status: StatusTrecho;

  prestadorTransporte?: Prestador | null;

  veiculos: Array<{
    id: number;
    veiculoId: number;
    status: string;

    veiculo: {
      id: number;
      nomeIdentificacao?: string | null;
      tipo: string;
      marca?: string | null;
      modelo?: string | null;
      placa?: string | null;
      capacidadePassageiros?: number | null;
      tipoConducao: string;
    };

    condutores: Array<{
      id: number;
      condutorId: number;
      papel: string;

      condutor: {
        id: number;
        nome: string;
        tipo: string;
      };
    }>;

    passageiros: Array<{
      id: number;
      participanteId: number;
      assento?: string | null;
      status: string;
      embarcadoEm?: string | null;
      desembarcadoEm?: string | null;
      observacao?: string | null;
    }>;
  }>;

  passageiros: Array<{
    id: number;
    participanteId: number;
  }>;
};

type RespostaApi = {
  ok: boolean;

  podeGerenciar: boolean;

  resumo: {
    totalTrechos: number;
    totalVeiculos: number;
    totalCondutores: number;
    totalPassageiros: number;

    totalPrestadoresDisponiveis: number;
    totalVeiculosDisponiveis: number;
    totalCondutoresDisponiveis: number;
  };

  trechos: Trecho[];

  opcoes: {
    prestadores: Prestador[];

    veiculos: Array<{
      id: number;
      nomeIdentificacao?: string | null;
      tipo: string;
      placa?: string | null;
    }>;

    condutores: Array<{
      id: number;
      nome: string;
      tipo: string;
    }>;

    participantes: Array<{
      id: number;
      alunoId: number;
      statusParticipacao: string;
      statusPresenca: string;
      grupoNome?: string | null;

      aluno: {
        id: number;
        nome: string;
        nomeSocial?: string | null;
        matricula?: string | null;
        ativo: boolean;
        statusAluno: string;
      };
    }>;
  };

  error?: string;
};

type FormularioTrecho = {
  modal: TipoModal;

  titulo: string;

  prestadorTransporteId: string;

  origemNome: string;
  origemEndereco: string;
  origemCidade: string;
  origemRegiao: string;
  origemPais: string;

  destinoNome: string;
  destinoEndereco: string;
  destinoCidade: string;
  destinoRegiao: string;
  destinoPais: string;

  partidaPrevista: string;
  chegadaPrevista: string;

  numeroReferencia: string;

  observacao: string;
};

type OpcaoSelect = {
  value: string;
  label: string;
};

const MODAIS: TipoModal[] = [
  "ONIBUS",
  "MICRO_ONIBUS",
  "VAN",
  "AUTOMOVEL",
  "VEICULO_AUTONOMO",
  "AVIAO",
  "HELICOPTERO",
  "TREM",
  "METRO",
  "BONDE",
  "BARCO",
  "FERRY",
  "NAVIO",
  "TRANSPORTE_PUBLICO",
  "BICICLETA",
  "CAMINHADA",
  "OUTRO",
];

const FORMULARIO_INICIAL: FormularioTrecho = {
  modal: "ONIBUS",

  titulo: "",

  prestadorTransporteId: "",

  origemNome: "",
  origemEndereco: "",
  origemCidade: "",
  origemRegiao: "",
  origemPais: "",

  destinoNome: "",
  destinoEndereco: "",
  destinoCidade: "",
  destinoRegiao: "",
  destinoPais: "",

  partidaPrevista: "",
  chegadaPrevista: "",

  numeroReferencia: "",

  observacao: "",
};

function iconeModal(modal: TipoModal) {
  switch (modal) {
    case "ONIBUS":
    case "MICRO_ONIBUS":
      return "🚌";

    case "VAN":
      return "🚐";

    case "AUTOMOVEL":
      return "🚗";

    case "VEICULO_AUTONOMO":
      return "🤖";

    case "AVIAO":
      return "✈️";

    case "HELICOPTERO":
      return "🚁";

    case "TREM":
      return "🚆";

    case "METRO":
      return "🚇";

    case "BONDE":
      return "🚋";

    case "BARCO":
    case "FERRY":
    case "NAVIO":
      return "⛴️";

    case "TRANSPORTE_PUBLICO":
      return "🚍";

    case "BICICLETA":
      return "🚲";

    case "CAMINHADA":
      return "🚶";

    default:
      return "🚚";
  }
}

function SelectPhanyx({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;

  onChange: (value: string) => void;

  options: OpcaoSelect[];

  placeholder: string;
}) {
  const [aberto, setAberto] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fechar(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", fechar);

    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  const selecionada = options.find((option) => option.value === value);

  return (
    <div ref={ref} className="phanyx-transporte-select relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => setAberto((atual) => !atual)}
        className="phanyx-transporte-select-trigger flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium"
      >
        <span className="truncate">{selecionada?.label || placeholder}</span>

        <span
          aria-hidden="true"
          className={[
            "shrink-0 text-[10px] transition-transform",
            aberto ? "rotate-180" : "",
          ].join(" ")}
        >
          ▼
        </span>
      </button>

      {aberto ? (
        <div
          role="listbox"
          className="phanyx-transporte-select-menu absolute left-0 right-0 top-[calc(100%+6px)] z-[100] max-h-72 overflow-y-auto rounded-xl border p-1.5 shadow-xl"
        >
          {options.map((option) => {
            const selecionado = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selecionado}
                onClick={() => {
                  onChange(option.value);

                  setAberto(false);
                }}
                className={[
                  "phanyx-transporte-select-option",
                  selecionado ? "is-selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span>{option.label}</span>

                {selecionado ? <span>✓</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function TransporteAtividadeExterna({
  atividadeId,
  onTransporteAlterado,
}: {
  atividadeId: number;

  onTransporteAlterado?: () => void | Promise<void>;
}) {
  const t = useTranslations("AdminExternalActivityTransport");

  const locale = useLocale();

  const [carregando, setCarregando] = useState(true);

  const [salvando, setSalvando] = useState(false);

  const [podeGerenciar, setPodeGerenciar] = useState(false);

  const [trechos, setTrechos] = useState<Trecho[]>([]);

  const [prestadores, setPrestadores] = useState<Prestador[]>([]);

  const [veiculosDisponiveis, setVeiculosDisponiveis] = useState<
    RespostaApi["opcoes"]["veiculos"]
  >([]);

  const [condutoresDisponiveis, setCondutoresDisponiveis] = useState<
    RespostaApi["opcoes"]["condutores"]
  >([]);

  const [participantesDisponiveis, setParticipantesDisponiveis] = useState<
    RespostaApi["opcoes"]["participantes"]
  >([]);

  const [
    participanteSelecionadoPorTrechoVeiculo,
    setParticipanteSelecionadoPorTrechoVeiculo,
  ] = useState<Record<number, string>>({});

  const [assentoPorTrechoVeiculo, setAssentoPorTrechoVeiculo] = useState<
    Record<number, string>
  >({});

  const [
    vinculandoPassageiroTrechoVeiculoId,
    setVinculandoPassageiroTrechoVeiculoId,
  ] = useState<number | null>(null);

  const [removendoPassageiroId, setRemovendoPassageiroId] = useState<
    number | null
  >(null);

  const [removendoCondutorId, setRemovendoCondutorId] = useState<number | null>(
    null,
  );

  const [confirmandoRemocaoCondutorId, setConfirmandoRemocaoCondutorId] =
    useState<number | null>(null);

  const [confirmandoRemocaoPassageiroId, setConfirmandoRemocaoPassageiroId] =
    useState<number | null>(null);

  const [atualizandoStatusPassageiro, setAtualizandoStatusPassageiro] =
    useState<{
      passageiroId: number;
      novoStatus: string;
    } | null>(null);

  const [
    condutorSelecionadoPorTrechoVeiculo,
    setCondutorSelecionadoPorTrechoVeiculo,
  ] = useState<Record<number, string>>({});

  const [papelCondutorPorTrechoVeiculo, setPapelCondutorPorTrechoVeiculo] =
    useState<Record<number, string>>({});

  const [
    vinculandoCondutorTrechoVeiculoId,
    setVinculandoCondutorTrechoVeiculoId,
  ] = useState<number | null>(null);

  const [veiculoSelecionadoPorTrecho, setVeiculoSelecionadoPorTrecho] =
    useState<Record<number, string>>({});

  const [vinculandoVeiculoTrechoId, setVinculandoVeiculoTrechoId] = useState<
    number | null
  >(null);

  const [removendoVeiculoId, setRemovendoVeiculoId] = useState<number | null>(
    null,
  );

  const [confirmandoRemocaoVeiculoId, setConfirmandoRemocaoVeiculoId] =
    useState<number | null>(null);

  const [atualizandoStatusVeiculo, setAtualizandoStatusVeiculo] = useState<{
    trechoVeiculoId: number;
    novoStatus: "CONFIRMADO" | "EM_EMBARQUE" | "EM_TRANSITO" | "CHEGOU";
  } | null>(null);

  const [resumo, setResumo] = useState({
    totalTrechos: 0,
    totalVeiculos: 0,
    totalCondutores: 0,
    totalPassageiros: 0,
  });

  const [formularioAberto, setFormularioAberto] = useState(false);

  const [cadastrosAbertos, setCadastrosAbertos] = useState(false);

  const [formulario, setFormulario] = useState<FormularioTrecho>({
    ...FORMULARIO_INICIAL,
  });

  const [erro, setErro] = useState("");

  const [sucesso, setSucesso] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      const resposta = await fetch(
        `/api/admin/atividades-externas/${atividadeId}/transporte`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const dados = (await resposta.json()) as RespostaApi;

      if (!resposta.ok || !dados.ok) {
        throw new Error(dados.error || "ERRO_CARREGAR");
      }

      setPodeGerenciar(dados.podeGerenciar);

      setTrechos(dados.trechos || []);

      setPrestadores(dados.opcoes?.prestadores || []);

      setVeiculosDisponiveis(dados.opcoes?.veiculos || []);

      setCondutoresDisponiveis(dados.opcoes?.condutores || []);

      setParticipantesDisponiveis(dados.opcoes?.participantes || []);

      setResumo({
        totalTrechos: dados.resumo?.totalTrechos || 0,

        totalVeiculos: dados.resumo?.totalVeiculos || 0,

        totalCondutores: dados.resumo?.totalCondutores || 0,

        totalPassageiros: dados.resumo?.totalPassageiros || 0,
      });
    } catch (error) {
      console.error("[TRANSPORTE_ATIVIDADE_CARREGAR]", error);

      setErro(t("errors.load"));
    } finally {
      setCarregando(false);
    }
  }

  async function vincularVeiculo(trechoId: number) {
    const veiculoIdTexto = veiculoSelecionadoPorTrecho[trechoId] || "";

    const veiculoId = Number(veiculoIdTexto);

    if (!Number.isInteger(veiculoId) || veiculoId <= 0) {
      setErro(t("vehicleAssignment.vehicleRequired"));

      setSucesso("");

      return;
    }

    setVinculandoVeiculoTrechoId(trechoId);

    setErro("");
    setSucesso("");

    try {
      const resposta = await fetch(
        `/api/admin/atividades-externas/${atividadeId}/transporte`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            acao: "VINCULAR_VEICULO",

            trechoId,

            veiculoId,
          }),
        },
      );

      const dados = (await resposta.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!resposta.ok || !dados.ok) {
        throw new Error(dados.error || "ERRO_VINCULAR_VEICULO");
      }

      setVeiculoSelecionadoPorTrecho((atual) => ({
        ...atual,
        [trechoId]: "",
      }));

      setSucesso(t("vehicleAssignment.vehicleLinked"));

      await carregar();
    } catch (error) {
      console.error("[TRANSPORTE_ATIVIDADE_VINCULAR_VEICULO]", error);

      setErro(t("vehicleAssignment.linkError"));
    } finally {
      setVinculandoVeiculoTrechoId(null);
    }
  }

  async function vincularCondutor(trechoVeiculoId: number) {
    const condutorIdTexto =
      condutorSelecionadoPorTrechoVeiculo[trechoVeiculoId] || "";

    const condutorId = Number(condutorIdTexto);

    if (!Number.isInteger(condutorId) || condutorId <= 0) {
      setErro(t("driverAssignment.driverRequired"));

      setSucesso("");

      return;
    }

    const papel = papelCondutorPorTrechoVeiculo[trechoVeiculoId] || "PRINCIPAL";

    setVinculandoCondutorTrechoVeiculoId(trechoVeiculoId);

    setErro("");
    setSucesso("");

    try {
      const resposta = await fetch(
        `/api/admin/atividades-externas/${atividadeId}/transporte`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            acao: "VINCULAR_CONDUTOR",

            trechoVeiculoId,

            condutorId,

            papel,
          }),
        },
      );

      const dados = (await resposta.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!resposta.ok || !dados.ok) {
        throw new Error(dados.error || "ERRO_VINCULAR_CONDUTOR");
      }

      setCondutorSelecionadoPorTrechoVeiculo((atual) => ({
        ...atual,

        [trechoVeiculoId]: "",
      }));

      setPapelCondutorPorTrechoVeiculo((atual) => ({
        ...atual,

        [trechoVeiculoId]: "PRINCIPAL",
      }));

      setSucesso(t("driverAssignment.driverLinked"));

      await carregar();
    } catch (error) {
      console.error("[TRANSPORTE_ATIVIDADE_VINCULAR_CONDUTOR]", error);

      setErro(t("driverAssignment.linkError"));
    } finally {
      setVinculandoCondutorTrechoVeiculoId(null);
    }
  }

  async function vincularPassageiro(trechoVeiculoId: number) {
    const participanteIdTexto =
      participanteSelecionadoPorTrechoVeiculo[trechoVeiculoId] || "";

    const participanteId = Number(participanteIdTexto);

    if (!Number.isInteger(participanteId) || participanteId <= 0) {
      setErro(t("passengerAssignment.passengerRequired"));

      setSucesso("");

      return;
    }

    setVinculandoPassageiroTrechoVeiculoId(trechoVeiculoId);

    setErro("");
    setSucesso("");

    try {
      const resposta = await fetch(
        `/api/admin/atividades-externas/${atividadeId}/transporte`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            acao: "VINCULAR_PASSAGEIRO",

            trechoVeiculoId,

            participanteId,

            assento: assentoPorTrechoVeiculo[trechoVeiculoId]?.trim() || null,
          }),
        },
      );

      const dados = (await resposta.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!resposta.ok || !dados.ok) {
        if (dados.error === "PARTICIPANTE_JA_VINCULADO_AO_TRECHO") {
          setErro(t("passengerAssignment.alreadyLinkedToSegment"));

          return;
        }

        throw new Error(dados.error || "ERRO_VINCULAR_PASSAGEIRO");
      }

      setParticipanteSelecionadoPorTrechoVeiculo((atual) => ({
        ...atual,

        [trechoVeiculoId]: "",
      }));

      setAssentoPorTrechoVeiculo((atual) => ({
        ...atual,

        [trechoVeiculoId]: "",
      }));

      setSucesso(t("passengerAssignment.passengerLinked"));

      await carregar();
    } catch (error) {
      console.error("[TRANSPORTE_ATIVIDADE_VINCULAR_PASSAGEIRO]", error);

      setErro(t("passengerAssignment.linkError"));
    } finally {
      setVinculandoPassageiroTrechoVeiculoId(null);
    }
  }

  async function desvincularPassageiro(passageiroId: number) {
    if (!Number.isInteger(passageiroId) || passageiroId <= 0) {
      return;
    }

    setRemovendoPassageiroId(passageiroId);

    setErro("");
    setSucesso("");

    try {
      const resposta = await fetch(
        `/api/admin/atividades-externas/${atividadeId}/transporte`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            acao: "DESVINCULAR_PASSAGEIRO",

            passageiroId,
          }),
        },
      );

      const dados = (await resposta.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!resposta.ok || !dados.ok) {
        if (dados.error === "PASSAGEIRO_NAO_PODE_SER_DESVINCULADO") {
          setErro(t("passengerAssignment.cannotRemoveAfterOperation"));

          return;
        }

        throw new Error(dados.error || "ERRO_DESVINCULAR_PASSAGEIRO");
      }

      setSucesso(t("passengerAssignment.passengerRemoved"));

      setConfirmandoRemocaoPassageiroId(null);

      await carregar();
    } catch (error) {
      console.error("[TRANSPORTE_ATIVIDADE_DESVINCULAR_PASSAGEIRO]", error);

      setErro(t("passengerAssignment.removeError"));
    } finally {
      setRemovendoPassageiroId(null);
    }
  }

  async function atualizarStatusPassageiro(
    passageiroId: number,
    novoStatus:
      | "AGUARDANDO_EMBARQUE"
      | "EMBARCADO"
      | "NAO_EMBARCOU"
      | "DESEMBARCADO",
  ) {
    if (!Number.isInteger(passageiroId) || passageiroId <= 0) {
      return;
    }

    setAtualizandoStatusPassageiro({
      passageiroId,
      novoStatus,
    });

    setErro("");
    setSucesso("");

    try {
      const resposta = await fetch(
        `/api/admin/atividades-externas/${atividadeId}/transporte`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            acao: "ATUALIZAR_STATUS_PASSAGEIRO",

            passageiroId,

            status: novoStatus,
          }),
        },
      );

      const dados = (await resposta.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!resposta.ok || !dados.ok) {
        if (dados.error === "TRANSICAO_STATUS_PASSAGEIRO_INVALIDA") {
          setErro(t("passengerAssignment.invalidStatusTransition"));

          return;
        }

        throw new Error(dados.error || "ERRO_ATUALIZAR_STATUS_PASSAGEIRO");
      }

      if (novoStatus === "AGUARDANDO_EMBARQUE") {
        setSucesso(t("passengerAssignment.waitingBoardingSet"));
      } else if (novoStatus === "EMBARCADO") {
        setSucesso(t("passengerAssignment.boardedSet"));
      } else if (novoStatus === "NAO_EMBARCOU") {
        setSucesso(t("passengerAssignment.noShowSet"));
      } else {
        setSucesso(t("passengerAssignment.disembarkedSet"));
      }

      await carregar();
    } catch (error) {
      console.error(
        "[TRANSPORTE_ATIVIDADE_ATUALIZAR_STATUS_PASSAGEIRO]",
        error,
      );

      setErro(t("passengerAssignment.statusUpdateError"));
    } finally {
      setAtualizandoStatusPassageiro(null);
    }
  }

  async function desvincularCondutor(atribuicaoCondutorId: number) {
    if (!Number.isInteger(atribuicaoCondutorId) || atribuicaoCondutorId <= 0) {
      return;
    }

    setRemovendoCondutorId(atribuicaoCondutorId);

    setErro("");
    setSucesso("");

    try {
      const resposta = await fetch(
        `/api/admin/atividades-externas/${atividadeId}/transporte`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            acao: "DESVINCULAR_CONDUTOR",

            atribuicaoCondutorId,
          }),
        },
      );

      const dados = (await resposta.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!resposta.ok || !dados.ok) {
        if (dados.error === "CONDUTOR_NAO_PODE_SER_DESVINCULADO") {
          setErro(t("driverAssignment.cannotRemoveAfterOperation"));

          return;
        }

        throw new Error(dados.error || "ERRO_DESVINCULAR_CONDUTOR");
      }

      setSucesso(t("driverAssignment.driverRemoved"));

      setConfirmandoRemocaoCondutorId(null);

      await carregar();
    } catch (error) {
      console.error("[TRANSPORTE_ATIVIDADE_DESVINCULAR_CONDUTOR]", error);

      setErro(t("driverAssignment.removeError"));
    } finally {
      setRemovendoCondutorId(null);
    }
  }

  async function desvincularVeiculo(trechoVeiculoId: number) {
    if (!Number.isInteger(trechoVeiculoId) || trechoVeiculoId <= 0) {
      return;
    }

    setRemovendoVeiculoId(trechoVeiculoId);

    setErro("");
    setSucesso("");

    try {
      const resposta = await fetch(
        `/api/admin/atividades-externas/${atividadeId}/transporte`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            acao: "DESVINCULAR_VEICULO",

            trechoVeiculoId,
          }),
        },
      );

      const dados = (await resposta.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!resposta.ok || !dados.ok) {
        if (dados.error === "VEICULO_POSSUI_VINCULOS") {
          setErro(t("vehicleAssignment.hasLinks"));

          return;
        }

        if (dados.error === "VEICULO_NAO_PODE_SER_DESVINCULADO") {
          setErro(t("vehicleAssignment.cannotRemoveAfterOperation"));

          return;
        }

        throw new Error(dados.error || "ERRO_DESVINCULAR_VEICULO");
      }

      setSucesso(t("vehicleAssignment.vehicleRemoved"));

      setConfirmandoRemocaoVeiculoId(null);

      await carregar();
    } catch (error) {
      console.error("[TRANSPORTE_ATIVIDADE_DESVINCULAR_VEICULO]", error);

      setErro(t("vehicleAssignment.removeError"));
    } finally {
      setRemovendoVeiculoId(null);
    }
  }

  async function atualizarStatusVeiculo(
    trechoVeiculoId: number,
    novoStatus: "CONFIRMADO" | "EM_EMBARQUE" | "EM_TRANSITO" | "CHEGOU",
  ) {
    if (!Number.isInteger(trechoVeiculoId) || trechoVeiculoId <= 0) {
      return;
    }

    setAtualizandoStatusVeiculo({
      trechoVeiculoId,
      novoStatus,
    });

    setErro("");
    setSucesso("");

    try {
      const resposta = await fetch(
        `/api/admin/atividades-externas/${atividadeId}/transporte`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            acao: "ATUALIZAR_STATUS_VEICULO",

            trechoVeiculoId,

            status: novoStatus,
          }),
        },
      );

      const dados = (await resposta.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!resposta.ok || !dados.ok) {
        if (dados.error === "TRANSICAO_STATUS_VEICULO_INVALIDA") {
          setErro(t("vehicleAssignment.invalidStatusTransition"));

          return;
        }

        if (dados.error === "VEICULO_SEM_CONDUTOR") {
          setErro(t("vehicleAssignment.noDriver"));

          return;
        }

        if (dados.error === "PASSAGEIROS_PENDENTES_EMBARQUE") {
          setErro(t("vehicleAssignment.pendingPassengers"));

          return;
        }

        if (dados.error === "TRECHO_NAO_PERMITE_OPERACAO") {
          setErro(t("vehicleAssignment.segmentNotOperational"));

          return;
        }

        throw new Error(dados.error || "ERRO_ATUALIZAR_STATUS_VEICULO");
      }

      if (novoStatus === "CONFIRMADO") {
        setSucesso(t("vehicleAssignment.vehicleConfirmed"));
      } else if (novoStatus === "EM_EMBARQUE") {
        setSucesso(t("vehicleAssignment.boardingStarted"));
      } else if (novoStatus === "EM_TRANSITO") {
        setSucesso(t("vehicleAssignment.tripStarted"));
      } else {
        setSucesso(t("vehicleAssignment.arrivalRegistered"));
      }

      await carregar();
    } catch (error) {
      console.error("[TRANSPORTE_ATIVIDADE_ATUALIZAR_STATUS_VEICULO]", error);

      setErro(t("vehicleAssignment.statusUpdateError"));
    } finally {
      setAtualizandoStatusVeiculo(null);
    }
  }

  useEffect(() => {
    void carregar();
  }, [atividadeId]);

  function alterarCampo(campo: keyof FormularioTrecho, valor: string) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function formatarDataHora(valor?: string | null) {
    if (!valor) {
      return t("common.notInformed");
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return t("common.notInformed");
    }

    return new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(data);
  }

  async function salvarTrecho() {
    setErro("");
    setSucesso("");

    if (!formulario.origemNome.trim()) {
      setErro(t("errors.originRequired"));

      return;
    }

    if (!formulario.destinoNome.trim()) {
      setErro(t("errors.destinationRequired"));

      return;
    }

    setSalvando(true);

    try {
      const resposta = await fetch(
        `/api/admin/atividades-externas/${atividadeId}/transporte`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            modal: formulario.modal,

            titulo: formulario.titulo,

            prestadorTransporteId: formulario.prestadorTransporteId || null,

            origemNome: formulario.origemNome,

            origemEndereco: formulario.origemEndereco,

            origemCidade: formulario.origemCidade,

            origemRegiao: formulario.origemRegiao,

            origemPais: formulario.origemPais,

            destinoNome: formulario.destinoNome,

            destinoEndereco: formulario.destinoEndereco,

            destinoCidade: formulario.destinoCidade,

            destinoRegiao: formulario.destinoRegiao,

            destinoPais: formulario.destinoPais,

            partidaPrevista: formulario.partidaPrevista
              ? new Date(formulario.partidaPrevista).toISOString()
              : null,

            chegadaPrevista: formulario.chegadaPrevista
              ? new Date(formulario.chegadaPrevista).toISOString()
              : null,

            numeroReferencia: formulario.numeroReferencia,

            observacao: formulario.observacao,
          }),
        },
      );

      const dados = await resposta.json();

      if (!resposta.ok || !dados?.ok) {
        const codigo = String(dados?.error || "");

        if (codigo === "CHEGADA_ANTES_DA_PARTIDA") {
          throw new Error("CHEGADA_ANTES_DA_PARTIDA");
        }

        throw new Error(codigo || "ERRO_SALVAR");
      }

      setFormulario({
        ...FORMULARIO_INICIAL,
      });

      setFormularioAberto(false);

      setSucesso(t("success.created"));

      await carregar();

      await onTransporteAlterado?.();
    } catch (error) {
      console.error("[TRANSPORTE_ATIVIDADE_SALVAR]", error);

      const codigo = error instanceof Error ? error.message : "";

      if (codigo === "CHEGADA_ANTES_DA_PARTIDA") {
        setErro(t("errors.arrivalBeforeDeparture"));
      } else {
        setErro(t("errors.save"));
      }
    } finally {
      setSalvando(false);
    }
  }

  const opcoesPrestadores: OpcaoSelect[] = [
    {
      value: "",
      label: t("form.noProvider"),
    },

    ...prestadores.map((prestador) => ({
      value: String(prestador.id),

      label: prestador.nomeFantasia || prestador.nome,
    })),
  ];

  if (carregando) {
    return (
      <div className="phanyx-transporte-loading rounded-2xl border p-6 text-sm">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="phanyx-transporte space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black">🚌 {t("title")}</h2>

          <p className="mt-1 text-sm opacity-80">{t("description")}</p>
        </div>

        {podeGerenciar ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setErro("");
                setSucesso("");

                setCadastrosAbertos((atual) => !atual);

                setFormularioAberto(false);
              }}
              className="phanyx-transporte-secondary-button rounded-xl border px-4 py-3 text-sm font-extrabold"
            >
              {t("actions.registrations")}
            </button>

            <button
              type="button"
              onClick={() => {
                setErro("");
                setSucesso("");

                setFormularioAberto((atual) => !atual);

                setCadastrosAbertos(false);
              }}
              className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-blue-800"
            >
              {formularioAberto ? t("actions.cancel") : t("actions.addSegment")}
            </button>
          </div>
        ) : null}
      </div>

      {erro ? (
        <div className="phanyx-transporte-error rounded-xl border px-4 py-3 text-sm font-semibold">
          {erro}
        </div>
      ) : null}

      {sucesso ? (
        <div className="phanyx-transporte-success rounded-xl border px-4 py-3 text-sm font-semibold">
          {sucesso}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          valor={resumo.totalTrechos}
          rotulo={t("summary.segments")}
          icone="🛣️"
        />

        <ResumoCard
          valor={resumo.totalVeiculos}
          rotulo={t("summary.vehicles")}
          icone="🚐"
        />

        <ResumoCard
          valor={resumo.totalCondutores}
          rotulo={t("summary.drivers")}
          icone="🧑‍✈️"
        />

        <ResumoCard
          valor={resumo.totalPassageiros}
          rotulo={t("summary.passengers")}
          icone="👥"
        />
      </div>

      {cadastrosAbertos ? (
        <CadastrosTransporte
          onFechar={() => setCadastrosAbertos(false)}
          onCadastrosAlterados={carregar}
        />
      ) : null}

      {formularioAberto ? (
        <div className="phanyx-transporte-form rounded-2xl border p-4 sm:p-5">
          <div className="mb-5">
            <h3 className="text-lg font-black">{t("form.title")}</h3>

            <p className="mt-1 text-sm opacity-75">{t("form.description")}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Campo label={t("form.segmentTitle")}>
              <input
                value={formulario.titulo}
                onChange={(e) => alterarCampo("titulo", e.target.value)}
                placeholder={t("form.segmentTitlePlaceholder")}
                className="phanyx-transporte-input"
              />
            </Campo>

            <Campo label={t("form.modal")} obrigatorio>
              <SelectPhanyx
                value={formulario.modal}
                onChange={(valor) => alterarCampo("modal", valor)}
                placeholder={t("form.modal")}
                options={MODAIS.map((modal) => ({
                  value: modal,

                  label: `${iconeModal(modal)} ${t(`modals.${modal}`)}`,
                }))}
              />
            </Campo>

            <Campo label={t("form.provider")}>
              <SelectPhanyx
                value={formulario.prestadorTransporteId}
                onChange={(valor) =>
                  alterarCampo("prestadorTransporteId", valor)
                }
                placeholder={t("form.provider")}
                options={opcoesPrestadores}
              />
            </Campo>

            <Campo label={t("form.reference")}>
              <input
                value={formulario.numeroReferencia}
                onChange={(e) =>
                  alterarCampo("numeroReferencia", e.target.value)
                }
                placeholder={t("form.referencePlaceholder")}
                className="phanyx-transporte-input"
              />
            </Campo>
          </div>

          <div className="my-5 grid gap-5 xl:grid-cols-2">
            <LocalCard titulo={`📍 ${t("form.origin")}`}>
              <Campo label={t("form.placeName")} obrigatorio>
                <input
                  value={formulario.origemNome}
                  onChange={(e) => alterarCampo("origemNome", e.target.value)}
                  className="phanyx-transporte-input"
                />
              </Campo>

              <Campo label={t("form.address")}>
                <input
                  value={formulario.origemEndereco}
                  onChange={(e) =>
                    alterarCampo("origemEndereco", e.target.value)
                  }
                  className="phanyx-transporte-input"
                />
              </Campo>

              <div className="grid gap-3 sm:grid-cols-3">
                <Campo label={t("form.city")}>
                  <input
                    value={formulario.origemCidade}
                    onChange={(e) =>
                      alterarCampo("origemCidade", e.target.value)
                    }
                    className="phanyx-transporte-input"
                  />
                </Campo>

                <Campo label={t("form.region")}>
                  <input
                    value={formulario.origemRegiao}
                    onChange={(e) =>
                      alterarCampo("origemRegiao", e.target.value)
                    }
                    className="phanyx-transporte-input"
                  />
                </Campo>

                <Campo label={t("form.country")}>
                  <input
                    value={formulario.origemPais}
                    onChange={(e) => alterarCampo("origemPais", e.target.value)}
                    className="phanyx-transporte-input"
                  />
                </Campo>
              </div>
            </LocalCard>

            <LocalCard titulo={`🏁 ${t("form.destination")}`}>
              <Campo label={t("form.placeName")} obrigatorio>
                <input
                  value={formulario.destinoNome}
                  onChange={(e) => alterarCampo("destinoNome", e.target.value)}
                  className="phanyx-transporte-input"
                />
              </Campo>

              <Campo label={t("form.address")}>
                <input
                  value={formulario.destinoEndereco}
                  onChange={(e) =>
                    alterarCampo("destinoEndereco", e.target.value)
                  }
                  className="phanyx-transporte-input"
                />
              </Campo>

              <div className="grid gap-3 sm:grid-cols-3">
                <Campo label={t("form.city")}>
                  <input
                    value={formulario.destinoCidade}
                    onChange={(e) =>
                      alterarCampo("destinoCidade", e.target.value)
                    }
                    className="phanyx-transporte-input"
                  />
                </Campo>

                <Campo label={t("form.region")}>
                  <input
                    value={formulario.destinoRegiao}
                    onChange={(e) =>
                      alterarCampo("destinoRegiao", e.target.value)
                    }
                    className="phanyx-transporte-input"
                  />
                </Campo>

                <Campo label={t("form.country")}>
                  <input
                    value={formulario.destinoPais}
                    onChange={(e) =>
                      alterarCampo("destinoPais", e.target.value)
                    }
                    className="phanyx-transporte-input"
                  />
                </Campo>
              </div>
            </LocalCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Campo label={t("form.departure")}>
              <input
                type="datetime-local"
                value={formulario.partidaPrevista}
                onChange={(e) =>
                  alterarCampo("partidaPrevista", e.target.value)
                }
                className="phanyx-transporte-input"
              />
            </Campo>

            <Campo label={t("form.arrival")}>
              <input
                type="datetime-local"
                value={formulario.chegadaPrevista}
                onChange={(e) =>
                  alterarCampo("chegadaPrevista", e.target.value)
                }
                className="phanyx-transporte-input"
              />
            </Campo>
          </div>

          <div className="mt-4">
            <Campo label={t("form.notes")}>
              <textarea
                rows={3}
                value={formulario.observacao}
                onChange={(e) => alterarCampo("observacao", e.target.value)}
                placeholder={t("form.notesPlaceholder")}
                className="phanyx-transporte-input min-h-[96px] resize-y"
              />
            </Campo>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              disabled={salvando}
              onClick={() => void salvarTrecho()}
              className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? t("actions.saving") : t("actions.saveSegment")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="phanyx-transporte-card rounded-2xl border p-4 sm:p-5">
        <h3 className="text-lg font-black">{t("segments.title")}</h3>

        <p className="mt-1 text-sm opacity-75">{t("segments.description")}</p>

        {trechos.length === 0 ? (
          <div className="phanyx-transporte-empty mt-5 rounded-xl border p-8 text-center">
            <div className="text-3xl">🛣️</div>

            <p className="mt-3 font-extrabold">{t("segments.emptyTitle")}</p>

            <p className="mt-1 text-sm opacity-75">
              {t("segments.emptyDescription")}
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {trechos.map((trecho) => (
              <div
                key={trecho.id}
                className="phanyx-transporte-segment rounded-2xl border p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <div className="phanyx-transporte-modal-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl">
                      {iconeModal(trecho.modal)}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-black uppercase tracking-wide opacity-65">
                        {t("segments.segmentNumber", {
                          number: trecho.ordem,
                        })}
                      </div>

                      <h4 className="mt-0.5 break-words text-base font-black">
                        {trecho.titulo || t(`modals.${trecho.modal}`)}
                      </h4>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="phanyx-transporte-chip rounded-full border px-2.5 py-1 text-xs font-bold">
                          {t(`modals.${trecho.modal}`)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="phanyx-transporte-status rounded-full border px-3 py-1.5 text-xs font-black">
                    {t(`statuses.${trecho.status}`)}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                  <LocalResumo
                    rotulo={t("segments.origin")}
                    nome={trecho.origemNome}
                    detalhes={[
                      trecho.origemCidade,
                      trecho.origemRegiao,
                      trecho.origemPais,
                    ]}
                  />

                  <div className="hidden text-center text-2xl opacity-55 lg:block">
                    →
                  </div>

                  <LocalResumo
                    rotulo={t("segments.destination")}
                    nome={trecho.destinoNome}
                    detalhes={[
                      trecho.destinoCidade,
                      trecho.destinoRegiao,
                      trecho.destinoPais,
                    ]}
                  />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <InfoCard
                    rotulo={t("segments.departure")}
                    valor={formatarDataHora(trecho.partidaPrevista)}
                  />

                  <InfoCard
                    rotulo={t("segments.arrival")}
                    valor={formatarDataHora(trecho.chegadaPrevista)}
                  />

                  <InfoCard
                    rotulo={t("segments.provider")}
                    valor={
                      trecho.prestadorTransporte?.nomeFantasia ||
                      trecho.prestadorTransporte?.nome ||
                      t("common.notDefined")
                    }
                  />

                  <InfoCard
                    rotulo={t("segments.vehicles")}
                    valor={String(trecho.veiculos.length)}
                  />
                </div>

                <div className="mt-4 rounded-2xl border p-4">
                  <div className="flex flex-col gap-1">
                    <h5 className="text-sm font-black">
                      🚐 {t("vehicleAssignment.title")}
                    </h5>

                    <p className="text-xs font-bold opacity-65">
                      {t("vehicleAssignment.linkedVehicles")}
                    </p>
                  </div>

                  {trecho.veiculos.length > 0 ? (
                    <div className="mt-3 space-y-3">
                      {trecho.veiculos.map((vinculo) => {
                        const condutoresNaoVinculados =
                          condutoresDisponiveis.filter(
                            (condutor) =>
                              !vinculo.condutores.some(
                                (atribuicao) =>
                                  atribuicao.condutorId === condutor.id,
                              ),
                          );

                        const participantesNaoVinculados =
                          participantesDisponiveis.filter(
                            (participante) =>
                              !trecho.passageiros.some(
                                (passageiro) =>
                                  passageiro.participanteId === participante.id,
                              ),
                          );

                        const atualizandoEsteVeiculo =
                          atualizandoStatusVeiculo?.trechoVeiculoId ===
                          vinculo.id;

                        const statusVeiculoSolicitado = atualizandoEsteVeiculo
                          ? atualizandoStatusVeiculo?.novoStatus
                          : null;

                        return (
                          <div
                            key={vinculo.id}
                            className="rounded-xl border p-3"
                          >
                            <div className="flex flex-col gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="phanyx-transporte-chip rounded-full border px-3 py-1.5 text-xs font-bold">
                                  🚐{" "}
                                  {vinculo.veiculo.nomeIdentificacao ||
                                    vinculo.veiculo.placa ||
                                    vinculo.veiculo.tipo}
                                  {vinculo.veiculo.nomeIdentificacao &&
                                  vinculo.veiculo.placa
                                    ? ` • ${vinculo.veiculo.placa}`
                                    : ""}
                                </span>

                                <span className="phanyx-transporte-status rounded-full border px-2.5 py-1 text-xs font-black">
                                  {t(
                                    `vehicleAssignment.status.${vinculo.status}`,
                                  )}
                                </span>

                                {podeGerenciar &&
                                vinculo.status === "PLANEJADO" &&
                                vinculo.condutores.length === 0 &&
                                vinculo.passageiros.length === 0 ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirmandoRemocaoVeiculoId(vinculo.id)
                                    }
                                    disabled={removendoVeiculoId === vinculo.id}
                                    title={t("vehicleAssignment.removeVehicle")}
                                    aria-label={t(
                                      "vehicleAssignment.removeVehicle",
                                    )}
                                    className="flex h-7 w-7 items-center justify-center rounded-full border text-sm font-black opacity-60 transition hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    ×
                                  </button>
                                ) : null}
                              </div>

                              {confirmandoRemocaoVeiculoId === vinculo.id ? (
                                <div className="w-fit rounded-xl border p-3">
                                  <p className="text-sm font-bold">
                                    {t("vehicleAssignment.removeQuestion")}
                                  </p>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      disabled={
                                        removendoVeiculoId === vinculo.id
                                      }
                                      onClick={() =>
                                        setConfirmandoRemocaoVeiculoId(null)
                                      }
                                      className="phanyx-transporte-chip rounded-xl border px-3 py-2 text-xs font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {t("vehicleAssignment.cancelRemove")}
                                    </button>

                                    <button
                                      type="button"
                                      disabled={
                                        removendoVeiculoId === vinculo.id
                                      }
                                      onClick={() =>
                                        void desvincularVeiculo(vinculo.id)
                                      }
                                      className="rounded-xl border border-red-300 px-3 py-2 text-xs font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                                    >
                                      {removendoVeiculoId === vinculo.id
                                        ? t("vehicleAssignment.removingVehicle")
                                        : t("vehicleAssignment.confirmRemove")}
                                    </button>
                                  </div>
                                </div>
                              ) : null}

                              {podeGerenciar &&
                              confirmandoRemocaoVeiculoId !== vinculo.id &&
                              vinculo.status !== "CHEGOU" &&
                              vinculo.status !== "CANCELADO" ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  {vinculo.status === "PLANEJADO" ? (
                                    <button
                                      type="button"
                                      disabled={
                                        atualizandoEsteVeiculo ||
                                        removendoVeiculoId === vinculo.id
                                      }
                                      onClick={() =>
                                        void atualizarStatusVeiculo(
                                          vinculo.id,
                                          "CONFIRMADO",
                                        )
                                      }
                                      className="phanyx-transporte-primary-button rounded-xl px-3 py-2 text-xs font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {statusVeiculoSolicitado === "CONFIRMADO"
                                        ? t(
                                            "vehicleAssignment.confirmingVehicle",
                                          )
                                        : t("vehicleAssignment.confirmVehicle")}
                                    </button>
                                  ) : null}

                                  {vinculo.status === "CONFIRMADO" ? (
                                    <button
                                      type="button"
                                      disabled={atualizandoEsteVeiculo}
                                      onClick={() =>
                                        void atualizarStatusVeiculo(
                                          vinculo.id,
                                          "EM_EMBARQUE",
                                        )
                                      }
                                      className="phanyx-transporte-primary-button rounded-xl px-3 py-2 text-xs font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {statusVeiculoSolicitado === "EM_EMBARQUE"
                                        ? t(
                                            "vehicleAssignment.startingBoardingOperation",
                                          )
                                        : t(
                                            "vehicleAssignment.startBoardingOperation",
                                          )}
                                    </button>
                                  ) : null}

                                  {vinculo.status === "EM_EMBARQUE" ? (
                                    <button
                                      type="button"
                                      disabled={atualizandoEsteVeiculo}
                                      onClick={() =>
                                        void atualizarStatusVeiculo(
                                          vinculo.id,
                                          "EM_TRANSITO",
                                        )
                                      }
                                      className="phanyx-transporte-primary-button rounded-xl px-3 py-2 text-xs font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {statusVeiculoSolicitado === "EM_TRANSITO"
                                        ? t("vehicleAssignment.startingTrip")
                                        : t("vehicleAssignment.startTrip")}
                                    </button>
                                  ) : null}

                                  {vinculo.status === "EM_TRANSITO" ? (
                                    <button
                                      type="button"
                                      disabled={atualizandoEsteVeiculo}
                                      onClick={() =>
                                        void atualizarStatusVeiculo(
                                          vinculo.id,
                                          "CHEGOU",
                                        )
                                      }
                                      className="phanyx-transporte-primary-button rounded-xl px-3 py-2 text-xs font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {statusVeiculoSolicitado === "CHEGOU"
                                        ? t("vehicleAssignment.markingArrived")
                                        : t("vehicleAssignment.markArrived")}
                                    </button>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>

                            <div className="mt-3 border-t pt-3">
                              <div className="text-xs font-black uppercase tracking-wide opacity-65">
                                🧑‍✈️ {t("driverAssignment.title")}
                              </div>

                              {vinculo.condutores.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {vinculo.condutores.map((atribuicao) => (
                                    <div
                                      key={atribuicao.id}
                                      className="flex flex-col gap-2"
                                    >
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="phanyx-transporte-chip rounded-full border px-3 py-1.5 text-xs font-bold">
                                          🧑‍✈️ {atribuicao.condutor.nome} •{" "}
                                          {t(
                                            `driverAssignment.roles.${atribuicao.papel}`,
                                          )}
                                        </span>

                                        {podeGerenciar &&
                                        vinculo.status === "PLANEJADO" ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setConfirmandoRemocaoCondutorId(
                                                atribuicao.id,
                                              )
                                            }
                                            disabled={
                                              removendoCondutorId ===
                                              atribuicao.id
                                            }
                                            title={t(
                                              "driverAssignment.removeDriver",
                                            )}
                                            aria-label={t(
                                              "driverAssignment.removeDriver",
                                            )}
                                            className="flex h-7 w-7 items-center justify-center rounded-full border text-sm font-black opacity-60 transition hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
                                          >
                                            ×
                                          </button>
                                        ) : null}
                                      </div>

                                      {confirmandoRemocaoCondutorId ===
                                      atribuicao.id ? (
                                        <div className="rounded-xl border p-3">
                                          <p className="text-sm font-bold">
                                            {t(
                                              "driverAssignment.removeQuestion",
                                            )}
                                          </p>

                                          <div className="mt-3 flex flex-wrap gap-2">
                                            <button
                                              type="button"
                                              disabled={
                                                removendoCondutorId ===
                                                atribuicao.id
                                              }
                                              onClick={() =>
                                                setConfirmandoRemocaoCondutorId(
                                                  null,
                                                )
                                              }
                                              className="phanyx-transporte-chip rounded-xl border px-3 py-2 text-xs font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                              {t(
                                                "driverAssignment.cancelRemove",
                                              )}
                                            </button>

                                            <button
                                              type="button"
                                              disabled={
                                                removendoCondutorId ===
                                                atribuicao.id
                                              }
                                              onClick={() =>
                                                void desvincularCondutor(
                                                  atribuicao.id,
                                                )
                                              }
                                              className="rounded-xl border border-red-300 px-3 py-2 text-xs font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                                            >
                                              {removendoCondutorId ===
                                              atribuicao.id
                                                ? t(
                                                    "driverAssignment.removingDriver",
                                                  )
                                                : t(
                                                    "driverAssignment.confirmRemove",
                                                  )}
                                            </button>
                                          </div>
                                        </div>
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-2 text-sm opacity-70">
                                  {t("driverAssignment.noLinkedDrivers")}
                                </p>
                              )}

                              {podeGerenciar ? (
                                condutoresNaoVinculados.length > 0 ? (
                                  <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-end">
                                    <SelectPhanyx
                                      value={
                                        condutorSelecionadoPorTrechoVeiculo[
                                          vinculo.id
                                        ] || ""
                                      }
                                      onChange={(valor) =>
                                        setCondutorSelecionadoPorTrechoVeiculo(
                                          (atual) => ({
                                            ...atual,

                                            [vinculo.id]: valor,
                                          }),
                                        )
                                      }
                                      placeholder={t(
                                        "driverAssignment.selectDriver",
                                      )}
                                      options={condutoresNaoVinculados.map(
                                        (condutor) => ({
                                          value: String(condutor.id),

                                          label: condutor.nome,
                                        }),
                                      )}
                                    />

                                    <SelectPhanyx
                                      value={
                                        papelCondutorPorTrechoVeiculo[
                                          vinculo.id
                                        ] || "PRINCIPAL"
                                      }
                                      onChange={(valor) =>
                                        setPapelCondutorPorTrechoVeiculo(
                                          (atual) => ({
                                            ...atual,

                                            [vinculo.id]: valor,
                                          }),
                                        )
                                      }
                                      placeholder={t(
                                        "driverAssignment.selectRole",
                                      )}
                                      options={[
                                        "PRINCIPAL",
                                        "AUXILIAR",
                                        "RESERVA",
                                        "OPERADOR",
                                        "OPERADOR_REMOTO",
                                        "SUPERVISOR_AUTONOMO",
                                        "OUTRO",
                                      ].map((papel) => ({
                                        value: papel,

                                        label: t(
                                          `driverAssignment.roles.${papel}`,
                                        ),
                                      }))}
                                    />

                                    <button
                                      type="button"
                                      disabled={
                                        vinculandoCondutorTrechoVeiculoId ===
                                          vinculo.id ||
                                        !condutorSelecionadoPorTrechoVeiculo[
                                          vinculo.id
                                        ]
                                      }
                                      onClick={() =>
                                        void vincularCondutor(vinculo.id)
                                      }
                                      className="phanyx-transporte-primary-button min-h-[44px] rounded-xl px-4 py-2.5 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {vinculandoCondutorTrechoVeiculoId ===
                                      vinculo.id
                                        ? t("driverAssignment.linkingDriver")
                                        : t("driverAssignment.linkDriver")}
                                    </button>
                                  </div>
                                ) : (
                                  <p className="mt-3 text-sm opacity-70">
                                    {t("driverAssignment.noDriversAvailable")}
                                  </p>
                                )
                              ) : null}
                            </div>

                            <div className="mt-4 border-t pt-3">
                              <div className="text-xs font-black uppercase tracking-wide opacity-65">
                                👥 {t("passengerAssignment.title")}
                              </div>

                              {vinculo.passageiros.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {vinculo.passageiros.map((passageiro) => {
                                    const participante =
                                      participantesDisponiveis.find(
                                        (item) =>
                                          item.id === passageiro.participanteId,
                                      );

                                    const nomeParticipante =
                                      participante?.aluno.nomeSocial?.trim() ||
                                      participante?.aluno.nome ||
                                      `#${passageiro.participanteId}`;

                                    const atualizandoEstePassageiro =
                                      atualizandoStatusPassageiro?.passageiroId ===
                                      passageiro.id;

                                    const statusSolicitado =
                                      atualizandoEstePassageiro
                                        ? atualizandoStatusPassageiro?.novoStatus
                                        : null;

                                    return (
                                      <div
                                        key={passageiro.id}
                                        className="flex flex-col gap-2"
                                      >
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="phanyx-transporte-chip rounded-full border px-3 py-1.5 text-xs font-bold">
                                            👤 {nomeParticipante}
                                            {" • "}
                                            {t(
                                              `passengerAssignment.status.${passageiro.status}`,
                                            )}
                                            {passageiro.assento
                                              ? ` • ${t(
                                                  "passengerAssignment.seat",
                                                )}: ${passageiro.assento}`
                                              : ""}
                                          </span>

                                          {podeGerenciar &&
                                          passageiro.status === "PLANEJADO" ? (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setConfirmandoRemocaoPassageiroId(
                                                  passageiro.id,
                                                )
                                              }
                                              disabled={
                                                removendoPassageiroId ===
                                                passageiro.id
                                              }
                                              title={t(
                                                "passengerAssignment.removePassenger",
                                              )}
                                              aria-label={t(
                                                "passengerAssignment.removePassenger",
                                              )}
                                              className="flex h-7 w-7 items-center justify-center rounded-full border text-sm font-black opacity-60 transition hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                              ×
                                            </button>
                                          ) : null}
                                        </div>

                                        {confirmandoRemocaoPassageiroId ===
                                        passageiro.id ? (
                                          <div className="rounded-xl border p-3">
                                            <p className="text-sm font-bold">
                                              {t(
                                                "passengerAssignment.removeQuestion",
                                              )}
                                            </p>

                                            <div className="mt-3 flex flex-wrap gap-2">
                                              <button
                                                type="button"
                                                disabled={
                                                  removendoPassageiroId ===
                                                  passageiro.id
                                                }
                                                onClick={() =>
                                                  setConfirmandoRemocaoPassageiroId(
                                                    null,
                                                  )
                                                }
                                                className="phanyx-transporte-chip rounded-xl border px-3 py-2 text-xs font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
                                              >
                                                {t(
                                                  "passengerAssignment.cancelRemove",
                                                )}
                                              </button>

                                              <button
                                                type="button"
                                                disabled={
                                                  removendoPassageiroId ===
                                                  passageiro.id
                                                }
                                                onClick={() =>
                                                  void desvincularPassageiro(
                                                    passageiro.id,
                                                  )
                                                }
                                                className="rounded-xl border border-red-300 px-3 py-2 text-xs font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                                              >
                                                {removendoPassageiroId ===
                                                passageiro.id
                                                  ? t(
                                                      "passengerAssignment.removingPassenger",
                                                    )
                                                  : t(
                                                      "passengerAssignment.confirmRemove",
                                                    )}
                                              </button>
                                            </div>
                                          </div>
                                        ) : null}
                                        {podeGerenciar &&
                                        confirmandoRemocaoPassageiroId !==
                                          passageiro.id ? (
                                          <div className="flex flex-wrap items-center gap-2">
                                            {passageiro.status ===
                                            "PLANEJADO" ? (
                                              <button
                                                type="button"
                                                disabled={
                                                  atualizandoEstePassageiro
                                                }
                                                onClick={() =>
                                                  void atualizarStatusPassageiro(
                                                    passageiro.id,
                                                    "AGUARDANDO_EMBARQUE",
                                                  )
                                                }
                                                className="phanyx-transporte-primary-button rounded-xl px-3 py-2 text-xs font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
                                              >
                                                {statusSolicitado ===
                                                "AGUARDANDO_EMBARQUE"
                                                  ? t(
                                                      "passengerAssignment.startingBoarding",
                                                    )
                                                  : t(
                                                      "passengerAssignment.startBoarding",
                                                    )}
                                              </button>
                                            ) : null}

                                            {passageiro.status ===
                                            "AGUARDANDO_EMBARQUE" ? (
                                              <>
                                                <button
                                                  type="button"
                                                  disabled={
                                                    atualizandoEstePassageiro
                                                  }
                                                  onClick={() =>
                                                    void atualizarStatusPassageiro(
                                                      passageiro.id,
                                                      "EMBARCADO",
                                                    )
                                                  }
                                                  className="phanyx-transporte-primary-button rounded-xl px-3 py-2 text-xs font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                  {statusSolicitado ===
                                                  "EMBARCADO"
                                                    ? t(
                                                        "passengerAssignment.markingBoarded",
                                                      )
                                                    : t(
                                                        "passengerAssignment.markBoarded",
                                                      )}
                                                </button>

                                                <button
                                                  type="button"
                                                  disabled={
                                                    atualizandoEstePassageiro
                                                  }
                                                  onClick={() =>
                                                    void atualizarStatusPassageiro(
                                                      passageiro.id,
                                                      "NAO_EMBARCOU",
                                                    )
                                                  }
                                                  className="rounded-xl border border-red-300 px-3 py-2 text-xs font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                                                >
                                                  {statusSolicitado ===
                                                  "NAO_EMBARCOU"
                                                    ? t(
                                                        "passengerAssignment.markingNoShow",
                                                      )
                                                    : t(
                                                        "passengerAssignment.markNoShow",
                                                      )}
                                                </button>
                                              </>
                                            ) : null}

                                            {passageiro.status ===
                                            "EMBARCADO" ? (
                                              <button
                                                type="button"
                                                disabled={
                                                  atualizandoEstePassageiro
                                                }
                                                onClick={() =>
                                                  void atualizarStatusPassageiro(
                                                    passageiro.id,
                                                    "DESEMBARCADO",
                                                  )
                                                }
                                                className="phanyx-transporte-primary-button rounded-xl px-3 py-2 text-xs font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
                                              >
                                                {statusSolicitado ===
                                                "DESEMBARCADO"
                                                  ? t(
                                                      "passengerAssignment.markingDisembarked",
                                                    )
                                                  : t(
                                                      "passengerAssignment.markDisembarked",
                                                    )}
                                              </button>
                                            ) : null}
                                          </div>
                                        ) : null}

                                        {passageiro.embarcadoEm ? (
                                          <div className="text-xs font-medium opacity-70">
                                            <strong>
                                              {t(
                                                "passengerAssignment.boardedAt",
                                              )}
                                              :
                                            </strong>{" "}
                                            {formatarDataHora(
                                              passageiro.embarcadoEm,
                                            )}
                                          </div>
                                        ) : null}

                                        {passageiro.desembarcadoEm ? (
                                          <div className="text-xs font-medium opacity-70">
                                            <strong>
                                              {t(
                                                "passengerAssignment.disembarkedAt",
                                              )}
                                              :
                                            </strong>{" "}
                                            {formatarDataHora(
                                              passageiro.desembarcadoEm,
                                            )}
                                          </div>
                                        ) : null}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="mt-2 text-sm opacity-70">
                                  {t("passengerAssignment.noLinkedPassengers")}
                                </p>
                              )}

                              {podeGerenciar ? (
                                participantesNaoVinculados.length > 0 ? (
                                  <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_auto] lg:items-end">
                                    <SelectPhanyx
                                      value={
                                        participanteSelecionadoPorTrechoVeiculo[
                                          vinculo.id
                                        ] || ""
                                      }
                                      onChange={(valor) =>
                                        setParticipanteSelecionadoPorTrechoVeiculo(
                                          (atual) => ({
                                            ...atual,

                                            [vinculo.id]: valor,
                                          }),
                                        )
                                      }
                                      placeholder={t(
                                        "passengerAssignment.selectPassenger",
                                      )}
                                      options={participantesNaoVinculados.map(
                                        (participante) => {
                                          const nome =
                                            participante.aluno.nomeSocial?.trim() ||
                                            participante.aluno.nome;

                                          return {
                                            value: String(participante.id),

                                            label: participante.aluno.matricula
                                              ? `${nome} • ${participante.aluno.matricula}`
                                              : nome,
                                          };
                                        },
                                      )}
                                    />

                                    <div>
                                      <label className="mb-1.5 block text-xs font-bold opacity-70">
                                        {t("passengerAssignment.seat")}
                                      </label>

                                      <input
                                        type="text"
                                        maxLength={50}
                                        value={
                                          assentoPorTrechoVeiculo[vinculo.id] ||
                                          ""
                                        }
                                        onChange={(event) =>
                                          setAssentoPorTrechoVeiculo(
                                            (atual) => ({
                                              ...atual,
                                              [vinculo.id]: event.target.value,
                                            }),
                                          )
                                        }
                                        placeholder={t(
                                          "passengerAssignment.seatPlaceholder",
                                        )}
                                        aria-label={t(
                                          "passengerAssignment.seat",
                                        )}
                                        className="phanyx-transporte-input"
                                      />
                                    </div>

                                    <button
                                      type="button"
                                      disabled={
                                        vinculandoPassageiroTrechoVeiculoId ===
                                          vinculo.id ||
                                        !participanteSelecionadoPorTrechoVeiculo[
                                          vinculo.id
                                        ]
                                      }
                                      onClick={() =>
                                        void vincularPassageiro(vinculo.id)
                                      }
                                      className="phanyx-transporte-primary-button min-h-[44px] rounded-xl px-4 py-2.5 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {vinculandoPassageiroTrechoVeiculoId ===
                                      vinculo.id
                                        ? t(
                                            "passengerAssignment.linkingPassenger",
                                          )
                                        : t(
                                            "passengerAssignment.linkPassenger",
                                          )}
                                    </button>
                                  </div>
                                ) : (
                                  <p className="mt-3 text-sm opacity-70">
                                    {t(
                                      "passengerAssignment.noPassengersAvailable",
                                    )}
                                  </p>
                                )
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm opacity-70">
                      {t("vehicleAssignment.noLinkedVehicles")}
                    </p>
                  )}

                  {podeGerenciar ? (
                    <div className="mt-4">
                      {veiculosDisponiveis.filter(
                        (veiculo) =>
                          !trecho.veiculos.some(
                            (vinculo) => vinculo.veiculoId === veiculo.id,
                          ),
                      ).length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                          <div>
                            <SelectPhanyx
                              value={
                                veiculoSelecionadoPorTrecho[trecho.id] || ""
                              }
                              onChange={(valor) =>
                                setVeiculoSelecionadoPorTrecho((atual) => ({
                                  ...atual,

                                  [trecho.id]: valor,
                                }))
                              }
                              placeholder={t("vehicleAssignment.selectVehicle")}
                              options={veiculosDisponiveis
                                .filter(
                                  (veiculo) =>
                                    !trecho.veiculos.some(
                                      (vinculo) =>
                                        vinculo.veiculoId === veiculo.id,
                                    ),
                                )
                                .map((veiculo) => ({
                                  value: String(veiculo.id),

                                  label: [
                                    veiculo.nomeIdentificacao || veiculo.tipo,

                                    veiculo.placa,
                                  ]
                                    .filter(Boolean)
                                    .join(" • "),
                                }))}
                            />
                          </div>

                          <button
                            type="button"
                            disabled={
                              vinculandoVeiculoTrechoId === trecho.id ||
                              !veiculoSelecionadoPorTrecho[trecho.id]
                            }
                            onClick={() => void vincularVeiculo(trecho.id)}
                            className="phanyx-transporte-primary-button min-h-[44px] rounded-xl px-4 py-2.5 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {vinculandoVeiculoTrechoId === trecho.id
                              ? t("vehicleAssignment.linkingVehicle")
                              : t("vehicleAssignment.linkVehicle")}
                          </button>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm opacity-70">
                          {t("vehicleAssignment.noVehiclesAvailable")}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>

                {trecho.numeroReferencia ? (
                  <div className="mt-3 text-xs opacity-75">
                    <strong>{t("segments.reference")}:</strong>{" "}
                    {trecho.numeroReferencia}
                  </div>
                ) : null}

                {trecho.observacao ? (
                  <div className="phanyx-transporte-note mt-4 rounded-xl border p-3 text-sm">
                    {trecho.observacao}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Campo({
  label,
  obrigatorio = false,
  children,
}: {
  label: string;
  obrigatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black">
        {label}

        {obrigatorio ? <span className="ml-1 text-red-500">*</span> : null}
      </span>

      {children}
    </label>
  );
}

function ResumoCard({
  valor,
  rotulo,
  icone,
}: {
  valor: number;
  rotulo: string;
  icone: string;
}) {
  return (
    <div className="phanyx-transporte-resumo rounded-2xl border p-4">
      <div className="text-lg">{icone}</div>

      <div className="mt-2 text-2xl font-black">{valor}</div>

      <div className="mt-0.5 text-xs font-bold opacity-70">{rotulo}</div>
    </div>
  );
}

function LocalCard({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="phanyx-transporte-local rounded-2xl border p-4">
      <h4 className="mb-4 text-sm font-black">{titulo}</h4>

      <div className="space-y-3">{children}</div>
    </div>
  );
}

function LocalResumo({
  rotulo,
  nome,
  detalhes,
}: {
  rotulo: string;
  nome: string;
  detalhes: Array<string | null | undefined>;
}) {
  const detalhe = detalhes.filter(Boolean).join(", ");

  return (
    <div className="phanyx-transporte-location rounded-xl border p-3.5">
      <div className="text-[11px] font-black uppercase tracking-wide opacity-60">
        {rotulo}
      </div>

      <div className="mt-1 font-black">{nome}</div>

      {detalhe ? (
        <div className="mt-1 text-xs opacity-70">{detalhe}</div>
      ) : null}
    </div>
  );
}

function InfoCard({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="phanyx-transporte-info rounded-xl border p-3">
      <div className="text-[11px] font-black uppercase tracking-wide opacity-60">
        {rotulo}
      </div>

      <div className="mt-1 text-sm font-bold">{valor}</div>
    </div>
  );
}

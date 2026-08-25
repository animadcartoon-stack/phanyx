"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";

type CursoSemestreOption = {
  id: number;
  numero: number;
  titulo?: string | null;
  cargaMinima?: number | null;
  cargaMaxima?: number | null;
};

type CursoOption = {
  id: number;
  nome: string;
  codigo?: string | null;
  semestres: CursoSemestreOption[];
};

type TurmaOption = {
  id: number;
  nome: string;
  codigo?: string | null;
  cursoId?: number | null;
  semestre: string;
  periodoLetivo?: string | null;
  turno?: string | null;
  modalidade?: string | null;
  capacidadeMaxima?: number | null;
  statusTurma?: string | null;

  polo?: {
    id: number;
    nome: string;
  } | null;

  semestres: {
    id: number;
    numero: number;
  }[];

  _count: {
    disciplinas: number;
  };
};

type PeriodoMatriculaTurma = {
  id: number;
  turmaId: number;
  turma: TurmaOption;
};

type PeriodoRematricula = {
  id: number;
  cursoId?: number | null;
  cursoSemestreId?: number | null;
  titulo?: string | null;
  instrucoes?: string | null;
  periodoLetivo: string;
  semestreNumero?: number | null;
  dataInicio: string;
  dataFim: string;
  dataInicioAulas?: string | null;
  status: string;
  ativo?: boolean;
  permiteAluno?: boolean;
  permiteRascunho: boolean;
  exigeAprovacao: boolean;
  bloqueiaInadimplente: boolean;
  cargaMinimaOverride?: number | null;
  cargaMaximaOverride?: number | null;
  curso?: {
    id: number;
    nome: string;
    codigo?: string | null;
    ativo: boolean;
  } | null;
  cursoSemestre?: {
    id: number;
    numero: number;
    titulo?: string | null;
    cargaMinima?: number | null;
    cargaMaxima?: number | null;
  } | null;
  turmasParticipantes?: PeriodoMatriculaTurma[];
  _count: {
    matriculas: number;
    rematriculas: number;
    turmasParticipantes?: PeriodoMatriculaTurma[];
  };
};

type RespostaApi = {
  periodos?: PeriodoRematricula[];
  cursos?: CursoOption[];
  turmas?: TurmaOption[];
  error?: string;
  message?: string;
};

type EscopoExtracurricular =
  | "SEMESTRE_ESPECIFICO"
  | "TODOS_OS_SEMESTRES";

type DisciplinaExtraOption = {
  id: number;
  nome: string;
  codigo?: string | null;
  descricao?: string | null;
  cargaHoraria?: number | null;
  semestre?: number | null;
  cursoId?: number | null;
  curso?: {
    id: number;
    nome: string;
    codigo?: string | null;
  } | null;
};

type ConfiguracaoExtraApi = {
  id: number;
  cursoId: number;
  cursoSemestreId?: number | null;
  disciplinaId: number;
  ativa: boolean;
  obrigatoria: boolean;
  contaCargaMinima: boolean;
  contaCargaMaxima: boolean;
};

type ItemExtraSelecionado = {
  disciplinaId: number;
  obrigatoria: boolean;
  contaCargaMinima: boolean;
  contaCargaMaxima: boolean;
};

type RespostaExtracurriculares = {
  disciplinas?: DisciplinaExtraOption[];
  configuracoes?: ConfiguracaoExtraApi[];
  error?: string;
  message?: string;
};

type StatusSalvamento = "RASCUNHO" | "PUBLICADO";

type AcaoPeriodo = "PUBLICAR" | "ENCERRAR" | "CANCELAR";

type ConfirmacaoPeriodo = {
  acao: AcaoPeriodo;
  periodo: PeriodoRematricula;
} | null;

type MensagemTela = {
  tipo: "sucesso" | "erro";
  texto: string;
};

const FORMULARIO_INICIAL = {
  cursoId: "",
  cursoSemestreId: "",
  periodoLetivo: "",
  titulo: "",
  dataInicio: "",
  dataFim: "",
  dataInicioAulas: "",
  cargaMinimaOverride: "",
  cargaMaximaOverride: "",
  instrucoes: "",
  exigeAprovacao: false,
  permiteRascunho: true,
  bloqueiaInadimplente: false,
};

function formatarDataHora(valor?: string | null) {
  if (!valor) {
    return "Não informado";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "Data inválida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

function nomeStatus(status: string) {
  const nomes: Record<string, string> = {
    RASCUNHO: "Rascunho",
    PUBLICADO: "Publicado",
    ENCERRADO: "Encerrado",
    CANCELADO: "Cancelado",
  };

  return nomes[status] || status;
}

function classeStatus(status: string) {
  if (status === "PUBLICADO") {
    return "phanyx-rematricula-status phanyx-rematricula-status-publicado";
  }

  if (status === "ENCERRADO") {
    return "phanyx-rematricula-status phanyx-rematricula-status-encerrado";
  }

  if (status === "CANCELADO") {
    return "phanyx-rematricula-status phanyx-rematricula-status-cancelado";
  }

  return "phanyx-rematricula-status phanyx-rematricula-status-rascunho";
}

function converterParaIso(valor: string) {
  if (!valor) {
    return null;
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data.toISOString();
}

function converterIsoParaDataLocal(valor?: string | null) {
  if (!valor) {
    return "";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "";
  }

  const deslocamento = data.getTimezoneOffset() * 60_000;

  return new Date(data.getTime() - deslocamento)
    .toISOString()
    .slice(0, 16);
}

const PALAVRAS_IGNORADAS_BUSCA = new Set([
  "a",
  "o",
  "as",
  "os",
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "em",
  "para",
  "por",
  "com",
  "uma",
  "um",
  "disciplina",
  "disciplinas",
  "materia",
  "materias",
  "curso",
  "cursos",
]);

const TERMOS_CURTOS_VALIDOS = new Set([
  "fe",
  "rh",
  "ti",
  "ia",
]);

const SINONIMOS_BUSCA_DISCIPLINA: Record<
  string,
  string[]
> = {
  etica: [
    "moral",
    "conduta",
    "valores",
    "bioetica",
    "deontologia",
  ],

  gestao: [
    "administracao",
    "lideranca",
    "planejamento",
    "organizacao",
  ],

  igreja: [
    "eclesiologia",
    "congregacao",
    "ministerio",
    "pastoral",
  ],

  biblia: [
    "biblico",
    "biblica",
    "escrituras",
    "testamento",
  ],

  teologia: [
    "doutrina",
    "doutrinas",
    "sistematica",
    "dogmatica",
  ],

  aconselhamento: [
    "pastoral",
    "cuidado",
    "orientacao",
    "psicologia",
  ],

  educacao: [
    "ensino",
    "didatica",
    "pedagogia",
    "aprendizagem",
  ],

  missao: [
    "missoes",
    "missionario",
    "missionaria",
    "evangelismo",
  ],

  comunicacao: [
    "oratoria",
    "expressao",
    "pregacao",
    "homiletica",
  ],

  historia: [
    "historico",
    "historica",
    "antiguidade",
  ],

  religiao: [
    "religioes",
    "religioso",
    "religiosa",
    "comparadas",
  ],

  hebraico: [
    "hebraica",
    "lingua hebraica",
    "antigo testamento",
  ],

  grego: [
    "grega",
    "lingua grega",
    "novo testamento",
  ],

  filosofia: [
    "filosofico",
    "filosofica",
    "pensamento",
  ],

  fe: [
    "espiritualidade",
    "doutrina",
    "crenca",
    "crencas",
  ],
};

function normalizarTextoBusca(
  valor: string,
) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function tokenizarBuscaInteligente(
  valor: string,
) {
  return normalizarTextoBusca(valor)
    .split(" ")
    .filter(Boolean)
    .filter(
      (termo) =>
        !PALAVRAS_IGNORADAS_BUSCA.has(
          termo,
        ),
    )
    .filter(
      (termo) =>
        termo.length >= 3 ||
        TERMOS_CURTOS_VALIDOS.has(
          termo,
        ) ||
        /^\d+$/.test(termo),
    );
}

function expandirTermoBusca(
  termo: string,
) {
  const variacoes = new Set<string>([
    termo,
  ]);

  if (
    termo.endsWith("s") &&
    termo.length > 3
  ) {
    variacoes.add(
      termo.slice(0, -1),
    );
  } else if (termo.length > 3) {
    variacoes.add(`${termo}s`);
  }

  for (const [
    principal,
    sinonimos,
  ] of Object.entries(
    SINONIMOS_BUSCA_DISCIPLINA,
  )) {
    const termosDoGrupo = [
      principal,
      ...sinonimos,
    ].map(normalizarTextoBusca);

    if (
      termosDoGrupo.includes(termo)
    ) {
      variacoes.add(principal);

      for (const sinonimo of sinonimos) {
        variacoes.add(
          normalizarTextoBusca(
            sinonimo,
          ),
        );
      }
    }
  }

  return Array.from(variacoes);
}

function pontuarCampoBusca(
  campo:
    | string
    | null
    | undefined,
  variacoes: string[],
  peso: number,
) {
  const texto =
    normalizarTextoBusca(
      campo || "",
    );

  if (!texto) {
    return 0;
  }

  const palavras = texto.split(" ");

  let melhorPontuacao = 0;

  for (const variacao of variacoes) {
    if (!variacao) {
      continue;
    }

    if (texto === variacao) {
      melhorPontuacao = Math.max(
        melhorPontuacao,
        peso * 5,
      );

      continue;
    }

    if (texto.startsWith(variacao)) {
      melhorPontuacao = Math.max(
        melhorPontuacao,
        peso * 4,
      );

      continue;
    }

    if (
      palavras.some((palavra) =>
        palavra.startsWith(variacao),
      )
    ) {
      melhorPontuacao = Math.max(
        melhorPontuacao,
        peso * 3,
      );

      continue;
    }

    if (texto.includes(variacao)) {
      melhorPontuacao = Math.max(
        melhorPontuacao,
        peso,
      );
    }
  }

  return melhorPontuacao;
}

function pontuarDisciplinaNaBusca(
  disciplina: DisciplinaExtraOption,
  busca: string,
) {
  const buscaNormalizada =
    normalizarTextoBusca(busca);

  const termos =
    tokenizarBuscaInteligente(busca);

  if (
    !buscaNormalizada ||
    termos.length === 0
  ) {
    return 0;
  }

  const nome =
    normalizarTextoBusca(
      disciplina.nome,
    );

  const codigo =
    normalizarTextoBusca(
      disciplina.codigo || "",
    );

  let pontuacao = 0;

  if (nome === buscaNormalizada) {
    pontuacao += 1000;
  } else if (
    nome.startsWith(
      buscaNormalizada,
    )
  ) {
    pontuacao += 700;
  } else if (
    nome.includes(
      buscaNormalizada,
    )
  ) {
    pontuacao += 400;
  }

  if (
    codigo &&
    codigo === buscaNormalizada
  ) {
    pontuacao += 900;
  }

  for (const termo of termos) {
    const variacoes =
      expandirTermoBusca(termo);

    const melhorResultado =
      Math.max(
        pontuarCampoBusca(
          disciplina.nome,
          variacoes,
          100,
        ),

        pontuarCampoBusca(
          disciplina.codigo,
          variacoes,
          90,
        ),

        pontuarCampoBusca(
          disciplina.curso?.nome,
          variacoes,
          45,
        ),

        pontuarCampoBusca(
          disciplina.curso?.codigo,
          variacoes,
          40,
        ),

        pontuarCampoBusca(
          disciplina.descricao,
          variacoes,
          12,
        ),
      );

    // Cada termo relevante digitado precisa
    // aparecer em algum campo ou sinônimo.
    if (melhorResultado === 0) {
      return 0;
    }

    pontuacao += melhorResultado;
  }

  return pontuacao;
}

export default function RematriculasSemestraisPage() {
  const [cursos, setCursos] = useState<CursoOption[]>([]);

  const [turmas, setTurmas] =
    useState<TurmaOption[]>([]);

  const [
    turmaIdsSelecionadas,
    setTurmaIdsSelecionadas,
  ] = useState<number[]>([]);

  const [periodos, setPeriodos] = useState<PeriodoRematricula[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<MensagemTela | null>(null);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);

  const [escopoExtras, setEscopoExtras] =
    useState<EscopoExtracurricular>(
      "SEMESTRE_ESPECIFICO",
    );

  const [
    disciplinasExtrasDisponiveis,
    setDisciplinasExtrasDisponiveis,
  ] = useState<DisciplinaExtraOption[]>([]);

  const [itensExtras, setItensExtras] =
    useState<ItemExtraSelecionado[]>([]);

  const [buscaExtra, setBuscaExtra] =
    useState("");

  const [
    filtroCursoOrigemExtra,
    setFiltroCursoOrigemExtra,
  ] = useState("");

  const [
    carregandoExtras,
    setCarregandoExtras,
  ] = useState(false);

  const [
    salvandoExtras,
    setSalvandoExtras,
  ] = useState(false);

  const [periodoEmEdicaoId, setPeriodoEmEdicaoId] = useState<number | null>(
    null,
  );

  const [confirmacaoPeriodo, setConfirmacaoPeriodo] =
    useState<ConfirmacaoPeriodo>(null);

  const [executandoAcao, setExecutandoAcao] = useState(false);

  const carregarDados = useCallback(async () => {
    setCarregando(true);

    try {
      const resposta = await fetch("/api/admin/rematriculas-semestrais", {
        method: "GET",
        cache: "no-store",
      });

      const dados = (await resposta.json()) as RespostaApi;

      if (!resposta.ok) {
        throw new Error(dados.error || "Não foi possível carregar os dados.");
      }

      setCursos(dados.cursos || []);
      setTurmas(dados.turmas || []);
      setPeriodos(dados.periodos || []);
    } catch (error) {
      setMensagem({
        tipo: "erro",
        texto:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os períodos de rematrícula.",
      });
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const carregarExtracurriculares =
    useCallback(async () => {
      const cursoId = Number(
        formulario.cursoId,
      );

      const cursoSemestreId = Number(
        formulario.cursoSemestreId,
      );

      if (
        !cursoId ||
        (escopoExtras ===
          "SEMESTRE_ESPECIFICO" &&
          !cursoSemestreId)
      ) {
        setDisciplinasExtrasDisponiveis(
          [],
        );

        setItensExtras([]);

        return;
      }

      setCarregandoExtras(true);

      try {
        const parametros =
          new URLSearchParams({
            cursoId: String(cursoId),
          });

        if (
          escopoExtras ===
          "SEMESTRE_ESPECIFICO"
        ) {
          parametros.set(
            "cursoSemestreId",
            String(cursoSemestreId),
          );
        }

        const resposta = await fetch(
          `/api/admin/rematriculas-semestrais/extracurriculares?${parametros.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const dados =
          (await resposta.json()) as RespostaExtracurriculares;

        if (!resposta.ok) {
          throw new Error(
            dados.error ||
            "Não foi possível carregar as disciplinas extracurriculares.",
          );
        }

        setDisciplinasExtrasDisponiveis(
          dados.disciplinas || [],
        );

        setItensExtras(
          (dados.configuracoes || [])
            .filter(
              (configuracao) =>
                configuracao.ativa,
            )
            .map((configuracao) => ({
              disciplinaId:
                configuracao.disciplinaId,
              obrigatoria:
                configuracao.obrigatoria,
              contaCargaMinima:
                configuracao.contaCargaMinima,
              contaCargaMaxima:
                configuracao.contaCargaMaxima,
            })),
        );
      } catch (error) {
        setMensagem({
          tipo: "erro",
          texto:
            error instanceof Error
              ? error.message
              : "Não foi possível carregar as disciplinas extracurriculares.",
        });
      } finally {
        setCarregandoExtras(false);
      }
    }, [
      formulario.cursoId,
      formulario.cursoSemestreId,
      escopoExtras,
    ]);

  useEffect(() => {
    carregarExtracurriculares();
  }, [carregarExtracurriculares]);

  const cursoSelecionado = useMemo(() => {
    const cursoId = Number(formulario.cursoId);

    return cursos.find((curso) => curso.id === cursoId) || null;
  }, [cursos, formulario.cursoId]);

  const semestreSelecionado = useMemo(() => {
    const semestreId = Number(
      formulario.cursoSemestreId,
    );

    return (
      cursoSelecionado?.semestres.find(
        (semestre) =>
          semestre.id === semestreId,
      ) || null
    );
  }, [
    cursoSelecionado,
    formulario.cursoSemestreId,
  ]);

  const turmasDisponiveis = useMemo(() => {
    if (
      !cursoSelecionado ||
      !semestreSelecionado
    ) {
      return [];
    }

    return turmas
      .filter((turma) => {
        if (
          turma.cursoId !==
          cursoSelecionado.id
        ) {
          return false;
        }

        if (
          turma.semestres &&
          turma.semestres.length > 0
        ) {
          return turma.semestres.some(
            (semestre) =>
              semestre.numero ===
              semestreSelecionado.numero,
          );
        }

        const correspondencia =
          String(
            turma.semestre || "",
          ).match(/\d+/);

        if (!correspondencia) {
          return true;
        }

        return (
          Number(correspondencia[0]) ===
          semestreSelecionado.numero
        );
      })
      .sort((a, b) =>
        a.nome.localeCompare(
          b.nome,
          "pt-BR",
        ),
      );
  }, [
    turmas,
    cursoSelecionado,
    semestreSelecionado,
  ]);

  const todasTurmasSelecionadas =
    turmasDisponiveis.length > 0 &&
    turmasDisponiveis.every((turma) =>
      turmaIdsSelecionadas.includes(
        turma.id,
      ),
    );

  function alternarTurma(
    turmaId: number,
    marcada: boolean,
  ) {
    setTurmaIdsSelecionadas(
      (atuais) => {
        if (marcada) {
          return Array.from(
            new Set([
              ...atuais,
              turmaId,
            ]),
          );
        }

        return atuais.filter(
          (id) => id !== turmaId,
        );
      },
    );
  }

  function alternarTodasTurmas() {
    if (todasTurmasSelecionadas) {
      const idsVisiveis =
        new Set(
          turmasDisponiveis.map(
            (turma) => turma.id,
          ),
        );

      setTurmaIdsSelecionadas(
        (atuais) =>
          atuais.filter(
            (id) =>
              !idsVisiveis.has(id),
          ),
      );

      return;
    }

    setTurmaIdsSelecionadas(
      (atuais) =>
        Array.from(
          new Set([
            ...atuais,
            ...turmasDisponiveis.map(
              (turma) => turma.id,
            ),
          ]),
        ),
    );
  }

  const extrasPorDisciplina = useMemo(
    () =>
      new Map<
        number,
        ItemExtraSelecionado
      >(
        itensExtras.map(
          (item) =>
            [
              item.disciplinaId,
              item,
            ] as const,
        ),
      ),
    [itensExtras],
  );

  const cursosOrigemExtras = useMemo(() => {
    const mapa = new Map<
      number,
      {
        id: number;
        nome: string;
        codigo?: string | null;
      }
    >();

    for (
      const disciplina of
      disciplinasExtrasDisponiveis
    ) {
      if (disciplina.curso) {
        mapa.set(
          disciplina.curso.id,
          disciplina.curso,
        );
      }
    }

    return Array.from(
      mapa.values(),
    ).sort((a, b) =>
      a.nome.localeCompare(
        b.nome,
        "pt-BR",
      ),
    );
  }, [disciplinasExtrasDisponiveis]);

  const disciplinasExtrasFiltradas =
    useMemo(() => {
      const cursoOrigemId = Number(
        filtroCursoOrigemExtra,
      );

      const disciplinasDoFiltro =
        disciplinasExtrasDisponiveis.filter(
          (disciplina) => {
            if (
              cursoOrigemId &&
              (
                disciplina.cursoId ??
                disciplina.curso?.id
              ) !== cursoOrigemId
            ) {
              return false;
            }

            return true;
          },
        );

      const buscaNormalizada =
        normalizarTextoBusca(
          buscaExtra,
        );

      if (!buscaNormalizada) {
        return [
          ...disciplinasDoFiltro,
        ].sort((a, b) =>
          a.nome.localeCompare(
            b.nome,
            "pt-BR",
          ),
        );
      }

      const termos =
        tokenizarBuscaInteligente(
          buscaExtra,
        );

      if (termos.length === 0) {
        return [];
      }

      return disciplinasDoFiltro
        .map((disciplina) => ({
          disciplina,
          pontuacao:
            pontuarDisciplinaNaBusca(
              disciplina,
              buscaExtra,
            ),
        }))
        .filter(
          (resultado) =>
            resultado.pontuacao > 0,
        )
        .sort(
          (a, b) =>
            b.pontuacao -
            a.pontuacao ||
            a.disciplina.nome.localeCompare(
              b.disciplina.nome,
              "pt-BR",
            ),
        )
        .map(
          (resultado) =>
            resultado.disciplina,
        );
    }, [
      disciplinasExtrasDisponiveis,
      buscaExtra,
      filtroCursoOrigemExtra,
    ]);

  function alterarCurso(cursoId: string) {
    setFormulario((atual) => ({
      ...atual,
      cursoId,
      cursoSemestreId: "",
      cargaMinimaOverride: "",
      cargaMaximaOverride: "",
    }));

    setTurmaIdsSelecionadas([]);

    setItensExtras([]);
    setDisciplinasExtrasDisponiveis([]);
    setBuscaExtra("");
    setFiltroCursoOrigemExtra("");
  }

  function alterarSemestre(cursoSemestreId: string) {
    const semestre = cursoSelecionado?.semestres.find(
      (item) => item.id === Number(cursoSemestreId),
    );
    setTurmaIdsSelecionadas([]);
    setFormulario((atual) => ({
      ...atual,
      cursoSemestreId,
      cargaMinimaOverride:
        semestre?.cargaMinima !== null &&
          semestre?.cargaMinima !== undefined
          ? String(semestre.cargaMinima)
          : "",
      cargaMaximaOverride:
        semestre?.cargaMaxima !== null &&
          semestre?.cargaMaxima !== undefined
          ? String(semestre.cargaMaxima)
          : "",
    }));
  }

  function alternarDisciplinaExtra(
    disciplinaId: number,
    selecionada: boolean,
  ) {
    setItensExtras((atuais) => {
      if (!selecionada) {
        return atuais.filter(
          (item) =>
            item.disciplinaId !==
            disciplinaId,
        );
      }

      if (
        atuais.some(
          (item) =>
            item.disciplinaId ===
            disciplinaId,
        )
      ) {
        return atuais;
      }

      return [
        ...atuais,
        {
          disciplinaId,
          obrigatoria: false,
          contaCargaMinima: true,
          contaCargaMaxima: true,
        },
      ];
    });
  }

  function alterarRegraExtra(
    disciplinaId: number,
    campo:
      | "obrigatoria"
      | "contaCargaMinima"
      | "contaCargaMaxima",
    valor: boolean,
  ) {
    setItensExtras((atuais) =>
      atuais.map((item) =>
        item.disciplinaId ===
          disciplinaId
          ? {
            ...item,
            [campo]: valor,
          }
          : item,
      ),
    );
  }

  function selecionarTodasExtrasFiltradas() {
    setItensExtras((atuais) => {
      const mapa = new Map(
        atuais.map((item) => [
          item.disciplinaId,
          item,
        ]),
      );

      for (const disciplina of disciplinasExtrasFiltradas) {
        if (!mapa.has(disciplina.id)) {
          mapa.set(disciplina.id, {
            disciplinaId:
              disciplina.id,
            obrigatoria: false,
            contaCargaMinima: true,
            contaCargaMaxima: true,
          });
        }
      }

      return Array.from(
        mapa.values(),
      );
    });
  }

  function removerExtrasFiltradas() {
    const idsVisiveis = new Set(
      disciplinasExtrasFiltradas.map(
        (disciplina) =>
          disciplina.id,
      ),
    );

    setItensExtras((atuais) =>
      atuais.filter(
        (item) =>
          !idsVisiveis.has(
            item.disciplinaId,
          ),
      ),
    );
  }

  async function salvarExtracurriculares() {
    setMensagem(null);

    const cursoId = Number(
      formulario.cursoId,
    );

    const cursoSemestreId = Number(
      formulario.cursoSemestreId,
    );

    if (!cursoId) {
      setMensagem({
        tipo: "erro",
        texto:
          "Selecione o curso de destino.",
      });

      return;
    }

    if (
      escopoExtras ===
      "SEMESTRE_ESPECIFICO" &&
      !cursoSemestreId
    ) {
      setMensagem({
        tipo: "erro",
        texto:
          "Selecione o semestre de destino.",
      });

      return;
    }

    setSalvandoExtras(true);

    try {
      const resposta = await fetch(
        "/api/admin/rematriculas-semestrais/extracurriculares",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            cursoId,
            cursoSemestreId:
              escopoExtras ===
                "SEMESTRE_ESPECIFICO"
                ? cursoSemestreId
                : null,
            itens: itensExtras,
          }),
        },
      );

      const dados =
        (await resposta.json()) as RespostaExtracurriculares;

      if (!resposta.ok) {
        throw new Error(
          dados.error ||
          "Não foi possível salvar as disciplinas extracurriculares.",
        );
      }

      setMensagem({
        tipo: "sucesso",
        texto:
          dados.message ||
          "Disciplinas extracurriculares salvas.",
      });

      await carregarExtracurriculares();
    } catch (error) {
      setMensagem({
        tipo: "erro",
        texto:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar as disciplinas extracurriculares.",
      });
    } finally {
      setSalvandoExtras(false);
    }
  }

  function editarPeriodo(periodo: PeriodoRematricula) {
    setPeriodoEmEdicaoId(periodo.id);

    setTurmaIdsSelecionadas(
      (
        periodo.turmasParticipantes ||
        []
      ).map(
        (item) => item.turmaId,
      ),
    );

    setFormulario({
      cursoId: String(periodo.cursoId || periodo.curso?.id || ""),
      cursoSemestreId: String(
        periodo.cursoSemestreId || periodo.cursoSemestre?.id || "",
      ),
      periodoLetivo: periodo.periodoLetivo || "",
      titulo: periodo.titulo || "",
      dataInicio: converterIsoParaDataLocal(periodo.dataInicio),
      dataFim: converterIsoParaDataLocal(periodo.dataFim),
      dataInicioAulas: converterIsoParaDataLocal(periodo.dataInicioAulas),
      cargaMinimaOverride:
        periodo.cargaMinimaOverride !== null &&
          periodo.cargaMinimaOverride !== undefined
          ? String(periodo.cargaMinimaOverride)
          : "",
      cargaMaximaOverride:
        periodo.cargaMaximaOverride !== null &&
          periodo.cargaMaximaOverride !== undefined
          ? String(periodo.cargaMaximaOverride)
          : "",
      instrucoes: periodo.instrucoes || "",
      exigeAprovacao: Boolean(periodo.exigeAprovacao),
      permiteRascunho:
        typeof periodo.permiteRascunho === "boolean"
          ? periodo.permiteRascunho
          : true,
      bloqueiaInadimplente: Boolean(periodo.bloqueiaInadimplente),
    });

    setMensagem(null);

    window.setTimeout(() => {
      document
        .querySelector('[data-form-rematricula="true"]')
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  function cancelarEdicao() {
    setPeriodoEmEdicaoId(null);
    setFormulario(FORMULARIO_INICIAL);
    setMensagem(null);
    setTurmaIdsSelecionadas([]);
  }

  async function salvarPeriodo(status: StatusSalvamento) {
    setMensagem(null);

    if (!formulario.cursoId) {
      setMensagem({
        tipo: "erro",
        texto: "Selecione o curso.",
      });
      return;
    }

    if (!formulario.cursoSemestreId) {
      setMensagem({
        tipo: "erro",
        texto: "Selecione o semestre de destino.",
      });
      return;
    }

    if (
      !formulario.periodoLetivo.trim() ||
      !formulario.dataInicio ||
      !formulario.dataFim
    ) {
      setMensagem({
        tipo: "erro",
        texto:
          "Informe o período letivo, a abertura e o encerramento da rematrícula.",
      });
      return;
    }

    if (
      status === "PUBLICADO" &&
      turmaIdsSelecionadas.length === 0
    ) {
      setMensagem({
        tipo: "erro",
        texto:
          "Selecione pelo menos uma turma participante antes de publicar.",
      });

      return;
    }

    setSalvando(true);

    try {
      const editando = periodoEmEdicaoId !== null;

      const resposta = await fetch(
        editando
          ? `/api/admin/rematriculas-semestrais/${periodoEmEdicaoId}`
          : "/api/admin/rematriculas-semestrais",
        {
          method: editando ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            acao:
              editando && status === "PUBLICADO"
                ? "PUBLICAR"
                : editando
                  ? "SALVAR"
                  : undefined,
            cursoId: Number(formulario.cursoId),
            cursoSemestreId: Number(formulario.cursoSemestreId),
            turmaIds: turmaIdsSelecionadas,
            periodoLetivo: formulario.periodoLetivo.trim(),
            titulo: formulario.titulo.trim(),
            dataInicio: converterParaIso(formulario.dataInicio),
            dataFim: converterParaIso(formulario.dataFim),
            dataInicioAulas: converterParaIso(formulario.dataInicioAulas),
            cargaMinimaOverride:
              formulario.cargaMinimaOverride === ""
                ? null
                : Number(formulario.cargaMinimaOverride),
            cargaMaximaOverride:
              formulario.cargaMaximaOverride === ""
                ? null
                : Number(formulario.cargaMaximaOverride),
            instrucoes: formulario.instrucoes.trim(),
            exigeAprovacao: formulario.exigeAprovacao,
            permiteRascunho: formulario.permiteRascunho,
            bloqueiaInadimplente: formulario.bloqueiaInadimplente,
            status,
          }),
        },
      );

      const dados = (await resposta.json()) as RespostaApi;

      if (!resposta.ok) {
        throw new Error(
          dados.error || "Não foi possível salvar o período de rematrícula.",
        );
      }

      setFormulario(FORMULARIO_INICIAL);
      setPeriodoEmEdicaoId(null);
      setTurmaIdsSelecionadas([]);

      setMensagem({
        tipo: "sucesso",
        texto:
          dados.message ||
          (editando
            ? "O período foi atualizado corretamente."
            : "O período de rematrícula foi criado."),
      });

      await carregarDados();
    } catch (error) {
      setMensagem({
        tipo: "erro",
        texto:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar o período de rematrícula.",
      });
    } finally {
      setSalvando(false);
    }
  }

  async function executarAcaoPeriodo() {
    if (!confirmacaoPeriodo) {
      return;
    }

    const { acao, periodo } = confirmacaoPeriodo;

    setExecutandoAcao(true);
    setMensagem(null);

    try {
      const corpo: Record<string, unknown> = {
        acao,
      };

      if (acao === "PUBLICAR") {
        corpo.cursoId = periodo.cursoId || periodo.curso?.id;
        corpo.cursoSemestreId =
          periodo.cursoSemestreId || periodo.cursoSemestre?.id;
        corpo.periodoLetivo = periodo.periodoLetivo;
        corpo.titulo = periodo.titulo;
        corpo.dataInicio = periodo.dataInicio;
        corpo.dataFim = periodo.dataFim;
        corpo.dataInicioAulas = periodo.dataInicioAulas;
        corpo.cargaMinimaOverride = periodo.cargaMinimaOverride;
        corpo.cargaMaximaOverride = periodo.cargaMaximaOverride;
        corpo.instrucoes = periodo.instrucoes;
        corpo.exigeAprovacao = periodo.exigeAprovacao;
        corpo.permiteRascunho = periodo.permiteRascunho;
        corpo.bloqueiaInadimplente = periodo.bloqueiaInadimplente;
      }

      const resposta = await fetch(
        `/api/admin/rematriculas-semestrais/${periodo.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(corpo),
        },
      );

      const dados = (await resposta.json()) as RespostaApi;

      if (!resposta.ok) {
        throw new Error(
          dados.error || "Não foi possível executar esta ação.",
        );
      }

      setConfirmacaoPeriodo(null);

      setMensagem({
        tipo: "sucesso",
        texto: dados.message || "Ação realizada corretamente.",
      });

      await carregarDados();
    } catch (error) {
      setMensagem({
        tipo: "erro",
        texto:
          error instanceof Error
            ? error.message
            : "Não foi possível executar esta ação.",
      });
    } finally {
      setExecutandoAcao(false);
    }
  }

  return (
    <main className="phanyx-rematriculas-semestrais min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
            Acadêmico
          </p>

          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            Rematrículas semestrais
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
            Defina quando os alunos poderão selecionar as disciplinas do
            próximo semestre e quais regras deverão ser respeitadas.
          </p>
        </header>

        {mensagem && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${mensagem.tipo === "sucesso"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
              }`}
          >
            {mensagem.texto}
          </div>
        )}

        <form
          data-form-rematricula="true"
          onSubmit={(evento) => {
            evento.preventDefault();
            salvarPeriodo("RASCUNHO");
          }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
        >
          <div className="mb-6">
            <h2 className="text-lg font-bold">
              {periodoEmEdicaoId
                ? "Editar período de rematrícula"
                : "Configurar novo período"}
            </h2>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {periodoEmEdicaoId
                ? "Atualize as datas, regras e configurações deste período."
                : "O aluno somente visualizará a rematrícula dentro das datas estabelecidas."}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-semibold">Curso</span>

              <select
                value={formulario.cursoId}
                onChange={(evento) => alterarCurso(evento.target.value)}
                className="phanyx-rematricula-select h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Selecione o curso</option>

                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nome}
                    {curso.codigo ? ` — ${curso.codigo}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">
                Semestre de destino
              </span>

              <select
                value={formulario.cursoSemestreId}
                onChange={(evento) =>
                  alterarSemestre(evento.target.value)
                }
                disabled={!cursoSelecionado}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">Selecione o semestre</option>

                {cursoSelecionado?.semestres.map((semestre) => (
                  <option key={semestre.id} value={semestre.id}>
                    {semestre.numero}º semestre
                    {semestre.titulo ? ` — ${semestre.titulo}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-3 md:col-span-2 xl:col-span-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-sm font-semibold">
                    Turmas participantes
                  </span>

                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                    Selecione uma ou várias turmas que participarão
                    deste período de rematrícula. As disciplinas
                    oferecidas ao aluno serão obtidas dessas turmas.
                  </p>
                </div>

                {turmasDisponiveis.length > 0 && (
                  <button
                    type="button"
                    onClick={alternarTodasTurmas}
                    className="self-start rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
                  >
                    {todasTurmasSelecionadas
                      ? "Desmarcar todas"
                      : "Selecionar todas"}
                  </button>
                )}
              </div>

              {!formulario.cursoId ? (
                <div className="rounded-xl border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Selecione primeiro o curso.
                </div>
              ) : !formulario.cursoSemestreId ? (
                <div className="rounded-xl border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Selecione o semestre de destino.
                </div>
              ) : turmasDisponiveis.length === 0 ? (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  Nenhuma turma ativa foi encontrada para este curso
                  e semestre. Cadastre ou configure uma turma antes
                  de publicar a rematrícula.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {turmasDisponiveis.map((turma) => {
                    const selecionada =
                      turmaIdsSelecionadas.includes(
                        turma.id,
                      );

                    return (
                      <label
                        key={turma.id}
                        className={`cursor-pointer rounded-xl border p-4 transition ${selecionada
                            ? "border-blue-600 bg-blue-50 shadow-sm dark:border-blue-600 dark:bg-blue-950/30"
                            : "border-slate-300 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950"
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selecionada}
                            onChange={(evento) =>
                              alternarTurma(
                                turma.id,
                                evento.target.checked,
                              )
                            }
                            className="mt-1 h-4 w-4"
                          />

                          <div className="min-w-0 flex-1">
                            <strong
                              className={`block text-sm font-bold ${selecionada
                                  ? "text-blue-950 dark:text-blue-100"
                                  : "text-slate-900 dark:text-slate-100"
                                }`}
                            >
                              {turma.nome}
                            </strong>

                            <div
                              className={`mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs font-semibold ${selecionada
                                  ? "text-blue-900 dark:text-blue-200"
                                  : "text-slate-700 dark:text-slate-300"
                                }`}
                            >
                              {turma.codigo && (
                                <span>
                                  Código: {turma.codigo}
                                </span>
                              )}

                              {turma.turno && (
                                <span>
                                  · {turma.turno}
                                </span>
                              )}

                              {turma.modalidade && (
                                <span>
                                  · {turma.modalidade}
                                </span>
                              )}

                              {turma.polo?.nome && (
                                <span>
                                  · {turma.polo.nome}
                                </span>
                              )}
                            </div>

                            <div
                              className={`mt-2 text-xs font-bold ${selecionada
                                  ? "text-blue-800 dark:text-blue-200"
                                  : "text-slate-800 dark:text-slate-300"
                                }`}
                            >
                              {turma._count.disciplinas} disciplina
                              {turma._count.disciplinas === 1
                                ? ""
                                : "s"}

                              {turma.periodoLetivo
                                ? ` · ${turma.periodoLetivo}`
                                : ""}
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {turmaIdsSelecionadas.length > 0 && (
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {turmaIdsSelecionadas.length} turma
                  {turmaIdsSelecionadas.length === 1
                    ? ""
                    : "s"}{" "}
                  selecionada
                  {turmaIdsSelecionadas.length === 1
                    ? ""
                    : "s"}.
                </p>
              )}
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold">
                Período letivo
              </span>

              <input
                value={formulario.periodoLetivo}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    periodoLetivo: evento.target.value,
                  }))
                }
                placeholder="Ex.: 2027.1"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="space-y-2 md:col-span-2 xl:col-span-3">
              <span className="text-sm font-semibold">
                Título do período
              </span>

              <input
                value={formulario.titulo}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    titulo: evento.target.value,
                  }))
                }
                placeholder="Será preenchido automaticamente se ficar em branco"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">
                Abertura da rematrícula
              </span>

              <input
                type="datetime-local"
                value={formulario.dataInicio}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    dataInicio: evento.target.value,
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">
                Encerramento da rematrícula
              </span>

              <input
                type="datetime-local"
                value={formulario.dataFim}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    dataFim: evento.target.value,
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">
                Início das aulas
              </span>

              <input
                type="datetime-local"
                value={formulario.dataInicioAulas}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    dataInicioAulas: evento.target.value,
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">
                Carga horária mínima
              </span>

              <input
                type="number"
                min="0"
                value={formulario.cargaMinimaOverride}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    cargaMinimaOverride: evento.target.value,
                  }))
                }
                placeholder={
                  semestreSelecionado?.cargaMinima !== null &&
                    semestreSelecionado?.cargaMinima !== undefined
                    ? String(semestreSelecionado.cargaMinima)
                    : "Não definida"
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">
                Carga horária máxima
              </span>

              <input
                type="number"
                min="0"
                value={formulario.cargaMaximaOverride}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    cargaMaximaOverride: evento.target.value,
                  }))
                }
                placeholder={
                  semestreSelecionado?.cargaMaxima !== null &&
                    semestreSelecionado?.cargaMaxima !== undefined
                    ? String(semestreSelecionado.cargaMaxima)
                    : "Não definida"
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="space-y-2 md:col-span-2 xl:col-span-3">
              <span className="text-sm font-semibold">
                Instruções para os alunos
              </span>

              <textarea
                value={formulario.instrucoes}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    instrucoes: evento.target.value,
                  }))
                }
                rows={4}
                placeholder="Informe orientações sobre seleção de disciplinas, horários, pendências e confirmação."
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <input
                type="checkbox"
                checked={formulario.exigeAprovacao}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    exigeAprovacao: evento.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4"
              />

              <span>
                <strong className="block text-sm">
                  Exigir aprovação
                </strong>

                <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
                  A secretaria ou coordenação deverá aprovar a seleção.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <input
                type="checkbox"
                checked={formulario.permiteRascunho}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    permiteRascunho: evento.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4"
              />

              <span>
                <strong className="block text-sm">
                  Permitir rascunho
                </strong>

                <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
                  O aluno poderá salvar a seleção antes de enviar.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <input
                type="checkbox"
                checked={formulario.bloqueiaInadimplente}
                onChange={(evento) =>
                  setFormulario((atual) => ({
                    ...atual,
                    bloqueiaInadimplente: evento.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4"
              />

              <span>
                <strong className="block text-sm">
                  Bloquear inadimplentes
                </strong>

                <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
                  Alunos inadimplentes não poderão enviar a rematrícula.
                </span>
              </span>
            </label>
          </div>

          <section className="phanyx-extras-painel mt-6 overflow-hidden rounded-2xl border">
            <div className="phanyx-extras-cabecalho border-b px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="font-bold">
                    Disciplinas extracurriculares permitidas
                  </h3>

                  <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
                    Escolha disciplinas de qualquer curso da instituição que poderão
                    complementar a grade dos alunos deste curso.
                  </p>
                </div>

                <div className="phanyx-extras-contador rounded-xl border px-3 py-2 text-xs">
                  {itensExtras.length} disciplina
                  {itensExtras.length === 1
                    ? ""
                    : "s"}{" "}
                  selecionada
                  {itensExtras.length === 1
                    ? ""
                    : "s"}
                </div>
              </div>
            </div>

            {!formulario.cursoId ? (
              <div className="phanyx-extras-estado-vazio p-5 text-sm">
                Selecione primeiro o curso de destino.
              </div>
            ) : (
              <div className="space-y-5 p-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEscopoExtras(
                        "SEMESTRE_ESPECIFICO",
                      );

                      setItensExtras([]);
                    }}
                    className={`phanyx-extras-escopo rounded-xl border p-4 text-left transition ${escopoExtras === "SEMESTRE_ESPECIFICO"
                      ? "phanyx-extras-escopo-semestre-ativo"
                      : ""
                      }`}
                  >
                    <strong className="block text-sm">
                      Somente neste semestre
                    </strong>

                    <span className="mt-1 block text-xs">
                      As disciplinas serão oferecidas apenas para o semestre selecionado.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEscopoExtras(
                        "TODOS_OS_SEMESTRES",
                      );

                      setItensExtras([]);
                    }}
                    className={`phanyx-extras-escopo rounded-xl border p-4 text-left transition ${escopoExtras === "TODOS_OS_SEMESTRES"
                      ? "phanyx-extras-escopo-curso-ativo"
                      : ""
                      }`}
                  >
                    <strong className="block text-sm">
                      Todos os semestres do curso
                    </strong>

                    <span className="mt-1 block text-xs">
                      As disciplinas poderão ser oferecidas em qualquer semestre deste curso.
                    </span>
                  </button>
                </div>

                {escopoExtras ===
                  "SEMESTRE_ESPECIFICO" &&
                  !formulario.cursoSemestreId ? (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    Selecione o semestre de destino para configurar as disciplinas.
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-semibold">
                          Buscar disciplina
                        </span>

                        <input
                          value={buscaExtra}
                          onChange={(evento) =>
                            setBuscaExtra(
                              evento.target.value,
                            )
                          }
                          placeholder="Ex.: ética, aconselhamento, gestão, missões..."
                          className="phanyx-extras-campo h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
                        />
                        {buscaExtra.trim() &&
                          tokenizarBuscaInteligente(
                            buscaExtra,
                          ).length === 0 && (
                            <span className="mt-1 block text-xs font-medium text-amber-700 dark:text-amber-300">
                              Digite pelo menos 3 letras para realizar uma busca mais precisa.
                            </span>
                          )}
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-semibold">
                          Curso de origem
                        </span>

                        <select
                          value={
                            filtroCursoOrigemExtra
                          }
                          onChange={(evento) =>
                            setFiltroCursoOrigemExtra(
                              evento.target.value,
                            )
                          }
                          className="phanyx-extras-campo h-11 w-full rounded-xl border px-3 text-sm outline-none"
                        >
                          <option value="">
                            Todos os cursos
                          </option>

                          {cursosOrigemExtras.map(
                            (curso) => (
                              <option
                                key={curso.id}
                                value={curso.id}
                              >
                                {curso.nome}
                                {curso.codigo
                                  ? ` — ${curso.codigo}`
                                  : ""}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="phanyx-extras-contagem text-xs">
                        {
                          disciplinasExtrasFiltradas.length
                        }{" "}
                        disciplina
                        {disciplinasExtrasFiltradas.length ===
                          1
                          ? ""
                          : "s"}{" "}
                        encontrada
                        {disciplinasExtrasFiltradas.length ===
                          1
                          ? ""
                          : "s"}
                      </span>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={
                            selecionarTodasExtrasFiltradas
                          }
                          disabled={
                            disciplinasExtrasFiltradas.length ===
                            0
                          }
                          className="phanyx-rematricula-selecionar-exibidas rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
                        >
                          Selecionar todas exibidas
                        </button>

                        <button
                          type="button"
                          onClick={
                            removerExtrasFiltradas
                          }
                          disabled={
                            disciplinasExtrasFiltradas.length ===
                            0
                          }
                          className="phanyx-rematricula-remover-exibidas rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                        >
                          Remover exibidas
                        </button>
                      </div>
                    </div>

                    {carregandoExtras ? (
                      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                        Carregando disciplinas...
                      </div>
                    ) : disciplinasExtrasFiltradas.length ===
                      0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                        Nenhuma disciplina encontrada.
                      </div>
                    ) : (
                      <div className="phanyx-extras-lista max-h-[560px] space-y-3 overflow-y-auto pr-1">
                        {disciplinasExtrasFiltradas.map(
                          (disciplina) => {
                            const configuracao =
                              extrasPorDisciplina.get(
                                disciplina.id,
                              );

                            const selecionada =
                              Boolean(configuracao);

                            return (
                              <article
                                key={
                                  disciplina.id
                                }
                                className={`phanyx-extras-disciplina rounded-xl border p-4 transition ${selecionada
                                  ? "phanyx-extras-disciplina-selecionada"
                                  : ""
                                  }`}
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={
                                      selecionada
                                    }
                                    onChange={(
                                      evento,
                                    ) =>
                                      alternarDisciplinaExtra(
                                        disciplina.id,
                                        evento.target
                                          .checked,
                                      )
                                    }
                                    className="mt-1 h-4 w-4"
                                  />

                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <strong className="phanyx-extras-disciplina-titulo text-sm">
                                        {
                                          disciplina.nome
                                        }
                                      </strong>

                                      {disciplina.codigo && (
                                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                          {
                                            disciplina.codigo
                                          }
                                        </span>
                                      )}
                                    </div>

                                    <p className="phanyx-extras-disciplina-meta mt-1 text-xs">
                                      Curso de origem:{" "}
                                      {disciplina
                                        .curso
                                        ?.nome ||
                                        "Disciplina institucional"}
                                      {" · "}
                                      {
                                        disciplina.cargaHoraria ??
                                        0
                                      }
                                      h
                                    </p>

                                    {disciplina.descricao && (
                                      <p className="phanyx-extras-disciplina-descricao mt-2 text-xs">
                                        {
                                          disciplina.descricao
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {selecionada &&
                                  configuracao && (
                                    <div className="mt-4 grid gap-3 border-t border-blue-200 pt-4 md:grid-cols-3 dark:border-blue-900">
                                      <label className="flex cursor-pointer items-start gap-2 text-xs">
                                        <input
                                          type="checkbox"
                                          checked={
                                            configuracao.obrigatoria
                                          }
                                          onChange={(
                                            evento,
                                          ) =>
                                            alterarRegraExtra(
                                              disciplina.id,
                                              "obrigatoria",
                                              evento
                                                .target
                                                .checked,
                                            )
                                          }
                                          className="mt-0.5 h-4 w-4"
                                        />

                                        <span>
                                          <strong className="block">
                                            Obrigatória
                                          </strong>

                                          <span className="text-slate-600 dark:text-slate-400">
                                            O aluno deverá selecioná-la.
                                          </span>
                                        </span>
                                      </label>

                                      <label className="flex cursor-pointer items-start gap-2 text-xs">
                                        <input
                                          type="checkbox"
                                          checked={
                                            configuracao.contaCargaMinima
                                          }
                                          onChange={(
                                            evento,
                                          ) =>
                                            alterarRegraExtra(
                                              disciplina.id,
                                              "contaCargaMinima",
                                              evento
                                                .target
                                                .checked,
                                            )
                                          }
                                          className="mt-0.5 h-4 w-4"
                                        />

                                        <span>
                                          <strong className="block">
                                            Contar na carga mínima
                                          </strong>

                                          <span className="text-slate-600 dark:text-slate-400">
                                            Soma para atingir o mínimo.
                                          </span>
                                        </span>
                                      </label>

                                      <label className="flex cursor-pointer items-start gap-2 text-xs">
                                        <input
                                          type="checkbox"
                                          checked={
                                            configuracao.contaCargaMaxima
                                          }
                                          onChange={(
                                            evento,
                                          ) =>
                                            alterarRegraExtra(
                                              disciplina.id,
                                              "contaCargaMaxima",
                                              evento
                                                .target
                                                .checked,
                                            )
                                          }
                                          className="mt-0.5 h-4 w-4"
                                        />

                                        <span>
                                          <strong className="block">
                                            Contar na carga máxima
                                          </strong>

                                          <span className="text-slate-600 dark:text-slate-400">
                                            Soma para o limite máximo.
                                          </span>
                                        </span>
                                      </label>
                                    </div>
                                  )}
                              </article>
                            );
                          },
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Esta configuração é independente das disciplinas obrigatórias da grade regular.
                      </p>

                      <button
                        type="button"
                        onClick={
                          salvarExtracurriculares
                        }
                        disabled={
                          salvandoExtras ||
                          carregandoExtras
                        }
                        className="h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {salvandoExtras
                          ? "Salvando..."
                          : "Salvar extracurriculares"}
                      </button>
                    </div>
                  </>
                )}

              </div>
            )}
          </section>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
            {periodoEmEdicaoId && (
              <button
                type="button"
                disabled={salvando}
                onClick={cancelarEdicao}
                className="h-11 rounded-xl border border-red-300 bg-white px-5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar edição
              </button>
            )}

            <button
              type="submit"
              disabled={salvando}
              className="phanyx-rematricula-botao-rascunho h-11 rounded-xl border px-5 text-sm font-semibold transition disabled:cursor-not-allowed"
            >
              {salvando
                ? "Salvando..."
                : periodoEmEdicaoId
                  ? "Salvar alterações"
                  : "Salvar rascunho"}
            </button>

            <button
              type="button"
              disabled={salvando}
              onClick={() => salvarPeriodo("PUBLICADO")}
              className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando
                ? "Publicando..."
                : periodoEmEdicaoId
                  ? "Salvar e publicar"
                  : "Criar e publicar"}
            </button>
          </div>
        </form>

        <section className="phanyx-rematriculas-lista rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="text-lg font-bold">
              Períodos configurados
            </h2>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Acompanhe as campanhas de rematrícula da instituição.
            </p>
          </div>

          {carregando ? (
            <div className="p-8 text-center text-sm text-slate-600 dark:text-slate-400">
              Carregando períodos...
            </div>
          ) : periodos.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-semibold">
                Nenhum período de rematrícula configurado.
              </p>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Utilize o formulário acima para criar o primeiro período.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {periodos.map((periodo) => (
                <article
                  key={periodo.id}
                  className="phanyx-rematricula-periodo-card grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">
                        {periodo.titulo ||
                          `Rematrícula ${periodo.periodoLetivo}`}
                      </h3>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${classeStatus(
                          periodo.status,
                        )}`}
                      >
                        {nomeStatus(periodo.status)}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {periodo.curso?.nome || "Curso não informado"} ·{" "}
                      {periodo.cursoSemestre?.numero ||
                        periodo.semestreNumero ||
                        "—"}
                      º semestre · {periodo.periodoLetivo}
                    </p>

                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <span className="block text-xs font-semibold uppercase text-slate-500">
                          Abertura
                        </span>
                        <span className="mt-1 block">
                          {formatarDataHora(periodo.dataInicio)}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-semibold uppercase text-slate-500">
                          Encerramento
                        </span>
                        <span className="mt-1 block">
                          {formatarDataHora(periodo.dataFim)}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-semibold uppercase text-slate-500">
                          Início das aulas
                        </span>
                        <span className="mt-1 block">
                          {formatarDataHora(periodo.dataInicioAulas)}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-semibold uppercase text-slate-500">
                          Carga horária
                        </span>
                        <span className="mt-1 block">
                          {periodo.cargaMinimaOverride ??
                            periodo.cursoSemestre?.cargaMinima ??
                            "—"}
                          h a{" "}
                          {periodo.cargaMaximaOverride ??
                            periodo.cursoSemestre?.cargaMaxima ??
                            "—"}
                          h
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex min-w-48 flex-col gap-3 lg:items-end lg:justify-center">
                    <div className="phanyx-rematricula-contador rounded-xl px-4 py-3 text-center">
                      <span className="block text-xl font-bold">
                        {periodo._count.rematriculas}
                      </span>

                      <span className="text-xs">
                        rematrículas
                      </span>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        href={`/admin/rematriculas-semestrais/${periodo.id}`}
                        className="phanyx-rematricula-alunos-restricoes rounded-lg border px-3 py-2 text-xs font-semibold transition"
                      >
                        Alunos e restrições
                      </Link>

                      {(periodo.status === "RASCUNHO" ||
                        periodo.status === "PUBLICADO") && (
                          <button
                            type="button"
                            onClick={() => editarPeriodo(periodo)}
                            className="phanyx-rematricula-botao-editar rounded-lg border px-3 py-2 text-xs font-semibold transition"
                          >
                            Editar
                          </button>
                        )}

                      {periodo.status === "RASCUNHO" && (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmacaoPeriodo({
                              acao: "PUBLICAR",
                              periodo,
                            })
                          }
                          className="rounded-lg border border-blue-600 bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                        >
                          Publicar
                        </button>
                      )}

                      {periodo.status === "PUBLICADO" && (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmacaoPeriodo({
                              acao: "ENCERRAR",
                              periodo,
                            })
                          }
                          className="rounded-lg border border-amber-500 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                        >
                          Encerrar
                        </button>
                      )}

                      {(periodo.status === "RASCUNHO" ||
                        periodo.status === "PUBLICADO") && (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmacaoPeriodo({
                                acao: "CANCELAR",
                                periodo,
                              })
                            }
                            className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            Cancelar
                          </button>
                        )}
                    </div>

                    {periodo.exigeAprovacao && (
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                        Exige aprovação
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <PhanyxConfirmModal
        aberto={confirmacaoPeriodo !== null}
        titulo={
          confirmacaoPeriodo?.acao === "PUBLICAR"
            ? "Publicar período"
            : confirmacaoPeriodo?.acao === "ENCERRAR"
              ? "Encerrar período"
              : "Cancelar período"
        }
        mensagem={
          confirmacaoPeriodo?.acao === "PUBLICAR"
            ? "Ao publicar, o período ficará disponível aos alunos elegíveis dentro das datas configuradas."
            : confirmacaoPeriodo?.acao === "ENCERRAR"
              ? "Ao encerrar, os alunos não poderão mais iniciar ou enviar rematrículas neste período."
              : "O período será cancelado e deixará de ficar disponível aos alunos. Os registros existentes serão preservados."
        }
        textoConfirmar={
          executandoAcao
            ? "Processando..."
            : confirmacaoPeriodo?.acao === "PUBLICAR"
              ? "Publicar"
              : confirmacaoPeriodo?.acao === "ENCERRAR"
                ? "Encerrar"
                : "Cancelar período"
        }
        textoCancelar="Voltar"
        onConfirmar={executarAcaoPeriodo}
        onCancelar={() => {
          if (!executandoAcao) {
            setConfirmacaoPeriodo(null);
          }
        }}
      />

    </main>
  );
}
"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type Disciplina = {
  id: number;
  nome: string;
  descricao?: string | null;
  cargaHoraria?: number | null;
  valor?: number | string | null;
  prerequisitos?: Array<
    | string
    | {
        id?: number;
        nome?: string;
      }
  >;
};

type Modulo = {
  id?: number | string;
  numero?: number;
  nome?: string;
  titulo?: string;
  disciplinas?: Disciplina[];
};

type Curso = {
  id?: number;
  nome?: string;
};

type PagamentoBoleto = {
  id?: number | string;
  status?: string | null;
  checkoutUrl?: string | null;
  asaasPaymentId?: string | null;
  externalReference?: string | null;
};

type BoletoSalvo = {
  id: string;
  nome: string;
  email: string;
  whatsapp?: string | null;
  cpf?: string | null;
  descricao?: string | null;
  valorTotal: number | string;
  valorPago?: number | string;
  vencimentoEscolhido?: string | null;
  status?: string | null;
  origem?: string | null;
  createdAt?: string | null;
  pagamentos?: PagamentoBoleto[];
};

type BoletoGerado = {
  matriculaOnlineIbeId: string;
  asaasPaymentId?: string | null;
  externalReference?: string | null;
  nome: string;
  email: string;
  cpf: string;
  whatsapp: string;
  valor: number;
  vencimento: string;
  descricao: string;
  status?: string | null;
  boletoUrl?: string | null;
  bankSlipUrl?: string | null;
  invoiceUrl?: string | null;
};

type FormularioBoleto = {
  nome: string;
  email: string;
  cpf: string;
  whatsapp: string;
  valor: string;
  vencimento: string;
  descricao: string;
};

type Props = {
  contexto: "ADMIN" | "MASTER";
};

function dataHojeLocal() {
  const agora = new Date();

  const ano = agora.getFullYear();
  const mes = String(
    agora.getMonth() + 1
  ).padStart(2, "0");
  const dia = String(
    agora.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarCpf(valor: string) {
  const numeros = valor
    .replace(/\D/g, "")
    .slice(0, 11);

  return numeros
    .replace(
      /^(\d{3})(\d)/,
      "$1.$2"
    )
    .replace(
      /^(\d{3})\.(\d{3})(\d)/,
      "$1.$2.$3"
    )
    .replace(
      /\.(\d{3})(\d)/,
      ".$1-$2"
    );
}

function formatarTelefone(valor: string) {
  const numeros = valor
    .replace(/\D/g, "")
    .slice(0, 11);

  if (numeros.length <= 10) {
    return numeros
      .replace(
        /^(\d{2})(\d)/,
        "($1) $2"
      )
      .replace(
        /(\d{4})(\d)/,
        "$1-$2"
      );
  }

  return numeros
    .replace(
      /^(\d{2})(\d)/,
      "($1) $2"
    )
    .replace(
      /(\d{5})(\d)/,
      "$1-$2"
    );
}

function numeroSeguro(
  valor: number | string | null | undefined
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return 0;
  }

  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : 0;
}

function formatarMoeda(
  valor: number | string | null | undefined
) {
  return numeroSeguro(valor).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

function formatarData(
  valor: string | null | undefined
) {
  if (!valor) {
    return "Não informado";
  }

  const data = new Date(valor);

  if (
    Number.isNaN(data.getTime())
  ) {
    return "Não informado";
  }

  return data.toLocaleDateString(
    "pt-BR",
    {
      timeZone: "UTC",
    }
  );
}

function formatarDataHora(
  valor: string | null | undefined
) {
  if (!valor) {
    return "Não informado";
  }

  const data = new Date(valor);

  if (
    Number.isNaN(data.getTime())
  ) {
    return "Não informado";
  }

  return data.toLocaleString(
    "pt-BR"
  );
}

function rotuloStatus(
  status: string | null | undefined
) {
  switch (
    String(status || "").toUpperCase()
  ) {
    case "PAGO":
    case "RECEIVED":
    case "CONFIRMED":
    case "PAYMENT_RECEIVED":
    case "PAYMENT_CONFIRMED":
      return "Pago";

    case "AGUARDANDO_PAGAMENTO":
    case "PENDING":
      return "Aguardando pagamento";

    case "OVERDUE":
    case "VENCIDO":
      return "Vencido";

    case "CANCELLED":
    case "CANCELED":
    case "CANCELADO":
      return "Cancelado";

    case "ERRO":
      return "Erro ao gerar";

    default:
      return status
        ? String(status)
        : "Não informado";
  }
}

function classeStatus(
  status: string | null | undefined
) {
  const statusNormalizado = String(
    status || ""
  ).toUpperCase();

  if (
    [
      "PAGO",
      "RECEIVED",
      "CONFIRMED",
      "PAYMENT_RECEIVED",
      "PAYMENT_CONFIRMED",
    ].includes(statusNormalizado)
  ) {
    return [
      "border-emerald-200",
      "bg-emerald-50",
      "text-emerald-700",
      "dark:border-emerald-900/70",
      "dark:bg-emerald-950/40",
      "dark:text-emerald-300",
    ].join(" ");
  }

  if (
    [
      "OVERDUE",
      "VENCIDO",
      "ERRO",
    ].includes(statusNormalizado)
  ) {
    return [
      "border-red-200",
      "bg-red-50",
      "text-red-700",
      "dark:border-red-900/70",
      "dark:bg-red-950/40",
      "dark:text-red-300",
    ].join(" ");
  }

  if (
    [
      "CANCELLED",
      "CANCELED",
      "CANCELADO",
    ].includes(statusNormalizado)
  ) {
    return [
      "border-slate-300",
      "bg-slate-100",
      "text-slate-700",
      "dark:border-slate-700",
      "dark:bg-slate-800",
      "dark:text-slate-300",
    ].join(" ");
  }

  return [
    "border-amber-200",
    "bg-amber-50",
    "text-amber-700",
    "dark:border-amber-900/70",
    "dark:bg-amber-950/40",
    "dark:text-amber-300",
  ].join(" ");
}

function obterUrlBoleto(
  boleto: BoletoSalvo
) {
  const pagamentos =
    boleto.pagamentos || [];

  const pagamentoComUrl =
    pagamentos.find(
      (pagamento) =>
        Boolean(
          pagamento.checkoutUrl
        )
    );

  return (
    pagamentoComUrl?.checkoutUrl ||
    null
  );
}

function valorInicialFormulario():
  FormularioBoleto {
  return {
    nome: "",
    email: "",
    cpf: "",
    whatsapp: "",
    valor: "",
    vencimento: "",
    descricao:
      "Matrícula - Bacharel Livre em Teologia",
  };
}

export default function BoletosIbeClient({
  contexto,
}: Props) {
  const [
    formulario,
    setFormulario,
  ] = useState<FormularioBoleto>(
    valorInicialFormulario
  );

  const [
    curso,
    setCurso,
  ] = useState<Curso | null>(
    null
  );

  const [
    modulos,
    setModulos,
  ] = useState<Modulo[]>([]);

  const [
    disciplinasSelecionadas,
    setDisciplinasSelecionadas,
  ] = useState<number[]>([]);

  const [
    boletos,
    setBoletos,
  ] = useState<BoletoSalvo[]>([]);

  const [
    carregandoDados,
    setCarregandoDados,
  ] = useState(true);

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState<string | null>(
    null
  );

  const [
    sucesso,
    setSucesso,
  ] = useState<string | null>(
    null
  );

  const [
    boletoGerado,
    setBoletoGerado,
  ] = useState<BoletoGerado | null>(
    null
  );

  const todasDisciplinas =
    useMemo(() => {
      return modulos.flatMap(
        (modulo) =>
          modulo.disciplinas || []
      );
    }, [modulos]);

  const disciplinasEscolhidas =
    useMemo(() => {
      const ids = new Set(
        disciplinasSelecionadas
      );

      return todasDisciplinas.filter(
        (disciplina) =>
          ids.has(disciplina.id)
      );
    }, [
      todasDisciplinas,
      disciplinasSelecionadas,
    ]);

  const carregarBoletos =
    useCallback(async () => {
      const resposta = await fetch(
        "/api/admin/financeiro/boletos-ibe",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
            "Não foi possível consultar os boletos."
        );
      }

      setBoletos(
        Array.isArray(dados?.boletos)
          ? dados.boletos
          : []
      );
    }, []);

  const carregarDisciplinas =
    useCallback(async () => {
      const resposta = await fetch(
        "/api/ibe/disciplinas",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
            "Não foi possível carregar as disciplinas do IBE."
        );
      }

      setCurso(
        dados?.curso || null
      );

      setModulos(
        Array.isArray(dados?.modulos)
          ? dados.modulos
          : []
      );
    }, []);

  const carregarTudo =
    useCallback(async () => {
      setCarregandoDados(true);
      setErro(null);

      try {
        await Promise.all([
          carregarDisciplinas(),
          carregarBoletos(),
        ]);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a página."
        );
      } finally {
        setCarregandoDados(false);
      }
    }, [
      carregarBoletos,
      carregarDisciplinas,
    ]);

  useEffect(() => {
    void carregarTudo();
  }, [carregarTudo]);

  function atualizarCampo(
    campo: keyof FormularioBoleto,
    valor: string
  ) {
    setFormulario(
      (estadoAnterior) => ({
        ...estadoAnterior,
        [campo]: valor,
      })
    );
  }

  function alternarDisciplina(
    disciplinaId: number
  ) {
    setDisciplinasSelecionadas(
      (estadoAnterior) => {
        if (
          estadoAnterior.includes(
            disciplinaId
          )
        ) {
          return estadoAnterior.filter(
            (id) =>
              id !== disciplinaId
          );
        }

        return [
          ...estadoAnterior,
          disciplinaId,
        ];
      }
    );
  }

  function selecionarModulo(
    modulo: Modulo
  ) {
    const idsModulo = (
      modulo.disciplinas || []
    ).map(
      (disciplina) =>
        disciplina.id
    );

    if (idsModulo.length === 0) {
      return;
    }

    const todasJaSelecionadas =
      idsModulo.every((id) =>
        disciplinasSelecionadas.includes(
          id
        )
      );

    setDisciplinasSelecionadas(
      (estadoAnterior) => {
        if (todasJaSelecionadas) {
          return estadoAnterior.filter(
            (id) =>
              !idsModulo.includes(id)
          );
        }

        return Array.from(
          new Set([
            ...estadoAnterior,
            ...idsModulo,
          ])
        );
      }
    );
  }

  async function copiarTexto(
    texto: string,
    mensagem: string
  ) {
    try {
      await navigator.clipboard.writeText(
        texto
      );

      setErro(null);
      setSucesso(mensagem);
    } catch {
      setSucesso(null);
      setErro(
        "Não foi possível copiar automaticamente."
      );
    }
  }

  async function gerarBoleto(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro(null);
    setSucesso(null);
    setBoletoGerado(null);

    if (
      disciplinasSelecionadas.length === 0
    ) {
      setErro(
        "Selecione pelo menos uma disciplina."
      );
      return;
    }

    setEnviando(true);

    try {
      const resposta = await fetch(
        "/api/admin/financeiro/boletos-ibe",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            nome: formulario.nome,
            email: formulario.email,
            cpf: formulario.cpf,
            whatsapp:
              formulario.whatsapp,
            valor: formulario.valor,
            vencimento:
              formulario.vencimento,
            descricao:
              formulario.descricao,
            disciplinasIds:
              disciplinasSelecionadas,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
            "Não foi possível gerar o boleto."
        );
      }

      setBoletoGerado(
        dados?.boleto || null
      );

      setSucesso(
        dados?.mensagem ||
          "Boleto gerado com sucesso."
      );

      setFormulario(
        valorInicialFormulario()
      );

      setDisciplinasSelecionadas(
        []
      );

      await carregarBoletos();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o boleto."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="phanyx-boletos-ibe-page min-h-screen bg-slate-100 px-4 py-6 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {contexto === "MASTER"
              ? "PHANYX Master"
              : "IBE Polos"}
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">
            Gerar boleto para interessado
          </h1>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            O boleto será gerado no
            Asaas com a data escolhida.
            O acesso ao Portal do Aluno
            somente será criado depois
            que o pagamento for
            confirmado pelo webhook.
          </p>
        </header>

        {erro && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
          >
            {erro}
          </div>
        )}

        {sucesso && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            {sucesso}
          </div>
        )}

        {boletoGerado && (
          <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-900/70 dark:bg-slate-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                  Boleto gerado
                </h2>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {boletoGerado.nome} ·{" "}
                  {formatarMoeda(
                    boletoGerado.valor
                  )}{" "}
                  · vencimento em{" "}
                  {formatarData(
                    `${boletoGerado.vencimento}T12:00:00.000Z`
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {boletoGerado.boletoUrl && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          boletoGerado.boletoUrl ||
                            "",
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                      className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                      Abrir boleto
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void copiarTexto(
                          boletoGerado.boletoUrl ||
                            "",
                          "Link do boleto copiado."
                        )
                      }
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      Copiar link
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.72fr)]">
          <form
            onSubmit={gerarBoleto}
            className="space-y-6"
          >
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                Dados do interessado
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Nome completo
                  </span>

                  <input
                    type="text"
                    value={formulario.nome}
                    onChange={(event) =>
                      atualizarCampo(
                        "nome",
                        event.target.value
                      )
                    }
                    required
                    minLength={3}
                    autoComplete="name"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                    placeholder="Nome do interessado"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    CPF
                  </span>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={formulario.cpf}
                    onChange={(event) =>
                      atualizarCampo(
                        "cpf",
                        formatarCpf(
                          event.target.value
                        )
                      )
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                    placeholder="000.000.000-00"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    WhatsApp
                  </span>

                  <input
                    type="tel"
                    value={
                      formulario.whatsapp
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "whatsapp",
                        formatarTelefone(
                          event.target.value
                        )
                      )
                    }
                    required
                    autoComplete="tel"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                    placeholder="(00) 00000-0000"
                  />
                </label>

                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    E-mail que receberá o
                    primeiro acesso
                  </span>

                  <input
                    type="email"
                    value={formulario.email}
                    onChange={(event) =>
                      atualizarCampo(
                        "email",
                        event.target.value
                      )
                    }
                    required
                    autoComplete="email"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                    placeholder="aluno@email.com"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                    Disciplinas
                  </h2>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {curso?.nome ||
                      "Bacharel Livre em Teologia"}
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {
                    disciplinasSelecionadas.length
                  }{" "}
                  selecionada
                  {disciplinasSelecionadas.length ===
                  1
                    ? ""
                    : "s"}
                </span>
              </div>

              {carregandoDados ? (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  Carregando disciplinas…
                </div>
              ) : modulos.length === 0 ? (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300">
                  Nenhuma disciplina foi
                  encontrada para o curso
                  do IBE.
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {modulos.map(
                    (modulo, indice) => {
                      const disciplinas =
                        modulo.disciplinas ||
                        [];

                      const idsModulo =
                        disciplinas.map(
                          (disciplina) =>
                            disciplina.id
                        );

                      const moduloCompleto =
                        idsModulo.length >
                          0 &&
                        idsModulo.every(
                          (id) =>
                            disciplinasSelecionadas.includes(
                              id
                            )
                        );

                      const tituloModulo =
                        modulo.nome ||
                        modulo.titulo ||
                        `Módulo ${
                          modulo.numero ||
                          indice + 1
                        }`;

                      return (
                        <div
                          key={
                            modulo.id ??
                            `${tituloModulo}-${indice}`
                          }
                          className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
                        >
                          <div className="flex flex-col gap-3 bg-slate-100 px-4 py-3 dark:bg-slate-800/80 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white">
                              {
                                tituloModulo
                              }
                            </h3>

                            <button
                              type="button"
                              onClick={() =>
                                selecionarModulo(
                                  modulo
                                )
                              }
                              disabled={
                                disciplinas.length ===
                                0
                              }
                              className="w-fit rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              {moduloCompleto
                                ? "Desmarcar módulo"
                                : "Selecionar módulo"}
                            </button>
                          </div>

                          <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {disciplinas.map(
                              (
                                disciplina
                              ) => {
                                const selecionada =
                                  disciplinasSelecionadas.includes(
                                    disciplina.id
                                  );

                                return (
                                  <label
                                    key={
                                      disciplina.id
                                    }
                                    className={[
                                      "flex cursor-pointer gap-3 px-4 py-3 transition",
                                      selecionada
                                        ? "bg-slate-100 dark:bg-slate-800/60"
                                        : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/40",
                                    ].join(
                                      " "
                                    )}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        selecionada
                                      }
                                      onChange={() =>
                                        alternarDisciplina(
                                          disciplina.id
                                        )
                                      }
                                      className="mt-1 h-4 w-4 rounded border-slate-300 accent-slate-900 dark:border-slate-600 dark:accent-white"
                                    />

                                    <span className="min-w-0">
                                      <span className="block font-semibold text-slate-900 dark:text-white">
                                        {
                                          disciplina.nome
                                        }
                                      </span>

                                      <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                        {disciplina.cargaHoraria ? (
                                          <span>
                                            {
                                              disciplina.cargaHoraria
                                            }
                                            h
                                          </span>
                                        ) : null}

                                        {numeroSeguro(
                                          disciplina.valor
                                        ) >
                                        0 ? (
                                          <span>
                                            Referência:{" "}
                                            {formatarMoeda(
                                              disciplina.valor
                                            )}
                                          </span>
                                        ) : null}
                                      </span>
                                    </span>
                                  </label>
                                );
                              }
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                Dados do boleto
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Valor
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={formulario.valor}
                    onChange={(event) =>
                      atualizarCampo(
                        "valor",
                        event.target.value
                      )
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                    placeholder="550,00"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Vencimento
                  </span>

                  <input
                    type="date"
                    min={dataHojeLocal()}
                    value={
                      formulario.vencimento
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "vencimento",
                        event.target.value
                      )
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                  />
                </label>

                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Descrição da cobrança
                  </span>

                  <input
                    type="text"
                    value={
                      formulario.descricao
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "descricao",
                        event.target.value
                      )
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                    placeholder="Matrícula - Bacharel Livre em Teologia"
                  />
                </label>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Resumo
                </p>

                <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  <p>
                    Disciplinas:{" "}
                    {
                      disciplinasEscolhidas.length
                    }
                  </p>

                  <p>
                    Valor informado:{" "}
                    {formulario.valor
                      ? `R$ ${formulario.valor}`
                      : "Não informado"}
                  </p>

                  <p>
                    O login não será
                    liberado agora.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  enviando ||
                  carregandoDados
                }
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 sm:w-auto"
              >
                {enviando
                  ? "Gerando boleto…"
                  : "Gerar boleto no Asaas"}
              </button>
            </section>
          </form>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                Como funciona
              </h2>

              <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <li>
                  <strong className="text-slate-900 dark:text-white">
                    1.
                  </strong>{" "}
                  O boleto é gerado no
                  Asaas.
                </li>

                <li>
                  <strong className="text-slate-900 dark:text-white">
                    2.
                  </strong>{" "}
                  O interessado ainda não
                  recebe acesso.
                </li>

                <li>
                  <strong className="text-slate-900 dark:text-white">
                    3.
                  </strong>{" "}
                  O Asaas confirma o
                  pagamento pelo webhook.
                </li>

                <li>
                  <strong className="text-slate-900 dark:text-white">
                    4.
                  </strong>{" "}
                  O PHANYX cria ou ativa
                  aluno, matrícula e
                  usuário.
                </li>

                <li>
                  <strong className="text-slate-900 dark:text-white">
                    5.
                  </strong>{" "}
                  O aluno recebe o e-mail
                  de primeiro acesso.
                </li>
              </ol>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                  Boletos recentes
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    void carregarTudo()
                  }
                  disabled={
                    carregandoDados
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Atualizar
                </button>
              </div>

              {carregandoDados ? (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  Carregando boletos…
                </p>
              ) : boletos.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  Nenhum boleto
                  administrativo foi
                  gerado.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {boletos.map(
                    (boleto) => {
                      const url =
                        obterUrlBoleto(
                          boleto
                        );

                      return (
                        <article
                          key={boleto.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate font-bold text-slate-900 dark:text-white">
                                {
                                  boleto.nome
                                }
                              </h3>

                              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {
                                  boleto.email
                                }
                              </p>
                            </div>

                            <span
                              className={[
                                "rounded-full border px-2.5 py-1 text-[11px] font-bold",
                                classeStatus(
                                  boleto.status
                                ),
                              ].join(
                                " "
                              )}
                            >
                              {rotuloStatus(
                                boleto.status
                              )}
                            </span>
                          </div>

                          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <dt className="text-slate-500 dark:text-slate-400">
                                Valor
                              </dt>

                              <dd className="font-semibold text-slate-800 dark:text-slate-200">
                                {formatarMoeda(
                                  boleto.valorTotal
                                )}
                              </dd>
                            </div>

                            <div>
                              <dt className="text-slate-500 dark:text-slate-400">
                                Vencimento
                              </dt>

                              <dd className="font-semibold text-slate-800 dark:text-slate-200">
                                {formatarData(
                                  boleto.vencimentoEscolhido
                                )}
                              </dd>
                            </div>

                            <div className="col-span-2">
                              <dt className="text-slate-500 dark:text-slate-400">
                                Gerado em
                              </dt>

                              <dd className="font-semibold text-slate-800 dark:text-slate-200">
                                {formatarDataHora(
                                  boleto.createdAt
                                )}
                              </dd>
                            </div>
                          </dl>

                          {url && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  window.open(
                                    url,
                                    "_blank",
                                    "noopener,noreferrer"
                                  )
                                }
                                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                              >
                                Abrir
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void copiarTexto(
                                    url,
                                    "Link do boleto copiado."
                                  )
                                }
                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                Copiar link
                              </button>
                            </div>
                          )}
                        </article>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
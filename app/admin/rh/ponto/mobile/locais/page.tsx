"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type LocalPontoMobile = {
  id: number;
  nome: string;

  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  endereco?: string | null;

  latitude: number;
  longitude: number;
  raioMetros: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
};

type RespostaCep = {
  sucesso?: boolean;

  endereco?: {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    latitude: number | null;
    longitude: number | null;
    fonte: string;
  };

  coordenadasDisponiveis?: boolean;
  aviso?: string;
  error?: string;
};

type RespostaGeocodificacao = {
  sucesso?: boolean;

  localizacao?: {
    latitude: number;
    longitude: number;
    nomeExibicao: string;
    precisao: "EXATA" | "APROXIMADA";
  };

  origem?: "CACHE" | "NOMINATIM";
  atribuicao?: string;
  aviso?: string;
  error?: string;
  codigo?: string | null;
};

type Paginacao = {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
  possuiAnterior: boolean;
  possuiProxima: boolean;
};

type RespostaLocais = {
  locais?: LocalPontoMobile[];

  configuracao?: {
    raioPadraoMetros: number;
  };

  paginacao?: Paginacao;
  error?: string;
};

type ToastState = {
  tipo: "sucesso" | "erro";
  mensagem: string;
} | null;

type FiltroStatus =
  | "TODOS"
  | "ATIVOS"
  | "INATIVOS";

type FormularioLocal = {
  nome: string;

  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;

  latitude: string;
  longitude: string;

  raioMetros: string;
  ativo: boolean;
};

const formularioInicial: FormularioLocal = {
  nome: "",

  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",

  latitude: "",
  longitude: "",

  raioMetros: "150",
  ativo: true,
};

function formatarCepDigitado(valor: string) {
  const numeros = valor
    .replace(/\D/g, "")
    .slice(0, 8);

  if (numeros.length <= 5) {
    return numeros;
  }

  return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
}

export default function LocaisPontoMobilePage() {
  const [locais, setLocais] = useState<
    LocalPontoMobile[]
  >([]);

  const [paginacao, setPaginacao] =
    useState<Paginacao>({
      pagina: 1,
      limite: 20,
      total: 0,
      totalPaginas: 1,
      possuiAnterior: false,
      possuiProxima: false,
    });

  const [pagina, setPagina] = useState(1);

  const [busca, setBusca] =
    useState("");

  const [
    buscaAplicada,
    setBuscaAplicada,
  ] = useState("");

  const [
    filtroStatus,
    setFiltroStatus,
  ] = useState<FiltroStatus>("TODOS");

  const [
    raioPadraoMetros,
    setRaioPadraoMetros,
  ] = useState(150);

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [
    obtendoLocalizacao,
    setObtendoLocalizacao,
  ] = useState(false);

  const [buscandoCep, setBuscandoCep] =
  useState(false);

  const [
  confirmandoEndereco,
  setConfirmandoEndereco,
] = useState(false);

const [
  atribuicaoLocalizacao,
  setAtribuicaoLocalizacao,
] = useState("");

  const [
    processandoLocalId,
    setProcessandoLocalId,
  ] = useState<number | null>(null);

  const [toast, setToast] =
    useState<ToastState>(null);

  const [modalAberto, setModalAberto] =
    useState(false);

  const [
    localEmEdicao,
    setLocalEmEdicao,
  ] = useState<LocalPontoMobile | null>(
    null
  );

  const [formulario, setFormulario] =
    useState<FormularioLocal>(
      formularioInicial
    );

  useEffect(() => {
    carregarLocais();
  }, [
    pagina,
    buscaAplicada,
    filtroStatus,
  ]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 4000);

    return () =>
      window.clearTimeout(timer);
  }, [toast]);

  const totalAtivos = useMemo(
    () =>
      locais.filter(
        (local) => local.ativo
      ).length,
    [locais]
  );

  function mostrarToast(
    tipo: "sucesso" | "erro",
    mensagem: string
  ) {
    setToast({
      tipo,
      mensagem,
    });
  }

  async function carregarLocais() {
    try {
      setCarregando(true);

      const parametros =
        new URLSearchParams();

      parametros.set(
        "pagina",
        String(pagina)
      );

      parametros.set("limite", "20");

      if (buscaAplicada) {
        parametros.set(
          "busca",
          buscaAplicada
        );
      }

      if (filtroStatus === "ATIVOS") {
        parametros.set("ativo", "true");
      }

      if (
        filtroStatus === "INATIVOS"
      ) {
        parametros.set("ativo", "false");
      }

      const resposta = await fetch(
        `/api/admin/rh/ponto/mobile/locais?${parametros.toString()}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const dados: RespostaLocais =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.error ||
            "Não foi possível carregar os locais."
        );
      }

      setLocais(
        Array.isArray(dados.locais)
          ? dados.locais
          : []
      );

      if (dados.paginacao) {
        setPaginacao(dados.paginacao);
      }

      const raioRecebido = Number(
        dados.configuracao
          ?.raioPadraoMetros || 150
      );

      setRaioPadraoMetros(
        raioRecebido
      );
    } catch (error) {
      mostrarToast(
        "erro",
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os locais."
      );
    } finally {
      setCarregando(false);
    }
  }

  function aplicarBusca(
    evento?: FormEvent
  ) {
    evento?.preventDefault();

    setPagina(1);
    setBuscaAplicada(busca.trim());
  }

  function atualizarFormulario(
    campo: keyof FormularioLocal,
    valor: string | boolean
  ) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function atualizarCampoEndereco(
  campo:
    | "cep"
    | "logradouro"
    | "numero"
    | "complemento"
    | "bairro"
    | "cidade"
    | "estado",
  valor: string
) {
  setFormulario((anterior) => ({
    ...anterior,
    [campo]: valor,

    /*
     * Se o endereço foi alterado, as coordenadas
     * anteriores deixam de ser confiáveis.
     */
    latitude: "",
    longitude: "",
  }));

  setAtribuicaoLocalizacao("");
}

  function abrirNovoLocal() {
    setLocalEmEdicao(null);

    setFormulario({
      ...formularioInicial,
      raioMetros: String(
        raioPadraoMetros || 150
      ),
    });

    setAtribuicaoLocalizacao("");

    setModalAberto(true);
  }

  function abrirEdicao(
  local: LocalPontoMobile
) {
  setLocalEmEdicao(local);

  setFormulario({
    nome: local.nome,

    cep: local.cep || "",
    logradouro:
      local.logradouro || "",
    numero: local.numero || "",
    complemento:
      local.complemento || "",
    bairro: local.bairro || "",
    cidade: local.cidade || "",
    estado: local.estado || "",

    latitude: String(local.latitude),
    longitude: String(local.longitude),

    raioMetros: String(
      local.raioMetros
    ),

    ativo: local.ativo,
  });

  setAtribuicaoLocalizacao(
  "Localização já cadastrada para este endereço."
);

  setModalAberto(true);
}

  function fecharModal() {
    if (salvando) return;

    setModalAberto(false);
    setLocalEmEdicao(null);
  }

  async function buscarCep() {
  try {
    const cepLimpo =
      formulario.cep.replace(/\D/g, "");

    if (!/^\d{8}$/.test(cepLimpo)) {
      mostrarToast(
        "erro",
        "Informe um CEP válido com 8 números."
      );

      return;
    }

    setBuscandoCep(true);

    const resposta = await fetch(
      `/api/admin/rh/ponto/mobile/cep/${cepLimpo}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    const dados: RespostaCep =
      await resposta.json();

    if (!resposta.ok || !dados.endereco) {
      throw new Error(
        dados.error ||
          "Não foi possível localizar o CEP."
      );
    }

    const endereco = dados.endereco;

    setFormulario((anterior) => ({
      ...anterior,

      cep:
        endereco.cep ||
        formatarCepDigitado(cepLimpo),

      logradouro:
        endereco.logradouro || "",

      complemento:
        endereco.complemento ||
        anterior.complemento,

      bairro:
        endereco.bairro || "",

      cidade:
        endereco.cidade || "",

      estado:
        endereco.estado || "",

      latitude:
        typeof endereco.latitude ===
        "number"
          ? String(endereco.latitude)
          : "",

      longitude:
        typeof endereco.longitude ===
        "number"
          ? String(endereco.longitude)
          : "",
    }));

    const recebeuCoordenadas =
  typeof endereco.latitude === "number" &&
  typeof endereco.longitude === "number";

setAtribuicaoLocalizacao(
  recebeuCoordenadas
    ? "Coordenadas fornecidas automaticamente pela consulta do CEP."
    : ""
);

    mostrarToast(
      "sucesso",
      dados.aviso ||
        "Endereço localizado. Confira os dados."
    );
  } catch (error) {
    mostrarToast(
      "erro",
      error instanceof Error
        ? error.message
        : "Não foi possível localizar o CEP."
    );
  } finally {
    setBuscandoCep(false);
  }
}

async function confirmarLocalizacaoEndereco() {
  const cepLimpo =
    formulario.cep.replace(/\D/g, "");

  if (!/^\d{8}$/.test(cepLimpo)) {
    mostrarToast(
      "erro",
      "Informe e busque um CEP válido."
    );
    return;
  }

  if (
    formulario.logradouro.trim().length < 2
  ) {
    mostrarToast(
      "erro",
      "Informe o logradouro do endereço."
    );
    return;
  }

  if (!formulario.numero.trim()) {
    mostrarToast(
      "erro",
      "Informe o número do endereço ou use S/N."
    );
    return;
  }

  if (!formulario.cidade.trim()) {
    mostrarToast(
      "erro",
      "Informe a cidade do endereço."
    );
    return;
  }

  if (
    !/^[A-Za-z]{2}$/.test(
      formulario.estado.trim()
    )
  ) {
    mostrarToast(
      "erro",
      "Informe a sigla do estado com 2 letras."
    );
    return;
  }

  try {
    setConfirmandoEndereco(true);

    const resposta = await fetch(
      "/api/admin/rh/ponto/mobile/geocodificar",
      {
        method: "POST",
        credentials: "include",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          cep: cepLimpo,

          logradouro:
            formulario.logradouro,

          numero:
            formulario.numero,

          complemento:
            formulario.complemento,

          bairro:
            formulario.bairro,

          cidade:
            formulario.cidade,

          estado:
            formulario.estado
              .trim()
              .toUpperCase(),
        }),
      }
    );

    const dados: RespostaGeocodificacao =
      await resposta.json();

    if (
      !resposta.ok ||
      !dados.localizacao
    ) {
      throw new Error(
        dados.error ||
          "Não foi possível localizar este endereço."
      );
    }

    setFormulario((anterior) => ({
      ...anterior,

      latitude: String(
        dados.localizacao?.latitude
      ),

      longitude: String(
        dados.localizacao?.longitude
      ),
    }));

    setAtribuicaoLocalizacao(
      dados.atribuicao ||
        "© OpenStreetMap contributors"
    );

    mostrarToast(
      "sucesso",
      dados.aviso ||
        "Localização do endereço confirmada."
    );
  } catch (error) {
    setFormulario((anterior) => ({
      ...anterior,
      latitude: "",
      longitude: "",
    }));

    setAtribuicaoLocalizacao("");

    mostrarToast(
      "erro",
      error instanceof Error
        ? error.message
        : "Não foi possível confirmar a localização."
    );
  } finally {
    setConfirmandoEndereco(false);
  }
}

  async function usarLocalizacaoAtual() {
    try {
      setObtendoLocalizacao(true);

      if (!navigator.geolocation) {
        throw new Error(
          "Este navegador não oferece acesso à localização."
        );
      }

      const posicao =
        await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0,
              }
            );
          }
        );

      setFormulario((anterior) => ({
        ...anterior,

        latitude:
          posicao.coords.latitude.toFixed(
            7
          ),

        longitude:
          posicao.coords.longitude.toFixed(
            7
          ),
      }));

      setAtribuicaoLocalizacao(
  "Localização confirmada pelo GPS deste dispositivo."
);

      mostrarToast(
        "sucesso",
        `Localização obtida com precisão aproximada de ${Math.round(
          posicao.coords.accuracy
        )} metros.`
      );
    } catch (error: any) {
      const codigo = Number(
        error?.code
      );

      let mensagem =
        "Não foi possível obter a localização.";

      if (codigo === 1) {
        mensagem =
          "A permissão de localização foi negada pelo navegador.";
      }

      if (codigo === 2) {
        mensagem =
          "O dispositivo não conseguiu identificar a localização.";
      }

      if (codigo === 3) {
        mensagem =
          "A localização demorou muito para responder.";
      }

      mostrarToast(
        "erro",
        error instanceof Error &&
          !codigo
          ? error.message
          : mensagem
      );
    } finally {
      setObtendoLocalizacao(false);
    }
  }

  async function salvarLocal(
  evento: FormEvent
) {
  evento.preventDefault();

  const cepLimpo =
    formulario.cep.replace(/\D/g, "");

  if (formulario.nome.trim().length < 2) {
    mostrarToast(
      "erro",
      "Informe o nome do local."
    );
    return;
  }

  if (!/^\d{8}$/.test(cepLimpo)) {
    mostrarToast(
      "erro",
      "Informe um CEP válido com 8 números."
    );
    return;
  }

  if (
    formulario.logradouro.trim().length <
    2
  ) {
    mostrarToast(
      "erro",
      "Busque o CEP ou informe o logradouro."
    );
    return;
  }

  if (!formulario.numero.trim()) {
    mostrarToast(
      "erro",
      "Informe o número do endereço ou use S/N."
    );
    return;
  }

  if (!formulario.cidade.trim()) {
    mostrarToast(
      "erro",
      "Informe a cidade."
    );
    return;
  }

  if (
    !/^[A-Za-z]{2}$/.test(
      formulario.estado.trim()
    )
  ) {
    mostrarToast(
      "erro",
      "Informe a sigla do estado com 2 letras."
    );
    return;
  }

  if (
    !formulario.latitude ||
    !formulario.longitude
  ) {
    mostrarToast(
      "erro",
      "Confirme a localização do endereço ou use sua localização atual antes de salvar."
    );
    return;
  }

  const raio = Number(
    formulario.raioMetros
  );

  if (
    !Number.isInteger(raio) ||
    raio < 10 ||
    raio > 5000
  ) {
    mostrarToast(
      "erro",
      "O raio deve estar entre 10 e 5.000 metros."
    );
    return;
  }

  try {
    setSalvando(true);

    const url = localEmEdicao
      ? `/api/admin/rh/ponto/mobile/locais/${localEmEdicao.id}`
      : "/api/admin/rh/ponto/mobile/locais";

    const resposta = await fetch(url, {
      method: localEmEdicao
        ? "PUT"
        : "POST",

      credentials: "include",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        ...formulario,
        cep: cepLimpo,
        estado:
          formulario.estado
            .trim()
            .toUpperCase(),
      }),
    });

    const dados =
      await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        dados?.error ||
          "Não foi possível salvar o local."
      );
    }

    mostrarToast(
      "sucesso",
      dados?.mensagem ||
        "Local salvo com sucesso."
    );

    setModalAberto(false);
    setLocalEmEdicao(null);

    if (
      !localEmEdicao &&
      pagina !== 1
    ) {
      setPagina(1);
    } else {
      await carregarLocais();
    }
  } catch (error) {
    mostrarToast(
      "erro",
      error instanceof Error
        ? error.message
        : "Não foi possível salvar o local."
    );
  } finally {
    setSalvando(false);
  }
}

  async function alternarAtivo(
    local: LocalPontoMobile
  ) {
    try {
      setProcessandoLocalId(local.id);

      const resposta = await fetch(
        `/api/admin/rh/ponto/mobile/locais/${local.id}`,
        {
          method: "PUT",
          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

         body: JSON.stringify({
  nome: local.nome,

  cep: local.cep || "",
  logradouro:
    local.logradouro || "",
  numero: local.numero || "",
  complemento:
    local.complemento || "",
  bairro: local.bairro || "",
  cidade: local.cidade || "",
  estado: local.estado || "",

  latitude: local.latitude,
  longitude: local.longitude,

  raioMetros:
    local.raioMetros,

  ativo: !local.ativo,
}),
        }
      );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
            "Não foi possível atualizar o local."
        );
      }

      mostrarToast(
        "sucesso",
        !local.ativo
          ? "Local ativado com sucesso."
          : "Local desativado com sucesso."
      );

      await carregarLocais();
    } catch (error) {
      mostrarToast(
        "erro",
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o local."
      );
    } finally {
      setProcessandoLocalId(null);
    }
  }

  return (
    <main className="phanyx-ponto-mobile-locais-page min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {toast && (
        <div
          className={`fixed right-4 top-4 z-[120] max-w-md rounded-2xl border px-5 py-4 shadow-2xl ${
            toast.tipo === "sucesso"
              ? "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100"
              : "border-red-300 bg-red-50 text-red-950 dark:border-red-700 dark:bg-red-950 dark:text-red-100"
          }`}
        >
          <p className="text-sm font-black">
            {toast.mensagem}
          </p>
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
              RH PHANYX
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Locais autorizados
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Cadastre as sedes, polos e demais áreas onde o
              funcionário poderá registrar ponto pelo celular.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/admin/rh/ponto/mobile"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              Voltar
            </Link>

            <button
              type="button"
              onClick={abrirNovoLocal}
              className="min-h-11 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800"
            >
              Cadastrar local
            </button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <Resumo
            titulo="Total encontrado"
            valor={paginacao.total}
          />

          <Resumo
            titulo="Ativos nesta página"
            valor={totalAtivos}
          />

          <Resumo
            titulo="Raio padrão"
            valor={`${raioPadraoMetros} m`}
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <form
            onSubmit={aplicarBusca}
            className="grid gap-4 lg:grid-cols-[1fr_230px_auto]"
          >
            <div>
              <label className="mb-2 block text-sm font-black">
                Buscar local
              </label>

              <input
                value={busca}
                onChange={(evento) =>
                  setBusca(
                    evento.target.value
                  )
                }
                placeholder="Nome ou endereço"
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black">
                Situação
              </label>

              <select
                value={filtroStatus}
                onChange={(evento) => {
                  setPagina(1);

                  setFiltroStatus(
                    evento.target
                      .value as FiltroStatus
                  );
                }}
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="TODOS">
                  Todos
                </option>

                <option value="ATIVOS">
                  Ativos
                </option>

                <option value="INATIVOS">
                  Inativos
                </option>
              </select>
            </div>

            <button
              type="submit"
              className="min-h-11 self-end rounded-xl bg-slate-800 px-5 py-3 text-sm font-black text-white dark:bg-blue-700"
            >
              Buscar
            </button>
          </form>
        </section>

        {carregando ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              Carregando locais...
            </p>
          </section>
        ) : locais.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-lg font-black">
              Nenhum local encontrado
            </p>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Cadastre a primeira sede ou altere os filtros.
            </p>

            <button
              type="button"
              onClick={abrirNovoLocal}
              className="mt-5 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white"
            >
              Cadastrar local
            </button>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {locais.map((local) => (
              <article
                key={local.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black">
                      {local.nome}
                    </h2>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {local.endereco ||
                        "Endereço não informado"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-black ${
                      local.ativo
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
                        : "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                    }`}
                  >
                    {local.ativo
                      ? "Ativo"
                      : "Inativo"}
                  </span>
                </div>

                <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-950/60">
  <p>
    <strong>CEP:</strong>{" "}
    {local.cep || "Não informado"}
  </p>

  <p>
    <strong>Cidade:</strong>{" "}
    {[local.cidade, local.estado]
      .filter(Boolean)
      .join(" - ") || "Não informada"}
  </p>

  <p>
    <strong>Raio permitido:</strong>{" "}
    {local.raioMetros} metros
  </p>

  <p className="text-xs text-slate-500 dark:text-slate-400">
    Localização técnica armazenada internamente.
  </p>
</div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      abrirEdicao(local)
                    }
                    className="min-h-10 rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-xs font-black text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    disabled={
                      processandoLocalId ===
                      local.id
                    }
                    onClick={() =>
                      alternarAtivo(local)
                    }
                    className={`min-h-10 rounded-xl px-4 py-2 text-xs font-black text-white disabled:opacity-50 ${
                      local.ativo
                        ? "bg-red-700"
                        : "bg-emerald-700"
                    }`}
                  >
                    {processandoLocalId ===
                    local.id
                      ? "Processando..."
                      : local.ativo
                        ? "Desativar"
                        : "Ativar"}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={
              !paginacao.possuiAnterior ||
              carregando
            }
            onClick={() =>
              setPagina((valor) =>
                Math.max(1, valor - 1)
              )
            }
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"
          >
            Anterior
          </button>

          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Página {paginacao.pagina} de{" "}
            {paginacao.totalPaginas}
          </p>

          <button
            type="button"
            disabled={
              !paginacao.possuiProxima ||
              carregando
            }
            onClick={() =>
              setPagina((valor) =>
                valor + 1
              )
            }
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"
          >
            Próxima
          </button>
        </div>
      </div>

      {modalAberto && (
        <div className="phanyx-ponto-mobile-locais-overlay fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <form
  noValidate
  onSubmit={salvarLocal}
  className="phanyx-ponto-mobile-locais-modal max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                  Ponto Mobile
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  {localEmEdicao
                    ? "Editar local"
                    : "Cadastrar local"}
                </h2>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-xl font-black dark:border-slate-700"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-5">
  <div>
    <label className="mb-2 block text-sm font-black">
      Nome do local
    </label>

    <input
      value={formulario.nome}
      onChange={(evento) =>
        atualizarFormulario(
          "nome",
          evento.target.value
        )
      }
      placeholder="Ex.: Sede IBE"
      className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
    />
  </div>

  <div>
    <label className="mb-2 block text-sm font-black">
      CEP
    </label>

    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <input
        inputMode="numeric"
        value={formulario.cep}
        onChange={(evento) => {
  setFormulario((anterior) => ({
    ...anterior,

    cep: formatarCepDigitado(
      evento.target.value
    ),

    latitude: "",
    longitude: "",
  }));

  setAtribuicaoLocalizacao("");
}}
        placeholder="00000-000"
        maxLength={9}
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
      />

      <button
        type="button"
        disabled={buscandoCep}
        onClick={buscarCep}
        className="min-h-12 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
      >
        {buscandoCep
          ? "Buscando..."
          : "Buscar CEP"}
      </button>
    </div>
  </div>

  <div>
    <label className="mb-2 block text-sm font-black">
      Logradouro
    </label>

    <input
      value={formulario.logradouro}
      onChange={(evento) =>
  atualizarCampoEndereco(
    "logradouro",
    evento.target.value
  )
}
      placeholder="Rua, avenida ou estrada"
      className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
    />
  </div>

  <div className="grid gap-4 sm:grid-cols-2">
    <div>
      <label className="mb-2 block text-sm font-black">
        Número
      </label>

      <input
        value={formulario.numero}
        onChange={(evento) =>
  atualizarCampoEndereco(
    "numero",
    evento.target.value
  )
}
    
        placeholder="Ex.: 398 ou S/N"
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
      />
    </div>

    <div>
      <label className="mb-2 block text-sm font-black">
        Complemento
      </label>

      <input
        value={
          formulario.complemento
        }
        onChange={(evento) =>
  atualizarCampoEndereco(
    "complemento",
    evento.target.value
  )
}
        placeholder="Opcional"
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
      />
    </div>
  </div>

  <div>
    <label className="mb-2 block text-sm font-black">
      Bairro
    </label>

    <input
      value={formulario.bairro}
     onChange={(evento) =>
  atualizarCampoEndereco(
    "bairro",
    evento.target.value
  )
}
      placeholder="Bairro"
      className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
    />
  </div>

  <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
    <div>
      <label className="mb-2 block text-sm font-black">
        Cidade
      </label>

      <input
        value={formulario.cidade}
        onChange={(evento) =>
  atualizarCampoEndereco(
    "cidade",
    evento.target.value
  )
}
        placeholder="Cidade"
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
      />
    </div>

    <div>
      <label className="mb-2 block text-sm font-black">
        Estado
      </label>

      <input
        value={formulario.estado}
        maxLength={2}
        onChange={(evento) =>
  atualizarCampoEndereco(
    "estado",
    evento.target.value.toUpperCase()
  )
}
        placeholder="SP"
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 uppercase dark:border-slate-700 dark:bg-slate-950"
      />
    </div>
  </div>

<button
  type="button"
  disabled={
    confirmandoEndereco ||
    buscandoCep ||
    obtendoLocalizacao
  }
  onClick={
    confirmarLocalizacaoEndereco
  }
  className="min-h-12 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
>
  {confirmandoEndereco
    ? "Confirmando endereço..."
    : "Confirmar localização do endereço"}
</button>

  <button
    type="button"
    disabled={obtendoLocalizacao}
    onClick={usarLocalizacaoAtual}
    className="min-h-12 w-full rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 text-sm font-black text-blue-800 disabled:opacity-50 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
  >
    {obtendoLocalizacao
      ? "Obtendo localização..."
      : "Usar minha localização atual"}
  </button>

  <div
  className={`rounded-2xl border p-4 ${
    formulario.latitude &&
    formulario.longitude
      ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
      : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
  }`}
>
  <p className="text-sm font-black">
    {formulario.latitude &&
    formulario.longitude
      ? "Localização confirmada"
      : "Localização ainda não confirmada"}
  </p>

  <p className="mt-1 text-xs leading-5">
    {formulario.latitude &&
    formulario.longitude
      ? "A posição foi confirmada e ficará armazenada internamente para o cálculo do raio."
      : "Depois de preencher o número, clique em Confirmar localização do endereço. O GPS atual continua disponível como alternativa."}
  </p>

  {atribuicaoLocalizacao && (
    <p className="mt-2 text-[11px] font-bold opacity-80">
      {atribuicaoLocalizacao}
    </p>
  )}
</div>

  <div>
    <label className="mb-2 block text-sm font-black">
      Raio permitido
    </label>

    <div className="flex items-center gap-3">
      <input
        type="number"
        min={10}
        max={5000}
        step={1}
        value={formulario.raioMetros}
        onChange={(evento) =>
          atualizarFormulario(
            "raioMetros",
            evento.target.value
          )
        }
        className="min-h-12 w-40 rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
      />

      <span className="text-sm font-bold">
        metros
      </span>
    </div>
  </div>

  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-300 p-4 dark:border-slate-700">
    <input
      type="checkbox"
      checked={formulario.ativo}
      onChange={(evento) =>
        atualizarFormulario(
          "ativo",
          evento.target.checked
        )
      }
      className="h-5 w-5 accent-blue-600"
    />

    <span className="text-sm font-black">
      Local ativo
    </span>
  </label>
</div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={salvando}
                onClick={fecharModal}
                className="min-h-12 rounded-xl border border-slate-300 px-5 py-3 font-black dark:border-slate-700"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={salvando}
                className="min-h-12 rounded-xl bg-blue-700 px-5 py-3 font-black text-white disabled:opacity-50"
              >
                {salvando
                  ? "Salvando..."
                  : "Salvar local"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function Resumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number | string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
        {titulo}
      </p>

      <p className="mt-2 text-3xl font-black">
        {valor}
      </p>
    </div>
  );
}
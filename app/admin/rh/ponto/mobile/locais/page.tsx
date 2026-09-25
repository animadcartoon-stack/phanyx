"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";

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
  const t = useTranslations("AdminHRPointMobileLocations");
  const locale = useLocale();
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
          (locale === "pt-BR" && dados.error) || t("loadError")
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
        locale === "pt-BR" && error instanceof Error
          ? error.message
          : t("loadError")
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
  t("locationExisting")
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
        t("cepInvalid")
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
        (locale === "pt-BR" && dados.error) || t("cepLookupError")
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
    ? t("coordinatesFromCep")
    : ""
);

    mostrarToast(
      "sucesso",
      locale === "pt-BR" && dados.aviso ||
        (recebeuCoordenadas ? t("addressFound") : t("cepNoCoordinates"))
    );
  } catch (error) {
    mostrarToast(
      "erro",
      locale === "pt-BR" && error instanceof Error
        ? error.message
        : t("cepLookupError")
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
      t("cepSearchFirst")
    );
    return;
  }

  if (
    formulario.logradouro.trim().length < 2
  ) {
    mostrarToast(
      "erro",
      t("streetRequired")
    );
    return;
  }

  if (!formulario.numero.trim()) {
    mostrarToast(
      "erro",
      t("numberRequired")
    );
    return;
  }

  if (!formulario.cidade.trim()) {
    mostrarToast(
      "erro",
      t("cityAddressRequired")
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
      t("stateRequired")
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
        (locale === "pt-BR" && dados.error) || t("geocodeError")
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
        t("osmAttribution")
    );

    mostrarToast(
      "sucesso",
      locale === "pt-BR" && dados.aviso ||
        (dados.origem === "CACHE"
          ? t("geocodeCache")
          : dados.localizacao.precisao === "EXATA"
            ? t("geocodeExact")
            : t("geocodeApproximate"))
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
      locale === "pt-BR" && error instanceof Error
        ? error.message
        : t("geocodeError")
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
          t("browserNoLocation")
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
  t("coordinatesFromGps")
);

      mostrarToast(
        "sucesso",
        t("gpsAccuracy", { meters: Math.round(posicao.coords.accuracy) })
      );
    } catch (error: any) {
      const codigo = Number(
        error?.code
      );

      let mensagem =
        t("gpsError");

      if (codigo === 1) {
        mensagem =
          t("gpsPermissionDenied");
      }

      if (codigo === 2) {
        mensagem =
          t("gpsPositionUnavailable");
      }

      if (codigo === 3) {
        mensagem =
          t("gpsTimeout");
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
      t("nameRequired")
    );
    return;
  }

  if (!/^\d{8}$/.test(cepLimpo)) {
    mostrarToast(
      "erro",
      t("cepInvalid")
    );
    return;
  }

  if (
    formulario.logradouro.trim().length <
    2
  ) {
    mostrarToast(
      "erro",
      t("streetSearchRequired")
    );
    return;
  }

  if (!formulario.numero.trim()) {
    mostrarToast(
      "erro",
      t("numberRequired")
    );
    return;
  }

  if (!formulario.cidade.trim()) {
    mostrarToast(
      "erro",
      t("cityRequired")
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
      t("stateRequired")
    );
    return;
  }

  if (
    !formulario.latitude ||
    !formulario.longitude
  ) {
    mostrarToast(
      "erro",
      t("coordinatesRequired")
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
      t("radiusRange")
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
        (locale === "pt-BR" && dados?.error) || t("saveError")
      );
    }

    mostrarToast(
      "sucesso",
      (locale === "pt-BR" && dados?.mensagem) || t("saveSuccess")
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
      locale === "pt-BR" && error instanceof Error
        ? error.message
        : t("saveError")
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
          (locale === "pt-BR" && dados?.error) || t("updateError")
        );
      }

      mostrarToast(
        "sucesso",
        !local.ativo
          ? t("activatedSuccess")
          : t("deactivatedSuccess")
      );

      await carregarLocais();
    } catch (error) {
      mostrarToast(
        "erro",
        locale === "pt-BR" && error instanceof Error
          ? error.message
          : t("updateError")
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

            <h1 className="mt-2 text-3xl font-black">{t("title")}</h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{t("description")}</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/admin/rh/ponto/mobile"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >{t("back")}</Link>

            <button
              type="button"
              onClick={abrirNovoLocal}
              className="min-h-11 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800"
            >{t("createLocation")}</button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <Resumo
            titulo={t("totalFound")}
            valor={paginacao.total}
          />

          <Resumo
            titulo={t("activeThisPage")}
            valor={totalAtivos}
          />

          <Resumo
            titulo={t("defaultRadius")}
            valor={`${raioPadraoMetros} m`}
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <form
            onSubmit={aplicarBusca}
            className="grid gap-4 lg:grid-cols-[1fr_230px_auto]"
          >
            <div>
              <label className="mb-2 block text-sm font-black">{t("searchLocation")}</label>

              <input
                value={busca}
                onChange={(evento) =>
                  setBusca(
                    evento.target.value
                  )
                }
                placeholder={t("searchPlaceholder")}
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black">{t("status")}</label>

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
                <option value="TODOS">{t("all")}</option>

                <option value="ATIVOS">{t("activePlural")}</option>

                <option value="INATIVOS">{t("inactivePlural")}</option>
              </select>
            </div>

            <button
              type="submit"
              className="min-h-11 self-end rounded-xl bg-slate-800 px-5 py-3 text-sm font-black text-white dark:bg-blue-700"
            >{t("search")}</button>
          </form>
        </section>

        {carregando ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{t("loading")}</p>
          </section>
        ) : locais.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-lg font-black">{t("noLocations")}</p>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("emptyDescription")}</p>

            <button
              type="button"
              onClick={abrirNovoLocal}
              className="mt-5 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white"
            >{t("createLocation")}</button>
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
                        t("addressUnknown")}
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
                      ? t("active")
                      : t("inactive")}
                  </span>
                </div>

                <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-950/60">
  <p>
    <strong>{t("cepLabel")}</strong>{" "}
    {local.cep || t("notProvidedMasculine")}
  </p>

  <p>
    <strong>{t("cityLabel")}</strong>{" "}
    {[local.cidade, local.estado]
      .filter(Boolean)
      .join(" - ") || t("notProvidedFeminine")}
  </p>

  <p>
    <strong>{t("allowedRadiusLabel")}</strong>{" "}
    {local.raioMetros} metros
  </p>

  <p className="text-xs text-slate-500 dark:text-slate-400">{t("technicalLocation")}</p>
</div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      abrirEdicao(local)
                    }
                    className="min-h-10 rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-xs font-black text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
                  >{t("edit")}</button>

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
                      ? t("processing")
                      : local.ativo
                        ? t("deactivate")
                        : t("activate")}
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
          >{t("previous")}</button>

          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            {t("pagination", { page: paginacao.pagina, pages: paginacao.totalPaginas })}
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
          >{t("next")}</button>
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
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">{t("mobileTitle")}</p>

                <h2 className="mt-2 text-2xl font-black">
                  {localEmEdicao
                    ? t("editLocation")
                    : t("createLocation")}
                </h2>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-xl font-black dark:border-slate-700"
                aria-label={t("close")}
              >×</button>
            </div>

            <div className="mt-6 space-y-5">
  <div>
    <label className="mb-2 block text-sm font-black">{t("locationName")}</label>

    <input
      value={formulario.nome}
      onChange={(evento) =>
        atualizarFormulario(
          "nome",
          evento.target.value
        )
      }
      placeholder={t("namePlaceholder")}
      className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
    />
  </div>

  <div>
    <label className="mb-2 block text-sm font-black">{t("cepField")}</label>

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
          ? t("searching")
          : t("searchCep")}
      </button>
    </div>
  </div>

  <div>
    <label className="mb-2 block text-sm font-black">{t("street")}</label>

    <input
      value={formulario.logradouro}
      onChange={(evento) =>
  atualizarCampoEndereco(
    "logradouro",
    evento.target.value
  )
}
      placeholder={t("streetPlaceholder")}
      className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
    />
  </div>

  <div className="grid gap-4 sm:grid-cols-2">
    <div>
      <label className="mb-2 block text-sm font-black">{t("number")}</label>

      <input
        value={formulario.numero}
        onChange={(evento) =>
  atualizarCampoEndereco(
    "numero",
    evento.target.value
  )
}

        placeholder={t("numberPlaceholder")}
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
      />
    </div>

    <div>
      <label className="mb-2 block text-sm font-black">{t("complement")}</label>

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
        placeholder={t("optional")}
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
      />
    </div>
  </div>

  <div>
    <label className="mb-2 block text-sm font-black">{t("district")}</label>

    <input
      value={formulario.bairro}
     onChange={(evento) =>
  atualizarCampoEndereco(
    "bairro",
    evento.target.value
  )
}
      placeholder={t("district")}
      className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
    />
  </div>

  <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
    <div>
      <label className="mb-2 block text-sm font-black">{t("city")}</label>

      <input
        value={formulario.cidade}
        onChange={(evento) =>
  atualizarCampoEndereco(
    "cidade",
    evento.target.value
  )
}
        placeholder={t("city")}
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
      />
    </div>

    <div>
      <label className="mb-2 block text-sm font-black">{t("state")}</label>

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
    ? t("confirmingAddress")
    : t("confirmAddress")}
</button>

  <button
    type="button"
    disabled={obtendoLocalizacao}
    onClick={usarLocalizacaoAtual}
    className="min-h-12 w-full rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 text-sm font-black text-blue-800 disabled:opacity-50 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
  >
    {obtendoLocalizacao
      ? t("gettingLocation")
      : t("useCurrentLocation")}
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
      ? t("locationConfirmed")
      : t("locationNotConfirmed")}
  </p>

  <p className="mt-1 text-xs leading-5">
    {formulario.latitude &&
    formulario.longitude
      ? t("locationSavedInternally")
      : t("confirmGuidance")}
  </p>

  {atribuicaoLocalizacao && (
    <p className="mt-2 text-[11px] font-bold opacity-80">
      {atribuicaoLocalizacao}
    </p>
  )}
</div>

  <div>
    <label className="mb-2 block text-sm font-black">{t("allowedRadius")}</label>

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

      <span className="text-sm font-bold">{t("meters")}</span>
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

    <span className="text-sm font-black">{t("activeLocation")}</span>
  </label>
</div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={salvando}
                onClick={fecharModal}
                className="min-h-12 rounded-xl border border-slate-300 px-5 py-3 font-black dark:border-slate-700"
              >{t("cancel")}</button>

              <button
                type="submit"
                disabled={salvando}
                className="min-h-12 rounded-xl bg-blue-700 px-5 py-3 font-black text-white disabled:opacity-50"
              >
                {salvando
                  ? t("saving")
                  : t("saveLocation")}
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

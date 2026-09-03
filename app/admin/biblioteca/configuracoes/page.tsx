"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type ConfiguracaoApi = {
  id: number | null;

  nomeExibicao: string;
  descricao: string | null;

  permitirDownload: boolean;
  permitirAvaliacao: boolean;
  permitirFavoritos: boolean;
  permitirReserva: boolean;
  permitirRenovacao: boolean;
  permitirSugestaoAquisicao: boolean;

  diasEmprestimoPadrao: number;
  diasReservaPadrao: number;
  limiteRenovacoes: number;
  limiteEmprestimos: number;

  notificarVencimento: boolean;
  diasAvisoAntesVencimento: number;
  bloquearAlunoComPendencia: boolean;

  cobrarMultaPorAtraso: boolean;
  valorMultaPorDia: string;
  diasCarenciaAtraso: number;
  limiteMultaPorAtraso: string | null;
  diasVencimentoCobranca: number;

  atualizadoEm: string | null;
};

type RespostaConfiguracao = {
  success?: boolean;
  message?: string;
  error?: string;
  code?: string;
  configuracao?: ConfiguracaoApi;
};

type FormularioConfiguracao = {
  nomeExibicao: string;
  descricao: string;

  permitirDownload: boolean;
  permitirAvaliacao: boolean;
  permitirFavoritos: boolean;
  permitirReserva: boolean;
  permitirRenovacao: boolean;
  permitirSugestaoAquisicao: boolean;

  diasEmprestimoPadrao: number;
  diasReservaPadrao: number;
  limiteRenovacoes: number;
  limiteEmprestimos: number;

  notificarVencimento: boolean;
  diasAvisoAntesVencimento: number;
  bloquearAlunoComPendencia: boolean;

  cobrarMultaPorAtraso: boolean;
  valorMultaPorDia: string;
  diasCarenciaAtraso: number;
  limiteMultaPorAtraso: string;
  diasVencimentoCobranca: number;
};

type Toast = {
  tipo: "sucesso" | "erro";
  mensagem: string;
};

const FORMULARIO_INICIAL: FormularioConfiguracao = {
  nomeExibicao: "Biblioteca Virtual",
  descricao: "",

  permitirDownload: false,
  permitirAvaliacao: true,
  permitirFavoritos: true,
  permitirReserva: true,
  permitirRenovacao: true,
  permitirSugestaoAquisicao: true,

  diasEmprestimoPadrao: 7,
  diasReservaPadrao: 2,
  limiteRenovacoes: 1,
  limiteEmprestimos: 3,

  notificarVencimento: true,
  diasAvisoAntesVencimento: 2,
  bloquearAlunoComPendencia: false,

  cobrarMultaPorAtraso: false,
  valorMultaPorDia: "0.00",
  diasCarenciaAtraso: 0,
  limiteMultaPorAtraso: "",
  diasVencimentoCobranca: 7,
};

function paraFormulario(
  configuracao: ConfiguracaoApi
): FormularioConfiguracao {
  return {
    nomeExibicao:
      configuracao.nomeExibicao,

    descricao:
      configuracao.descricao ?? "",

    permitirDownload:
      configuracao.permitirDownload,

    permitirAvaliacao:
      configuracao.permitirAvaliacao,

    permitirFavoritos:
      configuracao.permitirFavoritos,

    permitirReserva:
      configuracao.permitirReserva,

    permitirRenovacao:
      configuracao.permitirRenovacao,

    permitirSugestaoAquisicao:
      configuracao.permitirSugestaoAquisicao,

    diasEmprestimoPadrao:
      configuracao.diasEmprestimoPadrao,

    diasReservaPadrao:
      configuracao.diasReservaPadrao,

    limiteRenovacoes:
      configuracao.limiteRenovacoes,

    limiteEmprestimos:
      configuracao.limiteEmprestimos,

    notificarVencimento:
      configuracao.notificarVencimento,

    diasAvisoAntesVencimento:
      configuracao.diasAvisoAntesVencimento,

    bloquearAlunoComPendencia:
      configuracao.bloquearAlunoComPendencia,

    cobrarMultaPorAtraso:
      configuracao.cobrarMultaPorAtraso,

    valorMultaPorDia:
      configuracao.valorMultaPorDia,

    diasCarenciaAtraso:
      configuracao.diasCarenciaAtraso,

    limiteMultaPorAtraso:
      configuracao.limiteMultaPorAtraso ?? "",

    diasVencimentoCobranca:
      configuracao.diasVencimentoCobranca,
  };
}

async function lerJsonSeguro<T>(
  resposta: Response
): Promise<T> {
  const tipo =
    resposta.headers.get(
      "content-type"
    ) || "";

  if (
    !tipo.includes(
      "application/json"
    )
  ) {
    throw new Error(
      "INVALID_API_RESPONSE"
    );
  }

  return resposta.json() as Promise<T>;
}

function numeroDecimal(
  valor: string
) {
  return Number(
    valor
      .trim()
      .replace(",", ".")
  );
}

type ToggleProps = {
  checked: boolean;
  disabled?: boolean;
  titulo: string;
  descricao: string;
  onChange: (
    checked: boolean
  ) => void;
};

function Toggle({
  checked,
  disabled = false,
  titulo,
  descricao,
  onChange,
}: ToggleProps) {
  return (
    <label
      className={[
        "flex cursor-pointer gap-4 rounded-2xl border p-4 transition",
        "border-slate-200 bg-white",
        "dark:border-slate-800 dark:bg-slate-950",
        checked
          ? "ring-2 ring-indigo-500/20"
          : "",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:border-slate-300 dark:hover:border-slate-700",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(evento) =>
          onChange(
            evento.target.checked
          )
        }
        className="mt-1 h-5 w-5 shrink-0 accent-indigo-600"
      />

      <span className="min-w-0">
        <span className="block text-sm font-black !text-slate-950 dark:!text-white">
          {titulo}
        </span>

        <span className="mt-1 block text-sm leading-6 !text-slate-600 dark:!text-slate-300">
          {descricao}
        </span>
      </span>
    </label>
  );
}

type CampoNumeroProps = {
  label: string;
  descricao?: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (
    value: number
  ) => void;
};

function CampoNumero({
  label,
  descricao,
  value,
  min,
  max,
  disabled = false,
  onChange,
}: CampoNumeroProps) {
  return (
    <label className="block">
      <span className="text-sm font-black !text-slate-800 dark:!text-slate-100">
        {label}
      </span>

      {descricao ? (
        <span className="mt-1 block text-xs leading-5 !text-slate-500 dark:!text-slate-400">
          {descricao}
        </span>
      ) : null}

      <input
        type="number"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(evento) => {
          const numero =
            Number(
              evento.target.value
            );

          if (
            Number.isFinite(numero)
          ) {
            onChange(numero);
          }
        }}
        className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
      />
    </label>
  );
}

export default function BibliotecaConfiguracoesPage() {
  const t =
    useTranslations(
      "AdminLibrarySettings"
    );

  const locale =
    useLocale();

  const [
    formulario,
    setFormulario,
  ] =
    useState<FormularioConfiguracao>(
      FORMULARIO_INICIAL
    );

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    toast,
    setToast,
  ] =
    useState<Toast | null>(
      null
    );

  const [
    atualizadoEm,
    setAtualizadoEm,
  ] =
    useState<string | null>(
      null
    );

  const [
    snapshot,
    setSnapshot,
  ] = useState("");

  const carregar =
    useCallback(
      async () => {
        setCarregando(true);
        setErro("");

        try {
          const resposta =
            await fetch(
              "/api/admin/biblioteca/configuracoes",
              {
                method: "GET",
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            );

          const dados =
            await lerJsonSeguro<RespostaConfiguracao>(
              resposta
            );

          if (
            !resposta.ok ||
            !dados.configuracao
          ) {
            throw new Error(
              dados.code ||
              "LOAD_FAILED"
            );
          }

          const novoFormulario =
            paraFormulario(
              dados.configuracao
            );

          setFormulario(
            novoFormulario
          );

          setSnapshot(
            JSON.stringify(
              novoFormulario
            )
          );

          setAtualizadoEm(
            dados.configuracao
              .atualizadoEm
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
      },
      [t]
    );

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const temporizador =
      window.setTimeout(
        () =>
          setToast(null),
        4500
      );

    return () =>
      window.clearTimeout(
        temporizador
      );
  }, [toast]);

  const alterado =
    useMemo(
      () =>
        snapshot !== "" &&
        JSON.stringify(
          formulario
        ) !== snapshot,
      [
        formulario,
        snapshot,
      ]
    );

  function atualizar<
    K extends keyof FormularioConfiguracao
  >(
    campo: K,
    valor: FormularioConfiguracao[K]
  ) {
    setFormulario(
      (atual) => ({
        ...atual,
        [campo]: valor,
      })
    );
  }

  function validar() {
    if (
      !formulario
        .nomeExibicao
        .trim()
    ) {
      return t(
        "validation.nameRequired"
      );
    }

    if (
      formulario
        .cobrarMultaPorAtraso
    ) {
      const valor =
        numeroDecimal(
          formulario
            .valorMultaPorDia
        );

      if (
        !Number.isFinite(
          valor
        ) ||
        valor <= 0
      ) {
        return t(
          "validation.dailyFineRequired"
        );
      }

      if (
        formulario
          .limiteMultaPorAtraso
          .trim()
      ) {
        const limite =
          numeroDecimal(
            formulario
              .limiteMultaPorAtraso
          );

        if (
          !Number.isFinite(
            limite
          ) ||
          limite < valor
        ) {
          return t(
            "validation.fineLimitInvalid"
          );
        }
      }
    }

    return null;
  }

  async function salvar(
    evento: FormEvent
  ) {
    evento.preventDefault();

    const falhaValidacao =
      validar();

    if (falhaValidacao) {
      setToast({
        tipo: "erro",
        mensagem:
          falhaValidacao,
      });

      return;
    }

    setSalvando(true);

    try {
      const resposta =
        await fetch(
          "/api/admin/biblioteca/configuracoes",
          {
            method: "PUT",
            credentials:
              "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                ...formulario,

                descricao:
                  formulario
                    .descricao
                    .trim() ||
                  null,

                limiteMultaPorAtraso:
                  formulario
                    .limiteMultaPorAtraso
                    .trim() ||
                  null,
              }),
          }
        );

      const dados =
        await lerJsonSeguro<RespostaConfiguracao>(
          resposta
        );

      if (
        !resposta.ok ||
        !dados.configuracao
      ) {
        throw new Error(
          dados.code ||
          "SAVE_FAILED"
        );
      }

      const novoFormulario =
        paraFormulario(
          dados.configuracao
        );

      setFormulario(
        novoFormulario
      );

      setSnapshot(
        JSON.stringify(
          novoFormulario
        )
      );

      setAtualizadoEm(
        dados.configuracao
          .atualizadoEm
      );

      setToast({
        tipo: "sucesso",
        mensagem:
          t(
            "success.saved"
          ),
      });
    } catch {
      setToast({
        tipo: "erro",
        mensagem:
          t(
            "errors.save"
          ),
      });
    } finally {
      setSalvando(false);
    }
  }

  const ultimaAtualizacao =
    useMemo(() => {
      if (!atualizadoEm) {
        return null;
      }

      const data =
        new Date(
          atualizadoEm
        );

      if (
        Number.isNaN(
          data.getTime()
        )
      ) {
        return null;
      }

      return new Intl.DateTimeFormat(
        locale,
        {
          dateStyle:
            "medium",
          timeStyle:
            "short",
        }
      ).format(data);
    }, [
      atualizadoEm,
      locale,
    ]);

  return (
    <main className="bib-settings-page min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-6 sm:p-8 dark:from-indigo-950/40 dark:via-slate-900 dark:to-sky-950/30">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.2em] !text-indigo-700 dark:!text-indigo-300">
                  {t(
                    "eyebrow"
                  )}
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                  {t(
                    "title"
                  )}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-300">
                  {t(
                    "description"
                  )}
                </p>

                {ultimaAtualizacao ? (
                  <p className="mt-3 text-xs font-semibold !text-slate-500 dark:!text-slate-400">
                    {t(
                      "lastUpdated",
                      {
                        date:
                          ultimaAtualizacao,
                      }
                    )}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/admin/biblioteca"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black !text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:!text-white dark:hover:bg-slate-800"
                >
                  {t(
                    "backToDashboard"
                  )}
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    void carregar()
                  }
                  disabled={
                    carregando ||
                    salvando
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-800 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200 dark:hover:bg-indigo-950"
                >
                  {t(
                    "reload"
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {erro ? (
          <section className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-5 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
            <h2 className="font-black">
              {t(
                "errors.title"
              )}
            </h2>

            <p className="mt-1 text-sm">
              {erro}
            </p>

            <button
              type="button"
              onClick={() =>
                void carregar()
              }
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-red-700 px-4 py-2 text-sm font-black text-white hover:bg-red-800"
            >
              {t(
                "retry"
              )}
            </button>
          </section>
        ) : carregando ? (
          <div className="mt-6 space-y-5">
            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="h-52 animate-pulse rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                />
              )
            )}
          </div>
        ) : (
          <form
            onSubmit={salvar}
            className="mt-6 space-y-6"
          >
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] !text-indigo-700 dark:!text-indigo-300">
                  {t(
                    "identity.eyebrow"
                  )}
                </p>

                <h2 className="mt-1 text-xl font-black !text-slate-950 dark:!text-white">
                  {t(
                    "identity.title"
                  )}
                </h2>

                <p className="mt-1 text-sm leading-6 !text-slate-600 dark:!text-slate-300">
                  {t(
                    "identity.description"
                  )}
                </p>
              </div>

              <div className="mt-5 grid gap-5">
                <label className="block">
                  <span className="text-sm font-black !text-slate-800 dark:!text-slate-100">
                    {t(
                      "identity.name"
                    )}
                  </span>

                  <input
                    type="text"
                    required
                    maxLength={150}
                    value={
                      formulario
                        .nomeExibicao
                    }
                    onChange={(
                      evento
                    ) =>
                      atualizar(
                        "nomeExibicao",
                        evento
                          .target
                          .value
                      )
                    }
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-black !text-slate-800 dark:!text-slate-100">
                    {t(
                      "identity.libraryDescription"
                    )}
                  </span>

                  <textarea
                    maxLength={3000}
                    rows={4}
                    value={
                      formulario
                        .descricao
                    }
                    onChange={(
                      evento
                    ) =>
                      atualizar(
                        "descricao",
                        evento
                          .target
                          .value
                      )
                    }
                    placeholder={t(
                      "identity.descriptionPlaceholder"
                    )}
                    className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-black !text-slate-950 dark:!text-white">
                {t(
                  "features.title"
                )}
              </h2>

              <p className="mt-1 text-sm leading-6 !text-slate-600 dark:!text-slate-300">
                {t(
                  "features.description"
                )}
              </p>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <Toggle
                  checked={
                    formulario
                      .permitirDownload
                  }
                  titulo={t(
                    "features.download.title"
                  )}
                  descricao={t(
                    "features.download.description"
                  )}
                  onChange={(
                    valor
                  ) =>
                    atualizar(
                      "permitirDownload",
                      valor
                    )
                  }
                />

                <Toggle
                  checked={
                    formulario
                      .permitirAvaliacao
                  }
                  titulo={t(
                    "features.reviews.title"
                  )}
                  descricao={t(
                    "features.reviews.description"
                  )}
                  onChange={(
                    valor
                  ) =>
                    atualizar(
                      "permitirAvaliacao",
                      valor
                    )
                  }
                />

                <Toggle
                  checked={
                    formulario
                      .permitirFavoritos
                  }
                  titulo={t(
                    "features.favorites.title"
                  )}
                  descricao={t(
                    "features.favorites.description"
                  )}
                  onChange={(
                    valor
                  ) =>
                    atualizar(
                      "permitirFavoritos",
                      valor
                    )
                  }
                />

                <Toggle
                  checked={
                    formulario
                      .permitirReserva
                  }
                  titulo={t(
                    "features.reservations.title"
                  )}
                  descricao={t(
                    "features.reservations.description"
                  )}
                  onChange={(
                    valor
                  ) =>
                    atualizar(
                      "permitirReserva",
                      valor
                    )
                  }
                />

                <Toggle
                  checked={
                    formulario
                      .permitirRenovacao
                  }
                  titulo={t(
                    "features.renewals.title"
                  )}
                  descricao={t(
                    "features.renewals.description"
                  )}
                  onChange={(
                    valor
                  ) =>
                    atualizar(
                      "permitirRenovacao",
                      valor
                    )
                  }
                />

                <Toggle
                  checked={
                    formulario
                      .permitirSugestaoAquisicao
                  }
                  titulo={t(
                    "features.suggestions.title"
                  )}
                  descricao={t(
                    "features.suggestions.description"
                  )}
                  onChange={(
                    valor
                  ) =>
                    atualizar(
                      "permitirSugestaoAquisicao",
                      valor
                    )
                  }
                />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-black !text-slate-950 dark:!text-white">
                {t(
                  "circulation.title"
                )}
              </h2>

              <p className="mt-1 text-sm leading-6 !text-slate-600 dark:!text-slate-300">
                {t(
                  "circulation.description"
                )}
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <CampoNumero
                  label={t(
                    "circulation.loanDays"
                  )}
                  descricao={t(
                    "circulation.loanDaysHelp"
                  )}
                  value={
                    formulario
                      .diasEmprestimoPadrao
                  }
                  min={1}
                  max={365}
                  onChange={(
                    valor
                  ) =>
                    atualizar(
                      "diasEmprestimoPadrao",
                      valor
                    )
                  }
                />

                <CampoNumero
                  label={t(
                    "circulation.reservationDays"
                  )}
                  descricao={t(
                    "circulation.reservationDaysHelp"
                  )}
                  value={
                    formulario
                      .diasReservaPadrao
                  }
                  min={0}
                  max={365}
                  disabled={
                    !formulario
                      .permitirReserva
                  }
                  onChange={(
                    valor
                  ) =>
                    atualizar(
                      "diasReservaPadrao",
                      valor
                    )
                  }
                />

                <CampoNumero
                  label={t(
                    "circulation.renewalLimit"
                  )}
                  descricao={t(
                    "circulation.renewalLimitHelp"
                  )}
                  value={
                    formulario
                      .limiteRenovacoes
                  }
                  min={0}
                  max={50}
                  disabled={
                    !formulario
                      .permitirRenovacao
                  }
                  onChange={(
                    valor
                  ) =>
                    atualizar(
                      "limiteRenovacoes",
                      valor
                    )
                  }
                />

                <CampoNumero
                  label={t(
                    "circulation.loanLimit"
                  )}
                  descricao={t(
                    "circulation.loanLimitHelp"
                  )}
                  value={
                    formulario
                      .limiteEmprestimos
                  }
                  min={1}
                  max={100}
                  onChange={(
                    valor
                  ) =>
                    atualizar(
                      "limiteEmprestimos",
                      valor
                    )
                  }
                />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-black !text-slate-950 dark:!text-white">
                {t(
                  "notifications.title"
                )}
              </h2>

              <p className="mt-1 text-sm leading-6 !text-slate-600 dark:!text-slate-300">
                {t(
                  "notifications.description"
                )}
              </p>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <Toggle
                  checked={
                    formulario
                      .notificarVencimento
                  }
                  titulo={t(
                    "notifications.dueNotice.title"
                  )}
                  descricao={t(
                    "notifications.dueNotice.description"
                  )}
                  onChange={(
                    valor
                  ) =>
                    atualizar(
                      "notificarVencimento",
                      valor
                    )
                  }
                />

                <Toggle
                  checked={
                    formulario
                      .bloquearAlunoComPendencia
                  }
                  titulo={t(
                    "notifications.blockPending.title"
                  )}
                  descricao={t(
                    "notifications.blockPending.description"
                  )}
                  onChange={(
                    valor
                  ) =>
                    atualizar(
                      "bloquearAlunoComPendencia",
                      valor
                    )
                  }
                />
              </div>

              <div className="mt-5 max-w-sm">
                <CampoNumero
                  label={t(
                    "notifications.noticeDays"
                  )}
                  descricao={t(
                    "notifications.noticeDaysHelp"
                  )}
                  value={
                    formulario
                      .diasAvisoAntesVencimento
                  }
                  min={0}
                  max={365}
                  disabled={
                    !formulario
                      .notificarVencimento
                  }
                  onChange={(
                    valor
                  ) =>
                    atualizar(
                      "diasAvisoAntesVencimento",
                      valor
                    )
                  }
                />
              </div>
            </section>

            <section className="bib-settings-fines rounded-3xl border !border-amber-200 !bg-amber-50 p-5 shadow-sm sm:p-6 dark:!border-amber-900 dark:!bg-slate-900">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] !text-amber-700 dark:!text-amber-300">
                  {t(
                    "fines.eyebrow"
                  )}
                </p>

                <h2 className="mt-1 text-xl font-black !text-slate-950 dark:!text-white">
                  {t(
                    "fines.title"
                  )}
                </h2>

                <p className="mt-1 max-w-3xl text-sm leading-6 !text-slate-600 dark:!text-slate-300">
                  {t(
                    "fines.description"
                  )}
                </p>
              </div>

              <div className="mt-5">
                <Toggle
                  checked={
                    formulario
                      .cobrarMultaPorAtraso
                  }
                  titulo={t(
                    "fines.enable.title"
                  )}
                  descricao={t(
                    "fines.enable.description"
                  )}
                  onChange={(
                    valor
                  ) =>
                    atualizar(
                      "cobrarMultaPorAtraso",
                      valor
                    )
                  }
                />
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block">
                  <span className="text-sm font-black !text-slate-800 dark:!text-slate-100">
                    {t(
                      "fines.dailyValue"
                    )}
                  </span>

                  <span className="mt-1 block text-xs leading-5 !text-slate-500 dark:!text-slate-400">
                    {t(
                      "fines.dailyValueHelp"
                    )}
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={
                      !formulario
                        .cobrarMultaPorAtraso
                    }
                    value={
                      formulario
                        .valorMultaPorDia
                    }
                    onChange={(
                      evento
                    ) =>
                      atualizar(
                        "valorMultaPorDia",
                        evento
                          .target
                          .value
                      )
                    }
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:disabled:bg-slate-900"
                  />
                </label>

                <CampoNumero
                  label={t(
                    "fines.graceDays"
                  )}
                  descricao={t(
                    "fines.graceDaysHelp"
                  )}
                  value={
                    formulario
                      .diasCarenciaAtraso
                  }
                  min={0}
                  max={365}
                  disabled={
                    !formulario
                      .cobrarMultaPorAtraso
                  }
                  onChange={(
                    valor
                  ) =>
                    atualizar(
                      "diasCarenciaAtraso",
                      valor
                    )
                  }
                />

                <label className="block">
                  <span className="text-sm font-black !text-slate-800 dark:!text-slate-100">
                    {t(
                      "fines.maximumValue"
                    )}
                  </span>

                  <span className="mt-1 block text-xs leading-5 !text-slate-500 dark:!text-slate-400">
                    {t(
                      "fines.maximumValueHelp"
                    )}
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={
                      !formulario
                        .cobrarMultaPorAtraso
                    }
                    value={
                      formulario
                        .limiteMultaPorAtraso
                    }
                    placeholder={t(
                      "fines.noMaximum"
                    )}
                    onChange={(
                      evento
                    ) =>
                      atualizar(
                        "limiteMultaPorAtraso",
                        evento
                          .target
                          .value
                      )
                    }
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:disabled:bg-slate-900"
                  />
                </label>

                <CampoNumero
                  label={t(
                    "fines.chargeDueDays"
                  )}
                  descricao={t(
                    "fines.chargeDueDaysHelp"
                  )}
                  value={
                    formulario
                      .diasVencimentoCobranca
                  }
                  min={0}
                  max={365}
                  disabled={
                    !formulario
                      .cobrarMultaPorAtraso
                  }
                  onChange={(
                    valor
                  ) =>
                    atualizar(
                      "diasVencimentoCobranca",
                      valor
                    )
                  }
                />
              </div>

              {formulario
                .cobrarMultaPorAtraso ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-100/60 p-4 text-sm leading-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
                  <strong>
                    {t(
                      "fines.attentionTitle"
                    )}
                  </strong>{" "}
                  {t(
                    "fines.attentionDescription"
                  )}
                </div>
              ) : null}
            </section>

            <section className="sticky bottom-4 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black !text-slate-950 dark:!text-white">
                    {alterado
                      ? t(
                        "actions.unsaved"
                      )
                      : t(
                        "actions.saved"
                      )}
                  </p>

                  <p className="mt-1 text-xs !text-slate-500 dark:!text-slate-400">
                    {t(
                      "actions.description"
                    )}
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={
                      !alterado ||
                      salvando
                    }
                    onClick={() => {
                      if (
                        !snapshot
                      ) {
                        return;
                      }

                      setFormulario(
                        JSON.parse(
                          snapshot
                        ) as FormularioConfiguracao
                      );
                    }}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-black text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
                  >
                    {t(
                      "actions.discard"
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={
                      !alterado ||
                      salvando
                    }
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-700 px-6 py-2 text-sm font-black !text-white [-webkit-text-fill-color:#fff] transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"                  >
                    {salvando
                      ? t(
                        "actions.saving"
                      )
                      : t(
                        "actions.save"
                      )}
                  </button>
                </div>
              </div>
            </section>
          </form>
        )}
      </div>

      {toast ? (
        <div
          role="status"
          className={[
            "fixed bottom-5 right-5 z-50 flex max-w-md items-start gap-4 rounded-2xl border px-5 py-4 shadow-2xl",
            toast.tipo ===
              "sucesso"
              ? "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
              : "border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
          ].join(" ")}
        >
          <p className="text-sm font-bold">
            {toast.mensagem}
          </p>

          <button
            type="button"
            onClick={() =>
              setToast(null)
            }
            aria-label={t(
              "toast.close"
            )}
            className="ml-auto text-lg font-black opacity-70 hover:opacity-100"
          >
            Ãƒâ€”
          </button>
        </div>
      ) : null}
    </main>
  );
}
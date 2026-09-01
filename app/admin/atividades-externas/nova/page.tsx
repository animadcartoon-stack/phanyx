"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Polo = {
  id: number;
  nome: string;
  codigo?: string | null;
};

type Turma = {
  id: number;
  nome: string;
  codigo?: string | null;
  periodoLetivo?: string | null;
  turno?: string | null;
  poloId?: number | null;
  polo?: {
    id: number;
    nome: string;
  } | null;
};

type Responsavel = {
  id: number;
  nome: string;
  email?: string | null;
  role?: string | null;
};

type RespostaOpcoes = {
  ok?: boolean;
  acessoTodosPolos?: boolean;
  usuarioAtualId?: number;
  polos?: Polo[];
  turmas?: Turma[];
  responsaveis?: Responsavel[];
  error?: string;
};

const TIPOS = [
  "EXCURSAO",
  "VISITA_TECNICA",
  "VIAGEM_PEDAGOGICA",
  "ACAMPAMENTO",
  "RETIRO",
  "COMPETICAO",
  "INTERCAMBIO",
  "EVENTO_ESPORTIVO",
  "ATIVIDADE_COMUNITARIA",
  "VIAGEM_INTERNACIONAL",
  "OUTRA",
] as const;

function datetimeLocalParaIso(valor: string) {
  if (!valor) return null;

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data.toISOString();
}

export default function NovaAtividadeExternaPage() {
  const t = useTranslations("AdminExternalActivityNew");
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [acessoTodosPolos, setAcessoTodosPolos] = useState(true);
  const [polos, setPolos] = useState<Polo[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("");

  const [descricao, setDescricao] = useState("");
  const [objetivoPedagogico, setObjetivoPedagogico] = useState("");

  const [curricular, setCurricular] = useState(false);
  const [obrigatoria, setObrigatoria] = useState(false);
  const [internacional, setInternacional] = useState(false);

  const [destinoNome, setDestinoNome] = useState("");
  const [enderecoDestino, setEnderecoDestino] = useState("");
  const [cidadeDestino, setCidadeDestino] = useState("");
  const [regiaoDestino, setRegiaoDestino] = useState("");
  const [paisDestino, setPaisDestino] = useState("");

  const [fusoHorario, setFusoHorario] = useState("");

  const [saidaEm, setSaidaEm] = useState("");
  const [retornoPrevistoEm, setRetornoPrevistoEm] = useState("");

  const [poloId, setPoloId] = useState("");
  const [responsavelPrincipalUserId, setResponsavelPrincipalUserId] =
    useState("");

  const [turmaIds, setTurmaIds] = useState<number[]>([]);
  const [buscaTurma, setBuscaTurma] = useState("");

  const [capacidadeMaxima, setCapacidadeMaxima] = useState("");

  const [exigeAutorizacaoResponsavel, setExigeAutorizacaoResponsavel] =
    useState(true);

  const [exigePagamento, setExigePagamento] = useState(false);

  const [valorParticipante, setValorParticipante] = useState("");
  const [moeda, setMoeda] = useState("");

  const [exigeCheckin, setExigeCheckin] = useState(true);

  const turmasFiltradas = useMemo(() => {
    const busca = buscaTurma.trim().toLocaleLowerCase();

    if (!busca) {
      return turmas;
    }

    return turmas.filter((turma) => {
      const texto = [
        turma.nome,
        turma.codigo,
        turma.periodoLetivo,
        turma.turno,
        turma.polo?.nome,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();

      return texto.includes(busca);
    });
  }, [buscaTurma, turmas]);

  useEffect(() => {
    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (timezone) {
      setFusoHorario(timezone);
    }

    async function carregarOpcoes() {
      try {
        setCarregando(true);
        setErro("");

        const resposta = await fetch(
          "/api/admin/atividades-externas/opcoes",
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const dados: RespostaOpcoes = await resposta.json();

        if (!resposta.ok) {
          throw new Error(t("errors.loadOptions"));
        }

        const polosRecebidos = Array.isArray(dados.polos)
          ? dados.polos
          : [];

        const responsaveisRecebidos = Array.isArray(dados.responsaveis)
          ? dados.responsaveis
          : [];

        setAcessoTodosPolos(dados.acessoTodosPolos !== false);
        setPolos(polosRecebidos);
        setTurmas(Array.isArray(dados.turmas) ? dados.turmas : []);
        setResponsaveis(responsaveisRecebidos);

        if (
          dados.acessoTodosPolos === false &&
          polosRecebidos.length === 1
        ) {
          setPoloId(String(polosRecebidos[0].id));
        }

        if (dados.usuarioAtualId) {
          const existeAtual = responsaveisRecebidos.some(
            (item) => item.id === dados.usuarioAtualId
          );

          if (existeAtual) {
            setResponsavelPrincipalUserId(
              String(dados.usuarioAtualId)
            );
          }
        }
      } catch (e: unknown) {
        setErro(
          e instanceof Error
            ? e.message
            : t("errors.loadOptions")
        );
      } finally {
        setCarregando(false);
      }
    }

    void carregarOpcoes();
  }, [t]);

  function alternarTurma(id: number) {
    setTurmaIds((atuais) =>
      atuais.includes(id)
        ? atuais.filter((item) => item !== id)
        : [...atuais, id]
    );
  }

  function validar() {
    if (!titulo.trim()) {
      return t("errors.titleRequired");
    }

    if (!tipo) {
      return t("errors.typeRequired");
    }

    if (!acessoTodosPolos && !poloId) {
      return t("errors.campusRequired");
    }

    if (saidaEm && retornoPrevistoEm) {
      const saida = new Date(saidaEm);
      const retorno = new Date(retornoPrevistoEm);

      if (retorno <= saida) {
        return t("errors.invalidPeriod");
      }
    }

    if (capacidadeMaxima) {
      const capacidade = Number(capacidadeMaxima);

      if (!Number.isInteger(capacidade) || capacidade <= 0) {
        return t("errors.invalidCapacity");
      }
    }

    if (exigePagamento && valorParticipante.trim()) {
      const valor = Number(
        valorParticipante.replace(",", ".")
      );

      if (!Number.isFinite(valor) || valor < 0) {
        return t("errors.invalidValue");
      }
    }

    if (exigePagamento && moeda.trim()) {
      if (!/^[A-Za-z]{3}$/.test(moeda.trim())) {
        return t("errors.invalidCurrency");
      }
    }

    return "";
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const erroValidacao = validar();

    if (erroValidacao) {
      setErro(erroValidacao);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    try {
      setSalvando(true);
      setErro("");

      const resposta = await fetch(
        "/api/admin/atividades-externas",
        {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            titulo: titulo.trim(),
            tipo,

            descricao: descricao.trim() || null,

            objetivoPedagogico:
              objetivoPedagogico.trim() || null,

            curricular,
            obrigatoria,
            internacional,

            destinoNome:
              destinoNome.trim() || null,

            enderecoDestino:
              enderecoDestino.trim() || null,

            cidadeDestino:
              cidadeDestino.trim() || null,

            regiaoDestino:
              regiaoDestino.trim() || null,

            paisDestino:
              paisDestino.trim() || null,

            fusoHorario:
              fusoHorario.trim() || null,

            saidaEm:
              datetimeLocalParaIso(saidaEm),

            retornoPrevistoEm:
              datetimeLocalParaIso(
                retornoPrevistoEm
              ),

            poloId:
              poloId
                ? Number(poloId)
                : null,

            responsavelPrincipalUserId:
              responsavelPrincipalUserId
                ? Number(
                    responsavelPrincipalUserId
                  )
                : null,

            turmaIds,

            capacidadeMaxima:
              capacidadeMaxima
                ? Number(capacidadeMaxima)
                : null,

            exigeAutorizacaoResponsavel,

            exigePagamento,

            valorParticipante:
              exigePagamento &&
              valorParticipante.trim()
                ? valorParticipante.trim()
                : null,

            moeda:
              exigePagamento &&
              moeda.trim()
                ? moeda
                    .trim()
                    .toUpperCase()
                : null,

            exigeCheckin,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.message ||
            t("errors.save")
        );
      }

      router.push(
        "/admin/atividades-externas"
      );

      router.refresh();
    } catch (e: unknown) {
      setErro(
        e instanceof Error
          ? e.message
          : t("errors.save")
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSalvando(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500";

  const labelClass =
    "text-sm font-bold text-slate-800 dark:text-slate-100";

  if (carregando) {
    return (
      <main className="phanyx-atividade-externa-nova-page min-h-screen bg-slate-50 px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <section className="phanyx-theme-card rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />

            <p className="mt-4 font-semibold text-slate-600 dark:text-slate-300">
              {t("loadingOptions")}
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="phanyx-atividade-externa-nova-page min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">

        <section className="phanyx-theme-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <Link
            href="/admin/atividades-externas"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
          >
            ← {t("back")}
          </Link>

          <div className="mt-5 flex items-start gap-4">
            <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-2xl dark:border-blue-900 dark:bg-blue-950/40">
              🧭
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                {t("eyebrow")}
              </p>

              <h1 className="mt-1 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
                {t("title")}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </section>

        {erro ? (
          <section className="rounded-3xl border border-red-300 bg-red-50 p-5 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            {erro}
          </section>
        ) : null}

        <form
          onSubmit={salvar}
          className="space-y-6"
        >

          <section className="phanyx-theme-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              {t("sections.general")}
            </h2>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t("sections.generalDescription")}
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label>
                <span className={labelClass}>
                  {t("fields.title")} *
                </span>

                <input
                  value={titulo}
                  onChange={(e) =>
                    setTitulo(e.target.value)
                  }
                  maxLength={200}
                  placeholder={t(
                    "fields.titlePlaceholder"
                  )}
                  className={inputClass}
                />
              </label>

              <label>
                <span className={labelClass}>
                  {t("fields.type")} *
                </span>

                <select
                  value={tipo}
                  onChange={(e) =>
                    setTipo(e.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">
                    {t("fields.selectType")}
                  </option>

                  {TIPOS.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {t(`types.${item}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label>
                <span className={labelClass}>
                  {t("fields.description")}
                </span>

                <textarea
                  value={descricao}
                  onChange={(e) =>
                    setDescricao(e.target.value)
                  }
                  rows={5}
                  placeholder={t(
                    "fields.descriptionPlaceholder"
                  )}
                  className={inputClass}
                />
              </label>

              <label>
                <span className={labelClass}>
                  {t("fields.objective")}
                </span>

                <textarea
                  value={objetivoPedagogico}
                  onChange={(e) =>
                    setObjetivoPedagogico(
                      e.target.value
                    )
                  }
                  rows={5}
                  placeholder={t(
                    "fields.objectivePlaceholder"
                  )}
                  className={inputClass}
                />
              </label>
            </div>
          </section>

          <section className="phanyx-theme-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              {t("sections.destination")}
            </h2>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t("sections.destinationDescription")}
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label>
                <span className={labelClass}>
                  {t("fields.destinationName")}
                </span>

                <input
                  value={destinoNome}
                  onChange={(e) =>
                    setDestinoNome(e.target.value)
                  }
                  placeholder={t(
                    "fields.destinationNamePlaceholder"
                  )}
                  className={inputClass}
                />
              </label>

              <label>
                <span className={labelClass}>
                  {t("fields.address")}
                </span>

                <input
                  value={enderecoDestino}
                  onChange={(e) =>
                    setEnderecoDestino(
                      e.target.value
                    )
                  }
                  placeholder={t(
                    "fields.addressPlaceholder"
                  )}
                  className={inputClass}
                />
              </label>

              <label>
                <span className={labelClass}>
                  {t("fields.city")}
                </span>

                <input
                  value={cidadeDestino}
                  onChange={(e) =>
                    setCidadeDestino(
                      e.target.value
                    )
                  }
                  className={inputClass}
                />
              </label>

              <label>
                <span className={labelClass}>
                  {t("fields.region")}
                </span>

                <input
                  value={regiaoDestino}
                  onChange={(e) =>
                    setRegiaoDestino(
                      e.target.value
                    )
                  }
                  className={inputClass}
                />
              </label>

              <label>
                <span className={labelClass}>
                  {t("fields.country")}
                </span>

                <input
                  value={paisDestino}
                  onChange={(e) =>
                    setPaisDestino(
                      e.target.value
                    )
                  }
                  className={inputClass}
                />
              </label>

              <label>
                <span className={labelClass}>
                  {t("fields.timezone")}
                </span>

                <input
                  value={fusoHorario}
                  onChange={(e) =>
                    setFusoHorario(e.target.value)
                  }
                  className={inputClass}
                />
              </label>
            </div>
          </section>

          <section className="phanyx-theme-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              {t("sections.schedule")}
            </h2>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t("sections.scheduleDescription")}
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label>
                <span className={labelClass}>
                  {t("fields.departure")}
                </span>

                <input
                  type="datetime-local"
                  value={saidaEm}
                  onChange={(e) =>
                    setSaidaEm(e.target.value)
                  }
                  className={inputClass}
                />
              </label>

              <label>
                <span className={labelClass}>
                  {t("fields.expectedReturn")}
                </span>

                <input
                  type="datetime-local"
                  value={retornoPrevistoEm}
                  onChange={(e) =>
                    setRetornoPrevistoEm(
                      e.target.value
                    )
                  }
                  className={inputClass}
                />
              </label>
            </div>
          </section>

          <section className="phanyx-theme-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              {t("sections.organization")}
            </h2>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t("sections.organizationDescription")}
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label>
                <span className={labelClass}>
                  {t("fields.campus")}
                  {!acessoTodosPolos ? " *" : ""}
                </span>

                <select
                  value={poloId}
                  onChange={(e) => {
                    setPoloId(e.target.value);
                    setTurmaIds([]);
                  }}
                  className={inputClass}
                >
                  {acessoTodosPolos ? (
                    <option value="">
                      {t(
                        "fields.noSpecificCampus"
                      )}
                    </option>
                  ) : (
                    <option value="">
                      —
                    </option>
                  )}

                  {polos.map((polo) => (
                    <option
                      key={polo.id}
                      value={polo.id}
                    >
                      {polo.nome}
                      {polo.codigo
                        ? ` — ${polo.codigo}`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className={labelClass}>
                  {t("fields.responsible")}
                </span>

                <select
                  value={
                    responsavelPrincipalUserId
                  }
                  onChange={(e) =>
                    setResponsavelPrincipalUserId(
                      e.target.value
                    )
                  }
                  className={inputClass}
                >
                  <option value="">—</option>

                  {responsaveis.map(
                    (responsavel) => (
                      <option
                        key={responsavel.id}
                        value={
                          responsavel.id
                        }
                      >
                        {responsavel.nome}
                        {responsavel.email
                          ? ` — ${responsavel.email}`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>

            <div className="phanyx-atividade-externa-box mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className={labelClass}>
                    {t("fields.classes")}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {t("selectedClasses", {
                      count: turmaIds.length,
                    })}
                  </p>
                </div>

                <input
                  type="search"
                  value={buscaTurma}
                  onChange={(e) =>
                    setBuscaTurma(e.target.value)
                  }
                  placeholder={t(
                    "fields.searchClasses"
                  )}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:max-w-xs"
                />
              </div>

              <div className="mt-4 grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
                {turmasFiltradas.map(
                  (turma) => {
                    const selecionada =
                      turmaIds.includes(
                        turma.id
                      );

                    return (
                      <label
                        key={turma.id}
                        className={[
                          "flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition",
                          selecionada
                            ? "border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30"
                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          checked={selecionada}
                          onChange={() =>
                            alternarTurma(
                              turma.id
                            )
                          }
                          className="mt-1 h-4 w-4"
                        />

                        <span className="min-w-0">
                          <strong className="block text-sm text-slate-900 dark:text-white">
                            {turma.nome}
                          </strong>

                          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                            {[
                              turma.codigo,
                              turma.periodoLetivo,
                              turma.turno,
                              turma.polo?.nome,
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </span>
                        </span>
                      </label>
                    );
                  }
                )}

                {turmasFiltradas.length ===
                0 ? (
                  <p className="col-span-full py-6 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {t("fields.noClasses")}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="phanyx-theme-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              {t("sections.participation")}
            </h2>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t("sections.participationDescription")}
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <label>
                <span className={labelClass}>
                  {t("fields.capacity")}
                </span>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={capacidadeMaxima}
                  onChange={(e) =>
                    setCapacidadeMaxima(
                      e.target.value
                    )
                  }
                  className={inputClass}
                />
              </label>

              {exigePagamento ? (
                <>
                  <label>
                    <span className={labelClass}>
                      {t("fields.value")}
                    </span>

                    <input
                      inputMode="decimal"
                      value={valorParticipante}
                      onChange={(e) =>
                        setValorParticipante(
                          e.target.value
                        )
                      }
                      className={inputClass}
                    />
                  </label>

                  <label>
                    <span className={labelClass}>
                      {t("fields.currency")}
                    </span>

                    <input
                      value={moeda}
                      onChange={(e) =>
                        setMoeda(
                          e.target.value
                            .toUpperCase()
                            .slice(0, 3)
                        )
                      }
                      maxLength={3}
                      placeholder={t(
                        "fields.currencyPlaceholder"
                      )}
                      className={inputClass}
                    />
                  </label>
                </>
              ) : null}
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <Toggle
                ativo={curricular}
                aoAlterar={setCurricular}
                titulo={t(
                  "switches.curricular"
                )}
                descricao={t(
                  "switches.curricularHelp"
                )}
              />

              <Toggle
                ativo={obrigatoria}
                aoAlterar={setObrigatoria}
                titulo={t(
                  "switches.mandatory"
                )}
                descricao={t(
                  "switches.mandatoryHelp"
                )}
              />

              <Toggle
                ativo={internacional}
                aoAlterar={
                  setInternacional
                }
                titulo={t(
                  "switches.international"
                )}
                descricao={t(
                  "switches.internationalHelp"
                )}
              />

              <Toggle
                ativo={
                  exigeAutorizacaoResponsavel
                }
                aoAlterar={
                  setExigeAutorizacaoResponsavel
                }
                titulo={t(
                  "switches.authorization"
                )}
                descricao={t(
                  "switches.authorizationHelp"
                )}
              />

              <Toggle
                ativo={exigePagamento}
                aoAlterar={
                  setExigePagamento
                }
                titulo={t(
                  "switches.payment"
                )}
                descricao={t(
                  "switches.paymentHelp"
                )}
              />

              <Toggle
                ativo={exigeCheckin}
                aoAlterar={setExigeCheckin}
                titulo={t(
                  "switches.checkin"
                )}
                descricao={t(
                  "switches.checkinHelp"
                )}
              />
            </div>
          </section>

          <section className="phanyx-theme-card sticky bottom-3 z-20 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t("requiredHint")}
              </p>

              <div className="flex gap-3">
                <Link
                  href="/admin/atividades-externas"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t("cancel")}
                </Link>

                <button
                  type="submit"
                  disabled={salvando}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-700 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando
                    ? t("saving")
                    : t("saveDraft")}
                </button>
              </div>
            </div>
          </section>
        </form>
      </div>
    </main>
  );
}

function Toggle({
  ativo,
  aoAlterar,
  titulo,
  descricao,
}: {
  ativo: boolean;
  aoAlterar: (valor: boolean) => void;
  titulo: string;
  descricao: string;
}) {
  return (
   <button
  type="button"
  onClick={() =>
    aoAlterar(!ativo)
  }
  aria-pressed={ativo}
  data-active={ativo ? "true" : "false"}
  className={[
    "phanyx-atividade-externa-switch flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition",
    ativo
      ? "border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30"
      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800",
  ].join(" ")}
>
      <span
        className={[
          "mt-0.5 flex h-6 w-11 flex-none items-center rounded-full p-0.5 transition",
          ativo
            ? "bg-blue-600"
            : "bg-slate-300 dark:bg-slate-600",
        ].join(" ")}
      >
        <span
          className={[
            "h-5 w-5 rounded-full bg-white shadow transition",
            ativo
              ? "translate-x-5"
              : "translate-x-0",
          ].join(" ")}
        />
      </span>

      <span className="phanyx-atividade-externa-switch-text">
  <strong className="block text-sm font-bold text-slate-900 dark:text-white">
    {titulo}
  </strong>

  <span className="phanyx-atividade-externa-switch-description mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300">
    {descricao}
  </span>
</span>
    </button>
  );
}
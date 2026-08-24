"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { getCountries, type CountryCode } from "libphonenumber-js";

import CampoTelefoneInternacional from "@/components/internacionalizacao/CampoTelefoneInternacional";
import {
  detectarPaisTelefone,
  formatarTelefonePorPais,
  normalizarTelefoneE164,
  telefoneValidoInternacional,
} from "@/lib/internacionalizacao/telefone";

type FormAluno = {
  nome: string;
  nomeSocial: string;
  genero: string;
  nacionalidade: string;
  paisNascimento: string;
  tipoDocumento: string;
  numeroDocumento: string;
  cpf: string;
  rg: string;
  telefone: string;
  paisTelefone: CountryCode;
  dataNascimento: string;
  paisResidencia: CountryCode;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  nomeResponsavel: string;
  tipoDocumentoResponsavel: string;
  numeroDocumentoResponsavel: string;
  cpfResponsavel: string;
  telefoneResponsavel: string;
  paisTelefoneResponsavel: CountryCode;
  emailResponsavel: string;
  parentescoResponsavel: string;
  possuiNecessidadeEspecial: boolean;
  descricaoNecessidadeEspecial: string;
  observacoesAcessibilidade: string;
};

const PAIS_POR_LOCALE: Record<string, CountryCode> = {
  "pt-BR": "BR",
  "pt-PT": "PT",
  "en-US": "US",
  "es-ES": "ES",
  "fr-FR": "FR",
};

function paisInicial(locale: string): CountryCode {
  return PAIS_POR_LOCALE[locale] ?? "BR";
}

function criarFormularioVazio(locale: string): FormAluno {
  const pais = paisInicial(locale);

  return {
    nome: "",
    nomeSocial: "",
    genero: "",
    nacionalidade: "",
    paisNascimento: "",
    tipoDocumento: "",
    numeroDocumento: "",
    cpf: "",
    rg: "",
    telefone: "",
    paisTelefone: pais,
    dataNascimento: "",
    paisResidencia: pais,
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    nomeResponsavel: "",
    tipoDocumentoResponsavel: "",
    numeroDocumentoResponsavel: "",
    cpfResponsavel: "",
    telefoneResponsavel: "",
    paisTelefoneResponsavel: pais,
    emailResponsavel: "",
    parentescoResponsavel: "",
    possuiNecessidadeEspecial: false,
    descricaoNecessidadeEspecial: "",
    observacoesAcessibilidade: "",
  };
}

function codigoPaisValido(valor: unknown): valor is CountryCode {
  return typeof valor === "string" && getCountries().includes(valor as CountryCode);
}

function formatarCodigoPostal(valor: string, pais: CountryCode) {
  const limpo = valor.toUpperCase().replace(/[^A-Z0-9 -]/g, "");
  const digitos = limpo.replace(/\D/g, "");

  if (pais === "BR") {
    return digitos.slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
  }

  if (pais === "PT") {
    return digitos.slice(0, 7).replace(/^(\d{4})(\d)/, "$1-$2");
  }

  if (pais === "US") {
    return digitos.slice(0, 9).replace(/^(\d{5})(\d)/, "$1-$2");
  }

  if (pais === "ES" || pais === "FR") {
    return digitos.slice(0, 5);
  }

  return limpo.replace(/\s+/g, " ").slice(0, 16);
}

function codigoPostalValido(valor: string, pais: CountryCode) {
  if (!valor.trim()) return true;

  const digitos = valor.replace(/\D/g, "");

  if (pais === "BR") return digitos.length === 8;
  if (pais === "PT") return digitos.length === 7;
  if (pais === "US") return digitos.length === 5 || digitos.length === 9;
  if (pais === "ES" || pais === "FR") return digitos.length === 5;

  const tamanho = valor.replace(/\s/g, "").length;
  return tamanho >= 3 && tamanho <= 16;
}

export default function CompletarCadastroAlunoPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("StudentProfileCompletion");

  const [form, setForm] = useState<FormAluno>(() => criarFormularioVazio(locale));
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const paises = useMemo(() => {
    let displayNames: Intl.DisplayNames | null = null;

    try {
      displayNames = new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      displayNames = null;
    }

    return getCountries()
      .map((codigo) => ({
        codigo,
        nome: displayNames?.of(codigo) || codigo,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, locale));
  }, [locale]);

  const tiposDocumento = useMemo(() => {
    const comuns = ["PASSPORT", "NATIONAL_ID", "TAX_ID", "RESIDENCE_PERMIT", "OTHER"];
    const locais: Partial<Record<CountryCode, string[]>> = {
      BR: ["CPF", "RG"],
      PT: ["NIF", "CARTAO_CIDADAO"],
      US: ["SSN", "STATE_ID"],
      ES: ["DNI", "NIE"],
      FR: ["CNI"],
    };

    return [...(locais[form.paisResidencia] ?? []), ...comuns];
  }, [form.paisResidencia]);

  const campo =
    "w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-950 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-900";

  function traduzirErroApi(codigo?: string, mensagem?: string) {
    const chaves: Record<string, string> = {
      FORBIDDEN: "errors.forbidden",
      STUDENT_NOT_FOUND: "errors.studentNotFound",
      MISSING_REQUIRED_FIELDS: "errors.required",
      INVALID_PHONE: "errors.invalidPhone",
      INVALID_GUARDIAN_PHONE: "errors.invalidGuardianPhone",
      INVALID_POSTAL_CODE: "errors.invalidPostalCode",
      INVALID_DATE: "errors.invalidDate",
      INVALID_COUNTRY: "errors.invalidCountry",
      LOAD_FAILED: "errors.load",
      UPDATE_FAILED: "errors.save",
    };

    return codigo && chaves[codigo] ? t(chaves[codigo]) : mensagem || t("errors.generic");
  }

  function atualizar<K extends keyof FormAluno>(campoForm: K, valor: FormAluno[K]) {
    setForm((prev) => ({ ...prev, [campoForm]: valor }));
  }

  async function carregar() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/aluno/completar-cadastro", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(traduzirErroApi(data?.code, data?.error));
      }

      const padrao = paisInicial(locale);
      const paisResidencia = codigoPaisValido(data.paisResidencia)
        ? data.paisResidencia
        : padrao;
      const paisTelefone = codigoPaisValido(data.paisTelefone)
        ? data.paisTelefone
        : detectarPaisTelefone(data.telefone) ?? paisResidencia;
      const paisTelefoneResponsavel = codigoPaisValido(data.paisTelefoneResponsavel)
        ? data.paisTelefoneResponsavel
        : detectarPaisTelefone(data.telefoneResponsavel) ?? paisResidencia;

      setForm({
        ...criarFormularioVazio(locale),
        nome: data.nome || "",
        nomeSocial: data.nomeSocial || "",
        genero: data.genero || "",
        nacionalidade: data.nacionalidade || "",
        paisNascimento: data.paisNascimento || "",
        tipoDocumento:
          data.tipoDocumento || (data.cpf ? "CPF" : data.rg ? "RG" : ""),
        numeroDocumento: data.numeroDocumento || data.cpf || data.rg || "",
        cpf: data.cpf || "",
        rg: data.rg || "",
        telefone: formatarTelefonePorPais(data.telefone || "", paisTelefone),
        paisTelefone,
        dataNascimento: data.dataNascimento
          ? String(data.dataNascimento).slice(0, 10)
          : "",
        paisResidencia,
        cep: formatarCodigoPostal(data.cep || "", paisResidencia),
        endereco: data.endereco || "",
        numero: data.numero || "",
        complemento: data.complemento || "",
        bairro: data.bairro || "",
        cidade: data.cidade || "",
        estado: data.estado || "",
        nomeResponsavel: data.nomeResponsavel || "",
        tipoDocumentoResponsavel:
          data.tipoDocumentoResponsavel || (data.cpfResponsavel ? "CPF" : ""),
        numeroDocumentoResponsavel:
          data.numeroDocumentoResponsavel || data.cpfResponsavel || "",
        cpfResponsavel: data.cpfResponsavel || "",
        telefoneResponsavel: formatarTelefonePorPais(
          data.telefoneResponsavel || "",
          paisTelefoneResponsavel
        ),
        paisTelefoneResponsavel,
        emailResponsavel: data.emailResponsavel || "",
        parentescoResponsavel: data.parentescoResponsavel || "",
        possuiNecessidadeEspecial: Boolean(data.possuiNecessidadeEspecial),
        descricaoNecessidadeEspecial: data.descricaoNecessidadeEspecial || "",
        observacoesAcessibilidade: data.observacoesAcessibilidade || "",
      });
    } catch (error) {
      setErro(error instanceof Error ? error.message : t("errors.load"));
    } finally {
      setLoading(false);
    }
  }

  async function salvar() {
    if (salvando) return;

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      if (!form.tipoDocumento || !form.numeroDocumento.trim() || !form.telefone || !form.dataNascimento) {
        setErro(t("errors.required"));
        return;
      }

      if (!telefoneValidoInternacional(form.telefone, form.paisTelefone)) {
        setErro(t("errors.invalidPhone"));
        return;
      }

      if (
        form.telefoneResponsavel &&
        !telefoneValidoInternacional(form.telefoneResponsavel, form.paisTelefoneResponsavel)
      ) {
        setErro(t("errors.invalidGuardianPhone"));
        return;
      }

      if (!codigoPostalValido(form.cep, form.paisResidencia)) {
        setErro(t("errors.invalidPostalCode"));
        return;
      }

      const payload = {
        ...form,
        telefone: normalizarTelefoneE164(form.telefone, form.paisTelefone),
        telefoneResponsavel: form.telefoneResponsavel
          ? normalizarTelefoneE164(
              form.telefoneResponsavel,
              form.paisTelefoneResponsavel
            )
          : "",
        cpf: form.tipoDocumento === "CPF" ? form.numeroDocumento : form.cpf,
        rg: form.tipoDocumento === "RG" ? form.numeroDocumento : form.rg,
        cpfResponsavel:
          form.tipoDocumentoResponsavel === "CPF"
            ? form.numeroDocumentoResponsavel
            : form.cpfResponsavel,
      };

      const res = await fetch("/api/aluno/completar-cadastro", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(traduzirErroApi(data?.code, data?.error));
      }

      setSucesso(t("success"));
      window.setTimeout(() => router.push("/aluno"), 800);
    } catch (error) {
      setErro(error instanceof Error ? error.message : t("errors.save"));
    } finally {
      setSalvando(false);
    }
  }

  useEffect(() => {
    void carregar();
    // O carregamento deve ocorrer novamente quando o idioma mudar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  if (loading) {
    return (
      <div className="p-6 text-slate-700 dark:text-slate-200" aria-live="polite">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="phanyx-completar-cadastro mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-6 rounded-3xl bg-blue-600 p-6 text-white shadow dark:bg-blue-700">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-sm text-blue-50">{t("description")}</p>
      </div>

      {erro && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 px-4">
          <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                  {t("modal.title")}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  {erro}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setErro("")}
                aria-label={t("modal.close")}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              >
                ×
              </button>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4 text-sm leading-relaxed text-blue-950 dark:bg-blue-950/50 dark:text-blue-100">
              {t("modal.help")}
            </div>
            <button
              type="button"
              onClick={() => setErro("")}
              className="mt-5 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              {t("modal.understood")}
            </button>
          </div>
        </div>
      )}

      {sucesso && (
        <div
          role="status"
          className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          {sucesso}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-950">
        <section>
          <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">
            {t("personal.title")}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("personal.officialName")}
              </label>
              <input
                className={`${campo} cursor-not-allowed bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300`}
                value={form.nome}
                disabled
                readOnly
              />
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {t("personal.officialNameHelp")}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("personal.socialName")}
              </label>
              <input
                className={campo}
                placeholder={t("personal.socialNamePlaceholder")}
                value={form.nomeSocial}
                onChange={(event) => atualizar("nomeSocial", event.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("personal.gender")}
              </label>
              <select
                className={campo}
                value={form.genero}
                onChange={(event) => atualizar("genero", event.target.value)}
              >
                <option value="">{t("common.select")}</option>
                <option value="FEMININO">{t("gender.female")}</option>
                <option value="MASCULINO">{t("gender.male")}</option>
                <option value="NAO_INFORMAR">{t("gender.notInform")}</option>
                <option value="OUTRO">{t("gender.other")}</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("personal.birthDate")} *
              </label>
              <input
                className={campo}
                type="date"
                value={form.dataNascimento}
                onChange={(event) => atualizar("dataNascimento", event.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("personal.birthCountry")}
              </label>
              <select
                className={campo}
                value={form.paisNascimento}
                onChange={(event) => atualizar("paisNascimento", event.target.value)}
              >
                <option value="">{t("common.select")}</option>
                {paises.map((pais) => (
                  <option key={pais.codigo} value={pais.codigo}>
                    {pais.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("personal.nationality")}
              </label>
              <input
                className={campo}
                placeholder={t("personal.nationalityPlaceholder")}
                value={form.nacionalidade}
                onChange={(event) => atualizar("nacionalidade", event.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("personal.documentType")} *
              </label>
              <select
                className={campo}
                value={form.tipoDocumento}
                onChange={(event) => atualizar("tipoDocumento", event.target.value)}
              >
                <option value="">{t("common.select")}</option>
                {tiposDocumento.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {t(`documents.${tipo}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("personal.documentNumber")} *
              </label>
              <input
                className={campo}
                autoComplete="off"
                placeholder={t("personal.documentNumberPlaceholder")}
                value={form.numeroDocumento}
                onChange={(event) => atualizar("numeroDocumento", event.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("personal.phone")} *
              </label>
              <CampoTelefoneInternacional
                id="telefone-aluno"
                value={form.telefone}
                pais={form.paisTelefone}
                required
                onChange={(valor, pais) =>
                  setForm((prev) => ({ ...prev, telefone: valor, paisTelefone: pais }))
                }
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 mt-8 text-lg font-bold text-slate-950 dark:text-white">
            {t("address.title")}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("address.country")}
              </label>
              <select
                className={campo}
                value={form.paisResidencia}
                onChange={(event) => {
                  const novoPais = event.target.value as CountryCode;
                  setForm((prev) => ({
                    ...prev,
                    paisResidencia: novoPais,
                    cep: formatarCodigoPostal(prev.cep, novoPais),
                  }));
                }}
              >
                {paises.map((pais) => (
                  <option key={pais.codigo} value={pais.codigo}>
                    {pais.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("address.postalCode")}
              </label>
              <input
                className={campo}
                autoComplete="postal-code"
                placeholder={t("address.postalCodePlaceholder")}
                value={form.cep}
                onChange={(event) =>
                  atualizar("cep", formatarCodigoPostal(event.target.value, form.paisResidencia))
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("address.street")}
              </label>
              <input className={campo} autoComplete="street-address" value={form.endereco} onChange={(event) => atualizar("endereco", event.target.value)} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">{t("address.number")}</label>
              <input className={campo} value={form.numero} onChange={(event) => atualizar("numero", event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">{t("address.complement")}</label>
              <input className={campo} value={form.complemento} onChange={(event) => atualizar("complemento", event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">{t("address.district")}</label>
              <input className={campo} value={form.bairro} onChange={(event) => atualizar("bairro", event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">{t("address.city")}</label>
              <input className={campo} autoComplete="address-level2" value={form.cidade} onChange={(event) => atualizar("cidade", event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">{t("address.region")}</label>
              <input className={campo} autoComplete="address-level1" placeholder={t("address.regionPlaceholder")} value={form.estado} onChange={(event) => atualizar("estado", event.target.value)} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 mt-8 text-lg font-bold text-slate-950 dark:text-white">
            {t("guardian.title")}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">{t("guardian.name")}</label>
              <input className={campo} value={form.nomeResponsavel} onChange={(event) => atualizar("nomeResponsavel", event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">{t("guardian.relationship")}</label>
              <input className={campo} value={form.parentescoResponsavel} onChange={(event) => atualizar("parentescoResponsavel", event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">{t("guardian.documentType")}</label>
              <select className={campo} value={form.tipoDocumentoResponsavel} onChange={(event) => atualizar("tipoDocumentoResponsavel", event.target.value)}>
                <option value="">{t("common.select")}</option>
                {tiposDocumento.map((tipo) => <option key={tipo} value={tipo}>{t(`documents.${tipo}`)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">{t("guardian.documentNumber")}</label>
              <input className={campo} value={form.numeroDocumentoResponsavel} onChange={(event) => atualizar("numeroDocumentoResponsavel", event.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">{t("guardian.phone")}</label>
              <CampoTelefoneInternacional
                id="telefone-responsavel"
                value={form.telefoneResponsavel}
                pais={form.paisTelefoneResponsavel}
                onChange={(valor, pais) => setForm((prev) => ({ ...prev, telefoneResponsavel: valor, paisTelefoneResponsavel: pais }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">{t("guardian.email")}</label>
              <input className={campo} type="email" autoComplete="email" value={form.emailResponsavel} onChange={(event) => atualizar("emailResponsavel", event.target.value)} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 mt-8 text-lg font-bold text-slate-950 dark:text-white">{t("accessibility.title")}</h2>
          <label className="mb-4 flex items-start gap-3 text-sm font-medium text-slate-800 dark:text-slate-100">
            <input type="checkbox" className="mt-1 h-4 w-4" checked={form.possuiNecessidadeEspecial} onChange={(event) => atualizar("possuiNecessidadeEspecial", event.target.checked)} />
            {t("accessibility.hasNeed")}
          </label>
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">{t("accessibility.description")}</label>
          <textarea className={`${campo} mb-4`} rows={3} value={form.descricaoNecessidadeEspecial} onChange={(event) => atualizar("descricaoNecessidadeEspecial", event.target.value)} />
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">{t("accessibility.notes")}</label>
          <textarea className={campo} rows={3} value={form.observacoesAcessibilidade} onChange={(event) => atualizar("observacoesAcessibilidade", event.target.value)} />
        </section>

        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="mt-6 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
        >
          {salvando ? t("saving") : t("save")}
        </button>
      </div>
    </div>
  );
}
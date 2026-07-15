"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type DadosInstituicao = {
  slug: string;
  nome: string | null;
  nomeCadastro?: string | null;
  logoUrl?: string | null;
  cidade?: string | null;
  estado?: string | null;
  pontoMobileAtivo: boolean;
};

export default function LoginRhPontoPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const slug = useMemo(
    () =>
      decodeURIComponent(String(params?.slug || ""))
        .trim()
        .toLowerCase(),
    [params]
  );

  const [dados, setDados] =
    useState<DadosInstituicao | null>(null);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] =
    useState(false);

  const [carregandoPagina, setCarregandoPagina] =
    useState(true);

  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!slug) {
      setErro("Instituição não identificada.");
      setCarregandoPagina(false);
      return;
    }

    carregarInstituicao();
  }, [slug]);

  async function carregarInstituicao() {
    try {
      setCarregandoPagina(true);
      setErro("");

      const resposta = await fetch(
        `/api/public/rh-app/${encodeURIComponent(slug)}`,
        {
          cache: "no-store",
        }
      );

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado?.error ||
            "Instituição não encontrada."
        );
      }

      setDados(resultado);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível abrir o RH Ponto."
      );
    } finally {
      setCarregandoPagina(false);
    }
  }

  async function fazerLogin(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (!email.trim() || !senha) {
      setErro("Informe seu e-mail e sua senha.");
      return;
    }

    try {
      setEntrando(true);
      setErro("");

      const resposta = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email.trim(),
          senha,
          portal: "rh",
          instituicao: slug,
        }),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado?.error ||
            "Não foi possível entrar no RH Ponto."
        );
      }

      if (resultado.user?.precisaTrocarSenha) {
        window.location.href = "/primeiro-acesso";
        return;
      }

      const destinoPadrao =
        `/rh-app/${encodeURIComponent(slug)}/ponto`;

      const destinoRecebido =
        typeof resultado.destino === "string" &&
        resultado.destino.startsWith(
          `/rh-app/${slug}/`
        )
          ? resultado.destino
          : destinoPadrao;

      router.replace(destinoRecebido);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível fazer login."
      );
    } finally {
      setEntrando(false);
    }
  }

  if (carregandoPagina) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
        <p className="text-sm font-bold">
          Carregando RH Ponto...
        </p>
      </main>
    );
  }

  if (!dados) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-900 bg-slate-900 p-6 text-center">
          <h1 className="text-xl font-black">
            RH Ponto
          </h1>

          <p className="mt-3 text-sm text-red-300">
            {erro || "Instituição não encontrada."}
          </p>
        </div>
      </main>
    );
  }

  const nomeInstituicao = String(
    dados.nome ||
      dados.nomeCadastro ||
      "Instituição"
  ).trim();

  const nomeExibicao = nomeInstituicao.replace(
    /^([^-]+)-(.+)$/,
    "$1 – $2"
  );

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 pb-28 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <section className="w-full overflow-hidden rounded-[32px] border border-slate-700 bg-slate-900 shadow-2xl">
          <div className="bg-gradient-to-br from-blue-700 to-indigo-800 px-6 py-8 text-center">
            <img
              src="/logo-phanyx.png"
              alt="PHANYX"
              className="mx-auto h-auto w-full max-w-[170px] object-contain"
            />

            {dados.logoUrl && (
              <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white p-3 shadow-xl">
                <img
                  src={dados.logoUrl}
                  alt={`Logo de ${nomeInstituicao}`}
                  className="h-full w-full object-contain"
                />
              </div>
            )}

            <p className="mt-5 text-sm font-black uppercase tracking-[0.25em] text-blue-100">
              RH Ponto
            </p>

            <h1 className="mt-3 text-xl font-black leading-tight">
              {nomeExibicao}
            </h1>
          </div>

          <form
            onSubmit={fazerLogin}
            className="space-y-4 p-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-black">
                Login do funcionário
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Entre com o acesso fornecido pela sua
                instituição.
              </p>
            </div>

            <div>
              <label
                htmlFor="emailRh"
                className="mb-2 block text-sm font-bold"
              >
                E-mail
              </label>

              <input
                id="emailRh"
                type="email"
                value={email}
                autoComplete="username"
                onChange={(evento) =>
                  setEmail(evento.target.value)
                }
                placeholder="seuemail@exemplo.com"
                className="min-h-12 w-full rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none ring-blue-500 placeholder:text-slate-500 focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="senhaRh"
                className="mb-2 block text-sm font-bold"
              >
                Senha
              </label>

              <div className="relative">
                <input
                  id="senhaRh"
                  type={
                    mostrarSenha ? "text" : "password"
                  }
                  value={senha}
                  autoComplete="current-password"
                  onChange={(evento) =>
                    setSenha(evento.target.value)
                  }
                  placeholder="Sua senha"
                  className="min-h-12 w-full rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 pr-14 text-white outline-none ring-blue-500 placeholder:text-slate-500 focus:ring-2"
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarSenha((valor) => !valor)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-lg"
                  aria-label={
                    mostrarSenha
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                >
                  {mostrarSenha ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {erro && (
              <div className="rounded-2xl border border-red-800 bg-red-950/40 p-4">
                <p className="text-sm font-bold text-red-200">
                  {erro}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={entrando}
              className="min-h-14 w-full rounded-2xl bg-blue-600 px-5 py-4 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {entrando
                ? "Entrando..."
                : "Entrar no RH Ponto"}
            </button>

            <Link
              href={`/rh-app/${encodeURIComponent(slug)}`}
              className="flex min-h-12 items-center justify-center rounded-2xl border border-slate-600 px-4 py-3 text-sm font-bold text-slate-300"
            >
              Voltar
            </Link>
          </form>
        </section>
      </div>
    </main>
  );
}
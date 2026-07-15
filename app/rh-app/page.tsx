"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SistemaCelular = "android" | "ios" | "outro";

function detectarSistema(): SistemaCelular {
  if (typeof window === "undefined") return "outro";

  const userAgent = window.navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  }

  if (/android/.test(userAgent)) {
    return "android";
  }

  return "outro";
}

function estaInstalado() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & {
      standalone?: boolean;
    }).standalone === true
  );
}

export default function PhanyxRhAppPage() {
  const router = useRouter();

  const [sistema, setSistema] =
    useState<SistemaCelular>("outro");

  const [instalado, setInstalado] = useState(false);
  const [mostrarInstalacao, setMostrarInstalacao] =
    useState(false);

useEffect(() => {
  const slugSalvo = localStorage.getItem(
    "phanyx_rh_instituicao_slug"
  );

  if (slugSalvo) {
    router.replace(
      `/rh-app/${encodeURIComponent(slugSalvo)}`
    );
  }
}, [router]);

  useEffect(() => {
    setSistema(detectarSistema());
    setInstalado(estaInstalado());
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <section className="overflow-hidden rounded-[32px] border border-slate-700 bg-slate-900 shadow-2xl">
          <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-8 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-white p-3 shadow-xl">
              <Image
                src="/icon.png"
                alt="PHANYX RH"
                width={80}
                height={80}
                className="h-full w-full object-contain"
                priority
              />
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-blue-100">
              Aplicativo do funcionário
            </p>

            <h1 className="mt-2 text-3xl font-black">
              PHANYX RH
            </h1>

            <p className="mt-3 text-sm leading-6 text-blue-100">
              Registre seu ponto pelo celular com foto,
              identificação e localização.
            </p>
          </div>

          <div className="space-y-5 p-6">
            <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
              <p className="text-sm font-black text-white">
                Registro rápido e seguro
              </p>

              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <p>📷 Foto capturada no momento do ponto</p>
                <p>📍 Verificação do local do registro</p>
                <p>🕒 Horário oficial do PHANYX</p>
                <p>🔐 Uso liberado individualmente pelo RH</p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-800 bg-amber-950/40 p-4 text-center">
  <p className="font-black text-amber-200">
    Abra o link fornecido pela sua instituição
  </p>

  <p className="mt-2 text-sm leading-6 text-amber-100">
    Para acessar o PHANYX RH pela primeira vez, utilize o link
    ou o QR Code enviado pelo setor de RH da instituição onde
    você trabalha.
  </p>
</div>
            {!instalado && (
              <button
                type="button"
                onClick={() =>
                  setMostrarInstalacao((atual) => !atual)
                }
                className="min-h-12 w-full rounded-2xl border border-slate-600 bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                Como instalar no celular
              </button>
            )}

            {instalado && (
              <div className="rounded-2xl border border-emerald-700 bg-emerald-950/50 p-4 text-center">
                <p className="text-sm font-black text-emerald-200">
                  PHANYX RH aberto como aplicativo
                </p>
              </div>
            )}

            {mostrarInstalacao && sistema === "ios" && (
              <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-sm leading-6 text-slate-300">
                <p className="font-black text-white">
                  Instalar no iPhone
                </p>

                <ol className="mt-3 list-decimal space-y-1 pl-5">
                  <li>Abra esta página pelo Safari.</li>
                  <li>Toque no botão Compartilhar.</li>
                  <li>
                    Escolha “Adicionar à Tela de Início”.
                  </li>
                  <li>Confirme em “Adicionar”.</li>
                </ol>
              </div>
            )}

            {mostrarInstalacao && sistema !== "ios" && (
              <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-sm leading-6 text-slate-300">
                <p className="font-black text-white">
                  Instalar no Android
                </p>

                <ol className="mt-3 list-decimal space-y-1 pl-5">
                  <li>Abra esta página pelo Chrome.</li>
                  <li>
                    Toque nos três pontinhos do navegador.
                  </li>
                  <li>
                    Escolha “Instalar app” ou “Adicionar à
                    tela inicial”.
                  </li>
                  <li>Confirme a instalação.</li>
                </ol>
              </div>
            )}

            <p className="text-center text-xs leading-5 text-slate-400">
              A instalação do aplicativo não libera o
              registro de ponto automaticamente. O acesso
              precisa ser autorizado pelo RH da instituição.
            </p>
          </div>
        </section>

        <p className="mt-5 text-center text-xs text-slate-500">
          PHANYX — Gestão integrada de pessoas e educação
        </p>
      </div>
    </main>
  );
}
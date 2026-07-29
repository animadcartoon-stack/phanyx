"use client";

import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

type TipoAssinaturaRh = "DESENHO" | "DIGITAL";

type HoleriteAssinaturaRh = {
  id: number;
  competenciaMes: number;
  competenciaAno: number;
  valorLiquido: string | number;

  funcionario?: {
    nome?: string | null;
  } | null;
};

type AssinaturaRhHoleriteModalProps = {
  holerite: HoleriteAssinaturaRh;

  onFechar: () => void;

  onConcluido: (
    mensagem: string,
  ) => void | Promise<void>;
};

function numero(valor: unknown) {
  return Number(
    String(valor ?? "0").replace(",", "."),
  ) || 0;
}

function moeda(valor: unknown) {
  return numero(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function AssinaturaRhHoleriteModal({
  holerite,
  onFechar,
  onConcluido,
}: AssinaturaRhHoleriteModalProps) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const desenhandoRef = useRef(false);

  const [
    tipoAssinatura,
    setTipoAssinatura,
  ] = useState<TipoAssinaturaRh>("DESENHO");

  const [
    assinaturaDesenhada,
    setAssinaturaDesenhada,
  ] = useState(false);

  const [
    aceitouTermos,
    setAceitouTermos,
  ] = useState(false);

  const [assinando, setAssinando] =
    useState(false);

  const [erro, setErro] = useState("");

  function obterContexto() {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    return canvas.getContext("2d");
  }

  function obterCoordenadas(
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return {
        x: 0,
        y: 0,
      };
    }

    const rect =
      canvas.getBoundingClientRect();

    return {
      x:
        (event.clientX - rect.left) *
        (canvas.width / rect.width),

      y:
        (event.clientY - rect.top) *
        (canvas.height / rect.height),
    };
  }

  function iniciarDesenho(
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) {
    if (assinando) return;

    const canvas = canvasRef.current;
    const contexto = obterContexto();

    if (!canvas || !contexto) return;

    canvas.setPointerCapture(
      event.pointerId,
    );

    const coordenadas =
      obterCoordenadas(event);

    desenhandoRef.current = true;

    contexto.beginPath();

    contexto.moveTo(
      coordenadas.x,
      coordenadas.y,
    );
  }

  function desenhar(
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) {
    if (
      !desenhandoRef.current ||
      assinando
    ) {
      return;
    }

    const contexto = obterContexto();

    if (!contexto) return;

    const coordenadas =
      obterCoordenadas(event);

    contexto.lineWidth = 4;
    contexto.lineCap = "round";
    contexto.lineJoin = "round";
    contexto.strokeStyle = "#0f172a";

    contexto.lineTo(
      coordenadas.x,
      coordenadas.y,
    );

    contexto.stroke();

    setAssinaturaDesenhada(true);
  }

  function pararDesenho(
    event?: ReactPointerEvent<HTMLCanvasElement>,
  ) {
    desenhandoRef.current = false;

    obterContexto()?.beginPath();

    if (
      event &&
      canvasRef.current?.hasPointerCapture(
        event.pointerId,
      )
    ) {
      canvasRef.current.releasePointerCapture(
        event.pointerId,
      );
    }
  }

  function limparAssinatura() {
    const canvas = canvasRef.current;
    const contexto = obterContexto();

    if (!canvas || !contexto) return;

    contexto.clearRect(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    setAssinaturaDesenhada(false);
    setErro("");
  }

  async function confirmarAssinatura() {
    setErro("");

    if (!aceitouTermos) {
      setErro(
        "Confirme que você conferiu os dados do recibo antes de assinar.",
      );

      return;
    }

    let assinaturaBase64 = "";

    if (tipoAssinatura === "DESENHO") {
      if (!assinaturaDesenhada) {
        setErro(
          "Desenhe sua assinatura no espaço indicado.",
        );

        return;
      }

      assinaturaBase64 =
        canvasRef.current?.toDataURL(
          "image/png",
        ) || "";

      if (!assinaturaBase64) {
        setErro(
          "Não foi possível gerar a imagem da assinatura.",
        );

        return;
      }
    }

    try {
      setAssinando(true);

      const resposta = await fetch(
        `/api/admin/rh/holerites/${holerite.id}/assinatura-rh`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            tipoAssinatura,
            assinaturaBase64,
            aceitouTermos: true,
          }),
        },
      );

      const dados = await resposta
        .json()
        .catch(() => null);

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
          "Não foi possível assinar o recibo pelo RH.",
        );
      }

      await onConcluido(
        dados?.message ||
        "Recibo assinado digitalmente pelo RH com sucesso.",
      );

      onFechar();
    } catch (error: any) {
      setErro(
        error?.message ||
        "Erro ao assinar digitalmente o recibo pelo RH.",
      );
    } finally {
      setAssinando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-950 dark:text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
              Assinatura do RH
            </p>

            <h2 className="mt-1 text-xl font-bold">
              Assinar recibo digitalmente
            </h2>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              A assinatura será vinculada ao
              seu usuário autenticado, ID,
              instituição, data, horário e
              trilha de auditoria.
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            disabled={assinando}
            aria-label="Fechar"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ×
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
          <p>
            <strong>Funcionário:</strong>{" "}
            {holerite.funcionario?.nome ||
              "Funcionário"}
          </p>

          <p className="mt-2">
            <strong>Competência:</strong>{" "}
            {String(
              holerite.competenciaMes,
            ).padStart(2, "0")}
            /{holerite.competenciaAno}
          </p>

          <p className="mt-2">
            <strong>
              Valor do recibo:
            </strong>{" "}
            {moeda(holerite.valorLiquido)}
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={assinando}
            onClick={() => {
              setTipoAssinatura("DESENHO");
              setErro("");
            }}
            className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${tipoAssinatura === "DESENHO"
                ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
          >
            ✍️ Desenhar assinatura
          </button>

          <button
            type="button"
            disabled={assinando}
            onClick={() => {
              setTipoAssinatura("DIGITAL");
              setErro("");
            }}
            className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${tipoAssinatura === "DIGITAL"
                ? "border-slate-500 bg-slate-100 text-slate-900 dark:border-slate-400 dark:bg-slate-800 dark:text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
          >
            🔐 Assinatura digitada
          </button>
        </div>

        {tipoAssinatura === "DESENHO" ? (
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Assine no espaço abaixo
            </p>

            <canvas
              ref={canvasRef}
              width={900}
              height={260}
              onPointerDown={iniciarDesenho}
              onPointerMove={desenhar}
              onPointerUp={pararDesenho}
              onPointerCancel={pararDesenho}
              onPointerLeave={pararDesenho}
              className="h-[220px] w-full touch-none rounded-xl border-2 border-dashed border-slate-300 bg-white dark:border-slate-600"
            />

            <button
              type="button"
              disabled={assinando}
              onClick={limparAssinatura}
              className="mt-3 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Limpar assinatura
            </button>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔐</div>

              <div>
                <p className="font-bold">
                  Assinatura digital autenticada
                </p>

                <p className="mt-2 text-sm leading-6">
                  A assinatura será realizada exclusivamente com o usuário
                  atualmente autenticado no PHANYX. Não é possível informar,
                  alterar ou substituir o nome do assinante neste formulário.
                </p>

                <div className="mt-4 rounded-xl border border-emerald-200 bg-white/70 p-4 text-sm dark:border-emerald-800 dark:bg-slate-900/60">
                  <p>
                    <strong>Identidade:</strong>{" "}
                    obtida da sessão autenticada
                  </p>

                  <p className="mt-2">
                    <strong>Usuário e ID:</strong>{" "}
                    confirmados novamente no banco de dados
                  </p>

                  <p className="mt-2">
                    <strong>Auditoria:</strong>{" "}
                    instituição, data, horário, IP, navegador e hash
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <label className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <input
            type="checkbox"
            checked={aceitouTermos}
            onChange={(event) => {
              setAceitouTermos(
                event.target.checked,
              );

              setErro("");
            }}
            disabled={assinando}
            className="mt-1"
          />

          <span>
            Declaro que conferi os dados do
            pagamento e assino este recibo
            como representante autorizado do
            RH. Estou ciente de que a
            assinatura ficará vinculada ao
            meu usuário e ID no PHANYX.
          </span>
        </label>

        {erro && (
          <div
            aria-live="polite"
            className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
          >
            <p className="font-bold">
              Não foi possível assinar
            </p>

            <p className="mt-1">{erro}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onFechar}
            disabled={assinando}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={confirmarAssinatura}
            disabled={assinando}
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {assinando
              ? "Registrando assinatura..."
              : tipoAssinatura === "DIGITAL"
                ? "Assinar com meu usuário PHANYX"
                : "Registrar assinatura desenhada"}
          </button>
        </div>
      </div>
    </div>
  );
}
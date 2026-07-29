"use client";

import { useMemo, useState } from "react";

type HoleriteReciboManual = {
  id: number;
  competenciaMes: number;
  competenciaAno: number;
  valorLiquido: string | number;

  funcionario?: {
    nome?: string | null;
  } | null;
};

type ReciboAssinadoManualModalProps = {
  holerite: HoleriteReciboManual;

  onFechar: () => void;

  onConcluido: (
    mensagem: string,
  ) => void | Promise<void>;
};

const TAMANHO_MAXIMO_ARQUIVO =
  10 * 1024 * 1024;

const TIPOS_PERMITIDOS = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];

function numero(valor: unknown) {
  return (
    Number(
      String(valor ?? "0").replace(",", "."),
    ) || 0
  );
}

function moeda(valor: unknown) {
  return numero(valor).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  );
}

function tamanhoArquivo(
  tamanho: number,
) {
  if (tamanho < 1024) {
    return `${tamanho} bytes`;
  }

  if (tamanho < 1024 * 1024) {
    return `${(
      tamanho / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    tamanho /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function dataAtualLocal() {
  const agora = new Date();

  const ano = agora.getFullYear();

  const mes = String(
    agora.getMonth() + 1,
  ).padStart(2, "0");

  const dia = String(
    agora.getDate(),
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export default function ReciboAssinadoManualModal({
  holerite,
  onFechar,
  onConcluido,
}: ReciboAssinadoManualModalProps) {
  const [arquivo, setArquivo] =
    useState<File | null>(null);

  const [
    dataAssinatura,
    setDataAssinatura,
  ] = useState("");

  const [observacao, setObservacao] =
    useState("");

  const [
    confirmouDocumento,
    setConfirmouDocumento,
  ] = useState(false);

  const [enviando, setEnviando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const nomeFuncionario =
    holerite.funcionario?.nome ||
    "Funcionário";

  const competencia = `${String(
    holerite.competenciaMes,
  ).padStart(2, "0")}/${
    holerite.competenciaAno
  }`;

  const dadosArquivo = useMemo(() => {
    if (!arquivo) {
      return null;
    }

    return {
      nome: arquivo.name,
      tipo:
        arquivo.type ||
        "Tipo não identificado",
      tamanho: tamanhoArquivo(
        arquivo.size,
      ),
    };
  }, [arquivo]);

  function selecionarArquivo(
    arquivoSelecionado:
      | File
      | null,
  ) {
    setErro("");

    if (!arquivoSelecionado) {
      setArquivo(null);
      return;
    }

    if (
      !TIPOS_PERMITIDOS.includes(
        arquivoSelecionado.type,
      )
    ) {
      setArquivo(null);

      setErro(
        "Selecione um arquivo PDF, PNG, JPG ou JPEG.",
      );

      return;
    }

    if (
      arquivoSelecionado.size <= 0 ||
      arquivoSelecionado.size >
        TAMANHO_MAXIMO_ARQUIVO
    ) {
      setArquivo(null);

      setErro(
        "O documento deve possuir até 10 MB.",
      );

      return;
    }

    setArquivo(arquivoSelecionado);
  }

  async function enviarDocumento() {
    setErro("");

    if (!arquivo) {
      setErro(
        "Selecione o documento assinado pelo funcionário.",
      );

      return;
    }

    if (
      observacao.trim().length < 10
    ) {
      setErro(
        "Informe uma observação com pelo menos 10 caracteres.",
      );

      return;
    }

    if (!confirmouDocumento) {
      setErro(
        "Confirme que o arquivo corresponde ao recibo assinado pelo funcionário.",
      );

      return;
    }

    try {
      setEnviando(true);

      const formulario =
        new FormData();

      formulario.append(
        "arquivo",
        arquivo,
      );

      formulario.append(
        "observacao",
        observacao.trim(),
      );

      if (dataAssinatura) {
        formulario.append(
          "dataAssinaturaDeclarada",
          `${dataAssinatura}T12:00:00`,
        );
      }

      const resposta = await fetch(
        `/api/admin/rh/holerites/${holerite.id}/recibo-assinado-manual`,
        {
          method: "POST",
          body: formulario,
        },
      );

      const dados = await resposta
        .json()
        .catch(() => null);

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
            "Não foi possível enviar o documento assinado.",
        );
      }

      await onConcluido(
        dados?.message ||
          "Documento assinado manualmente enviado com sucesso.",
      );

      onFechar();
    } catch (error: any) {
      setErro(
        error?.message ||
          "Erro ao enviar o recibo assinado manualmente.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-950 dark:text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
              Assinatura manual
            </p>

            <h2 className="mt-1 text-xl font-bold">
              Enviar recibo assinado
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Use este fluxo quando o
              funcionário não possuir login
              individual no PHANYX. O RH não
              assina em nome do funcionário.
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            disabled={enviando}
            aria-label="Fechar"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ×
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
          <p>
            <strong>Funcionário:</strong>{" "}
            {nomeFuncionario}
          </p>

          <p className="mt-2">
            <strong>Competência:</strong>{" "}
            {competencia}
          </p>

          <p className="mt-2">
            <strong>
              Valor do recibo:
            </strong>{" "}
            {moeda(
              holerite.valorLiquido,
            )}
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-bold">
            Etapas da assinatura manual
          </p>

          <p className="mt-2 leading-6">
            Abra o recibo, imprima, solicite
            que o funcionário confira e
            assine fisicamente. Depois,
            digitalize ou fotografe o
            documento completo e envie
            abaixo.
          </p>

          <a
            href={`/api/admin/rh/holerites/${holerite.id}/recibo-pagamento/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-xl border border-amber-600 bg-white px-4 py-2 font-bold text-amber-800 transition hover:bg-amber-100 dark:bg-slate-900 dark:text-amber-200 dark:hover:bg-slate-800"
          >
            🖨️ Abrir recibo para imprimir
          </a>
        </div>

        <div className="mt-5">
          <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Documento assinado
          </label>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Formatos aceitos: PDF, PNG,
            JPG e JPEG. Tamanho máximo:
            10 MB.
          </p>

          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            disabled={enviando}
            onChange={(event) => {
              selecionarArquivo(
                event.target.files?.[0] ||
                  null,
              );

              event.currentTarget.value =
                "";
            }}
            className="mt-3 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:font-bold file:text-slate-800 hover:file:bg-slate-200 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:file:bg-slate-800 dark:file:text-white"
          />

          {dadosArquivo && (
            <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
              <p className="font-bold">
                Arquivo selecionado
              </p>

              <p className="mt-2 break-all">
                <strong>Nome:</strong>{" "}
                {dadosArquivo.nome}
              </p>

              <p className="mt-1">
                <strong>Formato:</strong>{" "}
                {dadosArquivo.tipo}
              </p>

              <p className="mt-1">
                <strong>Tamanho:</strong>{" "}
                {dadosArquivo.tamanho}
              </p>

              <button
                type="button"
                disabled={enviando}
                onClick={() => {
                  setArquivo(null);
                  setErro("");
                }}
                className="mt-3 rounded-lg border border-emerald-700 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 dark:text-emerald-200 dark:hover:bg-emerald-950"
              >
                Remover arquivo
              </button>
            </div>
          )}
        </div>

        <div className="mt-5">
          <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Data da assinatura física
          </label>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Campo opcional. Quando não
            informado, o sistema utilizará
            a data e o horário do envio.
          </p>

          <input
            type="date"
            value={dataAssinatura}
            max={dataAtualLocal()}
            disabled={enviando}
            onChange={(event) => {
              setDataAssinatura(
                event.target.value,
              );

              setErro("");
            }}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-amber-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="mt-5">
          <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Observação do RH
          </label>

          <textarea
            value={observacao}
            disabled={enviando}
            rows={4}
            maxLength={1000}
            onChange={(event) => {
              setObservacao(
                event.target.value,
              );

              setErro("");
            }}
            placeholder="Exemplo: Recibo impresso, conferido e assinado presencialmente pelo funcionário."
            className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-amber-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />

          <p className="mt-1 text-right text-xs text-slate-500 dark:text-slate-400">
            {observacao.length}/1000
          </p>
        </div>

        <label className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <input
            type="checkbox"
            checked={
              confirmouDocumento
            }
            disabled={enviando}
            onChange={(event) => {
              setConfirmouDocumento(
                event.target.checked,
              );

              setErro("");
            }}
            className="mt-1"
          />

          <span>
            Declaro que o arquivo enviado
            corresponde ao recibo assinado
            fisicamente por{" "}
            <strong>
              {nomeFuncionario}
            </strong>
            . Estou ciente de que meu
            usuário, ID, data, horário, IP e
            navegador ficarão registrados
            na auditoria do PHANYX.
          </span>
        </label>

        {erro && (
          <div
            aria-live="polite"
            className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
          >
            <p className="font-bold">
              Não foi possível enviar
            </p>

            <p className="mt-1">
              {erro}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onFechar}
            disabled={enviando}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={enviarDocumento}
            disabled={enviando}
            className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando
              ? "Enviando documento..."
              : "Confirmar e enviar documento"}
          </button>
        </div>
      </div>
    </div>
  );
}
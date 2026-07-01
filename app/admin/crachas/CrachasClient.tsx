"use client";

import { useState } from "react";

type ObjetoCracha =
  | {
      id: number;
      tipo: "TEXTO";
      texto: string;
      x: number;
      y: number;
      fonte: number;
      cor: string;
    }
  | {
      id: number;
      tipo: "CAMPO";
      campo: string;
      x: number;
      y: number;
    }
  | {
      id: number;
      tipo: "IMAGEM";
      url: string;
      x: number;
      y: number;
      largura: number;
      altura: number;
    };

export default function CrachasClient() {
  const [lado, setLado] = useState<"FRENTE" | "VERSO">("FRENTE");

  const [formato, setFormato] = useState<
    "RETRATO" |
    "PAISAGEM" |
    "QUADRADO" |
    "REDONDO" |
    "PERSONALIZADO"
  >("RETRATO");

  const [objetos, setObjetos] = useState<ObjetoCracha[]>([]);

  const [objetoSelecionado, setObjetoSelecionado] =
    useState<number | null>(null);

function adicionarTexto() {
  setObjetos((atual) => [
    ...atual,
    {
      id: Date.now(),
      tipo: "TEXTO",
      texto: "Novo Texto",
      x: 30,
      y: 30,
      fonte: 18,
      cor: "#000000",
    },
  ]);
}

const objetoAtual = objetos.find((obj) => obj.id === objetoSelecionado);

function atualizarObjeto(id: number, dados: Partial<ObjetoCracha>) {
  setObjetos((atual) =>
    atual.map((obj) =>
      obj.id === id ? ({ ...obj, ...dados } as ObjetoCracha) : obj
    )
  );
}

  return (
    <div className="phanyx-crachas-page p-4">

      {/* Barra Superior */}

      <div className="phanyx-crachas-card mb-4 flex flex-wrap items-center justify-between gap-3 p-4">

        <div className="flex flex-wrap gap-2">

          <button className="phanyx-crachas-button-primary">
            Novo Modelo
          </button>

          <button className="phanyx-crachas-button-secondary">
            Salvar
          </button>

          <button className="phanyx-crachas-button-secondary">
            Duplicar
          </button>

          <button className="phanyx-crachas-button-secondary">
            Emitir
          </button>

          <button className="phanyx-crachas-button-secondary">
            Imprimir
          </button>

        </div>

        <div className="flex gap-2">

          <button
            onClick={() => setLado("FRENTE")}
            className={`rounded-xl px-4 py-2 ${
              lado === "FRENTE"
                ? "bg-blue-600 text-white"
                : "bg-slate-200 dark:bg-slate-800"
            }`}
          >
            Frente
          </button>

          <button
            onClick={() => setLado("VERSO")}
            className={`rounded-xl px-4 py-2 ${
              lado === "VERSO"
                ? "bg-blue-600 text-white"
                : "bg-slate-200 dark:bg-slate-800"
            }`}
          >
            Verso
          </button>

        </div>

      </div>

      <div className="grid grid-cols-12 gap-4">

        {/* Ferramentas */}

        <div className="phanyx-crachas-card col-span-2 p-4">

          <h2 className="mb-4 font-bold">
            Ferramentas
          </h2>

          <div className="space-y-2">

            <button
  type="button"
  onClick={adicionarTexto}
  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
>
  📝 Texto
</button>

            <button
  type="button"
  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
>
  🏷️ Campo
</button>

<button
  type="button"
  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
>
  👤 Foto
</button>

<button
  type="button"
  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
>
  🏫 Logo
</button>

<button
  type="button"
  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
>
  🖼️ Imagem
</button>

<button
  type="button"
  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
>
  ⬛ Forma
</button>

<button
  type="button"
  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
>
  🔳 QR Code
</button>

<button
  type="button"
  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
>
  ▌ Código de Barras
</button>

          </div>

        </div>

        {/* Canvas */}

        <div className="phanyx-crachas-card col-span-8 flex items-center justify-center p-8">

  <div
    className="relative overflow-hidden border bg-white shadow-xl"
    style={{
      width:
        formato === "RETRATO"
          ? "240px"
          : formato === "PAISAGEM"
          ? "380px"
          : "260px",

      height:
        formato === "RETRATO"
          ? "380px"
          : formato === "PAISAGEM"
          ? "240px"
          : "260px",

      borderRadius:
        formato === "REDONDO"
          ? "9999px"
          : "16px",
    }}
  >

    {objetos.map((objeto) => {
      if (objeto.tipo === "TEXTO") {
        return (
          <div
            key={objeto.id}
            onClick={() => setObjetoSelecionado(objeto.id)}
            style={{
              position: "absolute",
              left: objeto.x,
              top: objeto.y,
              fontSize: objeto.fonte,
              color: objeto.cor,
              cursor: "pointer",
              padding: "2px 4px",
              border:
                objetoSelecionado === objeto.id
                  ? "1px dashed #2563eb"
                  : "1px solid transparent",
            }}
          >
            {objeto.texto}
          </div>
        );
      }

      return null;
    })}

  </div>

</div>
        {/* Propriedades */}

        <div className="phanyx-crachas-card col-span-2 p-4">

          <h2 className="mb-4 font-bold">
            Propriedades
          </h2>

          {!objetoAtual && (
  <p className="phanyx-crachas-muted">
    Nenhum objeto selecionado.
  </p>
)}

{objetoAtual?.tipo === "TEXTO" && (
  <div className="space-y-4">
    <div>
      <label className="mb-2 block font-semibold">
        Texto
      </label>

      <input
        value={objetoAtual.texto}
        onChange={(e) =>
          atualizarObjeto(objetoAtual.id, {
            texto: e.target.value,
          })
        }
        className="phanyx-crachas-input"
      />
    </div>

    <div>
      <label className="mb-2 block font-semibold">
        Tamanho
      </label>

      <input
        type="number"
        value={objetoAtual.fonte}
        onChange={(e) =>
          atualizarObjeto(objetoAtual.id, {
            fonte: Number(e.target.value),
          })
        }
        className="phanyx-crachas-input"
      />
    </div>

    <div>
      <label className="mb-2 block font-semibold">
        Cor
      </label>

      <input
        type="color"
        value={objetoAtual.cor}
        onChange={(e) =>
          atualizarObjeto(objetoAtual.id, {
            cor: e.target.value,
          })
        }
        className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
      />
    </div>
  </div>
)}

          <div className="mt-6">

            <label className="mb-2 block font-semibold">
              Formato
            </label>

            <select
              value={formato}
              onChange={(e) =>
                setFormato(e.target.value as any)
              }
              className="phanyx-crachas-input"
            >
              <option value="RETRATO">Retrato</option>

              <option value="PAISAGEM">Paisagem</option>

              <option value="QUADRADO">Quadrado</option>

              <option value="REDONDO">Redondo</option>

              <option value="PERSONALIZADO">
                Personalizado
              </option>

            </select>

          </div>

        </div>

      </div>

    </div>
  );
}
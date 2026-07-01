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
      alinhamento: "left" | "center" | "right";
      largura: number;
      altura: number;
    }
  | {
    id: number;
    tipo: "CAMPO";
    campo: string;
    rotulo: string;
    x: number;
    y: number;
    fonte: number;
    cor: string;
    alinhamento: "left" | "center" | "right";
    largura: number;
    altura: number;
  }
  | {
    id: number;
    tipo: "IMAGEM";
    origem: "FOTO" | "LOGO" | "UPLOAD";
    rotulo: string;
    url?: string;
    x: number;
    y: number;
    largura: number;
    altura: number;
    raioBorda: number;
  };

export default function CrachasClient() {
  const [lado, setLado] = useState<"FRENTE" | "VERSO">("FRENTE");

  const [formato, setFormato] = useState<
    "RETRATO" | "PAISAGEM" | "QUADRADO" | "REDONDO" | "PERSONALIZADO"
  >("RETRATO");

  const [corFundoFrente, setCorFundoFrente] =
  useState<string>("#ffffff");

const [corFundoVerso, setCorFundoVerso] =
  useState<string>("#ffffff");

const [objetosFrente, setObjetosFrente] =
  useState<ObjetoCracha[]>([]);

const [objetosVerso, setObjetosVerso] =
  useState<ObjetoCracha[]>([]);

const [objetoSelecionado, setObjetoSelecionado] =
  useState<number | null>(null);

const objetos =
  lado === "FRENTE" ? objetosFrente : objetosVerso;

const setObjetos =
  lado === "FRENTE" ? setObjetosFrente : setObjetosVerso;

const corFundoCracha =
  lado === "FRENTE" ? corFundoFrente : corFundoVerso;

const setCorFundoCracha =
  lado === "FRENTE" ? setCorFundoFrente : setCorFundoVerso;

const objetoAtual = objetos.find((obj) => obj.id === objetoSelecionado);

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
        alinhamento: "left",
        largura: 120,
        altura: 32,
      },
    ]);
  }

  function adicionarCampoDinamico() {
  setObjetos((atual) => [
    ...atual,
    {
      id: Date.now(),
      tipo: "CAMPO",
      campo: "{{alunoNome}}",
      rotulo: "Nome do aluno",
      x: 30,
      y: 80,
      fonte: 16,
      cor: "#000000",
      alinhamento: "left",
      largura: 150,
      altura: 32,
    },
  ]);
}

function adicionarFoto() {
  setObjetos((atual) => [
    ...atual,
    {
      id: Date.now(),
      tipo: "IMAGEM",
      origem: "FOTO",
      rotulo: "Foto",
      x: 70,
      y: 90,
      largura: 100,
      altura: 120,
      raioBorda: 50,
    },
  ]);
}

function adicionarLogo() {
  setObjetos((atual) => [
    ...atual,
    {
      id: Date.now(),
      tipo: "IMAGEM",
      origem: "LOGO",
      rotulo: "Logo",
      x: 70,
      y: 20,
      largura: 100,
      altura: 50,
      raioBorda: 8,
    },
  ]);
}

  function atualizarObjeto(id: number, dados: Partial<ObjetoCracha>) {
    setObjetos((atual) =>
      atual.map((obj) =>
        obj.id === id ? ({ ...obj, ...dados } as ObjetoCracha) : obj
      )
    );
  }

  function alinharCaixaTexto(alinhamentoCaixa: "left" | "center" | "right") {
    if (!objetoAtual || objetoAtual.tipo !== "TEXTO") return;

    const larguraCracha =
      formato === "RETRATO"
        ? 240
        : formato === "PAISAGEM"
        ? 380
        : 260;

    let novoX = objetoAtual.x;

    if (alinhamentoCaixa === "left") {
      novoX = 10;
    }

    if (alinhamentoCaixa === "center") {
      novoX = (larguraCracha - objetoAtual.largura) / 2;
    }

    if (alinhamentoCaixa === "right") {
      novoX = larguraCracha - objetoAtual.largura - 10;
    }

    atualizarObjeto(objetoAtual.id, {
      x: novoX,
    });
  }

function redimensionarTexto(
  e: React.MouseEvent<HTMLSpanElement>,
  objeto: Extract<ObjetoCracha, { tipo: "TEXTO" }>,
  canto: "nw" | "ne" | "sw" | "se"
) {
  e.preventDefault();
  e.stopPropagation();

  setObjetoSelecionado(objeto.id);

  const inicioX = e.clientX;
  const inicioY = e.clientY;

  const xOriginal = objeto.x;
  const yOriginal = objeto.y;
  const larguraOriginal = objeto.largura;
  const alturaOriginal = objeto.altura;

  function mover(ev: MouseEvent) {
    const dx = ev.clientX - inicioX;
    const dy = ev.clientY - inicioY;

    let novoX = xOriginal;
    let novoY = yOriginal;
    let novaLargura = larguraOriginal;
    let novaAltura = alturaOriginal;

    if (canto === "se") {
      novaLargura = larguraOriginal + dx;
      novaAltura = alturaOriginal + dy;
    }

    if (canto === "sw") {
      novoX = xOriginal + dx;
      novaLargura = larguraOriginal - dx;
      novaAltura = alturaOriginal + dy;
    }

    if (canto === "ne") {
      novoY = yOriginal + dy;
      novaLargura = larguraOriginal + dx;
      novaAltura = alturaOriginal - dy;
    }

    if (canto === "nw") {
      novoX = xOriginal + dx;
      novoY = yOriginal + dy;
      novaLargura = larguraOriginal - dx;
      novaAltura = alturaOriginal - dy;
    }

    atualizarObjeto(objeto.id, {
      x: novoX,
      y: novoY,
      largura: Math.max(30, novaLargura),
      altura: Math.max(18, novaAltura),
    });
  }

  function soltar() {
    window.removeEventListener("mousemove", mover);
    window.removeEventListener("mouseup", soltar);
  }

  window.addEventListener("mousemove", mover);
  window.addEventListener("mouseup", soltar);
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
            type="button"
            onClick={() => {
  setLado("FRENTE");
  setObjetoSelecionado(null);
}}
            className={`rounded-xl px-4 py-2 font-semibold ${
              lado === "FRENTE"
                ? "bg-blue-600 text-white"
                : "phanyx-crachas-tab-off"
            }`}
          >
            Frente
          </button>

          <button
            type="button"
            onClick={() => {
  setLado("VERSO");
  setObjetoSelecionado(null);
}}
            className={`rounded-xl px-4 py-2 font-semibold ${
              lado === "VERSO"
                ? "bg-blue-600 text-white"
                : "phanyx-crachas-tab-off"
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
              className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              📝 Texto
            </button>

            <button
  type="button"
  onClick={adicionarCampoDinamico}
  className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
>
  🏷️ Campo
</button>

            <button
  type="button"
  onClick={adicionarFoto}
  className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
>
  👤 Foto
</button>

            <button
  type="button"
  onClick={adicionarLogo}
  className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
>
  🏫 Logo
</button>

            <button
              type="button"
              className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              🖼️ Imagem
            </button>

            <button
              type="button"
              className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              ⬛ Forma
            </button>

            <button
              type="button"
              className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              🔳 QR Code
            </button>

            <button
              type="button"
              className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              ▌ Código de Barras
            </button>
          </div>
        </div>

        {/* Canvas */}

        <div className="phanyx-crachas-card phanyx-crachas-canvas-area col-span-8 flex items-center justify-center p-8">
          <div
            className="phanyx-cracha-paper relative overflow-hidden shadow-xl"
            style={{
              ["--cor-fundo-cracha" as any]: corFundoCracha,
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
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      setObjetoSelecionado(objeto.id);

                      const inicioX = e.clientX;
                      const inicioY = e.clientY;
                      const xOriginal = objeto.x;
                      const yOriginal = objeto.y;

                      function mover(ev: MouseEvent) {
                        const novoX = xOriginal + ev.clientX - inicioX;
                        const novoY = yOriginal + ev.clientY - inicioY;

                        atualizarObjeto(objeto.id, {
                          x: novoX,
                          y: novoY,
                        });
                      }

                      function soltar() {
                        window.removeEventListener("mousemove", mover);
                        window.removeEventListener("mouseup", soltar);
                      }

                      window.addEventListener("mousemove", mover);
                      window.addEventListener("mouseup", soltar);
                    }}
                    style={{
  position: "absolute",
  left: objeto.x,
  top: objeto.y,
  width: objeto.largura,
  height: objeto.altura,
  fontSize: objeto.fonte,
  color: objeto.cor,
  cursor: "move",
  padding: "2px 4px",
  textAlign: objeto.alinhamento,
  display: "flex",
  alignItems: "center",
  overflow: "visible",
  border:
    objetoSelecionado === objeto.id
      ? "1px dashed #2563eb"
      : "1px solid transparent",
}}
                  >
  {objeto.texto}

  {objetoSelecionado === objeto.id && (
    <>
      <span
        onMouseDown={(e) => redimensionarTexto(e, objeto, "nw")}
        className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full border border-blue-600 bg-white"
        style={{ cursor: "nwse-resize" }}
      />

      <span
        onMouseDown={(e) => redimensionarTexto(e, objeto, "ne")}
        className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full border border-blue-600 bg-white"
        style={{ cursor: "nesw-resize" }}
      />

      <span
        onMouseDown={(e) => redimensionarTexto(e, objeto, "sw")}
        className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full border border-blue-600 bg-white"
        style={{ cursor: "nesw-resize" }}
      />

      <span
        onMouseDown={(e) => redimensionarTexto(e, objeto, "se")}
        className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-full border border-blue-600 bg-white"
        style={{ cursor: "nwse-resize" }}
      />
    </>
  )}
</div>
                );
              }

              if (objeto.tipo === "CAMPO") {
  return (
    <div
      key={objeto.id}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();

        setObjetoSelecionado(objeto.id);

        const inicioX = e.clientX;
        const inicioY = e.clientY;
        const xOriginal = objeto.x;
        const yOriginal = objeto.y;

        function mover(ev: MouseEvent) {
          const novoX = xOriginal + ev.clientX - inicioX;
          const novoY = yOriginal + ev.clientY - inicioY;

          atualizarObjeto(objeto.id, {
            x: novoX,
            y: novoY,
          });
        }

        function soltar() {
          window.removeEventListener("mousemove", mover);
          window.removeEventListener("mouseup", soltar);
        }

        window.addEventListener("mousemove", mover);
        window.addEventListener("mouseup", soltar);
      }}
      style={{
        position: "absolute",
        left: objeto.x,
        top: objeto.y,
        width: objeto.largura,
        height: objeto.altura,
        fontSize: objeto.fonte,
        color: objeto.cor,
        cursor: "move",
        padding: "2px 4px",
        textAlign: objeto.alinhamento,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        border:
          objetoSelecionado === objeto.id
            ? "1px dashed #2563eb"
            : "1px solid transparent",
      }}
    >
      {objeto.campo}
    </div>
  );
}

if (objeto.tipo === "IMAGEM") {
  return (
    <div
      key={objeto.id}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();

        setObjetoSelecionado(objeto.id);

        const inicioX = e.clientX;
        const inicioY = e.clientY;
        const xOriginal = objeto.x;
        const yOriginal = objeto.y;

        function mover(ev: MouseEvent) {
          const novoX = xOriginal + ev.clientX - inicioX;
          const novoY = yOriginal + ev.clientY - inicioY;

          atualizarObjeto(objeto.id, {
            x: novoX,
            y: novoY,
          });
        }

        function soltar() {
          window.removeEventListener("mousemove", mover);
          window.removeEventListener("mouseup", soltar);
        }

        window.addEventListener("mousemove", mover);
        window.addEventListener("mouseup", soltar);
      }}
      style={{
        position: "absolute",
        left: objeto.x,
        top: objeto.y,
        width: objeto.largura,
        height: objeto.altura,
        borderRadius: objeto.raioBorda,
        cursor: "move",
        overflow: "hidden",
        border:
          objetoSelecionado === objeto.id
            ? "1px dashed #2563eb"
            : "1px solid #94a3b8",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#334155",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {objeto.url ? (
        <img
          src={objeto.url}
          alt={objeto.rotulo}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{objeto.rotulo}</span>
      )}
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-2 block font-semibold">
                    Largura
                  </label>

                  <input
                    type="number"
                    value={objetoAtual.largura}
                    onChange={(e) =>
                      atualizarObjeto(objetoAtual.id, {
                        largura: Number(e.target.value),
                      })
                    }
                    className="phanyx-crachas-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-semibold">
                    Altura
                  </label>

                  <input
                    type="number"
                    value={objetoAtual.altura}
                    onChange={(e) =>
                      atualizarObjeto(objetoAtual.id, {
                        altura: Number(e.target.value),
                      })
                    }
                    className="phanyx-crachas-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-2 block font-semibold">
                    X
                  </label>

                  <input
                    type="number"
                    value={Math.round(objetoAtual.x)}
                    onChange={(e) =>
                      atualizarObjeto(objetoAtual.id, {
                        x: Number(e.target.value),
                      })
                    }
                    className="phanyx-crachas-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-semibold">
                    Y
                  </label>

                  <input
                    type="number"
                    value={Math.round(objetoAtual.y)}
                    onChange={(e) =>
                      atualizarObjeto(objetoAtual.id, {
                        y: Number(e.target.value),
                      })
                    }
                    className="phanyx-crachas-input"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block font-semibold">
                  Alinhar caixa
                </label>

                <div className="flex gap-2">
                  {[
                    { valor: "left", label: "←" },
                    { valor: "center", label: "↔" },
                    { valor: "right", label: "→" },
                  ].map((item) => (
                    <button
                      key={item.valor}
                      type="button"
                      onClick={() =>
                        alinharCaixaTexto(
                          item.valor as "left" | "center" | "right"
                        )
                      }
                      className={`h-10 w-10 rounded-xl border text-lg font-bold transition ${
                        item.valor === "center"
                          ? "border-slate-400"
                          : "border-slate-400"
                      } hover:bg-blue-600 hover:text-white`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
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

{objetoAtual?.tipo === "CAMPO" && (
  <div className="space-y-4">
    <div>
      <label className="mb-2 block font-semibold">
        Campo dinâmico
      </label>

      <select
        value={objetoAtual.campo}
        onChange={(e) =>
          atualizarObjeto(objetoAtual.id, {
            campo: e.target.value,
          })
        }
        className="phanyx-crachas-input"
      >
        <option value="{{alunoNome}}">Aluno - Nome</option>
        <option value="{{alunoMatricula}}">Aluno - Matrícula</option>
        <option value="{{cursoNome}}">Aluno - Curso</option>
        <option value="{{turmaNome}}">Aluno - Turma</option>
        <option value="{{funcionarioNome}}">Funcionário - Nome</option>
        <option value="{{funcionarioCargo}}">Funcionário - Cargo</option>
        <option value="{{funcionarioDepartamento}}">
          Funcionário - Departamento
        </option>
        <option value="{{professorNome}}">Professor - Nome</option>
        <option value="{{instituicaoNome}}">Instituição - Nome</option>
      </select>
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

    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="mb-2 block font-semibold">
          X
        </label>

        <input
          type="number"
          value={Math.round(objetoAtual.x)}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              x: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>

      <div>
        <label className="mb-2 block font-semibold">
          Y
        </label>

        <input
          type="number"
          value={Math.round(objetoAtual.y)}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              y: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="mb-2 block font-semibold">
          Largura
        </label>

        <input
          type="number"
          value={objetoAtual.largura}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              largura: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>

      <div>
        <label className="mb-2 block font-semibold">
          Altura
        </label>

        <input
          type="number"
          value={objetoAtual.altura}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              altura: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>
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

{objetoAtual?.tipo === "IMAGEM" && (
  <div className="space-y-4">
    <div>
      <label className="mb-2 block font-semibold">
        Tipo de imagem
      </label>

      <select
        value={objetoAtual.origem}
        onChange={(e) =>
          atualizarObjeto(objetoAtual.id, {
            origem: e.target.value as "FOTO" | "LOGO" | "UPLOAD",
            rotulo:
              e.target.value === "FOTO"
                ? "Foto"
                : e.target.value === "LOGO"
                ? "Logo"
                : "Imagem",
          })
        }
        className="phanyx-crachas-input"
      >
        <option value="FOTO">Foto da pessoa</option>
        <option value="LOGO">Logo da instituição</option>
        <option value="UPLOAD">Imagem enviada</option>
      </select>
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="mb-2 block font-semibold">X</label>
        <input
          type="number"
          value={Math.round(objetoAtual.x)}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              x: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>

      <div>
        <label className="mb-2 block font-semibold">Y</label>
        <input
          type="number"
          value={Math.round(objetoAtual.y)}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              y: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="mb-2 block font-semibold">Largura</label>
        <input
          type="number"
          value={objetoAtual.largura}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              largura: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>

      <div>
        <label className="mb-2 block font-semibold">Altura</label>
        <input
          type="number"
          value={objetoAtual.altura}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              altura: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>
    </div>

    <div>
      <label className="mb-2 block font-semibold">
        Arredondamento
      </label>

      <input
        type="number"
        value={objetoAtual.raioBorda}
        onChange={(e) =>
          atualizarObjeto(objetoAtual.id, {
            raioBorda: Number(e.target.value),
          })
        }
        className="phanyx-crachas-input"
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

          <div className="mt-6">
            <label className="mb-2 block font-semibold">
              Cor de fundo
            </label>

            <input
              type="color"
              value={corFundoCracha}
              onChange={(e) => setCorFundoCracha(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
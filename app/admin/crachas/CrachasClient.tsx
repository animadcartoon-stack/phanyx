"use client";

import { useEffect, useRef, useState } from "react";

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
      sombraAtiva?: boolean;
      sombraX?: number;
      sombraY?: number;
      sombraBlur?: number;
      sombraCor?: string;
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
    ajusteImagem: "cover" | "contain";
    sombraAtiva?: boolean;
    sombraModo?: "DROP" | "BOX";
    sombraX?: number;
    sombraY?: number;
    sombraBlur?: number;
    sombraCor?: string;
  };

  type TipoFuroCracha =
  | "SEM_FURO"
  | "RASGO_HORIZONTAL"
  | "RASGO_VERTICAL"
  | "FURO_REDONDO"
  | "FURO_DUPLO";

export default function CrachasClient() {
  const [lado, setLado] = useState<"FRENTE" | "VERSO">("FRENTE");

  const [formato, setFormato] = useState<
    "RETRATO" | "PAISAGEM" | "QUADRADO" | "REDONDO" | "PERSONALIZADO"
  >("RETRATO");

  const [corFundoFrente, setCorFundoFrente] =
  useState<string>("#ffffff");

  const [tipoFuroCracha, setTipoFuroCracha] =
  useState<TipoFuroCracha>("RASGO_HORIZONTAL");

const [corFundoVerso, setCorFundoVerso] =
  useState<string>("#ffffff");

const [objetosFrente, setObjetosFrente] =
  useState<ObjetoCracha[]>([]);

const [objetosVerso, setObjetosVerso] =
  useState<ObjetoCracha[]>([]);

const [objetoSelecionado, setObjetoSelecionado] =
  useState<number | null>(null);

const inputImagemRef = useRef<HTMLInputElement | null>(null);
const inputImagemObjetoRef = useRef<HTMLInputElement | null>(null);

const [avisoCracha, setAvisoCracha] = useState<{
  tipo: "sucesso" | "erro";
  texto: string;
} | null>(null);  

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
        sombraAtiva: false,
        sombraX: 2,
        sombraY: 2,
        sombraBlur: 4,
        sombraCor: "#000000",
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
      ajusteImagem: "cover",
      sombraAtiva: false,
      sombraModo: "DROP",
      sombraX: 2,
      sombraY: 2,
      sombraBlur: 6,
      sombraCor: "#000000",
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
      ajusteImagem: "contain",
      sombraAtiva: false,
      sombraModo: "DROP",
      sombraX: 2,
      sombraY: 2,
      sombraBlur: 6,
      sombraCor: "#000000",
    },
  ]);
}

async function handleUploadImagem(e: React.ChangeEvent<HTMLInputElement>) {
  const arquivo = e.target.files?.[0];

  if (!arquivo) return;

  try {
    const formData = new FormData();
    formData.append("file", arquivo);

    const resp = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const json = await resp.json();

    if (!resp.ok) {
      throw new Error(json.error || "Erro ao enviar imagem.");
    }

    const url =
      json.url ||
      json.fileUrl ||
      json.arquivoUrl ||
      json.publicUrl;

    if (!url) {
      throw new Error("Upload realizado, mas a URL da imagem não retornou.");
    }

    setObjetos((atual) => [
      ...atual,
      {
        id: Date.now(),
        tipo: "IMAGEM",
        origem: "UPLOAD",
        rotulo: "Imagem",
        url,
        x: 60,
        y: 60,
        largura: 120,
        altura: 80,
        raioBorda: 8,
        ajusteImagem: "cover",
        sombraAtiva: false,
        sombraModo: "DROP",
        sombraX: 2,
        sombraY: 2,
        sombraBlur: 6,
        sombraCor: "#000000",
      },
    ]);

    setAvisoCracha({
      tipo: "sucesso",
      texto: "Imagem adicionada ao crachá.",
    });

    setTimeout(() => setAvisoCracha(null), 3000);
  } catch (error) {
    console.error(error);

    setAvisoCracha({
      tipo: "erro",
      texto:
        error instanceof Error
          ? error.message
          : "Erro ao enviar imagem.",
    });

    setTimeout(() => setAvisoCracha(null), 4000);
  } finally {
    e.target.value = "";
  }
}

async function handleUploadImagemObjeto(
  e: React.ChangeEvent<HTMLInputElement>
) {
  const arquivo = e.target.files?.[0];

  if (!arquivo || !objetoAtual || objetoAtual.tipo !== "IMAGEM") return;

  const tiposPermitidos = ["image/png", "image/jpeg", "image/webp"];

  if (!tiposPermitidos.includes(arquivo.type)) {
    setAvisoCracha({
      tipo: "erro",
      texto: "Use imagem em PNG, JPG, JPEG ou WEBP. O formato TIFF não é exibido corretamente no navegador.",
    });

    setTimeout(() => setAvisoCracha(null), 5000);
    e.target.value = "";
    return;
  }

  try {
    const previewUrl = URL.createObjectURL(arquivo);

    atualizarObjeto(objetoAtual.id, {
      url: previewUrl,
      origem: "UPLOAD",
      rotulo: "Imagem",
    });

    setAvisoCracha({
      tipo: "sucesso",
      texto: "Imagem aplicada ao crachá.",
    });

    setTimeout(() => setAvisoCracha(null), 3000);
  } catch (error) {
    console.error(error);

    setAvisoCracha({
      tipo: "erro",
      texto: "Erro ao aplicar imagem ao crachá.",
    });

    setTimeout(() => setAvisoCracha(null), 4000);
  } finally {
    e.target.value = "";
  }
}

  function atualizarObjeto(id: number, dados: Partial<ObjetoCracha>) {
    setObjetos((atual) =>
      atual.map((obj) =>
        obj.id === id ? ({ ...obj, ...dados } as ObjetoCracha) : obj
      )
    );
  }

  function excluirObjetoSelecionado() {
  if (!objetoSelecionado) return;

  setObjetos((atual) =>
    atual.filter((obj) => obj.id !== objetoSelecionado)
  );

  setObjetoSelecionado(null);
}

useEffect(() => {
  function aoPressionarTecla(e: KeyboardEvent) {
    if (!objetoSelecionado) return;

    const alvo = e.target as HTMLElement | null;
    const tag = alvo?.tagName?.toLowerCase();

    const estaDigitando =
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      alvo?.isContentEditable;

    if (estaDigitando) return;

    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      excluirObjetoSelecionado();
    }

    if (e.key === "Escape") {
      setObjetoSelecionado(null);
    }
  }

  window.addEventListener("keydown", aoPressionarTecla);

  return () => {
    window.removeEventListener("keydown", aoPressionarTecla);
  };
}, [objetoSelecionado, lado]);

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

  function sombraTextoCss(objeto: Extract<ObjetoCracha, { tipo: "TEXTO" }>) {
  if (!objeto.sombraAtiva) return "none";

  return `${objeto.sombraX ?? 2}px ${objeto.sombraY ?? 2}px ${
    objeto.sombraBlur ?? 4
  }px ${objeto.sombraCor ?? "#000000"}`;
}

function sombraImagemDropCss(
  objeto: Extract<ObjetoCracha, { tipo: "IMAGEM" }>
) {
  if (!objeto.sombraAtiva || objeto.sombraModo !== "DROP") return "none";

  return `drop-shadow(${objeto.sombraX ?? 2}px ${objeto.sombraY ?? 2}px ${
    objeto.sombraBlur ?? 6
  }px ${objeto.sombraCor ?? "#000000"})`;
}

function sombraImagemBoxCss(
  objeto: Extract<ObjetoCracha, { tipo: "IMAGEM" }>
) {
  if (!objeto.sombraAtiva || objeto.sombraModo !== "BOX") return "none";

  return `${objeto.sombraX ?? 2}px ${objeto.sombraY ?? 2}px ${
    objeto.sombraBlur ?? 6
  }px ${objeto.sombraCor ?? "#000000"}`;
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

function redimensionarImagem(
  e: React.MouseEvent<HTMLSpanElement>,
  objeto: Extract<ObjetoCracha, { tipo: "IMAGEM" }>,
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
      largura: Math.max(20, novaLargura),
      altura: Math.max(20, novaAltura),
    });
  }

  function soltar() {
    window.removeEventListener("mousemove", mover);
    window.removeEventListener("mouseup", soltar);
  }

  window.addEventListener("mousemove", mover);
  window.addEventListener("mouseup", soltar);
}

function BotaoExcluirObjeto() {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        excluirObjetoSelecionado();
      }}
      className="absolute -right-3 -top-3 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-red-500 bg-red-600 text-xs font-bold text-white shadow hover:bg-red-700"
      title="Excluir objeto"
    >
      ×
    </button>
  );
}

function renderFuroCracha() {
  if (tipoFuroCracha === "SEM_FURO") return null;

  const baseClass =
    "pointer-events-none absolute z-10 border border-slate-400 bg-slate-200 shadow-inner";

  if (tipoFuroCracha === "RASGO_HORIZONTAL") {
    return (
      <div
        className={baseClass}
        style={{
          top: formato === "PAISAGEM" ? 10 : 12,
          left: "50%",
          width: formato === "PAISAGEM" ? 56 : 46,
          height: 12,
          borderRadius: 999,
          transform: "translateX(-50%)",
        }}
      />
    );
  }

  if (tipoFuroCracha === "RASGO_VERTICAL") {
    return (
      <div
        className={baseClass}
        style={{
          top: "50%",
          left: formato === "PAISAGEM" ? 12 : 10,
          width: 12,
          height: 44,
          borderRadius: 999,
          transform: "translateY(-50%)",
        }}
      />
    );
  }

  if (tipoFuroCracha === "FURO_REDONDO") {
    return (
      <div
        className={baseClass}
        style={{
          top: formato === "REDONDO" ? 16 : 14,
          left: "50%",
          width: 18,
          height: 18,
          borderRadius: 999,
          transform: "translateX(-50%)",
        }}
      />
    );
  }

  if (tipoFuroCracha === "FURO_DUPLO") {
    return (
      <>
        <div
          className={baseClass}
          style={{
            top: 14,
            left: "42%",
            width: 14,
            height: 14,
            borderRadius: 999,
            transform: "translateX(-50%)",
          }}
        />

        <div
          className={baseClass}
          style={{
            top: 14,
            left: "58%",
            width: 14,
            height: 14,
            borderRadius: 999,
            transform: "translateX(-50%)",
          }}
        />
      </>
    );
  }

  return null;
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

{avisoCracha && (
  <div
    className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
      avisoCracha.tipo === "sucesso"
        ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
        : "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200"
    }`}
  >
    {avisoCracha.texto}
  </div>
)}

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
  onClick={() => inputImagemRef.current?.click()}
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
            <input
  ref={inputImagemRef}
  type="file"
  accept="image/*"
  onChange={handleUploadImagem}
  className="hidden"
/>
          </div>
        </div>

        {/* Canvas */}

<div className="phanyx-crachas-card phanyx-crachas-canvas-area col-span-7 flex items-center justify-center p-8">
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

            {renderFuroCracha()}

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
  textShadow: sombraTextoCss(objeto),
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
  {objetoSelecionado === objeto.id && <BotaoExcluirObjeto />}

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
      {objetoSelecionado === objeto.id && <BotaoExcluirObjeto />}
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
        cursor: "move",
        overflow: "visible",
        border:
          objetoSelecionado === objeto.id
            ? "1px dashed #2563eb"
            : objeto.url
            ? "1px solid transparent"
            : "1px solid #94a3b8",
        borderRadius: objeto.raioBorda,
        boxShadow: sombraImagemBoxCss(objeto),
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: objeto.raioBorda,
          overflow: "hidden",
          background: objeto.url ? "transparent" : "#f8fafc",
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
            className="h-full w-full"
            style={{
              objectFit: objeto.ajusteImagem || "contain",
              background: "transparent",
              filter: sombraImagemDropCss(objeto),
            }}
          />
        ) : (
          <span>{objeto.rotulo}</span>
        )}
      </div>

      {objetoSelecionado === objeto.id && <BotaoExcluirObjeto />}
      {objetoSelecionado === objeto.id && (
  <>
    <span
      onMouseDown={(e) => redimensionarImagem(e, objeto, "nw")}
      className="absolute -left-1.5 -top-1.5 z-20 h-3 w-3 rounded-full border border-blue-600 bg-white shadow"
      style={{ cursor: "nwse-resize" }}
    />

    <span
      onMouseDown={(e) => redimensionarImagem(e, objeto, "ne")}
      className="absolute -right-1.5 -top-1.5 z-20 h-3 w-3 rounded-full border border-blue-600 bg-white shadow"
      style={{ cursor: "nesw-resize" }}
    />

    <span
      onMouseDown={(e) => redimensionarImagem(e, objeto, "sw")}
      className="absolute -bottom-1.5 -left-1.5 z-20 h-3 w-3 rounded-full border border-blue-600 bg-white shadow"
      style={{ cursor: "nesw-resize" }}
    />

    <span
      onMouseDown={(e) => redimensionarImagem(e, objeto, "se")}
      className="absolute -bottom-1.5 -right-1.5 z-20 h-3 w-3 rounded-full border border-blue-600 bg-white shadow"
      style={{ cursor: "nwse-resize" }}
    />
  </>
)}
    </div>
  );
}

              return null;
            })}
          </div>
        </div>

        {/* Propriedades */}

<div className="phanyx-crachas-card col-span-3 h-[calc(100vh-260px)] min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain p-4 pr-3 pb-28">
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

<div className="rounded-2xl border border-slate-700/40 p-3">
  <label className="mb-3 flex items-center gap-2 font-semibold">
    <input
      type="checkbox"
      checked={!!objetoAtual.sombraAtiva}
      onChange={(e) =>
        atualizarObjeto(objetoAtual.id, {
          sombraAtiva: e.target.checked,
        })
      }
    />
    Sombra do texto
  </label>

  {objetoAtual.sombraAtiva && (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold">X</label>
          <input
            type="number"
            value={objetoAtual.sombraX ?? 2}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                sombraX: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">Y</label>
          <input
            type="number"
            value={objetoAtual.sombraY ?? 2}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                sombraY: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">Blur</label>
          <input
            type="number"
            value={objetoAtual.sombraBlur ?? 4}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                sombraBlur: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold">
          Cor da sombra
        </label>
        <input
          type="color"
          value={objetoAtual.sombraCor ?? "#000000"}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              sombraCor: e.target.value,
            })
          }
          className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
        />
      </div>
    </div>
  )}
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
<div>
  <label className="mb-2 block font-semibold">
    Encaixe da imagem
  </label>

  <select
    value={objetoAtual.ajusteImagem}
    onChange={(e) =>
      atualizarObjeto(objetoAtual.id, {
        ajusteImagem: e.target.value as "cover" | "contain",
      })
    }
    className="phanyx-crachas-input"
  >
    <option value="cover">Preencher cortando</option>
    <option value="contain">Mostrar inteira</option>
  </select>
</div>
<div>
  <label className="mb-2 block font-semibold">
    Imagem
  </label>

  <button
    type="button"
    onClick={() => inputImagemObjetoRef.current?.click()}
    className="phanyx-crachas-button-secondary w-full"
  >
    Escolher imagem
  </button>

  <input
  ref={inputImagemObjetoRef}
  type="file"
  accept="image/png,image/jpeg,image/webp"
  onChange={handleUploadImagemObjeto}
  className="hidden"
/>
</div>

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
        <label className="mb-2 block text-xs font-semibold">
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
        <label className="mb-2 block text-xs font-semibold">
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

<div className="rounded-2xl border border-slate-700/40 p-3">
  <label className="mb-3 flex items-center gap-2 font-semibold">
    <input
      type="checkbox"
      checked={!!objetoAtual.sombraAtiva}
      onChange={(e) =>
        atualizarObjeto(objetoAtual.id, {
          sombraAtiva: e.target.checked,
        })
      }
    />
    Sombra da imagem
  </label>

  {objetoAtual.sombraAtiva && (
    <div className="space-y-3">
      <div>
        <label className="mb-2 block text-xs font-semibold">
          Tipo de sombra
        </label>

        <select
          value={objetoAtual.sombraModo ?? "DROP"}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              sombraModo: e.target.value as "DROP" | "BOX",
            })
          }
          className="phanyx-crachas-input"
        >
          <option value="DROP">Contorno da imagem</option>
          <option value="BOX">Caixa retangular</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold">X</label>
          <input
            type="number"
            value={objetoAtual.sombraX ?? 2}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                sombraX: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">Y</label>
          <input
            type="number"
            value={objetoAtual.sombraY ?? 2}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                sombraY: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">Blur</label>
          <input
            type="number"
            value={objetoAtual.sombraBlur ?? 6}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                sombraBlur: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold">
          Cor da sombra
        </label>

        <input
          type="color"
          value={objetoAtual.sombraCor ?? "#000000"}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              sombraCor: e.target.value,
            })
          }
          className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
        />
      </div>
    </div>
  )}
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
    Furo / encaixe do crachá
  </label>

  <select
    value={tipoFuroCracha}
    onChange={(e) =>
      setTipoFuroCracha(e.target.value as TipoFuroCracha)
    }
    className="phanyx-crachas-input"
  >
    <option value="SEM_FURO">Sem furo</option>
    <option value="RASGO_HORIZONTAL">Rasgo horizontal superior</option>
    <option value="RASGO_VERTICAL">Rasgo vertical lateral</option>
    <option value="FURO_REDONDO">Furo redondo superior</option>
    <option value="FURO_DUPLO">Dois furos superiores</option>
  </select>

  <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">
    Simulação visual do local do cordão, presilha ou clip do crachá.
  </p>
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
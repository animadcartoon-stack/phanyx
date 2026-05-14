"use client";

import { useEffect, useRef, useState } from "react";

type DownloadTipo = "png" | "jpg" | "webp";
type ModoRemocao = "assinatura" | "objeto";

export default function RemovedorDeFundoClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [imagemOriginal, setImagemOriginal] = useState<string | null>(null);
  const [imagemFinal, setImagemFinal] = useState<string | null>(null);
  
  const [fundoPreview, setFundoPreview] = useState<"xadrez" | "verde" | "azul" | "preto" | "branco">("verde");

  const [dimensoesImagem, setDimensoesImagem] = useState<{
  largura: number;
  altura: number;
} | null>(null);

  const [sensibilidade, setSensibilidade] = useState(32);
  const [suavizacao, setSuavizacao] = useState(2);
  const [brilho, setBrilho] = useState(100);
  const [contraste, setContraste] = useState(130);
  const [saturacao, setSaturacao] = useState(100);
  const [opacidade, setOpacidade] = useState(100);
  const [zoomResultado, setZoomResultado] = useState(1);
  const [intensidadeTraco, setIntensidadeTraco] = useState(60);
  const [modo, setModo] = useState<ModoRemocao>("assinatura");
  const [manterObjetoPrincipal, setManterObjetoPrincipal] = useState(false);
  const [removerBrancoInterno, setRemoverBrancoInterno] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);

  function carregarImagem(file: File) {
    setErro("");
    setImagemFinal(null);
    

    if (!file.type.startsWith("image/")) {
      setErro("Envie apenas arquivos de imagem.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErro("A imagem deve ter no máximo 10MB.");
      return;
    }

    const url = URL.createObjectURL(file);

const img = new Image();
img.src = url;

img.onload = () => {
  setDimensoesImagem({
    largura: img.width,
    altura: img.height,
  });

  setImagemOriginal(url);
};
  }

  function pixelIndex(x: number, y: number, width: number) {
    return y * width + x;
  }

  function dataIndex(x: number, y: number, width: number) {
    return (y * width + x) * 4;
  }

  function distanciaCor(
    r: number,
    g: number,
    b: number,
    baseR: number,
    baseG: number,
    baseB: number
  ) {
    return Math.sqrt(
      Math.pow(r - baseR, 2) +
        Math.pow(g - baseG, 2) +
        Math.pow(b - baseB, 2)
    );
  }

  function ajustarCanal(valor: number, brilhoAtual: number, contrasteAtual: number) {
    let v = valor;

    v = v * (brilhoAtual / 100);

    const fator = contrasteAtual / 100;
    v = (v - 128) * fator + 128;

    return Math.max(0, Math.min(255, v));
  }

  function aplicarSaturacao(
    r: number,
    g: number,
    b: number,
    saturacaoAtual: number
  ) {
    const cinza = 0.299 * r + 0.587 * g + 0.114 * b;
    const fator = saturacaoAtual / 100;

    return {
      r: Math.max(0, Math.min(255, cinza + (r - cinza) * fator)),
      g: Math.max(0, Math.min(255, cinza + (g - cinza) * fator)),
      b: Math.max(0, Math.min(255, cinza + (b - cinza) * fator)),
    };
  }

  function encontrarObjetoPrincipal(
    alpha: Uint8Array,
    width: number,
    height: number
  ) {
    const visitado = new Uint8Array(width * height);
    let melhorComponente: number[] = [];

    const direcoes = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const inicio = pixelIndex(x, y, width);

        if (visitado[inicio] || alpha[inicio] === 0) continue;

        const fila: number[] = [inicio];
        const componente: number[] = [];
        visitado[inicio] = 1;

        while (fila.length) {
          const atual = fila.pop()!;
          componente.push(atual);

          const cx = atual % width;
          const cy = Math.floor(atual / width);

          for (const [dx, dy] of direcoes) {
            const nx = cx + dx;
            const ny = cy + dy;

            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

            const np = pixelIndex(nx, ny, width);

            if (!visitado[np] && alpha[np] > 0) {
              visitado[np] = 1;
              fila.push(np);
            }
          }
        }

        if (componente.length > melhorComponente.length) {
          melhorComponente = componente;
        }
      }
    }

    return new Set(melhorComponente);
  }

  function removerFundo() {
    if (!imagemOriginal || !canvasRef.current) return;

    setProcessando(true);
    setErro("");

    const img = new Image();
    img.src = imagemOriginal;

    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (!ctx) {
        setErro("Não foi possível processar a imagem.");
        setProcessando(false);
        return;
      }

      const maxWidth = 1800;
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;

      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const width = canvas.width;
      const height = canvas.height;
      const totalPixels = width * height;

      let pixelsTransparentes = 0;

for (let i = 0; i < totalPixels; i++) {
  const alpha = data[i * 4 + 3];

  if (alpha < 250) {
    pixelsTransparentes++;
  }
}

const percentualTransparente =
  (pixelsTransparentes / totalPixels) * 100;

if (percentualTransparente > 5) {
  setAviso(
    "Essa imagem já está sem fundo. Envie outra imagem com fundo para remover."
  );
  setImagemFinal(null);
  setProcessando(false);
  return;
}

if (modo === "assinatura") {
  const cantos = [
    dataIndex(0, 0, width),
    dataIndex(width - 1, 0, width),
    dataIndex(0, height - 1, width),
    dataIndex(width - 1, height - 1, width),
  ];

  const fundoR = Math.round(cantos.reduce((s, i) => s + data[i], 0) / cantos.length);
  const fundoG = Math.round(cantos.reduce((s, i) => s + data[i + 1], 0) / cantos.length);
  const fundoB = Math.round(cantos.reduce((s, i) => s + data[i + 2], 0) / cantos.length);

  const toleranciaFundo = 45;

  for (let i = 0; i < totalPixels; i++) {
    const di = i * 4;

    const r = data[di];
    const g = data[di + 1];
    const b = data[di + 2];

    const distancia = Math.sqrt(
      Math.pow(r - fundoR, 2) +
      Math.pow(g - fundoG, 2) +
      Math.pow(b - fundoB, 2)
    );

    if (distancia <= toleranciaFundo) {
      data[di + 3] = 0;
    } else {
      data[di] = 0;
      data[di + 1] = 0;
      data[di + 2] = 0;
      data[di + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const resultado = canvas.toDataURL("image/png");
  setImagemFinal(resultado);

  setProcessando(false);
  return;
}

      const remover = new Uint8Array(totalPixels);
      const visitado = new Uint8Array(totalPixels);

      const cantos = [
        dataIndex(0, 0, width),
        dataIndex(width - 1, 0, width),
        dataIndex(0, height - 1, width),
        dataIndex(width - 1, height - 1, width),
      ];

      const baseR = Math.round(
        cantos.reduce((s, i) => s + data[i], 0) / cantos.length
      );
      const baseG = Math.round(
        cantos.reduce((s, i) => s + data[i + 1], 0) / cantos.length
      );
      const baseB = Math.round(
        cantos.reduce((s, i) => s + data[i + 2], 0) / cantos.length
      );

      const tolerancia = Math.max(6, sensibilidade * 0.75);

      const fila: Array<[number, number]> = [];

      for (let x = 0; x < width; x++) {
        fila.push([x, 0], [x, height - 1]);
      }

      for (let y = 0; y < height; y++) {
        fila.push([0, y], [width - 1, y]);
      }

      while (fila.length) {
        const item = fila.pop();
        if (!item) continue;

        const [x, y] = item;

        if (x < 0 || y < 0 || x >= width || y >= height) continue;

        const p = pixelIndex(x, y, width);
        if (visitado[p]) continue;

        visitado[p] = 1;

        const di = dataIndex(x, y, width);
        const r = data[di];
        const g = data[di + 1];
        const b = data[di + 2];

        const dist = distanciaCor(r, g, b, baseR, baseG, baseB);
        const parecidoComFundo = dist <= tolerancia;

if (parecidoComFundo) {
          remover[p] = 1;

          fila.push([x + 1, y]);
          fila.push([x - 1, y]);
          fila.push([x, y + 1]);
          fila.push([x, y - 1]);
        }
      }

      if (removerBrancoInterno && modo === "objeto") {
  const toleranciaInterna = Math.max(10, sensibilidade * 1.2);

  for (let i = 0; i < totalPixels; i++) {
    if (remover[i]) continue;

    const di = i * 4;

    const r = data[di];
    const g = data[di + 1];
    const b = data[di + 2];

    const dist = distanciaCor(r, g, b, baseR, baseG, baseB);
    const brilhoPixel = (r + g + b) / 3;
    const poucaCor =
      Math.abs(r - g) < 18 &&
      Math.abs(r - b) < 18 &&
      Math.abs(g - b) < 18;

    if (dist <= toleranciaInterna && brilhoPixel > 210 && poucaCor) {
      remover[i] = 1;
    }
  }
}

            if (manterObjetoPrincipal && modo === "objeto") {
        const alphaTemp = new Uint8Array(totalPixels);

        for (let i = 0; i < totalPixels; i++) {
          alphaTemp[i] = remover[i] ? 0 : 255;
        }

        const principal = encontrarObjetoPrincipal(alphaTemp, width, height);

        for (let i = 0; i < totalPixels; i++) {
          if (!principal.has(i)) {
            remover[i] = 1;
          }
        }
      }

      for (let i = 0; i < totalPixels; i++) {
        const di = i * 4;

        if (remover[i]) {
          data[di + 3] = 0;
          continue;
        }

        let r = data[di];
        let g = data[di + 1];
        let b = data[di + 2];

        r = ajustarCanal(r, brilho, contraste);
        g = ajustarCanal(g, brilho, contraste);
        b = ajustarCanal(b, brilho, contraste);

        const sat = aplicarSaturacao(r, g, b, saturacao);

        r = sat.r;
        g = sat.g;
        b = sat.b;

        data[di] = r;
        data[di + 1] = g;
        data[di + 2] = b;
        data[di + 3] = Math.round(255 * (opacidade / 100));
      }

      if (suavizacao > 0) {
        const copia = new Uint8ClampedArray(data);

        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const di = dataIndex(x, y, width);

            if (copia[di + 3] === 0) continue;

            let alphaTotal = 0;
            let count = 0;

            for (let yy = -suavizacao; yy <= suavizacao; yy++) {
              for (let xx = -suavizacao; xx <= suavizacao; xx++) {
                const ndi = dataIndex(x + xx, y + yy, width);
                alphaTotal += copia[ndi + 3];
                count++;
              }
            }

            data[di + 3] = alphaTotal / count;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

const resultadoCompleto = canvas.toDataURL("image/png");
setImagemFinal(resultadoCompleto);

setProcessando(false);
    };

    img.onerror = () => {
      setErro("Erro ao carregar imagem.");
      setProcessando(false);
    };
  }

  useEffect(() => {
  if (!imagemOriginal) return;

  const timer = window.setTimeout(() => {
    removerFundo();
  }, 120);

  return () => window.clearTimeout(timer);
}, [
  imagemOriginal,
  sensibilidade,
  suavizacao,
  brilho,
  contraste,
  saturacao,
  opacidade,
  intensidadeTraco,
  modo,
  manterObjetoPrincipal,
  removerBrancoInterno,
]);

  function baixarImagem(tipo: DownloadTipo) {
    if (!imagemFinal || !canvasRef.current) return;

    const canvas = canvasRef.current;
    let url = imagemFinal;

    if (tipo !== "png") {
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;

      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return;

      if (tipo === "jpg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      }

      const img = new Image();
      img.src = imagemFinal;

      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        url =
          tipo === "jpg"
            ? exportCanvas.toDataURL("image/jpeg", 0.95)
            : exportCanvas.toDataURL("image/webp", 0.95);

        const link = document.createElement("a");
        link.href = url;
        link.download = `phanyx-sem-fundo.${tipo}`;
        link.click();
      };

      return;
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = "phanyx-sem-fundo.png";
    link.click();
  }

  return (
  <>
    {aviso && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
        <div className="max-w-md rounded-3xl border border-cyan-400/30 bg-slate-950 p-6 text-center shadow-2xl">
          <h2 className="text-2xl font-black text-cyan-200">
            Aviso PHANYX
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-slate-200">
            {aviso}
          </p>

          <button
            type="button"
            onClick={() => setAviso(null)}
            className="mt-6 rounded-2xl bg-cyan-400 px-6 py-3 font-black text-slate-950 shadow-lg shadow-cyan-400/30 hover:bg-cyan-300"
          >
            Entendi
          </button>
        </div>
      </div>
    )}

    <section className="min-h-screen bg-[#020b2d] px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <h1 className="text-5xl font-black">Removedor de Fundo PHANYX</h1>
          <p className="mt-4 max-w-3xl text-lg text-cyan-100">
            Ferramenta profissional PHANYX para remover fundo de assinaturas,
            logos, fotos e imagens com exportação transparente.
          </p>
        </div>

        {erro && (
          <div className="mb-6 rounded-xl border border-red-500 bg-red-950 p-4 text-red-200">
            {erro}
          </div>
        )}

        <div className="grid items-start gap-5 lg:grid-cols-[240px_1fr_1fr]">
          <aside className="space-y-5">
            <label className="block cursor-pointer rounded-2xl border border-cyan-500/40 bg-slate-900 p-4 text-center">
              <div className="text-base font-bold text-cyan-300">
                Clique para enviar sua imagem
              </div>
              <div className="mt-3 text-sm text-slate-300">
                PNG, JPG, JPEG ou WebP até 10MB
              </div>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) carregarImagem(file);
                }}
              />
            </label>

            <div className="rounded-2xl bg-slate-900 p-3">
              <h3 className="mb-2 text-sm font-bold">Modo</h3>

              <div className="flex gap-2">
                <button
                  onClick={() => setModo("assinatura")}
                  className={`rounded-lg px-3 py-2 text-xs font-bold ${
                    modo === "assinatura"
                      ? "bg-cyan-500 text-black"
                      : "bg-slate-800"
                  }`}
                >
                  Assinatura
                </button>

                <button
                  onClick={() => setModo("objeto")}
                  className={`rounded-xl px-4 py-3 font-bold ${
                    modo === "objeto"
                      ? "bg-cyan-500 text-black"
                      : "bg-slate-800"
                  }`}
                >
                  Objeto
                </button>
              </div>
            </div>

{modo === "assinatura" && (
  <div className="rounded-xl bg-slate-900 p-3">
    <p className="mb-2 text-xs font-bold text-white">
      Fundo de visualização
    </p>

    <div className="grid grid-cols-2 gap-2">
      {(["verde", "azul", "preto", "branco", "xadrez"] as const).map((cor) => (
        <button
          key={cor}
          type="button"
          onClick={() => setFundoPreview(cor)}
          className={`rounded-lg px-2 py-1.5 text-[11px] font-bold ${
            fundoPreview === cor
              ? "bg-cyan-400 text-slate-950"
              : "bg-slate-800 text-white"
          }`}
        >
          {cor}
        </button>
      ))}
    </div>

    <p className="mt-2 text-[10px] leading-tight text-cyan-100/80">
      Esse fundo aparece somente na visualização. A imagem será salva com fundo transparente.
    </p>
  </div>
)}

                        {modo === "objeto" && (
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-900 p-4 text-sm">
                <input
                  type="checkbox"
                  checked={manterObjetoPrincipal}
                  onChange={(e) => setManterObjetoPrincipal(e.target.checked)}
                />
                Manter apenas objeto principal
              </label>
            )}

<label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-900 p-4 text-sm">
  <input
    type="checkbox"
    checked={removerBrancoInterno}
    onChange={(e) => setRemoverBrancoInterno(e.target.checked)}
  />
  Remover branco interno
</label>

          </aside>

          <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
            <h2 className="mb-4 text-center text-xl font-black">
              Imagem original
            </h2>

<div
  className="flex w-full items-center justify-center rounded-2xl bg-white p-4"
  style={{
  height: modo === "assinatura" ? "260px" : "360px",
}}
>              {imagemOriginal ? (
                <img
                  src={imagemOriginal}
                  alt="Imagem original"
                  className="max-h-[500px] max-w-full object-contain"
                />
              ) : (
                <p className="text-slate-400">Envie uma imagem para começar</p>
              )}
            </div>
          </div>

          <div className="h-fit rounded-3xl border border-cyan-400/20 bg-slate-900 p-5">
            <h2 className="mb-4 text-center text-xl font-black text-cyan-200">
              Resultado transparente
            </h2>

            <div
  className={`flex w-full items-center justify-center rounded-2xl p-4 ${
    modo === "assinatura" && fundoPreview === "verde"
      ? "bg-emerald-500"
      : modo === "assinatura" && fundoPreview === "azul"
        ? "bg-blue-500"
        : modo === "assinatura" && fundoPreview === "preto"
          ? "bg-black"
          : modo === "assinatura" && fundoPreview === "branco"
            ? "bg-white"
            : "bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0]"
  }`}
  style={{
    height: modo === "assinatura" ? "260px" : "360px",
  }}
>
              {imagemFinal ? (
                <img
                  src={imagemFinal}
                  alt="Resultado transparente"
                  className="max-h-[240px] max-w-full object-contain"
                 style={{
  opacity: opacidade / 100,
  filter: "none",
  transform: `scale(${zoomResultado})`,
  transformOrigin: "center",
}}
                />
              ) : (
                <p className="text-cyan-100">Resultado aparecerá aqui</p>
              )}
            </div>

            {imagemFinal && (
  <div className="mt-2 flex items-center justify-center gap-1 rounded-lg bg-slate-950/60 px-2 py-2">
    <div className="flex items-center gap-1">
  <button
    type="button"
    onClick={() => setZoomResultado((z) => Math.max(0.5, z - 0.1))}
    className="rounded-md border border-white/20 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/10"
  >
    -
  </button>

  <button
    type="button"
    onClick={() => setZoomResultado((z) => Math.min(3, z + 0.1))}
    className="rounded-md border border-white/20 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/10"
  >
    +
  </button>
</div>

<span className="text-[10px] font-bold text-white/80">
  Baixar:
</span>

    <button
      onClick={() => baixarImagem("png")}
      className="rounded-md bg-cyan-400 px-2 py-1 text-[10px] font-bold text-slate-950 hover:bg-cyan-300"
    >
      PNG
    </button>

    <button
      onClick={() => baixarImagem("jpg")}
      className="rounded-md border border-white/20 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/10"
    >
      JPG
    </button>

    <button
      onClick={() => baixarImagem("webp")}
      className="rounded-md border border-white/20 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/10"
    >
      WebP
    </button>
  </div>
)}
          </div>
                  <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-slate-900 p-3">
  <h3 className="mb-2 text-base font-black text-white">
    Ajustes da imagem
  </h3>

  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">

   <Controle
              label="Sensibilidade"
              valor={sensibilidade}
              min={5}
              max={80}
              onChange={setSensibilidade}
            />

            <Controle
              label="Suavizar borda"
              valor={suavizacao}
              min={0}
              max={6}
              onChange={setSuavizacao}
            />

            <Controle
              label="Brilho"
              valor={brilho}
              min={40}
              max={180}
              onChange={setBrilho}
            />

            <Controle
              label="Contraste"
              valor={contraste}
              min={40}
              max={220}
              onChange={setContraste}
            />

            <Controle
              label="Saturação"
              valor={saturacao}
              min={0}
              max={220}
              onChange={setSaturacao}
            />

            <Controle
              label="Opacidade"
              valor={opacidade}
              min={0}
              max={100}
              onChange={setOpacidade}
            />

            {modo === "assinatura" && (
              <Controle
                label="Intensidade do traço"
                valor={intensidadeTraco}
                min={0}
                max={100}
                onChange={setIntensidadeTraco}
              />
            )}
</div>
</div>
</div>
<button
  type="button"
  onClick={removerFundo}
  disabled={!imagemOriginal || processando}
  className="mt-6 w-full rounded-2xl bg-cyan-400 px-6 py-4 text-lg font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
>
  {processando ? "Processando..." : "Remover fundo"}
</button>
        <canvas ref={canvasRef} className="hidden" />
      </div>
        </section>
  </>
  );
}

function Controle({
  label,
  valor,
  min,
  max,
  onChange,
}: {
  label: string;
  valor: number;
  min: number;
  max: number;
  onChange: (valor: number) => void;
}) {
  return (
    <div className="rounded-lg bg-slate-950/60 p-2">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-xs font-bold text-white">{label}</label>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-cyan-200">
          {valor}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
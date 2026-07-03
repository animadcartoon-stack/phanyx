"use client";

import React from "react";
import FormaVetorial from "@/app/admin/configuracoes/certificado/components/FormaVetorial";

export type CampoCertificadoRender = {
  id: number | string;
  tipo: string;
  x?: number | null;
  y?: number | null;
  largura?: number | null;
  altura?: number | null;
  fonte?: string | null;
  tamanho?: number | null;
  cor?: string | null;
  alinhamento?: string | null;
  pagina?: number | null;
  dadosJson?: any;
  texto?: string | null;
  textoHtml?: string | null;
  textoTipo?: string | null;
  negrito?: boolean | null;
  italico?: boolean | null;
  sublinhado?: boolean | null;
  lineHeight?: number | null;
  marcador?: string | null;
  ordem?: number | null;

  rotate?: number | null;
  opacity?: number | null;
  flipX?: boolean | null;
  flipY?: boolean | null;
  filter?: string | null;

  sombraAtiva?: boolean | null;
  sombraX?: number | null;
  sombraY?: number | null;
  sombraBlur?: number | null;
  sombraCor?: string | null;
  sombraOpacidade?: number | null;

  contornoTextoAtivo?: boolean | null;
  contornoTextoCor?: string | null;
  contornoTextoEspessura?: number | null;
  contornoTextoTipo?: "interno" | "externo" | null;

  quantidadeDisciplinas?: number | null;
  colunasDisciplinas?: number | null;
   espacoColunasDisciplinas?: number | null;

  imagemUrl?: string | null;
  url?: string | null;
  src?: string | null;
  arquivoUrl?: string | null;
  previewUrl?: string | null;
  objectFit?: string | null;
};

export type DadosCertificadoRender = {
  nomeAluno?: string | null;
  numeroMatricula?: string | null;
  cpfAluno?: string | null;
  rgAluno?: string | null;

  nomeCurso?: string | null;
  disciplinasConcluidas?: string[];
  cargaHoraria?: string | null;
  anoConclusao?: string | number | null;
  dataConclusao?: string | null;
  aproveitamento?: string | null;
  frequenciaTotal?: string | null;
  modalidade?: string | null;
  turma?: string | null;
  polo?: string | null;

  nomeInstituicao?: string | null;
  cnpjInstituicao?: string | null;
  cidade?: string | null;
  dataEmissao?: string | null;
  nomeDiretor?: string | null;
  assinaturaUrl?: string | null;
  logoUrl?: string | null;

  numeroCertificado?: string | null;
  codigoValidacao?: string | null;
  qrCodeUrl?: string | null;
};

type Props = {
  campos: CampoCertificadoRender[];
  dados: DadosCertificadoRender;
  templateUrl?: string | null;
  modoFundo?: "modelo" | "phanyx" | "cor" | null;
  corFundoPagina?: string | null;
  larguraBase?: number;
  alturaBase?: number;
  escala?: number;
  mostrarBordas?: boolean;
  fundoTransparente?: boolean;
};

function normalizarOpacidade(valor: any, padrao = 1) {
  if (valor === null || valor === undefined || valor === "") return padrao;

  const numero = Number(valor);

  if (!Number.isFinite(numero)) return padrao;

  if (numero > 1) return Math.max(0, Math.min(1, numero / 100));

  return Math.max(0, Math.min(1, numero));
}

function hexToRgba(hex: string, opacity = 1) {
  const limpo = String(hex || "#000000").replace("#", "");

  const completo =
    limpo.length === 3
      ? limpo
          .split("")
          .map((c) => c + c)
          .join("")
      : limpo.padEnd(6, "0").slice(0, 6);

  const r = parseInt(completo.slice(0, 2), 16);
  const g = parseInt(completo.slice(2, 4), 16);
  const b = parseInt(completo.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function gerarContornoTextoCss(cor: string, espessura: number) {
  const e = Math.max(1, Math.round(Number(espessura || 1)));
  const sombras: string[] = [];

  for (let x = -e; x <= e; x++) {
    for (let y = -e; y <= e; y++) {
      if (x === 0 && y === 0) continue;
      sombras.push(`${x}px ${y}px 0 ${cor}`);
    }
  }

  return sombras.join(", ");
}

function efeitosTextoCss(campo: CampoCertificadoRender) {
  const sombras: string[] = [];

  const contornoAtivo = !!campo.contornoTextoAtivo;
  const contornoCor = campo.contornoTextoCor || "#000000";
  const contornoEspessura = Number(campo.contornoTextoEspessura || 1);
  const contornoTipo = campo.contornoTextoTipo || "externo";

  if (contornoAtivo && contornoTipo === "externo") {
    sombras.push(gerarContornoTextoCss(contornoCor, contornoEspessura));
  }

  if (campo.sombraAtiva) {
    const opacidade = normalizarOpacidade(campo.sombraOpacidade, 0.35);
    const x = Number(campo.sombraX ?? 4);
    const y = Number(campo.sombraY ?? 4);
    const blur = Number(campo.sombraBlur ?? 8);
    const cor = campo.sombraCor || "#000000";

    sombras.push(`${x}px ${y}px ${blur}px ${hexToRgba(cor, opacidade)}`);
  }

  return {
    textShadow: sombras.filter(Boolean).join(", ") || "none",
    WebkitTextStrokeColor:
      contornoAtivo && contornoTipo === "interno"
        ? contornoCor
        : "transparent",
    WebkitTextStrokeWidth:
      contornoAtivo && contornoTipo === "interno"
        ? `${contornoEspessura}px`
        : "0px",
    paintOrder: contornoAtivo ? "stroke fill" : "normal",
  } as React.CSSProperties;
}

function transformacaoCss(campo: CampoCertificadoRender) {
  const rotate = Number(campo.rotate || 0);
  const scaleX = campo.flipX ? -1 : 1;
  const scaleY = campo.flipY ? -1 : 1;

  return `rotate(${rotate}deg) scaleX(${scaleX}) scaleY(${scaleY})`;
}

function quantidadeDisciplinasDoCampo(campo: CampoCertificadoRender) {
  const quantidade = Number(
    campo.quantidadeDisciplinas ??
      campo.dadosJson?.quantidadeDisciplinas ??
      3
  );

  if (!Number.isFinite(quantidade)) return 3;

  return Math.max(1, Math.min(80, Math.round(quantidade)));
}

function quantidadeColunasDisciplinasDoCampo(campo: CampoCertificadoRender) {
  const colunas = Number(
    campo.colunasDisciplinas ?? campo.dadosJson?.colunasDisciplinas ?? 1
  );

  if (!Number.isFinite(colunas)) return 1;

  return Math.max(1, Math.min(4, Math.round(colunas)));
}

function espacoColunasDisciplinasDoCampo(campo: CampoCertificadoRender) {
  const espaco = Number(
    campo.espacoColunasDisciplinas ??
      campo.dadosJson?.espacoColunasDisciplinas ??
      12
  );

  if (!Number.isFinite(espaco)) return 12;

  return Math.max(0, Math.min(80, Math.round(espaco)));
}

function resolverTextoCampo(
  campo: CampoCertificadoRender,
  dados: DadosCertificadoRender
) {
  switch (campo.tipo) {
    case "NOME_ALUNO":
      return dados.nomeAluno || "Nome do aluno";
    case "NUMERO_MATRICULA":
      return dados.numeroMatricula || "Matrícula 000123";
    case "CPF_ALUNO":
      return dados.cpfAluno || "000.000.000-00";
    case "RG_ALUNO":
      return dados.rgAluno || "00.000.000-0";
    case "NOME_CURSO":
      return dados.nomeCurso || "Nome do curso";
    case "CARGA_HORARIA":
      return dados.cargaHoraria || "120 horas";
    case "ANO_CONCLUSAO":
      return dados.anoConclusao || "2026";
    case "DATA_CONCLUSAO":
      return dados.dataConclusao || "30/04/2026";
    case "APROVEITAMENTO":
      return dados.aproveitamento || "100%";
    case "FREQUENCIA_TOTAL":
      return dados.frequenciaTotal || "100%";
    case "MODALIDADE":
      return dados.modalidade || "EAD";
    case "TURMA":
      return dados.turma || "Turma A";
    case "POLO":
      return dados.polo || "Polo Sede";
    case "NOME_INSTITUICAO":
      return dados.nomeInstituicao || "Nome da Instituição";
    case "CNPJ_INSTITUICAO":
      return dados.cnpjInstituicao || "00.000.000/0001-00";
    case "CIDADE":
      return dados.cidade || "Cidade";
    case "DATA_EMISSAO":
      return dados.dataEmissao || "30/04/2026";
    case "NOME_DIRETOR":
      return dados.nomeDiretor || "Nome do diretor";
    case "NUMERO_CERTIFICADO":
      return dados.numeroCertificado || "CERT-2026-0001";
    case "CODIGO_VALIDACAO":
      return dados.codigoValidacao || "ABC123XYZ";
    case "TEXTO_LIVRE":
      return campo.texto || campo.dadosJson?.texto || "Digite seu texto";
    default:
      return campo.tipo;
  }
}

function normalizarMarcadorDisciplinas(valor: any) {
  const marcador = String(valor ?? "").trim();

  if (!marcador) return "";

  const normalizado = marcador.toLowerCase();

  if (
    normalizado === "nenhum" ||
    normalizado === "sem" ||
    normalizado === "sem marcador" ||
    normalizado === "none" ||
    normalizado === "null" ||
    normalizado === "undefined"
  ) {
    return "";
  }

  if (normalizado === "bolinha") return "•";
  if (normalizado === "seta" || normalizado === "setinha") return "➤";
  if (normalizado === "traco" || normalizado === "traço" || normalizado === "tracinho") {
    return "-";
  }

  return marcador;
}

function disciplinasParaRenderizar(
  campo: CampoCertificadoRender,
  dados: DadosCertificadoRender
) {
  const quantidade = quantidadeDisciplinasDoCampo(campo);
  const disciplinasReais = Array.isArray(dados.disciplinasConcluidas)
    ? dados.disciplinasConcluidas
    : [];

  const base =
    disciplinasReais.length > 0
      ? disciplinasReais.slice(0, quantidade)
      : Array.from({ length: quantidade }).map(
          (_, index) => `Disciplina ${index + 1}`
        );

    const marcador = normalizarMarcadorDisciplinas(
    campo.marcador ?? campo.dadosJson?.marcador
  );

  return base.map((disciplina) =>
    marcador ? `${marcador} ${disciplina}` : disciplina
  );
}

function renderDisciplinas(
  campo: CampoCertificadoRender,
  dados: DadosCertificadoRender
) {
  const colunas = quantidadeColunasDisciplinasDoCampo(campo);
  const espaco = espacoColunasDisciplinasDoCampo(campo);
  const disciplinas = disciplinasParaRenderizar(campo, dados);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))`,
        columnGap: `${espaco}px`,
        rowGap: "2px",
        alignContent: "center",
        justifyItems:
          campo.alinhamento === "center"
            ? "center"
            : campo.alinhamento === "right"
            ? "end"
            : "start",
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      {disciplinas.map((disciplina, index) => (
        <div
          key={`${campo.id}-disciplina-${index}`}
          style={{
            minWidth: 0,
            width: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {disciplina}
        </div>
      ))}
    </div>
  );
}

function pegarUrlImagemCampo(campo: CampoCertificadoRender) {
  return (
    campo.imagemUrl ||
    campo.url ||
    campo.src ||
    campo.arquivoUrl ||
    campo.previewUrl ||
    campo.dadosJson?.imagemUrl ||
    campo.dadosJson?.url ||
    campo.dadosJson?.src ||
    campo.dadosJson?.arquivoUrl ||
    campo.dadosJson?.previewUrl ||
    null
  );
}

function renderImagemCampo(
  campo: CampoCertificadoRender,
  dados: DadosCertificadoRender
) {
  const urlDoCampo = pegarUrlImagemCampo(campo);

  const url =
    campo.tipo === "ASSINATURA"
      ? urlDoCampo || dados.assinaturaUrl
      : campo.tipo === "LOGO_INSTITUICAO"
      ? urlDoCampo || dados.logoUrl
      : urlDoCampo;

  if (!url) return null;

  return (
    <img
      src={url}
      alt={campo.tipo}
      draggable={false}
      style={{
        width: "100%",
        height: "100%",
        objectFit: campo.objectFit || campo.dadosJson?.objectFit || "contain",
        pointerEvents: "none",
        display: "block",
      }}
    />
  );
}

function renderForma(campo: CampoCertificadoRender) {
  const forma = campo.dadosJson?.forma || campo.dadosJson?.tipoForma || "RETANGULO";

  const fill = campo.dadosJson?.fill || campo.dadosJson?.preenchimento || "#dbeafe";
  const stroke = campo.dadosJson?.stroke || campo.dadosJson?.contorno || "#2563eb";
  const strokeWidth = Number(campo.dadosJson?.strokeWidth ?? 2);

  if (forma === "CIRCULO") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "9999px",
          background: fill,
          border: `${strokeWidth}px solid ${stroke}`,
        }}
      />
    );
  }

  if (forma === "TRIANGULO") {
    return (
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: `${Number(campo.largura || 120) / 2}px solid transparent`,
          borderRight: `${Number(campo.largura || 120) / 2}px solid transparent`,
          borderBottom: `${Number(campo.altura || 100)}px solid ${fill}`,
          filter: campo.dadosJson?.sombraCss || undefined,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: campo.dadosJson?.borderRadius || 0,
        background: fill,
        border: `${strokeWidth}px solid ${stroke}`,
      }}
    />
  );
}

export default function CertificadoRender({
  campos,
  dados,
  templateUrl,
  modoFundo = "modelo",
  corFundoPagina = "#ffffff",
  larguraBase = 1123,
  alturaBase = 794,
  escala = 1,
  mostrarBordas = false,
  fundoTransparente = false,
}: Props) {

  const camposOrdenados = [...(campos || [])].sort(
    (a, b) => Number(a.ordem || 0) - Number(b.ordem || 0)
  );

  return (
    <div
      className="phanyx-certificado-render"
      style={{
        position: "relative",
        width: larguraBase,
        height: alturaBase,
        transform: `scale(${escala})`,
        transformOrigin: "top left",
        overflow: "hidden",
        background: fundoTransparente
  ? "transparent"
  : modoFundo === "cor" || modoFundo === "phanyx" || !templateUrl
  ? corFundoPagina || "#ffffff"
  : "#ffffff",
      }}
    >
      {templateUrl && modoFundo !== "phanyx" && !fundoTransparente && (
  templateUrl.toLowerCase().includes(".pdf") ? (
    <iframe
      src={templateUrl}
      title="Modelo do certificado"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        border: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  ) : (
    <img
      src={templateUrl}
      alt="Modelo do certificado"
      draggable={false}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "fill",
        pointerEvents: "none",
        zIndex: 0,
        display: "block",
      }}
    />
  )
)}

      {camposOrdenados.map((campo) => {
        const largura = Number(campo.largura || 220);
        const altura = Number(campo.altura || 40);

        const estiloBase: React.CSSProperties = {
          position: "absolute",
          left: Number(campo.x || 0),
          top: Number(campo.y || 0),
          width: largura,
          height: altura,
          zIndex: Number(campo.ordem || 1),
          fontFamily: campo.fonte || "Arial",
          fontSize: Number(campo.tamanho || 18),
          color: campo.cor || "#1e3a8a",
          fontWeight: campo.negrito ? "bold" : "normal",
          fontStyle: campo.italico ? "italic" : "normal",
          textDecoration: campo.sublinhado ? "underline" : "none",
          lineHeight: campo.lineHeight || 1.2,
          textAlign:
            campo.alinhamento === "center"
              ? "center"
              : campo.alinhamento === "right"
              ? "right"
              : "left",
          display: campo.tipo === "DISCIPLINAS_CONCLUIDAS" ? "block" : "flex",
          alignItems:
            campo.tipo === "DISCIPLINAS_CONCLUIDAS" ? undefined : "center",
          justifyContent:
            campo.alinhamento === "center"
              ? "center"
              : campo.alinhamento === "right"
              ? "flex-end"
              : "flex-start",
          overflow: "hidden",
          boxSizing: "border-box",
          padding: "0 4px",
          opacity: normalizarOpacidade(campo.opacity, 1),
          filter: campo.filter || undefined,
          transform: transformacaoCss(campo),
          transformOrigin: "center center",
          border: mostrarBordas ? "1px solid rgba(37, 99, 235, .35)" : "none",
          ...efeitosTextoCss(campo),
        };

        if (
          campo.tipo === "ASSINATURA" ||
          campo.tipo === "LOGO_INSTITUICAO" ||
          campo.tipo === "IMAGEM"
        ) {
          return (
            <div key={campo.id} style={estiloBase}>
              {renderImagemCampo(campo, dados)}
            </div>
          );
        }

        if (campo.tipo === "FORMA") {
  return (
    <div key={campo.id} style={estiloBase}>
      <FormaVetorial
        campo={campo as any}
        selecionado={false}
        modo="preview"
        onChange={() => {}}
      />
    </div>
  );
}

        if (campo.tipo === "DISCIPLINAS_CONCLUIDAS") {
          return (
            <div key={campo.id} style={estiloBase}>
              {renderDisciplinas(campo, dados)}
            </div>
          );
        }

        if (campo.tipo === "QR_CODE") {
          return (
            <div key={campo.id} style={estiloBase}>
              {dados.qrCodeUrl ? (
                <img
                  src={dados.qrCodeUrl}
                  alt="QR Code"
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    pointerEvents: "none",
                  }}
                />
              ) : (
                "QR Code"
              )}
            </div>
          );
        }

        return (
          <div key={campo.id} style={estiloBase}>
            {resolverTextoCampo(campo, dados)}
          </div>
        );
      })}
    </div>
  );
}
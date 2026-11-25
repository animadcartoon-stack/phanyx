"use client";

import { useState } from "react";
import { Node, type NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { useTranslations } from "next-intl";
import {
  ATRIBUTO_ASSINATURAS_CONTRATO,
  ATRIBUTO_CAMPO_ESCOLHA,
  ATRIBUTO_INICIO_ANEXO,
  CONFIG_ASSINATURAS_PADRAO,
  codificarConfiguracaoDocumento,
  decodificarConfiguracaoDocumento,
  marcaCampoEscolha,
  normalizarBlocoAssinaturas,
  normalizarCampoEscolha,
  type CampoEscolha,
} from "@/lib/documentos/campos-interativos";

const botao = "rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100";
const entrada = "min-w-0 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900";
const caixa = "relative my-2 rounded-md border border-dashed border-slate-400 bg-white text-slate-900";

function AcoesCampo({ editar, remover }: { editar?: () => void; remover: () => void }) {
  const t = useTranslations("DocumentInteractiveFields");
  return (
    <div contentEditable={false} className="flex flex-wrap items-center justify-end gap-2 px-2 py-1">
      <span data-drag-handle title={t("drag")} className="cursor-grab select-none px-1" aria-hidden="true">⠿</span>
      {editar && <button type="button" className={botao} onClick={editar}>{t("edit")}</button>}
      <button type="button" className={botao} onClick={remover}>{t("remove")}</button>
    </div>
  );
}

function CampoEscolhaView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const t = useTranslations("DocumentInteractiveFields");
  const campo = node.attrs.config as CampoEscolha;
  const [rascunho, setRascunho] = useState<CampoEscolha | null>(null);
  const [erro, setErro] = useState(false);

  if (!campo) return <NodeViewWrapper contentEditable={false}><AcoesCampo remover={deleteNode} /></NodeViewWrapper>;

  function salvar() {
    const configuracao = normalizarCampoEscolha(rascunho);
    if (!configuracao) {
      setErro(true);
      return;
    }
    updateAttributes({ config: configuracao });
    setRascunho(null);
    setErro(false);
  }

  return (
    <NodeViewWrapper contentEditable={false} className={caixa}>
      <AcoesCampo editar={() => { setRascunho(campo); setErro(false); }} remover={deleteNode} />
      {rascunho ? (
        <div className="grid gap-2 px-3 pb-3">
          <label className="grid gap-1 text-sm">
            {t("question")}
            <input className={entrada} value={rascunho.pergunta} maxLength={300} onChange={e => setRascunho({ ...rascunho, pergunta: e.target.value })} />
          </label>
          {rascunho.opcoes.map((opcao, indice) => (
            <div className="flex items-end gap-2" key={indice}>
              <label className="grid min-w-0 flex-1 gap-1 text-sm">
                {t("option", { number: indice + 1 })}
                <input className={entrada} value={opcao} maxLength={120} onChange={e => setRascunho({
                  ...rascunho,
                  opcoes: rascunho.opcoes.map((anterior, i) => i === indice ? e.target.value : anterior),
                })} />
              </label>
              <button type="button" className={botao} disabled={rascunho.opcoes.length <= 2} onClick={() => setRascunho({
                ...rascunho, opcoes: rascunho.opcoes.filter((_opcao, i) => i !== indice),
              })}>{t("remove")}</button>
            </div>
          ))}
          <button type="button" className={`${botao} justify-self-start`} disabled={rascunho.opcoes.length >= 8}
            onClick={() => setRascunho({ ...rascunho, opcoes: [...rascunho.opcoes, ""] })}>{t("addOption")}</button>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={rascunho.obrigatoria} onChange={e => setRascunho({ ...rascunho, obrigatoria: e.target.checked })} />
            {t("required")}
          </label>
          <label className="flex flex-wrap items-center gap-2 text-sm">
            {t("marker")}
            <select className={entrada} value={rascunho.estilo} onChange={e => setRascunho({ ...rascunho, estilo: e.target.value === "colchetes" ? "colchetes" : "parenteses" })}>
              <option value="parenteses">( X )</option>
              <option value="colchetes">[ X ]</option>
            </select>
          </label>
          {erro && <p role="alert" className="text-sm text-red-700">{t("campoInvalido")}</p>}
          <div className="flex gap-2">
            <button type="button" className={botao} onClick={salvar}>{t("apply")}</button>
            <button type="button" className={botao} onClick={() => setRascunho(null)}>{t("cancel")}</button>
          </div>
        </div>
      ) : (
        <div className="grid gap-1 px-3 pb-3 leading-snug">
          <strong>{campo.pergunta}</strong>
          {campo.opcoes.map(opcao => <span key={opcao} className="whitespace-pre-wrap">{marcaCampoEscolha(campo.estilo)} {opcao}</span>)}
        </div>
      )}
    </NodeViewWrapper>
  );
}

function AssinaturasContratoView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const t = useTranslations("DocumentInteractiveFields");
  const [editando, setEditando] = useState(false);
  const config = normalizarBlocoAssinaturas(node.attrs.config) ?? CONFIG_ASSINATURAS_PADRAO;

  return (
    <NodeViewWrapper contentEditable={false} className={caixa} style={{ width: `${config.largura}%` }}>
      <AcoesCampo editar={() => setEditando(!editando)} remover={deleteNode} />
      <div className="px-3 pb-3 text-sm">
        {editando && (
          <div className="mb-3 grid gap-2">
            <label className="flex flex-wrap items-center gap-2">
              {t("width")} {config.largura}%
              <input type="range" min={75} max={100} value={config.largura}
                onChange={e => updateAttributes({ config: { ...config, largura: Number(e.target.value) } })} />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={config.testemunhas}
                onChange={e => updateAttributes({ config: { ...config, testemunhas: e.target.checked } })} />
              {t("witnesses")}
            </label>
          </div>
        )}
        <strong>{t("signatureBlock")}</strong>
        <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs">
          {(["holder", "director", "secretariat"] as const).map(rotulo => <span key={rotulo} className="min-w-0 break-words border-t border-slate-500 pt-1">{t(rotulo)}</span>)}
        </div>
        {config.testemunhas && (
          <>
            <p className="mb-4 mt-3">{t("witnesses")}</p>
            <div className="grid grid-cols-2 gap-3"><span className="border-t border-slate-500" /><span className="border-t border-slate-500" /></div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

function InicioAnexoView({ deleteNode }: NodeViewProps) {
  const t = useTranslations("DocumentInteractiveFields");
  return (
    <NodeViewWrapper contentEditable={false} className={`${caixa} flex flex-wrap items-center justify-between gap-2 pl-3 text-xs font-semibold`}>
      <span>{t("annexStart")}</span>
      <AcoesCampo remover={deleteNode} />
    </NodeViewWrapper>
  );
}

function criarNoConfiguravel(
  name: string,
  atributo: string,
  normalizar: (valor: unknown) => unknown,
  componente: typeof CampoEscolhaView,
) {
  return Node.create({
    name,
    group: "block",
    atom: true,
    draggable: true,
    addAttributes() {
      return { config: {
        default: null,
        parseHTML: elemento => normalizar(decodificarConfiguracaoDocumento(elemento.getAttribute(atributo))),
        renderHTML: atributos => ({ [atributo]: codificarConfiguracaoDocumento(atributos.config) }),
      } };
    },
    parseHTML: () => [{ tag: `div[${atributo}]` }],
    renderHTML: ({ HTMLAttributes }) => ["div", HTMLAttributes],
    addNodeView: () => ReactNodeViewRenderer(componente),
  });
}

export const CampoEscolhaPHANYX = criarNoConfiguravel(
  "campoEscolhaPHANYX", ATRIBUTO_CAMPO_ESCOLHA, normalizarCampoEscolha, CampoEscolhaView,
);
export const AssinaturasContratoPHANYX = criarNoConfiguravel(
  "assinaturasContratoPHANYX", ATRIBUTO_ASSINATURAS_CONTRATO, normalizarBlocoAssinaturas, AssinaturasContratoView,
);
export const InicioAnexoPHANYX = Node.create({
  name: "inicioAnexoPHANYX",
  group: "block",
  atom: true,
  draggable: true,
  parseHTML: () => [{ tag: `div[${ATRIBUTO_INICIO_ANEXO}="true"]` }],
  renderHTML: () => ["div", { [ATRIBUTO_INICIO_ANEXO]: "true" }],
  addNodeView: () => ReactNodeViewRenderer(InicioAnexoView),
});

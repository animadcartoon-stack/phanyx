import {
  Extension,
} from "@tiptap/core";

import {
  getLegacyDocumentTagKey,
} from "@/lib/documentos/tags-documentos";

import {
  Plugin,
  PluginKey,
} from "@tiptap/pm/state";

import {
  Decoration,
  DecorationSet,
} from "@tiptap/pm/view";

export type DadosPreviewVariaveisPHANYX = {
  valores:
    Record<string, string>;
};

/*
 * IMPORTANTE
 * ----------
 * As variáveis {{...}} precisam continuar como texto real
 * dentro do TipTap.
 *
 * Não substituímos mais a variável por um widget
 * contentEditable=false.
 *
 * Isso permite que o usuário:
 * - selecione {{nomeAluno}};
 * - aplique negrito;
 * - aplique itálico;
 * - altere fonte;
 * - altere tamanho;
 * - altere cor;
 * - aplique marca-texto;
 * - alinhe normalmente junto com o restante do texto.
 *
 * O valor de exemplo continua disponível apenas como
 * tooltip (title), sem modificar o HTML persistido.
 */
export const PreviewVariaveisPHANYX =
  Extension.create<DadosPreviewVariaveisPHANYX>({
    name:
      "previewVariaveisPHANYX",

    addOptions() {
      return {
        valores: {},
      };
    },

    addProseMirrorPlugins() {
      const dados =
        this.options;

      return [
        new Plugin({
          key:
            new PluginKey(
              "previewVariaveisPHANYX"
            ),

          props: {
            decorations(
              state
            ) {
              const decoracoes:
                Decoration[] = [];

              state.doc.descendants(
                (
                  node,
                  posicao
                ) => {
                  if (
                    !node.isText ||
                    !node.text
                  ) {
                    return;
                  }

                  const regex =
                    /{{\s*([A-Za-z0-9_]+)\s*}}/g;

                  let resultado:
                    RegExpExecArray |
                    null;

                  while (
                    (
                      resultado =
                        regex.exec(
                          node.text
                        )
                    ) !== null
                  ) {
                    const chave =
                      resultado[1];

                    /*
                     * Campos especiais possuem
                     * renderização própria.
                     */
                    const chaveCanonica =
                      getLegacyDocumentTagKey(
                        chave
                      );

                    if (
                      chaveCanonica ===
                        "assinaturaDiretor" ||
                      chaveCanonica ===
                        "blocoAssinaturaDiretor" ||
                      chaveCanonica ===
                        "logoInstituicao"
                    ) {
                      continue;
                    }

                    const inicio =
                      posicao +
                      resultado.index;

                    const fim =
                      inicio +
                      resultado[0]
                        .length;

                    const valorPreview =
                      typeof dados
                        .valores[
                          chave
                        ] ===
                      "string"
                        ? dados
                            .valores[
                              chave
                            ]
                        : "";

                    /*
                     * A própria tag permanece visível
                     * e selecionável.
                     *
                     * Esta Decoration NÃO altera cor,
                     * fonte, peso ou tamanho, justamente
                     * para não competir com a formatação
                     * escolhida pelo usuário.
                     */
                    decoracoes.push(
                      Decoration.inline(
                        inicio,
                        fim,
                        {
                          "data-phanyx-variable":
                            chave,

                          title:
                            valorPreview
                              ? `Exemplo: ${valorPreview}`
                              : `{{${chave}}}`,
                        }
                      )
                    );
                  }
                }
              );

              return DecorationSet.create(
                state.doc,
                decoracoes
              );
            },
          },
        }),
      ];
    },
  });

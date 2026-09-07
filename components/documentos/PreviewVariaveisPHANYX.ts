import {
  Extension,
} from "@tiptap/core";

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

function adicionarConteudo(
  elemento: HTMLElement,
  valor: string
) {
  const partes =
    String(
      valor ?? ""
    ).split(
      /(?:<br\s*\/?\s*>|\r?\n)/gi
    );

  partes.forEach(
    (
      parte,
      indice
    ) => {
      if (indice > 0) {
        elemento.appendChild(
          document.createElement(
            "br"
          )
        );
      }

      elemento.appendChild(
        document.createTextNode(
          parte
        )
      );
    }
  );
}

function criarPreview(
  chave: string,
  valor: string
) {
  const elemento =
    document.createElement(
      "span"
    );

  elemento.contentEditable =
    "false";

  elemento.setAttribute(
    "data-phanyx-preview-variable",
    chave
  );

  elemento.setAttribute(
    "aria-label",
    `{{${chave}}}`
  );

  elemento.title =
    `{{${chave}}}`;

  /*
   * O elemento herda fonte, tamanho,
   * cor e line-height do texto onde
   * a vari?vel est? posicionada.
   */
  elemento.style.whiteSpace =
    "normal";

  elemento.style.pointerEvents =
    "none";

  adicionarConteudo(
    elemento,
    valor
  );

  return elemento;
}

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
                     * Estes campos possuem
                     * renderiza??o pr?pria.
                     */
                    if (
                      chave ===
                        "assinaturaDiretor" ||
                      chave ===
                        "blocoAssinaturaDiretor" ||
                      chave ===
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

                    const valor =
                      typeof dados
                        .valores[
                          chave
                        ] ===
                      "string"
                        ? dados
                            .valores[
                              chave
                            ]
                        : "-";

                    /*
                     * A tag continua no
                     * documento TipTap,
                     * por?m deixa de ocupar
                     * espa?o visual.
                     */
                    decoracoes.push(
                      Decoration.inline(
                        inicio,
                        fim,
                        {
                          style:
                            "display:none !important;",
                          "data-phanyx-preview-source":
                            chave,
                        }
                      )
                    );

                    /*
                     * O valor de exemplo
                     * ocupa o lugar visual
                     * da tag sem alterar
                     * o HTML persistido.
                     */
                    decoracoes.push(
                      Decoration.widget(
                        inicio,

                        () =>
                          criarPreview(
                            chave,
                            valor
                          ),

                        {
                          side: -1,

                          key:
                            `phanyx-preview-${chave}-${inicio}`,
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

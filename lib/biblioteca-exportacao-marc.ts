type AutorMarc = {
  funcao: unknown;
  ordem: number;
  autor: {
    nome: string;
  };
};

type ArquivoMarc = {
  urlExterna: string | null;
};

export type ItemExportacaoMarc = {
  id: number;
  tipo: unknown;
  titulo: string;
  subtitulo: string | null;
  tituloAlternativo: string | null;
  isbn10: string | null;
  isbn13: string | null;
  issn: string | null;
  doi: string | null;
  idioma: string | null;
  anoPublicacao: number | null;
  edicao: string | null;
  numeroPaginas: number | null;
  palavrasChave: string[];
  classificacaoBibliografica: string | null;
  codigoCutter: string | null;
  codigoChamada: string | null;
  cdd: string | null;
  cdu: string | null;
  capaUrl: string | null;
  miniaturaUrl: string | null;
  editora: {
    nome: string;
  } | null;
  autores: AutorMarc[];
  arquivos: ArquivoMarc[];
};

type SubcampoMarc = {
  codigo: string;
  valor: string;
};

type CampoControleMarc = {
  tipo: "controle";
  tag: string;
  valor: string;
};

type CampoDadosMarc = {
  tipo: "dados";
  tag: string;
  ind1: string;
  ind2: string;
  subcampos: SubcampoMarc[];
};

type CampoMarc =
  | CampoControleMarc
  | CampoDadosMarc;

function texto(
  valor: unknown,
) {
  return String(
    valor ?? "",
  ).trim();
}

function escaparXml(
  valor: unknown,
) {
  return texto(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function codigoIdiomaMarc(
  idioma: string | null,
) {
  const valor =
    texto(idioma)
      .toLowerCase();

  if (
    valor.startsWith("pt")
  ) {
    return "por";
  }

  if (
    valor.startsWith("en")
  ) {
    return "eng";
  }

  if (
    valor.startsWith("es")
  ) {
    return "spa";
  }

  if (
    valor.startsWith("fr")
  ) {
    return "fre";
  }

  if (
    /^[a-z]{3}$/.test(
      valor,
    )
  ) {
    return valor;
  }

  return "und";
}

function campo008(
  item: ItemExportacaoMarc,
) {
  const caracteres =
    Array(40).fill(" ");

  const agora =
    new Date();

  const dataEntrada =
    [
      String(
        agora.getUTCFullYear(),
      ).slice(-2),

      String(
        agora.getUTCMonth() + 1,
      ).padStart(
        2,
        "0",
      ),

      String(
        agora.getUTCDate(),
      ).padStart(
        2,
        "0",
      ),
    ].join("");

  for (
    let indice = 0;
    indice <
    dataEntrada.length;
    indice += 1
  ) {
    caracteres[indice] =
      dataEntrada[indice];
  }

  caracteres[6] = "s";

  const ano =
    item.anoPublicacao
      ? String(
          item.anoPublicacao,
        ).padStart(
          4,
          "0",
        )
      : "    ";

  for (
    let indice = 0;
    indice < 4;
    indice += 1
  ) {
    caracteres[
      7 + indice
    ] =
      ano[indice] ?? " ";
  }

  const idioma =
    codigoIdiomaMarc(
      item.idioma,
    );

  for (
    let indice = 0;
    indice < 3;
    indice += 1
  ) {
    caracteres[
      35 + indice
    ] =
      idioma[indice] ?? " ";
  }

  return caracteres.join("");
}

function tipoLeader(
  item:
    ItemExportacaoMarc,
) {
  const tipo =
    texto(
      item.tipo,
    ).toUpperCase();

  if (
    tipo === "VIDEO" ||
    tipo ===
      "DOCUMENTARIO"
  ) {
    return "g";
  }

  if (
    tipo === "AUDIO" ||
    tipo ===
      "AUDIOLIVRO" ||
    tipo ===
      "PODCAST"
  ) {
    return "i";
  }

  return "a";
}

function nivelLeader(
  item:
    ItemExportacaoMarc,
) {
  const tipo =
    texto(
      item.tipo,
    ).toUpperCase();

  if (
    tipo === "REVISTA" ||
    tipo ===
      "PERIODICO"
  ) {
    return "s";
  }

  return "m";
}

function leaderBase(
  item:
    ItemExportacaoMarc,
) {
  const caracteres =
    Array(24).fill(" ");

  "00000"
    .split("")
    .forEach(
      (
        caractere,
        indice,
      ) => {
        caracteres[indice] =
          caractere;
      },
    );

  caracteres[5] = "n";
  caracteres[6] =
    tipoLeader(item);
  caracteres[7] =
    nivelLeader(item);
  caracteres[9] = "a";
  caracteres[10] = "2";
  caracteres[11] = "2";

  "00000"
    .split("")
    .forEach(
      (
        caractere,
        indice,
      ) => {
        caracteres[
          12 + indice
        ] =
          caractere;
      },
    );

  caracteres[17] = " ";
  caracteres[18] = "i";
  caracteres[19] = " ";
  caracteres[20] = "4";
  caracteres[21] = "5";
  caracteres[22] = "0";
  caracteres[23] = "0";

  return caracteres;
}

function funcaoRelator(
  funcao: unknown,
) {
  switch (
    texto(funcao)
      .toUpperCase()
  ) {
    case "TRADUTOR":
      return "translator";

    case "EDITOR":
      return "editor";

    case "ORGANIZADOR":
      return "organizer";

    case "ORIENTADOR":
      return "advisor";

    case "COLABORADOR":
      return "contributor";

    default:
      return "author";
  }
}

function camposDoItem(
  item:
    ItemExportacaoMarc,
  opcoes: {
    incluirCapas: boolean;
    incluirLinks: boolean;
  },
): CampoMarc[] {
  const campos:
    CampoMarc[] = [];

  campos.push({
    tipo: "controle",
    tag: "001",
    valor:
      `PHANYX-${item.id}`,
  });

  campos.push({
    tipo: "controle",
    tag: "008",
    valor:
      campo008(item),
  });

  const isbns =
    Array.from(
      new Set(
        [
          item.isbn13,
          item.isbn10,
        ]
          .map(texto)
          .filter(Boolean),
      ),
    );

  for (
    const isbn of isbns
  ) {
    campos.push({
      tipo: "dados",
      tag: "020",
      ind1: " ",
      ind2: " ",
      subcampos: [
        {
          codigo: "a",
          valor: isbn,
        },
      ],
    });
  }

  if (item.issn) {
    campos.push({
      tipo: "dados",
      tag: "022",
      ind1: " ",
      ind2: " ",
      subcampos: [
        {
          codigo: "a",
          valor:
            item.issn,
        },
      ],
    });
  }

  if (item.doi) {
    campos.push({
      tipo: "dados",
      tag: "024",
      ind1: "7",
      ind2: " ",
      subcampos: [
        {
          codigo: "a",
          valor:
            item.doi,
        },
        {
          codigo: "2",
          valor: "doi",
        },
      ],
    });
  }

  if (item.cdu) {
    campos.push({
      tipo: "dados",
      tag: "080",
      ind1: " ",
      ind2: " ",
      subcampos: [
        {
          codigo: "a",
          valor:
            item.cdu,
        },
      ],
    });
  }

  if (item.cdd) {
    campos.push({
      tipo: "dados",
      tag: "082",
      ind1: "0",
      ind2: "4",
      subcampos: [
        {
          codigo: "a",
          valor:
            item.cdd,
        },
      ],
    });
  }

  const classificacao =
    item.cdd ||
    item.cdu ||
    item.classificacaoBibliografica ||
    item.codigoChamada ||
    "";

  if (
    classificacao ||
    item.codigoCutter
  ) {
    const subcampos:
      SubcampoMarc[] = [];

    if (classificacao) {
      subcampos.push({
        codigo: "a",
        valor:
          classificacao,
      });
    }

    if (
      item.codigoCutter
    ) {
      subcampos.push({
        codigo: "b",
        valor:
          item.codigoCutter,
      });
    }

    campos.push({
      tipo: "dados",
      tag: "090",
      ind1: " ",
      ind2: " ",
      subcampos,
    });
  }

  const autores =
    [...item.autores]
      .sort(
        (
          primeiro,
          segundo,
        ) =>
          primeiro.ordem -
          segundo.ordem,
      );

  const indicePrincipal =
    autores.findIndex(
      (vinculo) =>
        texto(
          vinculo.funcao,
        ).toUpperCase() ===
        "AUTOR",
    );

  const principal =
    indicePrincipal >= 0
      ? autores[
          indicePrincipal
        ]
      : autores[0];

  if (
    principal
      ?.autor
      ?.nome
  ) {
    campos.push({
      tipo: "dados",
      tag: "100",
      ind1: "1",
      ind2: " ",
      subcampos: [
        {
          codigo: "a",
          valor:
            principal
              .autor
              .nome,
        },
      ],
    });
  }

  autores.forEach(
    (
      vinculo,
      indice,
    ) => {
      if (
        vinculo ===
          principal ||
        !vinculo.autor.nome
      ) {
        return;
      }

      campos.push({
        tipo: "dados",
        tag: "700",
        ind1: "1",
        ind2: " ",
        subcampos: [
          {
            codigo: "a",
            valor:
              vinculo
                .autor
                .nome,
          },
          {
            codigo: "e",
            valor:
              funcaoRelator(
                vinculo.funcao,
              ),
          },
        ],
      });
    },
  );

  const tituloSubcampos:
    SubcampoMarc[] = [
      {
        codigo: "a",
        valor:
          item.titulo,
      },
  ];

  if (item.subtitulo) {
    tituloSubcampos.push({
      codigo: "b",
      valor:
        item.subtitulo,
    });
  }

  campos.push({
    tipo: "dados",
    tag: "245",
    ind1:
      principal
        ? "1"
        : "0",
    ind2: "0",
    subcampos:
      tituloSubcampos,
  });

  if (
    item.tituloAlternativo
  ) {
    campos.push({
      tipo: "dados",
      tag: "246",
      ind1: "3",
      ind2: " ",
      subcampos: [
        {
          codigo: "a",
          valor:
            item.tituloAlternativo,
        },
      ],
    });
  }

  if (item.edicao) {
    campos.push({
      tipo: "dados",
      tag: "250",
      ind1: " ",
      ind2: " ",
      subcampos: [
        {
          codigo: "a",
          valor:
            item.edicao,
        },
      ],
    });
  }

  if (
    item.editora?.nome ||
    item.anoPublicacao
  ) {
    const publicacao:
      SubcampoMarc[] = [];

    if (
      item.editora?.nome
    ) {
      publicacao.push({
        codigo: "b",
        valor:
          item.editora.nome,
      });
    }

    if (
      item.anoPublicacao
    ) {
      publicacao.push({
        codigo: "c",
        valor:
          String(
            item.anoPublicacao,
          ),
      });
    }

    campos.push({
      tipo: "dados",
      tag: "264",
      ind1: " ",
      ind2: "1",
      subcampos:
        publicacao,
    });
  }

  if (
    item.numeroPaginas
  ) {
    campos.push({
      tipo: "dados",
      tag: "300",
      ind1: " ",
      ind2: " ",
      subcampos: [
        {
          codigo: "a",
          valor:
            `${item.numeroPaginas} p.`,
        },
      ],
    });
  }

  for (
    const assunto of
    item.palavrasChave
  ) {
    if (
      !texto(assunto)
    ) {
      continue;
    }

    campos.push({
      tipo: "dados",
      tag: "650",
      ind1: " ",
      ind2: "0",
      subcampos: [
        {
          codigo: "a",
          valor:
            assunto,
        },
      ],
    });
  }

  if (
    opcoes.incluirCapas
  ) {
    const capa =
      item.capaUrl ||
      item.miniaturaUrl;

    if (capa) {
      campos.push({
        tipo: "dados",
        tag: "856",
        ind1: "4",
        ind2: "0",
        subcampos: [
          {
            codigo: "3",
            valor: "Capa",
          },
          {
            codigo: "u",
            valor: capa,
          },
        ],
      });
    }
  }

  if (
    opcoes.incluirLinks
  ) {
    const links =
      Array.from(
        new Set(
          item.arquivos
            .map(
              (
                arquivo,
              ) =>
                texto(
                  arquivo
                    .urlExterna,
                ),
            )
            .filter(Boolean),
        ),
      );

    for (
      const link of links
    ) {
      campos.push({
        tipo: "dados",
        tag: "856",
        ind1: "4",
        ind2: "0",
        subcampos: [
          {
            codigo: "3",
            valor:
              "Recurso externo",
          },
          {
            codigo: "u",
            valor:
              link,
          },
        ],
      });
    }
  }

  return campos;
}

function codificarCampoDados(
  campo:
    CampoDadosMarc,
) {
  const partes:
    Buffer[] = [
      Buffer.from(
        `${
          campo.ind1 ||
          " "
        }${
          campo.ind2 ||
          " "
        }`,
        "ascii",
      ),
  ];

  for (
    const subcampo of
    campo.subcampos
  ) {
    if (
      !texto(
        subcampo.valor,
      )
    ) {
      continue;
    }

    partes.push(
      Buffer.from(
        [0x1f],
      ),
      Buffer.from(
        subcampo.codigo,
        "ascii",
      ),
      Buffer.from(
        subcampo.valor,
        "utf8",
      ),
    );
  }

  partes.push(
    Buffer.from(
      [0x1e],
    ),
  );

  return Buffer.concat(
    partes,
  );
}

function gerarRegistroIso2709(
  item:
    ItemExportacaoMarc,
  opcoes: {
    incluirCapas: boolean;
    incluirLinks: boolean;
  },
) {
  const campos =
    camposDoItem(
      item,
      opcoes,
    );

  const diretorio:
    Buffer[] = [];

  const dados:
    Buffer[] = [];

  let deslocamento = 0;

  for (
    const campo of
    campos
  ) {
    const conteudo =
      campo.tipo ===
      "controle"
        ? Buffer.concat([
            Buffer.from(
              campo.valor,
              "utf8",
            ),
            Buffer.from(
              [0x1e],
            ),
          ])
        : codificarCampoDados(
            campo,
          );

    diretorio.push(
      Buffer.from(
        campo.tag +
          String(
            conteudo.length,
          ).padStart(
            4,
            "0",
          ) +
          String(
            deslocamento,
          ).padStart(
            5,
            "0",
          ),
        "ascii",
      ),
    );

    dados.push(
      conteudo,
    );

    deslocamento +=
      conteudo.length;
  }

  const bufferDiretorio =
    Buffer.concat(
      diretorio,
    );

  const enderecoBase =
    24 +
    bufferDiretorio.length +
    1;

  const leader =
    leaderBase(
      item,
    );

  const enderecoTexto =
    String(
      enderecoBase,
    ).padStart(
      5,
      "0",
    );

  for (
    let indice = 0;
    indice < 5;
    indice += 1
  ) {
    leader[
      12 + indice
    ] =
      enderecoTexto[
        indice
      ];
  }

  const corpoSemTamanho =
    Buffer.concat([
      Buffer.from(
        leader.join(""),
        "ascii",
      ),
      bufferDiretorio,
      Buffer.from(
        [0x1e],
      ),
      ...dados,
      Buffer.from(
        [0x1d],
      ),
    ]);

  if (
    corpoSemTamanho
      .length >
    99_999
  ) {
    throw new Error(
      `Registro MARC do item ${item.id} excede o limite ISO2709.`,
    );
  }

  const tamanho =
    String(
      corpoSemTamanho.length,
    ).padStart(
      5,
      "0",
    );

  corpoSemTamanho.write(
    tamanho,
    0,
    5,
    "ascii",
  );

  return corpoSemTamanho;
}

export function gerarMarc21Iso2709(
  itens:
    ItemExportacaoMarc[],
  opcoes: {
    incluirCapas: boolean;
    incluirLinks: boolean;
  },
) {
  return Buffer.concat(
    itens.map(
      (item) =>
        gerarRegistroIso2709(
          item,
          opcoes,
        ),
    ),
  );
}

function leaderXml(
  item:
    ItemExportacaoMarc,
) {
  const leader =
    leaderBase(item);

  return leader.join("");
}

export function gerarMarcXml(
  itens:
    ItemExportacaoMarc[],
  opcoes: {
    incluirCapas: boolean;
    incluirLinks: boolean;
  },
) {
  const registros =
    itens.map(
      (item) => {
        const campos =
          camposDoItem(
            item,
            opcoes,
          );

        const corpo =
          campos.map(
            (campo) => {
              if (
                campo.tipo ===
                "controle"
              ) {
                return `    <controlfield tag="${campo.tag}">${escaparXml(
                  campo.valor,
                )}</controlfield>`;
              }

              const subcampos =
                campo.subcampos
                  .filter(
                    (subcampo) =>
                      texto(
                        subcampo.valor,
                      ),
                  )
                  .map(
                    (subcampo) =>
                      `      <subfield code="${escaparXml(
                        subcampo.codigo,
                      )}">${escaparXml(
                        subcampo.valor,
                      )}</subfield>`,
                  )
                  .join("\n");

              return [
                `    <datafield tag="${campo.tag}" ind1="${escaparXml(
                  campo.ind1 ||
                    " ",
                )}" ind2="${escaparXml(
                  campo.ind2 ||
                    " ",
                )}">`,
                subcampos,
                "    </datafield>",
              ].join("\n");
            },
          )
          .join("\n");

        return [
          "  <record>",
          `    <leader>${escaparXml(
            leaderXml(
              item,
            ),
          )}</leader>`,
          corpo,
          "  </record>",
        ].join("\n");
      },
    )
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<collection xmlns="http://www.loc.gov/MARC21/slim">',
    registros,
    "</collection>",
    "",
  ].join("\n");
}
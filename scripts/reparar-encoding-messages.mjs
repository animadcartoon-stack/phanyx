import fs from "node:fs";
import path from "node:path";

const messagesDir =
  path.join(
    process.cwd(),
    "messages"
  );

const locales = [
  "pt-BR",
  "pt-PT",
  "en-US",
  "es-ES",
  "fr-FR",
];

/*
 * Monta automaticamente as conversões
 * de caracteres latinos UTF-8 que foram
 * interpretados incorretamente.
 *
 * Ex.:
 *  ê -> Ãª
 *  ã -> Ã£
 *  ç -> Ã§
 */
const mapa = new Map();

for (
  let codigo = 0x00c0;
  codigo <= 0x00ff;
  codigo += 1
) {
  const correto =
    String.fromCharCode(
      codigo
    );

  const quebrado =
    Buffer.from(
      correto,
      "utf8"
    ).toString(
      "latin1"
    );

  if (
    quebrado !== correto
  ) {
    mapa.set(
      quebrado,
      correto
    );
  }
}

/*
 * Alguns caracteres muito comuns
 * que podem aparecer quebrados.
 */
const extras = new Map([
  ["Â ", " "],
  ["Â ", " "],
  ["â€“", "–"],
  ["â€”", "—"],
  ["â€œ", "“"],
  ["â€", "”"],
  ["â€˜", "‘"],
  ["â€™", "’"],
  ["â€¦", "…"],
]);

function repararTexto(
  texto
) {
  let resultado =
    texto;

  /*
   * Faz até 3 passagens caso
   * alguma string tenha sido
   * codificada incorretamente
   * mais de uma vez.
   */
  for (
    let tentativa = 0;
    tentativa < 3;
    tentativa += 1
  ) {
    const anterior =
      resultado;

    for (
      const [
        quebrado,
        correto,
      ] of mapa
    ) {
      resultado =
        resultado.split(
          quebrado
        ).join(
          correto
        );
    }

    for (
      const [
        quebrado,
        correto,
      ] of extras
    ) {
      resultado =
        resultado.split(
          quebrado
        ).join(
          correto
        );
    }

    if (
      resultado === anterior
    ) {
      break;
    }
  }

  return resultado;
}

function repararValor(
  valor
) {
  if (
    typeof valor ===
    "string"
  ) {
    return repararTexto(
      valor
    );
  }

  if (
    Array.isArray(
      valor
    )
  ) {
    return valor.map(
      repararValor
    );
  }

  if (
    valor &&
    typeof valor ===
      "object"
  ) {
    const novo = {};

    for (
      const [
        chave,
        conteudo,
      ] of Object.entries(
        valor
      )
    ) {
      novo[chave] =
        repararValor(
          conteudo
        );
    }

    return novo;
  }

  return valor;
}

const backupDir =
  path.join(
    messagesDir,
    `_backup-encoding-${Date.now()}`
  );

fs.mkdirSync(
  backupDir,
  {
    recursive: true,
  }
);

let totalAlteracoes =
  0;

for (
  const locale of locales
) {
  const nomeArquivo =
    `${locale}.json`;

  const arquivo =
    path.join(
      messagesDir,
      nomeArquivo
    );

  if (
    !fs.existsSync(
      arquivo
    )
  ) {
    console.error(
      `❌ Não encontrado: ${arquivo}`
    );

    continue;
  }

  const original =
    fs.readFileSync(
      arquivo,
      "utf8"
    );

  /*
   * Backup antes de qualquer
   * modificação.
   */
  fs.copyFileSync(
    arquivo,
    path.join(
      backupDir,
      nomeArquivo
    )
  );

  const json =
    JSON.parse(
      original
    );

  const corrigido =
    repararValor(
      json
    );

  const novoConteudo =
    `${JSON.stringify(
      corrigido,
      null,
      2
    )}\n`;

  if (
    novoConteudo !==
    original
  ) {
    totalAlteracoes += 1;

    fs.writeFileSync(
      arquivo,
      novoConteudo,
      "utf8"
    );

    console.log(
      `✅ ${nomeArquivo} corrigido`
    );
  }
  else {
    console.log(
      `ℹ️ ${nomeArquivo}: nenhuma correção necessária`
    );
  }
}

console.log(
  "\n======================================"
);

console.log(
  `Arquivos alterados: ${totalAlteracoes}`
);

console.log(
  `Backup criado em:\n${backupDir}`
);

console.log(
  "======================================\n"
);

console.log(
  "✅ Verificação de encoding concluída."
);
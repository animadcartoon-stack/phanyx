const fs = require("fs");

const pagina =
  "app/admin/configuracoes/instituicao/page.tsx";

const bruto =
  fs.readFileSync(pagina, "utf8");

const eol =
  bruto.includes("\r\n")
    ? "\r\n"
    : "\n";

let texto =
  bruto.replace(/\r\n/g, "\n");

function exigir(valor, mensagem) {
  if (!valor) {
    throw new Error(mensagem);
  }
}

/* =========================================================
   1. IMPORTA O COMPONENTE E UTILITÁRIOS
========================================================= */

if (
  !texto.includes(
    'CampoTelefoneInternacional from "@/components/internacionalizacao/CampoTelefoneInternacional"'
  )
) {
  const ancora =
    'import BandeiraPais from "@/components/internacionalizacao/BandeiraPais";';

  exigir(
    texto.includes(ancora),
    "Import BandeiraPais não encontrado."
  );

  texto = texto.replace(
    ancora,
`${ancora}
import CampoTelefoneInternacional from "@/components/internacionalizacao/CampoTelefoneInternacional";
import {
  normalizarTelefoneE164,
  prepararTelefoneParaFormulario,
  telefoneValidoInternacional,
} from "@/lib/internacionalizacao/telefone";`
  );
}

/* =========================================================
   2. PAÍS DO TELEFONE EXISTE SOMENTE NO FORMULÁRIO
========================================================= */

if (
  !texto.includes(
    "paisTelefone?: CountryCode;"
  )
) {
  exigir(
    texto.includes(
      "  telefone?: string;"
    ),
    "Campo telefone do tipo não encontrado."
  );

  texto = texto.replace(
    "  telefone?: string;",
`  telefone?: string;
  paisTelefone?: CountryCode;`
  );
}

/* =========================================================
   3. montarPayloadConfiguracao()
   Evita que uploads de logo/assinatura sobrescrevam
   o telefone E.164 com formato visual.
========================================================= */

if (
  !texto.includes(
    "const telefoneParaSalvar ="
  )
) {
  const ancora =
`    const layout = normalizarLayoutProfissional(
      dados.estiloPapelTimbrado || dados.estiloDocumento
    );`;

  exigir(
    texto.includes(ancora),
    "Layout de montarPayloadConfiguracao não encontrado."
  );

  texto = texto.replace(
    ancora,
`${ancora}

    const paisTelefone =
      (
        dados.paisTelefone ||
        dados.paisCodigo ||
        "BR"
      ) as CountryCode;

    const telefoneParaSalvar =
      dados.telefone
        ? normalizarTelefoneE164(
            dados.telefone,
            paisTelefone
          ) || dados.telefone
        : "";`
  );

  exigir(
    texto.includes(
      '      telefone: dados.telefone || "",'
    ),
    "Telefone do payload auxiliar não encontrado."
  );

  texto = texto.replace(
    '      telefone: dados.telefone || "",',
    "      telefone: telefoneParaSalvar,"
  );
}

/* =========================================================
   4. PREPARA TELEFONE SALVO AO CARREGAR
========================================================= */

if (
  !texto.includes(
    "const telefonePreparado ="
  )
) {
  const regexLayoutCarregar =
    /      const layout = normalizarLayoutProfissional\(\s*json\?\.estiloPapelTimbrado \|\| json\?\.estiloDocumento\s*\);/m;

  const encontrado =
    texto.match(
      regexLayoutCarregar
    );

  exigir(
    encontrado,
    "Layout da função carregar não encontrado."
  );

  const bloco =
`${encontrado[0]}

      const codigoPaisCarregado =
        String(
          json?.paisCodigo || ""
        )
          .trim()
          .toUpperCase();

      const paisPadraoTelefone =
        getCountries().includes(
          codigoPaisCarregado as CountryCode
        )
          ? (
              codigoPaisCarregado as CountryCode
            )
          : "BR";

      const telefonePreparado =
        prepararTelefoneParaFormulario(
          json?.telefone,
          paisPadraoTelefone
        );`;

  texto = texto.replace(
    regexLayoutCarregar,
    bloco
  );

  const ancoraSetForm =
`      setForm({
        ...json,`;

  exigir(
    texto.includes(ancoraSetForm),
    "setForm do carregamento não encontrado."
  );

  texto = texto.replace(
    ancoraSetForm,
`      setForm({
        ...json,
        telefone:
          telefonePreparado.valor,
        paisTelefone:
          telefonePreparado.pais,`
  );
}

/* =========================================================
   5. VALIDA E NORMALIZA NO SALVAR
========================================================= */

if (
  !texto.includes(
    "const telefoneE164 ="
  )
) {
  const regexSalvarLayout =
    /      const layout = normalizarLayoutProfissional\(\s*form\.estiloPapelTimbrado \|\| form\.estiloDocumento\s*\);/m;

  const encontrados =
    [...texto.matchAll(
      new RegExp(
        regexSalvarLayout.source,
        "gm"
      )
    )];

  exigir(
    encontrados.length >= 1,
    "Layout da função salvar não encontrado."
  );

  /*
   * O primeiro correspondente depois de async function salvar().
   */
  const posSalvar =
    texto.indexOf(
      "  async function salvar()"
    );

  exigir(
    posSalvar !== -1,
    "Função salvar não encontrada."
  );

  const trechoDepois =
    texto.slice(posSalvar);

  const matchSalvar =
    trechoDepois.match(
      regexSalvarLayout
    );

  exigir(
    matchSalvar,
    "Layout dentro de salvar não encontrado."
  );

  const original =
    matchSalvar[0];

  const novo =
`${original}

      const paisTelefoneAtual =
        (
          form.paisTelefone ||
          form.paisCodigo ||
          "BR"
        ) as CountryCode;

      if (
        form.telefone &&
        !telefoneValidoInternacional(
          form.telefone,
          paisTelefoneAtual
        )
      ) {
        throw new Error(
          tGeo("phoneInvalid")
        );
      }

      const telefoneE164 =
        form.telefone
          ? normalizarTelefoneE164(
              form.telefone,
              paisTelefoneAtual
            )
          : "";`;

  const antesSalvar =
    texto.slice(
      0,
      posSalvar
    );

  let salvarAteFim =
    texto.slice(
      posSalvar
    );

  salvarAteFim =
    salvarAteFim.replace(
      regexSalvarLayout,
      novo
    );

  texto =
    antesSalvar +
    salvarAteFim;
}

/* troca somente o telefone do payload de salvar() */
{
  const posSalvar =
    texto.indexOf(
      "  async function salvar()"
    );

  const posPayload =
    texto.indexOf(
      "      const payload = {",
      posSalvar
    );

  exigir(
    posPayload !== -1,
    "Payload de salvar não encontrado."
  );

  const posFimPayload =
    texto.indexOf(
      "      };",
      posPayload
    );

  exigir(
    posFimPayload !== -1,
    "Final do payload de salvar não encontrado."
  );

  const antes =
    texto.slice(
      0,
      posPayload
    );

  let payload =
    texto.slice(
      posPayload,
      posFimPayload
    );

  const depois =
    texto.slice(
      posFimPayload
    );

  if (
    payload.includes(
      'telefone: form.telefone || "",'
    )
  ) {
    payload = payload.replace(
      'telefone: form.telefone || "",',
      "telefone: telefoneE164,"
    );
  }

  texto =
    antes +
    payload +
    depois;
}

/* =========================================================
   6. SUBSTITUI O INPUT SIMPLES PELO COMPONENTE OFICIAL
========================================================= */

if (
  !texto.includes(
    'id="telefone-instituicao"'
  )
) {
  const marcador =
    'value={form.telefone || ""}';

  const pos =
    texto.indexOf(
      marcador
    );

  exigir(
    pos !== -1,
    "Campo visual de telefone não encontrado."
  );

  const inicio =
    texto.lastIndexOf(
      "              <div>",
      pos
    );

  exigir(
    inicio !== -1,
    "Início do bloco Telefone não encontrado."
  );

  const fechamento =
    "              </div>";

  const fimBase =
    texto.indexOf(
      fechamento,
      pos
    );

  exigir(
    fimBase !== -1,
    "Final do bloco Telefone não encontrado."
  );

  const fim =
    fimBase +
    fechamento.length;

  const novoBloco =
`              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {tGeo("phone")}
                </label>

                <CampoTelefoneInternacional
                  id="telefone-instituicao"
                  value={
                    form.telefone || ""
                  }
                  pais={
                    (
                      form.paisTelefone ||
                      form.paisCodigo ||
                      "BR"
                    ) as CountryCode
                  }
                  onChange={(
                    valor,
                    pais
                  ) =>
                    setForm((prev) => ({
                      ...prev,
                      telefone: valor,
                      paisTelefone: pais,
                    }))
                  }
                />

                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {tGeo("phoneHint")}
                </p>
              </div>`;

  texto =
    texto.slice(0, inicio) +
    novoBloco +
    texto.slice(fim);
}

/* =========================================================
   7. TRADUÇÕES
========================================================= */

const traducoes = {
  "pt-BR": {
    phone: "Telefone",
    phoneHint:
      "Selecione o país do número. O telefone será armazenado no padrão internacional.",
    phoneInvalid:
      "Informe um telefone internacional válido.",
  },

  "pt-PT": {
    phone: "Telefone",
    phoneHint:
      "Selecione o país do número. O telefone será guardado no formato internacional.",
    phoneInvalid:
      "Introduza um telefone internacional válido.",
  },

  "en-US": {
    phone: "Phone",
    phoneHint:
      "Select the phone number's country. The number will be stored in international format.",
    phoneInvalid:
      "Enter a valid international phone number.",
  },

  "es-ES": {
    phone: "Teléfono",
    phoneHint:
      "Selecciona el país del número. El teléfono se almacenará en formato internacional.",
    phoneInvalid:
      "Introduce un número de teléfono internacional válido.",
  },

  "fr-FR": {
    phone: "Téléphone",
    phoneHint:
      "Sélectionnez le pays du numéro. Le téléphone sera enregistré au format international.",
    phoneInvalid:
      "Saisissez un numéro de téléphone international valide.",
  },
};

function localizarObjetoNamespace(
  conteudo,
  namespace
) {
  const chave =
    `"${namespace}"`;

  const posChave =
    conteudo.indexOf(chave);

  exigir(
    posChave !== -1,
    `${namespace} não encontrado.`
  );

  const inicio =
    conteudo.indexOf(
      "{",
      posChave
    );

  exigir(
    inicio !== -1,
    `Objeto ${namespace} inválido.`
  );

  let profundidade = 0;
  let string = false;
  let escape = false;

  for (
    let i = inicio;
    i < conteudo.length;
    i++
  ) {
    const char =
      conteudo[i];

    if (string) {
      if (escape) {
        escape = false;
      } else if (
        char === "\\"
      ) {
        escape = true;
      } else if (
        char === '"'
      ) {
        string = false;
      }

      continue;
    }

    if (char === '"') {
      string = true;
      continue;
    }

    if (char === "{") {
      profundidade++;
    } else if (
      char === "}"
    ) {
      profundidade--;

      if (
        profundidade === 0
      ) {
        return {
          inicio,
          fim: i,
        };
      }
    }
  }

  throw new Error(
    `Fim de ${namespace} não encontrado.`
  );
}

const mensagens = {};

for (
  const [localeMsg, dados]
  of Object.entries(
    traducoes
  )
) {
  const caminho =
    `messages/${localeMsg}.json`;

  const original =
    fs.readFileSync(
      caminho,
      "utf8"
    );

  const eolMsg =
    original.includes("\r\n")
      ? "\r\n"
      : "\n";

  let conteudo =
    original.replace(
      /\r\n/g,
      "\n"
    );

  const intervalo =
    localizarObjetoNamespace(
      conteudo,
      "InstitutionGeoSettings"
    );

  let bloco =
    conteudo.slice(
      intervalo.inicio,
      intervalo.fim + 1
    );

  if (
    !bloco.includes(
      '"phoneInvalid"'
    )
  ) {
    const insercao =
`,
    "phone": ${JSON.stringify(
      dados.phone
    )},
    "phoneHint": ${JSON.stringify(
      dados.phoneHint
    )},
    "phoneInvalid": ${JSON.stringify(
      dados.phoneInvalid
    )}`;

    bloco =
      bloco.slice(
        0,
        -1
      ).replace(
        /\s*$/,
        ""
      ) +
      insercao +
      "\n  }";

    conteudo =
      conteudo.slice(
        0,
        intervalo.inicio
      ) +
      bloco +
      conteudo.slice(
        intervalo.fim + 1
      );
  }

  JSON.parse(
    conteudo
  );

  mensagens[caminho] =
    conteudo.replace(
      /\n/g,
      eolMsg
    );
}

/* =========================================================
   8. GRAVA APENAS APÓS VALIDAR TUDO
========================================================= */

fs.writeFileSync(
  pagina,
  texto.replace(
    /\n/g,
    eol
  ),
  "utf8"
);

for (
  const [caminho, conteudo]
  of Object.entries(
    mensagens
  )
) {
  fs.writeFileSync(
    caminho,
    conteudo,
    "utf8"
  );
}

console.log(
  "✓ Telefone institucional convertido para componente internacional"
);

console.log(
  "✓ Número será salvo no padrão E.164"
);

console.log(
  "✓ País do telefone permanece independente do país da instituição"
);

console.log(
  "✓ Traduções adicionadas nos 5 idiomas"
);

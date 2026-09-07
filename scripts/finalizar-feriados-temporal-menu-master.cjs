const fs = require("fs");

function abrir(caminho) {
  const bruto = fs.readFileSync(caminho, "utf8");

  return {
    eol: bruto.includes("\r\n") ? "\r\n" : "\n",
    texto: bruto.replace(/\r\n/g, "\n"),
  };
}

function salvar(caminho, texto, eol) {
  fs.writeFileSync(
    caminho,
    texto.replace(/\n/g, eol),
    "utf8"
  );
}

function exigir(valor, mensagem) {
  if (!valor) {
    throw new Error(mensagem);
  }
}

function localizarObjeto(
  conteudo,
  nome
) {
  const posChave =
    conteudo.indexOf(
      '"' + nome + '"'
    );

  exigir(
    posChave !== -1,
    "Namespace " + nome + " não encontrado."
  );

  const inicio =
    conteudo.indexOf(
      "{",
      posChave
    );

  exigir(
    inicio !== -1,
    "Objeto " + nome + " inválido."
  );

  let profundidade = 0;
  let emString = false;
  let escape = false;

  for (
    let i = inicio;
    i < conteudo.length;
    i++
  ) {
    const char =
      conteudo[i];

    if (emString) {
      if (escape) {
        escape = false;
      } else if (
        char === "\\"
      ) {
        escape = true;
      } else if (
        char === '"'
      ) {
        emString = false;
      }

      continue;
    }

    if (char === '"') {
      emString = true;
      continue;
    }

    if (char === "{") {
      profundidade++;
    } else if (
      char === "}"
    ) {
      profundidade--;

      if (profundidade === 0) {
        return {
          inicio,
          fim: i,
        };
      }
    }
  }

  throw new Error(
    "Fim de " + nome + " não encontrado."
  );
}

/* =========================================================
   1. API: CALCULA DIAS RESTANTES NO FUSO DA INSTITUIÇÃO
========================================================= */

const caminhoApi =
  "app/api/phanyx/feriado-atual/route.ts";

const apiArquivo =
  abrir(caminhoApi);

let api =
  apiArquivo.texto;

if (
  !api.includes(
    "function calcularDiasRestantes"
  )
) {
  const ancora =
`function dataBancoISO(
  data: Date
) {
  return data
    .toISOString()
    .slice(0, 10);
}`;

  exigir(
    api.includes(ancora),
    "Função dataBancoISO não encontrada."
  );

  api = api.replace(
    ancora,
`${ancora}

function calcularDiasRestantes(
  dataLocal: string,
  dataFeriado: string
) {
  const [
    anoHoje,
    mesHoje,
    diaHoje,
  ] =
    dataLocal
      .split("-")
      .map(Number);

  const [
    anoFeriado,
    mesFeriado,
    diaFeriado,
  ] =
    dataFeriado
      .split("-")
      .map(Number);

  if (
    !anoHoje ||
    !mesHoje ||
    !diaHoje ||
    !anoFeriado ||
    !mesFeriado ||
    !diaFeriado
  ) {
    return 0;
  }

  const hojeUTC =
    Date.UTC(
      anoHoje,
      mesHoje - 1,
      diaHoje
    );

  const feriadoUTC =
    Date.UTC(
      anoFeriado,
      mesFeriado - 1,
      diaFeriado
    );

  return Math.round(
    (
      feriadoUTC -
      hojeUTC
    ) /
      86400000
  );
}`
  );
}

if (
  !api.includes(
    "const diasRestantes ="
  )
) {
  const marcador =
`    return NextResponse.json({
      ok: true,

      feriado: {`;

  exigir(
    api.includes(marcador),
    "Retorno final do feriado não encontrado."
  );

  api = api.replace(
    marcador,
`    const dataFeriadoISO =
      dataBancoISO(
        feriado.dataFeriado
      );

    const diasRestantes =
      calcularDiasRestantes(
        dataLocal,
        dataFeriadoISO
      );

    return NextResponse.json({
      ok: true,

      feriado: {`
  );

  const dataAntiga =
`        dataFeriado:
          dataBancoISO(
            feriado.dataFeriado
          ),`;

  exigir(
    api.includes(dataAntiga),
    "Campo dataFeriado do retorno não encontrado."
  );

  api = api.replace(
    dataAntiga,
`        dataFeriado:
          dataFeriadoISO,

        diasRestantes,`
  );
}

/* =========================================================
   2. COMPONENTE: TÍTULO E MENSAGEM INTELIGENTES
========================================================= */

const caminhoComponente =
  "components/ui/PhanyxFeriadoAviso.tsx";

const componenteArquivo =
  abrir(caminhoComponente);

let componente =
  componenteArquivo.texto;

if (
  !componente.includes(
    "diasRestantes: number;"
  )
) {
  exigir(
    componente.includes(
      "  dataFeriado: string;"
    ),
    "Tipo dataFeriado não encontrado."
  );

  componente = componente.replace(
    "  dataFeriado: string;",
`  dataFeriado: string;
  diasRestantes: number;`
  );
}

if (
  !componente.includes(
    "const tituloInteligente ="
  )
) {
  const ancora =
`  const dataTexto =
    formatarDataCivil(
      feriado.dataFeriado,
      locale
    );`;

  exigir(
    componente.includes(ancora),
    "Bloco dataTexto não encontrado."
  );

  componente = componente.replace(
    ancora,
`${ancora}

  const tituloInteligente =
    feriado.diasRestantes === 0
      ? t(
          "titleToday",
          {
            name:
              feriado.nome,
          }
        )
      : feriado.diasRestantes === 1
      ? t(
          "titleTomorrow",
          {
            name:
              feriado.nome,
          }
        )
      : feriado.diasRestantes > 1
      ? t(
          "titleUpcoming",
          {
            name:
              feriado.nome,
          }
        )
      : feriado.titulo;

  const fraseInteligente =
    feriado.diasRestantes === 0
      ? t(
          "messageToday",
          {
            name:
              feriado.nome,
            message:
              feriado.mensagem,
          }
        )
      : feriado.diasRestantes === 1
      ? t(
          "messageTomorrow",
          {
            name:
              feriado.nome,
            message:
              feriado.mensagem,
          }
        )
      : feriado.diasRestantes > 1
      ? t(
          "messageUpcoming",
          {
            name:
              feriado.nome,
            date:
              dataTexto,
            message:
              feriado.mensagem,
          }
        )
      : feriado.mensagem;`
  );
}

componente = componente.replace(
`          titulo:
            feriado.titulo,`,
`          titulo:
            tituloInteligente,`
);

componente = componente.replace(
`          frase:
            feriado.mensagem,`,
`          frase:
            fraseInteligente,`
);

/* =========================================================
   3. MENU MASTER
========================================================= */

const caminhoShell =
  "app/admin/AdminShell.tsx";

const shellArquivo =
  abrir(caminhoShell);

let shell =
  shellArquivo.texto;

if (
  !shell.includes(
    'href="/master/feriados"'
  )
) {
  const hrefBoletos =
    shell.indexOf(
      'href="/master/boletos-ibe"'
    );

  exigir(
    hrefBoletos !== -1,
    "Link de boletos Master não encontrado."
  );

  const inicioLink =
    shell.lastIndexOf(
      "                        <Link",
      hrefBoletos
    );

  exigir(
    inicioLink !== -1,
    "Início do link de boletos não encontrado."
  );

  const novoLink =
`                        <Link
                          href="/master/feriados"
                          className={getLinkClass("/master/feriados")}
                        >
                          📅 {tNav("holidayCalendars")}
                        </Link>

`;

  shell =
    shell.slice(
      0,
      inicioLink
    ) +
    novoLink +
    shell.slice(
      inicioLink
    );
}

/* =========================================================
   4. TRADUÇÕES
========================================================= */

const traducoes = {
  "pt-BR": {
    titleToday:
      "Hoje é feriado: {name}",
    titleTomorrow:
      "Amanhã será feriado: {name}",
    titleUpcoming:
      "Feriado chegando: {name}",
    messageToday:
      "Hoje é feriado: {name}. Aproveite o dia! {message}",
    messageTomorrow:
      "Amanhã será feriado: {name}. {message}",
    messageUpcoming:
      "Em {date}, será feriado: {name}. {message}",
    menu:
      "Calendários e Feriados",
  },

  "pt-PT": {
    titleToday:
      "Hoje é feriado: {name}",
    titleTomorrow:
      "Amanhã será feriado: {name}",
    titleUpcoming:
      "Feriado a chegar: {name}",
    messageToday:
      "Hoje é feriado: {name}. Aproveite o dia! {message}",
    messageTomorrow:
      "Amanhã será feriado: {name}. {message}",
    messageUpcoming:
      "Em {date}, será feriado: {name}. {message}",
    menu:
      "Calendários e Feriados",
  },

  "en-US": {
    titleToday:
      "Today is a holiday: {name}",
    titleTomorrow:
      "Tomorrow is a holiday: {name}",
    titleUpcoming:
      "Upcoming holiday: {name}",
    messageToday:
      "Today is a holiday: {name}. Enjoy the day! {message}",
    messageTomorrow:
      "Tomorrow is a holiday: {name}. {message}",
    messageUpcoming:
      "{name} will be observed on {date}. {message}",
    menu:
      "Calendars and Holidays",
  },

  "es-ES": {
    titleToday:
      "Hoy es festivo: {name}",
    titleTomorrow:
      "Mañana será festivo: {name}",
    titleUpcoming:
      "Próximo festivo: {name}",
    messageToday:
      "Hoy es festivo: {name}. ¡Disfruta del día! {message}",
    messageTomorrow:
      "Mañana será festivo: {name}. {message}",
    messageUpcoming:
      "El {date} será festivo: {name}. {message}",
    menu:
      "Calendarios y Festivos",
  },

  "fr-FR": {
    titleToday:
      "Aujourd’hui est un jour férié : {name}",
    titleTomorrow:
      "Demain sera férié : {name}",
    titleUpcoming:
      "Jour férié à venir : {name}",
    messageToday:
      "Aujourd’hui est un jour férié : {name}. Profitez de cette journée ! {message}",
    messageTomorrow:
      "Demain sera férié : {name}. {message}",
    messageUpcoming:
      "Le {date} sera férié : {name}. {message}",
    menu:
      "Calendriers et jours fériés",
  },
};

const mensagens =
  {};

for (
  const [
    locale,
    dados,
  ]
  of Object.entries(
    traducoes
  )
) {
  const caminho =
    "messages/" +
    locale +
    ".json";

  const arquivo =
    abrir(caminho);

  let conteudo =
    arquivo.texto;

  /* -----------------------------------------
     PublicHolidayBanner
  ----------------------------------------- */

  const intervalo =
    localizarObjeto(
      conteudo,
      "PublicHolidayBanner"
    );

  let bloco =
    conteudo.slice(
      intervalo.inicio,
      intervalo.fim + 1
    );

  if (
    !bloco.includes(
      '"titleToday"'
    )
  ) {
    const posCompact =
      bloco.indexOf(
        '"compact"'
      );

    exigir(
      posCompact !== -1,
      "PublicHolidayBanner.compact não encontrado em " +
        locale
    );

    const inicioLinha =
      bloco.lastIndexOf(
        "\n",
        posCompact
      ) + 1;

    const indent =
      bloco
        .slice(
          inicioLinha,
          posCompact
        )
        .match(/^\s*/)?.[0] ||
      "    ";

    const novas =
      indent +
      '"titleToday": ' +
      JSON.stringify(
        dados.titleToday
      ) +
      ",\n" +
      indent +
      '"titleTomorrow": ' +
      JSON.stringify(
        dados.titleTomorrow
      ) +
      ",\n" +
      indent +
      '"titleUpcoming": ' +
      JSON.stringify(
        dados.titleUpcoming
      ) +
      ",\n" +
      indent +
      '"messageToday": ' +
      JSON.stringify(
        dados.messageToday
      ) +
      ",\n" +
      indent +
      '"messageTomorrow": ' +
      JSON.stringify(
        dados.messageTomorrow
      ) +
      ",\n" +
      indent +
      '"messageUpcoming": ' +
      JSON.stringify(
        dados.messageUpcoming
      ) +
      ",\n";

    bloco =
      bloco.slice(
        0,
        inicioLinha
      ) +
      novas +
      bloco.slice(
        inicioLinha
      );

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

  /* -----------------------------------------
     Chave do menu ao lado de generateIbeInvoice
  ----------------------------------------- */

  if (
    !conteudo.includes(
      '"holidayCalendars"'
    )
  ) {
    const regex =
      /^([ \t]*)("generateIbeInvoice"\s*:\s*"[^"]*".*)$/m;

    const achado =
      conteudo.match(
        regex
      );

    exigir(
      achado,
      "generateIbeInvoice não encontrado em " +
        locale
    );

    const indent =
      achado[1];

    const linha =
      achado[2];

    conteudo =
      conteudo.replace(
        regex,
        indent +
          '"holidayCalendars": ' +
          JSON.stringify(
            dados.menu
          ) +
          ",\n" +
          indent +
          linha
      );
  }

  JSON.parse(
    conteudo
  );

  mensagens[
    caminho
  ] = {
    texto:
      conteudo,
    eol:
      arquivo.eol,
  };
}

/* =========================================================
   5. SÓ GRAVA APÓS TODAS AS VALIDAÇÕES
========================================================= */

salvar(
  caminhoApi,
  api,
  apiArquivo.eol
);

salvar(
  caminhoComponente,
  componente,
  componenteArquivo.eol
);

salvar(
  caminhoShell,
  shell,
  shellArquivo.eol
);

for (
  const [
    caminho,
    arquivo,
  ]
  of Object.entries(
    mensagens
  )
) {
  salvar(
    caminho,
    arquivo.texto,
    arquivo.eol
  );
}

console.log(
  "✓ Feriado agora sabe se é hoje, amanhã ou está chegando"
);

console.log(
  "✓ Mensagem especial do próprio dia adicionada"
);

console.log(
  "✓ Calendários e Feriados adicionado ao menu Master"
);

console.log(
  "✓ Tudo internacionalizado nos 5 idiomas"
);

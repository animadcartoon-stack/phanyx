const fs = require("fs");

const caminho =
  "app/professor/turmas/page.tsx";

const bruto =
  fs.readFileSync(caminho, "utf8");

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
   1. useLocale
========================================================= */

if (
  !texto.includes(
    "useLocale"
  )
) {
  const regexImport =
    /import\s*\{\s*useTranslations\s*\}\s*from\s*"next-intl";/m;

  exigir(
    regexImport.test(texto),
    "Import useTranslations não encontrado."
  );

  texto = texto.replace(
    regexImport,
`import {
  useLocale,
  useTranslations,
} from "next-intl";`
  );
}

/* =========================================================
   2. REMOVE MOTOR BRASILEIRO LOCAL
========================================================= */

if (
  texto.includes(
    "function calcularPascoa("
  )
) {
  const inicio =
    texto.indexOf(
      "function calcularPascoa("
    );

  const fim =
    texto.indexOf(
      "function statusNormalizado",
      inicio
    );

  exigir(
    inicio !== -1 &&
      fim !== -1,
    "Não foi possível localizar o bloco antigo de feriados."
  );

  texto =
    texto.slice(0, inicio) +
    texto.slice(fim);
}

/* =========================================================
   3. LOCALE + ESTADO DO FERIADO ATUAL
========================================================= */

if (
  !texto.includes(
    "const [feriadoHoje,"
  )
) {
  const ancora =
`export default function TurmasProfessorPage() {
  const t = useTranslations("ProfessorClasses");`;

  exigir(
    texto.includes(ancora),
    "Início de TurmasProfessorPage não encontrado."
  );

  texto = texto.replace(
    ancora,
`${ancora}
  const locale = useLocale();

  const [
    feriadoHoje,
    setFeriadoHoje,
  ] = useState<{
    nome: string;
  } | null>(null);`
  );
}

/* =========================================================
   4. REMOVE CHAMADA DO MOTOR ANTIGO
========================================================= */

texto = texto.replace(
`  const hoje = diaSemanaHoje();
  const feriado = feriadoNacionalHoje();`,
`  const hoje = diaSemanaHoje();`
);

/* =========================================================
   5. REMOVE MAPA MANUAL DE TRADUÇÕES DOS FERIADOS
========================================================= */

if (
  texto.includes(
    "  const feriadoTraduzido ="
  )
) {
  const inicio =
    texto.indexOf(
      "  const feriadoTraduzido ="
    );

  const proximoEffect =
    texto.indexOf(
      "  useEffect(() => {",
      inicio
    );

  exigir(
    inicio !== -1 &&
      proximoEffect !== -1,
    "Não foi possível localizar o fim de feriadoTraduzido."
  );

  texto =
    texto.slice(0, inicio) +
    texto.slice(
      proximoEffect
    );
}

/* =========================================================
   6. BUSCA O FERIADO GLOBAL DA INSTITUIÇÃO
========================================================= */

if (
  !texto.includes(
    "async function carregarFeriadoHoje"
  )
) {
  const ancora =
    "  useEffect(() => {\n    async function carregarTurmas()";

  exigir(
    texto.includes(ancora),
    "useEffect de carregarTurmas não encontrado."
  );

  const novo =
`  useEffect(() => {
    const controller =
      new AbortController();

    async function carregarFeriadoHoje() {
      try {
        const res =
          await fetch(
            \`/api/phanyx/feriado-atual?locale=\${encodeURIComponent(
              locale
            )}\`,
            {
              cache: "no-store",
              credentials:
                "include",
              signal:
                controller.signal,
            }
          );

        if (!res.ok) {
          setFeriadoHoje(null);
          return;
        }

        const data =
          await res.json();

        const feriado =
          data?.feriado;

        /*
         * Esta página mostra a saudação
         * apenas no próprio dia do feriado.
         *
         * Avisos antecipados continuam sendo
         * responsabilidade da CentralAvisosPhanyx.
         */
        if (
          feriado &&
          feriado.diasRestantes === 0 &&
          feriado.nome
        ) {
          setFeriadoHoje({
            nome:
              String(
                feriado.nome
              ),
          });

          return;
        }

        setFeriadoHoje(null);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Erro ao carregar feriado da instituição:",
          error
        );

        setFeriadoHoje(null);
      }
    }

    carregarFeriadoHoje();

    return () => {
      controller.abort();
    };
  }, [locale]);

`;

  texto = texto.replace(
    ancora,
    novo + ancora
  );
}

/* =========================================================
   7. JSX PASSA A USAR O FERIADO GLOBAL
========================================================= */

texto = texto.replace(
  "{feriado ? (",
  "{feriadoHoje ? ("
);

texto = texto.replace(
`                  holiday: feriadoTraduzido || feriado,`,
`                  holiday: feriadoHoje.nome,`
);

/* =========================================================
   8. GARANTIAS
========================================================= */

exigir(
  !texto.includes(
    "feriadoNacionalHoje"
  ),
  "Ainda existe referência a feriadoNacionalHoje."
);

exigir(
  !texto.includes(
    "feriadoTraduzido"
  ),
  "Ainda existe referência a feriadoTraduzido."
);

exigir(
  texto.includes(
    "feriadoHoje.diasRestantes"
  ) === false,
  "Uso inesperado de diasRestantes no JSX."
);

exigir(
  texto.includes(
    "feriado.diasRestantes === 0"
  ),
  "Regra do próprio dia não foi adicionada."
);

fs.writeFileSync(
  caminho,
  texto.replace(
    /\n/g,
    eol
  ),
  "utf8"
);

console.log(
  "✓ Motor brasileiro local removido de Turmas do Professor"
);

console.log(
  "✓ Página agora consulta o calendário global da instituição"
);

console.log(
  "✓ Saudação aparece somente no próprio dia do feriado"
);

console.log(
  "✓ Nome do feriado já chega traduzido pelo locale do professor"
);

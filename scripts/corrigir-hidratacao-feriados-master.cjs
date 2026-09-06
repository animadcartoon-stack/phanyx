const fs = require("fs");

const arquivo = "app/master/feriados/page.tsx";
let texto = fs.readFileSync(arquivo, "utf8");

/* 1. Adiciona estado de montagem */
const ancoraEstado = `  const [feriados, setFeriados] =
    useState<Feriado[]>([]);`;

const novoEstado = `  const [montado, setMontado] =
    useState(false);

  const [feriados, setFeriados] =
    useState<Feriado[]>([]);`;

if (!texto.includes(ancoraEstado)) {
  throw new Error("Âncora do estado não encontrada.");
}

texto = texto.replace(
  ancoraEstado,
  novoEstado
);

/* 2. Marca o componente como montado no navegador */
const ancoraEffect = `  useEffect(() => {
    void carregar();
  }, [carregar]);`;

const novoEffect = `  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);`;

if (!texto.includes(ancoraEffect)) {
  throw new Error("useEffect de carregar não encontrado.");
}

texto = texto.replace(
  ancoraEffect,
  novoEffect
);

/* 3. Impede criação da lista de países durante SSR */
const paisesAntigo = `  const paises = useMemo(() => {
    return getCountries()
      .map((codigo) => ({
        codigo,
        nome:
          nomesPaises.of(codigo) ||
          codigo,
      }))
      .sort((a, b) =>
        a.nome.localeCompare(
          b.nome,
          locale
        )
      );
  }, [locale, nomesPaises]);`;

const paisesNovo = `  const paises = useMemo(() => {
    if (!montado) {
      return [];
    }

    return getCountries()
      .map((codigo) => ({
        codigo,
        nome:
          nomesPaises.of(codigo) ||
          codigo,
      }))
      .sort((a, b) =>
        a.nome.localeCompare(
          b.nome,
          locale
        )
      );
  }, [locale, montado, nomesPaises]);`;

if (!texto.includes(paisesAntigo)) {
  throw new Error("Bloco de países não encontrado.");
}

texto = texto.replace(
  paisesAntigo,
  paisesNovo
);

/* 4. Evita divergência também na tabela de feriados */
const nomePaisAntigo = `  const nomePais = useCallback(
    (codigo: string) => {
      return (
        nomesPaises.of(
          codigo as CountryCode
        ) || codigo
      );
    },
    [nomesPaises]
  );`;

const nomePaisNovo = `  const nomePais = useCallback(
    (codigo: string) => {
      if (!montado) {
        return codigo;
      }

      return (
        nomesPaises.of(
          codigo as CountryCode
        ) || codigo
      );
    },
    [montado, nomesPaises]
  );`;

if (!texto.includes(nomePaisAntigo)) {
  throw new Error("Função nomePais não encontrada.");
}

texto = texto.replace(
  nomePaisAntigo,
  nomePaisNovo
);

fs.writeFileSync(arquivo, texto, "utf8");

console.log("✓ Hidratação da lista internacional de países corrigida");

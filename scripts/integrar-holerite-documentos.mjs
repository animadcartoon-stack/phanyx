import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const root = process.cwd();

const files = {
  gerar: path.join(root, "app/api/admin/documentos/gerar/route.ts"),
  templates: path.join(root, "app/api/admin/documentos/templates/route.ts"),
  holerites: path.join(root, "app/api/admin/rh/holerites/route.ts"),
  pagina: path.join(root, "app/admin/documentos/gerar/page.tsx"),
};

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Arquivo não encontrado: ${file}`);
  return fs.readFileSync(file, "utf8");
}

function eolOf(text) {
  return text.includes("\r\n") ? "\r\n" : "\n";
}

function lf(text) {
  return text.replace(/\r\n/g, "\n");
}

function restoreEol(text, eol) {
  return eol === "\r\n" ? text.replace(/\n/g, "\r\n") : text;
}

function once(text, oldText, newText, label) {
  const total = text.split(oldText).length - 1;
  if (total !== 1) {
    throw new Error(
      `Segurança: esperado 1 trecho para "${label}", encontrados ${total}. Nenhum arquivo foi alterado.`
    );
  }
  return text.replace(oldText, newText);
}

function insertBefore(text, anchor, insert, label) {
  return once(text, anchor, insert + anchor, label);
}

function insertAfter(text, anchor, insert, label) {
  return once(text, anchor, anchor + insert, label);
}

function syntax(name, text, jsx = false) {
  const result = ts.transpileModule(text, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      ...(jsx ? { jsx: ts.JsxEmit.ReactJSX } : {}),
    },
    fileName: name,
    reportDiagnostics: true,
  });

  const errors = (result.diagnostics || []).filter(
    (d) => d.category === ts.DiagnosticCategory.Error
  );

  if (errors.length) {
    throw new Error(
      `Validação de sintaxe falhou em ${name}:\n` +
        errors
          .map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"))
          .join("\n")
    );
  }
}

const original = Object.fromEntries(
  Object.entries(files).map(([k, f]) => [k, read(f)])
);

const eols = Object.fromEntries(
  Object.entries(original).map(([k, v]) => [k, eolOf(v)])
);

let gerar = lf(original.gerar);
let templates = lf(original.templates);
let holerites = lf(original.holerites);
let pagina = lf(original.pagina);

const markers = [
  "const usaTagsHolerite =",
  "let holeriteDocumento = null as any;",
  "type HoleriteDocumento =",
  'searchParams.get("funcionarioId")',
];

const found = markers.map((m) =>
  [gerar, pagina, holerites].some((text) => text.includes(m))
);

if (found.every(Boolean)) {
  console.log("A integração de holerite já está aplicada.");
  process.exit(0);
}

if (found.some(Boolean)) {
  throw new Error(
    "Segurança: integração parcial de holerite detectada. Nenhum arquivo foi alterado."
  );
}

/* GET de holerites: acrescenta filtro opcional por funcionário. */
holerites = once(
  holerites,
`export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const holerites = await prisma.holeriteRH.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        arquivado: false,
      },`,
`export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const funcionarioIdFiltro = Number(
      searchParams.get("funcionarioId"),
    );

    const usarFiltroFuncionario =
      Number.isInteger(funcionarioIdFiltro) &&
      funcionarioIdFiltro > 0;

    const holerites = await prisma.holeriteRH.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        arquivado: false,

        ...(usarFiltroFuncionario
          ? { funcionarioId: funcionarioIdFiltro }
          : {}),
      },`,
  "filtro de funcionário no GET de holerites"
);

/* Tags de holerite passam a ser automáticas. */
const autoStart = templates.indexOf("const TAGS_AUTOMATICAS_DOCUMENTO");
const autoEnd = templates.indexOf("]);", autoStart);

if (autoStart < 0 || autoEnd < 0) {
  throw new Error("Conjunto TAGS_AUTOMATICAS_DOCUMENTO não encontrado.");
}

const autoBlock = templates.slice(autoStart, autoEnd + 3);

const payrollTags = [
  "competenciaMes",
  "competenciaAno",
  "competenciaHolerite",
  "eventosHolerite",
  "totalVencimentos",
  "totalDescontos",
  "valorLiquido",
  "baseInss",
  "baseFgts",
  "fgtsMes",
  "baseIrrf",
];

if (payrollTags.some((tag) => autoBlock.includes(`"${tag}"`))) {
  throw new Error(
    "Segurança: alguma tag de holerite já está automática. Estado parcial detectado."
  );
}

const autoInsert =
  "\n\n  // RH - holerite selecionado explicitamente\n" +
  payrollTags.map((tag) => `  "${tag}",`).join("\n") +
  "\n";

templates =
  templates.slice(0, autoEnd) +
  autoInsert +
  templates.slice(autoEnd);

/* Gerador: catálogo das tags. */
gerar = insertBefore(
  gerar,
  "export async function POST(req: Request) {",
`const TAGS_HOLERITE_DOCUMENTO = new Set([
  "competenciaMes",
  "competenciaAno",
  "competenciaHolerite",
  "eventosHolerite",
  "totalVencimentos",
  "totalDescontos",
  "valorLiquido",
  "baseInss",
  "baseFgts",
  "fgtsMes",
  "baseIrrf",
]);

`,
  "catálogo de tags de holerite"
);

/* Gerador: ID explícito do holerite. */
gerar = insertBefore(
  gerar,
  "    const tituloPersonalizado = body?.titulo",
`    const holeriteId =
      body?.holeriteId
        ? Number(body.holeriteId)
        : null;

`,
  "holeriteId"
);

/* Gerador: descobre se o template usa holerite. */
gerar = insertAfter(
  gerar,
`    const tagsDoTemplate =
      new Set(
        extrairTagsTemplate(
          template.conteudo
        )
      );
`,
`
    const usaTagsHolerite =
      Array.from(tagsDoTemplate).some(
        (tag) =>
          TAGS_HOLERITE_DOCUMENTO.has(tag)
      );
`,
  "detecção de tags de holerite"
);

/* Gerador: valida seleção. */
gerar = insertBefore(
  gerar,
`    if (
      ehContratoAcademico &&
      !matriculaId
    ) {`,
`    if (
      usaTagsHolerite &&
      !ehDocumentoFuncionario
    ) {
      return NextResponse.json(
        {
          error:
            "Templates com tags de holerite precisam usar contexto de funcionário, professor ou RH.",
        },
        { status: 400 }
      );
    }

    if (
      usaTagsHolerite &&
      (
        !holeriteId ||
        !Number.isInteger(holeriteId) ||
        holeriteId <= 0
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Selecione a competência do holerite antes de gerar este documento.",
        },
        { status: 400 }
      );
    }

`,
  "validação da competência"
);

/* Gerador: estado do holerite. */
gerar = insertBefore(
  gerar,
  "    let ferias = null as any;",
  "    let holeriteDocumento = null as any;\n",
  "variável do holerite"
);

/* Gerador: carrega exatamente o holerite selecionado. */
gerar = insertBefore(
  gerar,
`    if (
      ehDocumentoFuncionario &&
      funcionario
    ) {`,
`    if (
      usaTagsHolerite &&
      funcionario
    ) {
      holeriteDocumento =
        await prisma.holeriteRH.findFirst({
          where: {
            id: holeriteId as number,
            funcionarioId: funcionario.id,
            instituicaoId: user.instituicaoId,
            arquivado: false,
            cancelado: false,
          },
          include: {
            eventos: {
              orderBy: { id: "asc" },
            },
          },
        });

      if (
        !holeriteDocumento ||
        ["ARQUIVADO", "CANCELADO"].includes(
          String(
            holeriteDocumento?.status || ""
          ).toUpperCase()
        )
      ) {
        return NextResponse.json(
          {
            error:
              "O holerite selecionado não existe, está cancelado/arquivado ou não pertence ao funcionário escolhido.",
          },
          { status: 404 }
        );
      }
    }

`,
  "consulta exata do holerite"
);

/* Gerador: resolve as tags com o registro escolhido. */
gerar = insertBefore(
  gerar,
  "            funcionarioDataDesligamento:",
`            competenciaMes:
              holeriteDocumento
                ? String(
                    holeriteDocumento.competenciaMes
                  ).padStart(2, "0")
                : "",

            competenciaAno:
              holeriteDocumento
                ? String(
                    holeriteDocumento.competenciaAno
                  )
                : "",

            competenciaHolerite:
              holeriteDocumento
                ? \`\${String(
                    holeriteDocumento.competenciaMes
                  ).padStart(2, "0")}/\${holeriteDocumento.competenciaAno}\`
                : "",

            eventosHolerite:
              Array.isArray(
                holeriteDocumento?.eventos
              ) &&
              holeriteDocumento.eventos.length > 0
                ? holeriteDocumento.eventos
                    .map((evento: any) => {
                      const partes = [
                        evento?.codigo || "",
                        evento?.descricao || "",
                        evento?.referencia || "",
                        evento?.tipo || "",
                        formatarMoeda(
                          Number(evento?.valor || 0)
                        ),
                      ].filter(Boolean);

                      return \`- \${partes.join(" | ")}\`;
                    })
                    .join("\\n")
                : "-",

            totalVencimentos:
              holeriteDocumento
                ? formatarMoeda(
                    Number(
                      holeriteDocumento.totalVencimentos || 0
                    )
                  )
                : "",

            totalDescontos:
              holeriteDocumento
                ? formatarMoeda(
                    Number(
                      holeriteDocumento.totalDescontos || 0
                    )
                  )
                : "",

            valorLiquido:
              holeriteDocumento
                ? formatarMoeda(
                    Number(
                      holeriteDocumento.valorLiquido || 0
                    )
                  )
                : "",

            baseInss:
              holeriteDocumento
                ? formatarMoeda(
                    Number(holeriteDocumento.baseInss || 0)
                  )
                : "",

            baseFgts:
              holeriteDocumento
                ? formatarMoeda(
                    Number(holeriteDocumento.baseFgts || 0)
                  )
                : "",

            fgtsMes:
              holeriteDocumento
                ? formatarMoeda(
                    Number(holeriteDocumento.fgtsMes || 0)
                  )
                : "",

            baseIrrf:
              holeriteDocumento
                ? formatarMoeda(
                    Number(holeriteDocumento.baseIrrf || 0)
                  )
                : "",

`,
  "valores das tags de holerite"
);

/* Página: tipo + catálogo. */
pagina = insertBefore(
  pagina,
  "type Matricula = {",
`type HoleriteDocumento = {
  id: number;
  funcionarioId: number;
  competenciaMes: number;
  competenciaAno: number;
  status?: string | null;
  arquivado?: boolean | null;
  cancelado?: boolean | null;
};

const TAGS_HOLERITE_DOCUMENTO = new Set([
  "competenciaMes",
  "competenciaAno",
  "competenciaHolerite",
  "eventosHolerite",
  "totalVencimentos",
  "totalDescontos",
  "valorLiquido",
  "baseInss",
  "baseFgts",
  "fgtsMes",
  "baseIrrf",
]);

`,
  "tipo de holerite na página"
);

/* Página: estados. */
pagina = insertBefore(
  pagina,
`  const [
    pessoaRh,
    setPessoaRh,
  ] = useState("");`,
`  const [
    holerites,
    setHolerites,
  ] = useState<HoleriteDocumento[]>([]);

  const [
    holeriteId,
    setHoleriteId,
  ] = useState("");

  const [
    carregandoHolerites,
    setCarregandoHolerites,
  ] = useState(false);

`,
  "estados de holerite"
);

/* Página: identifica uso e funcionário real. */
pagina = insertAfter(
  pagina,
`  const ehDocumentoFuncionario =
    contextoSelecionado ===
    "funcionario" ||
    contextoSelecionado ===
    "professor" ||
    contextoSelecionado ===
    "rh";
`,
`
  const usaTagsHolerite =
    Array.isArray(
      templateSelecionado?.tags
    ) &&
    templateSelecionado!.tags!.some(
      (tag) =>
        TAGS_HOLERITE_DOCUMENTO.has(tag)
    );

  const funcionarioIdSelecionado =
    (() => {
      if (!pessoaRh) return null;

      const [tipo, idTexto] =
        pessoaRh.split(":");

      const id = Number(idTexto);

      if (!Number.isInteger(id) || id <= 0) {
        return null;
      }

      if (tipo === "FUNCIONARIO") {
        return id;
      }

      if (tipo === "PROFESSOR") {
        const professor =
          professores.find(
            (item) => item.id === id
          );

        const funcionarioId =
          Number(
            professor?.funcionario?.id
          );

        return Number.isInteger(funcionarioId) &&
          funcionarioId > 0
          ? funcionarioId
          : null;
      }

      return null;
    })();
`,
  "uso de tags de holerite na página"
);

/* Página: busca holerites somente do funcionário selecionado. */
pagina = insertAfter(
  pagina,
`  useEffect(() => {
    if (ehDocumentoFuncionario) {
      setAlunoId("");
      setMatriculaId("");
    } else {
      setPessoaRh("");
    }
  }, [
    templateSelecionado?.id,
    ehDocumentoFuncionario,
  ]);
`,
`
  useEffect(() => {
    setHoleriteId("");
    setHolerites([]);

    if (
      !usaTagsHolerite ||
      !funcionarioIdSelecionado
    ) {
      return;
    }

    let ativo = true;

    async function carregarHoleritesDoFuncionario() {
      try {
        setCarregandoHolerites(true);

        const res = await fetch(
          \`/api/admin/rh/holerites?funcionarioId=\${funcionarioIdSelecionado}\`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const data =
          await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(
            data?.error ||
            "Erro ao carregar holerites."
          );
        }

        if (!ativo) return;

        setHolerites(
          extrairLista<HoleriteDocumento>(
            data,
            "holerites"
          ).filter(
            (item) =>
              !item.arquivado &&
              !item.cancelado &&
              !["ARQUIVADO", "CANCELADO"].includes(
                String(item.status || "").toUpperCase()
              )
          )
        );
      } catch (error) {
        console.error(
          "Erro ao carregar holerites do funcionário",
          error
        );

        if (ativo) {
          setHolerites([]);
        }
      } finally {
        if (ativo) {
          setCarregandoHolerites(false);
        }
      }
    }

    void carregarHoleritesDoFuncionario();

    return () => {
      ativo = false;
    };
  }, [
    usaTagsHolerite,
    funcionarioIdSelecionado,
  ]);
`,
  "carregamento dos holerites"
);

/* Página: exige competência. */
pagina = insertBefore(
  pagina,
  "      const quantidadeVias =",
`      if (
        usaTagsHolerite &&
        !holeriteId
      ) {
        setErro(
          "Selecione a competência do holerite para emitir este documento."
        );
        return;
      }

`,
  "validação do holerite na página"
);

/* Página: envia o ID. */
pagina = insertAfter(
  pagina,
`            professorId:
              professorIdEnvio,
`,
`
            holeriteId:
              usaTagsHolerite &&
              holeriteId
                ? Number(holeriteId)
                : null,
`,
  "envio do holeriteId"
);

/* Página: seletor da competência. */
pagina = insertBefore(
  pagina,
`            <p className="phanyx-doc-muted mt-2 text-xs">
              Professores com vínculo RH aparecem na lista de funcionários.
              Professores sem vínculo RH precisam ser vinculados ao RH antes da
              emissão de documentos trabalhistas.
            </p>`,
`            {usaTagsHolerite && (
              <div className="mt-4">
                <label className="phanyx-doc-label mb-2 block text-sm">
                  Holerite / competência
                </label>

                <select
                  className="phanyx-doc-input"
                  value={holeriteId}
                  onChange={(evento) =>
                    setHoleriteId(
                      evento.target.value
                    )
                  }
                  disabled={
                    !funcionarioIdSelecionado ||
                    carregandoHolerites
                  }
                >
                  <option value="">
                    {carregandoHolerites
                      ? "Carregando holerites..."
                      : !funcionarioIdSelecionado
                        ? "Selecione primeiro o funcionário"
                        : holerites.length === 0
                          ? "Nenhum holerite disponível"
                          : "Selecione a competência"}
                  </option>

                  {holerites.map(
                    (holerite) => (
                      <option
                        key={holerite.id}
                        value={holerite.id}
                      >
                        {String(
                          holerite.competenciaMes
                        ).padStart(2, "0")}
                        /{holerite.competenciaAno}
                        {holerite.status
                          ? \` — \${holerite.status}\`
                          : ""}
                      </option>
                    )
                  )}
                </select>

                <p className="phanyx-doc-muted mt-2 text-xs">
                  A competência é escolhida explicitamente para que os valores
                  sejam retirados do holerite correto.
                </p>
              </div>
            )}

`,
  "seletor de holerite"
);

/* Preservações obrigatórias. */
for (const marker of [
  "__PHANYX_LOGO_INSTITUICAO__",
  "__PHANYX_ASSINATURA_DIRETOR__",
  "__PHANYX_BLOCO_ASSINATURA_DIRETOR__",
  "valoresTemplate.cursoNome",
  "valoresTemplate.disciplinasContratadas",
  "await prisma.feriasRH.findFirst",
  "await prisma.exameMedicoRH.findFirst",
  "await prisma.rescisaoRH.findFirst",
  "await prisma.ocorrenciaRH.findFirst",
]) {
  if (!gerar.includes(marker)) {
    throw new Error(
      `Segurança: lógica anterior obrigatória ausente após a transformação: ${marker}`
    );
  }
}

/* Valida sintaxe antes de gravar. */
syntax("gerar/route.ts", gerar);
syntax("templates/route.ts", templates);
syntax("rh/holerites/route.ts", holerites);
syntax("documentos/gerar/page.tsx", pagina, true);

/* Backups e gravação. */
const stamp = new Date()
  .toISOString()
  .replace(/[-:]/g, "")
  .replace(/\.\d{3}Z$/, "Z");

const backups = {};

for (const [key, file] of Object.entries(files)) {
  const backup =
    `${file}.antes-integracao-holerite-documentos-${stamp}.bak`;

  fs.copyFileSync(file, backup);
  backups[key] = backup;
}

try {
  fs.writeFileSync(
    files.gerar,
    restoreEol(gerar, eols.gerar),
    "utf8"
  );
  fs.writeFileSync(
    files.templates,
    restoreEol(templates, eols.templates),
    "utf8"
  );
  fs.writeFileSync(
    files.holerites,
    restoreEol(holerites, eols.holerites),
    "utf8"
  );
  fs.writeFileSync(
    files.pagina,
    restoreEol(pagina, eols.pagina),
    "utf8"
  );
} catch (error) {
  for (const [key, file] of Object.entries(files)) {
    fs.copyFileSync(backups[key], file);
  }
  throw error;
}

console.log("");
console.log("=== HOLERITE INTEGRADO À EMISSÃO DE DOCUMENTOS ===");
console.log("");
console.log("OK: competência escolhida explicitamente");
console.log("OK: somente holerites do funcionário selecionado são listados");
console.log("OK: backend valida instituição + funcionário + holerite");
console.log("OK: eventos, vencimentos, descontos, líquido e bases usam o holerite escolhido");
console.log("OK: tags de holerite passaram a ser automáticas");
console.log("OK: férias, ASO, rescisão, ocorrências, logo e assinaturas foram preservados");
console.log("");
console.log("Próximo passo: execute npx tsc --noEmit");

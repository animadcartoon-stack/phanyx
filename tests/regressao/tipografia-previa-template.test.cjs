const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");
const puppeteer = require("puppeteer-core");

const raiz = path.resolve(__dirname, "../..");
const ler = (arquivo) => fs.readFileSync(path.join(raiz, arquivo), "utf8");

function carregar(arquivo) {
  const exports = {};
  const codigo = ts.transpileModule(ler(arquivo), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(codigo, {
    exports,
    require: (modulo) => carregar(modulo.replace(/^@\//, "") + ".ts"),
  });
  return exports;
}

test("títulos e formatação do editor correspondem às duas prévias", async (t) => {
  const caminhosChrome = [
    process.env.CHROME_EXECUTABLE_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  const executavel = caminhosChrome.find(caminho => caminho && fs.existsSync(caminho));
  if (!executavel && process.platform !== "linux") {
    return t.skip("Chrome local não encontrado. Configure CHROME_EXECUTABLE_PATH para testar a prévia.");
  }
  const chromium = (await import("@sparticuz/chromium")).default;
  const browser = await puppeteer.launch({
    executablePath: executavel || await chromium.executablePath(),
    args: executavel ? ["--no-sandbox"] : chromium.args,
    headless: executavel ? true : "shell",
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1152, height: 720 });
    const conteudo = [
      '<h1 style="text-align: center"><span style="color: #0055ff">Plano de Aula</span></h1>',
      '<p style="text-align: left"><span style="font-size: 11pt; font-family: Arial">Nome</span></p>',
      '<h2><span>Metodologia</span></h2>',
      '<h2><span style="font-size: 13pt; font-weight: 400">Observações</span></h2>',
    ].join("");
    const { montarRenderizacaoDocumento } = carregar("lib/documentos/renderizador-template-documento.ts");
    const { montarHtmlNavegador } = carregar("lib/documentos/visualizacao-navegador.ts");
    const render = montarRenderizacaoDocumento({
      conteudo,
      instituicao: { nome: "Instituição Exemplo" },
      formatoImpressao: "A4_INTEIRA",
      modoPrevia: true,
      mostrarValidacao: false,
    });
    const medir = () => Array.from(
      document.querySelectorAll(":is(.phanyx-conteudo, .editor-template-phanyx) > :is(h1, h2, p) > span"),
      elemento => {
        const estilo = getComputedStyle(elemento);
        return [estilo.fontSize, estilo.fontWeight, estilo.fontFamily, estilo.color, estilo.textAlign];
      }
    );
    const cssEditor = ler("components/documentos/EditorTemplatePHANYX.tsx")
      .match(/<style jsx global>\{`([\s\S]+?)`\}<\/style>/)[1];
    const estilosEditor = vm.runInNewContext("`" + cssEditor + "`", carregar("lib/documentos/tipografia-template.ts"));
    await page.setContent(`
      <style>
        h1,h2,h3,h4,h5,h6 { font-size: inherit; font-weight: inherit; margin: 0; }
        .editor-template-phanyx { color: black; font: 11pt Arial, Helvetica, sans-serif; }
        ${estilosEditor}
      </style>
      <div class="editor-template-phanyx">${conteudo}</div>
    `);
    const editor = await page.evaluate(medir);

    await page.emulateMediaType("print");
    await page.setContent(render.html);
    const pdf = await page.evaluate(medir);
    assert.deepEqual(editor.map(estilo => estilo.slice(0, 2)), pdf.map(estilo => estilo.slice(0, 2)));
    assert.deepEqual(pdf[0].slice(3), ["rgb(0, 85, 255)", "center"]);
    assert.equal(pdf[1][4], "left");
    assert.equal(pdf[2][0], "22px");
    assert.deepEqual(pdf[3].slice(0, 2), ["17.3333px", "400"]);

    await page.emulateMediaType("screen");
    await page.setContent(montarHtmlNavegador(render, "pt-BR"));
    const frame = await (await page.waitForSelector("iframe")).contentFrame();
    await frame.waitForSelector("main.phanyx-conteudo");
    assert.deepEqual(await frame.evaluate(medir), pdf);
    const margens = () => {
      const papel = document.body.getBoundingClientRect();
      const texto = document.querySelector("main.phanyx-conteudo").getBoundingClientRect();
      return [texto.left - papel.left, papel.right - texto.right];
    };
    const margensDesktop = await frame.evaluate(margens);
    for (const margem of margensDesktop) assert.ok(Math.abs(margem - 68) < 1, margem);

    await page.setViewport({ width: 390, height: 844 });
    const margensCelular = await frame.evaluate(margens);
    for (const margem of margensCelular) assert.ok(margem > 8 && margem < 48, margem);
    assert.equal(await frame.evaluate(() => document.documentElement.scrollWidth), 390);
  } finally {
    await browser.close();
  }
});

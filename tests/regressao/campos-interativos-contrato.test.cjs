require("ts-node").register({
  transpileOnly: true,
  compilerOptions: { module: "CommonJS", moduleResolution: "Node" },
});
const test = require("node:test");
const assert = require("node:assert/strict");
const { PDFDocument, StandardFonts } = require("pdf-lib");

const {
  codificarConfiguracaoDocumento,
  lerCamposEscolha,
  validarRespostasCampos,
  validarCamposModelo,
  renderizarCamposEscolha,
  inserirAntesDoAnexo,
  selecionarConteudoContrato,
} = require("../../lib/documentos/campos-interativos.ts");
const { renderizarHtmlTipTapNoPdf } = require("../../lib/pdf/renderizarHtmlTipTap.ts");

const escolha = (id, obrigatoria = true) => ({
  id, pergunta: "Divulgação de imagem", opcoes: ["AUTORIZO", "NÃO AUTORIZO"], obrigatoria, estilo: "parenteses",
});
const elemento = (atributo, valor) =>
  `<div ${atributo}="${codificarConfiguracaoDocumento(valor)}"></div>`;
const campo = (id, obrigatoria) => elemento("data-phanyx-choice", escolha(id, obrigatoria));
const anexo = '<div data-phanyx-start-annex="true"></div>';
const bloco = elemento("data-phanyx-contract-signatures", { largura: 80, testemunhas: false });

test("aceita a recusa como resposta obrigatória e rejeita falta, valores inválidos e campos alheios", () => {
  const campos = lerCamposEscolha(campo("institucional") + campo("publicidade", false));
  assert.equal(validarRespostasCampos(campos, {}).erro, "respostaObrigatoria");
  assert.equal(validarRespostasCampos(campos, { institucional: 8 }).erro, "respostaInvalida");
  assert.equal(validarRespostasCampos(campos, { institucional: "1" }).erro, "respostaInvalida");
  assert.equal(validarRespostasCampos(campos, { institucional: 1, outro: 0 }).erro, "respostaInvalida");
  assert.deepEqual(validarRespostasCampos(campos, { institucional: 1 }).respostas, { institucional: 1 });
  assert.deepEqual(validarRespostasCampos(campos, { institucional: 0, publicidade: 1 }).respostas, { institucional: 0, publicidade: 1 });
});

test("prévia e impressão mantêm espaços em branco; o assinado marca uma opção por pergunta", () => {
  const html = campo("institucional") + campo("publicidade");
  assert.doesNotMatch(renderizarCamposEscolha(html), /\(X\)/);
  const final = renderizarCamposEscolha(html, { institucional: 1, publicidade: 0 });
  assert.match(final, /\( \) AUTORIZO[\s\S]*\(X\) NÃO AUTORIZO/);
  assert.match(final, /\(X\) AUTORIZO[\s\S]*\( \) NÃO AUTORIZO/);
});

test("valida identificação e opções, permite campos diversos e impede bloco duplicado", () => {
  assert.equal(validarCamposModelo(campo("um") + campo("dois")), null);
  assert.equal(validarCamposModelo(campo("um") + campo("um")), "campoDuplicado");
  assert.equal(validarCamposModelo(bloco + bloco), "blocoDuplicado");
  assert.equal(validarCamposModelo(elemento("data-phanyx-choice", { ...escolha("um"), opcoes: ["Sim", "sim"] })), "campoInvalido");
  const especial = elemento("data-phanyx-choice", { ...escolha("seguro"), pergunta: '<script>alert("x")</script>' });
  assert.match(renderizarCamposEscolha(especial), /&lt;script&gt;/);
  assert.doesNotMatch(renderizarCamposEscolha(especial), /<script>/);
});

test("quadro financeiro vem antes do anexo e o PDF usa a versão emitida para as escolhas", () => {
  assert.equal(inserirAntesDoAnexo("Contrato" + anexo + "Anexo", "Quadro"), "ContratoQuadro" + anexo + "Anexo");
  assert.equal(inserirAntesDoAnexo("<body>Contrato</body>", "Quadro"), "<body>ContratoQuadro</body>");
  assert.equal(selecionarConteudoContrato("legado", "atualizado"), "atualizado");
  assert.equal(selecionarConteudoContrato(campo("original"), campo("novo")), campo("original"));
  assert.equal(selecionarConteudoContrato("legado", campo("novo")), "legado");
});

test("PDF inicia o anexo em nova página e chama o bloco de assinaturas no lugar escolhido", async () => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const chamadas = [];
  const page = pdf.addPage();
  const resultado = await renderizarHtmlTipTapNoPdf({
    html: "<p>Contrato</p>" + anexo + renderizarCamposEscolha(campo("institucional"), { institucional: 1 }) + bloco + "<p>Fim</p>",
    page, font, bold: font, x: 50, yInicial: 700, maxWidth: 490, pageHeight: 842,
    criarNovaPagina: async () => pdf.addPage(),
    desenharAssinaturas: async (pagina, y, config) => {
      chamadas.push({ indice: pdf.getPages().indexOf(pagina), y, config });
      return { page: pagina, y: y - 70 };
    },
  });
  assert.equal(pdf.getPageCount(), 2);
  assert.equal(chamadas.length, 1);
  assert.deepEqual(chamadas[0].config, { largura: 80, testemunhas: false });
  assert.equal(chamadas[0].indice, 1);
  assert.ok(resultado.y < chamadas[0].y - 70);
  assert.ok((await pdf.save()).length > 500);
});

import { NextResponse } from "next/server";
import { renderizarCamposDocentes } from "@/lib/documentos-docentes/campos-impressao";
import fs from "node:fs";
import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";
import { prisma } from "@/lib/prisma";
import { documentoAutorizado } from "@/lib/documentos-docentes/seguranca";
import { escaparHtmlDocente, hashVersaoDocente } from "@/lib/documentos-docentes/integridade";
import { montarRenderizacaoDocumento } from "@/lib/documentos/renderizador-template-documento";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const CHROMIUM_PACK = "https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar";

function htmlCampos(modelo: string, campos: unknown, branco: boolean): string {
  const mapa = campos && typeof campos === "object" && !Array.isArray(campos) ? campos as Record<string,unknown> : {};
  // Desativa conteúdo ativo do template, sem apagar tabelas e formatação da gráfica.
  const base = String(modelo||"")
    .replace(/<(script|iframe|object|embed|form|base|link|meta|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|iframe|object|embed|form|base|link|meta|svg|math)\b[^>]*\/?\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\bjavascript\s*:/gi, "");
  if (!base.trim()) return '<p style="font-size:14px">Documento enviado sem modelo de preenchimento. Consulte os anexos.</p>';
  return renderizarCamposDocentes(base, mapa, branco);
}

async function abrirNavegador() {
  const caminhos = [process.env.CHROME_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].filter((v):v is string=>Boolean(v));
  const local = caminhos.find(p=>fs.existsSync(p));
  if (local && process.env.NODE_ENV!=="production") return puppeteer.launch({executablePath:local,headless:true,args:["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage"]});
  return puppeteer.launch({args:chromium.args,executablePath:await chromium.executablePath(CHROMIUM_PACK),headless:true});
}

export async function GET(req: Request, {params}:{params:{id:string}}) {
  const auth = await documentoAutorizado(Number(params.id));
  if (!auth) return NextResponse.json({error:"Documento inexistente ou sem permissão."},{status:404});
  const u = new URL(req.url);
  const numero = Number(u.searchParams.get("versao") || auth.documento.versaoAtual);
  const branco = u.searchParams.get("branco") === "1";
  const baixar = u.searchParams.get("baixar") === "1";
  if (!Number.isSafeInteger(numero)||numero<1||numero>auth.documento.versaoAtual) return NextResponse.json({error:"Versão inválida."},{status:400});
  const [versao, anexos, assinaturas, instituicao] = await Promise.all([
    prisma.documentoDocenteVersao.findUnique({where:{documentoId_numero:{documentoId:auth.documento.id,numero}}}),
    prisma.documentoDocenteAnexo.findMany({where:{documentoId:auth.documento.id,versao:{lte:numero}},select:{id:true,versao:true,nomeOriginal:true,mime:true,tamanho:true,sha256:true},orderBy:{id:"asc"}}),
    prisma.documentoDocenteAssinatura.findMany({where:{documentoId:auth.documento.id,versao:numero},orderBy:{assinadoEm:"asc"}}),
    prisma.instituicao.findUnique({where:{id:auth.ctx.instituicaoId},select:{nome:true}}),
  ]);
  if (!versao) return NextResponse.json({error:"Versão inexistente."},{status:404});
  const hash = hashVersaoDocente(auth.documento.id,versao,anexos);
  if (!branco && assinaturas.some(a=>a.hashConteudo!==hash)) return NextResponse.json({error:"A integridade do documento assinado não pôde ser confirmada."},{status:409});
  const titulo = escaparHtmlDocente(auth.documento.titulo);
  const nomeInstituicao = instituicao?.nome || "Instituição";
  const conteudo = htmlCampos(versao.modeloSnapshot,versao.campos,branco);
  const assinaturasHtml = !branco && assinaturas.length ? assinaturas.map(a=>`<div style="display:inline-block;min-width:230px;width:43%;vertical-align:top;margin:16px 2% 12px 0;page-break-inside:avoid;border-top:1px solid #64748b;padding-top:10px">
    ${a.tipo==="DESENHO" && a.imagem.startsWith("data:image/png;base64,") ? `<img src="${a.imagem}" style="display:block;max-width:220px;max-height:85px;object-fit:contain" />` : '<div style="font-size:14px;font-style:italic">Assinado eletronicamente</div>'}
    <strong>${escaparHtmlDocente(a.nomeAssinante)}</strong><br />${a.papel==="ADMIN"?"Administração/coordenação":"Professor(a)"}<br /><span style="font-size:10px">${new Date(a.assinadoEm).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"})}</span>
  </div>`).join("") : '<p style="font-size:11px">Documento sem assinaturas eletrônicas nesta versão.</p>';
  const arquivosHtml = anexos.length ? `<h3>Anexos vinculados</h3><ul>${anexos.map(a=>`<li>${escaparHtmlDocente(a.nomeOriginal)} · versão ${a.versao} · SHA-256 ${escaparHtmlDocente(a.sha256||"não registrado")}</li>`).join("")}</ul>` : "";
  const artigo = `<div style="font:11px Arial,sans-serif;color:#475569"><strong>${escaparHtmlDocente(nomeInstituicao)}</strong> · Documento #${auth.documento.id} · versão ${numero}</div>
    <h1 style="font:bold 19px Arial,sans-serif;margin-top:14px">${titulo}</h1>
    <div>${conteudo}</div>
    <section style="break-before:auto;margin-top:32px;border-top:1px solid #cbd5e1;padding-top:14px;font:11px Arial,sans-serif"><h2 style="font-size:14px">${branco?"Modelo para preenchimento manual":"Registro de assinaturas eletrônicas"}</h2>${branco?"Preencha os campos, assine conforme orientações da instituição e envie o arquivo digitalizado à coordenação.":assinaturasHtml}<p style="overflow-wrap:anywhere;font:10px Arial,sans-serif;color:#475569">SHA-256 da versão e anexos: ${hash}</p>${!branco?arquivosHtml:""}<p style="font-size:9px;color:#64748b">Assinatura eletrônica simples com trilha de auditoria; não equivale automaticamente a certificado digital ICP-Brasil.</p></section>`;
  const renderizacao = montarRenderizacaoDocumento({conteudo:artigo,formatoImpressao:"A4_INTEIRA",instituicao:{nome:nomeInstituicao},modoPrevia:false,mostrarValidacao:false});
  let browser: Awaited<ReturnType<typeof abrirNavegador>>|null = null;
  try {
    browser = await abrirNavegador();
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request",requisicao=>{void (/^(data:|about:)/i.test(requisicao.url()) ? requisicao.continue() : requisicao.abort()).catch(()=>null);});
    const pagina = renderizacao.html.replace(/<head(\s[^>]*)?>/i, match=>`${match}<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src 'none'; base-uri 'none'; form-action 'none'">`);
    await page.setContent(pagina,{waitUntil:"domcontentloaded",timeout:25000});
    const pdf = await page.pdf(renderizacao.pdfOptions);
    const bytes = Buffer.from(pdf);
    return new Response(new Uint8Array(bytes),{status:200,headers:{
      "Content-Type":"application/pdf", "Content-Length":String(bytes.length),
      "Content-Disposition":`${baixar?'attachment':'inline'}; filename="documento-docente-${auth.documento.id}-v${numero}${branco?'-modelo':''}.pdf"`,
      "Cache-Control":"private, no-store", "X-Content-Type-Options":"nosniff",
    }});
  } catch(erro) {console.error("PDF documento docente:",erro);return NextResponse.json({error:"Não foi possível gerar o PDF deste documento."},{status:503});}
  finally {if(browser) await browser.close().catch(()=>null);}
}

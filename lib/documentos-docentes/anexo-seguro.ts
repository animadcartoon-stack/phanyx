import JSZip from "jszip";

const MAX_ANEXO = 10 * 1024 * 1024;
export const MAX_ANEXO_DOCENTE = MAX_ANEXO;
export const MAX_QUANTIDADE_ANEXOS_DOCENTE = 15;

const MIME_POR_EXTENSAO: Record<string, string> = {
  pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain", csv: "text/csv",
};

function real(bytes: Buffer, ext: string): boolean {
  switch (ext) {
    case "pdf": return bytes.length > 16 && bytes.subarray(0,5).toString("ascii") === "%PDF-";
    case "png": return bytes.length > 24 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    case "jpg": case "jpeg": return bytes.length > 8 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    case "webp": return bytes.length > 16 && bytes.toString("ascii",0,4) === "RIFF" && bytes.toString("ascii",8,12) === "WEBP";
    case "docx": case "xlsx": case "pptx": return bytes.length > 16 && bytes.toString("ascii",0,2) === "PK";
    case "txt": case "csv": {
      if (bytes.includes(0)) return false;
      try { new TextDecoder("utf-8", { fatal:true }).decode(bytes); return true; } catch { return false; }
    }
    default: return false;
  }
}

export async function validarAnexoDocente(arquivo: File): Promise<{ nome: string; mime: string; bytes: Buffer }> {
  const nome = arquivo.name.trim().replace(/[\\/\r\n\u0000-\u001f\u007f]/g,"_").slice(0,160);
  const extensao = nome.split(".").pop()?.toLowerCase() || "";
  const mime = MIME_POR_EXTENSAO[extensao];
  if (!mime || !nome || !arquivo.size || arquivo.size > MAX_ANEXO) throw new Error("Formato não permitido ou arquivo acima de 10 MB.");
  const bytes = Buffer.from(await arquivo.arrayBuffer());
  if (bytes.length !== arquivo.size || !real(bytes,extensao)) throw new Error("Assinatura do arquivo não corresponde ao formato informado.");
  if (["docx", "xlsx", "pptx"].includes(extensao)) {
    let zip: JSZip;
    try { zip = await JSZip.loadAsync(bytes, { checkCRC32: false }); }
    catch { throw new Error("Documento Office inválido."); }
    if (Object.keys(zip.files).length > 1500 || !zip.file("[Content_Types].xml") ||
       !zip.file(extensao === "docx" ? "word/document.xml" : extensao === "xlsx" ? "xl/workbook.xml" : "ppt/presentation.xml"))
      throw new Error("Estrutura Office inválida.");
  }
  return { nome, mime, bytes };
}

export function nomeSeguroCabecalho(nome: string): string {
  return nome.replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,100) || "documento";
}

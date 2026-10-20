import { createHmac } from "node:crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";

export const DURACAO_SESSAO_EDITOR_SEGUNDOS = 24 * 60 * 60;
const ESCOPO_EDITOR = "editor-certificado";

// Uma credencial renovada do editor nao pode autenticar as outras rotas,
// inclusive as que verificam JWT diretamente, sem passar pelo server-auth.
function chaveEditor(segredo: string) {
  return createHmac("sha256", segredo).update("phanyx:editor-certificado:v1").digest("hex");
}

export function verificarCredencialEditor(token: string, segredo: string, ignoreExpiration = false): JwtPayload {
  const dados = jwt.verify(token, chaveEditor(segredo), { algorithms: ["HS256"], ignoreExpiration });
  if (typeof dados === "string" || dados.escopo !== ESCOPO_EDITOR ||
      typeof dados.referenciaSessaoAdmin !== "string" || !/^[a-f0-9]{64}$/.test(dados.referenciaSessaoAdmin)) {
    throw new Error("Credencial invalida para o editor.");
  }
  return dados;
}

export function renovarCredencialEditor(dadosValidos: JwtPayload, segredo: string, referencia: string) {
  const dados = { ...dadosValidos };
  delete dados.exp;
  delete dados.iat;
  delete dados.nbf;
  return jwt.sign({ ...dados, escopo: ESCOPO_EDITOR, referenciaSessaoAdmin: referencia },
    chaveEditor(segredo), { algorithm: "HS256", expiresIn: DURACAO_SESSAO_EDITOR_SEGUNDOS });
}

import type { SentidoViradaFolha } from "./biblioteca-virada-folha";
export const COLUNAS_FOLHA = 48, LINHAS_FOLHA = 24;
export function malhaFolha(largura: number, altura: number, progresso: number, sentido: SentidoViradaFolha, dupla: boolean) {
  const p = Math.max(0, Math.min(1, Number.isFinite(progresso) ? progresso : 0));
  const sinal = sentido === "next" ? 1 : -1;
  const apoio = dupla || sinal === -1 ? largura : 0;
  const onda = Math.sin(Math.PI * p);
  const vertices = new Float32Array((COLUNAS_FOLHA + 1) * (LINHAS_FOLHA + 1) * 5);
  for (let linha = 0; linha <= LINHAS_FOLHA; linha++) {
    const v = linha / LINHAS_FOLHA; let x = 0, z = 0;
    for (let coluna = 0; coluna <= COLUNAS_FOLHA; coluna++) {
      const u = coluna / COLUNAS_FOLHA;
      if (coluna) {
        const meio = (coluna - .5) / COLUNAS_FOLHA;
        const angulo = Math.PI * p + onda * (.72 * Math.sin(Math.PI * meio) * (1.15 - .3 * v) + .9 * (v - .5) * meio * meio);
        x += largura / COLUNAS_FOLHA * Math.cos(angulo); z += largura / COLUNAS_FOLHA * Math.sin(angulo);
      }
      const i = (linha * (COLUNAS_FOLHA + 1) + coluna) * 5;
      vertices[i] = apoio + sinal * x;
      vertices[i + 1] = altura * v + largura * .02 * onda * Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
      vertices[i + 2] = z;
      vertices[i + 3] = u; vertices[i + 4] = v;
    }
  }
  return vertices;
}
const vertex = `
attribute vec3 aPos; attribute vec2 aUV;
uniform vec2 uSize; uniform float uWidth; uniform float uPivot; uniform vec2 uMargin;
varying vec2 vUV; varying float vLift;
void main(){
 float scale=6.0*uWidth/(6.0*uWidth-aPos.z);
 vec2 pos=vec2(uPivot+(aPos.x-uPivot)*scale,uSize.y*.5+(aPos.y-uSize.y*.5)*scale)+uMargin;
 vec2 size=uSize+2.0*uMargin;
 gl_Position=vec4(2.0*pos.x/size.x-1.0,1.0-2.0*pos.y/size.y,-aPos.z/(6.0*uWidth),1.0);
 vUV=aUV;vLift=aPos.z/uWidth;
}`;
const fragment = `
precision mediump float;
uniform sampler2D uFront; uniform sampler2D uBack; uniform float uReverse; uniform float uProgress;
varying vec2 vUV; varying float vLift;
void main(){
 float u=gl_FrontFacing?vUV.x:1.0-vUV.x;
 if(uReverse>0.5)u=1.0-u;
 vec4 paper=gl_FrontFacing?texture2D(uFront,vec2(u,vUV.y)):texture2D(uBack,vec2(u,vUV.y));
 float wave=sin(3.14159265*uProgress);
 float shade=1.0-wave*(0.14*vLift+0.12*pow(sin(3.14159265*vUV.x),2.0));
 vec3 tone=paper.rgb*shade+vec3(0.028,0.024,0.016)*wave*(1.0-vUV.x);
 gl_FragColor=vec4(tone,paper.a);
}`;

export function criarFolha3d(canvas: HTMLCanvasElement, frente: HTMLCanvasElement, verso: HTMLCanvasElement,
  largura: number, altura: number, sentido: SentidoViradaFolha, dupla: boolean) {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!gl) return null;
  const recursos: { shaders: WebGLShader[]; textures: WebGLTexture[]; buffers: WebGLBuffer[] } = { shaders: [], textures: [], buffers: [] };
  let program: WebGLProgram | null = null;
  function destruir() {
    recursos.shaders.forEach(s => gl!.deleteShader(s)); recursos.textures.forEach(t => gl!.deleteTexture(t));
    recursos.buffers.forEach(b => gl!.deleteBuffer(b)); if (program) gl!.deleteProgram(program);
  }
  try {
    function shader(tipo: number, fonte: string) {
      const s = gl!.createShader(tipo); if (!s) throw new Error(); recursos.shaders.push(s);
      gl!.shaderSource(s, fonte); gl!.compileShader(s); if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) throw new Error(); return s;
    }
    program = gl.createProgram(); if (!program) throw new Error();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex)); gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program); if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error();
    gl.useProgram(program);
    for (const [i, fonte] of [frente, verso].entries()) {
      const t = gl.createTexture(); if (!t) throw new Error(); recursos.textures.push(t);
      gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fonte);
    }
    const buffer = gl.createBuffer(), indices = gl.createBuffer(); if (!buffer || !indices) throw new Error(); recursos.buffers.push(buffer, indices);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, malhaFolha(largura, altura, 0, sentido, dupla), gl.DYNAMIC_DRAW);
    const pos = gl.getAttribLocation(program, "aPos"), uv = gl.getAttribLocation(program, "aUV");
    gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(uv); gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 20, 12);
    const faces = new Uint16Array(COLUNAS_FOLHA * LINHAS_FOLHA * 6); let index = 0;
    for (let y = 0; y < LINHAS_FOLHA; y++) for (let x = 0; x < COLUNAS_FOLHA; x++) {
      const a = y * (COLUNAS_FOLHA + 1) + x, b = a + 1, c = a + COLUNAS_FOLHA + 1, d = c + 1;
      faces.set([a, b, c, b, d, c], index); index += 6;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, faces, gl.STATIC_DRAW);
    gl.uniform1i(gl.getUniformLocation(program, "uFront"), 0); gl.uniform1i(gl.getUniformLocation(program, "uBack"), 1);
    gl.uniform1f(gl.getUniformLocation(program, "uWidth"), largura);
    gl.uniform1f(gl.getUniformLocation(program, "uPivot"), dupla || sentido === "previous" ? largura : 0);
    gl.uniform2f(gl.getUniformLocation(program, "uSize"), largura * (dupla ? 2 : 1), altura);
    gl.uniform2f(gl.getUniformLocation(program, "uMargin"), largura * .22, altura * .15);
    gl.uniform1f(gl.getUniformLocation(program, "uReverse"), sentido === "previous" ? 1 : 0);
    const uniformProgress = gl.getUniformLocation(program, "uProgress");
    gl.frontFace(sentido === "next" ? gl.CW : gl.CCW); gl.disable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    return {
      desenhar(p: number) {
        if (gl!.isContextLost()) return false;
        gl!.viewport(0, 0, canvas.width, canvas.height); gl!.clearColor(0, 0, 0, 0); gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);
        gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer); gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, malhaFolha(largura, altura, p, sentido, dupla));
        gl!.uniform1f(uniformProgress, p); gl!.drawElements(gl!.TRIANGLES, faces.length, gl!.UNSIGNED_SHORT, 0); return true;
      }, destruir,
    };
  } catch { destruir(); return null; }
}

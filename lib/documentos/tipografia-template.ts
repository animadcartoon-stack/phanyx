export const FONTE_PADRAO_TEMPLATE = "Arial, Helvetica, sans-serif";

export function cssTitulosTemplate(raiz: string) {
  return `
    ${raiz} h1, ${raiz} h2, ${raiz} h3,
    ${raiz} h4, ${raiz} h5, ${raiz} h6 {
      margin-block: 0;
      font-weight: bolder;
    }
    ${raiz} h1 { font-size: 2em; }
    ${raiz} h2 { font-size: 1.5em; }
    ${raiz} h3 { font-size: 1.17em; }
    ${raiz} h4 { font-size: 1em; }
    ${raiz} h5 { font-size: 0.83em; }
    ${raiz} h6 { font-size: 0.67em; }
  `;
}

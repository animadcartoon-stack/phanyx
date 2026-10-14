/** Cache em memória de uma única sessão de PDF; nunca persiste dados privados. */
export class CachePaginasLeitor<T> {
  private paginas = new Map<number, { valor: T; pixels: number }>();
  private pixels = 0;
  constructor(private limitePaginas = 6, private limitePixels = 6000000) {}

  obter(numero: number): T | undefined {
    const pagina = this.paginas.get(numero);
    if (!pagina) return undefined;
    this.paginas.delete(numero); this.paginas.set(numero, pagina);
    return pagina.valor;
  }

  guardar(numero: number, valor: T, pixels: number): void {
    if (!Number.isSafeInteger(pixels) || pixels <= 0 || pixels > this.limitePixels) return;
    const anterior = this.paginas.get(numero);
    if (anterior) { this.pixels -= anterior.pixels; this.paginas.delete(numero); }
    this.paginas.set(numero, { valor, pixels }); this.pixels += pixels;
    while (this.paginas.size > this.limitePaginas || this.pixels > this.limitePixels) {
      const primeiro = this.paginas.entries().next().value;
      if (!primeiro) break;
      this.paginas.delete(primeiro[0]); this.pixels -= primeiro[1].pixels;
    }
  }

  limpar(): void { this.paginas.clear(); this.pixels = 0; }
}

export function urlAbsoluta(caminho?: string | null) {
  if (!caminho) return null;

  if (
    caminho.startsWith("http://") ||
    caminho.startsWith("https://")
  ) {
    return caminho;
  }

  const base = process.env.NEXT_PUBLIC_APP_URL;

  if (!base) {
    throw new Error("NEXT_PUBLIC_APP_URL não configurada.");
  }

  return `${base}${caminho}`;
}
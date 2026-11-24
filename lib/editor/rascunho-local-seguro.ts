"use client";
const prefix = "phanyx:draft:v1:";
const encode = (bytes: Uint8Array) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(s);
};
const decode = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));
export type LocalDraft<T> = { dados: T; versao: number; salvoEm: number };
export const localId = (owner: string, key: string) => `${prefix}${owner}:${key}`;
export async function importarChave(raw: string) {
  return crypto.subtle.importKey("raw", decode(raw).buffer, "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function cifrarRascunho<T>(id: string, key: CryptoKey, record: LocalDraft<T>) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const bytes = new TextEncoder().encode(JSON.stringify(record));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: new TextEncoder().encode(id) }, key, bytes);
  return JSON.stringify({ iv: encode(iv), data: encode(new Uint8Array(encrypted)) });
}
export async function lerRascunho<T>(id: string, key: CryptoKey): Promise<LocalDraft<T> | null> {
  const raw = sessionStorage.getItem(id);
  if (!raw) return null;
  const record = JSON.parse(raw);
  const plain = await crypto.subtle.decrypt({name:"AES-GCM", iv:decode(record.iv).buffer, additionalData:new TextEncoder().encode(id)}, key, decode(record.data).buffer);
  const value = JSON.parse(new TextDecoder().decode(plain)) as LocalDraft<T>;
  if (!Number.isFinite(value.salvoEm) || Date.now() - value.salvoEm > 30 * 86400000) { sessionStorage.removeItem(id); return null; }
  return value;
}

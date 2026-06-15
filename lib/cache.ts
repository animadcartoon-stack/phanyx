import { unstable_cache, revalidateTag } from "next/cache";

export function cacheInstituicao<T>(
  key: string[],
  tags: string[],
  fn: () => Promise<T>,
  revalidate = 60
) {
  return unstable_cache(fn, key, {
    tags,
    revalidate,
  })();
}

export function limparCacheTag(tag: string) {
  revalidateTag(tag);
}
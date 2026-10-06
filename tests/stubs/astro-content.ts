// `astro:content` for unit tests (vitest.config.mjs alias): no content layer outside Astro, so every collection is
// empty here. Modules that read the collections (src/lib/content.ts → sitemap.xml.ts) still load; the rules they
// apply are tested on plain data through src/lib/posts.ts, sitemap.ts, postld.ts and feed.ts.
export async function getCollection(): Promise<never[]> {
  return [];
}

export async function render(): Promise<never> {
  throw new Error('astro:content render() is not available in unit tests');
}

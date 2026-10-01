// src/pages/robots.txt.ts — static endpoint: /robots.txt (RFC 9309).
// The owner's choice (2026-10-01): open to everything — search engines, AI answers and AI training. The
// Content-Signal line states that in the Content Signals form (https://contentsignals.org/); crawlers that do
// not know it ignore it. URLs come from links.ts, like the sitemap's.
import type { APIRoute } from 'astro';
import { SITE_URL } from '@data/links';

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL(SITE_URL);
  const abs = (path: string): string => new URL(path, base).href;
  const body = [
    `# ${base.host}`,
    `# Content signals: https://contentsignals.org/`,
    `# For language models: ${abs('/llms.txt')} (full text: ${abs('/llms-full.txt')})`,
    '',
    'User-agent: *',
    'Content-Signal: search=yes, ai-input=yes, ai-train=yes',
    'Allow: /',
    '',
    `Sitemap: ${abs('/sitemap.xml')}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

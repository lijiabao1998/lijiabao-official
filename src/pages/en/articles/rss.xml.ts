// /en/articles/rss.xml — RSS 2.0 of the published articles in en (src/lib/feed.ts).
import { feedRoute } from '@lib/content';

export const GET = feedRoute('articles', 'en');

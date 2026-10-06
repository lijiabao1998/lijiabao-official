// /en/views/rss.xml — RSS 2.0 of the published views in en (src/lib/feed.ts).
import { feedRoute } from '@lib/content';

export const GET = feedRoute('views', 'en');

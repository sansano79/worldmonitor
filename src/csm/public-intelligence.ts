import { TIER1_COUNTRIES } from '@/config/countries';
import { fetchGdeltArticlesWithStatus, type GdeltArticleSearchResult } from '@/services/gdelt-intel';
import { fetchTelegramFeed, isUnpolledTelegramFeed, type TelegramFeedResponse, type TelegramItem } from '@/services/telegram-intel';

export const CSM_PUBLIC_PANELS = ['country-news', 'telegram-intel'] as const;
export type CsmPublicPanel = typeof CSM_PUBLIC_PANELS[number];
export const CSM_PUBLIC_SOURCES = ['gdelt', 'telegram'] as const;
export type CsmPublicSource = typeof CSM_PUBLIC_SOURCES[number];
export const CSM_COUNTRY_OPTIONS = Object.entries(TIER1_COUNTRIES)
  .map(([code, name]) => ({ code, name }))
  .sort((left, right) => left.name.localeCompare(right.name));

export const CSM_TELEGRAM_TOPICS = [
  { id: 'all', label: 'Todos los temas' },
  { id: 'breaking', label: 'Última hora' },
  { id: 'conflict', label: 'Conflicto' },
  { id: 'geopolitics', label: 'Geopolítica' },
  { id: 'middleeast', label: 'Oriente Medio' },
  { id: 'osint', label: 'OSINT' },
  { id: 'cyber', label: 'Ciberseguridad' },
] as const;
export type CsmTelegramTopic = typeof CSM_TELEGRAM_TOPICS[number]['id'];

export type FeedState<T> =
  | { status: 'disabled' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'unavailable' }
  | { status: 'warming'; fetchedAt: string | null }
  | { status: 'empty'; fetchedAt: string | null; stale: boolean }
  | { status: 'ready'; items: T[]; fetchedAt: string | null; stale: boolean };

export interface CsmPublicFeedStates {
  gdelt: FeedState<GdeltArticleSearchResult['articles'][number]>;
  telegram: FeedState<TelegramItem>;
}

export interface CsmPublicFeedSelection {
  panels: readonly CsmPublicPanel[];
  sources: readonly CsmPublicSource[];
  country: string;
  telegramTopic: CsmTelegramTopic;
}

const NEWS_QUERY = '(attack OR conflict OR security incident OR evacuation OR protest OR earthquake OR "security alert")';
const TELEGRAM_STALE_AFTER_MS = 5 * 60 * 1000;

export function buildCsmCountryQuery(countryCode: string): string {
  if (countryCode === 'WORLD') return `${NEWS_QUERY} sourcelang:eng`;
  const countryName = TIER1_COUNTRIES[countryCode];
  if (!countryName) throw new Error('Unsupported CSM country');
  return `"${countryName}" ${NEWS_QUERY} sourcelang:eng`;
}

function isSelected(selection: CsmPublicFeedSelection, panel: CsmPublicPanel, source: CsmPublicSource): boolean {
  return selection.panels.includes(panel) && selection.sources.includes(source);
}

function telegramState(feed: TelegramFeedResponse, topic: CsmTelegramTopic): FeedState<TelegramItem> {
  if (!feed.enabled) return { status: 'unavailable' };
  const updated = feed.updatedAt ? Date.parse(feed.updatedAt) : Number.NaN;
  if (isUnpolledTelegramFeed(feed)) return { status: 'warming', fetchedAt: null };
  const fetchedAt = Number.isFinite(updated) ? new Date(updated).toISOString() : '';
  const items = topic === 'all' ? feed.items : feed.items.filter(item => item.topic === topic || item.tags.includes(topic));
  if (!fetchedAt && items.length === 0) return { status: 'warming', fetchedAt: null };
  const stale = !fetchedAt || Date.now() - updated > TELEGRAM_STALE_AFTER_MS;
  return items.length
    ? { status: 'ready', items, fetchedAt: fetchedAt || null, stale }
    : { status: 'empty', fetchedAt: fetchedAt || null, stale };
}

function gdeltState(result: GdeltArticleSearchResult): FeedState<GdeltArticleSearchResult['articles'][number]> {
  const fetchedAt = result.fetchedAt.toISOString();
  return result.articles.length
    ? { status: 'ready', items: result.articles, fetchedAt, stale: result.stale }
    : { status: 'empty', fetchedAt, stale: result.stale };
}

export async function loadCsmPublicFeeds(selection: CsmPublicFeedSelection): Promise<CsmPublicFeedStates> {
  const gdeltEnabled = isSelected(selection, 'country-news', 'gdelt');
  const telegramEnabled = isSelected(selection, 'telegram-intel', 'telegram');
  const [gdelt, telegram] = await Promise.all([
    gdeltEnabled
      ? fetchGdeltArticlesWithStatus(buildCsmCountryQuery(selection.country), 12, '72h')
        .then(gdeltState)
        .catch((): FeedState<GdeltArticleSearchResult['articles'][number]> => ({ status: 'error', message: 'No se pudo consultar GDELT.' }))
      : Promise.resolve<FeedState<GdeltArticleSearchResult['articles'][number]>>({ status: 'disabled' }),
    telegramEnabled
      ? fetchTelegramFeed(50)
        .then(feed => telegramState(feed, selection.telegramTopic))
        .catch((): FeedState<TelegramItem> => ({ status: 'error', message: 'No se pudo consultar el canal de Telegram.' }))
      : Promise.resolve<FeedState<TelegramItem>>({ status: 'disabled' }),
  ]);
  return { gdelt, telegram };
}

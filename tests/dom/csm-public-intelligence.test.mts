import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchGdeltArticlesWithStatus: vi.fn(),
  fetchTelegramFeed: vi.fn(),
}));

vi.mock('@/services/gdelt-intel', () => ({ fetchGdeltArticlesWithStatus: mocks.fetchGdeltArticlesWithStatus }));
vi.mock('@/services/telegram-intel', () => ({
  fetchTelegramFeed: mocks.fetchTelegramFeed,
  isUnpolledTelegramFeed: (feed: { enabled: boolean; items: unknown[]; updatedAt: string | null }) =>
    feed.enabled && feed.items.length === 0 && feed.updatedAt === null,
}));

import { buildCsmCountryQuery, loadCsmPublicFeeds } from '../../src/csm/public-intelligence';

const now = '2026-11-07T10:00:00.000Z';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.fetchGdeltArticlesWithStatus.mockResolvedValue({
    articles: [{ title: 'Security update', source: 'Example', url: 'https://example.test/news', date: '20261107T100000Z' }],
    fetchedAt: new Date(now),
    stale: false,
  });
  mocks.fetchTelegramFeed.mockResolvedValue({
    source: 'telegram', earlySignal: true, enabled: true, count: 2, updatedAt: now,
    items: [
      { id: '1', source: 'telegram', channel: 'channel', channelTitle: 'Channel', url: 'https://t.me/channel/1', ts: now, text: 'Geopolitics item', topic: 'geopolitics', tags: ['europe'], earlySignal: true },
      { id: '2', source: 'telegram', channel: 'channel', channelTitle: 'Channel', url: 'https://t.me/channel/2', ts: now, text: 'Cyber item', topic: 'cyber', tags: [], earlySignal: true },
    ],
  });
});

describe('CSM public intelligence data path', () => {
  it('builds a country-specific GDELT query and rejects unsupported country codes', () => {
    expect(buildCsmCountryQuery('UA')).toContain('"Ukraine"');
    expect(buildCsmCountryQuery('UA')).toContain('security incident');
    expect(buildCsmCountryQuery('WORLD')).not.toContain('"Ukraine"');
    expect(() => buildCsmCountryQuery('ZZ')).toThrow('Unsupported CSM country');
  });

  it('uses enabled public panels and returns only the selected Telegram topic', async () => {
    const states = await loadCsmPublicFeeds({
      panels: ['country-news', 'telegram-intel'],
      sources: ['gdelt', 'telegram'],
      country: 'UA',
      telegramTopic: 'geopolitics',
    });

    expect(mocks.fetchGdeltArticlesWithStatus).toHaveBeenCalledWith(expect.stringContaining('"Ukraine"'), 12, '72h');
    expect(mocks.fetchTelegramFeed).toHaveBeenCalledWith(50);
    expect(states.gdelt.status).toBe('ready');
    expect(states.telegram).toMatchObject({ status: 'ready', items: [{ text: 'Geopolitics item' }] });
  });

  it('does not query sources that are not both selected and enabled', async () => {
    const states = await loadCsmPublicFeeds({
      panels: ['country-news', 'telegram-intel'],
      sources: ['gdelt'],
      country: 'WORLD',
      telegramTopic: 'all',
    });

    expect(mocks.fetchGdeltArticlesWithStatus).toHaveBeenCalledOnce();
    expect(mocks.fetchTelegramFeed).not.toHaveBeenCalled();
    expect(states.telegram).toEqual({ status: 'disabled' });
  });

  it('preserves stale timestamps and reports source failures as errors', async () => {
    mocks.fetchGdeltArticlesWithStatus.mockResolvedValueOnce({
      articles: [], fetchedAt: new Date('2026-11-07T08:00:00.000Z'), stale: true,
    });
    mocks.fetchTelegramFeed.mockRejectedValueOnce(new Error('relay unavailable'));

    const states = await loadCsmPublicFeeds({
      panels: ['country-news', 'telegram-intel'],
      sources: ['gdelt', 'telegram'],
      country: 'UA',
      telegramTopic: 'all',
    });

    expect(states.gdelt).toMatchObject({ status: 'empty', stale: true, fetchedAt: '2026-11-07T08:00:00.000Z' });
    expect(states.telegram.status).toBe('error');
  });

  it('distinguishes an intentionally disabled Telegram relay from a disabled local preference', async () => {
    mocks.fetchTelegramFeed.mockResolvedValueOnce({
      source: 'telegram', earlySignal: true, enabled: false, count: 0, updatedAt: null, items: [],
    });
    const states = await loadCsmPublicFeeds({
      panels: ['telegram-intel'], sources: ['telegram'], country: 'WORLD', telegramTopic: 'all',
    });
    expect(states.telegram).toEqual({ status: 'unavailable' });
  });
});

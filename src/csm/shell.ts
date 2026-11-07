import { TIER1_COUNTRIES } from '@/config/countries';
import type { CsmPublicFeedSelection, CsmPublicFeedStates, CsmPublicPanel, CsmPublicSource, CsmTelegramTopic, FeedState } from './public-intelligence';
import type { GdeltArticle } from '@/services/gdelt-intel';
import type { TelegramItem } from '@/services/telegram-intel';

type CsmLanguage = 'es' | 'en';
type CsmTheme = 'dark' | 'light';
type SectionKey = 'overview' | 'travel' | 'alerts' | 'sources' | 'sites' | 'settings';

const PANEL_KEYS: readonly CsmPublicPanel[] = ['country-news', 'telegram-intel'];
const SOURCE_KEYS: readonly CsmPublicSource[] = ['gdelt', 'telegram'];
const PANEL_LABELS: Record<CsmPublicPanel, Record<CsmLanguage, string>> = {
  'country-news': { es: 'Noticias por país (GDELT)', en: 'Country news (GDELT)' },
  'telegram-intel': { es: 'Canales públicos de Telegram', en: 'Public Telegram channels' },
};
const SOURCE_LABELS: Record<CsmPublicSource, Record<CsmLanguage, string>> = {
  gdelt: { es: 'GDELT · noticias', en: 'GDELT · news' },
  telegram: { es: 'Telegram · canales públicos', en: 'Telegram · public channels' },
};
const DEFAULT_PANELS: CsmPublicPanel[] = [...PANEL_KEYS];
const DEFAULT_SOURCES: CsmPublicSource[] = [...SOURCE_KEYS];
const COUNTRIES = Object.entries(TIER1_COUNTRIES).sort((left, right) => left[1].localeCompare(right[1]));
const TELEGRAM_TOPICS: Array<{ id: CsmTelegramTopic; label: Record<CsmLanguage, string> }> = [
  { id: 'all', label: { es: 'Todos los temas', en: 'All topics' } },
  { id: 'breaking', label: { es: 'Última hora', en: 'Breaking' } },
  { id: 'conflict', label: { es: 'Conflicto', en: 'Conflict' } },
  { id: 'geopolitics', label: { es: 'Geopolítica', en: 'Geopolitics' } },
  { id: 'middleeast', label: { es: 'Oriente Medio', en: 'Middle East' } },
  { id: 'osint', label: { es: 'OSINT', en: 'OSINT' } },
  { id: 'cyber', label: { es: 'Ciberseguridad', en: 'Cybersecurity' } },
];

function readLocalSelection<T extends string>(key: string, allowed: readonly T[], fallback: readonly T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [...fallback];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? [...new Set(parsed.filter((value): value is T => typeof value === 'string' && allowed.includes(value as T)))]
      : [...fallback];
  } catch {
    return [...fallback];
  }
}

function persistLocalSelection<T extends string>(key: string, values: readonly T[]): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(values));
    return true;
  } catch {
    return false;
  }
}

type Section = {
  key: SectionKey;
  label: string;
  title: string;
  description: string;
  cards: Array<{ title: string; detail: string }>;
};

type CsmCopy = {
  brand: string;
  navigation: string;
  eyebrow: string;
  settingsDescription: string;
  appearanceTitle: string;
  appearanceDescription: string;
  themeLabel: string;
  darkTheme: string;
  lightTheme: string;
  languageLabel: string;
  languageSpanish: string;
  languageEnglish: string;
  saved: string;
  saveFailed: string;
  pendingTitle: string;
  pendingDescription: string;
  connectedPanelDescription: string;
  connectedSourceDescription: string;
  panelSelectionTitle: string;
  sourceSelectionTitle: string;
  sourceUnavailable: string;
  countryScope: string;
  countryScopeDescription: string;
  telegramTopic: string;
  noCountryLocationClaim: string;
  feedLoading: string;
  feedUnavailable: string;
  feedWarming: string;
  feedEmpty: string;
  feedDisabled: string;
  feedFresh: string;
  feedStale: string;
  feedFreshnessUnknown: string;
  feedSource: string;
  feedNoDate: string;
  worldScope: string;
  noPanelsSelected: string;
  sections: Section[];
};

const COPY: Record<CsmLanguage, CsmCopy> = {
  es: {
    brand: 'CSM · Seguridad física',
    navigation: 'Navegación principal',
    eyebrow: 'CORPORATE SECURITY MONITOR',
    settingsDescription: 'Estas preferencias se guardan solo en este navegador.',
    appearanceTitle: 'Preferencias de interfaz',
    appearanceDescription: 'Ajusta el aspecto y el idioma de esta pantalla.',
    themeLabel: 'Tema',
    darkTheme: 'Tema oscuro',
    lightTheme: 'Tema claro',
    languageLabel: 'Idioma',
    languageSpanish: 'Español',
    languageEnglish: 'English',
    saved: 'Preferencia guardada en este navegador.',
    saveFailed: 'No se pudo guardar la preferencia; se aplica solo durante esta visita.',
    pendingTitle: 'Funciones operativas pendientes',
    pendingDescription: 'La aprobación corporativa de fuentes, las reglas y destinatarios de alertas, las sedes privadas y el inventario de viajes todavía no están conectados.',
    connectedPanelDescription: 'Estos dos paneles consultan fuentes públicas conectadas. La selección se guarda solo en este navegador.',
    connectedSourceDescription: 'Activa o desactiva consultas de datos públicos. Esto no aprueba la fuente para alertas corporativas.',
    panelSelectionTitle: 'Paneles conectados',
    sourceSelectionTitle: 'Fuentes públicas',
    sourceUnavailable: 'No disponible; consulta el estado y vuelve a intentarlo.',
    countryScope: 'País para la búsqueda de noticias',
    countryScopeDescription: 'GDELT busca durante las últimas 72 horas noticias en inglés que mencionan el país. La mención no confirma el lugar del incidente. El catálogo cubre países prioritarios.',
    telegramTopic: 'Tema de Telegram',
    noCountryLocationClaim: 'La noticia menciona el país elegido; el lugar del incidente no está geolocalizado de forma independiente.',
    feedLoading: 'Consultando la fuente…',
    feedUnavailable: 'No se pudo consultar esta fuente. Vuelve a intentarlo más tarde.',
    feedWarming: 'La fuente todavía no ha completado una actualización o no aporta una fecha verificable.',
    feedEmpty: 'La consulta terminó y no devolvió resultados para estos filtros.',
    feedDisabled: 'Activa el panel y su fuente en Ajustes para consultar datos.',
    feedFresh: 'Datos recientes',
    feedStale: 'Datos anteriores; consulta de nuevo antes de tomar una decisión.',
    feedFreshnessUnknown: 'No se puede verificar su antigüedad.',
    feedSource: 'Fuente',
    feedNoDate: 'Fecha no disponible',
    worldScope: 'Mundial',
    noPanelsSelected: 'Activa al menos un panel conectado en Ajustes.',
    sections: [
      { key: 'overview', label: 'Resumen y mapa', title: 'Resumen de seguridad', description: 'Consulta las señales y el estado de cobertura de las ubicaciones vigiladas.', cards: [
        { title: 'Mapa pendiente', detail: 'El mapa y las sedes autorizadas se conectarán cuando esté configurado el acceso corporativo.' },
      ] },
      { key: 'travel', label: 'Países y viajes', title: 'Países y viajes', description: 'Consulta noticias públicas que mencionan un país. La planificación de viajes y las alertas todavía no están conectadas.', cards: [
      ] },
      { key: 'alerts', label: 'Alertas', title: 'Alertas', description: 'Revisa los avisos y su seguimiento.', cards: [
        { title: 'Sin alertas disponibles', detail: 'La entrega, el reconocimiento y el historial requieren configurar el servicio corporativo.' },
      ] },
      { key: 'sources', label: 'Fuentes', title: 'Fuentes', description: 'Consulta el estado de las integraciones públicas. La aprobación corporativa es un proceso separado.', cards: [
        { title: 'Aprobación corporativa pendiente', detail: 'Estas consultas públicas no están autorizadas para generar alertas corporativas.' },
      ] },
      { key: 'sites', label: 'Sedes', title: 'Sedes', description: 'Accede al inventario autorizado de la organización.', cards: [
        { title: 'Inventario no conectado', detail: 'El acceso a sedes privadas requiere identidad, permisos y almacenamiento configurados.' },
      ] },
      { key: 'settings', label: 'Ajustes', title: 'Ajustes', description: 'Configura las preferencias locales de esta interfaz.', cards: [] },
    ],
  },
  en: {
    brand: 'CSM · Physical Security',
    navigation: 'Main navigation',
    eyebrow: 'CORPORATE SECURITY MONITOR',
    settingsDescription: 'These preferences are saved in this browser only.',
    appearanceTitle: 'Interface preferences',
    appearanceDescription: 'Choose the appearance and language for this screen.',
    themeLabel: 'Theme',
    darkTheme: 'Dark theme',
    lightTheme: 'Light theme',
    languageLabel: 'Language',
    languageSpanish: 'Español',
    languageEnglish: 'English',
    saved: 'Preference saved in this browser.',
    saveFailed: 'Could not save this preference; it applies only during this visit.',
    pendingTitle: 'Operational features pending',
    pendingDescription: 'Corporate source approval, alert rules and recipients, private sites, and travel inventory are not connected yet.',
    connectedPanelDescription: 'These two panels query connected public sources. Selection is stored in this browser only.',
    connectedSourceDescription: 'Enable or disable public data requests. This does not approve a source for corporate alerts.',
    panelSelectionTitle: 'Connected panels',
    sourceSelectionTitle: 'Public sources',
    sourceUnavailable: 'Unavailable; check the status and try again.',
    countryScope: 'Country for news search',
    countryScopeDescription: 'GDELT searches English-language news from the past 72 hours that mentions the country. A mention does not confirm the incident location. The catalog covers priority countries.',
    telegramTopic: 'Telegram topic',
    noCountryLocationClaim: 'The article mentions the selected country; the incident location is not independently geolocated.',
    feedLoading: 'Querying source…',
    feedUnavailable: 'This source could not be queried. Try again later.',
    feedWarming: 'The source has not completed an update or does not provide a verifiable timestamp.',
    feedEmpty: 'The query completed and returned no results for these filters.',
    feedDisabled: 'Enable the panel and its source in Settings to query data.',
    feedFresh: 'Recent data',
    feedStale: 'Older data; refresh before making a decision.',
    feedFreshnessUnknown: 'Its age cannot be verified.',
    feedSource: 'Source',
    feedNoDate: 'Date unavailable',
    worldScope: 'Worldwide',
    noPanelsSelected: 'Enable at least one connected panel in Settings.',
    sections: [
      { key: 'overview', label: 'Overview and map', title: 'Security overview', description: 'Review signals and coverage status for monitored locations.', cards: [
        { title: 'Map pending', detail: 'The map and approved sites will be connected when corporate access is configured.' },
      ] },
      { key: 'travel', label: 'Countries and travel', title: 'Countries and travel', description: 'Search public news mentioning a country. Travel planning and alerts are not connected yet.', cards: [
      ] },
      { key: 'alerts', label: 'Alerts', title: 'Alerts', description: 'Review notices and their follow-up.', cards: [
        { title: 'No alerts available', detail: 'Delivery, acknowledgement, and history require the corporate service to be configured.' },
      ] },
      { key: 'sources', label: 'Sources', title: 'Sources', description: 'Review the status of public integrations. Corporate approval is a separate process.', cards: [
        { title: 'Corporate approval pending', detail: 'These public queries are not approved to generate corporate alerts.' },
      ] },
      { key: 'sites', label: 'Sites', title: 'Sites', description: 'Access the organization’s authorized inventory.', cards: [
        { title: 'Inventory not connected', detail: 'Private site access requires configured identity, permissions, and storage.' },
      ] },
      { key: 'settings', label: 'Settings', title: 'Settings', description: 'Configure local preferences for this interface.', cards: [] },
    ],
  },
};

function readLocalPreference<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value && allowed.includes(value as T) ? value as T : fallback;
  } catch {
    return fallback;
  }
}

function persistLocalPreference(key: string, value: string, copy: CsmCopy, status: HTMLElement): boolean {
  try {
    localStorage.setItem(key, value);
    status.textContent = copy.saved;
    return true;
  } catch {
    status.textContent = copy.saveFailed;
    return false;
  }
}

type CsmPublicFeedLoader = (selection: CsmPublicFeedSelection) => Promise<CsmPublicFeedStates>;

const defaultCsmPublicFeedLoader: CsmPublicFeedLoader = selection =>
  import('@/csm/public-intelligence').then(({ loadCsmPublicFeeds }) => loadCsmPublicFeeds(selection));

export function mountCsm(container: HTMLElement, loadFeeds: CsmPublicFeedLoader = defaultCsmPublicFeedLoader): void {
  let theme = readLocalPreference('csm-theme', ['dark', 'light'] as const, 'dark');
  let language = readLocalPreference('csm-language', ['es', 'en'] as const, 'es');
  let selectedPanels = readLocalSelection('csm-panels', PANEL_KEYS, DEFAULT_PANELS);
  let selectedSources = readLocalSelection('csm-sources', SOURCE_KEYS, DEFAULT_SOURCES);
  let country = readLocalPreference('csm-country', ['WORLD', ...COUNTRIES.map(([code]) => code)], 'WORLD');
  let telegramTopic = readLocalPreference<CsmTelegramTopic>(
    'csm-telegram-topic', TELEGRAM_TOPICS.map(topic => topic.id), 'all');
  let feedStates: CsmPublicFeedStates | null = null;
  let feedRequest = 0;
  let activeSection: SectionKey = 'overview';
  const header = document.createElement('header');
  header.className = 'csm-header';
  const brand = document.createElement('div');
  brand.className = 'csm-brand';
  const nav = document.createElement('nav');
  const main = document.createElement('main');
  main.id = 'contenido';
  const buttons: HTMLButtonElement[] = [];

  function updateTheme(): void {
    container.dataset.csmTheme = theme;
  }

  function renderLanguage(): void {
    const copy = COPY[language];
    document.documentElement.lang = language;
    document.title = copy.brand;
    brand.textContent = copy.brand;
    nav.setAttribute('aria-label', copy.navigation);
    const activeIndex = copy.sections.findIndex(section => section.key === activeSection);
    buttons.forEach((button, index) => {
      button.textContent = copy.sections[index]!.label;
      if (index === activeIndex) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }

  function dateLabel(value: string, copy: CsmCopy): string {
    const date = new Date(value);
    return Number.isFinite(date.getTime())
      ? new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
      : copy.feedNoDate;
  }

  function statusText(state: FeedState<GdeltArticle> | FeedState<TelegramItem>, copy: CsmCopy): string {
    switch (state.status) {
      case 'disabled': return copy.feedDisabled;
      case 'loading': return copy.feedLoading;
      case 'error': return copy.feedUnavailable;
      case 'unavailable': return copy.sourceUnavailable;
      case 'warming': return copy.feedWarming;
      case 'empty': return `${copy.feedEmpty} · ${state.fetchedAt ? dateLabel(state.fetchedAt, copy) : copy.feedNoDate} · ${state.fetchedAt ? (state.stale ? copy.feedStale : copy.feedFresh) : copy.feedFreshnessUnknown}`;
      case 'ready': return `${state.fetchedAt ? dateLabel(state.fetchedAt, copy) : copy.feedNoDate} · ${state.fetchedAt ? (state.stale ? copy.feedStale : copy.feedFresh) : copy.feedFreshnessUnknown}`;
    }
  }

  function renderFeedCard(panel: CsmPublicPanel, state: FeedState<GdeltArticle> | FeedState<TelegramItem>, copy: CsmCopy): HTMLElement {
    const article = document.createElement('article');
    article.dataset.csmFeedPanel = panel;
    const title = document.createElement('h2');
    title.textContent = PANEL_LABELS[panel][language];
    const status = document.createElement('p');
    status.className = `csm-feed-status csm-feed-${state.status}`;
    status.setAttribute('role', state.status === 'error' ? 'alert' : 'status');
    status.textContent = statusText(state, copy);
    article.append(title, status);
    if (state.status === 'ready') {
      const list = document.createElement('ul');
      list.className = 'csm-feed-items';
      if (panel === 'country-news') {
        for (const item of state.items as GdeltArticle[]) {
          const row = document.createElement('li');
          const link = document.createElement('a');
          link.href = item.url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = item.title || item.source;
          const meta = document.createElement('small');
          meta.textContent = `${copy.feedSource}: ${item.source || copy.feedNoDate} · ${item.date || copy.feedNoDate}`;
          row.append(link, meta);
          list.append(row);
        }
        const note = document.createElement('p');
        note.className = 'csm-preference-note';
        note.textContent = copy.noCountryLocationClaim;
        article.append(list, note);
      } else {
        for (const item of state.items as TelegramItem[]) {
          const row = document.createElement('li');
          const link = document.createElement('a');
          link.href = item.url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = `${item.channelTitle}: ${item.text}`;
          const meta = document.createElement('small');
          meta.textContent = `${copy.feedSource}: @${item.channel} · ${dateLabel(item.ts, copy)} · ${item.topic}`;
          row.append(link, meta);
          list.append(row);
        }
        article.append(list);
      }
    }
    return article;
  }

  function requestFeedUpdate(): void {
    const requestId = ++feedRequest;
    const copy = COPY[language];
    const visiblePanels = activeSection === 'travel'
      ? (selectedPanels.includes('country-news') ? ['country-news' as const] : [])
      : selectedPanels;
    const selection = { panels: visiblePanels, sources: selectedSources, country, telegramTopic };
    const states: CsmPublicFeedStates = {
      gdelt: selectedPanels.includes('country-news') && selectedSources.includes('gdelt') ? { status: 'loading' } : { status: 'disabled' },
      telegram: selectedPanels.includes('telegram-intel') && selectedSources.includes('telegram') ? { status: 'loading' } : { status: 'disabled' },
    };
    feedStates = states;
    updateFeedCards();
    void loadFeeds(selection).then((next) => {
      if (requestId !== feedRequest) return;
      feedStates = next;
      updateFeedCards();
    }).catch(() => {
      if (requestId !== feedRequest) return;
      feedStates = {
        gdelt: { status: 'error', message: copy.feedUnavailable },
        telegram: { status: 'error', message: copy.feedUnavailable },
      };
      updateFeedCards();
    });
  }

  function updateFeedCards(): void {
    const copy = COPY[language];
    for (const panel of PANEL_KEYS) {
      const target = main.querySelector<HTMLElement>(`[data-csm-feed-panel="${panel}"]`);
      if (!target) continue;
      const state = panel === 'country-news'
        ? (feedStates?.gdelt ?? { status: 'loading' as const })
        : (feedStates?.telegram ?? { status: 'loading' as const });
      target.replaceWith(renderFeedCard(panel, state, copy));
    }
  }

  function show(section: Section): void {
    activeSection = section.key;
    const copy = COPY[language];
    const sectionIndex = copy.sections.findIndex(item => item.key === section.key);
    buttons.forEach((button, index) => {
      if (index === sectionIndex) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });

    const intro = document.createElement('div');
    intro.className = 'csm-intro';
    const eyebrow = document.createElement('p');
    eyebrow.className = 'csm-eyebrow';
    eyebrow.textContent = copy.eyebrow;
    const heading = document.createElement('h1');
    heading.textContent = section.title;
    const description = document.createElement('p');
    description.textContent = section.description;
    intro.append(eyebrow, heading, description);
    const grid = document.createElement('div');
    grid.className = 'csm-grid';

    if (section.key === 'settings') {
      const preferences = document.createElement('article');
      const preferencesTitle = document.createElement('h2');
      preferencesTitle.textContent = copy.appearanceTitle;
      const preferencesDescription = document.createElement('p');
      preferencesDescription.textContent = copy.appearanceDescription;
      const controls = document.createElement('div');
      controls.className = 'csm-preference-controls';

      const themeGroup = document.createElement('fieldset');
      themeGroup.className = 'csm-preference-group';
      const themeLegend = document.createElement('legend');
      themeLegend.textContent = copy.themeLabel;
      const themeButtons = document.createElement('div');
      themeButtons.className = 'csm-theme-controls';
      const status = document.createElement('p');
      status.className = 'csm-settings-status';
      status.setAttribute('role', 'status');
      const themeChoices: Array<{ value: CsmTheme; label: string }> = [
        { value: 'dark', label: copy.darkTheme },
        { value: 'light', label: copy.lightTheme },
      ];
      for (const choice of themeChoices) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = choice.label;
        button.setAttribute('aria-pressed', String(theme === choice.value));
        button.addEventListener('click', () => {
          theme = choice.value;
          updateTheme();
          themeButtons.querySelectorAll('button').forEach(item =>
            item.setAttribute('aria-pressed', String(item === button)));
          persistLocalPreference('csm-theme', theme, copy, status);
        });
        themeButtons.append(button);
      }
      themeGroup.append(themeLegend, themeButtons);

      const languageGroup = document.createElement('div');
      languageGroup.className = 'csm-preference-group';
      const languageLabel = document.createElement('label');
      languageLabel.htmlFor = 'csm-language-select';
      languageLabel.textContent = copy.languageLabel;
      const languageSelect = document.createElement('select');
      languageSelect.id = 'csm-language-select';
      languageSelect.setAttribute('aria-label', copy.languageLabel);
      const languageOptions: Array<{ value: CsmLanguage; label: string }> = [
        { value: 'es', label: copy.languageSpanish },
        { value: 'en', label: copy.languageEnglish },
      ];
      for (const option of languageOptions) {
        const node = document.createElement('option');
        node.value = option.value;
        node.textContent = option.label;
        node.selected = language === option.value;
        languageSelect.append(node);
      }
      languageSelect.addEventListener('change', () => {
        language = languageSelect.value === 'en' ? 'en' : 'es';
        const saved = persistLocalPreference('csm-language', language, COPY[language], status);
        renderLanguage();
        show(COPY[language].sections.find(item => item.key === activeSection)!);
        const updatedStatus = main.querySelector<HTMLElement>('.csm-settings-status');
        if (updatedStatus) updatedStatus.textContent = saved ? COPY[language].saved : COPY[language].saveFailed;
      });
      languageGroup.append(languageLabel, languageSelect);
      const appendToggleGroup = <T extends string>(
        legendText: string,
        descriptionText: string,
        options: readonly T[],
        selected: T[],
        labels: Record<T, Record<CsmLanguage, string>>,
        storageKey: string,
        onChange: (next: T[]) => void,
      ): void => {
        const group = document.createElement('fieldset');
        group.className = 'csm-preference-group csm-checklist-group';
        const legend = document.createElement('legend');
        legend.textContent = legendText;
        const hint = document.createElement('p');
        hint.className = 'csm-preference-note';
        hint.textContent = descriptionText;
        const list = document.createElement('div');
        list.className = 'csm-checklist';
        for (const option of options) {
          const label = document.createElement('label');
          label.className = 'csm-checklist-item';
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.value = option;
          input.id = `${storageKey}-${option}`;
          input.checked = selected.includes(option);
          input.addEventListener('change', () => {
            const next = input.checked
              ? [...new Set([...selected, option])]
              : selected.filter(value => value !== option);
            onChange(next);
            const saved = persistLocalSelection(storageKey, next);
            status.textContent = saved ? COPY[language].saved : COPY[language].saveFailed;
          });
          const text = document.createElement('span');
          text.textContent = labels[option][language];
          label.append(input, text);
          list.append(label);
        }
        group.append(legend, hint, list);
        controls.append(group);
      };
      appendToggleGroup(copy.panelSelectionTitle, copy.connectedPanelDescription, PANEL_KEYS, selectedPanels, PANEL_LABELS, 'csm-panels', next => { selectedPanels = next; });
      appendToggleGroup(copy.sourceSelectionTitle, copy.connectedSourceDescription, SOURCE_KEYS, selectedSources, SOURCE_LABELS, 'csm-sources', next => { selectedSources = next; });
      const topicGroup = document.createElement('div');
      topicGroup.className = 'csm-preference-group';
      const topicLabel = document.createElement('label');
      topicLabel.htmlFor = 'csm-telegram-topic';
      topicLabel.textContent = copy.telegramTopic;
      const topicSelect = document.createElement('select');
      topicSelect.id = 'csm-telegram-topic';
      for (const topic of TELEGRAM_TOPICS) {
        const option = document.createElement('option');
        option.value = topic.id;
        option.textContent = topic.label[language];
        option.selected = topic.id === telegramTopic;
        topicSelect.append(option);
      }
      topicSelect.addEventListener('change', () => {
        telegramTopic = topicSelect.value as CsmTelegramTopic;
        const saved = persistLocalPreference('csm-telegram-topic', telegramTopic, copy, status);
        status.textContent = saved ? copy.saved : copy.saveFailed;
      });
      topicGroup.append(topicLabel, topicSelect);
      const persistenceNote = document.createElement('p');
      persistenceNote.className = 'csm-preference-note';
      persistenceNote.textContent = copy.settingsDescription;
      controls.append(themeGroup, languageGroup, topicGroup);
      preferences.append(preferencesTitle, preferencesDescription, controls, persistenceNote, status);
      grid.append(preferences);

      const pending = document.createElement('article');
      pending.className = 'csm-pending-card';
      const pendingTitle = document.createElement('h2');
      pendingTitle.textContent = copy.pendingTitle;
      const pendingDescription = document.createElement('p');
      pendingDescription.textContent = copy.pendingDescription;
      pending.append(pendingTitle, pendingDescription);
      grid.append(pending);
    } else if (section.key === 'overview') {
      for (const card of section.cards) {
        const article = document.createElement('article');
        const title = document.createElement('h2');
        title.textContent = card.title;
        const detail = document.createElement('p');
        detail.textContent = card.detail;
        article.append(title, detail);
        grid.append(article);
      }
      for (const panel of PANEL_KEYS) {
        if (!selectedPanels.includes(panel)) continue;
        const initialState: FeedState<GdeltArticle> | FeedState<TelegramItem> = { status: 'loading' };
        grid.append(renderFeedCard(panel, initialState, copy));
      }
      if (selectedPanels.length === 0) {
        const empty = document.createElement('article');
        empty.className = 'csm-empty-state';
        empty.textContent = copy.noPanelsSelected;
        grid.append(empty);
      }
    } else if (section.key === 'travel') {
      const countryCard = document.createElement('article');
      const countryLabel = document.createElement('label');
      countryLabel.htmlFor = 'csm-country';
      countryLabel.textContent = copy.countryScope;
      const countrySelect = document.createElement('select');
      countrySelect.id = 'csm-country';
      const worldwide = document.createElement('option');
      worldwide.value = 'WORLD';
      worldwide.textContent = copy.worldScope;
      countrySelect.append(worldwide);
      for (const [code, name] of COUNTRIES) {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = name;
        option.selected = code === country;
        countrySelect.append(option);
      }
      countrySelect.value = country;
      countrySelect.addEventListener('change', () => {
        country = countrySelect.value;
        persistLocalPreference('csm-country', country, copy, countryStatus);
        show(COPY[language].sections.find(item => item.key === activeSection)!);
      });
      const countryHint = document.createElement('p');
      countryHint.textContent = copy.countryScopeDescription;
      const countryStatus = document.createElement('p');
      countryStatus.className = 'csm-settings-status';
      countryStatus.setAttribute('role', 'status');
      countryCard.append(countryLabel, countrySelect, countryHint, countryStatus);
      grid.append(countryCard);
      if (selectedPanels.includes('country-news')) grid.append(renderFeedCard('country-news', { status: 'loading' }, copy));
      else grid.append(renderFeedCard('country-news', { status: 'disabled' }, copy));
    } else if (section.key === 'sources') {
      for (const card of section.cards) {
        const article = document.createElement('article');
        const title = document.createElement('h2');
        title.textContent = card.title;
        const detail = document.createElement('p');
        detail.textContent = card.detail;
        article.append(title, detail);
        grid.append(article);
      }
      for (const panel of PANEL_KEYS) {
        const state: FeedState<GdeltArticle> | FeedState<TelegramItem> = { status: 'loading' };
        grid.append(renderFeedCard(panel, state, copy));
      }
      const note = document.createElement('p');
      note.className = 'csm-preference-note';
      note.textContent = copy.connectedSourceDescription;
      grid.append(note);
    } else {
      for (const card of section.cards) {
        const article = document.createElement('article');
        const title = document.createElement('h2');
        title.textContent = card.title;
        const detail = document.createElement('p');
        detail.textContent = card.detail;
        article.append(title, detail);
        grid.append(article);
      }
    }
    main.replaceChildren(intro, grid);
    if (section.key === 'overview' || section.key === 'travel' || section.key === 'sources') {
      requestFeedUpdate();
    } else {
      feedRequest += 1;
    }
  }

  const initialCopy = COPY[language];
  for (let index = 0; index < initialCopy.sections.length; index += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = initialCopy.sections[index]!.label;
    button.addEventListener('click', () => {
      const section = COPY[language].sections[index];
      if (section) show(section);
    });
    buttons.push(button);
    nav.append(button);
  }
  header.append(brand, nav);
  container.replaceChildren(header, main);
  updateTheme();
  renderLanguage();
  show(initialCopy.sections[0]!);
}

type CsmLanguage = 'es' | 'en';
type CsmTheme = 'dark' | 'light';
type SectionKey = 'overview' | 'travel' | 'alerts' | 'sources' | 'sites' | 'settings';

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
    pendingDescription: 'La selección y aprobación de fuentes, los paneles y las reglas y destinatarios de alertas aún no están conectados a esta entrada. Aquí no cambiarán la monitorización.',
    sections: [
      { key: 'overview', label: 'Resumen y mapa', title: 'Resumen de seguridad', description: 'Consulta las señales y el estado de cobertura de las ubicaciones vigiladas.', cards: [
        { title: 'Sin señales disponibles', detail: 'Conecta y aprueba las fuentes para consultar acontecimientos con su procedencia y fecha.' },
        { title: 'Mapa pendiente', detail: 'El mapa y las sedes autorizadas se conectarán cuando esté configurado el acceso corporativo.' },
        { title: 'Estado de las fuentes', detail: 'Estado no disponible: conecta el servicio de fuentes. Una fuente no disponible no significa ausencia de riesgo.' },
      ] },
      { key: 'travel', label: 'Países y viajes', title: 'Países y viajes', description: 'Vigila acontecimientos por país y periodo de viaje.', cards: [
        { title: 'Sin vigilancias configuradas', detail: 'La creación y el seguimiento de vigilancias se incorporarán en una fase posterior.' },
      ] },
      { key: 'alerts', label: 'Alertas', title: 'Alertas', description: 'Revisa los avisos y su seguimiento.', cards: [
        { title: 'Sin alertas disponibles', detail: 'La entrega, el reconocimiento y el historial requieren configurar el servicio corporativo.' },
      ] },
      { key: 'sources', label: 'Fuentes', title: 'Fuentes', description: 'Consulta las fuentes aprobadas y su disponibilidad.', cards: [
        { title: 'Aprobación no disponible', detail: 'Conecta el catálogo corporativo. Un responsable debe aprobar las fuentes antes de generar avisos.' },
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
    pendingDescription: 'Source selection and approval, panels, alert rules, and recipients are not connected to this entry yet. Changing them here would not affect monitoring.',
    sections: [
      { key: 'overview', label: 'Overview and map', title: 'Security overview', description: 'Review signals and coverage status for monitored locations.', cards: [
        { title: 'No signals available', detail: 'Connect and approve sources to review events with their provenance and timestamp.' },
        { title: 'Map pending', detail: 'The map and approved sites will be connected when corporate access is configured.' },
        { title: 'Source status', detail: 'Status unavailable: connect the source service. An unavailable source does not mean there is no risk.' },
      ] },
      { key: 'travel', label: 'Countries and travel', title: 'Countries and travel', description: 'Monitor events by country and travel period.', cards: [
        { title: 'No monitoring configured', detail: 'Creating and tracking country watches will be added in a later phase.' },
      ] },
      { key: 'alerts', label: 'Alerts', title: 'Alerts', description: 'Review notices and their follow-up.', cards: [
        { title: 'No alerts available', detail: 'Delivery, acknowledgement, and history require the corporate service to be configured.' },
      ] },
      { key: 'sources', label: 'Sources', title: 'Sources', description: 'Review approved sources and their availability.', cards: [
        { title: 'Approval unavailable', detail: 'Connect the corporate catalog. A responsible person must approve sources before alerts are generated.' },
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

export function mountCsm(container: HTMLElement): void {
  let theme = readLocalPreference('csm-theme', ['dark', 'light'] as const, 'dark');
  let language = readLocalPreference('csm-language', ['es', 'en'] as const, 'es');
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
      const persistenceNote = document.createElement('p');
      persistenceNote.className = 'csm-preference-note';
      persistenceNote.textContent = copy.settingsDescription;
      controls.append(themeGroup, languageGroup);
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

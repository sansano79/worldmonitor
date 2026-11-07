type Section = {
  label: string;
  title: string;
  description: string;
  cards: Array<{ title: string; detail: string }>;
};

const SECTIONS: Section[] = [
  { label: 'Resumen y mapa', title: 'Resumen de seguridad', description: 'Consulta las señales y el estado de cobertura de las ubicaciones vigiladas.', cards: [
    { title: 'Sin señales disponibles', detail: 'Conecta y aprueba las fuentes para consultar acontecimientos con su procedencia y fecha.' },
    { title: 'Mapa pendiente', detail: 'El mapa y las sedes autorizadas se conectarán cuando esté configurado el acceso corporativo.' },
    { title: 'Estado de las fuentes', detail: 'Estado no disponible: conecta el servicio de fuentes. Una fuente no disponible no significa ausencia de riesgo.' },
  ] },
  { label: 'Países y viajes', title: 'Países y viajes', description: 'Vigila acontecimientos por país y periodo de viaje.', cards: [
    { title: 'Sin vigilancias configuradas', detail: 'La creación y el seguimiento de vigilancias se incorporarán en una fase posterior.' },
  ] },
  { label: 'Alertas', title: 'Alertas', description: 'Revisa los avisos y su seguimiento.', cards: [
    { title: 'Sin alertas disponibles', detail: 'La entrega, el reconocimiento y el historial requieren configurar el servicio corporativo.' },
  ] },
  { label: 'Fuentes', title: 'Fuentes', description: 'Consulta las fuentes aprobadas y su disponibilidad.', cards: [
    { title: 'Aprobación no disponible', detail: 'Conecta el catálogo corporativo. Un responsable debe aprobar las fuentes antes de generar avisos.' },
  ] },
  { label: 'Sedes', title: 'Sedes', description: 'Accede al inventario autorizado de la organización.', cards: [
    { title: 'Inventario no conectado', detail: 'El acceso a sedes privadas requiere identidad, permisos y almacenamiento configurados.' },
  ] },
  { label: 'Ajustes', title: 'Ajustes operativos', description: 'Configura la experiencia y los servicios de seguridad.', cards: [
    { title: 'Preferencias y paneles', detail: 'Configuración pendiente. Se habilitará cuando la vista operativa esté conectada.' },
    { title: 'Fuentes aprobadas', detail: 'Configuración pendiente. Las integraciones y credenciales se administran en el servidor.' },
    { title: 'Alertas', detail: 'Configuración pendiente. Los destinatarios y reglas requieren acceso corporativo.' },
  ] },
];

export function mountCsm(container: HTMLElement): void {
  const header = document.createElement('header');
  header.className = 'csm-header';
  const brand = document.createElement('div');
  brand.className = 'csm-brand';
  brand.textContent = 'CSM · Seguridad física';
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Navegación principal');
  header.append(brand, nav);
  const main = document.createElement('main');
  main.id = 'contenido';
  const buttons: HTMLButtonElement[] = [];

  function show(section: Section): void {
    for (const button of buttons) {
      if (button.textContent === section.label) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
    const intro = document.createElement('div');
    intro.className = 'csm-intro';
    const eyebrow = document.createElement('p');
    eyebrow.className = 'csm-eyebrow';
    eyebrow.textContent = 'CORPORATE SECURITY MONITOR';
    const heading = document.createElement('h1');
    heading.textContent = section.title;
    const description = document.createElement('p');
    description.textContent = section.description;
    intro.append(eyebrow, heading, description);
    const grid = document.createElement('div');
    grid.className = 'csm-grid';
    for (const card of section.cards) {
      const article = document.createElement('article');
      const title = document.createElement('h2');
      title.textContent = card.title;
      const detail = document.createElement('p');
      detail.textContent = card.detail;
      article.append(title, detail);
      grid.append(article);
    }
    main.replaceChildren(intro, grid);
  }

  for (const section of SECTIONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = section.label;
    button.addEventListener('click', () => show(section));
    buttons.push(button);
    nav.append(button);
  }
  container.replaceChildren(header, main);
  show(SECTIONS[0]!);
}

/**
 * Keyless, CSM-only Cesium renderer. It uses public street tiles over the
 * bundled local Earth texture and public country boundaries; no Ion account
 * or terrain provider is configured here.
 */
import * as Cesium from 'cesium-runtime';
import '@cesium/engine/Build/Widgets/CesiumWidget/CesiumWidget.css';
import './cesium-map.css';
import type { MapLayers } from '@/types';
import { SEIDOR_OFFICES } from '@/config/seidor-offices';
import { MapPopup } from './MapPopup';
import type { MapContainerState, MapView, TimeRange } from './MapContainer';
import type { Earthquake } from '@/services/earthquakes';
import type { WeatherAlert } from '@/services/weather';
import type { SocialUnrestEvent, MilitaryFlight, MilitaryVessel, NaturalEvent, UcdpGeoEvent } from '@/types';
import type { DisplacementFlow } from '@/services/displacement';
import type { DiseaseOutbreakItem } from '@/services/disease-outbreaks';
import type { AcledConflictEvent } from '@/generated/client/worldmonitor/conflict/v1/service_client';

type LayerKey = 'seidorOffices' | 'conflicts' | 'natural' | 'weather' | 'protests' | 'fires' | 'diseaseOutbreaks' | 'displacement' | 'ucdpEvents' | 'military';
type GeoRing = Array<[number, number]>;
type GeoPolygon = GeoRing[];
const OSM_TILE_SOURCE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
interface CountryFeature {
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: GeoPolygon | GeoPolygon[] } | null;
  properties?: Record<string, unknown>;
}

const LAYERS: Array<{ key: LayerKey; label: string }> = [
  { key: 'seidorOffices', label: 'Sedes SEIDOR' },
  { key: 'conflicts', label: 'Conflictos' },
  { key: 'natural', label: 'Eventos naturales' },
  { key: 'weather', label: 'Alertas meteorológicas' },
  { key: 'protests', label: 'Protestas' },
  { key: 'fires', label: 'Incendios' },
  { key: 'diseaseOutbreaks', label: 'Brotes sanitarios' },
  { key: 'displacement', label: 'Desplazamientos' },
  { key: 'ucdpEvents', label: 'Eventos UCDP' },
  { key: 'military', label: 'Actividad militar' },
];

const layerColor: Record<LayerKey, Cesium.Color> = {
  seidorOffices: Cesium.Color.fromCssColorString('#45a4ff'),
  conflicts: Cesium.Color.fromCssColorString('#ef4444'),
  natural: Cesium.Color.fromCssColorString('#f59e0b'),
  weather: Cesium.Color.fromCssColorString('#38bdf8'),
  protests: Cesium.Color.fromCssColorString('#c084fc'),
  fires: Cesium.Color.fromCssColorString('#fb923c'),
  diseaseOutbreaks: Cesium.Color.fromCssColorString('#a3e635'),
  displacement: Cesium.Color.fromCssColorString('#2dd4bf'),
  ucdpEvents: Cesium.Color.fromCssColorString('#f87171'),
  military: Cesium.Color.fromCssColorString('#f43f5e'),
};

export interface CesiumMapOptions {
  onLayerChange?: (layer: keyof MapLayers, enabled: boolean, source: 'user' | 'programmatic') => void;
  onStateChanged?: (state: MapContainerState) => void;
  onCountryClicked?: (country: { lat: number; lon: number; code?: string; name?: string }) => void;
  onContextMenu?: (payload: { lat: number; lon: number; screenX: number; screenY: number }) => void;
}

export class CesiumMap {
  private readonly container: HTMLElement;
  private readonly options: CesiumMapOptions;
  private readonly viewer: Cesium.CesiumWidget;
  private readonly popup: MapPopup;
  private featurePopup: HTMLDivElement | null = null;
  private readonly layerSources = new Map<LayerKey, Cesium.CustomDataSource>();
  private readonly state: MapContainerState;
  private readonly readyPromise: Promise<void>;
  private readonly controls: HTMLDivElement;
  private readonly basemapStatus: HTMLDivElement;
  private readonly destroyHandlers: Array<() => void> = [];
  private destroyed = false;
  private initialCameraDistance = 12_000_000;
  private countryNames = new Map<string, { code: string; name: string }>();
  private countryShapes: Array<{ country: { code: string; name: string }; polygons: GeoPolygon[] }> = [];
  private readonly dataGroups = new Map<string, { layer: LayerKey; items: Array<{ lat: number; lon: number; title: string; data: unknown; popupType?: string }> }>();

  public static async create(
    container: HTMLElement,
    state: MapContainerState,
    options: CesiumMapOptions = {},
  ): Promise<CesiumMap> {
    const baseUrl = `${import.meta.env.BASE_URL}cesium/`;
    (window as Window & { CESIUM_BASE_URL?: string }).CESIUM_BASE_URL = baseUrl;
    return new CesiumMap(container, state, options);
  }

  private constructor(container: HTMLElement, state: MapContainerState, options: CesiumMapOptions) {
    this.container = container;
    this.options = options;
    this.state = { ...state, layers: { ...state.layers } };
    this.popup = new MapPopup(container);
    container.classList.add('cesium-csm-mode');
    container.style.cssText = 'width:100%;height:100%;position:relative;background:#081321;';

    // Use the engine widget directly. Viewer mounts Knockout based UI widgets
    // whose binding parser uses `new Function`, which strict dashboard CSP
    // correctly blocks. CSM supplies its own controls and needs only the
    // Cesium scene, camera, and data source collections.
    this.viewer = new Cesium.CesiumWidget(container, {
      baseLayer: false,
      terrain: undefined,
      scene3DOnly: true,
      requestRenderMode: true,
      maximumRenderTimeChange: Infinity,
      msaaSamples: 2,
    });
    this.viewer.scene.globe.enableLighting = true;
    this.viewer.scene.globe.showGroundAtmosphere = true;
    this.viewer.scene.fog.enabled = true;
    this.viewer.scene.highDynamicRange = false;
    this.viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100_000;
    this.viewer.scene.screenSpaceCameraController.maximumZoomDistance = 25_000_000;
    container.dataset.mapRenderer = 'cesium';

    for (const layer of LAYERS) {
      const source = new Cesium.CustomDataSource(layer.key);
      source.show = Boolean(this.state.layers[layer.key]);
      this.layerSources.set(layer.key, source);
      this.viewer.dataSources.add(source);
    }

    this.controls = this.createLayerControls();
    container.appendChild(this.controls);
    this.basemapStatus = document.createElement('div');
    this.basemapStatus.className = 'cesium-csm-basemap-status';
    this.basemapStatus.setAttribute('role', 'status');
    this.basemapStatus.hidden = true;
    this.basemapStatus.dataset.source = OSM_TILE_SOURCE;
    container.appendChild(this.basemapStatus);
    this.installPicking();
    this.readyPromise = this.initializeLocalContent();
  }

  private async initializeLocalContent(): Promise<void> {
    const base = import.meta.env.BASE_URL;
    const imagery = await Cesium.SingleTileImageryProvider.fromUrl(`${base}textures/earth-topo-bathy.jpg`);
    if (this.destroyed) return;
    this.viewer.imageryLayers.addImageryProvider(imagery);
    // Public interactive raster tiles; the same-origin Nginx route applies the
    // application User-Agent and compliant cache policy before reaching this
    // upstream: https://tile.openstreetmap.org/{z}/{x}/{y}.png
    const streets = new Cesium.UrlTemplateImageryProvider({
      url: `${base}tiles/osm/{z}/{x}/{y}.png`,
      credit: new Cesium.Credit('<a href="https://openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a> · Open Database License (ODbL)'),
      maximumLevel: 19,
      enablePickFeatures: false,
    });
    this.viewer.imageryLayers.addImageryProvider(streets);
    const onStreetTileError = (error: { level?: number; timesRetried: number }) => {
      // The local low-detail globe remains beneath the tile layer. Expose that
      // fallback only for city-scale failures so one missing global tile does
      // not suggest the whole streets service is unavailable.
      if (error.level != null && error.level >= 10 && error.timesRetried >= 0) {
        this.basemapStatus.textContent = 'Cartografía de calles no disponible temporalmente · se mantiene la base global local';
        this.basemapStatus.hidden = false;
        this.container.dataset.csmBasemapFallback = 'true';
      }
    };
    streets.errorEvent.addEventListener(onStreetTileError);
    this.destroyHandlers.push(() => streets.errorEvent.removeEventListener(onStreetTileError));
    const response = await globalThis.fetch(`${base}data/countries.geojson`, { headers: { Accept: 'application/geo+json,application/json' } });
    if (!response.ok) throw new Error(`Country boundaries unavailable (${response.status})`);
    const collection = await response.json() as { features?: CountryFeature[] };
    if (this.destroyed) return;
    this.addCountryBoundaries(collection.features ?? []);
    this.addOfficeMarkers();
    this.container.dataset.csmCesiumReady = 'true';
    this.container.dataset.csmOfficeCount = String(SEIDOR_OFFICES.length);
    this.initialCameraDistance = Math.min(24_000_000, Math.max(12_000_000, 12_000_000 * 862 / Math.max(this.container.clientWidth, 390)));
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(12, 18, this.initialCameraDistance),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
    });
    this.viewer.scene.requestRender();
  }

  private createLayerControls(): HTMLDivElement {
    const root = document.createElement('div');
    root.className = 'cesium-csm-layer-control';
    root.setAttribute('aria-label', 'Capas de seguridad física');
    for (const { key, label } of LAYERS) {
      const row = document.createElement('label');
      row.className = 'cesium-csm-layer-row';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = Boolean(this.state.layers[key]);
      input.dataset.layer = key;
      input.addEventListener('change', () => {
        const enabled = input.checked;
        this.state.layers[key] = enabled;
        const source = this.layerSources.get(key);
        if (source) source.show = enabled;
        this.options.onLayerChange?.(key, enabled, 'user');
        this.emitState();
        this.viewer.scene.requestRender();
      });
      const dot = document.createElement('span');
      dot.className = 'cesium-csm-layer-dot';
      dot.style.backgroundColor = layerColor[key].toCssColorString();
      const text = document.createElement('span');
      text.textContent = label;
      row.append(input, dot, text);
      root.appendChild(row);
    }
    return root;
  }

  private installPicking(): void {
    const handler = this.viewer.screenSpaceEventHandler;
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const picked = this.viewer.scene.pick(movement.position);
      const entity = picked?.id as Cesium.Entity | undefined;
      const officeId = entity?.properties?.['officeId']?.getValue(Cesium.JulianDate.now()) as string | undefined;
      if (officeId) {
        const office = SEIDOR_OFFICES.find((item) => item.id === officeId);
        if (office) this.popup.show({ type: 'seidorOffice', data: office, x: movement.position.x, y: movement.position.y } as never);
        return;
      }
      const itemData = entity?.properties?.['itemData']?.getValue(Cesium.JulianDate.now()) as never;
      const popupType = entity?.properties?.['popupType']?.getValue(Cesium.JulianDate.now()) as string | undefined;
      if (itemData && popupType) {
        const title = String(entity?.properties?.['title']?.getValue(Cesium.JulianDate.now()) ?? 'Señal de seguridad');
        this.showFeaturePopup(title, itemData, movement.position);
        return;
      }
      const countryId = entity?.properties?.['countryCode']?.getValue(Cesium.JulianDate.now()) as string | undefined;
      const location = this.viewer.camera.pickEllipsoid(movement.position, this.viewer.scene.globe.ellipsoid);
      if (location) {
        const coords = Cesium.Cartographic.fromCartesian(location);
        const lat = Cesium.Math.toDegrees(coords.latitude);
        const lon = Cesium.Math.toDegrees(coords.longitude);
        const country = countryId ? this.countryNames.get(countryId) : this.findCountry(lat, lon);
        if (country) this.options.onCountryClicked?.({ lat, lon, code: country.code, name: country.name });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const point = this.viewer.camera.pickEllipsoid(movement.position, this.viewer.scene.globe.ellipsoid);
      if (!point) return;
      const coords = Cesium.Cartographic.fromCartesian(point);
      this.options.onContextMenu?.({
        lat: Cesium.Math.toDegrees(coords.latitude),
        lon: Cesium.Math.toDegrees(coords.longitude),
        screenX: movement.position.x,
        screenY: movement.position.y,
      });
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    const stopPropagation = (event: Event) => event.stopPropagation();
    this.controls.addEventListener('pointerdown', stopPropagation);
    this.destroyHandlers.push(() => this.controls.removeEventListener('pointerdown', stopPropagation));
    const cameraChanged = () => this.emitState();
    this.viewer.camera.changed.addEventListener(cameraChanged);
    this.destroyHandlers.push(() => this.viewer.camera.changed.removeEventListener(cameraChanged));
  }

  private addCountryBoundaries(features: CountryFeature[]): void {
    const boundaries = new Cesium.CustomDataSource('country-boundaries');
    const lineColor = Cesium.Color.fromCssColorString('#aac2dd').withAlpha(0.58);
    for (const [featureIndex, feature] of features.entries()) {
      if (!feature.geometry) continue;
      const values = feature.properties ?? {};
      const code = String(values['ISO_A3'] ?? values['iso_a3'] ?? values['ADM0_A3'] ?? values['ISO3166-1-Alpha-3'] ?? '');
      const name = String(values['ADMIN'] ?? values['name'] ?? values['NAME'] ?? '');
      if (!code || !name) continue;
      const polygons = feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates as GeoPolygon]
        : feature.geometry.coordinates as GeoPolygon[];
      this.countryNames.set(code, { code, name });
      this.countryShapes.push({ country: { code, name }, polygons });
      for (const [polygonIndex, polygon] of polygons.entries()) {
        for (const [ringIndex, ring] of polygon.entries()) {
          const positions = ring.flatMap(([lon, lat]) => Number.isFinite(lat) && Number.isFinite(lon) ? [lon, lat] : []);
          if (positions.length < 6) continue;
          boundaries.entities.add({
            id: `country-border-${featureIndex}-${polygonIndex}-${ringIndex}`,
            properties: { countryCode: code, countryName: name },
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArray(positions),
              width: 0.8,
              material: lineColor,
              clampToGround: false,
            },
          });
        }
      }
    }
    boundaries.name = 'Límites de países (Natural Earth)';
    this.viewer.dataSources.add(boundaries);
  }

  private findCountry(lat: number, lon: number): { code: string; name: string } | null {
    for (const { country, polygons } of this.countryShapes) {
      if (polygons.some((rings) => {
        if (!this.pointInRing(lon, lat, rings[0] ?? [])) return false;
        return !rings.slice(1).some((hole) => this.pointInRing(lon, lat, hole));
      })) return country;
    }
    return null;
  }

  private pointInRing(lon: number, lat: number, ring: GeoRing): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i] ?? [0, 0];
      const [xj, yj] = ring[j] ?? [0, 0];
      if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / ((yj - yi) || Number.EPSILON) + xi) inside = !inside;
    }
    return inside;
  }

  private addOfficeMarkers(): void {
    const source = this.layerSources.get('seidorOffices');
    if (!source) return;
    for (const office of SEIDOR_OFFICES) {
      source.entities.add({
        id: `csm-office-${office.id}`,
        position: Cesium.Cartesian3.fromDegrees(office.lon, office.lat, 18_000),
        properties: { officeId: office.id },
        point: {
          pixelSize: 9,
          color: layerColor.seidorOffices,
          outlineColor: Cesium.Color.WHITE.withAlpha(0.92),
          outlineWidth: 1.5,
          heightReference: Cesium.HeightReference.NONE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: office.name,
          font: '11px system-ui, sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#07111f'),
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -16),
          show: false,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 6_500_000),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }
  }

  private replacePointGroup(group: string, layer: LayerKey, items: Array<{ lat: number; lon: number; title: string; data: unknown; popupType?: string }>): void {
    this.dataGroups.set(group, { layer, items });
    const source = this.layerSources.get(layer);
    if (!source) return;
    source.entities.removeAll();
    const visibleItems = [...this.dataGroups.values()].filter((entry) => entry.layer === layer).flatMap((entry) => entry.items);
    for (const [index, item] of visibleItems.entries()) {
      if (!Number.isFinite(item.lat) || !Number.isFinite(item.lon)) continue;
      source.entities.add({
        id: `csm-${layer}-${index}`,
        position: Cesium.Cartesian3.fromDegrees(item.lon, item.lat, 12_000),
        properties: { itemData: item.data, popupType: item.popupType, title: item.title },
        point: {
          pixelSize: 7,
          color: layerColor[layer],
          outlineColor: Cesium.Color.WHITE.withAlpha(0.75),
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: item.title.slice(0, 80),
          font: '10px system-ui, sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          show: false,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 3_500_000),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }
    this.viewer.scene.requestRender();
  }

  private showFeaturePopup(title: string, rawData: unknown, position: Cesium.Cartesian2): void {
    this.popup.hide();
    this.featurePopup?.remove();
    const data = rawData && typeof rawData === 'object' ? rawData as Record<string, unknown> : {};
    const popup = document.createElement('div');
    popup.className = 'cesium-csm-feature-popup';
    popup.setAttribute('role', 'dialog');
    popup.style.left = `${Math.min(position.x + 12, Math.max(12, this.container.clientWidth - 310))}px`;
    popup.style.top = `${Math.min(position.y + 12, Math.max(12, this.container.clientHeight - 150))}px`;
    const heading = document.createElement('strong');
    heading.textContent = title;
    popup.appendChild(heading);
    for (const key of ['country', 'city', 'region', 'sourceName', 'source']) {
      const value = data[key];
      if (typeof value !== 'string' || !value.trim()) continue;
      const detail = document.createElement('div');
      detail.textContent = key === 'sourceName' || key === 'source' ? `Fuente: ${value}` : value;
      popup.appendChild(detail);
    }
    const sourceUrl = data['sourceUrl'];
    if (typeof sourceUrl === 'string' && /^https:\/\//i.test(sourceUrl)) {
      const link = document.createElement('a');
      link.href = sourceUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Abrir fuente';
      popup.appendChild(link);
    }
    this.container.appendChild(popup);
    this.featurePopup = popup;
  }

  private emitState(): void {
    if (this.destroyed) return;
    const height = this.viewer.camera.positionCartographic.height;
    const zoom = Math.max(1, Math.min(18, 18 - Math.log2(Math.max(1, height / 120_000))));
    this.state.zoom = zoom;
    this.state.pan = { x: 0, y: 0 };
    this.options.onStateChanged?.(this.getState());
  }

  public whenReady(): Promise<void> { return this.readyPromise; }
  public whenViewportSettled(): Promise<boolean> { return Promise.resolve(true); }
  public render(): void { this.viewer.scene.requestRender(); }
  public resize(): void { if (!this.destroyed) this.viewer.resize(); }
  public setIsResizing(_isResizing: boolean): void { this.resize(); }

  public getCenter(): { lat: number; lon: number } | null {
    if (this.destroyed) return null;
    const center = this.viewer.camera.pickEllipsoid(
      new Cesium.Cartesian2(this.container.clientWidth / 2, this.container.clientHeight / 2),
      this.viewer.scene.globe.ellipsoid,
    );
    if (!center) return null;
    const cartographic = Cesium.Cartographic.fromCartesian(center);
    return { lat: Cesium.Math.toDegrees(cartographic.latitude), lon: Cesium.Math.toDegrees(cartographic.longitude) };
  }

  public getState(): MapContainerState { return { ...this.state, layers: { ...this.state.layers } }; }

  public setCenter(lat: number, lon: number, zoom?: number): void {
    const height = zoom == null ? this.viewer.camera.positionCartographic.height : Math.max(100_000, this.initialCameraDistance / (2 ** Math.max(0, zoom - 2)));
    this.viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lon, lat, height), duration: 0.55 });
  }

  public setZoom(zoom: number): void {
    const center = this.getCenter() ?? { lat: 18, lon: 12 };
    this.setCenter(center.lat, center.lon, zoom);
  }

  public setView(view: MapView, zoom?: number): void {
    const views: Record<MapView, [number, number]> = {
      global: [12, 18], america: [-85, 18], mena: [38, 27], eu: [15, 52], asia: [105, 31],
      latam: [-65, -16], africa: [20, 2], oceania: [145, -24],
    };
    const [lon, lat] = views[view] ?? views.global;
    this.state.view = view;
    this.setCenter(lat, lon, zoom);
  }

  public setTimeRange(range: TimeRange): void { this.state.timeRange = range; this.emitState(); }
  public getTimeRange(): TimeRange { return this.state.timeRange; }

  public setLayers(layers: MapLayers): void {
    this.state.layers = { ...layers };
    for (const { key } of LAYERS) {
      const visible = Boolean(layers[key]);
      const source = this.layerSources.get(key);
      if (source) source.show = visible;
      const input = this.controls.querySelector<HTMLInputElement>(`input[data-layer="${key}"]`);
      if (input) input.checked = visible;
    }
    this.viewer.scene.requestRender();
  }

  public setEarthquakes(items: Earthquake[]): void {
    this.replacePointGroup('earthquakes', 'natural', items.flatMap((data) => data.location ? [{ lat: data.location.latitude, lon: data.location.longitude, title: `Terremoto · M${data.magnitude}`, data, popupType: 'earthquake' }] : []));
  }
  public setWeatherAlerts(items: WeatherAlert[]): void {
    this.replacePointGroup('weather', 'weather', items.flatMap((data) => data.centroid ? [{ lat: data.centroid[1], lon: data.centroid[0], title: data.event ?? 'Alerta meteorológica', data, popupType: 'weather' }] : []));
  }
  public setProtests(items: SocialUnrestEvent[]): void {
    this.replacePointGroup('protests', 'protests', items.map((data) => ({ lat: data.lat, lon: data.lon, title: data.title ?? data.city ?? 'Protesta', data, popupType: 'protest' })));
  }
  public setMilitaryFlights(items: MilitaryFlight[]): void {
    this.replacePointGroup('military-flights', 'military', items.map((data) => ({ lat: data.lat, lon: data.lon, title: 'Vuelo militar', data, popupType: 'militaryFlight' })));
  }
  public setMilitaryVessels(items: MilitaryVessel[]): void {
    this.replacePointGroup('military-vessels', 'military', items.map((data) => ({ lat: data.lat, lon: data.lon, title: data.name ?? 'Buque militar', data, popupType: 'militaryVessel' })));
  }
  public setNaturalEvents(items: NaturalEvent[]): void {
    this.replacePointGroup('natural-events', 'natural', items.map((data) => ({ lat: data.lat, lon: data.lon, title: data.title, data, popupType: 'natEvent' })));
  }
  public setFires(items: Array<{ lat: number; lon: number; brightness: number; frp: number; confidence: number; region: string; acq_date: string; daynight: string }>): void {
    this.replacePointGroup('fires', 'fires', items.map((data) => ({ lat: data.lat, lon: data.lon, title: data.region || 'Incendio', data, popupType: 'hotspot' })));
  }
  public setUcdpEvents(items: UcdpGeoEvent[]): void {
    this.replacePointGroup('ucdp', 'ucdpEvents', items.map((data) => ({ lat: data.latitude, lon: data.longitude, title: data.country ?? 'Evento UCDP', data, popupType: 'conflict' })));
  }
  public setDisplacementFlows(items: DisplacementFlow[]): void {
    this.replacePointGroup('displacement', 'displacement', items.flatMap((data) => Number.isFinite(data.asylumLat) && Number.isFinite(data.asylumLon) ? [{ lat: data.asylumLat!, lon: data.asylumLon!, title: data.asylumName, data, popupType: 'crossBorder' }] : []));
  }
  public setDiseaseOutbreaks(items: DiseaseOutbreakItem[]): void {
    this.replacePointGroup('outbreaks', 'diseaseOutbreaks', items.flatMap((data) => {
      const record = data as DiseaseOutbreakItem & { lat?: number; lon?: number; latitude?: number; longitude?: number };
      const lat = record.lat ?? record.latitude;
      const lon = record.lon ?? record.longitude;
      return Number.isFinite(lat) && Number.isFinite(lon) ? [{ lat: lat!, lon: lon!, title: 'Alerta sanitaria', data, popupType: 'hotspot' }] : [];
    }));
  }

  public setLayerLoading(layer: keyof MapLayers, loading: boolean): void {
    this.controls.querySelector<HTMLInputElement>(`input[data-layer="${layer}"]`)?.toggleAttribute('aria-busy', loading);
  }
  public setLayerReady(layer: keyof MapLayers, ready: boolean): void {
    this.controls.querySelector<HTMLInputElement>(`input[data-layer="${layer}"]`)?.toggleAttribute('data-empty', !ready);
  }
  public hideLayerToggle(layer: keyof MapLayers): void {
    this.controls.querySelector<HTMLInputElement>(`input[data-layer="${layer}"]`)?.closest('label')?.remove();
  }
  public enableLayer(layer: keyof MapLayers): void {
    if (!(layer in this.state.layers)) return;
    this.state.layers[layer] = true;
    this.setLayers(this.state.layers);
    this.options.onLayerChange?.(layer, true, 'programmatic');
  }
  public getBbox(): string | null { return null; }
  public flashLocation(lat: number, lon: number, _durationMs = 2000): void { this.setCenter(lat, lon); }
  public openChokepoint(_id: string): void {}
  public setOnHotspotClick(_callback: (hotspot: never) => void): void {}
  public setOnNewsClick(_callback: (item: never) => void): void {}
  public setOnAircraftPositionsUpdate(_callback: (positions: never[]) => void): void {}
  public setScenarioState(_state: unknown): void {}

  public setConflictEvents(items: AcledConflictEvent[]): void {
    this.replacePointGroup('conflicts', 'conflicts', items.flatMap((data) => data.location ? [{
      lat: data.location.latitude,
      lon: data.location.longitude,
      title: `${data.eventType} · ${data.country}`,
      data,
      popupType: 'conflict',
    }] : []));
  }

  public setOnLayerChange(callback: NonNullable<CesiumMapOptions['onLayerChange']>): void { this.options.onLayerChange = callback; }
  public onStateChanged(callback: NonNullable<CesiumMapOptions['onStateChanged']>): void { this.options.onStateChanged = callback; }
  public setOnCountryClick(callback: NonNullable<CesiumMapOptions['onCountryClicked']>): void { this.options.onCountryClicked = callback; }
  public setOnMapContextMenu(callback: NonNullable<CesiumMapOptions['onContextMenu']>): void { this.options.onContextMenu = callback; }
  public setOnTimeRangeChange(_callback: (range: TimeRange) => void): void {}

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.destroyHandlers.forEach((dispose) => dispose());
    this.popup.hide();
    this.featurePopup?.remove();
    this.featurePopup = null;
    this.viewer.destroy();
    delete this.container.dataset.csmCesiumReady;
    delete this.container.dataset.csmOfficeCount;
    delete this.container.dataset.mapRenderer;
    this.controls.remove();
    this.container.classList.remove('cesium-csm-mode');
  }
}

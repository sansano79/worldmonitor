import { parseCorporateSite } from '../shared/corporate-site.mjs';

const SITE_COLUMNS = `id, name, country_code, region, city, latitude, longitude,
  site_type, criticality, operational_status, monitoring_radii_km`;

function toSite(row) {
  return parseCorporateSite({
    id: row.id, name: row.name, countryCode: row.country_code,
    region: row.region, city: row.city,
    location: { latitude: row.latitude, longitude: row.longitude },
    type: row.site_type, criticality: row.criticality,
    operationalStatus: row.operational_status,
    monitoringRadiiKm: row.monitoring_radii_km,
  });
}

export function createSitesRepository(db) {
  return {
    async findMembership({ issuer, subject }) {
      const result = await db.query(
        'SELECT organization_id, role FROM csm_memberships WHERE issuer = $1 AND subject = $2',
        [issuer, subject],
      );
      const row = result.rows[0];
      return row ? { organizationId: row.organization_id, role: row.role } : null;
    },
    async listSites(organizationId) {
      const result = await db.query(
        `SELECT ${SITE_COLUMNS} FROM csm_sites WHERE organization_id = $1 ORDER BY id`,
        [organizationId],
      );
      return result.rows.map(toSite);
    },
    async findSite(organizationId, siteId) {
      const result = await db.query(
        `SELECT ${SITE_COLUMNS} FROM csm_sites WHERE organization_id = $1 AND id = $2`,
        [organizationId, siteId],
      );
      return result.rows[0] ? toSite(result.rows[0]) : null;
    },
  };
}

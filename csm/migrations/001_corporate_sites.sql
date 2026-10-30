CREATE TABLE csm_organizations (
  id text PRIMARY KEY,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120)
);

CREATE TABLE csm_memberships (
  issuer text NOT NULL,
  subject text NOT NULL,
  organization_id text NOT NULL REFERENCES csm_organizations(id),
  role text NOT NULL CHECK (role IN ('viewer', 'analyst', 'admin')),
  PRIMARY KEY (issuer, subject)
);

CREATE INDEX csm_memberships_organization_idx ON csm_memberships (organization_id);

CREATE TABLE csm_sites (
  organization_id text NOT NULL REFERENCES csm_organizations(id),
  id text NOT NULL CHECK (id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$'),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  country_code text NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
  region text NOT NULL CHECK (length(region) BETWEEN 1 AND 120),
  city text NOT NULL CHECK (length(city) BETWEEN 1 AND 120),
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  site_type text NOT NULL CHECK (site_type IN ('office', 'plant', 'warehouse', 'other')),
  criticality text NOT NULL CHECK (criticality IN ('low', 'medium', 'high', 'critical')),
  operational_status text NOT NULL CHECK (operational_status IN ('active', 'limited', 'suspended', 'closed')),
  monitoring_radii_km double precision[] NOT NULL CHECK (cardinality(monitoring_radii_km) BETWEEN 1 AND 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id)
);

CREATE INDEX csm_sites_organization_country_idx ON csm_sites (organization_id, country_code);

CREATE TABLE csm_audit_entries (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id text REFERENCES csm_organizations(id),
  actor_issuer text NOT NULL,
  actor_subject text NOT NULL,
  action text NOT NULL,
  target_id text,
  outcome text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX csm_audit_organization_time_idx ON csm_audit_entries (organization_id, occurred_at DESC);

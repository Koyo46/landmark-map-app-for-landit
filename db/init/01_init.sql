CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS spot (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  address TEXT,
  location geography(Point, 4326)
);

CREATE INDEX IF NOT EXISTS spot_location_idx ON spot USING GIST (location);
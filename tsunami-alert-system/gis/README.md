# Impact zones (GIS)

- `preprocess_zones.py` — convert shapefiles to **EPSG:4326** GeoJSON using `ogr2ogr` (GDAL) or, with `--fiona`, Python `fiona` + `shapely`.
- `sample_impact_zones.geojson` — two-dimensional polygon in WGS84; load into `public/impact_zones.geojson` (frontend) and/or seed PostGIS in your own ETL.
- In production, store polygons in the `alerts.impact_zone` `GEOMETRY(Polygon,4326)` column and return them with `/alerts` as GeoJSON.

**Example (GDAL in PATH):**

```bash
python gis/preprocess_zones.py path/to/zone.shp gis/out.geojson
```

**Example (Fiona, no ogr2ogr):**

```bash
pip install fiona shapely
python gis/preprocess_zones.py path/to/zone.geojson gis/out.geojson --fiona
```

To load into PostGIS, use `ogr2ogr -f PostgreSQL` or a SQL `COPY` pipeline after the extension is created.

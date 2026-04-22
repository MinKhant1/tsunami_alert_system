#!/usr/bin/env python3
"""
Convert a shapefile (or any OGR driver) to GeoJSON / PostGIS-ready WKT
using ogr2ogr (GDAL) or Shapely/Fiona.
Requires: `ogr2ogr` in PATH, or: pip install fiona shapely
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from shutil import which as sh_which

try:
    import fiona
    from shapely.geometry import mapping, shape
except Exception:
    fiona = None


def with_ogr2ogr(in_path: Path, out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ogr2ogr",
        "-f",
        "GeoJSON",
        str(out_path),
        str(in_path),
        "-t_srs",
        "EPSG:4326",
    ]
    print("Running:", " ".join(cmd), file=sys.stderr)
    subprocess.run(cmd, check=True)
    print(f"Wrote {out_path}")


def with_fiona(in_path: Path, out_path: Path) -> None:
    if not fiona:
        raise RuntimeError("Fiona is not available")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    features = []
    with fiona.open(in_path) as col:
        for f in col:
            g = shape(f["geometry"])
            if g:
                features.append(
                    {
                        "type": "Feature",
                        "properties": f.get("properties", {}),
                        "geometry": mapping(g),
                    }
                )
    fc = {"type": "FeatureCollection", "features": features}
    out_path.write_text(json.dumps(fc), encoding="utf-8")
    print(f"Wrote {out_path}")


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("source", type=Path, help="Path to .shp, .geojson, or folder")
    p.add_argument("dest", type=Path, help="Output .geojson path")
    p.add_argument("--fiona", action="store_true", help="Use Python stack instead of ogr2ogr")
    args = p.parse_args()
    if args.fiona or not sh_which("ogr2ogr"):
        with_fiona(args.source, args.dest)
    else:
        with_ogr2ogr(args.source, args.dest)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

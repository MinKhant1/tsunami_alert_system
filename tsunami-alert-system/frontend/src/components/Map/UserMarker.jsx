import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { getMapContext } from "./mapConfig";

const defaultLib = getMapContext().lib;

/**
 * @param {object} [mapLib] - mapboxgl or maplibregl (from parent, must match the map)
 */
export default function UserMarker({ map, pos, mapLib = defaultLib }) {
  const mref = useRef(null);
  const el = useRef(null);
  if (!el.current) {
    el.current = document.createElement("div");
    el.current.style.width = "14px";
    el.current.style.height = "14px";
    el.current.style.background = "radial-gradient(circle,#60a5fa,transparent)";
    el.current.style.borderRadius = "50%";
    el.current.style.boxShadow = "0 0 12px #38bdf8";
  }

  useEffect(() => {
    if (!map) return;
    const Marker = mapLib.Marker || mapboxgl.Marker; // same API
    if (!mref.current) {
      mref.current = new Marker({ element: el.current });
      mref.current.setLngLat([pos.lng, pos.lat]);
      mref.current.addTo(map);
    } else {
      mref.current.setLngLat([pos.lng, pos.lat]);
    }
  }, [map, mapLib, pos.lng, pos.lat]);

  return null;
}

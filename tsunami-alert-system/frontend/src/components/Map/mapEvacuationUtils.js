export const EVAC_SRC = "evac-route";
export const EVAC_LAYER = "evac-route-line";

/** Safe remove after unmount, style change, or GL quirks that leave a ghost line. */
export function removeEvacuationRouteFromMap(map) {
  if (!map || !map.getStyle) return;
  try {
    if (map.getLayer(EVAC_LAYER)) map.removeLayer(EVAC_LAYER);
    if (map.getSource(EVAC_SRC)) map.removeSource(EVAC_SRC);
  } catch {
    /* style torn down or map disposed */
  }
}

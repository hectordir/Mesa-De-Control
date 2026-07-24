import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { SupervisionZona } from "../../../lib/api/types";
import { zonaHex, ZONA_LEGEND } from "../lib/admin.presentation";
import { MAP_CENTER, MAP_ZOOM, zonaCoords } from "../lib/zonas.geo";

/**
 * Mapa satelital de La Guaira con un marcador circular por zona (tamaño según
 * `count`, color según `estado`) y un overlay con el conteo de incidencias.
 *
 * Leaflet se inicializa imperativamente en un efecto: fuera de React, así el
 * árbol de marcadores se reconstruye cuando cambia `zonas`. En jsdom el módulo
 * `leaflet` se mockea, por eso todo va detrás de guardas defensivas.
 */
export function ZonasMapCard({ zonas }: { zonas: SupervisionZona[] }) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || typeof L?.map !== "function") return;

    const map = L.map(node, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
    }).setView(MAP_CENTER, MAP_ZOOM);

    // Zoom arriba a la derecha: el overlay de incidencias vive abajo-izquierda,
    // así los botones +/− quedan siempre visibles y clicables.
    L.control?.zoom?.({ position: "topright" }).addTo(map);

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, attribution: "&copy; Esri · World Imagery" },
    ).addTo(map);
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png",
      { maxZoom: 19, subdomains: "abcd", opacity: 0.85 },
    ).addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || typeof L?.layerGroup !== "function") return;
    const group = L.layerGroup().addTo(map);

    for (const z of zonas) {
      const ll = zonaCoords(z.nombre);
      if (!ll) continue;
      const c = zonaHex(z.estado);
      const size = 26 + Math.min(z.count, 16) * 1.4;
      const fs = size > 34 ? 14 : 12;
      L.circle(ll, {
        radius: 300 + z.count * 90,
        color: c,
        weight: 1.5,
        fillColor: c,
        fillOpacity: 0.18,
      }).addTo(group);
      const icon = L.divIcon({
        className: "",
        html:
          `<div style="width:${size}px;height:${size}px;border-radius:50%;` +
          `background:color-mix(in srgb, ${c} 90%, transparent);` +
          `border:2.5px solid rgba(255,255,255,.92);box-shadow:0 3px 10px rgba(0,0,0,.55);display:flex;` +
          `align-items:center;justify-content:center;color:rgb(255,255,255);font:700 ${fs}px Inter,sans-serif">${z.count}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      L.marker(ll, { icon })
        .addTo(group)
        .bindTooltip(`${z.nombre} · ${z.count} incidencias`, {
          direction: "top",
          offset: [0, -size / 2 - 4],
        });
    }
    setTimeout(() => map.invalidateSize?.(), 160);
    return () => {
      group.remove();
    };
  }, [zonas]);

  return (
    <section className="overflow-hidden rounded-card border border-border bg-surface shadow-elevation">
      <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-[18px] py-[15px]">
        <span
          aria-hidden="true"
          className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-brand-chip text-[13px] text-brand"
        >
          ▦
        </span>
        <h2 className="text-[15px] font-semibold tracking-[-.01em] text-text-primary">
          Control de Zonas — La Guaira
        </h2>
        <span className="text-caption text-text-muted">
          Capa satelital · incidencias activas por zona
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          {ZONA_LEGEND.map((l) => (
            <span
              key={l.label}
              className="inline-flex items-center gap-[6px] rounded-pill border border-border-subtle bg-bg px-[9px] py-1 text-[11px] font-semibold text-text-secondary"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: zonaHex(l.estado) }}
              />
              {l.label}
            </span>
          ))}
        </div>
      </div>
      <div className="relative">
        <div
          ref={nodeRef}
          role="application"
          aria-label="Mapa de incidencias por zona"
          className="as-map h-[380px] w-full bg-map"
        />
        <div
          data-testid="zonas-overlay"
          className="absolute bottom-4 left-4 z-[500] flex max-h-[178px] min-w-[160px] flex-col gap-1 overflow-y-auto rounded-[10px] border border-border bg-surface-glass px-[10px] py-2 shadow-elevation backdrop-blur"
        >
          Incidencias por zona
          {zonas.map((z) => (
            <div key={z.nombre} className="flex items-center gap-2">
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ background: zonaHex(z.estado) }}
              />
              <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-text-primary">
                {z.nombre}
              </span>
              <span
                className="text-[11px] font-bold"
                style={{ color: zonaHex(z.estado) }}
              >
                {z.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

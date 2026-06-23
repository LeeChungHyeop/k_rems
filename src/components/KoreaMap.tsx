import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, CircleMarker, Tooltip, GeoJSON } from 'react-leaflet';
import type { FeatureCollection } from 'geojson';
import 'leaflet/dist/leaflet.css';
import { PLANTS, ENERGY_COLOR_VAR, ENERGY_LABEL, type Plant } from '@/data/mockData';

type MapView = 'inland' | 'jeju';

const VIEW_CONFIG: Record<MapView, { center: [number, number]; zoom: number; minZoom: number }> = {
  inland: { center: [36.5, 127.8], zoom: 7, minZoom: 6 },
  jeju: { center: [33.38, 126.55], zoom: 9, minZoom: 8 },
};

export function KoreaMap({
  height = 520,
  plants = PLANTS,
  onPlantClick,
  showLegend = true,
}: { height?: number; plants?: Plant[]; onPlantClick?: (p: Plant) => void; showLegend?: boolean }) {
  const [view, setView] = useState<MapView>('inland');
  const navigate = useNavigate();
  const [provinces, setProvinces] = useState<FeatureCollection | null>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    fetch('./skorea-provinces.json')
      .then((r) => r.json())
      .then((d) => { if (alive) setProvinces(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const handleClick = (p: Plant) => {
    if (onPlantClick) onPlantClick(p);
    else navigate(`/plant/${p.id}`);
  };


  const markers = useMemo(() => {
    const valid = plants.filter((p) => typeof p.lat === 'number' && typeof p.lon === 'number');
    const isJeju = (p: Plant) => p.lat < 34 && p.lon > 125.5 && p.lon < 127.5;
    return view === 'jeju' ? valid.filter(isJeju) : valid.filter((p) => !isJeju(p));
  }, [plants, view]);

  const cfg = VIEW_CONFIG[view];

  return (
    <div className="relative w-full overflow-hidden rounded-md border flex flex-col" style={{ height }}>
      <div className="flex border-b bg-card" style={{ height: 36 }}>
        {(['inland', 'jeju'] as MapView[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`flex-1 text-xs font-medium transition-colors ${
              view === v
                ? 'bg-primary/10 text-primary border-b-2 border-primary -mb-px'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {v === 'inland' ? '내륙' : '제주'}
          </button>
        ))}
      </div>

      <div className="relative flex-1 min-h-0">
        <MapContainer
          key={`${view}-${isDark}`}
          center={cfg.center}
          zoom={cfg.zoom}
          minZoom={cfg.minZoom}
          maxZoom={14}
          scrollWheelZoom
          style={{ height: '100%', width: '100%', background: isDark ? 'hsl(220 20% 10%)' : 'hsl(0 0% 99%)' }}
        >
          {provinces && (
            <GeoJSON
              data={provinces}
              style={{
                color: isDark ? 'hsl(220 20% 40%)' : 'hsl(220 20% 45%)',
                weight: 1,
                opacity: 0.8,
                fillColor: isDark ? 'hsl(220 20% 15%)' : 'transparent',
                fillOpacity: isDark ? 1 : 0,
                interactive: false,
              } as any}
              // @ts-ignore — react-leaflet 패스스루
              interactive={false}
            />
          )}

          {markers.map((p) => {
            const color = ENERGY_COLOR_VAR[p.type];
            const isFault = p.status === 'fault' || p.comm === 'down';
            const r = Math.max(5, Math.min(14, Math.sqrt(p.capacityMW) * 1.2));
            return (
              <CircleMarker
                key={p.id}
                center={[p.lat, p.lon]}
                radius={r}
                pathOptions={{
                  color: isFault ? 'hsl(0 70% 50%)' : 'white',
                  weight: 2,
                  fillColor: color,
                  fillOpacity: 0.85,
                }}
                eventHandlers={{ click: () => handleClick(p) }}
              >
                <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                  <div className="text-xs">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-muted-foreground">{p.region} · {ENERGY_LABEL[p.type]}</div>
                    <div>{p.capacityMW} MW · 클릭하여 상세보기</div>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {showLegend && (
          <div className="absolute bottom-2 right-2 z-[400] bg-card/95 border rounded-md shadow-sm p-2 text-[10px] space-y-1">
            {(Object.keys(ENERGY_LABEL) as (keyof typeof ENERGY_LABEL)[]).map((k) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: ENERGY_COLOR_VAR[k] }} />
                <span>{ENERGY_LABEL[k]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


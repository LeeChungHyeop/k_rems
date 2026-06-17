import { useNavigate } from 'react-router-dom';
import { Building2, Users, MapPin, ArrowRight } from 'lucide-react';
import { PLANT_GROUPS, PLANTS, ENERGY_LABEL, ENERGY_COLOR_VAR, getCurrentOutput, getPlantDailyEnergy } from '@/data/mockData';

const TYPE_LABEL = { spc: 'SPC', region: '지역', manager: '담당자' } as const;
const TYPE_ICON = { spc: Building2, region: MapPin, manager: Users };

export default function SiteDashboards() {
  const navigate = useNavigate();

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold">사업소 대시보드</h1>
        <p className="text-xs text-muted-foreground mt-1">
          그룹(SPC/지역/담당자) 또는 개별 발전소를 선택하면, 통합 대시보드 형식으로 해당 범위만 필터링하여 조회할 수 있습니다.
        </p>
      </div>

      {/* 그룹별 진입 카드 */}
      <section className="mb-7">
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> 그룹별 대시보드
          <span className="text-xs text-muted-foreground font-normal">({PLANT_GROUPS.length}개)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PLANT_GROUPS.map(g => {
            const Icon = TYPE_ICON[g.type];
            const plants = PLANTS.filter(p => g.plantIds.includes(p.id));
            const cap = plants.reduce((s, p) => s + p.capacityMW, 0);
            const cur = plants.reduce((s, p) => s + getCurrentOutput(p), 0);
            return (
              <button key={g.id} onClick={() => navigate(`/?group=${g.id}`)}
                className="group text-left panel hover:border-primary hover:shadow-[var(--shadow-elevated)] transition-all p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{TYPE_LABEL[g.type]}</div>
                      <div className="font-semibold text-sm">{g.name}</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                {g.description && <div className="text-xs text-muted-foreground mb-3 line-clamp-1">{g.description}</div>}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <Stat label="발전소" value={`${plants.length}`} />
                  <Stat label="설비(MW)" value={cap.toFixed(1)} />
                  <Stat label="현재(MW)" value={cur.toFixed(1)} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 발전소별 진입 */}
      <section>
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> 발전소별 대시보드
          <span className="text-xs text-muted-foreground font-normal">({PLANTS.length}개소)</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {PLANTS.map(p => {
            const today = getPlantDailyEnergy(p);
            return (
              <button key={p.id} onClick={() => navigate(`/?plant=${p.id}`)}
                className="text-left panel p-3 hover:border-primary hover:shadow-[var(--shadow-elevated)] transition-all">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: ENERGY_COLOR_VAR[p.type] }} />
                  <span className="text-[10px] text-muted-foreground">{ENERGY_LABEL[p.type]}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{p.id}</span>
                </div>
                <div className="text-xs font-semibold mb-1 truncate">{p.name}</div>
                <div className="text-[10px] text-muted-foreground mb-2 truncate">{p.region}</div>
                <div className="flex justify-between text-[11px] tabular-nums">
                  <span className="text-muted-foreground">{p.capacityMW.toFixed(1)}MW</span>
                  <span className="font-semibold">{today.toFixed(1)}MWh</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 px-2 py-1.5">
      <div className="text-[9px] text-muted-foreground">{label}</div>
      <div className="font-bold tabular-nums text-foreground">{value}</div>
    </div>
  );
}

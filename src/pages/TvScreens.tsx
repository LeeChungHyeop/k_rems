import { useEffect, useMemo, useState } from 'react';
import { TvShell, TvPanel } from '@/components/tv/TvShell';
import { KoreaMap } from '@/components/KoreaMap';
import {
  PLANTS, ENERGY_LABEL, ENERGY_COLOR_VAR,
  getCurrentOutput, getPlantDailyEnergy, getMonthlyEnergyByType, PRICE,
} from '@/data/mockData';

function fmt(n: number, d = 0) {
  return n.toLocaleString('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d });
}

const ENERGY_KEYS = ['solar', 'wind', 'fuelcell', 'hydro', 'ess'] as const;

// 권역 매핑 (region 문자열 prefix 기반)
function regionGroup(region: string): '강원·경기' | '충청' | '경상' | '전라' | '제주' | '서울·인천' {
  if (region.startsWith('제주')) return '제주';
  if (region.startsWith('강원') || region.startsWith('경기')) return '강원·경기';
  if (region.startsWith('충')) return '충청';
  if (region.startsWith('경') || region.startsWith('부산') || region.startsWith('대구') || region.startsWith('울산')) return '경상';
  if (region.startsWith('전') || region.startsWith('광주')) return '전라';
  return '서울·인천';
}

// ============================================================
// TV-1 종합 발전정보 (신재생설비 종합발전정보)
// ============================================================
// 랜덤색상 (재현가능하게 시드)
const REGION_COLORS = ['hsl(340 80% 60%)', 'hsl(160 70% 55%)', 'hsl(45 95% 60%)', 'hsl(265 70% 65%)', 'hsl(20 85% 60%)'];

function GeneralContent() {
  const totalCap = PLANTS.reduce((s, p) => s + p.capacityMW, 0);
  const monthly = useMemo(() => getMonthlyEnergyByType(), []);
  const ytd = monthly.reduce((s, m) => s + m.solar + m.wind + m.hydro + m.fuelcell + m.ess, 0);
  const now = new Date();
  const prevIdx = (now.getMonth() + 11) % 12;
  const prevM = monthly[prevIdx];
  const prevTotal = prevM ? prevM.solar + prevM.wind + prevM.hydro + prevM.fuelcell + prevM.ess : 0;
  const prevRevenue = Math.round(prevTotal * 1000 * (PRICE.SMP + PRICE.REC) / 1_000_000);

  const byEnergy = ENERGY_KEYS.map(k => ({
    key: k,
    label: ENERGY_LABEL[k],
    count: PLANTS.filter(p => p.type === k).length,
    cap: PLANTS.filter(p => p.type === k).reduce((s, p) => s + p.capacityMW, 0),
  }));

  const regions = ['강원·경기', '충청', '경상', '전라', '제주'] as const;
  const byRegion = regions.map(r => {
    const ps = PLANTS.filter(p => regionGroup(p.region) === r);
    return { name: r, count: ps.length, cap: ps.reduce((s, p) => s + p.capacityMW, 0) };
  });

  const ownCap = PLANTS.filter(p => !['SOL-01', 'WND-07', 'ESS-01', 'ESS-02'].includes(p.id))
    .reduce((s, p) => s + p.capacityMW, 0);
  const spcCap = totalCap - ownCap;

  // 5초마다 강조 전환: 0..4 = 에너지원, 5..9 = 권역
  const [cyc, setCyc] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCyc(i => (i + 1) % (ENERGY_KEYS.length + regions.length)), 5000);
    return () => clearInterval(t);
  }, []);
  const isEnergyPhase = cyc < ENERGY_KEYS.length;
  const activeEnergy = isEnergyPhase ? ENERGY_KEYS[cyc] : null;
  const activeRegion = !isEnergyPhase ? regions[cyc - ENERGY_KEYS.length] : null;
  const filteredPlants = useMemo(() => {
    if (activeEnergy) return PLANTS.filter(p => p.type === activeEnergy);
    if (activeRegion) return PLANTS.filter(p => regionGroup(p.region) === activeRegion);
    return PLANTS;
  }, [activeEnergy, activeRegion]);

  return (
    <div className="grid grid-cols-12 gap-3 h-[calc(100vh-7rem)]">
      {/* 좌측 KPI 컬럼 */}
      <div className="col-span-12 lg:col-span-3 flex flex-col gap-2">
        <KpiBig label="총 설비 용량" value={fmt(totalCap, 0)} unit="MW" />
        <div className="grid grid-cols-3 gap-2">
          <KpiSmall label="자체설비" value={fmt(ownCap, 1)} unit="MW" />
          <KpiSmall label="SPC" value={fmt(spcCap, 1)} unit="MW" />
          <KpiSmall label="ESS/저장" value={fmt(PLANTS.filter(p => p.type === 'ess').reduce((s, p) => s + p.capacityMW, 0), 1)} unit="MW" />
        </div>
        <KpiBig label="금년누적 발전량" value={fmt(ytd, 0)} unit="MWh" />
        <KpiBig label="전월누적 발전량" value={fmt(prevTotal, 0)} unit="MWh" />
        <KpiBig label="전년동월 발전량" value={fmt(prevTotal * 0.93, 0)} unit="MWh" />
        <KpiBig label="전월 수익" value={fmt(prevRevenue, 0)} unit="백만원" accent />
      </div>

      {/* 가운데: 에너지원별 용량 */}
      <div className="col-span-12 lg:col-span-3 min-h-0">
        <TvPanel title="에너지원별 용량" className="h-full">
          <div className="flex flex-col gap-2 h-full">
            {byEnergy.map(e => {
              const active = activeEnergy === e.key;
              const color = ENERGY_COLOR_VAR[e.key];
              return (
                <div key={e.key}
                  className="rounded-md bg-white/5 px-3 py-2 flex-1 flex flex-col justify-center transition-all duration-500"
                  style={{
                    border: active ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: active ? `0 0 16px ${color}` : 'none',
                  }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: color }} />
                      <span className="text-base font-semibold text-white/95">{e.label}</span>
                    </div>
                    <span className="text-2xl font-bold text-[hsl(197_100%_70%)] tabular-nums">{e.count}<span className="text-xs text-white/60 ml-1">개소</span></span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-[11px] text-white/50">설비용량</span>
                    <span className="text-lg font-semibold tabular-nums">{fmt(e.cap, 2)} <span className="text-xs text-white/60">MW</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </TvPanel>
      </div>

      {/* 지도 */}
      <div className="col-span-12 lg:col-span-3 min-h-0">
        <TvPanel
          title={`전국 발전소 분포 · ${activeEnergy ? ENERGY_LABEL[activeEnergy] : activeRegion ?? '전체'} (${filteredPlants.length})`}
          className="h-full">
          <div className="h-full">
            <KoreaMap height={520} plants={filteredPlants} showLegend={false} />
          </div>
        </TvPanel>
      </div>

      {/* 권역별 */}
      <div className="col-span-12 lg:col-span-3 min-h-0">
        <TvPanel title="권역별 용량" className="h-full">
          <div className="flex flex-col gap-2 h-full">
            {byRegion.map((r, i) => {
              const active = activeRegion === r.name;
              const color = REGION_COLORS[i % REGION_COLORS.length];
              return (
                <div key={r.name}
                  className="rounded-md bg-white/5 px-3 py-2 flex-1 flex flex-col justify-center transition-all duration-500"
                  style={{
                    border: active ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: active ? `0 0 16px ${color}` : 'none',
                  }}>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-white/95">{r.name}</span>
                    <span className="text-2xl font-bold text-[hsl(197_100%_70%)] tabular-nums">{r.count}<span className="text-xs text-white/60 ml-1">개소</span></span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-[11px] text-white/50">설비용량</span>
                    <span className="text-lg font-semibold tabular-nums">{fmt(r.cap, 2)} <span className="text-xs text-white/60">MW</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </TvPanel>
      </div>
    </div>
  );
}

function KpiBig({ label, value, unit, accent }: { label: string; value: string; unit: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border ${accent ? 'border-[hsl(45_100%_60%)]/40' : 'border-white/10'} bg-gradient-to-br from-[hsl(212_80%_12%)] to-[hsl(210_100%_18%)] px-4 py-3 flex-1`}>
      <div className="text-[11px] text-white/60">{label}</div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className={`text-3xl xl:text-4xl font-bold tabular-nums ${accent ? 'text-[hsl(45_100%_70%)]' : 'text-white'}`}>{value}</span>
        <span className="text-xs text-white/60">{unit}</span>
      </div>
    </div>
  );
}
function KpiSmall({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5">
      <div className="text-[9px] text-white/50">{label}</div>
      <div className="text-sm font-bold tabular-nums text-white/95">{value}<span className="text-[9px] text-white/50 ml-0.5">{unit}</span></div>
    </div>
  );
}

// ============================================================
// TV-2 자체설비 / SPC 발전정보
// ============================================================
function OwnContent() {
  // SPC 발전소: 새만금/서남해/제주 SPC 등으로 가정
  const spcIds = new Set(['SOL-01', 'SOL-02', 'WND-07', 'WND-01', 'ESS-01', 'ESS-02', 'FCL-02', 'FCL-04']);
  const ownPlants = PLANTS.filter(p => !spcIds.has(p.id));
  const spcPlants = PLANTS.filter(p => spcIds.has(p.id));

  const monthly = getMonthlyEnergyByType();
  const now = new Date();
  const prev = monthly[(now.getMonth() + 11) % 12];
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const prevMonth = ((now.getMonth() + 11) % 12) + 1;

  const buildPanel = (title: string, plants: typeof PLANTS) => {
    const totals = ENERGY_KEYS.reduce((acc, k) => {
      const ps = plants.filter(p => p.type === k);
      const cap = ps.reduce((s, p) => s + p.capacityMW, 0);
      const totalCap = PLANTS.filter(p => p.type === k).reduce((s, p) => s + p.capacityMW, 0);
      const energy = totalCap > 0 ? prev[k] * (cap / totalCap) : 0;
      acc[k] = { cap, energy, count: ps.length };
      return acc;
    }, {} as Record<string, { cap: number; energy: number; count: number }>);
    const totalEnergy = Object.values(totals).reduce((s, v) => s + v.energy, 0);
    const totalCap = plants.reduce((s, p) => s + p.capacityMW, 0);
    const totalRevenue = Math.round(totalEnergy * 1000 * (PRICE.SMP + PRICE.REC) / 1_000_000);

    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6 flex flex-col h-full">
        <h3 className="text-2xl font-bold text-white mb-4 pb-3 border-b border-white/10">{title}</h3>
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-sm text-white/70">전월({prevYear}년 {prevMonth}월) 발전량 합계</span>
          <span className="text-5xl font-bold tabular-nums text-white">{fmt(totalEnergy, 0)}<span className="text-base text-white/60 ml-2">MWh</span></span>
        </div>

        {/* 누적 bar */}
        <div className="h-10 w-full rounded-md overflow-hidden flex border border-white/10 mb-3">
          {ENERGY_KEYS.map(k => {
            const w = totalEnergy > 0 ? (totals[k].energy / totalEnergy) * 100 : 0;
            if (w < 0.5) return null;
            return (
              <div key={k} style={{ width: `${w}%`, background: ENERGY_COLOR_VAR[k] }}
                className="flex items-center justify-center text-xs font-semibold text-white/95 truncate px-1">
                {w > 12 ? `${ENERGY_LABEL[k]} ${fmt(totals[k].energy, 0)}` : ''}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs mb-5">
          {ENERGY_KEYS.map(k => (
            <div key={k} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: ENERGY_COLOR_VAR[k] }} />
              <span className="text-white/70">{ENERGY_LABEL[k]} <span className="tabular-nums text-white/95 font-semibold">{fmt(totals[k].energy, 0)}</span> MWh</span>
            </div>
          ))}
        </div>

        {/* KPI 4 */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <MiniKpi l="총 사업소" v={`${plants.length}`} u="개소" />
          <MiniKpi l="총 설비" v={`${plants.length * 8}`} u="대" />
          <MiniKpi l="용량" v={fmt(totalCap, 1)} u="MW" />
          <MiniKpi l="전월 수익" v={fmt(totalRevenue, 0)} u="백만원" accent />
        </div>

        <div className="text-sm font-semibold text-white/85 mb-2">에너지원별 설비용량</div>
        <div className="grid grid-cols-3 gap-2 flex-1">
          {ENERGY_KEYS.filter(k => totals[k].count > 0).map(k => (
            <div key={k} className="rounded-md border border-white/10 bg-white/5 px-3 py-2.5 flex flex-col justify-center">
              <div className="text-xs text-white/65 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: ENERGY_COLOR_VAR[k] }} />
                {ENERGY_LABEL[k]} ({totals[k].count}개소)
              </div>
              <div className="text-xl font-bold tabular-nums text-white mt-1">
                {fmt(totals[k].cap, 2)}<span className="text-xs text-white/60 ml-1">MW</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-4 h-[calc(100vh-7rem)]">
      {buildPanel('자체설비 발전정보', ownPlants)}
      {buildPanel('출자회사(SPC) 발전정보', spcPlants)}
    </div>
  );
}

function MiniKpi({ l, v, u, accent }: { l: string; v: string; u: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2.5">
      <div className="text-xs text-white/65">{l}</div>
      <div className={`text-2xl font-bold tabular-nums ${accent ? 'text-[hsl(45_100%_70%)]' : 'text-white'}`}>
        {v}<span className="text-xs text-white/60 ml-1">{u}</span>
      </div>
    </div>
  );
}

// ============================================================
// TV-3 출력 현황 정보 (KHNP 신재생출력현황정보)
// ============================================================
function OutputContent() {
  const totalCap = PLANTS.reduce((s, p) => s + p.capacityMW, 0);
  const totalOut = PLANTS.reduce((s, p) => s + getCurrentOutput(p), 0);
  const util = (totalOut / totalCap) * 100;
  // CO2 저감(누적): 가상치
  const co2 = 1_227_646.974;

  const spcIds = new Set(['SOL-01', 'SOL-02', 'WND-07', 'WND-01', 'ESS-01', 'ESS-02', 'FCL-02', 'FCL-04']);
  const own = PLANTS.filter(p => !spcIds.has(p.id));
  const spc = PLANTS.filter(p => spcIds.has(p.id));

  const PlantCard = ({ p }: { p: typeof PLANTS[number] }) => {
    const cur = getCurrentOutput(p);
    const today = getPlantDailyEnergy(p);
    const status = p.status === 'fault' ? 'fault' : p.status === 'maintenance' ? 'maint' : 'normal';
    const dot = status === 'normal' ? 'bg-emerald-400' : status === 'fault' ? 'bg-rose-400' : 'bg-amber-400';
    const temp = 12 + Math.round((p.id.charCodeAt(p.id.length - 1) % 13));
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${dot}`} />
            <span className="text-base font-semibold text-white truncate">{p.name}</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded text-white font-semibold" style={{ background: ENERGY_COLOR_VAR[p.type] }}>
            {ENERGY_LABEL[p.type]}
          </span>
        </div>
        <div className="text-xs text-white/55 mb-2">☀ {temp}℃ · {p.region}</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-white/55">설비용량</div>
            <div className="text-white font-bold tabular-nums text-base">{p.capacityMW}<span className="text-[10px] text-white/55 ml-0.5">MW</span></div>
          </div>
          <div>
            <div className="text-white/55">현재출력</div>
            <div className="text-[hsl(197_100%_70%)] font-bold tabular-nums text-base">{fmt(cur, 2)}<span className="text-[10px] text-white/55 ml-0.5">MW</span></div>
          </div>
          <div>
            <div className="text-white/55">금일발전량</div>
            <div className="text-white font-bold tabular-nums text-base">{fmt(today, 0)}<span className="text-[10px] text-white/55 ml-0.5">MWh</span></div>
          </div>
        </div>
      </div>
    );
  };

  // 5초 간격 페이지 회전 (자체설비 12개씩 × 3페이지, SPC 별도)
  const OWN_PER_PAGE = 12;
  const SPC_PER_PAGE = 6;
  const ownPages = Math.max(1, Math.ceil(own.length / OWN_PER_PAGE));
  const spcPages = Math.max(1, Math.ceil(spc.length / SPC_PER_PAGE));
  const totalPages = Math.max(ownPages, spcPages, 3);
  const [pageIdx, setPageIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPageIdx(i => (i + 1) % totalPages), 5000);
    return () => clearInterval(t);
  }, [totalPages]);
  const ownSlice = own.slice((pageIdx % ownPages) * OWN_PER_PAGE, (pageIdx % ownPages) * OWN_PER_PAGE + OWN_PER_PAGE);
  const spcSlice = spc.slice((pageIdx % spcPages) * SPC_PER_PAGE, (pageIdx % spcPages) * SPC_PER_PAGE + SPC_PER_PAGE);

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-7rem)]">
      {/* 상단 KPI 바 */}
      <div className="grid grid-cols-4 gap-3 rounded-lg border border-white/10 bg-gradient-to-r from-[hsl(212_80%_12%)] to-[hsl(210_100%_18%)] p-4 shrink-0">
        {[
          { l: '설비용량', v: fmt(totalCap, 3), u: 'MW' },
          { l: '종합출력', v: fmt(totalOut, 0), u: 'MW' },
          { l: '이용률', v: fmt(util, 3), u: '%' },
          { l: 'CO2 저감량', v: fmt(co2, 3), u: 'tCO₂' },
        ].map((k, i) => (
          <div key={i} className="text-center">
            <div className="text-xs text-white/60 mb-1">{k.l}</div>
            <div className="text-3xl font-bold tabular-nums text-white">
              {k.v}<span className="text-sm text-white/60 ml-1">{k.u}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 본문: 자체설비 + SPC */}
      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
        <div className="col-span-9 rounded-lg border border-white/10 bg-white/[0.02] p-4 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h3 className="text-base font-semibold text-white">자체설비 ({own.length})</h3>
            <div className="flex items-center gap-3 text-xs text-white/70">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" />정상</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" />수기관리</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" />비정상</span>
              <span className="ml-2 text-white/55">페이지 {(pageIdx % ownPages) + 1}/{ownPages}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 grid-rows-4 gap-3 flex-1 min-h-0 overflow-hidden">
            {ownSlice.map(p => <PlantCard key={p.id} p={p} />)}
          </div>
        </div>
        <div className="col-span-3 rounded-lg border border-white/10 bg-white/[0.02] p-4 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h3 className="text-base font-semibold text-white">SPC ({spc.length})</h3>
            <span className="text-xs text-white/55">{(pageIdx % spcPages) + 1}/{spcPages}</span>
          </div>
          <div className="grid grid-cols-1 grid-rows-6 gap-2 flex-1 min-h-0 overflow-hidden">
            {spcSlice.map(p => <PlantCard key={p.id} p={p} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 단일 페이지 노출 (사이드바에서 진입)
// ============================================================
export function TvGeneral() {
  return <TvShell title="신재생설비 종합발전정보"><GeneralContent /></TvShell>;
}
export function TvOwn() {
  return <TvShell title="자체/SPC 정보"><OwnContent /></TvShell>;
}
export function TvOutput() {
  return <TvShell title="KHNP 신재생출력현황정보"><OutputContent /></TvShell>;
}

// ============================================================
// TV-통합 대시보드: 위 3개 화면을 자동 순환 (처장실 모니터용)
// ============================================================
const ROTATION = [
  { title: '신재생설비 종합발전정보', Comp: GeneralContent },
  { title: '자체/SPC 정보', Comp: OwnContent },
  { title: 'KHNP 신재생출력현황정보', Comp: OutputContent },
];
const ROTATE_MS = 15_000;

export function TvMain() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx(i => (i + 1) % ROTATION.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [paused]);

  const Current = ROTATION[idx].Comp;
  const title = ROTATION[idx].title;

  return (
    <TvShell title={`통합 대시보드 · ${title}`}>
      {/* 순환 인디케이터 */}
      <div className="absolute right-6 top-16 z-20 flex items-center gap-2 bg-black/40 backdrop-blur rounded-full px-3 py-1.5 border border-white/10">
        {ROTATION.map((_, i) => (
          <button key={i} onClick={() => { setIdx(i); setPaused(true); setTimeout(() => setPaused(false), 30_000); }}
            className={`h-2 rounded-full transition-all ${i === idx ? 'w-8 bg-[hsl(197_100%_60%)]' : 'w-2 bg-white/30 hover:bg-white/60'}`}
            title={ROTATION[i].title} />
        ))}
        <button onClick={() => setPaused(p => !p)} className="ml-2 text-[10px] text-white/70 hover:text-white">
          {paused ? '▶ 재생' : '⏸ 일시정지'}
        </button>
      </div>
      <Current />
    </TvShell>
  );
}

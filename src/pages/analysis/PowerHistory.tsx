import { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line, ComposedChart } from 'recharts';
import {
  getPlantHistory, getDevicesForPlant, getDeviceTimeSeries, DEVICE_LABEL,
  PERIOD_LABEL, ENERGY_LABEL, type Period, type DeviceType, type EnergyType, PLANTS,
} from '@/data/mockData';
import { useScope } from '@/components/ScopeContext';
import { plantsForScope } from '@/components/ScopeFilter';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Download, ChevronDown, Search, RotateCcw, Play, Loader2 } from 'lucide-react';

type Scope = 'plant' | 'device';
type PlantMetric = 'energy' | 'sales' | 'utilization' | 'irradiance';

const METRIC_LABEL: Record<PlantMetric, string> = {
  energy: '발전량 (MWh)', sales: '매전량 (MWh)', utilization: '이용률 (%)', irradiance: '일사량 (W/㎡)',
};
const METRIC_COLOR: Record<PlantMetric, string> = {
  energy: 'hsl(var(--secondary))',
  sales: 'hsl(var(--accent))',
  utilization: 'hsl(var(--primary))',
  irradiance: 'hsl(var(--warning))',
};

interface FormState {
  energyType: 'ALL' | EnergyType;
  plantIds: string[];          // 빈 배열이면 후보 전체
  startDate: string;
  endDate: string;
  period: Period;
  scope: Scope;
  metrics: PlantMetric[];
  deviceType: DeviceType;
  deviceIds: string[];         // 빈 배열이면 (선택된 발전소의) 해당 타입 전체
}

function defaultForm(): FormState {
  const end = new Date();
  const start = new Date(); start.setDate(end.getDate() - 7);
  return {
    energyType: 'ALL', plantIds: [],
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    period: '1h',
    scope: 'plant',
    metrics: ['energy'],
    deviceType: 'inverter',
    deviceIds: [],
  };
}

function fmtTs(ts: string, period: string) {
  const d = new Date(ts);
  if (period === '15min' || period === '1h') return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (period === '1d') return `${d.getMonth() + 1}/${d.getDate()}`;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function exportCSV(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function PowerHistory() {
  const { scope: globalScope } = useScope();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [query, setQuery] = useState<FormState | null>(null);
  const [running, setRunning] = useState(false);
  const [plantKw, setPlantKw] = useState('');
  const [deviceKw, setDeviceKw] = useState('');

  // 최상단 글로벌 구분 → 발전소 풀
  const scopedPlants = useMemo(() => plantsForScope(globalScope), [globalScope]);

  // 발전원 적용
  const energyFilteredPlants = useMemo(
    () => form.energyType === 'ALL' ? scopedPlants : scopedPlants.filter(p => p.type === form.energyType),
    [scopedPlants, form.energyType]
  );

  const filteredPlantOptions = useMemo(
    () => plantKw ? energyFilteredPlants.filter(p => p.name.toLowerCase().includes(plantKw.toLowerCase())) : energyFilteredPlants,
    [energyFilteredPlants, plantKw]
  );

  // 글로벌 스코프 / 발전원이 바뀌면 plantIds 중 유효하지 않은 것 제거
  const validIds = useMemo(() => new Set(energyFilteredPlants.map(p => p.id)), [energyFilteredPlants]);
  const safePlantIds = form.plantIds.filter(id => validIds.has(id));

  // 선택된(또는 후보) 발전소들
  const targetPlants = useMemo(() => {
    if (!safePlantIds.length) return energyFilteredPlants;
    const set = new Set(safePlantIds);
    return energyFilteredPlants.filter(p => set.has(p.id));
  }, [energyFilteredPlants, safePlantIds]);

  // 설비 후보 (설비 수준일 때 첫 번째 대상 발전소 기준)
  const deviceCandidates = useMemo(() => {
    const tp = targetPlants[0];
    if (!tp) return [];
    return getDevicesForPlant(tp.id).filter(d => d.type === form.deviceType);
  }, [targetPlants, form.deviceType]);

  const filteredDeviceOptions = useMemo(
    () => deviceKw ? deviceCandidates.filter(d => d.name.toLowerCase().includes(deviceKw.toLowerCase())) : deviceCandidates,
    [deviceCandidates, deviceKw]
  );

  // ============ 조회 결과 계산 (query가 commit 됐을 때만) ============
  const days = query ? Math.max(1, Math.ceil((new Date(query.endDate).getTime() - new Date(query.startDate).getTime()) / 86_400_000)) : 0;

  const plantSeries = useMemo(() => {
    if (!query || query.scope !== 'plant') return [];
    const qPlants = (() => {
      const pool = query.energyType === 'ALL' ? scopedPlants : scopedPlants.filter(p => p.type === query.energyType);
      if (!query.plantIds.length) return pool;
      const set = new Set(query.plantIds);
      return pool.filter(p => set.has(p.id));
    })();
    if (!qPlants.length) return [];
    const sample = getPlantHistory(qPlants[0], days, query.period);
    return sample.map((_, idx) => {
      let energy = 0, sales = 0, util = 0, irr = 0;
      qPlants.forEach(p => {
        const h = getPlantHistory(p, days, query.period);
        energy += h[idx]?.energy ?? 0;
        sales += h[idx]?.sales ?? 0;
        util += h[idx]?.utilization ?? 0;
        irr += h[idx]?.irradiance ?? 0;
      });
      return {
        ts: sample[idx].ts,
        energy: +energy.toFixed(2),
        sales: +sales.toFixed(2),
        utilization: +(util / qPlants.length).toFixed(1),
        irradiance: +(irr / qPlants.length).toFixed(1),
      };
    });
  }, [query, scopedPlants, days]);

  const deviceSeries = useMemo(() => {
    if (!query || query.scope !== 'device') return [];
    const tp = (() => {
      const pool = query.energyType === 'ALL' ? scopedPlants : scopedPlants.filter(p => p.type === query.energyType);
      if (!query.plantIds.length) return pool[0];
      return pool.find(p => query.plantIds.includes(p.id));
    })();
    if (!tp) return [];
    const all = getDevicesForPlant(tp.id).filter(d => d.type === query.deviceType);
    const sel = query.deviceIds.length ? all.filter(d => query.deviceIds.includes(d.id)) : all;
    const devices = sel.slice(0, 8);
    if (!devices.length) return [];
    const hours = Math.min(days * 24, 168);
    const intervalMin = query.period === '15min' ? 15 : query.period === '1h' ? 60 : query.period === '1d' ? 1440 : 43200;
    const sample = getDeviceTimeSeries(devices[0].id, hours, intervalMin as any);
    return sample.map((p, idx) => {
      const row: any = { ts: p.ts };
      devices.forEach(d => {
        const s = getDeviceTimeSeries(d.id, hours, intervalMin as any);
        row[d.name] = s[idx]?.value ?? 0;
      });
      return row;
    });
  }, [query, scopedPlants, days]);

  // ============ Handlers ============
  const setF = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(prev => ({ ...prev, [k]: v }));

  const runQuery = () => {
    setRunning(true);
    // 데이터 꼬임 방지: 다음 tick에서 commit
    setTimeout(() => {
      setQuery({ ...form, plantIds: safePlantIds });
      setRunning(false);
    }, 30);
  };

  const togglePlantId = (id: string) => {
    setF('plantIds', form.plantIds.includes(id) ? form.plantIds.filter(x => x !== id) : [...form.plantIds, id]);
  };
  const toggleMetric = (m: PlantMetric) => {
    setF('metrics', form.metrics.includes(m) ? form.metrics.filter(x => x !== m) : [...form.metrics, m]);
  };
  const toggleDeviceId = (id: string) => {
    setF('deviceIds', form.deviceIds.includes(id) ? form.deviceIds.filter(x => x !== id) : [...form.deviceIds, id]);
  };

  const plantSummary = safePlantIds.length === 0
    ? `전체 (${energyFilteredPlants.length}개소)`
    : `${safePlantIds.length}개 선택`;
  const metricSummary = form.metrics.length === 0
    ? '항목 선택 필요'
    : form.metrics.length === 4 ? '전체 (4)' : `${form.metrics.length}개 선택`;
  const deviceSummary = form.deviceIds.length === 0
    ? `전체 (${deviceCandidates.length}개)`
    : `${form.deviceIds.length}개 선택`;

  return (
    <div className="p-4 lg:p-5">
      <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">발전이력</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            최상단 구분에서 선택된 발전소 풀 기준 · 조회 버튼을 눌러야 데이터가 로드됩니다.
          </p>
        </div>
      </div>

      {/* ===== Row 1: 발전원 / 발전소 / 시작일 / 종료일 / 데이터주기 ===== */}
      <div className="panel p-3 mb-3">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <Label className="text-[10px] text-muted-foreground">발전원</Label>
            <Select value={form.energyType} onValueChange={(v) => setF('energyType', v as any)}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 발전원</SelectItem>
                {(['solar', 'wind', 'hydro', 'fuelcell', 'ess'] as EnergyType[]).map(t =>
                  <SelectItem key={t} value={t}>{ENERGY_LABEL[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">발전소 (다중)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 w-full gap-1.5 text-xs justify-between">
                  <span className="truncate">{plantSummary}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[360px] p-0" align="start">
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-2 top-2 text-muted-foreground" />
                    <Input value={plantKw} onChange={(e) => setPlantKw(e.target.value)} placeholder="발전소 검색" className="h-8 pl-7 text-xs" />
                  </div>
                  <div className="flex justify-between mt-2">
                    <Button size="sm" variant="ghost" className="h-7 text-[11px]"
                      onClick={() => setF('plantIds', filteredPlantOptions.map(p => p.id))}>표시된 전체 선택</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1" onClick={() => setF('plantIds', [])}>
                      <RotateCcw className="h-3 w-3" />초기화
                    </Button>
                  </div>
                </div>
                <div className="max-h-[300px] overflow-auto p-2">
                  {filteredPlantOptions.length === 0 ? (
                    <div className="text-center text-xs text-muted-foreground py-6">결과 없음</div>
                  ) : filteredPlantOptions.map(p => (
                    <label key={p.id} className="flex items-center gap-2 text-xs hover:bg-muted/50 px-2 py-1.5 rounded cursor-pointer">
                      <Checkbox checked={safePlantIds.includes(p.id)} onCheckedChange={() => togglePlantId(p.id)} />
                      <span className="truncate">[{ENERGY_LABEL[p.type]}] {p.name}</span>
                    </label>
                  ))}
                </div>
                <div className="p-2 border-t bg-muted/30 text-[11px] text-muted-foreground text-center">
                  선택 안하면 후보 전체 조회
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">시작일</Label>
            <Input type="date" className="h-9 text-xs" value={form.startDate} onChange={(e) => setF('startDate', e.target.value)} />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">종료일</Label>
            <Input type="date" className="h-9 text-xs" value={form.endDate} onChange={(e) => setF('endDate', e.target.value)} />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">데이터 주기</Label>
            <Select value={form.period} onValueChange={(v) => setF('period', v as Period)}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PERIOD_LABEL) as Period[]).map(p => <SelectItem key={p} value={p}>{PERIOD_LABEL[p]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ===== Row 2: 조회 수준 + (수준별 옵션) + 조회 버튼 ===== */}
      <div className="panel p-3 mb-4 flex items-end gap-3 flex-wrap">
        <div>
          <Label className="text-[10px] text-muted-foreground">조회 수준</Label>
          <Tabs value={form.scope} onValueChange={(v) => setF('scope', v as Scope)}>
            <TabsList className="h-9">
              <TabsTrigger value="plant" className="text-xs">발전소 수준</TabsTrigger>
              <TabsTrigger value="device" className="text-xs">설비 수준</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {form.scope === 'plant' && (
          <div>
            <Label className="text-[10px] text-muted-foreground">조회 항목 (다중)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs w-full sm:min-w-[180px] justify-between">
                  <span>{metricSummary}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-2" align="start">
                {(['energy', 'sales', 'utilization', 'irradiance'] as PlantMetric[]).map(m => (
                  <label key={m} className="flex items-center gap-2 text-xs hover:bg-muted/50 px-2 py-1.5 rounded cursor-pointer">
                    <Checkbox checked={form.metrics.includes(m)} onCheckedChange={() => toggleMetric(m)} />
                    <span>{METRIC_LABEL[m]}</span>
                  </label>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        )}

        {form.scope === 'device' && (
          <>
            <div>
              <Label className="text-[10px] text-muted-foreground">설비 유형</Label>
              <Select value={form.deviceType} onValueChange={(v) => { setF('deviceType', v as DeviceType); setF('deviceIds', []); }}>
                <SelectTrigger className="h-9 text-xs w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(DEVICE_LABEL) as DeviceType[]).map(t => <SelectItem key={t} value={t}>{DEVICE_LABEL[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">설비 선택 (다중)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs min-w-[160px] justify-between">
                    <span className="truncate">{deviceSummary}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0" align="start">
                  <div className="p-3 border-b">
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 absolute left-2 top-2 text-muted-foreground" />
                      <Input value={deviceKw} onChange={(e) => setDeviceKw(e.target.value)} placeholder="설비 검색" className="h-8 pl-7 text-xs" />
                    </div>
                    <div className="flex justify-between mt-2">
                      <Button size="sm" variant="ghost" className="h-7 text-[11px]"
                        onClick={() => setF('deviceIds', filteredDeviceOptions.slice(0, 8).map(d => d.id))}>표시(최대8) 선택</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1" onClick={() => setF('deviceIds', [])}>
                        <RotateCcw className="h-3 w-3" />초기화
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-[280px] overflow-auto p-2">
                    {filteredDeviceOptions.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-6">대상 발전소를 먼저 선택하세요</div>
                    ) : filteredDeviceOptions.map(d => (
                      <label key={d.id} className="flex items-center gap-2 text-xs hover:bg-muted/50 px-2 py-1.5 rounded cursor-pointer">
                        <Checkbox checked={form.deviceIds.includes(d.id)} onCheckedChange={() => toggleDeviceId(d.id)} />
                        <span className="truncate">{d.name}</span>
                      </label>
                    ))}
                  </div>
                  <div className="p-2 border-t bg-muted/30 text-[11px] text-muted-foreground text-center">
                    최대 8개까지 표시 · 단일 발전소 기준
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" onClick={runQuery} disabled={running || (form.scope === 'plant' && form.metrics.length === 0)} className="h-9 gap-1.5">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            조회
          </Button>
          <Button size="sm" variant="outline" className="h-9 gap-1" disabled={!query}
            onClick={() => {
              if (!query) return;
              if (query.scope === 'device') {
                exportCSV(deviceSeries.map(d => ({ ...d, ts: fmtTs(d.ts, query.period) })), `발전이력_설비_${query.startDate}_${query.endDate}.csv`);
              } else {
                exportCSV(plantSeries.map(s => ({ ts: fmtTs(s.ts, query.period), ...s, ts_raw: undefined })), `발전이력_발전소_${query.startDate}_${query.endDate}.csv`);
              }
            }}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </div>

      {/* ============ 결과 ============ */}
      {!query && (
        <div className="panel p-12 text-center text-sm text-muted-foreground">
          조건을 설정한 뒤 <span className="font-semibold text-foreground">조회</span> 버튼을 눌러 데이터를 불러오세요.
        </div>
      )}

      {query && query.scope === 'plant' && (
        <PlantResult series={plantSeries} period={query.period} metrics={query.metrics} />
      )}

      {query && query.scope === 'device' && (
        <DeviceResult series={deviceSeries} period={query.period} />
      )}
    </div>
  );
}

function PlantResult({ series, period, metrics }: { series: any[]; period: Period; metrics: PlantMetric[] }) {
  if (!series.length) {
    return <div className="panel p-8 text-center text-sm text-muted-foreground">결과 없음</div>;
  }
  const barMetrics = metrics.filter(m => m === 'energy' || m === 'sales');
  const lineMetrics = metrics.filter(m => m === 'utilization' || m === 'irradiance');

  return (
    <section className="panel">
      <header className="panel-header">
        <h3 className="panel-title">발전이력 — 합계 / 평균</h3>
        <span className="text-xs text-muted-foreground">{series.length}건 · {metrics.map(m => METRIC_LABEL[m]).join(' · ')}</span>
      </header>
      <div className="panel-body h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 5, right: 8, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="ts" tickFormatter={(v) => fmtTs(v, period)} tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(series.length / 12))} />
            <YAxis yAxisId="L" tick={{ fontSize: 10 }} />
            {lineMetrics.length > 0 && <YAxis yAxisId="R" orientation="right" tick={{ fontSize: 10 }} />}
            <Tooltip labelFormatter={(v) => fmtTs(v as string, period)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {barMetrics.map(m => (
              <Bar key={m} yAxisId="L" dataKey={m} name={METRIC_LABEL[m]} fill={METRIC_COLOR[m]} />
            ))}
            {lineMetrics.map(m => (
              <Line key={m} yAxisId="R" type="monotone" dataKey={m} name={METRIC_LABEL[m]} stroke={METRIC_COLOR[m]} strokeWidth={2} dot={false} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function DeviceResult({ series, period }: { series: any[]; period: Period }) {
  if (!series.length) {
    return <div className="panel p-8 text-center text-sm text-muted-foreground">선택된 발전소/설비가 없습니다.</div>;
  }
  const keys = Object.keys(series[0]).filter(k => k !== 'ts');
  return (
    <section className="panel">
      <header className="panel-header">
        <h3 className="panel-title">설비 시계열</h3>
        <span className="text-xs text-muted-foreground">{keys.length}개 설비 · 최대 8개</span>
      </header>
      <div className="panel-body h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 5, right: 8, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="ts" tickFormatter={(v) => fmtTs(v, period)} tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(series.length / 10))} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip labelFormatter={(v) => fmtTs(v as string, period)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {keys.map((k, i) => (
              <Line key={k} type="monotone" dataKey={k} strokeWidth={1.5} dot={false}
                stroke={`hsl(${(i * 47) % 360} 70% 50%)`} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

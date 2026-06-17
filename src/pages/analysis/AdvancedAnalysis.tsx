import { useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { AnalysisFilters, defaultFilter, filterPlants } from '@/components/analysis/AnalysisFilters';
import { getDevicesForPlant, getDeviceTimeSeries, DEVICE_LABEL, type DeviceType } from '@/data/mockData';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const AXIS_OPTIONS = [
  { key: 'value', label: '주값(출력/일사량)' },
  { key: 'temp', label: '온도' },
  { key: 'voltage', label: '전압' },
  { key: 'current', label: '전류' },
];

export default function AdvancedAnalysis() {
  const [filter, setFilter] = useState(defaultFilter());
  const [mode, setMode] = useState<'time' | 'corr'>('time');
  const [deviceType, setDeviceType] = useState<DeviceType>('inverter');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [xKey, setXKey] = useState('value');
  const [yKey, setYKey] = useState('temp');

  const plants = useMemo(() => filterPlants(filter), [filter]);
  const targetPlant = plants[0];
  const devices = useMemo(() => targetPlant ? getDevicesForPlant(targetPlant.id).filter(d => d.type === deviceType) : [], [targetPlant, deviceType]);

  const days = Math.max(1, Math.ceil((new Date(filter.endDate).getTime() - new Date(filter.startDate).getTime()) / 86_400_000));
  const intervalMin = filter.period === '15min' ? 15 : filter.period === '1h' ? 60 : filter.period === '1d' ? 1440 : 43200;
  const usedDeviceIds = selectedDevices.length ? selectedDevices : devices.slice(0, 3).map(d => d.id);

  const timeData = useMemo(() => {
    if (!usedDeviceIds.length) return [];
    const base = getDeviceTimeSeries(usedDeviceIds[0], Math.min(days * 24, 168), intervalMin as any);
    return base.map((p, i) => {
      const row: any = { ts: p.ts };
      usedDeviceIds.forEach(id => {
        const s = getDeviceTimeSeries(id, Math.min(days * 24, 168), intervalMin as any);
        const dev = devices.find(d => d.id === id);
        row[dev?.name ?? id] = (s[i] as any)?.[yKey] ?? s[i]?.value ?? 0;
      });
      return row;
    });
  }, [usedDeviceIds, days, intervalMin, yKey, devices]);

  const corrData = useMemo(() => {
    if (!usedDeviceIds.length) return [];
    return usedDeviceIds.flatMap(id => {
      const s = getDeviceTimeSeries(id, Math.min(days * 24, 168), intervalMin as any);
      const dev = devices.find(d => d.id === id);
      return s.map(p => ({ name: dev?.name ?? id, x: (p as any)[xKey] ?? 0, y: (p as any)[yKey] ?? 0 }));
    });
  }, [usedDeviceIds, days, intervalMin, xKey, yKey, devices]);

  return (
    <div className="p-4 lg:p-5">
      <div className="mb-3">
        <h1 className="text-xl font-bold">정밀분석</h1>
        <p className="text-xs text-muted-foreground mt-0.5">발전소·설비별 시계열 / 상관관계를 자유롭게 조회</p>
      </div>

      <AnalysisFilters value={filter} onChange={setFilter} />

      <div className="panel p-3 mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div>
          <Label className="text-[10px] text-muted-foreground">분석 모드</Label>
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList className="h-9">
              <TabsTrigger value="time" className="text-xs">시계열</TabsTrigger>
              <TabsTrigger value="corr" className="text-xs">상관분석</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">설비 유형</Label>
          <Select value={deviceType} onValueChange={(v) => { setDeviceType(v as DeviceType); setSelectedDevices([]); }}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(DEVICE_LABEL) as DeviceType[]).map(t => <SelectItem key={t} value={t}>{DEVICE_LABEL[t]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {mode === 'corr' && (
          <div>
            <Label className="text-[10px] text-muted-foreground">X축</Label>
            <Select value={xKey} onValueChange={setXKey}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{AXIS_OPTIONS.map(o => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label className="text-[10px] text-muted-foreground">{mode === 'corr' ? 'Y축' : '데이터 항목'}</Label>
          <Select value={yKey} onValueChange={setYKey}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{AXIS_OPTIONS.map(o => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="text-[10px] text-muted-foreground">
          대상: {targetPlant?.name ?? '발전소 미선택'} · {devices.length}개 설비 · 기본 3개 표시
        </div>
      </div>

      {/* 설비 선택 칩 */}
      {devices.length > 0 && (
        <div className="panel p-3 mb-4">
          <div className="text-[10px] text-muted-foreground mb-2">설비 선택 (최대 6개)</div>
          <div className="flex flex-wrap gap-1.5">
            {devices.slice(0, 30).map(d => {
              const sel = selectedDevices.includes(d.id);
              return (
                <button key={d.id} onClick={() => {
                  if (sel) setSelectedDevices(selectedDevices.filter(x => x !== d.id));
                  else if (selectedDevices.length < 6) setSelectedDevices([...selectedDevices, d.id]);
                }}
                  className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${sel ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted'}`}>
                  {d.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <section className="panel">
        <header className="panel-header">
          <h3 className="panel-title">{mode === 'time' ? '시계열 분석' : '상관 분석'}</h3>
        </header>
        <div className="panel-body h-[480px]">
          {mode === 'time' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeData} margin={{ top: 5, right: 8, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="ts" tickFormatter={(v) => new Date(v).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(timeData.length / 12))} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {usedDeviceIds.map((id, i) => {
                  const dev = devices.find(d => d.id === id);
                  return <Line key={id} type="monotone" dataKey={dev?.name ?? id} stroke={`hsl(${(i * 67) % 360} 70% 50%)`} strokeWidth={1.5} dot={false} />;
                })}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 5, right: 8, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" dataKey="x" name={xKey} tick={{ fontSize: 10 }} label={{ value: AXIS_OPTIONS.find(o => o.key === xKey)?.label, position: 'insideBottom', offset: -10, style: { fontSize: 11 } }} />
                <YAxis type="number" dataKey="y" name={yKey} tick={{ fontSize: 10 }} label={{ value: AXIS_OPTIONS.find(o => o.key === yKey)?.label, angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                <Scatter data={corrData} fill="hsl(var(--secondary))" />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell, LineChart, Line, Legend } from 'recharts';
import { PLANTS, ENERGY_LABEL, ENERGY_COLOR_VAR, getCurrentOutput, getPlantToday, type EnergyType } from '@/data/mockData';

function fmt(n: number, d = 1) { return n.toLocaleString('ko-KR', { maximumFractionDigits: d }); }

export default function MonitoringByType() {
  const [tab, setTab] = useState<EnergyType>('solar');

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">발전원별 모니터링</h1>
        <p className="text-xs text-muted-foreground mt-0.5">발전원 종류별 운전 데이터와 핵심 지표</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as EnergyType)}>
        <TabsList className="grid grid-cols-5 w-full lg:w-auto">
          {(['solar','wind','hydro','fuelcell','ess'] as EnergyType[]).map(t => (
            <TabsTrigger key={t} value={t} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {ENERGY_LABEL[t]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="solar"><SolarPanel /></TabsContent>
        <TabsContent value="wind"><WindPanel /></TabsContent>
        <TabsContent value="hydro"><HydroPanel /></TabsContent>
        <TabsContent value="fuelcell"><FuelCellPanel /></TabsContent>
        <TabsContent value="ess"><EssPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function PanelBox({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`panel ${className}`}>
      <div className="panel-header"><h3 className="panel-title">{title}</h3></div>
      <div className="panel-body">{children}</div>
    </div>
  );
}

function SolarPanel() {
  const plants = PLANTS.filter(p => p.type === 'solar');
  // 일사량 vs 발전량
  const data = Array.from({ length: 24 }, (_, h) => {
    const irr = h < 5 || h > 19 ? 0 : Math.cos((h - 12) / 7 * Math.PI / 2) * 950 * (0.9 + Math.random() * 0.2);
    const gen = plants.reduce((s, p) => s + getPlantToday(p)[h].output, 0);
    return { hour: `${h}시`, 일사량: Math.max(0, +irr.toFixed(0)), 발전량: +gen.toFixed(1) };
  });
  // 인버터 히트맵 (8x6 = 48기)
  const inverters = Array.from({ length: 48 }, (_, i) => ({ id: `INV-${i + 1}`, output: Math.random() * 100 }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <PanelBox title="일사량 vs 발전량 (24h)">
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="l" type="monotone" dataKey="일사량" stroke="hsl(var(--energy-solar))" dot={false} strokeWidth={2} />
              <Line yAxisId="r" type="monotone" dataKey="발전량" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </PanelBox>
      <PanelBox title="인버터별 출력 히트맵 (새만금 1단지)">
        <div className="grid grid-cols-8 gap-1.5 p-2">
          {inverters.map(i => {
            const intensity = i.output / 100;
            return (
              <div key={i.id} className="aspect-square rounded text-[9px] flex flex-col items-center justify-center text-white"
                style={{ background: `hsl(var(--energy-solar) / ${0.3 + intensity * 0.7})` }} title={`${i.id}: ${i.output.toFixed(1)}kW`}>
                <span className="font-mono">{i.id.replace('INV-', '')}</span>
                <span className="font-bold">{i.output.toFixed(0)}</span>
              </div>
            );
          })}
        </div>
        <div className="text-[10px] text-muted-foreground text-center mt-1">단위: kW · 색이 진할수록 출력 높음</div>
      </PanelBox>
    </div>
  );
}

function WindPanel() {
  const plants = PLANTS.filter(p => p.type === 'wind');
  const turbines = Array.from({ length: 12 }, (_, i) => ({
    id: `T-${String(i + 1).padStart(2, '0')}`,
    rpm: 12 + Math.random() * 8,
    output: 1500 + Math.random() * 2000,
    status: i === 2 ? 'fault' : 'normal',
  }));
  const wind = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}시`, 풍속: +(5 + Math.sin(h / 4) * 3 + Math.random() * 2).toFixed(1), 풍향: Math.round(180 + Math.sin(h / 6) * 60) }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <PanelBox title="풍속 / 풍향 추이">
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={wind}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="l" tick={{ fontSize: 11 }} label={{ value: 'm/s', position: 'insideLeft', fontSize: 10 }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} label={{ value: '°', position: 'insideRight', fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="l" dataKey="풍속" stroke="hsl(var(--energy-wind))" strokeWidth={2} dot={false} />
              <Line yAxisId="r" dataKey="풍향" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </PanelBox>
      <PanelBox title="터빈별 RPM / 출력 (영광 백수)">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {turbines.map(t => (
            <div key={t.id} className={`rounded-md border p-2 text-center ${t.status === 'fault' ? 'border-destructive bg-destructive/5' : 'bg-card'}`}>
              <div className="text-[10px] text-muted-foreground">{t.id}</div>
              <div className={`text-base font-bold tabular-nums ${t.status === 'fault' ? 'text-destructive' : 'text-foreground'}`}>{t.status === 'fault' ? '정지' : `${t.output.toFixed(0)}kW`}</div>
              <div className="text-[10px] text-muted-foreground">{t.status === 'fault' ? '이상' : `${t.rpm.toFixed(1)} RPM`}</div>
            </div>
          ))}
        </div>
      </PanelBox>
    </div>
  );
}

function HydroPanel() {
  const data = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}시`, 유입량: +(80 + Math.sin(h / 3) * 30 + Math.random() * 20).toFixed(0), 방류량: +(60 + Math.sin(h / 2.5) * 40 + Math.random() * 20).toFixed(0), 수위: +(385 + Math.sin(h / 5) * 8).toFixed(1) }));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <PanelBox title="유입량 vs 방류량 (㎥/s)">
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="유입량" stackId="1" stroke="hsl(var(--energy-hydro))" fill="hsl(var(--energy-hydro) / 0.4)" />
              <Area type="monotone" dataKey="방류량" stackId="2" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.4)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </PanelBox>
      <PanelBox title="저수지 수위 (EL.m)">
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[370, 400]} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Line dataKey="수위" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </PanelBox>
    </div>
  );
}

function FuelCellPanel() {
  const stacks = Array.from({ length: 6 }, (_, i) => ({ id: `STACK-${i+1}`, eff: 42 + Math.random() * 8, h2: 60 + Math.random() * 30 }));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <PanelBox title="스택별 효율 / 수소 사용량">
        <div className="space-y-2">
          {stacks.map(s => (
            <div key={s.id} className="flex items-center gap-3 p-2 border rounded-md">
              <span className="font-mono text-xs w-16">{s.id}</span>
              <div className="flex-1">
                <div className="flex justify-between text-[10px] mb-1"><span>효율</span><span className="font-bold">{s.eff.toFixed(1)}%</span></div>
                <div className="h-2 bg-muted rounded"><div className="h-full bg-energy-fuelcell rounded" style={{ width: `${s.eff}%` }} /></div>
              </div>
              <div className="text-right text-xs w-20"><div className="text-[10px] text-muted-foreground">H₂</div><div className="font-semibold tabular-nums">{s.h2.toFixed(1)} kg/h</div></div>
            </div>
          ))}
        </div>
      </PanelBox>
      <PanelBox title="수소 저장 탱크 현황">
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: '탱크 A', soc: 78, max: 5000 },
            { name: '탱크 B', soc: 62, max: 5000 },
            { name: '탱크 C', soc: 91, max: 3000 },
            { name: '탱크 D', soc: 45, max: 3000 },
          ].map(t => (
            <div key={t.name} className="border rounded-md p-3 text-center">
              <div className="text-xs text-muted-foreground">{t.name}</div>
              <div className="relative h-32 my-2 mx-auto w-12 bg-muted rounded overflow-hidden">
                <div className="absolute bottom-0 w-full transition-all bg-gradient-to-t from-energy-fuelcell to-accent" style={{ height: `${t.soc}%` }} />
              </div>
              <div className="text-xl font-bold">{t.soc}%</div>
              <div className="text-[10px] text-muted-foreground">/ {t.max} kg</div>
            </div>
          ))}
        </div>
      </PanelBox>
    </div>
  );
}

function EssPanel() {
  const data = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}시`, 충전: h < 14 && h > 9 ? -(8 + Math.random() * 4) : 0, 방전: h >= 18 && h <= 22 ? 12 + Math.random() * 5 : 0, SOC: Math.max(20, Math.min(95, 50 + Math.sin(h / 4) * 35)) }));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <PanelBox title="ESS 충/방전 패턴 (MW)">
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="충전" fill="hsl(var(--secondary))" />
              <Bar dataKey="방전" fill="hsl(var(--energy-ess))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </PanelBox>
      <PanelBox title="SOC (배터리 잔량 %)">
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Area dataKey="SOC" stroke="hsl(var(--energy-ess))" fill="hsl(var(--energy-ess) / 0.3)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </PanelBox>
    </div>
  );
}

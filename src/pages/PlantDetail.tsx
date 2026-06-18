import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, ComposedChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import {
  ArrowLeft, MapPin, Calendar, Zap, Activity, Wifi, WifiOff, AlertCircle,
  Sun, Cloud, CloudRain, CloudSun, CloudSnow, Wind, Droplets, Thermometer, Gauge,
} from 'lucide-react';
import {
  PLANTS, ENERGY_LABEL, ENERGY_COLOR_VAR, getPlantToday, getPlantDailyEnergy, getCurrentOutput,
  ALARMS, getPlantEquipmentSummary, getPlantCommSummary, EQUIPMENT_LABEL, PRICE,
  getPlantPeriodRow, getPlantPrev3Avg, getPlantMonthly12,
  getPlantWeatherCalendar, getPlantWeatherSummary, getPlantInverterStatus,
  getPlantWeatherSensors, getPlantBreakerStatus, WeatherIcon,
} from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Tooltip as UITooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PlantControlPanel } from '@/components/control/PlantControlPanel';
import { PerformanceWidget } from '@/components/performance/PerformanceWidget';
import { PeriodPicker, defaultPeriod, eachMonthInRange, PeriodRange } from '@/components/PeriodPicker';
import { AnomalyAlert, AnomalyItem } from '@/components/AnomalyAlert';


function fmtKRW(n: number) {
  if (Math.abs(n) >= 100_000_000) return `₩${(n / 100_000_000).toFixed(2)}억`;
  if (Math.abs(n) >= 10_000) return `₩${(n / 10_000).toFixed(0)}만`;
  return `₩${n.toLocaleString('ko-KR')}`;
}
function fmt(n: number, d = 0) { return n.toLocaleString('ko-KR', { maximumFractionDigits: d }); }

export default function PlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const plant = PLANTS.find(p => p.id === id);

  // All hooks must be called unconditionally before any early return
  const [period, setPeriod] = useState<PeriodRange>(defaultPeriod);
  const months = useMemo(() => eachMonthInRange(period), [period]);
  const periodData = useMemo(
    () => plant ? months.map(m => getPlantPeriodRow(plant.id, m.year, m.month)) : [],
    [months, plant]
  );
  const totalRevenue = periodData.reduce((s, r) => s + r.revenue, 0);
  const totalCost = periodData.reduce((s, r) => s + r.cost, 0);
  const totalProfit = totalRevenue - totalCost;

  const anomalies: AnomalyItem[] = useMemo(() => {
    if (!plant) return [];
    const last = months[months.length - 1];
    if (!last) return [];
    const cur = getPlantPeriodRow(plant.id, last.year, last.month);
    const avg = getPlantPrev3Avg(plant.id, last.year, last.month);
    const items: AnomalyItem[] = [];
    if (avg.revenue > 0 && (cur.revenue - avg.revenue) / avg.revenue > 0.5) {
      items.push({ plantName: plant.name, metric: '매출', current: cur.revenue, avg3: avg.revenue, ratio: (cur.revenue - avg.revenue) / avg.revenue });
    }
    if (avg.cost > 0 && (cur.cost - avg.cost) / avg.cost > 0.5) {
      items.push({ plantName: plant.name, metric: '비용', current: cur.cost, avg3: avg.cost, ratio: (cur.cost - avg.cost) / avg.cost });
    }
    return items;
  }, [months, plant]);

  if (!plant) {
    return (
      <div className="p-6">
        <p>발전소를 찾을 수 없습니다.</p>
        <Button onClick={() => navigate('/')} className="mt-3">대시보드로</Button>
      </div>
    );
  }

  const today = getPlantToday(plant);
  const todayEnergy = getPlantDailyEnergy(plant);
  const current = getCurrentOutput(plant);
  const utilization = (current / plant.capacityMW) * 100;
  const plantAlarms = ALARMS.filter(a => a.plantId === plant.id);
  const color = ENERGY_COLOR_VAR[plant.type];

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" /> 뒤로
      </Button>

      <div className="panel">
        <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="h-14 w-14 rounded-lg flex items-center justify-center shrink-0" style={{ background: color, opacity: 0.15 }}>
              <Zap className="h-7 w-7" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">{ENERGY_LABEL[plant.type]} · {plant.id}</div>
              <h1 className="text-2xl font-bold text-foreground truncate">{plant.name}</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{plant.region}</span>
                <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{plant.commissionedYear}년 준공</span>
                <CommStatusHover plantId={plant.id} />
                <EquipStatusHover plantId={plant.id} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center w-full md:w-auto md:min-w-[280px]">
            <Stat label="설비용량" value={`${plant.capacityMW} MW`} />
            <Stat label="현재출력" value={`${current.toFixed(1)} MW`} highlight />
            <Stat label="이용률" value={`${utilization.toFixed(1)}%`} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-2xl">
          <TabsTrigger value="summary">요약</TabsTrigger>
          <TabsTrigger value="control">출력제어</TabsTrigger>
          <TabsTrigger value="performance">성능분석</TabsTrigger>
          <TabsTrigger value="revenue">수익분석</TabsTrigger>
        </TabsList>

        {/* ===== 요약 ===== */}
        <TabsContent value="summary" className="mt-4">
          <SummaryTab plant={plant} color={color} />
        </TabsContent>


        {/* ===== 출력제어 ===== */}
        <TabsContent value="control" className="mt-4">
          <PlantControlPanel plantId={plant.id} />
        </TabsContent>

        {/* ===== 성능분석 ===== */}
        <TabsContent value="performance" className="mt-4">
          {plant.type === 'solar' ? (
            <PerformanceWidget plant={plant} />
          ) : (
            <div className="panel p-8 text-center text-sm text-muted-foreground">
              {ENERGY_LABEL[plant.type]} 발전원은 인버터 성능개선 알고리즘 대상이 아닙니다.
            </div>
          )}
        </TabsContent>

        {/* ===== 수익분석 ===== */}
        <TabsContent value="revenue" className="mt-4 space-y-4">
          <PeriodPicker value={period} onChange={setPeriod} />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniKpi label="기간 매출" value={fmtKRW(totalRevenue)} color="primary" />
            <MiniKpi label="기간 비용" value={fmtKRW(totalCost)} color="muted" />
            <MiniKpi label="순이익" value={fmtKRW(totalProfit)} color={totalProfit >= 0 ? 'success' : 'destructive'} />
            <MiniKpi label="이익률" value={`${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0'}%`} color="accent" />
          </div>

          <div className="panel">
            <div className="panel-header"><h3 className="panel-title">월별 매출/비용/순이익 추이 — {plant.name}</h3></div>
            <div className="panel-body h-72">
              <ResponsiveContainer>
                <LineChart data={periodData.map(r => ({ month: r.label, revenue: r.revenue, cost: r.cost, profit: r.profit }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => fmtKRW(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="revenue" name="매출" stroke="hsl(var(--primary))" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="cost" name="비용" stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
                  <Line type="monotone" dataKey="profit" name="순이익" stroke="hsl(var(--success))" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><h3 className="panel-title">월별 상세</h3></div>
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 border-b">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-3 py-2">월</th>
                    <th className="px-3 py-2 text-right">발전량(MWh)</th>
                    <th className="px-3 py-2 text-right">SMP</th>
                    <th className="px-3 py-2 text-right">REC</th>
                    <th className="px-3 py-2 text-right">매출</th>
                    <th className="px-3 py-2 text-right">비용</th>
                    <th className="px-3 py-2 text-right">순이익</th>
                  </tr>
                </thead>
                <tbody>
                  {periodData.map(r => (
                    <tr key={r.label} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{r.label}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt(r.energy)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtKRW(r.smp)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtKRW(r.rec)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmtKRW(r.revenue)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{fmtKRW(r.cost)}</td>
                      <td className={`px-3 py-2 text-right tabular-nums font-bold ${r.profit >= 0 ? 'text-success' : 'text-destructive'}`}>{fmtKRW(r.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">단가: SMP {PRICE.SMP}원/kWh · REC {PRICE.REC}원/kWh</p>
        </TabsContent>
      </Tabs>

      <AnomalyAlert
        items={anomalies}
        dismissKey={`plant:${plant.id}:${months.at(-1)?.year}-${months.at(-1)?.month}`}
      />
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-base font-bold tabular-nums ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</div>
    </div>
  );
}

function MiniKpi({ label, value, color }: { label: string; value: string; color: 'primary'|'muted'|'success'|'accent'|'destructive' }) {
  const cls = {
    primary: 'bg-primary/10 text-primary',
    muted: 'bg-muted text-muted-foreground',
    success: 'bg-success/10 text-success',
    accent: 'bg-accent/10 text-accent',
    destructive: 'bg-destructive/10 text-destructive',
  }[color];
  return (
    <div className="panel p-3">
      <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium mb-1 ${cls}`}>{label}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}

function CommStatusHover({ plantId }: { plantId: string }) {
  const { status, detail } = getPlantCommSummary(plantId);
  const cls = status === 'down' ? 'text-destructive' : status === 'delay' ? 'text-warning' : 'text-success';
  const Icon = status === 'down' ? WifiOff : Wifi;
  const label = status === 'down' ? '통신 이상' : status === 'delay' ? '통신 지연' : '통신 정상';
  return (
    <UITooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-1 cursor-help ${cls}`}><Icon className="h-3 w-3" />{label}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[280px] text-xs">{detail}</TooltipContent>
    </UITooltip>
  );
}

function EquipStatusHover({ plantId }: { plantId: string }) {
  const { ok, faults } = getPlantEquipmentSummary(plantId);
  return (
    <UITooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-1 cursor-help ${ok ? 'text-success' : 'text-destructive font-semibold'}`}>
          {ok ? <Activity className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          {ok ? '설비 정상' : `설비 이상 ${faults.length}건`}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[300px] text-xs">
        {ok ? (
          <div>모든 설비 정상 (인버터/차단기/접속반)</div>
        ) : (
          <div className="space-y-1">
            <div className="font-semibold text-destructive">이상 설비 {faults.length}건</div>
            {faults.map((f, i) => (
              <div key={i}>
                <span className="text-muted-foreground">[{EQUIPMENT_LABEL[f.kind]}]</span>{' '}
                <span className="font-medium">{f.name}</span>
                {f.note && <span className="text-muted-foreground"> — {f.note}</span>}
              </div>
            ))}
          </div>
        )}
      </TooltipContent>
    </UITooltip>
  );
}

function statusLabel(s: string) {
  return { normal: '정상 운전', maintenance: '계획 정비', fault: '고장 정지' }[s as 'normal'] ?? s;
}
function commLabel(c: string) {
  return { normal: '정상', delay: '지연', down: '단절' }[c as 'normal'] ?? c;
}

// ============= Summary Tab =============
function SummaryTab({ plant, color }: { plant: typeof PLANTS[number]; color: string }) {
  const today = useMemo(() => getPlantToday(plant), [plant]);
  const todayEnergy = useMemo(() => getPlantDailyEnergy(plant), [plant]);
  const current = getCurrentOutput(plant);
  const utilization = (current / plant.capacityMW) * 100;

  // monthly bars + utilization line
  const now = new Date();
  const monthly = useMemo(() => getPlantMonthly12(plant, now.getFullYear()), [plant]);
  const monthlyData = monthly.map(m => {
    const cap = plant.capacityMW * 1000 * 24 * new Date(now.getFullYear(), m.month, 0).getDate();
    const util = cap > 0 ? (m.output / cap) * 100 : 0;
    return { month: `${m.month}월`, mwh: +(m.output / 1000).toFixed(1), util: +util.toFixed(1) };
  });
  const yearTotalMWh = monthlyData.reduce((s, r) => s + r.mwh, 0);
  const thisMonthMWh = monthlyData[now.getMonth()]?.mwh ?? 0;
  const totalUtil = monthlyData.reduce((s, r) => s + r.util, 0);
  const avgUtil = monthlyData.filter(r => r.util > 0).length > 0
    ? totalUtil / monthlyData.filter(r => r.util > 0).length : 0;

  // hourly with utilization
  const hourly = today.map(h => ({
    hour: h.hour,
    output: h.output,
    util: +((h.output / plant.capacityMW) * 100).toFixed(1),
  }));

  // Real-time stats
  const dcInput = +(current / 0.96).toFixed(2);
  const acOutput = current;
  const todayRevenue = todayEnergy * 1000 * (PRICE.SMP + PRICE.REC);

  const plantAlarms = ALARMS.filter(a => a.plantId === plant.id);
  const calendar = useMemo(() => getPlantWeatherCalendar(plant.id, now.getFullYear(), now.getMonth() + 1), [plant]);
  const weather = useMemo(() => getPlantWeatherSummary(plant.id), [plant]);
  const inverters = useMemo(() => getPlantInverterStatus(plant.id), [plant]);
  const sensors = useMemo(() => getPlantWeatherSensors(plant.id), [plant]);
  const breakers = useMemo(() => getPlantBreakerStatus(plant.id), [plant]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* ===== Row 1 ===== */}
      {/* Left top: Monthly bars + utilization line */}
      <div className="panel">
        <div className="panel-header"><h3 className="panel-title">월간 발전량 ({now.getFullYear()}년)</h3></div>
        <div className="panel-body">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <Stat label="월 발전량" value={`${thisMonthMWh.toFixed(1)} MWh`} />
            <Stat label="연 발전량" value={`${yearTotalMWh.toFixed(0)} MWh`} />
            <Stat label="일평균 이용률" value={`${avgUtil.toFixed(1)}%`} />
          </div>
          <div className="h-44">
            <ResponsiveContainer>
              <ComposedChart data={monthlyData} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="L" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}`} />
                <YAxis yAxisId="R" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar yAxisId="L" dataKey="mwh" name="발전량(MWh)" fill={color} radius={[3, 3, 0, 0]} />
                <Line yAxisId="R" type="monotone" dataKey="util" name="이용률(%)" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Middle top: Current output */}
      <div className="panel">
        <div className="panel-header"><h3 className="panel-title">현재 출력</h3></div>
        <div className="panel-body">
          <div className="flex gap-3 items-center">
            <div className="relative w-[96px] h-[80px] flex-shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={[{ v: current }, { v: Math.max(0, plant.capacityMW - current) }]}
                    dataKey="v" cx="50%" cy="50%"
                    innerRadius={28} outerRadius={40}
                    startAngle={90} endAngle={-270}
                    stroke="none" isAnimationActive={false}
                  >
                    <Cell fill={color} />
                    <Cell fill="hsl(var(--muted))" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-sm font-bold tabular-nums" style={{ color }}>{(current * 1000).toFixed(0)}</div>
                <div className="text-[9px] text-muted-foreground">kW</div>
              </div>
            </div>
            <div className="flex-1 space-y-1 text-xs">
              <InfoLine label="설비용량" value={`${(plant.capacityMW * 1000).toFixed(0)} kW`} />
              <InfoLine label="실시간 DC입력" value={`${(dcInput * 1000).toFixed(0)} kW`} />
              <InfoLine label="실시간 AC출력" value={`${(acOutput * 1000).toFixed(0)} kW`} highlight />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 mt-2 pt-2 border-t">
            <MicroStat label="설비용량" value={`${plant.capacityMW.toFixed(2)} MW`} />
            <MicroStat label="금일 발전" value={`${todayEnergy.toFixed(1)} MWh`} />
            <MicroStat label="발전시간" value={`${(todayEnergy / plant.capacityMW).toFixed(2)} Hrs`} />
            <MicroStat label="금일 매출" value={`${(todayRevenue / 10000).toFixed(0)} 만원`} />
          </div>
        </div>
      </div>

      {/* Right top: Alarms */}
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title"><AlertCircle className="h-4 w-4 text-destructive" />알람 현황</h3>
          <span className="text-[10px] text-muted-foreground">{plantAlarms.length}건</span>
        </div>
        <div className="panel-body space-y-1.5 max-h-[220px] overflow-auto">
          {plantAlarms.length === 0 && <div className="text-xs text-muted-foreground text-center py-8">금일 발생한 알람이 없습니다.</div>}
          {plantAlarms.map(a => (
            <div key={a.id} className="flex items-start gap-2 p-2 rounded-md border bg-card">
              <span className={`mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 ${a.level === 'critical' ? 'bg-destructive' : a.level === 'warning' ? 'bg-warning' : 'bg-secondary'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground tabular-nums">
                  <span>{a.time}</span>
                  <span className="uppercase font-semibold">{a.level}</span>
                </div>
                <div className="text-xs text-foreground/90 mt-0.5">{a.message}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Row 2 ===== */}
      {/* Left: Calendar (spans rows 2-3 to match equipment height) */}
      <div className="panel lg:row-span-2">
        <div className="panel-header"><h3 className="panel-title"><Calendar className="h-4 w-4" />발전 달력 ({now.getFullYear()}.{String(now.getMonth() + 1).padStart(2, '0')})</h3></div>
        <div className="panel-body">
          <WeatherCalendar days={calendar} year={now.getFullYear()} month={now.getMonth() + 1} />
        </div>
      </div>

      {/* Middle mid: hourly with utilization */}
      <div className="panel">
        <div className="panel-header"><h3 className="panel-title">금일 시간대별 발전현황</h3></div>
        <div className="panel-body h-56">
          <ResponsiveContainer>
            <ComposedChart data={hourly} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}`} />
              <YAxis yAxisId="L" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="R" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ fontSize: 11 }} labelFormatter={(v) => `${v}시`} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar yAxisId="L" dataKey="output" name="발전량(MW)" fill={color} radius={[2, 2, 0, 0]} />
              <Line yAxisId="R" type="monotone" dataKey="util" name="이용률(%)" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Right mid+bottom: Equipment status (spans 2 rows) */}
      <div className="panel lg:row-span-2">
        <div className="panel-header"><h3 className="panel-title"><Activity className="h-4 w-4" />설비 현황</h3></div>
        <div className="panel-body space-y-4 max-h-[600px] overflow-auto overflow-x-auto">
          <EquipBlock title={`태양광 인버터 (${inverters.length})`}>
            <table className="w-full text-[10px]">
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-1 px-1">장치</th>
                  <th className="text-right py-1 px-1">AC</th>
                  <th className="text-right py-1 px-1">DC</th>
                  <th className="text-right py-1 px-1">유효</th>
                  <th className="text-right py-1 px-1">무효</th>
                  <th className="text-right py-1 px-1">온도</th>
                </tr>
              </thead>
              <tbody>
                {inverters.map(i => (
                  <tr key={i.name} className="border-b last:border-0">
                    <td className="py-1 px-1 font-medium">{i.name}</td>
                    <td className="py-1 px-1 text-right tabular-nums">{i.acP}kW</td>
                    <td className="py-1 px-1 text-right tabular-nums text-muted-foreground">{i.dcP}kW</td>
                    <td className="py-1 px-1 text-right tabular-nums">{i.activeP}</td>
                    <td className="py-1 px-1 text-right tabular-nums text-muted-foreground">{i.reactiveP}</td>
                    <td className={`py-1 px-1 text-right tabular-nums ${i.temp > 55 ? 'text-warning font-semibold' : ''}`}>{i.temp}℃</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-[9px] text-muted-foreground mt-1">누적: {inverters.reduce((s, i) => s + i.cumEnergy, 0).toFixed(2)} MWh · 무효지상/진상 포함</div>
          </EquipBlock>

          <EquipBlock title={`기상 센서 (${sensors.length})`}>
            <table className="w-full text-[10px]">
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-1 px-1">장치</th>
                  <th className="text-right py-1 px-1">모듈온도</th>
                  <th className="text-right py-1 px-1">외기온도</th>
                  <th className="text-right py-1 px-1">습도</th>
                  <th className="text-right py-1 px-1">일사량</th>
                </tr>
              </thead>
              <tbody>
                {sensors.map(s => (
                  <tr key={s.name} className="border-b last:border-0">
                    <td className="py-1 px-1 font-medium">{s.name}</td>
                    <td className="py-1 px-1 text-right tabular-nums">{s.moduleTemp}℃</td>
                    <td className="py-1 px-1 text-right tabular-nums">{s.ambientTemp}℃</td>
                    <td className="py-1 px-1 text-right tabular-nums">{s.humidity}%</td>
                    <td className="py-1 px-1 text-right tabular-nums">{s.irradiance} W/㎡</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </EquipBlock>

          <EquipBlock title={`회로차단기 / 접속반 (${breakers.length})`}>
            <table className="w-full text-[10px]">
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-1 px-1">장치</th>
                  <th className="text-center py-1 px-1">개폐</th>
                  <th className="text-right py-1 px-1">유효전력</th>
                  <th className="text-right py-1 px-1">무효전력</th>
                </tr>
              </thead>
              <tbody>
                {breakers.map(b => (
                  <tr key={b.name} className="border-b last:border-0">
                    <td className="py-1 px-1 font-medium">{b.name}</td>
                    <td className={`py-1 px-1 text-center text-[9px] font-semibold ${b.closed ? 'text-success' : 'text-destructive'}`}>{b.closed ? 'CLOSE' : 'OPEN'}</td>
                    <td className="py-1 px-1 text-right tabular-nums">{b.activeP} kW</td>
                    <td className="py-1 px-1 text-right tabular-nums text-muted-foreground">{b.reactiveP} kVar</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </EquipBlock>
        </div>
      </div>

      {/* ===== Row 3 (Middle column only) ===== */}
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title"><Cloud className="h-4 w-4" />금일 기상정보</h3>
          <span className="text-[10px] text-muted-foreground tabular-nums">관측: {weather.observedAt}</span>
        </div>
        <div className="panel-body">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <WeatherBox label="어제" icon={weather.yesterday.icon} temp={weather.yesterday.temp} />
              <WeatherBox label="오늘" icon={weather.today.icon} temp={weather.today.temp} primary />
              <WeatherBox label="내일" icon={weather.tomorrow.icon} temp={weather.tomorrow.temp} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MetricBox icon={<Sun className="h-4 w-4 text-warning" />} label="일사량" value={`${weather.irradiance} W/㎡`} />
              <MetricBox icon={<Wind className="h-4 w-4 text-secondary" />} label="풍향" value={`${weather.windDir}°`} />
              <MetricBox icon={<Gauge className="h-4 w-4 text-accent" />} label="풍속" value={`${weather.windSpeed} m/s`} />
              <MetricBox icon={<Droplets className="h-4 w-4 text-primary" />} label="습도" value={`${weather.humidity}%`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoLine({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b py-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums font-semibold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}

function MicroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[9px] text-muted-foreground">{label}</div>
      <div className="text-[11px] font-bold tabular-nums">{value}</div>
    </div>
  );
}

function EquipBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold mb-1.5 text-foreground/80">{title}</div>
      {children}
    </div>
  );
}

function WeatherIconCmp({ icon, className = 'h-4 w-4' }: { icon: WeatherIcon; className?: string }) {
  const cls = `${className}`;
  switch (icon) {
    case 'sunny': return <Sun className={`${cls} text-warning`} />;
    case 'partly': return <CloudSun className={`${cls} text-secondary`} />;
    case 'cloudy': return <Cloud className={`${cls} text-muted-foreground`} />;
    case 'rainy': return <CloudRain className={`${cls} text-primary`} />;
    case 'snow': return <CloudSnow className={`${cls} text-accent`} />;
  }
}

function WeatherCalendar({ days, year, month }: { days: ReturnType<typeof getPlantWeatherCalendar>; year: number; month: number }) {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const cells: ({ d: number; w: typeof days[number] } | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (const w of days) cells.push({ d: w.day, w });
  while (cells.length % 7 !== 0) cells.push(null);
  return (
    <div>
      <div className="grid grid-cols-7 gap-px mb-1 text-[11px] text-muted-foreground text-center">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((c, i) => (
          <div key={i} className={`aspect-square rounded border p-1 ${c ? 'bg-card' : 'bg-transparent border-transparent'}`}>
            {c && (
              <div className="h-full flex flex-col items-center justify-between">
                <div className="text-[11px] tabular-nums w-full text-left font-medium">{c.d}</div>
                <WeatherIconCmp icon={c.w.icon} className="h-6 w-6" />
                <div className="flex flex-col items-center leading-tight">
                  <div className="text-[11px] tabular-nums text-foreground font-semibold">{c.w.avgTemp}°</div>
                  <div className="text-[9px] tabular-nums text-muted-foreground">{c.w.avgIrradiance}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="text-[9px] text-muted-foreground mt-1.5 text-right">일별: 날씨 · 평균기온(°C) · 평균일사량(W/㎡)</div>
    </div>
  );
}

function WeatherBox({ label, icon, temp, primary }: { label: string; icon: WeatherIcon; temp: number; primary?: boolean }) {
  return (
    <div className={`rounded-md border p-2 text-center ${primary ? 'bg-primary/5 border-primary/30' : 'bg-card'}`}>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="flex justify-center my-1"><WeatherIconCmp icon={icon} className="h-6 w-6" /></div>
      <div className="text-sm font-bold tabular-nums">{temp}°C</div>
    </div>
  );
}

function MetricBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-2 flex items-center gap-2">
      <span className="h-7 w-7 rounded bg-muted/40 inline-flex items-center justify-center">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-muted-foreground">{label}</div>
        <div className="text-xs font-bold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

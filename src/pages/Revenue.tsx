import { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react';
import {
  PLANTS, ENERGY_LABEL, ENERGY_COLOR_VAR, PRICE,
  getPlantPeriodRow, getPlantPrev3Avg,
} from '@/data/mockData';
import { plantsForScope } from '@/components/ScopeFilter';
import { useScope } from '@/components/ScopeContext';
import { PeriodPicker, defaultPeriod, eachMonthInRange, PeriodRange } from '@/components/PeriodPicker';
import { SortableTh, SortState, nextSort, applySort } from '@/components/SortableTh';
import { usePlantOrder } from '@/components/PlantOrderContext';
import { PlantDragHandle } from '@/components/DraggablePlantCell';
import { AnomalyAlert, AnomalyItem } from '@/components/AnomalyAlert';

function fmtKRW(n: number) { return `₩${(n / 100_000_000).toFixed(2)}억`; }
function fmt(n: number, d = 0) { return n.toLocaleString('ko-KR', { maximumFractionDigits: d }); }

type SortKey = 'name' | 'type' | 'cap' | 'energy' | 'revenue' | 'cost' | 'profit' | 'margin';

export default function Revenue() {
  const { scope } = useScope();
  const { sortPlants } = usePlantOrder();
  const basePlants = useMemo(() => plantsForScope(scope), [scope]);
  const plants = useMemo(() => sortPlants(basePlants), [basePlants, sortPlants]);

  const [period, setPeriod] = useState<PeriodRange>(defaultPeriod);
  const months = useMemo(() => eachMonthInRange(period), [period]);
  const [sort, setSort] = useState<SortState<SortKey>>({ key: null, dir: null });
  const dragEnabled = sort.key === null;

  // Per-plant aggregated period rows + monthly array
  const data = useMemo(() => plants.map(p => {
    const monthly = months.map(m => getPlantPeriodRow(p.id, m.year, m.month));
    const energy = monthly.reduce((s, r) => s + r.energy, 0);
    const revenue = monthly.reduce((s, r) => s + r.revenue, 0);
    const cost = monthly.reduce((s, r) => s + r.cost, 0);
    const profit = revenue - cost;
    return { plant: p, monthly, energy, revenue, cost, profit };
  }), [plants, months]);

  // Monthly totals (across all plants in current scope) for line chart
  const monthlyTotals = useMemo(() => months.map((m, i) => {
    let revenue = 0, cost = 0, profit = 0;
    for (const d of data) {
      revenue += d.monthly[i]?.revenue ?? 0;
      cost += d.monthly[i]?.cost ?? 0;
      profit += d.monthly[i]?.profit ?? 0;
    }
    return { month: `${m.year}-${String(m.month).padStart(2, '0')}`, revenue, cost, profit };
  }), [data, months]);

  const totalRevenue = monthlyTotals.reduce((s, m) => s + m.revenue, 0);
  const totalCost = monthlyTotals.reduce((s, m) => s + m.cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // 영업이익률 (기간 합계 기준)
  const profitability = data
    .filter(d => d.revenue > 0)
    .map(d => ({ name: d.plant.name, type: d.plant.type, margin: (d.profit / d.revenue) * 100, profit: d.profit }))
    .sort((a, b) => b.margin - a.margin);

  // Sortable table rows
  const tableRows = useMemo(() => applySort(data, sort, (r, k) => {
    switch (k) {
      case 'name': return r.plant.name;
      case 'type': return ENERGY_LABEL[r.plant.type];
      case 'cap': return r.plant.capacityMW;
      case 'energy': return r.energy;
      case 'revenue': return r.revenue;
      case 'cost': return r.cost;
      case 'profit': return r.profit;
      case 'margin': return r.revenue > 0 ? r.profit / r.revenue : 0;
    }
  }), [data, sort]);

  // ===== Anomaly detection across all 3 metrics (latest month) =====
  const anomalies: AnomalyItem[] = useMemo(() => {
    const last = months[months.length - 1];
    if (!last) return [];
    const items: AnomalyItem[] = [];
    for (const p of basePlants) {
      const cur = getPlantPeriodRow(p.id, last.year, last.month);
      const avg = getPlantPrev3Avg(p.id, last.year, last.month);
      const checks: Array<[string, number, number]> = [
        ['매출', cur.revenue, avg.revenue],
        ['비용', cur.cost, avg.cost],
        ['순이익', Math.abs(cur.profit), Math.abs(avg.profit)],
      ];
      for (const [metric, curV, avgV] of checks) {
        if (avgV > 0 && (curV - avgV) / avgV > 0.5) {
          items.push({ plantName: p.name, metric, current: curV, avg3: avgV, ratio: (curV - avgV) / avgV });
        }
      }
    }
    return items;
  }, [basePlants, months]);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">수익 분석</h1>
        <p className="text-xs text-muted-foreground mt-0.5">발전소별 매출(SMP+REC) · 비용 · 손익 분석 · 단가 SMP {PRICE.SMP}원/kWh, REC {PRICE.REC}원/kWh</p>
      </div>

      <PeriodPicker value={period} onChange={setPeriod} />

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={<DollarSign />} label="기간 매출" value={fmtKRW(totalRevenue)} color="primary" />
        <Kpi icon={<Wallet />} label="기간 비용" value={fmtKRW(totalCost)} color="muted" />
        <Kpi icon={<TrendingUp />} label="기간 영업이익" value={fmtKRW(totalProfit)} color="success" />
        <Kpi icon={<TrendingUp />} label="영업이익률" value={`${margin.toFixed(1)}%`} color="accent" />
      </div>

      <div className="panel">
        <div className="panel-header"><h3 className="panel-title">월별 매출 / 비용 / 순이익 추이</h3></div>
        <div className="panel-body h-72">
          <ResponsiveContainer>
            <LineChart data={monthlyTotals}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 100_000_000).toFixed(0)}억`} />
              <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => fmtKRW(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" name="매출" stroke="hsl(var(--primary))" strokeWidth={2.5} />
              <Line type="monotone" dataKey="cost" name="비용" stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
              <Line type="monotone" dataKey="profit" name="순이익" stroke="hsl(var(--success))" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* 영업이익률 */}
        <div className="panel">
          <div className="panel-header"><h3 className="panel-title">사업소별 영업이익률 (기간 합계)</h3></div>
          <div className="panel-body h-96">
            <ResponsiveContainer>
              <BarChart data={profitability} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Bar dataKey="margin">
                  {profitability.map((d, i) => <Cell key={i} fill={ENERGY_COLOR_VAR[d.type]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top/Bottom */}
        <div className="space-y-4">
          <div className="panel">
            <div className="panel-header"><h3 className="panel-title text-success">손익 TOP 5 사업소</h3></div>
            <div className="panel-body space-y-2">
              {[...data].sort((a, b) => b.profit - a.profit).slice(0, 5).map((r, i) => (
                <div key={r.plant.id} className="flex items-center gap-3 p-2 border rounded-md">
                  <span className="font-bold text-success w-6">{i + 1}</span>
                  <span className="h-2 w-2 rounded-full" style={{ background: ENERGY_COLOR_VAR[r.plant.type] }} />
                  <span className="flex-1 text-sm font-medium truncate">{r.plant.name}</span>
                  <span className="text-sm font-bold tabular-nums text-success">{fmtKRW(r.profit)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="panel-header"><h3 className="panel-title text-destructive"><TrendingDown className="h-4 w-4" />손익 BOTTOM 5 사업소</h3></div>
            <div className="panel-body space-y-2">
              {[...data].sort((a, b) => a.profit - b.profit).slice(0, 5).map((r, i) => (
                <div key={r.plant.id} className="flex items-center gap-3 p-2 border rounded-md">
                  <span className="font-bold text-destructive w-6">{i + 1}</span>
                  <span className="h-2 w-2 rounded-full" style={{ background: ENERGY_COLOR_VAR[r.plant.type] }} />
                  <span className="flex-1 text-sm font-medium truncate">{r.plant.name}</span>
                  <span className="text-sm font-bold tabular-nums text-destructive">{fmtKRW(r.profit)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 매출 테이블 */}
      <div className="panel">
        <div className="panel-header"><h3 className="panel-title">사업소별 기간 손익 상세</h3></div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr className="text-xs text-muted-foreground">
                <SortableTh label="사업소명" k="name" state={sort} onSort={(k) => setSort(nextSort(sort, k))} />
                <SortableTh label="발전원" k="type" state={sort} onSort={(k) => setSort(nextSort(sort, k))} />
                <SortableTh label="설비(MW)" k="cap" state={sort} onSort={(k) => setSort(nextSort(sort, k))} align="right" />
                <SortableTh label="발전량(MWh)" k="energy" state={sort} onSort={(k) => setSort(nextSort(sort, k))} align="right" />
                <SortableTh label="매출 합계" k="revenue" state={sort} onSort={(k) => setSort(nextSort(sort, k))} align="right" />
                <SortableTh label="총비용" k="cost" state={sort} onSort={(k) => setSort(nextSort(sort, k))} align="right" />
                <SortableTh label="순이익" k="profit" state={sort} onSort={(k) => setSort(nextSort(sort, k))} align="right" />
                <SortableTh label="이익률" k="margin" state={sort} onSort={(k) => setSort(nextSort(sort, k))} align="right" />
              </tr>
            </thead>
            <tbody>
              {tableRows.map(r => (
                <tr key={r.plant.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">
                    <PlantDragHandle plantId={r.plant.id} disabled={!dragEnabled}>{r.plant.name}</PlantDragHandle>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: ENERGY_COLOR_VAR[r.plant.type] }} />
                      {ENERGY_LABEL[r.plant.type]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.plant.capacityMW.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(r.energy)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmtKRW(r.revenue)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-xs text-muted-foreground">{fmtKRW(r.cost)}</td>
                  <td className={`px-3 py-2 text-right tabular-nums font-bold ${r.profit >= 0 ? 'text-success' : 'text-destructive'}`}>{fmtKRW(r.profit)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-xs">{r.revenue > 0 ? ((r.profit / r.revenue) * 100).toFixed(1) : '0.0'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!dragEnabled && <div className="px-3 py-2 text-[11px] text-muted-foreground bg-muted/30 border-t">정렬이 적용된 상태에서는 드래그 정렬이 비활성화됩니다.</div>}
      </div>

      <AnomalyAlert
        items={anomalies}
        dismissKey={`revenue:${months.at(-1)?.year}-${months.at(-1)?.month}`}
      />
    </div>
  );
}

function Kpi({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: 'primary'|'muted'|'success'|'accent' }) {
  const cls = { primary: 'bg-primary/10 text-primary', muted: 'bg-muted text-muted-foreground', success: 'bg-success/10 text-success', accent: 'bg-accent/10 text-accent' }[color];
  return (
    <div className="panel p-4 flex items-center gap-3">
      <span className={`h-10 w-10 rounded-md flex items-center justify-center ${cls}`}>{icon}</span>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-bold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

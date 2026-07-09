import { useMemo, useState } from 'react';
import { useScope } from '@/components/ScopeContext';
import {
  PLANTS, ENERGY_LABEL, getPlantCostBreakdown,
  PRICE, COST_CATEGORY_KEYS, COST_CATEGORY_LABEL, CostCategoryKey,
  getPlantPeriodRow, getPlantPrev3Avg,
} from '@/data/mockData';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip as UITooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';
import { Download, Save, Scale } from 'lucide-react';
import { plantsForScope } from '@/components/ScopeFilter';
import { toast } from '@/hooks/use-toast';
import { PeriodPicker, defaultPeriod, eachMonthInRange, PeriodRange } from '@/components/PeriodPicker';
import { SortableTh, SortState, nextSort, applySort } from '@/components/SortableTh';
import { usePlantOrder } from '@/components/PlantOrderContext';
import { PlantDragHandle } from '@/components/DraggablePlantCell';
import { AnomalyAlert, AnomalyItem } from '@/components/AnomalyAlert';

const fmt = (n: number) => n.toLocaleString('ko-KR');
const exportCSV = (rows: any[], name: string) => {
  if (!rows.length) return;
  const csv = [Object.keys(rows[0]).join(','), ...rows.map(r => Object.values(r).map(v => JSON.stringify(v ?? '')).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
};

// ============================================================================
// 매출 관리
// ============================================================================
type SalesSortKey = 'name' | 'type' | 'cap' | 'salesMWh' | 'smp' | 'rec' | 'total';

export function SalesManagement() {
  const { scope } = useScope();
  const { sortPlants } = usePlantOrder();
  const basePlants = useMemo(() => plantsForScope(scope), [scope]);

  const [period, setPeriod] = useState<PeriodRange>(defaultPeriod);
  const months = useMemo(() => eachMonthInRange(period), [period]);

  const [sort, setSort] = useState<SortState<SalesSortKey>>({ key: null, dir: null });
  const sorted = useMemo(() => sortPlants(basePlants), [basePlants, sortPlants]);

  // For each plant, sum over selected months (uses seeded period-aware data).
  const rows = useMemo(() => sorted.map(p => {
    const periodRows = months.map(m => getPlantPeriodRow(p.id, m.year, m.month));
    const salesMWh = periodRows.reduce((s, r) => s + r.energy, 0);
    const smp = periodRows.reduce((s, r) => s + r.smp, 0);
    const rec = periodRows.reduce((s, r) => s + r.rec, 0);
    const total = smp + rec;
    return { plant: p, salesMWh, smp, rec, total, periodRows };
  }), [sorted, months]);

  const visibleRows = useMemo(() => applySort(rows, sort, (r, k) => {
    switch (k) {
      case 'name': return r.plant.name;
      case 'type': return ENERGY_LABEL[r.plant.type];
      case 'cap': return r.plant.capacityMW;
      case 'salesMWh': return r.salesMWh;
      case 'smp': return r.smp;
      case 'rec': return r.rec;
      case 'total': return r.total;
    }
  }), [rows, sort]);

  const totalSum = rows.reduce((s, r) => s + r.total, 0);
  const totalSales = rows.reduce((s, r) => s + r.salesMWh, 0);
  const dragEnabled = sort.key === null;

  // ===== Anomaly detection (latest month in range vs prev 3 months) =====
  const anomalies: AnomalyItem[] = useMemo(() => {
    const last = months[months.length - 1];
    if (!last) return [];
    const items: AnomalyItem[] = [];
    for (const p of basePlants) {
      const cur = getPlantPeriodRow(p.id, last.year, last.month);
      const avg = getPlantPrev3Avg(p.id, last.year, last.month);
      if (avg.revenue > 0 && (cur.revenue - avg.revenue) / avg.revenue > 0.5) {
        items.push({ plantName: p.name, metric: '매출', current: cur.revenue, avg3: avg.revenue, ratio: (cur.revenue - avg.revenue) / avg.revenue });
      }
    }
    return items;
  }, [basePlants, months]);

  return (
    <div className="p-4 lg:p-5">
      <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">매출 관리</h1>
          <p className="text-xs text-muted-foreground mt-0.5">SMP+REC 기반 매출 (단가 SMP {PRICE.SMP}원/kWh · REC {PRICE.REC}원/kWh)</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1 h-9" onClick={() => exportCSV(rows.map(r => ({ 발전소: r.plant.name, 발전원: ENERGY_LABEL[r.plant.type], 송전량MWh: Math.round(r.salesMWh), SMP: r.smp, REC: r.rec, 총매출: r.total })), '매출관리.csv')}>
          <Download className="h-3.5 w-3.5" />CSV 내려받기
        </Button>
      </div>

      <div className="mb-3"><PeriodPicker value={period} onChange={setPeriod} /></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Kpi label="조회 대상" value={`${basePlants.length} 개소 · ${months.length}개월`} />
        <Kpi label="기간 송전량" value={`${fmt(Math.round(totalSales))} MWh`} />
        <Kpi label="기간 총 매출" value={`₩${fmt(Math.round(totalSum))}`} accent />
      </div>

      <section className="panel">
        <header className="panel-header"><h3 className="panel-title">발전소별 매출 (기간 합계)</h3></header>
        <div className="overflow-auto max-h-[520px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card border-b">
              <tr className="text-muted-foreground">
                <SortableTh label="발전소" k="name" state={sort} onSort={(k) => setSort(nextSort(sort, k))} />
                <SortableTh label="발전원" k="type" state={sort} onSort={(k) => setSort(nextSort(sort, k))} />
                <SortableTh label="설비(MW)" k="cap" state={sort} onSort={(k) => setSort(nextSort(sort, k))} align="right" />
                <SortableTh label="송전량(MWh)" k="salesMWh" state={sort} onSort={(k) => setSort(nextSort(sort, k))} align="right" />
                <SortableTh label="SMP" k="smp" state={sort} onSort={(k) => setSort(nextSort(sort, k))} align="right" />
                <SortableTh label="REC" k="rec" state={sort} onSort={(k) => setSort(nextSort(sort, k))} align="right" />
                <SortableTh label="총매출" k="total" state={sort} onSort={(k) => setSort(nextSort(sort, k))} align="right" />
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(r => (
                <tr key={r.plant.id} className="border-b hover:bg-muted/40">
                  <td className="px-3 py-2 font-medium">
                    <PlantDragHandle plantId={r.plant.id} disabled={!dragEnabled}>
                      {r.plant.name}
                    </PlantDragHandle>
                  </td>
                  <td className="px-3 py-2">{ENERGY_LABEL[r.plant.type]}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.plant.capacityMW.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(Math.round(r.salesMWh))}</td>
                  <td className="px-3 py-2 text-right tabular-nums">₩{fmt(Math.round(r.smp))}</td>
                  <td className="px-3 py-2 text-right tabular-nums">₩{fmt(Math.round(r.rec))}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold text-primary">₩{fmt(Math.round(r.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!dragEnabled && <div className="px-3 py-2 text-[11px] text-muted-foreground bg-muted/30 border-t">정렬이 적용된 상태에서는 드래그 정렬이 비활성화됩니다. 헤더의 ▲▼를 다시 눌러 정렬을 해제하세요.</div>}
      </section>

      <AnomalyAlert
        items={anomalies}
        dismissKey={`sales:${months.at(-1)?.year}-${months.at(-1)?.month}`}
      />
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`panel p-3 ${accent ? 'bg-primary/5 border-primary/30' : ''}`}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold tabular-nums mt-1 ${accent ? 'text-primary' : ''}`}>{value}</div>
    </div>
  );
}

// ============================================================================
// 비용 관리 - 12개 카테고리 탭 + 인라인 편집 + 일괄입력
// ============================================================================
type CostSortKey = 'name' | 'type' | 'cap' | 'total' | 'value';

export function CostManagement() {
  const { scope } = useScope();
  const { sortPlants } = usePlantOrder();
  const basePlants = useMemo(() => plantsForScope(scope), [scope]);
  const plants = useMemo(() => sortPlants(basePlants), [basePlants, sortPlants]);

  const [tab, setTab] = useState<string>('summary');
  const [period, setPeriod] = useState<PeriodRange>(defaultPeriod);
  const months = useMemo(() => eachMonthInRange(period), [period]);
  const [sort, setSort] = useState<SortState<CostSortKey>>({ key: null, dir: null });
  const dragEnabled = sort.key === null;

  // 편집 상태 - 단일월 비용 (편의상 기간 평균월 기준)
  const [edits, setEdits] = useState<Record<string, Partial<Record<CostCategoryKey, number>>>>({});

  const getValue = (plantId: string, key: CostCategoryKey): number => {
    const override = edits[plantId]?.[key];
    if (override !== undefined) return override * months.length;
    const c = getPlantCostBreakdown(plantId);
    return ((c as any)[key] ?? 0) * months.length;
  };
  const getMonthlyValue = (plantId: string, key: CostCategoryKey): number => {
    const override = edits[plantId]?.[key];
    if (override !== undefined) return override;
    const c = getPlantCostBreakdown(plantId);
    return (c as any)[key] ?? 0;
  };

  const setValue = (plantId: string, key: CostCategoryKey, val: number) => {
    setEdits(prev => ({ ...prev, [plantId]: { ...(prev[plantId] ?? {}), [key]: val } }));
  };

  const save = () => toast({ title: '저장됨', description: '편집한 비용 항목이 임시 저장되었습니다 (데모: 메모리)' });

  // 일괄입력 (전체 모드에서만 활성)
  const isAllScope = scope.ids.length === 0;
  const totalCapacity = useMemo(() => basePlants.reduce((s, p) => s + p.capacityMW, 0), [basePlants]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkAmount, setBulkAmount] = useState<string>('');
  const applyBulk = (key: CostCategoryKey) => {
    const total = Number(bulkAmount);
    if (!total || totalCapacity <= 0) return;
    setEdits(prev => {
      const next = { ...prev };
      for (const p of basePlants) {
        const share = total * (p.capacityMW / totalCapacity);
        next[p.id] = { ...(next[p.id] ?? {}), [key]: Math.round(share) };
      }
      return next;
    });
    setBulkOpen(false);
    setBulkAmount('');
    toast({ title: '일괄입력 적용됨', description: `${COST_CATEGORY_LABEL[key]} — ₩${fmt(total)} 을 설비용량 비율로 ${basePlants.length}개소에 배분했습니다.` });
  };

  // ===== Anomaly =====
  const anomalies: AnomalyItem[] = useMemo(() => {
    const last = months[months.length - 1];
    if (!last) return [];
    const items: AnomalyItem[] = [];
    for (const p of basePlants) {
      const cur = getPlantPeriodRow(p.id, last.year, last.month);
      const avg = getPlantPrev3Avg(p.id, last.year, last.month);
      if (avg.cost > 0 && (cur.cost - avg.cost) / avg.cost > 0.5) {
        items.push({ plantName: p.name, metric: '비용', current: cur.cost, avg3: avg.cost, ratio: (cur.cost - avg.cost) / avg.cost });
      }
    }
    return items;
  }, [basePlants, months]);

  return (
    <div className="p-4 lg:p-5">
      <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">비용 관리</h1>
          <p className="text-xs text-muted-foreground mt-0.5">감가상각 / 경상정비 / 임차료 / 안전관리 / 전력비·통신비 / 보험 / 수선 / 외주 / 수수료 / 잡손익 / 법인세 / 기타 — 12개 카테고리</p>
        </div>
        <Button size="sm" className="gap-1 h-9" onClick={save}><Save className="h-3.5 w-3.5" />변경사항 저장</Button>
      </div>

      <div className="mb-3"><PeriodPicker value={period} onChange={setPeriod} /></div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setSort({ key: null, dir: null }); }}>
        <TabsList className="flex flex-wrap h-auto w-full justify-start">
          <TabsTrigger value="summary" className="text-[11px] h-8 font-semibold">요약</TabsTrigger>
          {COST_CATEGORY_KEYS.map(k => (
            <TabsTrigger key={k} value={k} className="text-[11px] h-8">{COST_CATEGORY_LABEL[k]}</TabsTrigger>
          ))}
        </TabsList>

        {/* 요약 탭 */}
        <TabsContent value="summary">
          <div className="panel p-3 mb-3 bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="text-xs text-muted-foreground">전체 비용 카테고리 · 조회 {basePlants.length}개소 · {months.length}개월 합계</div>
            <div className="text-2xl font-bold tabular-nums text-primary mt-1">
              ₩{fmt(basePlants.reduce((s, p) => s + COST_CATEGORY_KEYS.reduce((ss, k) => ss + getValue(p.id, k), 0), 0))}
            </div>
          </div>
          <section className="panel">
            <div className="overflow-auto max-h-[600px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card border-b z-10">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-3 py-2 sticky left-0 bg-card">발전소</th>
                    <th className="px-3 py-2 text-right font-bold bg-primary/5">합계</th>
                    {COST_CATEGORY_KEYS.map(k => (
                      <th key={k} className="px-2 py-2 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setTab(k)}
                          className="hover:text-primary hover:underline inline-flex items-center gap-1"
                          title="자세히 보기"
                        >
                          {COST_CATEGORY_LABEL[k]}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plants.map(p => {
                    const rowTotal = COST_CATEGORY_KEYS.reduce((s, k) => s + getValue(p.id, k), 0);
                    return (
                      <tr key={p.id} className="border-b hover:bg-muted/40">
                        <td className="px-3 py-2 font-medium sticky left-0 bg-card">
                          <PlantDragHandle plantId={p.id} disabled={!dragEnabled}>{p.name}</PlantDragHandle>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-bold text-primary bg-primary/5">₩{fmt(rowTotal)}</td>
                        {COST_CATEGORY_KEYS.map(k => (
                          <td key={k} className="px-2 py-2 text-right tabular-nums">₩{fmt(getValue(p.id, k))}</td>
                        ))}
                      </tr>
                    );
                  })}
                  <tr className="bg-muted/40 font-bold">
                    <td className="px-3 py-2 sticky left-0 bg-muted/40">합계</td>
                    <td className="px-3 py-2 text-right tabular-nums text-primary bg-primary/10">
                      ₩{fmt(plants.reduce((s, p) => s + COST_CATEGORY_KEYS.reduce((ss, k) => ss + getValue(p.id, k), 0), 0))}
                    </td>
                    {COST_CATEGORY_KEYS.map(k => (
                      <td key={k} className="px-2 py-2 text-right tabular-nums">
                        ₩{fmt(plants.reduce((s, p) => s + getValue(p.id, k), 0))}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </TabsContent>

        {COST_CATEGORY_KEYS.map(k => {
          const totalForKey = plants.reduce((s, p) => s + getValue(p.id, k), 0);
          const rowList = plants.map(p => ({ plant: p, val: getValue(p.id, k), monthly: getMonthlyValue(p.id, k) }));
          const sortedRows = applySort(rowList, sort, (r, key) => {
            switch (key) {
              case 'name': return r.plant.name;
              case 'type': return ENERGY_LABEL[r.plant.type];
              case 'cap': return r.plant.capacityMW;
              case 'value':
              case 'total': return r.val;
            }
          });
          return (
            <TabsContent key={k} value={k}>
              <div className="panel p-3 mb-3 bg-gradient-to-r from-primary/5 to-secondary/5 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="text-xs text-muted-foreground">{COST_CATEGORY_LABEL[k]} · {basePlants.length}개소 · {months.length}개월 합계</div>
                  <div className="text-2xl font-bold tabular-nums text-primary mt-1">₩{fmt(totalForKey)}</div>
                </div>
                {/* 일괄입력 버튼 (전체일 때만) */}
                <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1.5 h-9" disabled={!isAllScope}>
                            <Scale className="h-3.5 w-3.5" />설비용량 단위로 일괄입력
                          </Button>
                        </DialogTrigger>
                      </span>
                    </TooltipTrigger>
                    {!isAllScope && <TooltipContent>구분 필터가 "전체"일 때만 사용 가능합니다.</TooltipContent>}
                  </UITooltip>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{COST_CATEGORY_LABEL[k]} — 일괄 입력</DialogTitle>
                      <DialogDescription>
                        총 금액을 입력하면 전체 발전소({basePlants.length}개소, 총 설비용량 {totalCapacity.toFixed(1)} MW)에 설비용량 비율로 자동 배분됩니다. (월 단위 금액)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">총 금액 (월, 원)</label>
                      <Input
                        type="number"
                        value={bulkAmount}
                        onChange={(e) => setBulkAmount(e.target.value)}
                        placeholder="예: 100000000"
                        className="tabular-nums"
                      />
                      {bulkAmount && Number(bulkAmount) > 0 && (
                        <div className="text-[11px] text-muted-foreground">
                          예시: 1MW 발전소 → ₩{fmt(Math.round(Number(bulkAmount) / totalCapacity))} / 월
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setBulkOpen(false)}>취소</Button>
                      <Button onClick={() => applyBulk(k)} disabled={!bulkAmount || Number(bulkAmount) <= 0}>배분 적용</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <section className="panel">
                <div className="overflow-auto max-h-[520px]">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-card border-b">
                      <tr className="text-muted-foreground">
                        <SortableTh label="발전소" k="name" state={sort} onSort={(key) => setSort(nextSort(sort, key))} />
                        <SortableTh label="발전원" k="type" state={sort} onSort={(key) => setSort(nextSort(sort, key))} />
                        <SortableTh label="설비(MW)" k="cap" state={sort} onSort={(key) => setSort(nextSort(sort, key))} align="right" />
                        <SortableTh label={`${COST_CATEGORY_LABEL[k]} (월, 원)`} k="value" state={sort} onSort={(key) => setSort(nextSort(sort, key))} align="right" />
                        <SortableTh label="기간 합계" k="total" state={sort} onSort={(key) => setSort(nextSort(sort, key))} align="right" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map(({ plant: p, val, monthly }) => {
                        const edited = edits[p.id]?.[k] !== undefined;
                        return (
                          <tr key={p.id} className="border-b hover:bg-muted/40">
                            <td className="px-3 py-2 font-medium">
                              <PlantDragHandle plantId={p.id} disabled={!dragEnabled}>{p.name}</PlantDragHandle>
                            </td>
                            <td className="px-3 py-2">{ENERGY_LABEL[p.type]}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{p.capacityMW.toFixed(1)}</td>
                            <td className="px-3 py-2 text-right">
                              <Input
                                type="number"
                                value={monthly}
                                onChange={(e) => setValue(p.id, k, Number(e.target.value) || 0)}
                                className={`h-8 text-right text-xs tabular-nums ml-auto w-[180px] ${edited ? 'border-primary ring-1 ring-primary/30' : ''}`}
                              />
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums font-semibold">₩{fmt(val)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {!dragEnabled && <div className="px-3 py-2 text-[11px] text-muted-foreground bg-muted/30 border-t">정렬이 적용된 상태에서는 드래그 정렬이 비활성화됩니다.</div>}
              </section>
            </TabsContent>
          );
        })}
      </Tabs>

      <AnomalyAlert
        items={anomalies}
        dismissKey={`cost:${months.at(-1)?.year}-${months.at(-1)?.month}`}
      />
    </div>
  );
}

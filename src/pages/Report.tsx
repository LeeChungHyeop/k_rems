import { useMemo, useState } from 'react';
import { Download, FileText, Calendar, Zap, Wrench, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
  PLANTS, ENERGY_LABEL, getPlantDailyEnergy, getMonthlyEnergyByType, PRICE,
  getPlantRevenueBreakdown, getPlantCostBreakdown,
} from '@/data/mockData';
import { plantsForScope } from '@/components/ScopeFilter';
import { useScope } from '@/components/ScopeContext';

function fmt(n: number, d = 1) { return n.toLocaleString('ko-KR', { maximumFractionDigits: d }); }
function fmtKRW(n: number) { return `₩${(n / 100_000_000).toFixed(2)}억`; }
const KRW = (n: number) => `₩${n.toLocaleString('ko-KR')}`;

// 시드 기반 정비/정지 mock (발전소별 안정값)
function maintMockFor(plantId: string) {
  let h = 0; for (let i = 0; i < plantId.length; i++) h = (h * 31 + plantId.charCodeAt(i)) >>> 0;
  const rnd = (n: number) => (h = (h * 1103515245 + 12345) >>> 0) % n;
  return { faultCount: rnd(6), preventiveCount: rnd(8) + 1, downDays: rnd(5) };
}

export default function Report() {
  const { scope } = useScope();
  const plants = useMemo(() => plantsForScope(scope), [scope]);

  const summary = useMemo(() => {
    let energyMWh = 0, salesMWh = 0, revenue = 0, cost = 0;
    let faultCount = 0, preventiveCount = 0, downDays = 0, capacity = 0;
    for (const p of plants) {
      const r = getPlantRevenueBreakdown(p.id);
      const c = getPlantCostBreakdown(p.id);
      const m = maintMockFor(p.id);
      energyMWh += r.monthlyMWh; salesMWh += r.salesMWh;
      revenue += r.totalRevenue; cost += c.total; capacity += p.capacityMW;
      faultCount += m.faultCount; preventiveCount += m.preventiveCount; downDays += m.downDays;
    }
    return { energyMWh, salesMWh, revenue, cost, profit: revenue - cost, faultCount, preventiveCount, downDays, capacity };
  }, [plants]);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-foreground">리포트</h1>
          <p className="text-xs text-muted-foreground mt-0.5">발전·정비·수익 통합 요약 — 구분(발전소별/담당자별/그룹별)으로 조회</p>
        </div>
      </div>




      {/* 요약 카드 */}
      <div>
        <h2 className="text-sm font-semibold mb-2">조회 결과 요약 ({plants.length}개소 · 설비 {fmt(summary.capacity)} MW)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard icon={<Zap />} label="월 발전량" value={`${fmt(summary.energyMWh)} MWh`} sub={`송전 ${fmt(summary.salesMWh)} MWh`} color="primary" />
          <KpiCard icon={<Wrench />} label="정비 건수 (월)" value={`${summary.preventiveCount + summary.faultCount} 건`} sub={`예방 ${summary.preventiveCount} · 장애 ${summary.faultCount}`} color="accent" />
          <KpiCard icon={<AlertTriangle />} label="정지 일수 (월)" value={`${summary.downDays} 일`} sub="고장/정비 누적" color="muted" />
          <KpiCard icon={<TrendingUp />} label="월 수익" value={fmtKRW(summary.profit)} sub={`매출 ${fmtKRW(summary.revenue)} · 비용 ${fmtKRW(summary.cost)}`} color="success" />
        </div>
      </div>

      {/* 발전소별 상세 */}
      <section className="panel">
        <header className="panel-header"><h3 className="panel-title">발전소별 상세 (월간)</h3></header>
        <div className="overflow-auto max-h-[480px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card border-b">
              <tr className="text-left text-muted-foreground">
                <th className="px-3 py-2">발전소</th><th className="px-3 py-2">발전원</th>
                <th className="px-3 py-2 text-right">설비(MW)</th>
                <th className="px-3 py-2 text-right">발전량</th><th className="px-3 py-2 text-right">매전량</th>
                <th className="px-3 py-2 text-right">정비건수</th><th className="px-3 py-2 text-right">정지일</th>
                <th className="px-3 py-2 text-right">매출</th><th className="px-3 py-2 text-right">비용</th>
                <th className="px-3 py-2 text-right font-bold">수익</th>
              </tr>
            </thead>
            <tbody>
              {plants.map(p => {
                const r = getPlantRevenueBreakdown(p.id);
                const c = getPlantCostBreakdown(p.id);
                const m = maintMockFor(p.id);
                const profit = r.totalRevenue - c.total;
                return (
                  <tr key={p.id} className="border-b hover:bg-muted/40">
                    <td className="px-3 py-2 font-medium">{p.name}</td>
                    <td className="px-3 py-2">{ENERGY_LABEL[p.type]}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.capacityMW.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(r.monthlyMWh)} MWh</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(r.salesMWh)} MWh</td>
                    <td className="px-3 py-2 text-right tabular-nums">{m.preventiveCount + m.faultCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{m.downDays}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{KRW(r.totalRevenue)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{KRW(c.total)}</td>
                    <td className={`px-3 py-2 text-right tabular-nums font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>{KRW(profit)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 기존 일/월/연 리포트 미리보기 */}
      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily"><Calendar className="h-4 w-4 mr-1" />일간</TabsTrigger>
          <TabsTrigger value="monthly"><Calendar className="h-4 w-4 mr-1" />월간</TabsTrigger>
          <TabsTrigger value="annual"><Calendar className="h-4 w-4 mr-1" />연간</TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="mt-3"><DailyReport plants={plants} /></TabsContent>
        <TabsContent value="monthly" className="mt-3"><MonthlyReport /></TabsContent>
        <TabsContent value="annual" className="mt-3"><AnnualReport /></TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: 'primary'|'muted'|'success'|'accent' }) {
  const cls = { primary: 'bg-primary/10 text-primary', muted: 'bg-muted text-muted-foreground', success: 'bg-success/10 text-success', accent: 'bg-accent/10 text-accent' }[color];
  return (
    <div className="panel p-3">
      <div className="flex items-center gap-2">
        <span className={`h-9 w-9 rounded-md flex items-center justify-center ${cls}`}>{icon}</span>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
      <div className="text-lg font-bold tabular-nums mt-2">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function ReportFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const handleDownload = () => toast({ title: 'PDF 다운로드', description: '데모 버전에서는 실제 다운로드는 제공되지 않습니다.' });
  return (
    <div className="panel">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-secondary" />
          <div>
            <h3 className="font-semibold text-sm">{title}</h3>
            <div className="text-[10px] text-muted-foreground">{subtitle}</div>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={handleDownload}><Download className="h-4 w-4 mr-1" />PDF 다운로드</Button>
      </div>
      <div className="panel-body bg-muted/20">{children}</div>
    </div>
  );
}

function ReportPaper({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border shadow-md mx-auto max-w-3xl p-8 space-y-4">
      <div className="border-b-2 border-primary pb-3">
        <div className="text-[10px] text-muted-foreground">한국수력원자력 신재생사업처</div>
        <div className="text-lg font-bold text-primary">신재생 발전 운영 리포트</div>
      </div>
      {children}
    </div>
  );
}

function DailyReport({ plants }: { plants: typeof PLANTS }) {
  const date = new Date();
  const totalE = plants.reduce((s, p) => s + getPlantDailyEnergy(p), 0);
  const totalC = plants.reduce((s, p) => s + p.capacityMW, 0);
  return (
    <ReportFrame title={`일간 운영 리포트 - ${date.toLocaleDateString('ko-KR')}`} subtitle="조회 대상 발전소 요약">
      <ReportPaper>
        <h2 className="text-base font-bold">[일간] {date.toLocaleDateString('ko-KR')} 운영 요약</h2>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b"><td className="py-1.5 text-muted-foreground">조회 사업소</td><td className="text-right font-semibold tabular-nums">{plants.length} 개소</td></tr>
            <tr className="border-b"><td className="py-1.5 text-muted-foreground">총 설비용량</td><td className="text-right font-semibold tabular-nums">{fmt(totalC)} MW</td></tr>
            <tr className="border-b"><td className="py-1.5 text-muted-foreground">금일 누적 발전량</td><td className="text-right font-semibold tabular-nums">{fmt(totalE)} MWh</td></tr>
            <tr className="border-b"><td className="py-1.5 text-muted-foreground">평균 이용률</td><td className="text-right font-semibold tabular-nums">{totalC > 0 ? (totalE / (totalC * 24) * 100).toFixed(1) : '0.0'} %</td></tr>
            <tr><td className="py-1.5 text-muted-foreground">예상 매출</td><td className="text-right font-semibold tabular-nums text-primary">{fmtKRW(totalE * 1000 * (PRICE.SMP + PRICE.REC))}</td></tr>
          </tbody>
        </table>
        <div className="text-[10px] text-muted-foreground pt-3">※ 본 리포트는 데모용으로 자동 생성되었습니다. (작성: K-REMS)</div>
      </ReportPaper>
    </ReportFrame>
  );
}

function MonthlyReport() {
  const monthly = getMonthlyEnergyByType();
  const cur = monthly[new Date().getMonth()];
  const total = cur.solar + cur.wind + cur.hydro + cur.fuelcell + cur.ess;
  return (
    <ReportFrame title={`월간 운영 리포트 - ${new Date().getFullYear()}년 ${new Date().getMonth()+1}월`} subtitle="월간 발전 실적 (전체)">
      <ReportPaper>
        <h2 className="text-base font-bold">[월간] {new Date().getFullYear()}년 {new Date().getMonth() + 1}월</h2>
        <p className="text-sm">금월 누적 총 발전량은 <strong className="text-primary tabular-nums">{fmt(total)} MWh</strong> 이며, 예상 매출은 <strong className="text-primary tabular-nums">{fmtKRW(total * 1000 * (PRICE.SMP + PRICE.REC))}</strong>입니다.</p>
        <table className="w-full text-xs border">
          <thead className="bg-muted/40"><tr><th className="text-left p-2">발전원</th><th className="text-right p-2">발전량(MWh)</th><th className="text-right p-2">비중</th></tr></thead>
          <tbody>
            {(['solar','wind','hydro','fuelcell','ess'] as const).map(t => (
              <tr key={t} className="border-t"><td className="p-2">{ENERGY_LABEL[t]}</td><td className="text-right p-2 tabular-nums">{fmt(cur[t])}</td><td className="text-right p-2 tabular-nums">{((cur[t] / total) * 100).toFixed(1)}%</td></tr>
            ))}
          </tbody>
        </table>
      </ReportPaper>
    </ReportFrame>
  );
}

function AnnualReport() {
  const monthly = getMonthlyEnergyByType();
  const ytd = monthly.reduce((s, m) => s + m.solar + m.wind + m.hydro + m.fuelcell + m.ess, 0);
  return (
    <ReportFrame title={`연간 운영 리포트 - ${new Date().getFullYear()}년`} subtitle="YTD 실적 (전체)">
      <ReportPaper>
        <h2 className="text-base font-bold">[연간] {new Date().getFullYear()}년 누적 (YTD)</h2>
        <p className="text-sm">YTD 총 발전량은 <strong className="text-primary tabular-nums">{fmt(ytd)} MWh</strong> 입니다.</p>
        <table className="w-full text-xs border">
          <thead className="bg-muted/40"><tr><th className="text-left p-2">월</th><th className="text-right p-2">총 발전량(MWh)</th></tr></thead>
          <tbody>
            {monthly.map(m => {
              const t = m.solar + m.wind + m.hydro + m.fuelcell + m.ess;
              return <tr key={m.month} className="border-t"><td className="p-2">{m.month}</td><td className="text-right p-2 tabular-nums">{fmt(t)}</td></tr>;
            })}
          </tbody>
        </table>
      </ReportPaper>
    </ReportFrame>
  );
}

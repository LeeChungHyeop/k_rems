import { useState } from 'react';
import { Calendar, ClipboardList, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { PLANTS, ALARMS, ENERGY_LABEL } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface WO {
  id: string;
  plantId: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: '접수' | '진행' | '완료';
  assignee: string;
  due: string;
}

const WORK_ORDERS: WO[] = [
  { id: 'WO-2026-0418', plantId: 'WND-05', title: 'T-03 터빈 진동 점검 및 교체', priority: 'high', status: '진행', assignee: '김OO 차장', due: '2026-05-02' },
  { id: 'WO-2026-0419', plantId: 'ESS-03', title: 'BMS 통신 모듈 교체', priority: 'high', status: '접수', assignee: '이OO 과장', due: '2026-05-03' },
  { id: 'WO-2026-0420', plantId: 'SOL-04', title: '인버터 #7 냉각팬 점검', priority: 'medium', status: '진행', assignee: '박OO 대리', due: '2026-05-05' },
  { id: 'WO-2026-0421', plantId: 'FCL-04', title: '연료전지 스택 정기 정비', priority: 'medium', status: '진행', assignee: '최OO 차장', due: '2026-05-10' },
  { id: 'WO-2026-0415', plantId: 'SOL-06', title: '월간 모듈 청소', priority: 'low', status: '완료', assignee: '정OO 사원', due: '2026-04-28' },
  { id: 'WO-2026-0414', plantId: 'WND-01', title: '블레이드 육안 점검', priority: 'low', status: '완료', assignee: '강OO 대리', due: '2026-04-25' },
  { id: 'WO-2026-0413', plantId: 'FCL-01', title: '스택 효율 측정', priority: 'medium', status: '완료', assignee: '윤OO 과장', due: '2026-04-22' },
];

const SCHEDULE = [
  { date: 5, plant: 'WND-05', title: 'T-03 정비', priority: 'high' },
  { date: 5, plant: 'ESS-03', title: 'BMS 교체', priority: 'high' },
  { date: 8, plant: 'SOL-04', title: '인버터 점검', priority: 'medium' },
  { date: 12, plant: 'FCL-04', title: '스택 정비', priority: 'medium' },
  { date: 15, plant: 'SOL-01', title: '월간 청소', priority: 'low' },
  { date: 18, plant: 'WND-07', title: '블레이드 점검', priority: 'low' },
  { date: 22, plant: 'FCL-01', title: '스택 측정', priority: 'medium' },
  { date: 25, plant: 'SOL-02', title: '월간 PM', priority: 'low' },
];

export default function Maintenance() {
  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">설비 정비관리 (O&M)</h1>
        <p className="text-xs text-muted-foreground mt-0.5">점검 일정, 작업지시서, 알람 이력 통합 관리</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiBox icon={<ClipboardList />} label="진행 중" value={WORK_ORDERS.filter(w => w.status === '진행').length} color="secondary" />
        <KpiBox icon={<Clock />} label="접수" value={WORK_ORDERS.filter(w => w.status === '접수').length} color="warning" />
        <KpiBox icon={<CheckCircle2 />} label="이번달 완료" value={WORK_ORDERS.filter(w => w.status === '완료').length} color="success" />
        <KpiBox icon={<AlertCircle />} label="긴급 알람" value={ALARMS.filter(a => a.level === 'critical').length} color="destructive" />
      </div>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar"><Calendar className="h-4 w-4 mr-1" /> 점검 일정</TabsTrigger>
          <TabsTrigger value="wo"><ClipboardList className="h-4 w-4 mr-1" /> 작업지시서</TabsTrigger>
          <TabsTrigger value="alarm"><AlertCircle className="h-4 w-4 mr-1" /> 알람 이력</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-3">
          <CalendarView />
        </TabsContent>

        <TabsContent value="wo" className="mt-3">
          <div className="panel">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2">WO 번호</th>
                  <th className="px-3 py-2">사업소</th>
                  <th className="px-3 py-2">작업 내용</th>
                  <th className="px-3 py-2">우선순위</th>
                  <th className="px-3 py-2">상태</th>
                  <th className="px-3 py-2">담당자</th>
                  <th className="px-3 py-2">기한</th>
                </tr>
              </thead>
              <tbody>
                {WORK_ORDERS.map(w => {
                  const plant = PLANTS.find(p => p.id === w.plantId);
                  return (
                    <tr key={w.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono text-xs">{w.id}</td>
                      <td className="px-3 py-2"><span className="text-xs text-muted-foreground">[{ENERGY_LABEL[plant!.type]}]</span> {plant?.name}</td>
                      <td className="px-3 py-2">{w.title}</td>
                      <td className="px-3 py-2"><PriorityBadge p={w.priority} /></td>
                      <td className="px-3 py-2"><StatusBadge s={w.status} /></td>
                      <td className="px-3 py-2 text-xs">{w.assignee}</td>
                      <td className="px-3 py-2 tabular-nums text-xs">{w.due}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="alarm" className="mt-3">
          <div className="panel p-2">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2">시간</th>
                  <th className="px-3 py-2">레벨</th>
                  <th className="px-3 py-2">사업소</th>
                  <th className="px-3 py-2">메시지</th>
                </tr>
              </thead>
              <tbody>
                {ALARMS.map(a => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="px-3 py-2 tabular-nums text-xs">{a.time}</td>
                    <td className="px-3 py-2">
                      <Badge variant={a.level === 'critical' ? 'destructive' : a.level === 'warning' ? 'default' : 'secondary'}>{a.level.toUpperCase()}</Badge>
                    </td>
                    <td className="px-3 py-2 font-medium">{a.plantName}</td>
                    <td className="px-3 py-2">{a.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CalendarView() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);

  return (
    <div className="panel">
      <div className="panel-header"><h3 className="panel-title">{year}년 {month + 1}월 점검 일정</h3></div>
      <div className="p-3">
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted-foreground border-b">
          {['일','월','화','수','목','금','토'].map(d => <div key={d} className="py-1.5">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-px bg-border">
          {cells.map((d, i) => {
            const events = d ? SCHEDULE.filter(s => s.date === d) : [];
            const isToday = d === now.getDate();
            return (
              <div key={i} className={`min-h-[88px] p-1.5 bg-card ${isToday ? 'ring-2 ring-secondary ring-inset' : ''}`}>
                {d && <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-secondary' : 'text-foreground'}`}>{d}</div>}
                <div className="space-y-0.5">
                  {events.map((e, j) => (
                    <div key={j} className={`text-[10px] px-1 py-0.5 rounded truncate ${e.priority === 'high' ? 'bg-destructive/15 text-destructive' : e.priority === 'medium' ? 'bg-warning/15 text-warning' : 'bg-secondary/15 text-secondary'}`}>
                      {e.plant}: {e.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KpiBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: 'secondary'|'warning'|'success'|'destructive' }) {
  const cls = { secondary: 'bg-secondary/10 text-secondary', warning: 'bg-warning/10 text-warning', success: 'bg-success/10 text-success', destructive: 'bg-destructive/10 text-destructive' }[color];
  return (
    <div className="panel p-4 flex items-center gap-3">
      <span className={`h-10 w-10 rounded-md flex items-center justify-center ${cls}`}>{icon}</span>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function PriorityBadge({ p }: { p: 'high'|'medium'|'low' }) {
  const map = { high: 'bg-destructive text-destructive-foreground', medium: 'bg-warning text-warning-foreground', low: 'bg-muted text-muted-foreground' };
  const lab = { high: '긴급', medium: '보통', low: '낮음' };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${map[p]}`}>{lab[p]}</span>;
}
function StatusBadge({ s }: { s: '접수'|'진행'|'완료' }) {
  const map = { '접수': 'bg-warning/15 text-warning', '진행': 'bg-secondary/15 text-secondary', '완료': 'bg-success/15 text-success' };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${map[s]}`}>{s}</span>;
}

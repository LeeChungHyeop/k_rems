import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { getPlantMonthly12, type Plant } from '@/data/mockData';

// ============ Types ============
type Result3 = '' | '정상' | '비정상' | '수기입력';
type StatusKV = '○' | '△' | '✓' | '/';
type OnOff = '동작' | '정지';
type YN = '유' | '무';

interface ProcessRow { group: string; item: string; result: Result3; note: string }
interface ImprovementRow { group: string; content: string }
interface OutputRow { month: number; output: number; days: number; note: string }
interface WorkOrderRow { group: string; prev: number; cur: number; note: string }
interface DateRow { y: string; m: string; d: string; inspector: string }

interface InverterRow {
  unit: string; invNo: string;
  dcV: string; acR: string; acS: string; acT: string;
  freq: string; alarm: YN; noise: YN;
  tempHeat: string; tempSc: string;
  fanIgbt: OnOff; fanCab: OnOff;
  rIso: string; note: string;
}
interface JBoxRow {
  unit: string; invNo: string; mjbNo: string; location: string;
  crack: StatusKV; cable: StatusKV; terminal: StatusKV; note: string;
}
interface SwitchgearRow { device: string; item: string; standard: string; result: string; note: string }
interface TransformerRow { device: string; tempIn: string; fan: OnOff; noise: YN; alarm: YN; note: string }
interface RectifierRow { device: string; vIn: string; vOut: string; chargeMode: string; alarm: YN; battery: StatusKV; note: string }

interface PhotoItem { id: string; url: string; name: string; caption: string; category: string }

export interface MonthlyReport {
  header: {
    inspectorOrg: string; inspectorName: string;
    confirmerOrg: string; confirmerName: string;
  };
  processStatus: ProcessRow[];
  improvements: ImprovementRow[];
  monthlyOutput: OutputRow[];
  defects: string;
  workOrders: WorkOrderRow[];
  inspectionDates: DateRow[];
  weeklyRecord: {
    facility: string; voltage: string; capacityKw: string; peakKw: string; pf: string;
    measurement: { ph: 'A'|'B'|'C'; kV: string; A: string; kW: string }[];
    low: Record<string, StatusKV>;
    high: Record<string, StatusKV>;
    detail: Record<string, string>;
    opinion: string;
  };
  monthlySheets: {
    inverters: InverterRow[];
    junctionBoxes: JBoxRow[];
    switchgear: SwitchgearRow[];
    transformers: TransformerRow[];
    rectifiers: RectifierRow[];
  };
  photos: PhotoItem[];
}

// ============ Defaults ============
const PROCESS_DEFAULT: ProcessRow[] = [
  ...['어레이 케이블', '전선관 고정상태', 'Glass 크랙 유무', '정션박스 소손 유무', '모듈 열화상 점검'].map(item => ({ group: '모듈', item, result: '' as Result3, note: '' })),
  ...['외함 크랙 여부', '케이블 결선 및 지지상태', 'FUSE 동작상태', 'SPD 동작상태', '단자 조임 상태', '개별 전류 측정'].map(item => ({ group: '접속함', item, result: '' as Result3, note: '' })),
  ...['직류 입력 전압', '교류 출력 전압', '출력 주파수', '경보 및 이음·이취 여부'].map(item => ({ group: '인버터', item, result: '' as Result3, note: '' })),
  ...['LBS 지시상태 및 핸드 상태', 'VCB 지시램프 및 보호계전기 경보', 'ACB 지시램프 및 보호계전기 경보', '변압기 내부 온도 및 팬 동작', '정류기 입·출력 전압 상태'].map(item => ({ group: '수배전반', item, result: '' as Result3, note: '' })),
];

const WO_DEFAULT: WorkOrderRow[] = ['모듈', '접속함', '인버터', '수배전반'].map(g => ({ group: g, prev: 0, cur: 0, note: '' }));

const MONTH_OUTPUT_DEFAULT: OutputRow[] = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, output: 0, days: 0, note: '' }));

const LOW_ITEMS = ['인입구배선', '배전반', '분전반', '배전용차단기', '누전차단기', '개폐기', '배선', '전동기', '전기용접기', '콘덴서', '전열설비', '조명설비', '기타설비', '예비발전기', '축전장치', '제어장치', '연료상태'];
const HIGH_ITEMS = ['가공전선로', '지중전선로', '수배전개폐기', '배선(모선)', '피뢰기', '변성기', '전력퓨즈', '변압기', '수·배전반', '계전기류', '차단기류', '계측기류', '전력용콘덴서', '접지시설', '보호설비', '부하설비', '기타설비'];

function emptyReport(plant?: Plant): MonthlyReport {
  const monthlyOutput = plant
    ? getPlantMonthly12(plant).map(m => ({ month: m.month, output: m.output, days: m.days, note: '' }))
    : MONTH_OUTPUT_DEFAULT.map(r => ({ ...r }));
  return {
    header: { inspectorOrg: '', inspectorName: '', confirmerOrg: '', confirmerName: '' },
    processStatus: PROCESS_DEFAULT.map(r => ({ ...r })),
    improvements: [],
    monthlyOutput,
    defects: '',
    workOrders: WO_DEFAULT.map(r => ({ ...r })),
    inspectionDates: [{ y: '2025', m: '01', d: '01', inspector: '' }],
    weeklyRecord: {
      facility: '', voltage: '', capacityKw: '', peakKw: '', pf: '100',
      measurement: [
        { ph: 'A', kV: '', A: '', kW: '' },
        { ph: 'B', kV: '', A: '', kW: '' },
        { ph: 'C', kV: '', A: '', kW: '' },
      ],
      low: Object.fromEntries(LOW_ITEMS.map(k => [k, '○' as StatusKV])),
      high: Object.fromEntries(HIGH_ITEMS.map(k => [k, '○' as StatusKV])),
      detail: {},
      opinion: '',
    },
    monthlySheets: {
      inverters: Array.from({ length: 4 }, (_, i) => ({
        unit: '대성메탈 지붕 태양광', invNo: `#${i + 1}`,
        dcV: '', acR: '', acS: '', acT: '', freq: '60', alarm: '무', noise: '무',
        tempHeat: '', tempSc: '', fanIgbt: '동작', fanCab: '동작', rIso: '', note: '',
      })),
      junctionBoxes: Array.from({ length: 5 }, (_, i) => ({
        unit: '대성메탈', invNo: `#${i + 1}`, mjbNo: `MJB0${i + 1}`, location: '접속반',
        crack: '○', cable: '○', terminal: '○', note: '',
      })),
      switchgear: [
        { device: 'HST-01', item: 'LBS 지시상태', standard: 'ON', result: '○', note: '' },
        { device: 'HST-01', item: 'VCB 지시램프', standard: 'ON', result: '○', note: '' },
        { device: 'HST-02', item: 'ACB 지시램프', standard: 'ON', result: '○', note: '' },
        { device: 'LV(소내전원)', item: '입력전압', standard: '342~418V', result: '', note: '' },
      ],
      transformers: [{ device: 'TR1', tempIn: '', fan: '동작', noise: '무', alarm: '무', note: '' }],
      rectifiers: [{ device: 'LV-R', vIn: '', vOut: '', chargeMode: 'FLOAT', alarm: '무', battery: '○', note: '' }],
    },
    photos: [],
  };
}

// ============ Component ============
export function MonthlyReportDialog({
  open, onOpenChange, recordTitle, initial, onSave, plant,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  recordTitle: string;
  initial?: MonthlyReport;
  onSave: (r: MonthlyReport) => void;
  plant?: Plant;
}) {
  const [data, setData] = useState<MonthlyReport>(initial ?? emptyReport(plant));

  const update = <K extends keyof MonthlyReport>(k: K, v: MonthlyReport[K]) => setData(d => ({ ...d, [k]: v }));

  const handleSave = () => {
    const blank = data.processStatus.find(r => !r.result);
    if (blank) { toast.error(`예방정비 처리현황 "${blank.item}" 결과를 선택하세요`); return; }
    const missingNote = data.processStatus.find(r => r.result === '수기입력' && !r.note.trim());
    if (missingNote) { toast.error(`"${missingNote.item}" 수기입력 시 비고를 작성하세요`); return; }
    onSave(data); toast.success('보고서가 저장되었습니다'); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>월간점검 보고서 — {recordTitle}</DialogTitle>
        </DialogHeader>

        <div className="overflow-auto flex-1 pr-2 space-y-3">
          {/* 공통 헤더 */}
          <section className="panel p-3">
            <h4 className="text-sm font-semibold mb-2">공통 정보</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Field label="점검자 소속" value={data.header.inspectorOrg} onChange={v => update('header', { ...data.header, inspectorOrg: v })} />
              <Field label="점검자 이름" value={data.header.inspectorName} onChange={v => update('header', { ...data.header, inspectorName: v })} />
              <Field label="확인자 소속" value={data.header.confirmerOrg} onChange={v => update('header', { ...data.header, confirmerOrg: v })} />
              <Field label="확인자 이름" value={data.header.confirmerName} onChange={v => update('header', { ...data.header, confirmerName: v })} />
            </div>
          </section>

          <Accordion type="multiple" defaultValue={['s1']} className="space-y-2">
            {/* 1. 예방정비 처리현황 */}
            <AccordionItem value="s1" className="panel border-0">
              <AccordionTrigger className="px-3">1. 예방정비 처리현황</AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <ProcessStatusTable rows={data.processStatus} onChange={v => update('processStatus', v)} />
              </AccordionContent>
            </AccordionItem>

            {/* 2. 설비개선사항 */}
            <AccordionItem value="s2" className="panel border-0">
              <AccordionTrigger className="px-3">2. 설비개선사항</AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <ImprovementsTable rows={data.improvements} onChange={v => update('improvements', v)} />
              </AccordionContent>
            </AccordionItem>

            {/* 3. 월간 발전량 분석 */}
            <AccordionItem value="s3" className="panel border-0">
              <AccordionTrigger className="px-3">3. 월간 발전량 분석 <span className="ml-2 text-[10px] text-muted-foreground font-normal">(시스템 등록값 자동 입력 · 필요시 수정 가능)</span></AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <MonthlyOutputTable rows={data.monthlyOutput} onChange={v => update('monthlyOutput', v)} />
              </AccordionContent>
            </AccordionItem>

            {/* 4. 월간 결함 분석 */}
            <AccordionItem value="s4" className="panel border-0">
              <AccordionTrigger className="px-3">4. 월간 결함 분석</AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <Textarea rows={4} value={data.defects} onChange={e => update('defects', e.target.value)} placeholder="특이사항 직접 입력" />
              </AccordionContent>
            </AccordionItem>

            {/* 5. 작업의뢰서 처리현황 */}
            <AccordionItem value="s5" className="panel border-0">
              <AccordionTrigger className="px-3">5. 작업의뢰서 처리현황</AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <WorkOrderTable rows={data.workOrders} onChange={v => update('workOrders', v)} />
              </AccordionContent>
            </AccordionItem>

            {/* 6. 실제 점검일 */}
            <AccordionItem value="s6" className="panel border-0">
              <AccordionTrigger className="px-3">6. 실제 점검일</AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <InspectionDates rows={data.inspectionDates} onChange={v => update('inspectionDates', v)} />
              </AccordionContent>
            </AccordionItem>

            {/* 7. 주간점검결과 기록표 */}
            <AccordionItem value="s7" className="panel border-0">
              <AccordionTrigger className="px-3">7. 주간점검결과 기록표</AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <WeeklyRecord data={data.weeklyRecord} onChange={v => update('weeklyRecord', v)} />
              </AccordionContent>
            </AccordionItem>

            {/* 8. 월간점검표 */}
            <AccordionItem value="s8" className="panel border-0">
              <AccordionTrigger className="px-3">8. 월간점검표</AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <MonthlySheets data={data.monthlySheets} onChange={v => update('monthlySheets', v)} />
              </AccordionContent>
            </AccordionItem>

            {/* 9. 사진 첨부 */}
            <AccordionItem value="s9" className="panel border-0">
              <AccordionTrigger className="px-3">9. 사진 첨부</AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <PhotoUploader photos={data.photos} onChange={v => update('photos', v)} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>닫기</Button>
          <Button onClick={handleSave}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Sub Components ============
function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} className="h-8 text-xs" />
    </div>
  );
}

function ResultSelect({ value, onChange }: { value: Result3; onChange: (v: Result3) => void }) {
  return (
    <Select value={value || undefined} onValueChange={v => onChange(v as Result3)}>
      <SelectTrigger className={`h-7 text-xs w-28 ${!value ? 'border-destructive/60 text-destructive' : ''}`}>
        <SelectValue placeholder="선택" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="정상">정상</SelectItem>
        <SelectItem value="비정상">비정상</SelectItem>
        <SelectItem value="수기입력">수기입력</SelectItem>
      </SelectContent>
    </Select>
  );
}

function StatusSelect({ value, onChange }: { value: StatusKV; onChange: (v: StatusKV) => void }) {
  return (
    <Select value={value} onValueChange={v => onChange(v as StatusKV)}>
      <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="○">○ 적합</SelectItem>
        <SelectItem value="△">△ 요주의</SelectItem>
        <SelectItem value="✓">✓ 부적합</SelectItem>
        <SelectItem value="/">/ 해당없음</SelectItem>
      </SelectContent>
    </Select>
  );
}

function ProcessStatusTable({ rows, onChange }: { rows: ProcessRow[]; onChange: (v: ProcessRow[]) => void }) {
  const upd = (i: number, k: keyof ProcessRow, v: any) => onChange(rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  return (
    <table className="w-full text-xs">
      <thead className="bg-muted/40">
        <tr><th className="px-2 py-1 text-left w-24">구분</th><th className="px-2 py-1 text-left">세부점검항목</th><th className="px-2 py-1 text-left w-32">결과</th><th className="px-2 py-1 text-left">비고</th></tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b">
            <td className="px-2 py-1 font-medium">{r.group}</td>
            <td className="px-2 py-1">{r.item}</td>
            <td className="px-2 py-1"><ResultSelect value={r.result} onChange={v => upd(i, 'result', v)} /></td>
            <td className="px-2 py-1">
              <Input className="h-7 text-xs" value={r.note} disabled={r.result !== '수기입력'} onChange={e => upd(i, 'note', e.target.value)} placeholder={r.result === '수기입력' ? '직접 입력' : ''} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ImprovementsTable({ rows, onChange }: { rows: ImprovementRow[]; onChange: (v: ImprovementRow[]) => void }) {
  const add = () => onChange([...rows, { group: '모듈', content: '' }]);
  const del = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const upd = (i: number, k: keyof ImprovementRow, v: any) => onChange(rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  return (
    <div>
      <table className="w-full text-xs mb-2">
        <thead className="bg-muted/40"><tr><th className="px-2 py-1 text-left w-32">구분</th><th className="px-2 py-1 text-left">설비개선사항</th><th className="w-10"></th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={3} className="text-center text-muted-foreground py-3">행을 추가하세요</td></tr>}
          {rows.map((r, i) => (
            <tr key={i} className="border-b">
              <td className="px-2 py-1">
                <Select value={r.group} onValueChange={v => upd(i, 'group', v)}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{['모듈', '접속함', '인버터', '수배전반', '기타'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </td>
              <td className="px-2 py-1"><Input className="h-7 text-xs" value={r.content} onChange={e => upd(i, 'content', e.target.value)} /></td>
              <td><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => del(i)}><Trash2 className="h-3 w-3" /></Button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button size="sm" variant="outline" onClick={add} className="h-7 gap-1"><Plus className="h-3 w-3" />행 추가</Button>
    </div>
  );
}

function MonthlyOutputTable({ rows, onChange }: { rows: OutputRow[]; onChange: (v: OutputRow[]) => void }) {
  const upd = (i: number, k: keyof OutputRow, v: any) => onChange(rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const totalOut = rows.reduce((s, r) => s + (+r.output || 0), 0);
  const totalDays = rows.reduce((s, r) => s + (+r.days || 0), 0);
  const totalAvg = totalDays ? (totalOut / totalDays).toFixed(2) : '0.00';
  return (
    <table className="w-full text-xs">
      <thead className="bg-muted/40"><tr><th className="px-2 py-1 text-left w-16">월</th><th className="px-2 py-1 text-left">발전량(kWh)</th><th className="px-2 py-1 text-left">발전일</th><th className="px-2 py-1 text-left">평균발전시간</th><th className="px-2 py-1 text-left">비고</th></tr></thead>
      <tbody>
        {rows.map((r, i) => {
          const avg = r.days ? (r.output / r.days).toFixed(2) : '-';
          return (
            <tr key={i} className="border-b">
              <td className="px-2 py-1 font-medium">{r.month}월</td>
              <td className="px-2 py-1"><Input type="number" className="h-7 text-xs" value={r.output || ''} onChange={e => upd(i, 'output', +e.target.value)} /></td>
              <td className="px-2 py-1"><Input type="number" className="h-7 text-xs" value={r.days || ''} onChange={e => upd(i, 'days', +e.target.value)} /></td>
              <td className="px-2 py-1 tabular-nums text-muted-foreground">{avg}</td>
              <td className="px-2 py-1"><Input className="h-7 text-xs" value={r.note} onChange={e => upd(i, 'note', e.target.value)} /></td>
            </tr>
          );
        })}
        <tr className="bg-muted/30 font-semibold">
          <td className="px-2 py-1">합계</td>
          <td className="px-2 py-1 tabular-nums">{totalOut.toLocaleString()}</td>
          <td className="px-2 py-1 tabular-nums">{totalDays}</td>
          <td className="px-2 py-1 tabular-nums">{totalAvg}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  );
}

function WorkOrderTable({ rows, onChange }: { rows: WorkOrderRow[]; onChange: (v: WorkOrderRow[]) => void }) {
  const upd = (i: number, k: keyof WorkOrderRow, v: any) => onChange(rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const tPrev = rows.reduce((s, r) => s + (+r.prev || 0), 0);
  const tCur = rows.reduce((s, r) => s + (+r.cur || 0), 0);
  return (
    <table className="w-full text-xs">
      <thead className="bg-muted/40"><tr><th className="px-2 py-1 text-left w-24">구분</th><th className="px-2 py-1 text-left">이전누계</th><th className="px-2 py-1 text-left">당해기간</th><th className="px-2 py-1 text-left">합계</th><th className="px-2 py-1 text-left">비고</th></tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b">
            <td className="px-2 py-1 font-medium">{r.group}</td>
            <td className="px-2 py-1"><Input type="number" className="h-7 text-xs" value={r.prev || ''} onChange={e => upd(i, 'prev', +e.target.value)} /></td>
            <td className="px-2 py-1"><Input type="number" className="h-7 text-xs" value={r.cur || ''} onChange={e => upd(i, 'cur', +e.target.value)} /></td>
            <td className="px-2 py-1 tabular-nums text-muted-foreground">{(+r.prev || 0) + (+r.cur || 0)}</td>
            <td className="px-2 py-1"><Input className="h-7 text-xs" value={r.note} onChange={e => upd(i, 'note', e.target.value)} /></td>
          </tr>
        ))}
        <tr className="bg-muted/30 font-semibold">
          <td className="px-2 py-1">합계</td>
          <td className="px-2 py-1 tabular-nums">{tPrev}</td>
          <td className="px-2 py-1 tabular-nums">{tCur}</td>
          <td className="px-2 py-1 tabular-nums">{tPrev + tCur}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  );
}

function InspectionDates({ rows, onChange }: { rows: DateRow[]; onChange: (v: DateRow[]) => void }) {
  const years = ['2024', '2025', '2026'];
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const upd = (i: number, k: keyof DateRow, v: string) => onChange(rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  return (
    <div>
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <Select value={r.y} onValueChange={v => upd(i, 'y', v)}><SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}년</SelectItem>)}</SelectContent></Select>
          <Select value={r.m} onValueChange={v => upd(i, 'm', v)}><SelectTrigger className="h-7 text-xs w-16"><SelectValue /></SelectTrigger><SelectContent>{months.map(m => <SelectItem key={m} value={m}>{m}월</SelectItem>)}</SelectContent></Select>
          <Select value={r.d} onValueChange={v => upd(i, 'd', v)}><SelectTrigger className="h-7 text-xs w-16"><SelectValue /></SelectTrigger><SelectContent>{days.map(d => <SelectItem key={d} value={d}>{d}일</SelectItem>)}</SelectContent></Select>
          <Input className="h-7 text-xs flex-1" placeholder="점검자" value={r.inspector} onChange={e => upd(i, 'inspector', e.target.value)} />
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onChange(rows.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
        </div>
      ))}
      <Button size="sm" variant="outline" className="h-7 gap-1 mt-1" onClick={() => onChange([...rows, { y: '2025', m: '01', d: '01', inspector: '' }])}><Plus className="h-3 w-3" />추가</Button>
    </div>
  );
}

function WeeklyRecord({ data, onChange }: { data: MonthlyReport['weeklyRecord']; onChange: (v: MonthlyReport['weeklyRecord']) => void }) {
  const upd = (patch: Partial<MonthlyReport['weeklyRecord']>) => onChange({ ...data, ...patch });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Field label="설비명·상호" value={data.facility} onChange={v => upd({ facility: v })} />
        <Field label="발전설비 전압(V)" value={data.voltage} onChange={v => upd({ voltage: v })} />
        <Field label="용량(kW)" value={data.capacityKw} onChange={v => upd({ capacityKw: v })} />
        <Field label="PEAK(kW)" value={data.peakKw} onChange={v => upd({ peakKw: v })} />
        <Field label="역률(%)" value={data.pf} onChange={v => upd({ pf: v })} />
      </div>

      <div>
        <Label className="text-[11px] text-muted-foreground">측정 (상별 전압·전류·전력)</Label>
        <table className="w-full text-xs mt-1">
          <thead className="bg-muted/40"><tr><th className="px-2 py-1 w-16">상</th><th className="px-2 py-1">전압(kV)</th><th className="px-2 py-1">전류(A)</th><th className="px-2 py-1">전력(kW)</th></tr></thead>
          <tbody>
            {data.measurement.map((m, i) => (
              <tr key={i} className="border-b">
                <td className="px-2 py-1 text-center font-semibold">{m.ph}상</td>
                <td className="px-2 py-1"><Input className="h-7 text-xs" value={m.kV} onChange={e => upd({ measurement: data.measurement.map((x, idx) => idx === i ? { ...x, kV: e.target.value } : x) })} /></td>
                <td className="px-2 py-1"><Input className="h-7 text-xs" value={m.A} onChange={e => upd({ measurement: data.measurement.map((x, idx) => idx === i ? { ...x, A: e.target.value } : x) })} /></td>
                <td className="px-2 py-1"><Input className="h-7 text-xs" value={m.kW} onChange={e => upd({ measurement: data.measurement.map((x, idx) => idx === i ? { ...x, kW: e.target.value } : x) })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <h5 className="text-xs font-semibold mb-1">저압설비</h5>
          <div className="grid grid-cols-2 gap-1">
            {LOW_ITEMS.map(k => (
              <div key={k} className="flex items-center justify-between gap-2 text-xs border-b py-1">
                <span>{k}</span>
                <StatusSelect value={data.low[k] as StatusKV} onChange={v => upd({ low: { ...data.low, [k]: v } })} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h5 className="text-xs font-semibold mb-1">고압설비</h5>
          <div className="grid grid-cols-2 gap-1">
            {HIGH_ITEMS.map(k => (
              <div key={k} className="flex items-center justify-between gap-2 text-xs border-b py-1">
                <span>{k}</span>
                <StatusSelect value={data.high[k] as StatusKV} onChange={v => upd({ high: { ...data.high, [k]: v } })} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <Label className="text-[11px] text-muted-foreground">종합 의견</Label>
        <Textarea rows={3} value={data.opinion} onChange={e => upd({ opinion: e.target.value })} />
      </div>
    </div>
  );
}

function MonthlySheets({ data, onChange }: { data: MonthlyReport['monthlySheets']; onChange: (v: MonthlyReport['monthlySheets']) => void }) {
  return (
    <Tabs defaultValue="inv">
      <TabsList className="grid grid-cols-5 w-full">
        <TabsTrigger value="inv">인버터</TabsTrigger>
        <TabsTrigger value="jb">접속반·다이오드</TabsTrigger>
        <TabsTrigger value="sw">배전반</TabsTrigger>
        <TabsTrigger value="tr">변압기</TabsTrigger>
        <TabsTrigger value="re">정류기</TabsTrigger>
      </TabsList>

      <TabsContent value="inv" className="mt-2">
        <InverterSheet rows={data.inverters} onChange={v => onChange({ ...data, inverters: v })} />
      </TabsContent>
      <TabsContent value="jb" className="mt-2">
        <JBoxSheet rows={data.junctionBoxes} onChange={v => onChange({ ...data, junctionBoxes: v })} />
      </TabsContent>
      <TabsContent value="sw" className="mt-2">
        <SwitchgearSheet rows={data.switchgear} onChange={v => onChange({ ...data, switchgear: v })} />
      </TabsContent>
      <TabsContent value="tr" className="mt-2">
        <TransformerSheet rows={data.transformers} onChange={v => onChange({ ...data, transformers: v })} />
      </TabsContent>
      <TabsContent value="re" className="mt-2">
        <RectifierSheet rows={data.rectifiers} onChange={v => onChange({ ...data, rectifiers: v })} />
      </TabsContent>
    </Tabs>
  );
}

function InverterSheet({ rows, onChange }: { rows: InverterRow[]; onChange: (v: InverterRow[]) => void }) {
  const upd = (i: number, k: keyof InverterRow, v: any) => onChange(rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const add = () => onChange([...rows, { unit: '', invNo: `#${rows.length + 1}`, dcV: '', acR: '', acS: '', acT: '', freq: '60', alarm: '무', noise: '무', tempHeat: '', tempSc: '', fanIgbt: '동작', fanCab: '동작', rIso: '', note: '' }]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] min-w-[1100px]">
        <thead className="bg-muted/40">
          <tr>
            <th className="px-1.5 py-1">호기</th><th className="px-1.5 py-1">인버터</th>
            <th className="px-1.5 py-1">DC입력V<br/>(430~1000)</th>
            <th className="px-1.5 py-1">AC R</th><th className="px-1.5 py-1">AC S</th><th className="px-1.5 py-1">AC T<br/>(342~418)</th>
            <th className="px-1.5 py-1">주파수<br/>(59.9~60.1)</th>
            <th className="px-1.5 py-1">경보</th><th className="px-1.5 py-1">이음·이취</th>
            <th className="px-1.5 py-1">T-Heatsink<br/>(≤110℃)</th><th className="px-1.5 py-1">Temp sc<br/>(≤70℃)</th>
            <th className="px-1.5 py-1">IGBT팬</th><th className="px-1.5 py-1">캐비넷팬</th>
            <th className="px-1.5 py-1">R-Iso<br/>(≥1㏁)</th>
            <th className="px-1.5 py-1">비고</th><th className="w-8"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b">
              <td className="px-1 py-0.5"><Input className="h-7 text-xs w-24" value={r.unit} onChange={e => upd(i, 'unit', e.target.value)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs w-16" value={r.invNo} onChange={e => upd(i, 'invNo', e.target.value)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs w-16" value={r.dcV} onChange={e => upd(i, 'dcV', e.target.value)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs w-14" value={r.acR} onChange={e => upd(i, 'acR', e.target.value)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs w-14" value={r.acS} onChange={e => upd(i, 'acS', e.target.value)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs w-14" value={r.acT} onChange={e => upd(i, 'acT', e.target.value)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs w-14" value={r.freq} onChange={e => upd(i, 'freq', e.target.value)} /></td>
              <td className="px-1 py-0.5"><YNSel value={r.alarm} onChange={v => upd(i, 'alarm', v)} /></td>
              <td className="px-1 py-0.5"><YNSel value={r.noise} onChange={v => upd(i, 'noise', v)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs w-14" value={r.tempHeat} onChange={e => upd(i, 'tempHeat', e.target.value)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs w-14" value={r.tempSc} onChange={e => upd(i, 'tempSc', e.target.value)} /></td>
              <td className="px-1 py-0.5"><OnOffSel value={r.fanIgbt} onChange={v => upd(i, 'fanIgbt', v)} /></td>
              <td className="px-1 py-0.5"><OnOffSel value={r.fanCab} onChange={v => upd(i, 'fanCab', v)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs w-14" value={r.rIso} onChange={e => upd(i, 'rIso', e.target.value)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs w-24" value={r.note} onChange={e => upd(i, 'note', e.target.value)} /></td>
              <td><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onChange(rows.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button size="sm" variant="outline" className="h-7 gap-1 mt-2" onClick={add}><Plus className="h-3 w-3" />호기 추가</Button>
    </div>
  );
}

function JBoxSheet({ rows, onChange }: { rows: JBoxRow[]; onChange: (v: JBoxRow[]) => void }) {
  const upd = (i: number, k: keyof JBoxRow, v: any) => onChange(rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const add = () => onChange([...rows, { unit: '', invNo: '', mjbNo: `MJB${String(rows.length + 1).padStart(2, '0')}`, location: '접속반', crack: '○', cable: '○', terminal: '○', note: '' }]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-muted/40"><tr><th className="px-2 py-1">호기</th><th className="px-2 py-1">인버터</th><th className="px-2 py-1">접속반번호</th><th className="px-2 py-1">점검개소</th><th className="px-2 py-1">외함 CRACK</th><th className="px-2 py-1">케이블 결선·지지</th><th className="px-2 py-1">단자 조임</th><th className="px-2 py-1">비고</th><th className="w-8"></th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b">
              <td className="px-1 py-0.5"><Input className="h-7 text-xs w-24" value={r.unit} onChange={e => upd(i, 'unit', e.target.value)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs w-16" value={r.invNo} onChange={e => upd(i, 'invNo', e.target.value)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs w-20" value={r.mjbNo} onChange={e => upd(i, 'mjbNo', e.target.value)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs w-20" value={r.location} onChange={e => upd(i, 'location', e.target.value)} /></td>
              <td className="px-1 py-0.5"><StatusSelect value={r.crack} onChange={v => upd(i, 'crack', v)} /></td>
              <td className="px-1 py-0.5"><StatusSelect value={r.cable} onChange={v => upd(i, 'cable', v)} /></td>
              <td className="px-1 py-0.5"><StatusSelect value={r.terminal} onChange={v => upd(i, 'terminal', v)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs" value={r.note} onChange={e => upd(i, 'note', e.target.value)} /></td>
              <td><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onChange(rows.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button size="sm" variant="outline" className="h-7 gap-1 mt-2" onClick={add}><Plus className="h-3 w-3" />접속반 추가</Button>
    </div>
  );
}

function SwitchgearSheet({ rows, onChange }: { rows: SwitchgearRow[]; onChange: (v: SwitchgearRow[]) => void }) {
  const upd = (i: number, k: keyof SwitchgearRow, v: any) => onChange(rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const add = () => onChange([...rows, { device: '', item: '', standard: '', result: '', note: '' }]);
  return (
    <div>
      <table className="w-full text-xs">
        <thead className="bg-muted/40"><tr><th className="px-2 py-1 text-left w-32">대상기기</th><th className="px-2 py-1 text-left">점검내용</th><th className="px-2 py-1 text-left w-28">기준치</th><th className="px-2 py-1 text-left w-32">점검결과</th><th className="px-2 py-1 text-left">비고</th><th className="w-8"></th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b">
              <td className="px-1 py-0.5"><Input className="h-7 text-xs" value={r.device} onChange={e => upd(i, 'device', e.target.value)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs" value={r.item} onChange={e => upd(i, 'item', e.target.value)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs" value={r.standard} onChange={e => upd(i, 'standard', e.target.value)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs" value={r.result} onChange={e => upd(i, 'result', e.target.value)} placeholder="○/△/X 또는 수치" /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs" value={r.note} onChange={e => upd(i, 'note', e.target.value)} /></td>
              <td><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onChange(rows.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button size="sm" variant="outline" className="h-7 gap-1 mt-2" onClick={add}><Plus className="h-3 w-3" />항목 추가</Button>
    </div>
  );
}

function TransformerSheet({ rows, onChange }: { rows: TransformerRow[]; onChange: (v: TransformerRow[]) => void }) {
  const upd = (i: number, k: keyof TransformerRow, v: any) => onChange(rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const add = () => onChange([...rows, { device: `TR${rows.length + 1}`, tempIn: '', fan: '동작', noise: '무', alarm: '무', note: '' }]);
  return (
    <div>
      <table className="w-full text-xs">
        <thead className="bg-muted/40"><tr><th className="px-2 py-1 text-left w-24">대상기기</th><th className="px-2 py-1 text-left">TR 내부온도<br/>(≤155℃)</th><th className="px-2 py-1 text-left">팬 동작</th><th className="px-2 py-1 text-left">이음·이취</th><th className="px-2 py-1 text-left">경보</th><th className="px-2 py-1 text-left">비고</th><th className="w-8"></th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b">
              <td className="px-1 py-0.5"><Input className="h-7 text-xs" value={r.device} onChange={e => upd(i, 'device', e.target.value)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs" value={r.tempIn} onChange={e => upd(i, 'tempIn', e.target.value)} /></td>
              <td className="px-1 py-0.5"><OnOffSel value={r.fan} onChange={v => upd(i, 'fan', v)} /></td>
              <td className="px-1 py-0.5"><YNSel value={r.noise} onChange={v => upd(i, 'noise', v)} /></td>
              <td className="px-1 py-0.5"><YNSel value={r.alarm} onChange={v => upd(i, 'alarm', v)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs" value={r.note} onChange={e => upd(i, 'note', e.target.value)} /></td>
              <td><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onChange(rows.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button size="sm" variant="outline" className="h-7 gap-1 mt-2" onClick={add}><Plus className="h-3 w-3" />TR 추가</Button>
    </div>
  );
}

function RectifierSheet({ rows, onChange }: { rows: RectifierRow[]; onChange: (v: RectifierRow[]) => void }) {
  const upd = (i: number, k: keyof RectifierRow, v: any) => onChange(rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const add = () => onChange([...rows, { device: '', vIn: '', vOut: '', chargeMode: 'FLOAT', alarm: '무', battery: '○', note: '' }]);
  return (
    <div>
      <table className="w-full text-xs">
        <thead className="bg-muted/40"><tr><th className="px-2 py-1 text-left w-24">대상기기</th><th className="px-2 py-1 text-left">입력전압<br/>(198~242 VAC)</th><th className="px-2 py-1 text-left">출력전압<br/>(116~128 VDC)</th><th className="px-2 py-1 text-left">충전모드</th><th className="px-2 py-1 text-left">경보</th><th className="px-2 py-1 text-left">축전지 육안</th><th className="px-2 py-1 text-left">비고</th><th className="w-8"></th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b">
              <td className="px-1 py-0.5"><Input className="h-7 text-xs" value={r.device} onChange={e => upd(i, 'device', e.target.value)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs" value={r.vIn} onChange={e => upd(i, 'vIn', e.target.value)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs" value={r.vOut} onChange={e => upd(i, 'vOut', e.target.value)} /></td>
              <td className="px-1 py-0.5">
                <Select value={r.chargeMode} onValueChange={v => upd(i, 'chargeMode', v)}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{['FLOAT', 'EQUAL', 'BOOST'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </td>
              <td className="px-1 py-0.5"><YNSel value={r.alarm} onChange={v => upd(i, 'alarm', v)} /></td>
              <td className="px-1 py-0.5"><StatusSelect value={r.battery} onChange={v => upd(i, 'battery', v)} /></td>
              <td className="px-1 py-0.5"><Input className="h-7 text-xs" value={r.note} onChange={e => upd(i, 'note', e.target.value)} /></td>
              <td><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onChange(rows.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button size="sm" variant="outline" className="h-7 gap-1 mt-2" onClick={add}><Plus className="h-3 w-3" />정류기 추가</Button>
    </div>
  );
}

function YNSel({ value, onChange }: { value: YN; onChange: (v: YN) => void }) {
  return (
    <Select value={value} onValueChange={v => onChange(v as YN)}>
      <SelectTrigger className="h-7 text-xs w-16"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="유">유</SelectItem><SelectItem value="무">무</SelectItem></SelectContent>
    </Select>
  );
}
function OnOffSel({ value, onChange }: { value: OnOff; onChange: (v: OnOff) => void }) {
  return (
    <Select value={value} onValueChange={v => onChange(v as OnOff)}>
      <SelectTrigger className="h-7 text-xs w-16"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="동작">동작</SelectItem><SelectItem value="정지">정지</SelectItem></SelectContent>
    </Select>
  );
}

function PhotoUploader({ photos, onChange }: { photos: PhotoItem[]; onChange: (v: PhotoItem[]) => void }) {
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newPhotos: PhotoItem[] = Array.from(files).map(f => ({
      id: crypto.randomUUID(), url: URL.createObjectURL(f), name: f.name, caption: '', category: '점검',
    }));
    onChange([...photos, ...newPhotos]);
  };
  return (
    <div>
      <label className="inline-flex items-center gap-2 px-3 py-1.5 border rounded cursor-pointer hover:bg-muted/50 text-xs">
        <Upload className="h-3.5 w-3.5" /> 사진 업로드
        <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
        {photos.map((p, i) => (
          <div key={p.id} className="border rounded overflow-hidden">
            <div className="relative aspect-video bg-muted">
              <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
              <Button size="icon" variant="destructive" className="h-6 w-6 absolute top-1 right-1" onClick={() => onChange(photos.filter(x => x.id !== p.id))}><X className="h-3 w-3" /></Button>
            </div>
            <div className="p-1.5 space-y-1">
              <Select value={p.category} onValueChange={v => onChange(photos.map(x => x.id === p.id ? { ...x, category: v } : x))}>
                <SelectTrigger className="h-6 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>{['드론', '모듈', '접속함', '인버터', '수배전반', '점검', '기타'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Input className="h-6 text-[10px]" placeholder="캡션" value={p.caption} onChange={e => onChange(photos.map(x => x.id === p.id ? { ...x, caption: e.target.value } : x))} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

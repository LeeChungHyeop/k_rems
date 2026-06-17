import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FAULT_RECORDS, PLANTS, PRICE, ENERGY_LABEL, DEVICE_SUBCATEGORIES, getAlarmHistory, type FaultRecord, type DeviceCategory } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, AlertTriangle, Wallet, TrendingDown, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const CAPACITY_FACTOR_LOCAL: Record<string, number> = { solar: 0.16, wind: 0.27, hydro: 0.32, fuelcell: 0.85, ess: 0.18 };

function fmt(n: number) { return n.toLocaleString('ko-KR'); }

type FormState = {
  plantId: string;
  deviceCategory: DeviceCategory;
  deviceSubcategory: string;
  deviceDetail: string;
  faultStart: string;
  faultExpectedEnd: string;
  faultEnd: string;
  description: string;
  relatedAlarmId: string;
};

const emptyForm = (): FormState => ({
  plantId: PLANTS[0].id,
  deviceCategory: '발전설비',
  deviceSubcategory: DEVICE_SUBCATEGORIES['발전설비'][0],
  deviceDetail: '',
  faultStart: '',
  faultExpectedEnd: '',
  faultEnd: '',
  description: '',
  relatedAlarmId: '',
});

function calcLoss(plantId: string, start: string, end: string) {
  const plant = PLANTS.find(p => p.id === plantId)!;
  const hours = (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000;
  if (hours <= 0) return { lost: 0, krw: 0 };
  const cf = CAPACITY_FACTOR_LOCAL[plant.type];
  const lost = +(plant.capacityMW * hours * cf * 0.4).toFixed(2);
  const krw = Math.round(lost * 1000 * (PRICE.SMP + PRICE.REC));
  return { lost, krw };
}

export default function FaultRegistration() {
  const [searchParams] = useSearchParams();
  const alarmIdParam = searchParams.get('alarmId');
  const alarms = useMemo(() => getAlarmHistory(), []);
  const [records, setRecords] = useState<FaultRecord[]>(FAULT_RECORDS);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // URL ?alarmId=... 자동 적용
  useEffect(() => {
    if (!alarmIdParam) return;
    const al = alarms.find(a => a.id === alarmIdParam);
    if (!al) return;
    setEditingId(null);
    setForm({
      ...emptyForm(),
      plantId: al.plantId,
      description: `[알람 ${al.id}] ${al.message}`,
      relatedAlarmId: al.id,
    });
    setOpen(true);
  }, [alarmIdParam, alarms]);

  const totals = useMemo(() => ({
    open: records.filter(r => r.status === 'open').length,
    totalLoss: records.reduce((s, r) => s + r.lostRevenueKRW, 0),
    totalEnergyLoss: records.reduce((s, r) => s + r.lostEnergyMWh, 0),
  }), [records]);

  const openNew = () => { setEditingId(null); setForm(emptyForm()); setOpen(true); };

  const openEdit = (r: FaultRecord) => {
    setEditingId(r.id);
    setForm({
      plantId: r.plantId,
      deviceCategory: r.deviceCategory,
      deviceSubcategory: r.deviceSubcategory,
      deviceDetail: r.deviceDetail,
      faultStart: r.faultStart,
      faultExpectedEnd: r.faultExpectedEnd,
      faultEnd: r.faultEnd ?? '',
      description: r.description,
      relatedAlarmId: r.relatedAlarmId ?? '',
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.faultStart || !form.faultExpectedEnd || !form.deviceDetail) {
      toast.error('필수 항목(발생일시·복구예정일시·설비세부)을 입력하세요'); return;
    }
    const plant = PLANTS.find(p => p.id === form.plantId)!;
    const isResolved = !!form.faultEnd;
    let lost = 0, krw = 0;
    if (isResolved) {
      const r = calcLoss(form.plantId, form.faultStart, form.faultEnd);
      if (r.lost === 0) { toast.error('복구완료일시가 발생일시 이후여야 합니다'); return; }
      lost = r.lost; krw = r.krw;
    }
    const deviceName = `${form.deviceSubcategory} ${form.deviceDetail}`.trim();

    if (editingId) {
      setRecords(records.map(r => r.id === editingId ? {
        ...r, plantId: plant.id, plantName: plant.name, type: plant.type,
        deviceCategory: form.deviceCategory, deviceSubcategory: form.deviceSubcategory,
        deviceDetail: form.deviceDetail, deviceName,
        faultStart: form.faultStart, faultExpectedEnd: form.faultExpectedEnd,
        faultEnd: form.faultEnd || undefined,
        description: form.description,
        lostEnergyMWh: lost, lostRevenueKRW: krw,
        status: isResolved ? 'resolved' : 'open',
        relatedAlarmId: form.relatedAlarmId || undefined,
      } : r));
      toast.success(isResolved ? `수정 완료 — 손실액 ₩${fmt(krw)}` : '수정 완료 (진행중)');
    } else {
      const newRec: FaultRecord = {
        id: `FT-${new Date().getFullYear()}-${String(records.length + 1).padStart(4, '0')}`,
        plantId: plant.id, plantName: plant.name, type: plant.type,
        deviceCategory: form.deviceCategory, deviceSubcategory: form.deviceSubcategory,
        deviceDetail: form.deviceDetail, deviceName,
        faultStart: form.faultStart, faultExpectedEnd: form.faultExpectedEnd,
        faultEnd: form.faultEnd || undefined,
        description: form.description,
        lostEnergyMWh: lost, lostRevenueKRW: krw,
        status: isResolved ? 'resolved' : 'open',
        relatedAlarmId: form.relatedAlarmId || undefined,
      };
      setRecords([newRec, ...records]);
      toast.success(isResolved ? `등록 완료 — 손실액 ₩${fmt(krw)}` : '등록 완료 (진행중)');
    }
    setOpen(false);
  };

  const toggleSel = (id: string) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSelected(n);
  };
  const toggleAll = () => {
    if (selected.size === records.length) setSelected(new Set());
    else setSelected(new Set(records.map(r => r.id)));
  };
  const deleteSelected = () => {
    if (selected.size === 0) return;
    if (!confirm(`선택한 ${selected.size}건을 삭제하시겠습니까?`)) return;
    setRecords(records.filter(r => !selected.has(r.id)));
    setSelected(new Set());
    toast.success('선택 항목이 삭제되었습니다');
  };

  const subOptions = DEVICE_SUBCATEGORIES[form.deviceCategory];

  return (
    <div className="p-4 lg:p-5">
      <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">장애 등록</h1>
          <p className="text-xs text-muted-foreground mt-0.5">발생 → 복구예정 등록 후 복구완료일시 입력 시 손실액 자동 계산 · 행 더블클릭 시 수정</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button variant="destructive" className="gap-1" onClick={deleteSelected}>
              <Trash2 className="h-4 w-4" />선택 삭제 ({selected.size})
            </Button>
          )}
          <Button className="gap-1" onClick={openNew}><Plus className="h-4 w-4" />장애 등록</Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? '장애 수정' : '신규 장애 등록'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>발전소</Label>
              <Select value={form.plantId} onValueChange={(v) => setForm({ ...form, plantId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {PLANTS.map(p => <SelectItem key={p.id} value={p.id}>[{ENERGY_LABEL[p.type]}] {p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>설비 분류</Label>
                <Select value={form.deviceCategory} onValueChange={(v) => {
                  const cat = v as DeviceCategory;
                  setForm({ ...form, deviceCategory: cat, deviceSubcategory: DEVICE_SUBCATEGORIES[cat][0] });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DEVICE_SUBCATEGORIES) as DeviceCategory[]).map(c =>
                      <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>설비 세부분류</Label>
                <Select value={form.deviceSubcategory} onValueChange={(v) => setForm({ ...form, deviceSubcategory: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {subOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>설비 세부(번호 등)</Label>
              <Input value={form.deviceDetail} onChange={(e) => setForm({ ...form, deviceDetail: e.target.value })} placeholder="예: #7, T-03, Rack #2" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>발생일시</Label>
                <Input type="datetime-local" value={form.faultStart} onChange={(e) => setForm({ ...form, faultStart: e.target.value })} />
              </div>
              <div>
                <Label>복구예정일시</Label>
                <Input type="datetime-local" value={form.faultExpectedEnd} onChange={(e) => setForm({ ...form, faultExpectedEnd: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>복구완료일시 <span className="text-[10px] text-muted-foreground">(입력 시 복구완료 처리 + 손실액 계산)</span></Label>
              <Input type="datetime-local" value={form.faultEnd} onChange={(e) => setForm({ ...form, faultEnd: e.target.value })} />
            </div>
            <div>
              <Label>관련 알람 <span className="text-[10px] text-muted-foreground">(선택사항)</span></Label>
              <Select value={form.relatedAlarmId || 'NONE'} onValueChange={(v) => setForm({ ...form, relatedAlarmId: v === 'NONE' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="알람 선택 (선택사항)" /></SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  <SelectItem value="NONE">선택 안함</SelectItem>
                  {alarms.slice(0, 60).map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      [{a.id}] {a.plantName} · {a.message.slice(0, 30)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>장애 내용</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="원인, 조치 등" />
            </div>
            <div className="text-[11px] text-muted-foreground bg-muted/50 p-2 rounded-md">
              💡 손실액 = 설비용량 × 정지시간 × 평균이용률 × 0.4 × (SMP {PRICE.SMP} + REC {PRICE.REC} 원/kWh)
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
            <Button onClick={handleSave}>{editingId ? '수정 저장' : '등록'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <SummaryCard icon={<AlertTriangle className="h-4 w-4" />} label="진행 중인 장애" value={`${totals.open}건`} accent="destructive" />
        <SummaryCard icon={<TrendingDown className="h-4 w-4" />} label="누적 발전 손실" value={`${totals.totalEnergyLoss.toFixed(1)} MWh`} accent="warning" />
        <SummaryCard icon={<Wallet className="h-4 w-4" />} label="누적 손실 매출액" value={`₩${fmt(Math.round(totals.totalLoss / 1_000_000))}M`} accent="primary" />
      </div>

      <section className="panel">
        <header className="panel-header">
          <h3 className="panel-title">장애 등록 목록 ({records.length}건) · 행 더블클릭 시 수정</h3>
        </header>
        <div className="overflow-auto max-h-[600px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card border-b">
              <tr className="text-left text-muted-foreground">
                <th className="px-3 py-2 w-8">
                  <Checkbox checked={selected.size > 0 && selected.size === records.length} onCheckedChange={toggleAll} />
                </th>
                <th className="px-3 py-2">장애ID</th>
                <th className="px-3 py-2">발전소</th>
                <th className="px-3 py-2">설비분류</th>
                <th className="px-3 py-2">고장설비</th>
                <th className="px-3 py-2">발생 / 예정 / 완료</th>
                <th className="px-3 py-2 text-right">정지시간</th>
                <th className="px-3 py-2 text-right">손실 (MWh)</th>
                <th className="px-3 py-2 text-right">손실액 (원)</th>
                <th className="px-3 py-2">상태</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => {
                const hours = r.faultEnd ? (new Date(r.faultEnd).getTime() - new Date(r.faultStart).getTime()) / 3_600_000 : null;
                return (
                  <tr key={r.id} className="border-b hover:bg-muted/40 cursor-pointer" onDoubleClick={() => openEdit(r)}>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleSel(r.id)} />
                    </td>
                    <td className="px-3 py-2 font-mono">{r.id}</td>
                    <td className="px-3 py-2 font-medium">{r.plantName}</td>
                    <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{r.deviceCategory} · {r.deviceSubcategory}</Badge></td>
                    <td className="px-3 py-2">{r.deviceDetail}</td>
                    <td className="px-3 py-2 text-[11px] text-muted-foreground">
                      <div>발생: {new Date(r.faultStart).toLocaleString('ko-KR')}</div>
                      <div>예정: {new Date(r.faultExpectedEnd).toLocaleString('ko-KR')}</div>
                      <div>완료: {r.faultEnd ? new Date(r.faultEnd).toLocaleString('ko-KR') : <span className="text-warning">미완료</span>}</div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{hours !== null ? `${hours.toFixed(1)}h` : '-'}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-warning font-medium">{r.lostEnergyMWh > 0 ? r.lostEnergyMWh.toFixed(1) : '-'}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-destructive">{r.lostRevenueKRW > 0 ? `₩${fmt(r.lostRevenueKRW)}` : '-'}</td>
                    <td className="px-3 py-2">{r.status === 'open' ? <Badge variant="destructive">진행중</Badge> : <Badge variant="outline" className="text-success border-success">복구완료</Badge>}</td>
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr><td colSpan={10} className="text-center py-8 text-muted-foreground">등록된 장애가 없습니다</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: 'destructive' | 'warning' | 'primary' }) {
  const cls = { destructive: 'bg-destructive/10 text-destructive', warning: 'bg-warning/10 text-warning', primary: 'bg-primary/10 text-primary' }[accent];
  return (
    <div className="panel p-4 flex items-center gap-3">
      <span className={`inline-flex h-10 w-10 rounded-md items-center justify-center ${cls}`}>{icon}</span>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

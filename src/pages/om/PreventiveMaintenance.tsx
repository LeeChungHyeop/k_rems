import { useMemo, useState } from 'react';
import { MAINTENANCE_RECORDS, PLANTS, type MaintenanceRecord, type InspectionKind } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, CalendarCheck, Calendar as CalendarIcon, ClipboardList, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { ScopeFilter, defaultScope, plantsForScope, type ScopeQuery } from '@/components/ScopeFilter';
import { MonthlyReportDialog, type MonthlyReport } from '@/components/om/MonthlyReportDialog';

const CATEGORIES: InspectionKind[] = ['월간점검', '분기점검', '연간점검', '특별점검', '정기검사'];
const NEEDS_SUBKIND = (c: InspectionKind) => c === '특별점검' || c === '정기검사';

export default function PreventiveMaintenance() {
  const [records, setRecords] = useState<MaintenanceRecord[]>(MAINTENANCE_RECORDS);
  const [reports, setReports] = useState<Record<string, MonthlyReport>>({});
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null);
  const [reportFor, setReportFor] = useState<MaintenanceRecord | null>(null);

  const [scope, setScope] = useState<ScopeQuery>(defaultScope());
  const [form, setForm] = useState({
    category: '월간점검' as InspectionKind, subKind: '',
    scheduledDate: '', completedDate: '', inspector: '', notes: '',
  });

  const targetPlants = useMemo(() => plantsForScope(scope), [scope]);

  const saveEdit = () => {
    if (!editing) return;
    setRecords(records.map(r => r.id === editing.id ? editing : r));
    toast.success('수정사항이 저장되었습니다');
    setEditing(null);
  };

  const toggleSel = (id: string) => {
    const n = new Set(selected); if (n.has(id)) n.delete(id); else n.add(id); setSelected(n);
  };
  const toggleAll = () => {
    if (selected.size === records.length) setSelected(new Set());
    else setSelected(new Set(records.map(r => r.id)));
  };
  const deleteSelected = () => {
    if (!selected.size) return;
    if (!confirm(`선택한 ${selected.size}건을 삭제하시겠습니까?`)) return;
    setRecords(records.filter(r => !selected.has(r.id)));
    setSelected(new Set());
    toast.success('선택 항목이 삭제되었습니다');
  };

  const totals = {
    pending: records.filter(r => r.result === 'pending' || !r.completedDate).length,
    pass: records.filter(r => r.result === 'pass').length,
    fail: records.filter(r => r.result === 'fail').length,
  };

  const handleAdd = () => {
    if (!form.scheduledDate || !form.inspector) { toast.error('점검 예정일과 담당자를 입력하세요'); return; }
    if (NEEDS_SUBKIND(form.category) && !form.subKind) { toast.error(`${form.category === '특별점검' ? '점검종류' : '검사종류'}를 입력하세요`); return; }
    if (targetPlants.length === 0) { toast.error('대상 발전소를 선택하세요'); return; }

    const base = records.length;
    const newRecs: MaintenanceRecord[] = targetPlants.map((p, i) => ({
      id: `MT-${new Date().getFullYear()}-${String(base + i + 1).padStart(3, '0')}`,
      plantId: p.id, plantName: p.name, type: p.type,
      category: form.category,
      subKind: NEEDS_SUBKIND(form.category) ? form.subKind : undefined,
      scheduledDate: form.scheduledDate,
      completedDate: form.completedDate || undefined,
      inspector: form.inspector, notes: form.notes,
      result: form.completedDate ? 'pass' : 'pending',
    }));
    setRecords([...newRecs, ...records]);
    setOpen(false);
    setForm({ category: '월간점검', subKind: '', scheduledDate: '', completedDate: '', inspector: '', notes: '' });
    setScope(defaultScope());
    toast.success(`${newRecs.length}개 발전소 점검 일정이 등록되었습니다`);
  };

  const markComplete = (id: string, result: 'pass' | 'fail') => {
    setRecords(records.map(r => r.id === id ? { ...r, completedDate: new Date().toISOString().slice(0, 10), result } : r));
    toast.success(result === 'pass' ? '점검 완료(합격) 처리됨' : '점검 완료(불합격) 처리됨');
  };

  return (
    <div className="p-4 lg:p-5">
      <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">예방정비</h1>
          <p className="text-xs text-muted-foreground mt-0.5">월간/분기/연간/특별점검·정기검사 일정 등록 및 보고서 작성</p>
        </div>
        <div className="flex gap-2 items-start">
          {selected.size > 0 && (
            <Button variant="destructive" className="gap-1" onClick={deleteSelected}>
              <Trash2 className="h-4 w-4" />선택 삭제 ({selected.size})
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-1"><Plus className="h-4 w-4" />점검 일정 등록</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>예방정비 등록</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <Label>대상 (구분에서 발전소/그룹/담당자별로 다중 선택)</Label>
                  <div className="mt-1">
                    <ScopeFilter value={scope} onApply={setScope} title="대상 구분" />
                    <div className="text-[11px] text-muted-foreground -mt-2">선택된 발전소: <b className="text-foreground">{targetPlants.length}개</b></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>점검 구분</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as InspectionKind, subKind: '' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {NEEDS_SUBKIND(form.category) && (
                    <div>
                      <Label>{form.category === '특별점검' ? '점검종류' : '검사종류'}</Label>
                      <Input value={form.subKind} onChange={(e) => setForm({ ...form, subKind: e.target.value })} placeholder={form.category === '특별점검' ? '예: 낙뢰 피해' : '예: 전기설비 정기검사'} />
                    </div>
                  )}
                </div>

                {!NEEDS_SUBKIND(form.category) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>점검 예정일</Label>
                      <Input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
                    </div>
                    <div>
                      <Label>완료일 (선택)</Label>
                      <Input type="date" value={form.completedDate} onChange={(e) => setForm({ ...form, completedDate: e.target.value })} />
                    </div>
                  </div>
                )}
                {NEEDS_SUBKIND(form.category) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>점검 예정일</Label>
                      <Input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
                    </div>
                    <div>
                      <Label>완료일 (선택)</Label>
                      <Input type="date" value={form.completedDate} onChange={(e) => setForm({ ...form, completedDate: e.target.value })} />
                    </div>
                  </div>
                )}

                <div>
                  <Label>담당자</Label>
                  <Input value={form.inspector} onChange={(e) => setForm({ ...form, inspector: e.target.value })} placeholder="홍길동" />
                </div>
                <div>
                  <Label>비고</Label>
                  <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
                <Button onClick={handleAdd}>등록</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card icon={<CalendarIcon className="h-4 w-4" />} label="예정/진행" value={totals.pending} accent="warning" />
        <Card icon={<CalendarCheck className="h-4 w-4" />} label="합격" value={totals.pass} accent="success" />
        <Card icon={<ClipboardList className="h-4 w-4" />} label="불합격" value={totals.fail} accent="destructive" />
      </div>

      <section className="panel">
        <header className="panel-header"><h3 className="panel-title">예방정비 일정 ({records.length}건)</h3></header>
        <div className="overflow-auto max-h-[600px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card border-b">
              <tr className="text-left text-muted-foreground">
                <th className="px-3 py-2 w-8"><Checkbox checked={selected.size > 0 && selected.size === records.length} onCheckedChange={toggleAll} /></th>
                <th className="px-3 py-2">정비ID</th>
                <th className="px-3 py-2">발전소</th>
                <th className="px-3 py-2">구분</th>
                <th className="px-3 py-2">점검종류·검사종류</th>
                <th className="px-3 py-2">예정일</th>
                <th className="px-3 py-2">완료일</th>
                <th className="px-3 py-2">담당자</th>
                <th className="px-3 py-2">결과</th>
                <th className="px-3 py-2">보고서</th>
                <th className="px-3 py-2">액션</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className="border-b hover:bg-muted/40" onDoubleClick={() => setEditing(r)}>
                  <td className="px-3 py-2"><Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleSel(r.id)} /></td>
                  <td className="px-3 py-2 font-mono text-[10px]">{r.id}</td>
                  <td className="px-3 py-2 font-medium">{r.plantName}</td>
                  <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{r.category}</Badge></td>
                  <td className="px-3 py-2 text-muted-foreground">{r.subKind ?? '-'}</td>
                  <td className="px-3 py-2 tabular-nums">{r.scheduledDate}</td>
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">{r.completedDate ?? '-'}</td>
                  <td className="px-3 py-2">{r.inspector ?? '-'}</td>
                  <td className="px-3 py-2">
                    {r.result === 'pass' && <Badge className="bg-success text-success-foreground hover:bg-success">합격</Badge>}
                    {r.result === 'fail' && <Badge variant="destructive">불합격</Badge>}
                    {(r.result === 'pending' || !r.result) && <Badge variant="outline">대기</Badge>}
                  </td>
                  <td className="px-3 py-2">
                    <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={() => setReportFor(r)}>
                      <FileText className="h-3 w-3" />{reports[r.id] ? '보고서 수정' : '보고서 작성'}
                    </Button>
                  </td>
                  <td className="px-3 py-2">
                    {(r.result === 'pending' || !r.result) && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-6 text-[10px] text-success border-success" onClick={() => markComplete(r.id, 'pass')}>합격</Button>
                        <Button size="sm" variant="outline" className="h-6 text-[10px] text-destructive border-destructive" onClick={() => markComplete(r.id, 'fail')}>불합격</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 상세/수정 다이얼로그 (더블클릭) */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>예방정비 상세 / 수정 — {editing?.id}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3 py-2">
              <div>
                <Label>발전소</Label>
                <Input value={editing.plantName} readOnly className="bg-muted" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>점검 구분</Label>
                  <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v as InspectionKind, subKind: NEEDS_SUBKIND(v as InspectionKind) ? editing.subKind : undefined })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {NEEDS_SUBKIND(editing.category) && (
                  <div>
                    <Label>{editing.category === '특별점검' ? '점검종류' : '검사종류'}</Label>
                    <Input value={editing.subKind ?? ''} onChange={(e) => setEditing({ ...editing, subKind: e.target.value })} />
                  </div>
                )}
                <div>
                  <Label>결과</Label>
                  <Select value={editing.result ?? 'pending'} onValueChange={(v) => setEditing({ ...editing, result: v as MaintenanceRecord['result'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">대기</SelectItem>
                      <SelectItem value="pass">합격</SelectItem>
                      <SelectItem value="fail">불합격</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>점검 예정일</Label>
                  <Input type="date" value={editing.scheduledDate} onChange={(e) => setEditing({ ...editing, scheduledDate: e.target.value })} />
                </div>
                <div>
                  <Label>완료일</Label>
                  <Input type="date" value={editing.completedDate ?? ''} onChange={(e) => setEditing({ ...editing, completedDate: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>담당자</Label>
                <Input value={editing.inspector ?? ''} onChange={(e) => setEditing({ ...editing, inspector: e.target.value })} />
              </div>
              <div>
                <Label>비고</Label>
                <Textarea rows={3} value={editing.notes ?? ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>닫기</Button>
            <Button onClick={saveEdit}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 보고서 작성 다이얼로그 */}
      {reportFor && (
        <MonthlyReportDialog
          open={!!reportFor}
          onOpenChange={(o) => { if (!o) setReportFor(null); }}
          recordTitle={`${reportFor.plantName} · ${reportFor.category}${reportFor.subKind ? ` (${reportFor.subKind})` : ''}`}
          initial={reports[reportFor.id]}
          plant={PLANTS.find(p => p.id === reportFor.plantId)}
          onSave={(r) => { setReports({ ...reports, [reportFor.id]: r }); setRecords(rs => rs.map(x => x.id === reportFor.id ? { ...x, reportId: reportFor.id } : x)); }}
        />
      )}
    </div>
  );
}

function Card({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: 'warning' | 'success' | 'destructive' }) {
  const cls = { warning: 'bg-warning/10 text-warning', success: 'bg-success/10 text-success', destructive: 'bg-destructive/10 text-destructive' }[accent];
  return (
    <div className="panel p-4 flex items-center gap-3">
      <span className={`inline-flex h-10 w-10 rounded-md items-center justify-center ${cls}`}>{icon}</span>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

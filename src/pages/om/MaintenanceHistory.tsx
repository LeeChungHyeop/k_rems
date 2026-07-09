import { useMemo, useState } from 'react';
import { FAULT_RECORDS, MAINTENANCE_RECORDS, PLANTS, ENERGY_LABEL, type MaintenanceRecord } from '@/data/mockData';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Download, Search } from 'lucide-react';
import { toast } from 'sonner';

type FaultRec = typeof FAULT_RECORDS[number];

function exportCSV(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const csv = [Object.keys(rows[0]).join(','), ...rows.map(r => Object.values(r).map(v => JSON.stringify(v ?? '')).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}

export default function MaintenanceHistory() {
  const [tab, setTab] = useState<'fault' | 'maint'>('fault');
  const [keyword, setKeyword] = useState('');
  const [plantFilter, setPlantFilter] = useState('ALL');

  const [faultRows, setFaultRows] = useState<FaultRec[]>(FAULT_RECORDS);
  const [maintRows, setMaintRows] = useState<MaintenanceRecord[]>(MAINTENANCE_RECORDS);
  const [editFault, setEditFault] = useState<FaultRec | null>(null);
  const [editMaint, setEditMaint] = useState<MaintenanceRecord | null>(null);

  const faults = useMemo(() => faultRows.filter(r =>
    (plantFilter === 'ALL' || r.plantId === plantFilter) &&
    (!keyword || r.deviceName.includes(keyword) || r.description.includes(keyword) || r.plantName.includes(keyword))
  ), [keyword, plantFilter, faultRows]);

  const maints = useMemo(() => maintRows.filter(r =>
    (plantFilter === 'ALL' || r.plantId === plantFilter) &&
    (!keyword || r.plantName.includes(keyword) || (r.notes ?? '').includes(keyword) || (r.inspector ?? '').includes(keyword))
  ), [keyword, plantFilter, maintRows]);

  const saveFault = () => {
    if (!editFault) return;
    setFaultRows(faultRows.map(r => r.id === editFault.id ? editFault : r));
    toast.success('장애 이력이 수정되었습니다');
    setEditFault(null);
  };
  const saveMaint = () => {
    if (!editMaint) return;
    setMaintRows(maintRows.map(r => r.id === editMaint.id ? editMaint : r));
    toast.success('정비 이력이 수정되었습니다');
    setEditMaint(null);
  };

  return (
    <div className="p-4 lg:p-5">
      <div className="mb-3">
        <h1 className="text-xl font-bold">정비 이력 조회</h1>
        <p className="text-xs text-muted-foreground mt-0.5">장애 등록 및 예방정비 이력 통합 조회 — 행을 더블클릭하면 상세 보기/수정</p>
      </div>

      <div className="panel p-3 mb-4 flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input className="pl-8 h-9 text-xs" placeholder="발전소·설비·내용 검색" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
        </div>
        <div className="min-w-[200px]">
          <Select value={plantFilter} onValueChange={setPlantFilter}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="ALL">전체 발전소</SelectItem>
              {PLANTS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" variant="outline" className="gap-1 h-9"
          onClick={() => exportCSV(tab === 'fault' ? faults : maints, `정비이력_${tab}_${Date.now()}.csv`)}>
          <Download className="h-3.5 w-3.5" /> CSV
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="fault">장애 이력 ({faults.length})</TabsTrigger>
          <TabsTrigger value="maint">예방정비 이력 ({maints.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="fault">
          <section className="panel">
            <div className="overflow-auto max-h-[600px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card border-b">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-3 py-2">장애ID</th>
                    <th className="px-3 py-2">발전소</th>
                    <th className="px-3 py-2">설비</th>
                    <th className="px-3 py-2">발생일시</th>
                    <th className="px-3 py-2">복구일시</th>
                    <th className="px-3 py-2 text-right">손실 매출</th>
                    <th className="px-3 py-2">내용</th>
                    <th className="px-3 py-2">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {faults.map(r => (
                    <tr key={r.id} className="border-b hover:bg-muted/40 cursor-pointer" onDoubleClick={() => setEditFault(r)}>
                      <td className="px-3 py-2 font-mono">{r.id}</td>
                      <td className="px-3 py-2 font-medium">{r.plantName}</td>
                      <td className="px-3 py-2">{r.deviceName}</td>
                      <td className="px-3 py-2 text-[11px]">{new Date(r.faultStart).toLocaleString('ko-KR')}</td>
                      <td className="px-3 py-2 text-[11px]">{new Date(r.faultEnd).toLocaleString('ko-KR')}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-destructive">₩{r.lostRevenueKRW.toLocaleString()}</td>
                      <td className="px-3 py-2 max-w-[280px] truncate">{r.description}</td>
                      <td className="px-3 py-2">{r.status === 'open' ? <Badge variant="destructive">진행중</Badge> : <Badge variant="outline" className="text-success border-success">복구</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </TabsContent>
        <TabsContent value="maint">
          <section className="panel">
            <div className="overflow-auto max-h-[600px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card border-b">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-3 py-2">정비ID</th>
                    <th className="px-3 py-2">발전소</th>
                    <th className="px-3 py-2">구분</th>
                    <th className="px-3 py-2">예정일</th>
                    <th className="px-3 py-2">완료일</th>
                    <th className="px-3 py-2">담당자</th>
                    <th className="px-3 py-2">결과</th>
                    <th className="px-3 py-2">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {maints.map(r => (
                    <tr key={r.id} className="border-b hover:bg-muted/40 cursor-pointer" onDoubleClick={() => setEditMaint(r)}>
                      <td className="px-3 py-2 font-mono text-[10px]">{r.id}</td>
                      <td className="px-3 py-2 font-medium">{r.plantName}</td>
                      <td className="px-3 py-2">{r.category}</td>
                      <td className="px-3 py-2 tabular-nums">{r.scheduledDate}</td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{r.completedDate ?? '-'}</td>
                      <td className="px-3 py-2">{r.inspector ?? '-'}</td>
                      <td className="px-3 py-2">
                        {r.result === 'confirmed' && <Badge className="bg-success text-success-foreground">확인</Badge>}
                        {r.result === 'revision' && <Badge variant="destructive">수정요청</Badge>}
                        {(r.result === 'pending' || !r.result) && <Badge variant="outline">대기</Badge>}
                      </td>
                      <td className="px-3 py-2 max-w-[260px] truncate">{r.notes ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </TabsContent>
      </Tabs>

      {/* 장애 이력 상세/수정 */}
      <Dialog open={!!editFault} onOpenChange={(o) => !o && setEditFault(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>장애 이력 상세 / 수정 — {editFault?.id}</DialogTitle></DialogHeader>
          {editFault && (
            <div className="space-y-3 py-2">
              <div>
                <Label>발전소</Label>
                <Input value={editFault.plantName} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>설비</Label>
                <Input value={editFault.deviceName} onChange={(e) => setEditFault({ ...editFault, deviceName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>발생일시</Label>
                  <Input type="datetime-local" value={editFault.faultStart.slice(0, 16)} onChange={(e) => setEditFault({ ...editFault, faultStart: e.target.value })} />
                </div>
                <div>
                  <Label>복구일시</Label>
                  <Input type="datetime-local" value={editFault.faultEnd.slice(0, 16)} onChange={(e) => setEditFault({ ...editFault, faultEnd: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>손실 매출 (원)</Label>
                  <Input type="number" value={editFault.lostRevenueKRW} onChange={(e) => setEditFault({ ...editFault, lostRevenueKRW: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>상태</Label>
                  <Select value={editFault.status} onValueChange={(v) => setEditFault({ ...editFault, status: v as FaultRec['status'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">진행중</SelectItem>
                      <SelectItem value="resolved">복구완료</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>내용</Label>
                <Textarea rows={3} value={editFault.description} onChange={(e) => setEditFault({ ...editFault, description: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFault(null)}>닫기</Button>
            <Button onClick={saveFault}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 정비 이력 상세/수정 */}
      <Dialog open={!!editMaint} onOpenChange={(o) => !o && setEditMaint(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>예방정비 이력 상세 / 수정 — {editMaint?.id}</DialogTitle></DialogHeader>
          {editMaint && (
            <div className="space-y-3 py-2">
              <div>
                <Label>발전소</Label>
                <Input value={editMaint.plantName} readOnly className="bg-muted" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>구분</Label>
                  <Input value={editMaint.category} onChange={(e) => setEditMaint({ ...editMaint, category: e.target.value as MaintenanceRecord['category'] })} />
                </div>
                <div>
                  <Label>결과</Label>
                  <Select value={editMaint.result ?? 'pending'} onValueChange={(v) => setEditMaint({ ...editMaint, result: v as MaintenanceRecord['result'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">대기</SelectItem>
                      <SelectItem value="confirmed">확인</SelectItem>
                      <SelectItem value="revision">수정요청</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>점검 예정일</Label>
                  <Input type="date" value={editMaint.scheduledDate} onChange={(e) => setEditMaint({ ...editMaint, scheduledDate: e.target.value })} />
                </div>
                <div>
                  <Label>완료일</Label>
                  <Input type="date" value={editMaint.completedDate ?? ''} onChange={(e) => setEditMaint({ ...editMaint, completedDate: e.target.value })} />
                </div>
              </div>
              {editMaint.result === 'revision' && (
                <div>
                  <Label>미비점</Label>
                  <Textarea rows={2} value={editMaint.deficiency ?? ''} onChange={(e) => setEditMaint({ ...editMaint, deficiency: e.target.value })} placeholder="미비점: " />
                </div>
              )}
              <div>
                <Label>담당자</Label>
                <Input value={editMaint.inspector ?? ''} onChange={(e) => setEditMaint({ ...editMaint, inspector: e.target.value })} />
              </div>
              <div>
                <Label>비고</Label>
                <Textarea rows={3} value={editMaint.notes ?? ''} onChange={(e) => setEditMaint({ ...editMaint, notes: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMaint(null)}>닫기</Button>
            <Button onClick={saveMaint}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalysisFilters, defaultFilter, filterPlants } from '@/components/analysis/AnalysisFilters';
import { getAlarmHistory, DEVICE_LABEL, type DeviceType, type AlarmRecord } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Download, AlertCircle, AlertTriangle, Info, CheckCircle2, FileWarning } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AlarmHistory() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState(defaultFilter());
  const [deviceFilter, setDeviceFilter] = useState<string>('ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [records, setRecords] = useState<AlarmRecord[]>(() => getAlarmHistory());
  const [editing, setEditing] = useState<AlarmRecord | null>(null);
  const [memo, setMemo] = useState('');

  const plants = useMemo(() => filterPlants(filter), [filter]);
  const plantIds = new Set(plants.map(p => p.id));

  const startTs = new Date(filter.startDate).getTime();
  const endTs = new Date(filter.endDate).getTime() + 86_400_000;

  const filtered = useMemo(() => records.filter(a => {
    const t = new Date(a.ts).getTime();
    if (t < startTs || t > endTs) return false;
    if (!plantIds.has(a.plantId)) return false;
    if (deviceFilter !== 'ALL' && a.deviceType !== deviceFilter) return false;
    if (levelFilter !== 'ALL' && a.level !== levelFilter) return false;
    return true;
  }), [records, startTs, endTs, plantIds, deviceFilter, levelFilter]);

  const counts = {
    critical: filtered.filter(a => a.level === 'critical').length,
    warning: filtered.filter(a => a.level === 'warning').length,
    info: filtered.filter(a => a.level === 'info').length,
    resolved: filtered.filter(a => a.resolved).length,
  };

  const openEdit = (a: AlarmRecord) => { setEditing(a); setMemo(a.memo ?? ''); };
  const saveMemo = () => {
    if (!editing) return;
    setRecords(records.map(r => r.id === editing.id ? { ...r, memo } : r));
    toast.success('메모가 저장되었습니다');
    setEditing(null);
  };
  const goToFault = () => {
    if (!editing) return;
    setRecords(records.map(r => r.id === editing.id ? { ...r, memo } : r));
    navigate(`/om/faults?alarmId=${editing.id}`);
  };

  const exportCSV = () => {
    const rows = filtered.map(a => ({
      발생시각: new Date(a.ts).toLocaleString('ko-KR'), 알람ID: a.id, 발전소: a.plantName,
      설비유형: a.deviceType, 설비ID: a.deviceId ?? '', 등급: a.level, 메시지: a.message, 메모: a.memo ?? '', 처리: a.resolved ? '복구' : '미복구',
    }));
    if (!rows.length) return;
    const csv = [Object.keys(rows[0]).join(','), ...rows.map(r => Object.values(r).map(v => JSON.stringify(v)).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `알람이력_${filter.startDate}_${filter.endDate}.csv`; a.click();
  };

  return (
    <div className="p-4 lg:p-5">
      <div className="mb-3">
        <h1 className="text-xl font-bold">알람이력</h1>
        <p className="text-xs text-muted-foreground mt-0.5">행을 더블클릭하면 메모 작성 및 장애등록과 연계할 수 있습니다.</p>
      </div>

      <AnalysisFilters value={filter} onChange={setFilter} showPeriod={false} />

      <div className="panel p-3 mb-4 flex items-end gap-3 flex-wrap">
        <div>
          <Label className="text-[10px] text-muted-foreground">설비 유형</Label>
          <Select value={deviceFilter} onValueChange={setDeviceFilter}>
            <SelectTrigger className="h-9 text-xs w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              <SelectItem value="plant">발전소(전반)</SelectItem>
              {(Object.keys(DEVICE_LABEL) as DeviceType[]).map(t => <SelectItem key={t} value={t}>{DEVICE_LABEL[t]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">알람 등급</Label>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="h-9 text-xs w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              <SelectItem value="critical">심각</SelectItem>
              <SelectItem value="warning">경고</SelectItem>
              <SelectItem value="info">정보</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" variant="outline" className="gap-1 ml-auto h-9" onClick={exportCSV}>
          <Download className="h-3.5 w-3.5" /> CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <SummaryCard icon={<AlertCircle className="h-4 w-4" />} label="심각" value={counts.critical} color="destructive" />
        <SummaryCard icon={<AlertTriangle className="h-4 w-4" />} label="경고" value={counts.warning} color="warning" />
        <SummaryCard icon={<Info className="h-4 w-4" />} label="정보" value={counts.info} color="secondary" />
        <SummaryCard icon={<CheckCircle2 className="h-4 w-4" />} label="복구 완료" value={counts.resolved} color="success" />
      </div>

      <section className="panel">
        <header className="panel-header">
          <h3 className="panel-title">알람 목록 ({filtered.length}건) · 행 더블클릭</h3>
        </header>
        <div className="overflow-auto max-h-[600px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card border-b z-10">
              <tr className="text-muted-foreground text-left">
                <th className="px-3 py-2 font-medium">발생시각</th>
                <th className="px-3 py-2 font-medium">등급</th>
                <th className="px-3 py-2 font-medium">발전소</th>
                <th className="px-3 py-2 font-medium">설비</th>
                <th className="px-3 py-2 font-medium">메시지</th>
                <th className="px-3 py-2 font-medium">메모</th>
                <th className="px-3 py-2 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} className="border-b hover:bg-muted/40 cursor-pointer" onDoubleClick={() => openEdit(a)}>
                  <td className="px-3 py-2 tabular-nums whitespace-nowrap">{new Date(a.ts).toLocaleString('ko-KR', { hour12: false })}</td>
                  <td className="px-3 py-2"><LevelBadge level={a.level} /></td>
                  <td className="px-3 py-2 font-medium">{a.plantName}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.deviceType === 'plant' ? '-' : `${DEVICE_LABEL[a.deviceType as DeviceType]} ${a.deviceId ?? ''}`}</td>
                  <td className="px-3 py-2">{a.message}</td>
                  <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">{a.memo ?? '-'}</td>
                  <td className="px-3 py-2">{a.resolved ? <Badge variant="outline" className="text-success border-success">복구</Badge> : <Badge variant="destructive">미복구</Badge>}</td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">조건에 맞는 알람이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>알람 상세 / 메모</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Info2 k="알람ID" v={editing.id} />
                <Info2 k="발생시각" v={new Date(editing.ts).toLocaleString('ko-KR')} />
                <Info2 k="발전소" v={editing.plantName} />
                <Info2 k="설비" v={editing.deviceType === 'plant' ? '발전소(전반)' : `${DEVICE_LABEL[editing.deviceType as DeviceType]} ${editing.deviceId ?? ''}`} />
              </div>
              <div className="p-3 rounded-md bg-muted/40 text-xs">{editing.message}</div>
              <div>
                <Label className="text-xs">세부 메모</Label>
                <Textarea rows={4} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="조치 사항·원인 분석 등 메모" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>닫기</Button>
            <Button variant="secondary" onClick={saveMemo}>메모 저장</Button>
            <Button className="gap-1" onClick={goToFault}><FileWarning className="h-4 w-4" />장애등록으로 이동</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info2({ k, v }: { k: string; v: string }) {
  return <div className="p-2 rounded-md border bg-card"><div className="text-[10px] text-muted-foreground">{k}</div><div className="font-medium truncate">{v}</div></div>;
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: 'destructive' | 'warning' | 'secondary' | 'success' }) {
  const cls = { destructive: 'bg-destructive/10 text-destructive', warning: 'bg-warning/10 text-warning', secondary: 'bg-secondary/10 text-secondary', success: 'bg-success/10 text-success' }[color];
  return (
    <div className="panel p-3 flex items-center gap-3">
      <span className={`inline-flex h-9 w-9 rounded-md items-center justify-center ${cls}`}>{icon}</span>
      <div>
        <div className="text-[10px] text-muted-foreground">{label}</div>
        <div className="text-xl font-bold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function LevelBadge({ level }: { level: 'critical' | 'warning' | 'info' }) {
  if (level === 'critical') return <Badge variant="destructive" className="text-[10px]">심각</Badge>;
  if (level === 'warning') return <Badge className="bg-warning text-warning-foreground hover:bg-warning text-[10px]">경고</Badge>;
  return <Badge variant="secondary" className="text-[10px]">정보</Badge>;
}

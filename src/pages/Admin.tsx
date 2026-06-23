import { useMemo, useState } from 'react';
import { PLANTS as INIT_PLANTS, PLANT_GROUPS as INIT_GROUPS, ENERGY_LABEL, OPERATORS, EnergyType, Plant, PlantGroup } from '@/data/mockData';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Building2, Users, MapPin, Sun, AlertCircle, ShieldCheck, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// 지역 2단계 데이터 (시/도 → 시/군/구)
const REGIONS: Record<string, string[]> = {
  '서울특별시': ['강남구','강동구','강북구','강서구','관악구','광진구','구로구','금천구','노원구','도봉구','동대문구','동작구','마포구','서대문구','서초구','성동구','성북구','송파구','양천구','영등포구','용산구','은평구','종로구','중구','중랑구'],
  '부산광역시': ['강서구','금정구','기장군','남구','동구','동래구','부산진구','북구','사상구','사하구','서구','수영구','연제구','영도구','중구','해운대구'],
  '대구광역시': ['남구','달서구','달성군','동구','북구','서구','수성구','중구','군위군'],
  '인천광역시': ['강화군','계양구','남동구','동구','미추홀구','부평구','서구','연수구','옹진군','중구'],
  '광주광역시': ['광산구','남구','동구','북구','서구'],
  '대전광역시': ['대덕구','동구','서구','유성구','중구'],
  '울산광역시': ['남구','동구','북구','중구','울주군'],
  '세종특별자치시': ['세종시'],
  '경기도': ['수원시','성남시','용인시','고양시','화성시','부천시','남양주시','안산시','평택시','안양시','시흥시','파주시','김포시','의정부시','광주시','광명시','군포시','오산시','이천시','양주시','구리시','안성시','포천시','의왕시','하남시','여주시','동두천시','과천시','가평군','양평군','연천군'],
  '강원특별자치도': ['춘천시','원주시','강릉시','동해시','태백시','속초시','삼척시','홍천군','횡성군','영월군','평창군','정선군','철원군','화천군','양구군','인제군','고성군','양양군'],
  '충청북도': ['청주시','충주시','제천시','보은군','옥천군','영동군','증평군','진천군','괴산군','음성군','단양군'],
  '충청남도': ['천안시','공주시','보령시','아산시','서산시','논산시','계룡시','당진시','금산군','부여군','서천군','청양군','홍성군','예산군','태안군'],
  '전북특별자치도': ['전주시','군산시','익산시','정읍시','남원시','김제시','완주군','진안군','무주군','장수군','임실군','순창군','고창군','부안군'],
  '전라남도': ['목포시','여수시','순천시','나주시','광양시','담양군','곡성군','구례군','고흥군','보성군','화순군','장흥군','강진군','해남군','영암군','무안군','함평군','영광군','장성군','완도군','진도군','신안군'],
  '경상북도': ['포항시','경주시','김천시','안동시','구미시','영주시','영천시','상주시','문경시','경산시','의성군','청송군','영양군','영덕군','청도군','고령군','성주군','칠곡군','예천군','봉화군','울진군','울릉군'],
  '경상남도': ['창원시','진주시','통영시','사천시','김해시','밀양시','거제시','양산시','의령군','함안군','창녕군','고성군','남해군','하동군','산청군','함양군','거창군','합천군'],
  '제주특별자치도': ['제주시','서귀포시'],
};
const REGION_L1 = Object.keys(REGIONS);

// 확장 발전소 정보 (데모 메모리 보관용)
interface PlantEx extends Plant {
  plantCode?: string;
  regionL1?: string;
  regionL2?: string;
  address?: string;
  smpPrice?: number;
  recPrice?: number;
  recWeight?: number;
  capacityW?: number;
  category?: 'self' | 'spc';
  commissionDate?: string;
  bizStart?: string;
  bizEnd?: string;
  totalCost?: number;
  investment?: number;
  sharePct?: number;
  extra?: string;
  manual?: boolean;
}

interface UserRow {
  id: string;
  name: string;
  role: '시스템관리자' | '발전소운영자' | '협력사';
  phone: string;
  email: string;
  dept: string;
  position: string;
  active: boolean;
  groupId: string;
  description: string;
  password?: string;
}

interface AlarmRule { id: string; device: string; metric: string; warn: string; critical: string; channel: string; }

const INIT_USERS: UserRow[] = [
  { id: 'ADMIN', name: '시스템 관리자', role: '시스템관리자', phone: '010-0000-0000', email: 'admin@khnp.co.kr', dept: '본사 신재생사업처', position: '처장', active: true, groupId: '', description: '' },
  { id: 'OP-01', name: '윤지훈', role: '발전소운영자', phone: '010-1111-2222', email: 'yoon@khnp.co.kr', dept: '신재생사업처', position: '대리', active: true, groupId: 'G-MGR-01', description: '수도권/강원/충청 담당' },
  { id: 'OP-02', name: '김성민', role: '발전소운영자', phone: '010-3333-4444', email: 'kim@khnp.co.kr', dept: '신재생사업처', position: '대리', active: true, groupId: 'G-MGR-02', description: '영남 담당' },
  { id: 'OP-03', name: '차주현', role: '발전소운영자', phone: '010-5555-6666', email: 'cha@khnp.co.kr', dept: '신재생사업처', position: '대리', active: true, groupId: 'G-MGR-03', description: '호남/제주 담당' },
];

const INIT_ALARMS: AlarmRule[] = [
  { id: 'AR-01', device: '인버터', metric: '온도(℃)', warn: '60', critical: '75', channel: 'SMS, Email' },
  { id: 'AR-02', device: '인버터', metric: 'DC 절연저항(MΩ)', warn: '< 1.0', critical: '< 0.5', channel: 'SMS, App' },
  { id: 'AR-03', device: '풍력 터빈', metric: '진동(mm/s)', warn: '4.5', critical: '7.0', channel: 'SMS, Email, App' },
  { id: 'AR-04', device: 'ESS BMS', metric: 'SOC 편차(%)', warn: '5', critical: '10', channel: 'Email, App' },
  { id: 'AR-05', device: '통신', metric: '응답지연(s)', warn: '3', critical: '10', channel: 'Email' },
];

export default function Admin() {
  // plants·groups 최상위 리프팅 → PlantAdmin·GroupAdmin·UserAdmin 간 완전 동기화
  const [plants, setPlants] = useState<PlantEx[]>(INIT_PLANTS as PlantEx[]);
  const [groups, setGroups] = useState<PlantGroup[]>(INIT_GROUPS);

  return (
    <div className="p-4 lg:p-5">
      <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">관리</h1>
          <p className="text-xs text-muted-foreground mt-0.5">발전소·그룹·사용자·알람 설정 (데모: 변경은 메모리에 저장)</p>
        </div>
        <Badge className="gap-1 bg-primary/10 text-primary border-primary/30" variant="outline">
          <ShieldCheck className="h-3.5 w-3.5" />접속자: 시스템 관리자
        </Badge>
      </div>

      <Tabs defaultValue="plants">
        <TabsList>
          <TabsTrigger value="plants" className="gap-1"><Sun className="h-3.5 w-3.5" />발전소</TabsTrigger>
          <TabsTrigger value="groups" className="gap-1"><Building2 className="h-3.5 w-3.5" />그룹</TabsTrigger>
          <TabsTrigger value="users" className="gap-1"><Users className="h-3.5 w-3.5" />사용자</TabsTrigger>
          <TabsTrigger value="alarms" className="gap-1"><AlertCircle className="h-3.5 w-3.5" />알람 설정</TabsTrigger>
        </TabsList>

        <TabsContent value="plants"><PlantAdmin plants={plants} setPlants={setPlants} /></TabsContent>
        <TabsContent value="groups"><GroupAdmin groups={groups} setGroups={setGroups} plants={plants} /></TabsContent>
        <TabsContent value="users"><UserAdmin groups={groups} plants={plants} /></TabsContent>
        <TabsContent value="alarms"><AlarmAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// 발전소
// ============================================================================
function PlantAdmin({
  plants,
  setPlants,
}: {
  plants: PlantEx[];
  setPlants: React.Dispatch<React.SetStateAction<PlantEx[]>>;
}) {
  const [editing, setEditing] = useState<PlantEx | null>(null);
  const [open, setOpen] = useState(false);

  const liveSmp = 142.8;
  const liveRec = 71500;

  const genPlantId = () => `KR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const openNew = () => {
    setEditing({
      id: genPlantId(),
      name: '',
      type: 'solar',
      region: '',
      lon: 127, lat: 36,
      capacityMW: 1,
      comm: 'normal', status: 'normal',
      commissionedYear: new Date().getFullYear(),
      operatorId: OPERATORS[0].id,
      plantCode: '',
      regionL1: '', regionL2: '',
      address: '',
      smpPrice: liveSmp, recPrice: liveRec,
      recWeight: 1.2,
      capacityW: 1_000_000,
      category: 'self',
      commissionDate: '',
      bizStart: '',
      bizEnd: '',
      totalCost: 0,
      investment: 0,
      sharePct: 0,
      extra: '',
      manual: false,
    });
    setOpen(true);
  };
  const openEdit = (p: PlantEx) => {
    const [l1 = '', l2 = ''] = (p.region ?? '').split(/\s+/);
    setEditing({
      smpPrice: liveSmp, recPrice: liveRec,
      capacityW: Math.round((p.capacityMW ?? 0) * 1_000_000),
      regionL1: p.regionL1 ?? (REGION_L1.includes(l1) ? l1 : ''),
      regionL2: p.regionL2 ?? l2,
      category: 'self',
      ...p,
    });
    setOpen(true);
  };

  const autoShare = useMemo(() => {
    if (!editing) return 0;
    const t = editing.totalCost ?? 0;
    const i = editing.investment ?? 0;
    return t > 0 ? +(i / t * 100).toFixed(2) : 0;
  }, [editing?.totalCost, editing?.investment]);

  const validate = (p: PlantEx): string | null => {
    if (!p.name?.trim()) return '사업소명은 필수입니다.';
    if (!p.plantCode?.trim()) return '발전기코드는 필수입니다.';
    if (!p.type) return '발전원을 선택하세요.';
    if (!p.regionL1 || !p.regionL2) return '지역을 모두 선택하세요.';
    if (!p.address?.trim()) return '세부주소는 필수입니다.';
    if (p.lat == null || p.lon == null) return '위/경도는 필수입니다.';
    if (!p.operatorId) return '담당자를 선택하세요.';
    if (p.recWeight == null) return 'REC가중치는 필수입니다.';
    if (!p.capacityW || p.capacityW <= 0) return '설비용량은 필수입니다.';
    if (!p.category) return '구분은 필수입니다.';
    if (!p.commissionDate) return '준공연월은 필수입니다.';
    if (!p.bizStart) return '사업시작일은 필수입니다.';
    if (!p.bizEnd) return '사업종료일은 필수입니다.';
    if (!p.totalCost || p.totalCost <= 0) return '총사업비는 필수입니다.';
    if (p.investment == null || p.investment < 0) return '투자비는 필수입니다.';
    return null;
  };

  const save = () => {
    if (!editing) return;
    const err = validate(editing);
    if (err) { toast({ title: '입력값 확인', description: err, variant: 'destructive' as any }); return; }
    const merged: PlantEx = {
      ...editing,
      region: `${editing.regionL1} ${editing.regionL2}`.trim(),
      capacityMW: +((editing.capacityW ?? 0) / 1_000_000).toFixed(6),
      sharePct: editing.sharePct ?? autoShare,
    };
    setPlants(prev => prev.some(p => p.id === merged.id) ? prev.map(p => p.id === merged.id ? merged : p) : [...prev, merged]);
    setOpen(false);
    toast({ title: '저장됨', description: `${merged.name} 발전소 정보가 저장되었습니다.` });
  };
  const remove = (id: string) => { setPlants(prev => prev.filter(p => p.id !== id)); toast({ title: '삭제됨' }); };

  const numberFmt = (n?: number) => (n ?? 0).toLocaleString();

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-muted-foreground">총 {plants.length}개 발전소</div>
        <Button size="sm" className="gap-1 h-8" onClick={openNew}><Plus className="h-3.5 w-3.5" />발전소 추가</Button>
      </div>
      <section className="panel">
        <div className="overflow-auto max-h-[560px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card border-b"><tr className="text-left text-muted-foreground">
              <th className="px-3 py-2">사업소ID</th><th className="px-3 py-2">사업소명</th><th className="px-3 py-2">발전원</th>
              <th className="px-3 py-2">위치</th><th className="px-3 py-2 text-right">설비(MW)</th>
              <th className="px-3 py-2">담당자</th><th className="px-3 py-2 text-center">수기</th><th className="px-3 py-2 text-right">작업</th>
            </tr></thead>
            <tbody>
              {plants.map(p => (
                <tr key={p.id} className="border-b hover:bg-muted/40">
                  <td className="px-3 py-2 font-mono text-[10px]">{p.id}</td>
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{ENERGY_LABEL[p.type]}</Badge></td>
                  <td className="px-3 py-2 text-muted-foreground">{p.region}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{p.capacityMW.toFixed(2)}</td>
                  <td className="px-3 py-2 text-[11px]">{OPERATORS.find(o => o.id === p.operatorId)?.name ?? '-'}</td>
                  <td className="px-3 py-2 text-center">{p.manual ? <Badge variant="outline" className="text-[10px]">수기</Badge> : <span className="text-muted-foreground">-</span>}</td>
                  <td className="px-3 py-2 text-right">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>발전소 {plants.some(p => p.id === editing?.id) ? '수정' : '추가'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-5">
              <fieldset className="border rounded-md p-3">
                <legend className="text-xs font-semibold px-1 text-muted-foreground">기본 정보</legend>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-1">
                  <Field label="사업소명 *"><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="예: 한빛솔라파크#1" /></Field>
                  <Field label="발전기코드 * (SMP/REC 연동키)"><Input value={editing.plantCode ?? ''} onChange={e => setEditing({ ...editing, plantCode: e.target.value })} placeholder="예: KPX-SOL-0001" /></Field>
                  <Field label="사업소ID (자동부여)">
                    <div className="flex gap-1">
                      <Input value={editing.id} readOnly className="bg-muted/40 font-mono text-[11px]" />
                      <Button type="button" size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => setEditing({ ...editing, id: genPlantId() })}><RefreshCw className="h-3.5 w-3.5" /></Button>
                    </div>
                  </Field>
                  <Field label="발전원 *">
                    <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v as EnergyType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(ENERGY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="담당자 *">
                    <Select value={editing.operatorId} onValueChange={(v) => setEditing({ ...editing, operatorId: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{OPERATORS.map(o => <SelectItem key={o.id} value={o.id}>{o.name} ({o.role})</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="구분 *">
                    <Select value={editing.category ?? 'self'} onValueChange={(v) => setEditing({ ...editing, category: v as 'self' | 'spc' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self">자체설비</SelectItem>
                        <SelectItem value="spc">SPC</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </fieldset>

              <fieldset className="border rounded-md p-3">
                <legend className="text-xs font-semibold px-1 text-muted-foreground">위치 정보</legend>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1">
                  <Field label="시/도 *">
                    <Select value={editing.regionL1 ?? ''} onValueChange={(v) => setEditing({ ...editing, regionL1: v, regionL2: '' })}>
                      <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                      <SelectContent className="max-h-72">{REGION_L1.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="시/군/구 *">
                    <Select value={editing.regionL2 ?? ''} onValueChange={(v) => setEditing({ ...editing, regionL2: v })} disabled={!editing.regionL1}>
                      <SelectTrigger><SelectValue placeholder={editing.regionL1 ? '선택' : '시/도 먼저'} /></SelectTrigger>
                      <SelectContent className="max-h-72">{(REGIONS[editing.regionL1 ?? ''] ?? []).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="세부주소 *" full>
                    <Input value={editing.address ?? ''} onChange={e => setEditing({ ...editing, address: e.target.value })} placeholder="도로명 또는 지번" />
                  </Field>
                  <Field label="위도 *"><Input type="number" step="0.0001" value={editing.lat} onChange={e => setEditing({ ...editing, lat: Number(e.target.value) })} /></Field>
                  <Field label="경도 *"><Input type="number" step="0.0001" value={editing.lon} onChange={e => setEditing({ ...editing, lon: Number(e.target.value) })} /></Field>
                </div>
              </fieldset>

              <fieldset className="border rounded-md p-3">
                <legend className="text-xs font-semibold px-1 text-muted-foreground">설비 · 단가</legend>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-1">
                  <Field label="설비용량 (W) *">
                    <Input type="number" step="1" value={editing.capacityW ?? 0} onChange={e => setEditing({ ...editing, capacityW: Number(e.target.value) })} />
                    <div className="text-[10px] text-muted-foreground mt-0.5">≈ {((editing.capacityW ?? 0) / 1_000_000).toFixed(3)} MW</div>
                  </Field>
                  <Field label="REC 가중치 *"><Input type="number" step="0.1" value={editing.recWeight ?? 0} onChange={e => setEditing({ ...editing, recWeight: Number(e.target.value) })} /></Field>
                  <Field label={<>SMP 단가 (원/kWh) <span className="text-[10px] text-primary">· 자동연동</span></> as any}>
                    <Input type="number" step="0.01" value={editing.smpPrice ?? liveSmp} onChange={e => setEditing({ ...editing, smpPrice: Number(e.target.value) })} />
                  </Field>
                  <Field label={<>REC 단가 (원/REC) <span className="text-[10px] text-primary">· 자동연동</span></> as any}>
                    <Input type="number" step="1" value={editing.recPrice ?? liveRec} onChange={e => setEditing({ ...editing, recPrice: Number(e.target.value) })} />
                  </Field>
                </div>
              </fieldset>

              <fieldset className="border rounded-md p-3">
                <legend className="text-xs font-semibold px-1 text-muted-foreground">사업 기간</legend>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-1">
                  <Field label="준공연월 *"><Input type="month" value={editing.commissionDate ?? ''} onChange={e => setEditing({ ...editing, commissionDate: e.target.value })} /></Field>
                  <Field label="사업시작 *"><Input type="date" value={editing.bizStart ?? ''} onChange={e => setEditing({ ...editing, bizStart: e.target.value })} /></Field>
                  <Field label="사업종료 *"><Input type="date" value={editing.bizEnd ?? ''} onChange={e => setEditing({ ...editing, bizEnd: e.target.value })} /></Field>
                </div>
              </fieldset>

              <fieldset className="border rounded-md p-3">
                <legend className="text-xs font-semibold px-1 text-muted-foreground">투자 정보</legend>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-1">
                  <Field label="총사업비 (원) *">
                    <Input type="number" step="1" value={editing.totalCost ?? 0} onChange={e => setEditing({ ...editing, totalCost: Number(e.target.value), sharePct: undefined })} />
                    <div className="text-[10px] text-muted-foreground mt-0.5">{numberFmt(editing.totalCost)} 원</div>
                  </Field>
                  <Field label="투자비 (원) *">
                    <Input type="number" step="1" value={editing.investment ?? 0} onChange={e => setEditing({ ...editing, investment: Number(e.target.value), sharePct: undefined })} />
                    <div className="text-[10px] text-muted-foreground mt-0.5">{numberFmt(editing.investment)} 원</div>
                  </Field>
                  <Field label="지분 (%) · 자동계산">
                    <Input type="number" step="0.01" value={editing.sharePct ?? autoShare} onChange={e => setEditing({ ...editing, sharePct: Number(e.target.value) })} />
                    <div className="text-[10px] text-muted-foreground mt-0.5">자동값: {autoShare}%</div>
                  </Field>
                </div>
              </fieldset>

              <fieldset className="border rounded-md p-3">
                <legend className="text-xs font-semibold px-1 text-muted-foreground">기타</legend>
                <div className="space-y-3 mt-1">
                  <Field label="추가정보 (선택)" full>
                    <Textarea rows={3} value={editing.extra ?? ''} onChange={e => setEditing({ ...editing, extra: e.target.value })} placeholder="비고, 특이사항 등" />
                  </Field>
                  <label className="flex items-start gap-2 cursor-pointer rounded-md border p-2 hover:bg-muted/40">
                    <Checkbox checked={!!editing.manual} onCheckedChange={(v) => setEditing({ ...editing, manual: !!v })} className="mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium">수기입력 발전소</div>
                      <div className="text-[10px] text-muted-foreground">체크 시 이 발전소의 발전량/매출/비용/수익이 통합 집계(매출·비용·수익)에서 <b>제외</b>됩니다.</div>
                    </div>
                  </label>
                </div>
              </fieldset>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
            <Button onClick={save}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// 그룹 — groups 상태는 Admin에서 prop으로 받아 UserAdmin과 공유
// ============================================================================
function GroupAdmin({
  groups,
  setGroups,
  plants,
}: {
  groups: PlantGroup[];
  setGroups: React.Dispatch<React.SetStateAction<PlantGroup[]>>;
  plants: PlantEx[];
}) {
  const [editing, setEditing] = useState<PlantGroup | null>(null);
  const [open, setOpen] = useState(false);

  const openNew = () => { setEditing({ id: `G-${Date.now()}`, name: '', type: 'region', plantIds: [], description: '' }); setOpen(true); };
  const openEdit = (g: PlantGroup) => { setEditing({ ...g, plantIds: [...g.plantIds] }); setOpen(true); };
  const save = () => { if (!editing) return; setGroups(prev => prev.some(g => g.id === editing.id) ? prev.map(g => g.id === editing.id ? editing : g) : [...prev, editing]); setOpen(false); toast({ title: '저장됨' }); };
  const remove = (id: string) => { setGroups(prev => prev.filter(g => g.id !== id)); toast({ title: '삭제됨' }); };

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-muted-foreground">총 {groups.length}개 그룹</div>
        <Button size="sm" className="gap-1 h-8" onClick={openNew}><Plus className="h-3.5 w-3.5" />그룹 추가</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {groups.map(g => {
          const Icon = g.type === 'spc' ? Building2 : g.type === 'region' ? MapPin : Users;
          return (
            <div key={g.id} className="panel p-3">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm truncate flex-1">{g.name}</span>
                <Badge variant="outline" className="text-[10px]">{g.type.toUpperCase()}</Badge>
              </div>
              {g.description && <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{g.description}</div>}
              <div className="text-[10px] text-muted-foreground mb-2">소속 발전소 {g.plantIds.length}개</div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-7 text-[11px] flex-1 gap-1" onClick={() => openEdit(g)}><Pencil className="h-3 w-3" />수정</Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px] text-destructive gap-1" onClick={() => remove(g.id)}><Trash2 className="h-3 w-3" />삭제</Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>그룹 {groups.some(g => g.id === editing?.id) ? '수정' : '추가'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="ID"><Input value={editing.id} onChange={e => setEditing({ ...editing, id: e.target.value })} /></Field>
                <Field label="그룹명"><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></Field>
                <Field label="유형">
                  <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v as PlantGroup['type'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="region">권역</SelectItem>
                      <SelectItem value="operator">담당자</SelectItem>
                      <SelectItem value="spc">SPC 출자회사</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="설명"><Input value={editing.description ?? ''} onChange={e => setEditing({ ...editing, description: e.target.value })} /></Field>
              </div>
              <div>
                <Label className="text-xs">소속 발전소 ({editing.plantIds.length})</Label>
                <div className="border rounded-md p-2 max-h-48 overflow-auto grid grid-cols-2 gap-1 mt-1">
                  {plants.map(p => {
                    const checked = editing.plantIds.includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-2 text-[11px] cursor-pointer hover:bg-muted/40 px-1 py-0.5 rounded">
                        <input type="checkbox" checked={checked} onChange={() => setEditing({ ...editing, plantIds: checked ? editing.plantIds.filter(x => x !== p.id) : [...editing.plantIds, p.id] })} />
                        <span className="truncate">{p.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
            <Button onClick={save}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// 사용자
// ============================================================================
function UserAdmin({ groups, plants }: { groups: PlantGroup[]; plants: PlantEx[] }) {
  const [users, setUsers] = useState<UserRow[]>(INIT_USERS);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [pwInput, setPwInput] = useState({ pw: '', confirm: '' });
  const [open, setOpen] = useState(false);

  const isNew = editing ? !users.some(u => u.id === editing.id) : true;

  // 선택된 그룹에 속한 발전소 목록 (그룹탭 변경과 자동 동기화)
  const selectedGroupPlants = useMemo(() => {
    if (!editing?.groupId) return [];
    const g = groups.find(g => g.id === editing.groupId);
    if (!g) return [];
    return plants.filter(p => g.plantIds.includes(p.id));
  }, [editing?.groupId, groups]);

  const openNew = () => {
    setEditing({ id: '', name: '', role: '발전소운영자', phone: '', email: '', dept: '', position: '', active: true, groupId: '', description: '' });
    setPwInput({ pw: '', confirm: '' });
    setOpen(true);
  };

  const openEdit = (u: UserRow) => {
    setEditing({ ...u });
    setPwInput({ pw: '', confirm: '' });
    setOpen(true);
  };

  const validate = (): string | null => {
    if (!editing) return null;
    if (!editing.id.trim()) return 'ID는 필수입니다.';
    if (isNew && !pwInput.pw) return '비밀번호는 필수입니다.';
    if (pwInput.pw && pwInput.pw !== pwInput.confirm) return '비밀번호가 일치하지 않습니다.';
    if (!editing.name.trim()) return '이름은 필수입니다.';
    if (!editing.role) return '권한등급은 필수입니다.';
    if (!editing.phone.trim()) return '휴대폰은 필수입니다.';
    if (!editing.dept.trim()) return '소속은 필수입니다.';
    if (!editing.position.trim()) return '직급은 필수입니다.';
    return null;
  };

  const save = () => {
    const err = validate();
    if (err) { toast({ title: '입력값 확인', description: err, variant: 'destructive' as any }); return; }
    if (!editing) return;
    const toSave: UserRow = { ...editing, ...(pwInput.pw ? { password: pwInput.pw } : {}) };
    setUsers(prev => prev.some(u => u.id === toSave.id) ? prev.map(u => u.id === toSave.id ? toSave : u) : [...prev, toSave]);
    setOpen(false);
    toast({ title: '저장됨', description: `${toSave.name} 사용자 정보가 저장되었습니다.` });
  };

  const remove = (id: string) => { setUsers(prev => prev.filter(u => u.id !== id)); toast({ title: '삭제됨' }); };

  const roleBadgeClass = (role: string) => {
    if (role === '시스템관리자') return 'bg-primary/10 text-primary border-primary/30';
    if (role === '발전소운영자') return 'bg-blue-500/10 text-blue-600 border-blue-300/30 dark:text-blue-400';
    return 'bg-orange-500/10 text-orange-600 border-orange-300/30 dark:text-orange-400';
  };

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-muted-foreground">총 {users.length}명</div>
        <Button size="sm" className="gap-1 h-8" onClick={openNew}><Plus className="h-3.5 w-3.5" />사용자 추가</Button>
      </div>
      <section className="panel">
        <div className="overflow-auto max-h-[560px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card border-b"><tr className="text-left text-muted-foreground">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">이름</th>
              <th className="px-3 py-2">권한등급</th>
              <th className="px-3 py-2">소속 / 직급</th>
              <th className="px-3 py-2">휴대폰</th>
              <th className="px-3 py-2 text-center">사용</th>
              <th className="px-3 py-2">담당그룹</th>
              <th className="px-3 py-2 text-right">작업</th>
            </tr></thead>
            <tbody>
              {users.map(u => {
                const grp = groups.find(g => g.id === u.groupId);
                return (
                  <tr key={u.id} className="border-b hover:bg-muted/40">
                    <td className="px-3 py-2 font-mono text-[11px]">{u.id}</td>
                    <td className="px-3 py-2 font-medium">{u.name}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className={`text-[10px] whitespace-nowrap ${roleBadgeClass(u.role)}`}>{u.role}</Badge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{u.dept} / {u.position}</td>
                    <td className="px-3 py-2">{u.phone}</td>
                    <td className="px-3 py-2 text-center">
                      {u.active
                        ? <Badge className="bg-success text-success-foreground text-[10px]">활성</Badge>
                        : <Badge variant="outline" className="text-[10px] text-muted-foreground">비활성</Badge>}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-muted-foreground max-w-[140px] truncate">{grp?.name ?? '-'}</td>
                    <td className="px-3 py-2 text-right">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(u)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(u.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>사용자 {isNew ? '추가' : '수정'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              {/* 계정 정보 */}
              <fieldset className="border rounded-md p-3">
                <legend className="text-xs font-semibold px-1 text-muted-foreground">계정 정보</legend>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <Field label="ID *">
                    <Input
                      value={editing.id}
                      onChange={e => setEditing({ ...editing, id: e.target.value })}
                      readOnly={!isNew}
                      className={!isNew ? 'bg-muted/40 font-mono text-[11px]' : ''}
                      placeholder="로그인 ID"
                    />
                  </Field>
                  <div /> {/* spacer */}
                  <Field label={isNew ? '비밀번호 *' : '새 비밀번호'}>
                    <Input
                      type="password"
                      value={pwInput.pw}
                      onChange={e => setPwInput({ ...pwInput, pw: e.target.value })}
                      placeholder={isNew ? '필수 입력' : '변경 시만 입력'}
                    />
                  </Field>
                  <Field label={isNew ? '비밀번호 확인 *' : '비밀번호 확인'}>
                    <Input
                      type="password"
                      value={pwInput.confirm}
                      onChange={e => setPwInput({ ...pwInput, confirm: e.target.value })}
                      placeholder={isNew ? '필수 입력' : '변경 시만 입력'}
                    />
                    {pwInput.pw && pwInput.pw !== pwInput.confirm && (
                      <div className="text-[10px] text-destructive mt-0.5">비밀번호가 일치하지 않습니다.</div>
                    )}
                  </Field>
                </div>
                {!isNew && (
                  <div className="text-[10px] text-muted-foreground mt-2">※ 비밀번호를 변경하지 않으려면 비밀번호 칸을 비워두세요.</div>
                )}
              </fieldset>

              {/* 기본 정보 */}
              <fieldset className="border rounded-md p-3">
                <legend className="text-xs font-semibold px-1 text-muted-foreground">기본 정보</legend>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <Field label="이름 *">
                    <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                  </Field>
                  <Field label="권한등급 *">
                    <Select value={editing.role} onValueChange={(v) => setEditing({ ...editing, role: v as UserRow['role'] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="시스템관리자">시스템관리자</SelectItem>
                        <SelectItem value="발전소운영자">발전소운영자</SelectItem>
                        <SelectItem value="협력사">협력사</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="휴대폰 *">
                    <Input value={editing.phone} onChange={e => setEditing({ ...editing, phone: e.target.value })} placeholder="010-0000-0000" />
                  </Field>
                  <Field label="이메일">
                    <Input type="email" value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} placeholder="선택 입력" />
                  </Field>
                  <Field label="소속 *">
                    <Input value={editing.dept} onChange={e => setEditing({ ...editing, dept: e.target.value })} placeholder="소속 부서 또는 회사명" />
                  </Field>
                  <Field label="직급 *">
                    <Input value={editing.position} onChange={e => setEditing({ ...editing, position: e.target.value })} placeholder="직급 또는 직책" />
                  </Field>
                </div>
              </fieldset>

              {/* 사용 설정 */}
              <fieldset className="border rounded-md p-3">
                <legend className="text-xs font-semibold px-1 text-muted-foreground">사용 설정</legend>
                <div className="space-y-3 mt-1">
                  <label className="flex items-start gap-2 cursor-pointer rounded-md border p-2 hover:bg-muted/40">
                    <Checkbox
                      checked={editing.active}
                      onCheckedChange={(v) => setEditing({ ...editing, active: !!v })}
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium">사용 여부</div>
                      <div className="text-[10px] text-muted-foreground">미체크 시 해당 계정으로 로그인이 불가합니다.</div>
                    </div>
                  </label>

                  <Field label="담당 그룹 (선택)">
                    <Select
                      value={editing.groupId || '__none__'}
                      onValueChange={(v) => setEditing({ ...editing, groupId: v === '__none__' ? '' : v })}
                    >
                      <SelectTrigger><SelectValue placeholder="그룹 선택" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">없음</SelectItem>
                        {groups.map(g => (
                          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="담당 사업소 (그룹 연동 자동표시)">
                    <div className="border rounded-md px-3 py-2 min-h-[2.25rem] bg-muted/40 text-[11px] text-muted-foreground leading-relaxed">
                      {selectedGroupPlants.length > 0
                        ? selectedGroupPlants.map(p => p.name).join(' · ')
                        : <span className="italic">담당 그룹 선택 시 자동으로 표시됩니다.</span>}
                    </div>
                    {selectedGroupPlants.length > 0 && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">총 {selectedGroupPlants.length}개 사업소</div>
                    )}
                  </Field>
                </div>
              </fieldset>

              {/* 설명 */}
              <fieldset className="border rounded-md p-3">
                <legend className="text-xs font-semibold px-1 text-muted-foreground">기타</legend>
                <div className="mt-1">
                  <Field label="설명" full>
                    <Textarea
                      rows={3}
                      value={editing.description}
                      onChange={e => setEditing({ ...editing, description: e.target.value })}
                      placeholder="기타 설명 입력"
                    />
                  </Field>
                </div>
              </fieldset>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
            <Button onClick={save}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// 알람 임계값
// ============================================================================
function AlarmAdmin() {
  const [rules, setRules] = useState<AlarmRule[]>(INIT_ALARMS);
  const [editing, setEditing] = useState<AlarmRule | null>(null);
  const [open, setOpen] = useState(false);

  const openNew = () => { setEditing({ id: `AR-${Date.now()}`, device: '', metric: '', warn: '', critical: '', channel: 'Email' }); setOpen(true); };
  const openEdit = (r: AlarmRule) => { setEditing({ ...r }); setOpen(true); };
  const save = () => { if (!editing) return; setRules(prev => prev.some(r => r.id === editing.id) ? prev.map(r => r.id === editing.id ? editing : r) : [...prev, editing]); setOpen(false); toast({ title: '저장됨' }); };
  const remove = (id: string) => { setRules(prev => prev.filter(r => r.id !== id)); toast({ title: '삭제됨' }); };

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-muted-foreground">알람 임계값 {rules.length}건</div>
        <Button size="sm" className="gap-1 h-8" onClick={openNew}><Plus className="h-3.5 w-3.5" />임계값 추가</Button>
      </div>
      <section className="panel p-4">
        <table className="w-full text-xs">
          <thead><tr className="border-b text-left text-muted-foreground"><th className="py-2">설비</th><th className="py-2">항목</th><th className="py-2">경고</th><th className="py-2">심각</th><th className="py-2">알림채널</th><th className="py-2 text-right">작업</th></tr></thead>
          <tbody>
            {rules.map(r => (
              <tr key={r.id} className="border-b">
                <td className="py-2 font-medium">{r.device}</td><td className="py-2">{r.metric}</td>
                <td className="py-2 text-warning tabular-nums">{r.warn}</td>
                <td className="py-2 text-destructive tabular-nums">{r.critical}</td>
                <td className="py-2 text-muted-foreground text-[11px]">{r.channel}</td>
                <td className="py-2 text-right">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>알람 임계값 {rules.some(r => r.id === editing?.id) ? '수정' : '추가'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="설비"><Input value={editing.device} onChange={e => setEditing({ ...editing, device: e.target.value })} /></Field>
              <Field label="항목"><Input value={editing.metric} onChange={e => setEditing({ ...editing, metric: e.target.value })} /></Field>
              <Field label="경고 임계"><Input value={editing.warn} onChange={e => setEditing({ ...editing, warn: e.target.value })} /></Field>
              <Field label="심각 임계"><Input value={editing.critical} onChange={e => setEditing({ ...editing, critical: e.target.value })} /></Field>
              <Field label="알림 채널" full><Input value={editing.channel} onChange={e => setEditing({ ...editing, channel: e.target.value })} placeholder="SMS, Email, App" /></Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
            <Button onClick={save}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, children, full }: { label: React.ReactNode; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2 space-y-1' : 'space-y-1'}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

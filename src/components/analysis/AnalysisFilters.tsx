import { ENERGY_LABEL, PLANTS, PLANT_GROUPS, PERIOD_LABEL, type Period, type EnergyType } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export interface FilterState {
  groupId: string;
  energyType: string;
  plantId: string;
  startDate: string;
  endDate: string;
  period: Period;
}

export function defaultFilter(): FilterState {
  const end = new Date();
  const start = new Date(); start.setDate(end.getDate() - 7);
  return {
    groupId: 'ALL', energyType: 'ALL', plantId: 'ALL',
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    period: '1h',
  };
}

export function filterPlants(f: FilterState) {
  let list = PLANTS;
  if (f.groupId !== 'ALL') {
    const g = PLANT_GROUPS.find(x => x.id === f.groupId);
    if (g) list = list.filter(p => g.plantIds.includes(p.id));
  }
  if (f.energyType !== 'ALL') list = list.filter(p => p.type === f.energyType);
  if (f.plantId !== 'ALL') list = list.filter(p => p.id === f.plantId);
  return list;
}

export function AnalysisFilters({
  value, onChange, showPlant = true, showPeriod = true,
}: {
  value: FilterState;
  onChange: (v: FilterState) => void;
  showPlant?: boolean;
  showPeriod?: boolean;
}) {
  const update = (k: keyof FilterState, v: string) => onChange({ ...value, [k]: v });
  const plantsForSelect = filterPlants({ ...value, plantId: 'ALL' });

  return (
    <div className="panel p-3 mb-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <Label className="text-[10px] text-muted-foreground">그룹</Label>
          <Select value={value.groupId} onValueChange={(v) => update('groupId', v)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체 그룹</SelectItem>
              {PLANT_GROUPS.map(g => <SelectItem key={g.id} value={g.id}>[{g.type.toUpperCase()}] {g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">발전원</Label>
          <Select value={value.energyType} onValueChange={(v) => update('energyType', v)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체 발전원</SelectItem>
              {(['solar', 'wind', 'hydro', 'fuelcell', 'ess'] as EnergyType[]).map(t =>
                <SelectItem key={t} value={t}>{ENERGY_LABEL[t]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {showPlant && (
          <div>
            <Label className="text-[10px] text-muted-foreground">발전소</Label>
            <Select value={value.plantId} onValueChange={(v) => update('plantId', v)}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="ALL">전체 발전소</SelectItem>
                {plantsForSelect.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label className="text-[10px] text-muted-foreground">시작일</Label>
          <Input type="date" className="h-9 text-xs" value={value.startDate} onChange={(e) => update('startDate', e.target.value)} />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">종료일</Label>
          <Input type="date" className="h-9 text-xs" value={value.endDate} onChange={(e) => update('endDate', e.target.value)} />
        </div>
        {showPeriod && (
          <div>
            <Label className="text-[10px] text-muted-foreground">데이터 주기</Label>
            <Select value={value.period} onValueChange={(v) => update('period', v as Period)}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PERIOD_LABEL) as Period[]).map(p => <SelectItem key={p} value={p}>{PERIOD_LABEL[p]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}

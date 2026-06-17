import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, isValid, parse } from 'date-fns';

export interface MonthYM { year: number; month: number; } // month: 1-12

export interface PeriodRange { start: MonthYM; end: MonthYM; }

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 7 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function defaultPeriod(): PeriodRange {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  // current year Jan ~ current month
  return { start: { year: y, month: 1 }, end: { year: y, month: m } };
}

export function eachMonthInRange(p: PeriodRange): MonthYM[] {
  const result: MonthYM[] = [];
  let y = p.start.year, m = p.start.month;
  // ensure start <= end
  const startKey = p.start.year * 12 + p.start.month;
  const endKey = p.end.year * 12 + p.end.month;
  if (startKey > endKey) return [{ ...p.end }];
  while (y * 12 + m <= endKey) {
    result.push({ year: y, month: m });
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return result;
}

function ymToDate(ym: MonthYM): Date {
  return new Date(ym.year, ym.month - 1, 1);
}

function dateToYM(d: Date): MonthYM {
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

interface EndpointPickerProps {
  label: string;
  value: MonthYM;
  onChange: (v: MonthYM) => void;
}

function EndpointPicker({ label, value, onChange }: EndpointPickerProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(format(ymToDate(value), 'yyyy-MM-dd'));
  useEffect(() => { setText(format(ymToDate(value), 'yyyy-MM-dd')); }, [value]);

  const handleText = (v: string) => {
    setText(v);
    const parsed = parse(v, 'yyyy-MM-dd', new Date());
    if (isValid(parsed)) onChange(dateToYM(parsed));
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-muted-foreground shrink-0">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-8 px-2.5 text-xs tabular-nums font-normal gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
            {format(ymToDate(value), 'yyyy-MM-dd')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3 space-y-2" align="start">
          <Input
            value={text}
            onChange={(e) => handleText(e.target.value)}
            placeholder="YYYY-MM-DD"
            className="h-8 w-[180px] text-xs tabular-nums"
            autoFocus
          />
          <Calendar
            mode="single"
            selected={ymToDate(value)}
            onSelect={(d) => { if (d) { onChange(dateToYM(d)); setOpen(false); } }}
            initialFocus
            className={cn('p-0 pointer-events-auto')}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function PeriodPicker({ value, onChange }: { value: PeriodRange; onChange: (v: PeriodRange) => void }) {
  const months = eachMonthInRange(value);
  return (
    <div className="panel p-3 flex flex-wrap items-center gap-3">
      <span className="text-xs font-semibold text-foreground">조회 기간</span>
      <EndpointPicker label="시작" value={value.start} onChange={(v) => onChange({ ...value, start: v })} />
      <span className="text-muted-foreground text-xs">~</span>
      <EndpointPicker label="종료" value={value.end} onChange={(v) => onChange({ ...value, end: v })} />
      <span className="ml-auto text-[11px] text-muted-foreground">총 {months.length}개월 표출 ({months[0]?.year}-{String(months[0]?.month).padStart(2,'0')} ~ {months.at(-1)?.year}-{String(months.at(-1)?.month).padStart(2,'0')})</span>
    </div>
  );
}

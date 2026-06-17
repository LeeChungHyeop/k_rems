import { useEffect, useState } from 'react';
import { Bell, User, ExternalLink } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { ALARMS } from '@/data/mockData';
import { ScopeFilter } from '@/components/ScopeFilter';
import { useScope } from '@/components/ScopeContext';
import { PlantQuickJump } from '@/components/PlantQuickJump';

export function AppHeader() {
  const [now, setNow] = useState(new Date());
  const { scope, setScope } = useScope();
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ` +
    `${['일','월','화','수','목','금','토'][d.getDay()]} ` +
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

  const criticalCount = ALARMS.filter(a => a.level === 'critical').length;

  return (
    <header className="h-14 flex items-center gap-3 border-b bg-card px-3 shrink-0">
      <SidebarTrigger className="text-foreground" />
      <ScopeFilter value={scope} onApply={setScope} inline />


      <div className="ml-auto flex items-center gap-4">
        <PlantQuickJump />
        <div className="text-sm font-medium tabular-nums text-foreground hidden sm:block">{fmt(now)}</div>
        <button
          onClick={() => window.open(window.location.href, '_blank', 'noopener,noreferrer')}
          title="새창보기"
          className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted"
        >
          <ExternalLink className="h-4 w-4 text-foreground" />
        </button>
        <button className="relative inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted">
          <Bell className="h-5 w-5 text-foreground" />
          {criticalCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px]">
              {criticalCount}
            </Badge>
          )}
        </button>
        <div className="flex items-center gap-2 pl-3 border-l">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:block text-xs leading-tight">
            <div className="font-semibold text-foreground">통합관제 운영자</div>
            <div className="text-muted-foreground">신재생사업처</div>
          </div>
        </div>
      </div>
    </header>
  );
}

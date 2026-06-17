import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wrench, BarChart3, FileText, Activity, Settings, Tv, ExternalLink, FolderOpen } from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import khnpLogo from '@/assets/khnp-logo.png';
import { ThemeToggle } from '@/components/ThemeToggle';

function openInNewWindow(e: React.MouseEvent, url: string) {
  e.preventDefault();
  e.stopPropagation();
  const path = `${window.location.origin}${window.location.pathname}#${url}`;
  window.open(path, '_blank', 'noopener,noreferrer,width=1400,height=900');
}

function formatBuildTime() {
  try {
    const d = new Date(__BUILD_TIME__);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '-';
  }
}


const dashboardItems = [
  { title: 'TV-통합 대시보드', url: '/tv/main' },
  { title: 'TV-1 종합 발전정보', url: '/tv/general' },
  { title: 'TV-2 자체/SPC 정보', url: '/tv/own' },
  { title: 'TV-3 신재생 출력현황 정보', url: '/tv/output' },
];

const analysisItems = [
  { title: '발전이력', url: '/analysis/history' },
  { title: '알람이력', url: '/analysis/alarms' },
  { title: '정밀분석', url: '/analysis/advanced' },
  { title: '성능분석', url: '/analysis/performance' },
  { title: '출력제어', url: '/analysis/control' },
];

const omItems = [
  { title: '장애등록', url: '/om/faults' },
  { title: '예방정비', url: '/om/preventive' },
  { title: '이력조회', url: '/om/history' },
];

const revItems = [
  { title: '매출관리', url: '/revenue/sales' },
  { title: '비용관리', url: '/revenue/cost' },
  { title: '수익분석', url: '/revenue' },
];

const otherItems = [
  { title: '자료관리', url: '/data-board', icon: FolderOpen },
  { title: '보고서', url: '/report', icon: FileText },
  { title: '관리', url: '/admin', icon: Settings },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const isActive = (url: string) => pathname === url;

  const linkCls = (active: boolean) =>
    `flex items-center gap-2 rounded-md transition-colors ${
      active ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold' : 'hover:bg-sidebar-accent/50'
    }`;

  const renderGroup = (label: string, Icon: typeof LayoutDashboard, items: { title: string; url: string }[]) => (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-2 text-sidebar-foreground/90 font-semibold">
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span>{label}</span>}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((s) => (
            <SidebarMenuItem key={s.url} className="group/menu-item relative">
              <SidebarMenuButton asChild isActive={isActive(s.url)} size="sm">
                <NavLink to={s.url} className={linkCls(isActive(s.url))}>
                  {!collapsed ? <span className="pl-5 text-[12px]">{s.title}</span> : <span className="h-1.5 w-1.5 rounded-full bg-sidebar-foreground/60" />}
                </NavLink>
              </SidebarMenuButton>
              {!collapsed && (
                <button
                  type="button"
                  onClick={(e) => openInNewWindow(e, s.url)}
                  title="새 창으로 열기"
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover/menu-item:opacity-100 hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-opacity"
                  aria-label={`${s.title} 새 창으로 열기`}
                >
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border">
        <NavLink to="/" className="flex items-center gap-2 px-2 py-3 hover:bg-sidebar-accent/40 rounded-md transition-colors">
          <img
            src={khnpLogo}
            alt="한국수력원자력 KHNP"
            width={36}
            height={36}
            loading="lazy"
            className="h-9 w-9 object-contain shrink-0 bg-white rounded-md p-0.5"
          />
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[11px] text-sidebar-foreground/70 leading-tight">한국수력원자력</div>
              <div className="text-sm font-bold text-sidebar-foreground leading-tight truncate">신재생통합관리시스템</div>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="sidebar-scroll">
        {renderGroup('대시보드', Tv, dashboardItems)}
        {renderGroup('발전분석', Activity, analysisItems)}
        {renderGroup('정비이력', Wrench, omItems)}
        {renderGroup('수익분석', BarChart3, revItems)}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherItems.map((item) => (
                <SidebarMenuItem key={item.url} className="group/menu-item relative">
                  <SidebarMenuButton asChild isActive={isActive(item.url)} size="sm">
                    <NavLink to={item.url} className={linkCls(isActive(item.url))}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="text-[12px]">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                  {!collapsed && (
                    <button
                      type="button"
                      onClick={(e) => openInNewWindow(e, item.url)}
                      title="새 창으로 열기"
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover/menu-item:opacity-100 hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-opacity"
                      aria-label={`${item.title} 새 창으로 열기`}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <ThemeToggle collapsed={collapsed} />
        {!collapsed && (
          <div className="px-2 py-1 text-[10px] text-sidebar-foreground/60 leading-tight border-t border-sidebar-border/60">
            <div>K-REMS v0.5 · © KHNP</div>
            <div className="mt-0.5">최근배포일: {formatBuildTime()}</div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

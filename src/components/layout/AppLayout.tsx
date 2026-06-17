import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ScopeProvider } from '@/components/ScopeContext';
import { PlantOrderProvider } from '@/components/PlantOrderContext';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

export function AppLayout() {
  const { pathname } = useLocation();
  const isTv = pathname.startsWith('/tv/');

  if (isTv) {
    return (
      <div className="min-h-screen w-full bg-[hsl(212_80%_8%)] text-white">
        <Outlet />
      </div>
    );
  }

  return (
    <ScopeProvider>
      <PlantOrderProvider>
        <SidebarProvider defaultOpen>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <AppHeader />
              <main className="flex-1 overflow-auto">
                <Outlet />
              </main>
            </div>
          </div>
        </SidebarProvider>
      </PlantOrderProvider>
    </ScopeProvider>
  );
}

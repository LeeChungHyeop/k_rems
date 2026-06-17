import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import SiteDashboards from "./pages/SiteDashboards";
import PlantDetail from "./pages/PlantDetail";
import PowerHistory from "./pages/analysis/PowerHistory";
import AlarmHistory from "./pages/analysis/AlarmHistory";

import AdvancedAnalysis from "./pages/analysis/AdvancedAnalysis";
import PerformanceAnalysis from "./pages/analysis/PerformanceAnalysis";
import OutputControl from "./pages/analysis/OutputControl";
import FaultRegistration from "./pages/om/FaultRegistration";
import PreventiveMaintenance from "./pages/om/PreventiveMaintenance";
import MaintenanceHistory from "./pages/om/MaintenanceHistory";
import { SalesManagement, CostManagement } from "./pages/revenue/SalesAndCost";
import Revenue from "./pages/Revenue";
import DataBoard from "./pages/DataBoard";
import Report from "./pages/Report";
import Admin from "./pages/Admin";
import { TvMain, TvGeneral, TvOwn, TvOutput } from "./pages/TvScreens";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard/group/:groupId" element={<Dashboard />} />
            <Route path="/dashboard/operator/:operatorId" element={<Dashboard />} />
            <Route path="/site-dashboards" element={<SiteDashboards />} />
            <Route path="/plant/:id" element={<PlantDetail />} />

            {/* 발전분석 */}
            <Route path="/analysis/history" element={<PowerHistory />} />
            <Route path="/analysis/alarms" element={<AlarmHistory />} />
            
            <Route path="/analysis/advanced" element={<AdvancedAnalysis />} />
            <Route path="/analysis/performance" element={<PerformanceAnalysis />} />
            <Route path="/analysis/control" element={<OutputControl />} />

            {/* 정비이력 */}
            <Route path="/om/faults" element={<FaultRegistration />} />
            <Route path="/om/preventive" element={<PreventiveMaintenance />} />
            <Route path="/om/history" element={<MaintenanceHistory />} />

            {/* 수익분석 */}
            <Route path="/revenue/sales" element={<SalesManagement />} />
            <Route path="/revenue/cost" element={<CostManagement />} />
            <Route path="/revenue" element={<Revenue />} />

            <Route path="/data-board" element={<DataBoard />} />
            <Route path="/report" element={<Report />} />
            <Route path="/admin" element={<Admin />} />

            {/* TV */}
            <Route path="/tv/main" element={<TvMain />} />
            <Route path="/tv/general" element={<TvGeneral />} />
            <Route path="/tv/own" element={<TvOwn />} />
            <Route path="/tv/output" element={<TvOutput />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

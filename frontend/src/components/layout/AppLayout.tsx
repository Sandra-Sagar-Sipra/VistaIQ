import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { Sidebar, SidebarContent, SidebarHeader } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { TopbarActionsProvider } from "@/components/layout/TopbarActionsContext";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

const SIDEBAR_COLLAPSED_KEY = "vistaiq.sidebar-collapsed";

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true"
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  return (
    <TopbarActionsProvider>
      <div className="flex h-screen flex-col bg-background">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((value) => !value)} />

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="w-[260px] border-white/[0.06] bg-slate-900 p-0 sm:max-w-[260px]">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
              <SidebarHeader collapsed={false} />
              <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar onOpenMobileSidebar={() => setMobileOpen(true)} />
            <main className="flex flex-1 flex-col overflow-y-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </TopbarActionsProvider>
  );
}

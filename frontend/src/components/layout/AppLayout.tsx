import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { Sidebar, SidebarContent } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
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
    <div className="flex h-screen flex-col bg-muted/30">
      <TopNav onOpenMobileSidebar={() => setMobileOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((value) => !value)} />

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 border-slate-800 bg-slate-950 p-0 sm:max-w-64">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
            <div className="flex h-14 items-center border-b border-slate-800 px-4">
              <span className="text-lg font-bold tracking-tight text-white">VistaIQ</span>
            </div>
            <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <main className="flex flex-1 flex-col overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

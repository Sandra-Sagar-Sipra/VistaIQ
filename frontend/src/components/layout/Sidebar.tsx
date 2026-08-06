import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Logo } from "@/components/Logo";
import { NAV_GROUPS } from "@/components/layout/nav-items";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function SidebarHeader({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "flex h-16 shrink-0 items-center border-b border-white/[0.06]",
        collapsed ? "justify-center px-3" : "px-5"
      )}
    >
      <Logo variant="light" size={collapsed ? 30 : 34} />
    </div>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

export function SidebarContent({ collapsed, onNavigate }: SidebarContentProps) {
  return (
    <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
      <TooltipProvider delayDuration={200}>
        {NAV_GROUPS.map((group, groupIndex) => (
          <div key={group.label} className={cn(groupIndex > 0 && "mt-5")}>
            {collapsed ? (
              groupIndex > 0 && <div className="mx-2 mb-3 border-t border-white/[0.06]" />
            ) : (
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
            )}

            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const link = (
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-150 hover:bg-white/[0.06] hover:text-white",
                        collapsed && "justify-center px-0",
                        isActive &&
                          "bg-primary/15 text-white shadow-[inset_2.5px_0_0_0_hsl(var(--primary))] hover:bg-primary/20"
                      )
                    }
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                      <item.icon className="h-[18px] w-[18px]" />
                    </span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );

                if (!collapsed) {
                  return <div key={item.to}>{link}</div>;
                }

                return (
                  <Tooltip key={item.to}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        ))}
      </TooltipProvider>
    </nav>
  );
}

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col bg-slate-900 transition-[width] duration-200 lg:flex",
        collapsed ? "w-20" : "w-[260px]"
      )}
    >
      <SidebarHeader collapsed={collapsed} />
      <SidebarContent collapsed={collapsed} />

      <div className="border-t border-white/[0.06] p-3">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4" />
              Collapse
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

import { useState, type FormEvent } from "react";
import { Bell, Check, ChevronDown, Menu, RefreshCw, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useTopbarActions } from "@/components/layout/TopbarActionsContext";
import { UserMenu } from "@/features/auth/components/UserMenu";
import { cn } from "@/lib/utils";

const ENVIRONMENTS = [
  { label: "Production", color: "bg-emerald-500" },
  { label: "Staging", color: "bg-amber-500" },
  { label: "Development", color: "bg-slate-400" },
];

const NOTIFICATIONS = [
  {
    id: "n1",
    title: "New critical alert on Payments",
    detail: "Error rate exceeded threshold 5 minutes ago.",
  },
  {
    id: "n2",
    title: "Monitoring source reconnected",
    detail: "GitHub Org Webhooks is receiving events again.",
  },
  {
    id: "n3",
    title: "Weekly risk digest is ready",
    detail: "Portfolio health summary for the last 7 days.",
  },
];

interface TopbarProps {
  onOpenMobileSidebar: () => void;
}

export function Topbar({ onOpenMobileSidebar }: TopbarProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [environment, setEnvironment] = useState(ENVIRONMENTS[0].label);
  const { onRefresh, isRefreshing, lastUpdated } = useTopbarActions();

  const activeEnvironment = ENVIRONMENTS.find((env) => env.label === environment) ?? ENVIRONMENTS[0];

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault();
    navigate(`/search${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`);
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border/60 bg-card px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 lg:hidden"
        onClick={onOpenMobileSidebar}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search dashboards, alerts, incidents…"
          className="border-none bg-muted/60 pl-9 shadow-none focus-visible:bg-background focus-visible:ring-1"
        />
      </form>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden gap-2 sm:flex">
              <span className={cn("h-1.5 w-1.5 rounded-full", activeEnvironment.color)} />
              {environment}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Environment</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ENVIRONMENTS.map((env) => (
              <DropdownMenuItem key={env.label} onSelect={() => setEnvironment(env.label)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", env.color)} />
                {env.label}
                {env.label === environment && <Check className="ml-auto h-3.5 w-3.5" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {NOTIFICATIONS.map((notification) => (
              <DropdownMenuItem key={notification.id} className="flex-col items-start gap-0.5 py-2.5">
                <p className="text-sm font-medium text-foreground">{notification.title}</p>
                <p className="text-xs text-muted-foreground">{notification.detail}</p>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {onRefresh && (
          <>
            <span className="hidden whitespace-nowrap text-xs text-muted-foreground xl:inline">
              Updated {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "—"}
            </span>
            <Button variant="ghost" size="icon" onClick={onRefresh} disabled={isRefreshing} aria-label="Refresh">
              <RefreshCw className={cn("h-[18px] w-[18px]", isRefreshing && "animate-spin")} />
            </Button>
          </>
        )}

        <div className="ml-1 h-6 w-px bg-border/60" />

        <UserMenu />
      </div>
    </header>
  );
}

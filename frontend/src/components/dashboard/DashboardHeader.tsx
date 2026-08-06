import { useState, type FormEvent } from "react";
import { RefreshCw, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  dashboardKeys,
  useActivityFeed,
  useApplicationHealth,
  useDashboardSummary,
  useRecentIncidents,
  useSeverityBreakdown,
  useSourceStatus,
} from "@/hooks/use-dashboard";

const CURRENT_USER_EMAIL = "jaicind@siprahub.com";
const CURRENT_USER_NAME = "VistaIQ Admin";

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export function DashboardHeader() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const isFetching = useIsFetching({ queryKey: dashboardKeys.all }) > 0;

  const summary = useDashboardSummary();
  const health = useApplicationHealth();
  const severity = useSeverityBreakdown();
  const incidents = useRecentIncidents();
  const activity = useActivityFeed();
  const sources = useSourceStatus();

  const lastUpdated = Math.max(
    summary.dataUpdatedAt,
    health.dataUpdatedAt,
    severity.dataUpdatedAt,
    incidents.dataUpdatedAt,
    activity.dataUpdatedAt,
    sources.dataUpdatedAt
  );

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  }

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault();
    navigate(`/search${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`);
  }

  return (
    <div className="flex flex-col gap-4 border-b bg-background px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">VistaIQ Dashboard</h1>
        <p className="text-sm text-muted-foreground">Unified Application Health &amp; Security Overview</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search…"
            className="pl-8"
          />
        </form>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching}>
            <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Refresh
          </Button>

          <span className="hidden whitespace-nowrap text-xs text-muted-foreground sm:inline">
            Updated {lastUpdated > 0 ? new Date(lastUpdated).toLocaleTimeString() : "—"}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Avatar>
                  <AvatarFallback>{initials(CURRENT_USER_EMAIL)}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium text-foreground">{CURRENT_USER_NAME}</p>
                <p className="text-xs text-muted-foreground">{CURRENT_USER_EMAIL}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate("/settings")}>Settings</DropdownMenuItem>
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

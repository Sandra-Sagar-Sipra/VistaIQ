import {
  AppWindow,
  Bell,
  Bookmark,
  Boxes,
  LayoutDashboard,
  Network,
  Radio,
  Search,
  Settings,
  ShieldAlert,
  Waypoints,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Monitoring Sources", to: "/monitoring-sources", icon: Radio },
  { label: "Applications", to: "/applications", icon: AppWindow },
  { label: "Components", to: "/components", icon: Boxes },
  { label: "Mappings", to: "/mappings", icon: Waypoints },
  { label: "Alerts", to: "/alerts", icon: Bell },
  { label: "Incidents", to: "/incidents", icon: ShieldAlert },
  { label: "Correlation Groups", to: "/correlation-groups", icon: Network },
  { label: "Search", to: "/search", icon: Search },
  { label: "Saved Views", to: "/saved-views", icon: Bookmark },
  { label: "Settings", to: "/settings", icon: Settings },
];

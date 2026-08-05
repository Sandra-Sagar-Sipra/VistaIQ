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

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", to: "/", icon: LayoutDashboard },
      { label: "Search", to: "/search", icon: Search },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { label: "Monitoring Sources", to: "/monitoring-sources", icon: Radio },
      { label: "Applications", to: "/applications", icon: AppWindow },
      { label: "Components", to: "/components", icon: Boxes },
      { label: "Mappings", to: "/mappings", icon: Waypoints },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Alerts", to: "/alerts", icon: Bell },
      { label: "Incidents", to: "/incidents", icon: ShieldAlert },
      { label: "Correlation Groups", to: "/correlation-groups", icon: Network },
      { label: "Saved Views", to: "/saved-views", icon: Bookmark },
    ],
  },
  {
    label: "Administration",
    items: [{ label: "Settings", to: "/settings", icon: Settings }],
  },
];

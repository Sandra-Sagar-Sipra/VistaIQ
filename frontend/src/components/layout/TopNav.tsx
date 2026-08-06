import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";

interface TopNavProps {
  onOpenMobileSidebar: () => void;
}

export function TopNav({ onOpenMobileSidebar }: TopNavProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobileSidebar}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <span className="text-base font-bold tracking-tight text-foreground">VistaIQ</span>
    </header>
  );
}

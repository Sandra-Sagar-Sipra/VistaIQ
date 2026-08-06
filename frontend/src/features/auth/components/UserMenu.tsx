import { LogOut, Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { signOut } from "@/auth/msalConfig";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/features/auth/hooks/use-me";

/**
 * Initials of the directory name when there is one ("Ada Lovelace" -> "AL"),
 * otherwise the start of the address. Derived from the signed-in user rather
 * than a constant, so it follows whoever is actually authenticated.
 */
function initials(displayName: string | null | undefined, email: string) {
  const words = displayName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function UserMenu() {
  const navigate = useNavigate();
  const { data: me, isLoading, isError } = useMe();

  if (isLoading) {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }

  if (isError || !me) {
    // Signed in with Microsoft but the API rejected the token. Usually a
    // scope or audience mismatch rather than anything the user did, so offer
    // the one action that can help: sign out and start again.
    return (
      <Button variant="outline" size="sm" onClick={() => void signOut()}>
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    );
  }

  const label = me.display_name?.trim() || me.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center rounded-full outline-none ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Account menu"
        >
          <Avatar className="h-9 w-9 border border-border/60">
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {initials(me.display_name, me.email)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-foreground">{label}</p>
            <p className="text-xs leading-none text-muted-foreground">{me.email}</p>
            {me.role ? (
              <p className="pt-1 text-xs capitalize leading-none text-muted-foreground">{me.role}</p>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/settings")}>
          <SettingsIcon className="h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

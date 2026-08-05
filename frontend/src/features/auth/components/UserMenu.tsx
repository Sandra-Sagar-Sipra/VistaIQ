import { LogOut, User as UserIcon } from "lucide-react";

import { signOut } from "@/auth/msalConfig";
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

export function UserMenu() {
  const { data: me, isLoading, isError } = useMe();

  if (isLoading) {
    return <Skeleton className="h-9 w-40" />;
  }

  if (isError || !me) {
    // Signed in with Microsoft but the API rejected the token. Usually a
    // scope or audience mismatch rather than anything the user did, so offer
    // the one action that can help: sign out and start again.
    return (
      <Button variant="outline" size="sm" onClick={() => void signOut()}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign out
      </Button>
    );
  }

  const label = me.display_name?.trim() || me.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-[16rem]">
          <UserIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{label}</p>
            <p className="text-xs leading-none text-muted-foreground">{me.email}</p>
            {me.role ? (
              <p className="pt-1 text-xs leading-none text-muted-foreground">Role: {me.role}</p>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

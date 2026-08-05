import { Construction } from "lucide-react";
import { useLocation } from "react-router-dom";

function titleFromPath(pathname: string) {
  const segment = pathname.replace(/^\//, "").split("/")[0];
  if (!segment) return "This page";
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function ComingSoonPage() {
  const location = useLocation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="rounded-full bg-muted p-3">
        <Construction className="h-6 w-6 text-muted-foreground" />
      </div>
      <h1 className="text-lg font-semibold text-foreground">{titleFromPath(location.pathname)}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This section of VistaIQ is under construction. Check back soon.
      </p>
    </div>
  );
}

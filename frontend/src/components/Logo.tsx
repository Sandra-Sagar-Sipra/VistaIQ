import logoColorSrc from "@/assets/images/logo.png";
import logoOnDarkSrc from "@/assets/images/logo-on-dark.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Maximum height in pixels. Width scales automatically to preserve the source aspect ratio. */
  size?: number;
  className?: string;
  /**
   * "color" is the source lockup as provided -- navy wordmark, blue "IQ" --
   * for light surfaces. "light" recolors the navy wordmark to white (the
   * blue is left untouched, it already reads fine on dark) for the navy
   * sidebar, where the original navy text is nearly invisible against navy.
   * Both are generated from the same single source file; nothing is
   * hand-drawn or re-colored by eye.
   */
  variant?: "color" | "light";
  /**
   * Reserved for a future icon-only mark. The current asset is a full
   * lockup (mark + "VistaIQ" wordmark baked in), so there is no separate
   * text to toggle yet -- accepted now so call sites don't need to change
   * when one exists.
   */
  showText?: boolean;
}

export function Logo({ size = 32, className, variant = "color" }: LogoProps) {
  return (
    <img
      src={variant === "light" ? logoOnDarkSrc : logoColorSrc}
      alt="VistaIQ"
      draggable={false}
      className={cn("w-auto max-w-full shrink-0 object-contain", className)}
      style={{ maxHeight: size }}
    />
  );
}

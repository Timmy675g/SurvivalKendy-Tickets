import { cn } from "@/lib/utils";

export function Select({ className, ...props }) {
  return (
    <select
      className={cn(
        "flex min-h-11 w-full rounded-md border border-input bg-background/70 px-3 py-2 text-base text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
        className
      )}
      {...props}
    />
  );
}

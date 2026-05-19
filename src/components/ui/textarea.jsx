import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "flex min-h-32 w-full resize-y rounded-md border border-input bg-background/70 px-3 py-3 text-base leading-6 text-foreground transition placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-28 sm:text-sm",
        className
      )}
      {...props}
    />
  );
}

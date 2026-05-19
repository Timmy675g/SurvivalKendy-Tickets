import { cn } from "@/lib/utils";

const tones = {
  Critical: "border-destructive/40 bg-destructive/15 text-red-200",
  High: "border-orange-400/40 bg-orange-500/15 text-orange-200",
  Medium: "border-accent/40 bg-accent/15 text-amber-100",
  Low: "border-primary/35 bg-primary/12 text-emerald-100",
  Open: "border-primary/35 bg-primary/12 text-emerald-100",
  "In Progress": "border-cyan-400/35 bg-cyan-500/12 text-cyan-100",
  Resolved: "border-slate-400/35 bg-slate-500/15 text-slate-200"
};

export function Badge({ className, tone, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-md border px-2.5 py-1 text-xs font-medium tracking-normal",
        tones[tone] || "border-border bg-secondary text-secondary-foreground",
        className
      )}
      {...props}
    />
  );
}

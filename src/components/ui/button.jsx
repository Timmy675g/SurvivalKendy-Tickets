import { cn } from "@/lib/utils";

const variants = {
  default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border border-border bg-transparent hover:bg-secondary text-foreground",
  ghost: "hover:bg-secondary text-muted-foreground hover:text-foreground",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
};

export function Button({ className, variant = "default", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium tracking-normal transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

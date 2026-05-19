import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return <div className={cn("min-w-0 rounded-lg border border-border/90 bg-card/86 text-card-foreground shadow-panel backdrop-blur", className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1.5 p-4 sm:p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h2 className={cn("break-words text-xl font-semibold leading-tight tracking-normal [&_svg]:size-5 [&_svg]:shrink-0", className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <p className={cn("break-words text-sm leading-6 text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-4 pt-0 sm:p-6 sm:pt-0", className)} {...props} />;
}

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        <h1 className="text-2xl font-extrabold text-thg-slate sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-thg-slate-light">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-dashed border-thg-slate/20 bg-thg-surface/60 px-6 py-12 text-center">
      {icon && <div className="mx-auto mb-3 text-thg-slate-light">{icon}</div>}
      <p className="font-sans font-bold text-thg-slate">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-thg-slate-light">{description}</p>
      )}
    </div>
  );
}

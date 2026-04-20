import { cn } from "@/lib/utils";

type StatusType =
  | "pending"
  | "initialized"
  | "successful"
  | "paid"
  | "failed"
  | "cancelled"
  | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  const getStatusStyles = () => {
    switch (normalizedStatus) {
      case "successful":
      case "paid":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
      case "pending":
      case "initialized":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case "failed":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";
      case "cancelled":
        return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20";
      default:
        return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize transition-colors",
        getStatusStyles(),
        className,
      )}
    >
      {normalizedStatus}
    </span>
  );
}

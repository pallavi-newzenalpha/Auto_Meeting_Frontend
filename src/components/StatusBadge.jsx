import { AlertCircle, CheckCircle2, Circle, Clock3, LoaderCircle, XCircle } from "lucide-react";

const STATUS_STYLES = {
  not_started: {
    label: "Not Started",
    className: "bg-slate-100 text-slate-700 ring-slate-200",
    icon: Circle,
  },
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    icon: Clock3,
  },
  locked: {
    label: "Locked",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    icon: Clock3,
  },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    icon: LoaderCircle,
    spin: true,
  },
  processing: {
    label: "Processing",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    icon: LoaderCircle,
    spin: true,
  },
  transcript_in_progress: {
    label: "Transcript In Progress",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    icon: LoaderCircle,
    spin: true,
  },
  transcript_completed: {
    label: "Transcript Ready",
    className: "bg-sky-50 text-sky-700 ring-sky-200",
    icon: CheckCircle2,
  },
  summary_in_progress: {
    label: "Summary In Progress",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    icon: LoaderCircle,
    spin: true,
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-sky-50 text-sky-700 ring-sky-200",
    icon: Clock3,
  },
  upcoming: {
    label: "Upcoming",
    className: "bg-sky-50 text-sky-700 ring-sky-200",
    icon: Clock3,
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icon: CheckCircle2,
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icon: CheckCircle2,
  },
  rescheduled: {
    label: "Rescheduled",
    className: "bg-violet-50 text-violet-700 ring-violet-200",
    icon: Clock3,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
    icon: XCircle,
  },
  declined: {
    label: "Declined",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
    icon: XCircle,
  },
  failed: {
    label: "Failed",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
    icon: AlertCircle,
  },
};

function humanize(status) {
  return String(status || "unknown")
    .split("_")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export default function StatusBadge({ status, label, className = "" }) {
  const key = String(status || "").trim().toLowerCase();
  const config = STATUS_STYLES[key] || {
    label: humanize(key || "unknown"),
    className: "bg-slate-100 text-slate-700 ring-slate-200",
    icon: Circle,
  };
  const Icon = config.icon;

  return (
    <span
      className={[
        "inline-flex min-h-[24px] items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ring-1 ring-inset",
        config.className,
        className,
      ].join(" ")}
    >
      <Icon size={10} className={config.spin ? "animate-spin" : ""} />
      {label || config.label}
    </span>
  );
}

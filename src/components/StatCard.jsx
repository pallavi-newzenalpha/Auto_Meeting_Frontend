import { ArrowRight } from "lucide-react";

export default function StatCard({
  icon: Icon,
  label,
  value,
  description,
  onClick,
  ctaLabel = "Open",
  accent = "from-emerald-600/10 via-white to-white",
  selected = false,
}) {
  const isInteractive = typeof onClick === "function";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isInteractive}
      className={[
        "group relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br p-5 text-left shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-950/10",
        "focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2",
        isInteractive ? "cursor-pointer" : "cursor-default",
        accent,
        selected ? "border-emerald-400 shadow-lg shadow-emerald-950/10 ring-2 ring-emerald-200" : "",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 via-emerald-400 to-transparent opacity-80" />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </div>
          <div className="text-3xl font-bold tracking-tight text-slate-950">{value}</div>
          {description ? (
            <p className="max-w-[28ch] text-sm leading-6 text-slate-600">{description}</p>
          ) : null}
        </div>
        {Icon ? (
          <div className="rounded-2xl bg-white/90 p-3 text-emerald-700 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
            <Icon size={18} />
          </div>
        ) : null}
      </div>
      {isInteractive ? (
        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition-transform duration-200 group-hover:translate-x-0.5">
          {ctaLabel}
          <ArrowRight size={14} />
        </div>
      ) : null}
    </button>
  );
}

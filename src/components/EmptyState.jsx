export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}) {
  return (
    <div
      className={[
        "flex flex-col items-start gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-left",
        className,
      ].join(" ")}
    >
      {Icon ? (
        <div className="rounded-2xl bg-white p-3 text-emerald-700 shadow-sm ring-1 ring-slate-200">
          <Icon size={20} />
        </div>
      ) : null}
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight text-slate-900">{title}</h3>
        <p className="max-w-[60ch] text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

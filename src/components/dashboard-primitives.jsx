import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileText,
  LoaderCircle,
  MessageSquareText,
  Sparkles,
  XCircle,
} from "lucide-react";

const STATUS_MAP = {
  locked: { label: "Locked", tone: "warning", icon: Clock3 },
  confirmed: { label: "Confirmed", tone: "success", icon: CheckCircle2 },
  rescheduled: { label: "Rescheduled", tone: "warning", icon: CalendarClock },
  cancelled: { label: "Cancelled", tone: "danger", icon: XCircle },
  declined: { label: "Declined", tone: "danger", icon: XCircle },
  not_started: { label: "Not Started", tone: "neutral", icon: CircleDashed },
  in_progress: { label: "In Progress", tone: "info", icon: LoaderCircle },
  processing: { label: "Processing", tone: "info", icon: LoaderCircle },
  scheduled: { label: "Scheduled", tone: "info", icon: Clock3 },
  completed: { label: "Completed", tone: "success", icon: CheckCircle2 },
  failed: { label: "Failed", tone: "danger", icon: AlertCircle },
  pending: { label: "Pending", tone: "warning", icon: Clock3 },
};

export function formatStatusLabel(value) {
  const key = String(value || "").trim().toLowerCase();
  if (!key) {
    return "Unknown";
  }

  if (STATUS_MAP[key]?.label) {
    return STATUS_MAP[key].label;
  }

  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function StatusBadge({ status, tone, label }) {
  const key = String(status || "").trim().toLowerCase();
  const config = STATUS_MAP[key] || {};
  const resolvedTone = tone || config.tone || "neutral";
  const resolvedLabel = label || config.label || formatStatusLabel(status);
  const Icon = config.icon || CircleDashed;

  return (
    <span className={`status-badge status-badge--${resolvedTone}`}>
      <Icon size={13} />
      {resolvedLabel}
    </span>
  );
}

export function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <Icon size={22} />
      </div>
      <div className="empty-state__title">{title}</div>
      <div className="empty-state__description">{description}</div>
      {actionLabel && onAction ? (
        <button type="button" className="action-button action-button--secondary" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function SectionHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="section-header">
      <div className="section-header__copy">
        {eyebrow ? <div className="section-header__eyebrow">{eyebrow}</div> : null}
        <h2 className="section-header__title">{title}</h2>
        {description ? <p className="section-header__description">{description}</p> : null}
      </div>
      {actions ? <div className="section-header__actions">{actions}</div> : null}
    </div>
  );
}

export function MetricCard({ icon: Icon, label, value, meta, accent = "forest", actionLabel, onAction }) {
  return (
    <article className={`metric-card metric-card--${accent}`}>
      <div className="metric-card__icon">
        <Icon size={18} />
      </div>
      <div className="metric-card__body">
        <div className="metric-card__label">{label}</div>
        <div className="metric-card__value">{value}</div>
        {meta ? <div className="metric-card__meta">{meta}</div> : null}
      </div>
      {actionLabel && onAction ? (
        <button type="button" className="metric-card__action" onClick={onAction}>
          {actionLabel}
          <ArrowRight size={14} />
        </button>
      ) : null}
    </article>
  );
}

export function ActionButton({ children, variant = "primary", ...props }) {
  return (
    <button {...props} className={`action-button action-button--${variant} ${props.className || ""}`.trim()}>
      {children}
    </button>
  );
}

export function SuggestedPrompts({ prompts, onSelect }) {
  if (!Array.isArray(prompts) || !prompts.length) {
    return null;
  }

  return (
    <div className="prompt-strip">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          className="prompt-chip"
          onClick={() => onSelect(prompt)}
        >
          <MessageSquareText size={14} />
          {prompt}
        </button>
      ))}
    </div>
  );
}

export function SummaryMetricCard({ icon: Icon = Sparkles, label, value, tone = "forest" }) {
  return (
    <div className={`summary-metric summary-metric--${tone}`}>
      <div className="summary-metric__icon">
        <Icon size={16} />
      </div>
      <div>
        <div className="summary-metric__label">{label}</div>
        <div className="summary-metric__value">{value}</div>
      </div>
    </div>
  );
}

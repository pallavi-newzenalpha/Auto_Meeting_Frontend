import { Fragment, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BarChart3,
  CalendarDays,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  LogIn,
  MessageSquareText,
  Rows3,
  RefreshCcw,
  Sparkles,
  WandSparkles,
  X,
  Users,
} from "lucide-react";
import EmptyState from "./components/EmptyState";
import StatCard from "./components/StatCard";
import StatusBadge from "./components/StatusBadge";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const GOOGLE_AUTH_BASE_URL =
  import.meta.env.VITE_GOOGLE_AUTH_BASE_URL || "http://127.0.0.1:8001";
const ENABLE_DEMO_TRANSCRIPT_FLOW =
  String(import.meta.env.VITE_ENABLE_DEMO_TRANSCRIPT_FLOW || "").toLowerCase() === "true";
const DEFAULT_INTERVIEWER_ID = 1;
const APP_DISPLAY_TIMEZONE = "Asia/Kolkata";

function formatDateInput(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLongDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatBackendAuditDateTime(value, timeZone = APP_DISPLAY_TIMEZONE) {
  if (!value) {
    return "-";
  }

  const normalizedValue =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(value)
      ? `${value}Z`
      : value;

  const date = normalizedValue instanceof Date ? normalizedValue : new Date(normalizedValue);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(date);
}

function formatDateLabel(value) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "short",
  }).format(date);
}

function formatFullDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function toDateTimeLocalInput(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function normalizeError(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error || "Something went wrong");
}

function parseMaybeJsonList(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string" || value.trim() === "") {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatSeconds(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  const totalSeconds = Math.max(0, Math.round(value));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getInitials(value) {
  if (!value) {
    return "IN";
  }

  const parts = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "IN";
  }

  return parts.map((item) => item[0]?.toUpperCase() || "").join("");
}

function humanizeStatus(value) {
  return String(value || "unknown")
    .split("_")
    .filter(Boolean)
    .map((part) => (part[0] ? part[0].toUpperCase() + part.slice(1) : ""))
    .join(" ");
}

function paginateItems(items, currentPage, perPage) {
  const safeItems = Array.isArray(items) ? items : [];
  const totalPages = Math.max(1, Math.ceil(safeItems.length / perPage));
  const normalizedPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (normalizedPage - 1) * perPage;

  return {
    items: safeItems.slice(startIndex, startIndex + perPage),
    totalPages,
    currentPage: normalizedPage,
  };
}

function parseCandidateEmails(value) {
  return Array.from(
    new Set(
      String(value || "")
        .split(/[\n,;]+/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "availability", label: "Availability", icon: Clock3 },
  { key: "leave", label: "Leave", icon: CircleAlert },
  { key: "slots", label: "Slots", icon: CalendarDays },
  { key: "interviews", label: "Interviews", icon: Users },
  { key: "transcript", label: "Transcript", icon: FileText },
  { key: "summaries", label: "Summaries", icon: Sparkles },
  { key: "ai-chat", label: "AI Chat", icon: MessageSquareText },
];

const INTERVIEWS_PER_PAGE = 8;
const SUMMARIES_PER_PAGE = 8;
const CHAT_SELECTIONS_PER_PAGE = 8;
const QUEUE_ITEMS_PER_PAGE = 4;
const AI_PROMPT_SUGGESTIONS = [
  "What were the candidate's strongest answers?",
  "What concerns should I follow up on?",
  "Summarize the interview in hiring-manager language.",
];
const RESCHEDULE_FILTERS = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "next_available_day", label: "Next Available Day" },
  { key: "next_7_days", label: "Next 7 Days" },
  { key: "this_week", label: "This Week" },
  { key: "next_week", label: "Next Week" },
];

function ActionButton({
  children,
  variant = "primary",
  className = "",
  disabled = false,
  ...props
}) {
  const variants = {
    primary:
      "bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm hover:shadow-md disabled:bg-emerald-400",
    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-700 shadow-sm",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 shadow-sm hover:shadow-md disabled:bg-rose-300",
  };

  return (
    <button
      {...props}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:shadow-none",
        variants[variant] || variants.primary,
        className,
      ].join(" ")}
    >
      {disabled && props["data-loading"] ? <LoaderCircle size={15} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

function SectionHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-1.5">
        {eyebrow ? (
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            {eyebrow}
          </div>
        ) : null}
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
        {description ? <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

function SuggestedPrompts({ prompts, onSelect }) {
  if (!prompts?.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}

function SummaryMetricCard({ icon: Icon, label, value, tone = "emerald" }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    teal: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={["rounded-xl p-2 ring-1", tones[tone] || tones.emerald].join(" ")}>
          {Icon ? <Icon size={16} /> : <BarChart3 size={16} />}
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </div>
          <div className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{value}</div>
        </div>
      </div>
    </div>
  );
}

function ModalShell({
  open,
  title,
  subtitle,
  onClose,
  children,
  width = 920,
  zIndex = 1200,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      style={{ ...styles.modalOverlay, zIndex }}
      onClick={onClose}
      role="presentation"
    >
      <div
        style={{ ...styles.modalCard, maxWidth: width }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div style={styles.modalHeader}>
          <div style={styles.modalHeaderText}>
            <h3 style={styles.modalTitle}>{title}</h3>
            {subtitle ? <p style={styles.modalSubtitle}>{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={styles.modalCloseButton}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>
        <div style={styles.modalBody}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;

    try {
      const payload = await response.json();
      if (typeof payload?.detail === "string") {
        detail = payload.detail;
      } else if (Array.isArray(payload?.detail) && payload.detail[0]?.msg) {
        detail = payload.detail[0].msg;
      }
    } catch {
      // Ignore JSON parse errors for non-JSON failure responses.
    }

    throw new Error(detail);
  }

  return response.json();
}

function startOfToday() {
  return formatDateInput(new Date());
}

function getPreferredInterviewId(items, currentId = null) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const currentExists = items.some((item) => item.id === currentId);
  if (currentExists) {
    return currentId;
  }

  const transcriptReady =
    items.find((item) => item.transcript_status === "completed" && item.summary_status === "completed") ||
    items.find((item) => item.transcript_status === "completed") ||
    items[0];

  return transcriptReady?.id ?? null;
}

function isFutureInterview(interview) {
  if (!interview?.start_time) {
    return false;
  }

  const start = new Date(interview.start_time);
  if (Number.isNaN(start.getTime())) {
    return false;
  }

  return (
    start.getTime() > Date.now() &&
    !["completed", "cancelled", "declined"].includes(String(interview.status || "").toLowerCase())
  );
}

function getInterviewStatusBadgeProps(interview) {
  const rawStatus = String(interview?.status || "").toLowerCase();

  if (rawStatus === "confirmed" && isFutureInterview(interview)) {
    return {
      status: "scheduled",
      label: "Upcoming",
    };
  }

  return {
    status: rawStatus || "pending",
    label: undefined,
  };
}

function getProcessingHelperLabel(interview) {
  if (!interview || !isFutureInterview(interview)) {
    return "";
  }

  if (
    String(interview.transcript_status || "").toLowerCase() === "completed" ||
    String(interview.summary_status || "").toLowerCase() === "completed"
  ) {
    return "Pre-generated insights available before the meeting.";
  }

  return "";
}

function canRetryCalendarSync(response) {
  return Boolean(response?.interview_updated && !response?.calendar_updated);
}

export default function InterviewDashboard() {
  const [page, setPage] = useState("dashboard");
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [googleConnection, setGoogleConnection] = useState({
    connected: false,
    interviewer_id: DEFAULT_INTERVIEWER_ID,
    name: "",
    email: "",
  });
  const [notice, setNotice] = useState({
    message: "",
    tone: "neutral",
  });
  const [selectedInterviewId, setSelectedInterviewId] = useState(null);
  const [transcriptState, setTranscriptState] = useState({
    loading: false,
    data: null,
    error: "",
  });
  const [summaryState, setSummaryState] = useState({
    loading: false,
    data: null,
    error: "",
  });
  const [chatState, setChatState] = useState({
    loading: false,
    messages: [],
    error: "",
  });
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatSending, setChatSending] = useState(false);

  const [slotInputDate, setSlotInputDate] = useState(startOfToday);
  const [slotResolvedDate, setSlotResolvedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotMessage, setSlotMessage] = useState("");
  const [slotTone, setSlotTone] = useState("neutral");
  const [candidateForm, setCandidateForm] = useState({
    candidate_name: "",
    candidate_email: "",
  });
  const [shareCandidatesText, setShareCandidatesText] = useState("");
  const [shareState, setShareState] = useState({
    loading: false,
    message: "",
    tone: "neutral",
    sharedCount: 0,
    failedCount: 0,
  });
  const [bookingState, setBookingState] = useState({
    loading: false,
    slotKey: null,
    message: "",
    tone: "neutral",
  });
  const [actionState, setActionState] = useState({
    loading: false,
    action: "",
    message: "",
    tone: "neutral",
    retryCalendarSync: false,
  });
  const [rescheduleForm, setRescheduleForm] = useState({
    start_time: "",
    end_time: "",
  });
  const [rescheduleSlotsState, setRescheduleSlotsState] = useState({
    loading: false,
    groups: [],
    error: "",
    helperMessage: "",
    fallbackKey: "",
  });
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState(null);
  const [rescheduleFilter, setRescheduleFilter] = useState("next_7_days");

  const [availabilityForm, setAvailabilityForm] = useState({
    interviewer_id: DEFAULT_INTERVIEWER_ID,
    timezone: "Asia/Kolkata",
    monday_enabled: true,
    tuesday_enabled: true,
    wednesday_enabled: true,
    thursday_enabled: true,
    friday_enabled: true,
    saturday_enabled: false,
    sunday_enabled: false,
    start_time: "09:00:00",
    end_time: "18:00:00",
    slot_duration_minutes: 30,
    buffer_minutes: 0,
    time_format: "24h",
    is_active: true,
  });
  const [availabilityState, setAvailabilityState] = useState({
    saving: false,
    message: "",
    tone: "neutral",
  });

  const [leaveForm, setLeaveForm] = useState({
    interviewer_id: DEFAULT_INTERVIEWER_ID,
    leave_date: startOfToday(),
    is_full_day: true,
    start_time: "09:00:00",
    end_time: "18:00:00",
    reason: "",
  });
  const [leaveState, setLeaveState] = useState({
    saving: false,
    message: "",
    tone: "neutral",
  });
  const [interviewsPage, setInterviewsPage] = useState(1);
  const [summariesPage, setSummariesPage] = useState(1);
  const [chatSelectionPage, setChatSelectionPage] = useState(1);
  const [queuePage, setQueuePage] = useState(1);
  const [dashboardFilter, setDashboardFilter] = useState("");
  const [demoFlowState, setDemoFlowState] = useState({
    loading: false,
    message: "",
    tone: "neutral",
  });
  const [scheduleHoverId, setScheduleHoverId] = useState(null);
  const [filterModalKey, setFilterModalKey] = useState("");
  const [detailModalInterviewId, setDetailModalInterviewId] = useState(null);
  const [workspaceModal, setWorkspaceModal] = useState("");
  const [interviewNotes, setInterviewNotes] = useState({});

  const interviewerId = useMemo(
    () => interviews[0]?.interviewer_id || googleConnection.interviewer_id || DEFAULT_INTERVIEWER_ID,
    [googleConnection.interviewer_id, interviews],
  );

  const dashboardCards = useMemo(() => {
    const upcoming = interviews.filter(
      (item) => item.status === "confirmed" || item.status === "locked",
    ).length;
    const reschedules = interviews.filter((item) => item.status === "rescheduled").length;
    const transcriptPending = interviews.filter(
      (item) => item.transcript_status !== "completed",
    ).length;
    const summaryComplete = interviews.filter(
      (item) => item.summary_status === "completed",
    ).length;

    return [
      {
        key: "upcoming",
        label: "Upcoming Interviews",
        value: upcoming,
        description: "Confirmed and locked interviews that need active coordination.",
        icon: CalendarDays,
      },
      {
        key: "pending_reschedules",
        label: "Pending Reschedules",
        value: reschedules,
        description: "Interview records that still need a finalized time update.",
        icon: Clock3,
      },
      {
        key: "transcripts_pending",
        label: "Transcripts Pending",
        value: transcriptPending,
        description: "Sessions waiting on transcript availability or post-processing.",
        icon: FileText,
      },
      {
        key: "completed_summaries",
        label: "Completed Summaries",
        value: summaryComplete,
        description: "Interview summaries already ready for review and follow-up.",
        icon: Sparkles,
      },
    ];
  }, [interviews]);

  const filteredDashboardInterviews = useMemo(() => {
    switch (dashboardFilter) {
      case "upcoming":
        return interviews.filter((item) => item.status === "confirmed" || item.status === "locked");
      case "pending_reschedules":
        return interviews.filter((item) => item.status === "rescheduled");
      case "transcripts_pending":
        return interviews.filter((item) => item.transcript_status !== "completed");
      case "completed_summaries":
        return interviews.filter((item) => item.summary_status === "completed");
      default:
        return interviews;
    }
  }, [dashboardFilter, interviews]);

  const topInterviews = useMemo(() => filteredDashboardInterviews.slice(0, 5), [filteredDashboardInterviews]);

  const summaryQueue = useMemo(
    () =>
      filteredDashboardInterviews.filter(
        (item) =>
          item.transcript_status === "completed" && item.summary_status !== "completed",
      ),
    [filteredDashboardInterviews],
  );

  const interviewerName = useMemo(
    () => googleConnection.name || interviews[0]?.interviewer_name || "Interviewer",
    [googleConnection.name, interviews],
  );

  const overviewMetrics = useMemo(() => {
    const confirmed = interviews.filter((item) => item.status === "confirmed").length;
    const scheduled = interviews.filter((item) => item.processing_status === "scheduled").length;
    const inReview = interviews.filter((item) => item.summary_status !== "completed").length;

    return { confirmed, scheduled, inReview };
  }, [interviews]);

  const selectedInterview = useMemo(
    () => interviews.find((item) => item.id === selectedInterviewId) || null,
    [interviews, selectedInterviewId],
  );
  const modalInterview = useMemo(
    () => interviews.find((item) => item.id === detailModalInterviewId) || null,
    [detailModalInterviewId, interviews],
  );
  const filterModalItems = useMemo(() => {
    if (!filterModalKey) {
      return [];
    }

    switch (filterModalKey) {
      case "upcoming":
        return interviews.filter((item) => item.status === "confirmed" || item.status === "locked");
      case "pending_reschedules":
        return interviews.filter((item) => item.status === "rescheduled");
      case "transcripts_pending":
        return interviews.filter((item) => item.transcript_status !== "completed");
      case "completed_summaries":
        return interviews.filter((item) => item.summary_status === "completed");
      default:
        return interviews;
    }
  }, [filterModalKey, interviews]);
  const pageMeta = useMemo(() => {
    switch (page) {
      case "interviews":
        return {
          eyebrow: "Interview Scheduling",
          title: "Interviews",
          subtitle: "Browse the full interview list, then open a dedicated detail page for actions and transcript context.",
        };
      case "interview-detail":
        return {
          eyebrow: "Interview Scheduling",
          title: "Interview Detail",
          subtitle: selectedInterview
            ? `${selectedInterview.candidate_name || selectedInterview.candidate_email} | ${selectedInterview.display_start_datetime || formatLongDateTime(selectedInterview.start_time)}`
            : "Review one interview at a time with booking actions, transcript context, and AI follow-up.",
        };
      case "summaries":
        return {
          eyebrow: "Interview Scheduling",
          title: "Summaries",
          subtitle: "Generate and review transcript summaries in a separate workspace so interview operations stay uncluttered.",
        };
      case "transcript":
        return {
          eyebrow: "Interview Scheduling",
          title: "Transcript",
          subtitle: "Review interview transcripts on a dedicated page instead of mixing them into the action workflow.",
        };
      case "ai-chat":
        return {
          eyebrow: "Interview Scheduling",
          title: "AI Chat",
          subtitle: "Ask focused follow-up questions against the selected interview transcript and summary context.",
        };
      case "slots":
        return {
          eyebrow: "Interview Scheduling",
          title: "Available Slots",
          subtitle: "Review live interviewer availability and book candidates into the next valid time window.",
        };
      case "availability":
        return {
          eyebrow: "Interview Scheduling",
          title: "Availability",
          subtitle: "Set interviewer working hours, slot duration, and scheduling preferences.",
        };
      case "leave":
        return {
          eyebrow: "Interview Scheduling",
          title: "Leave",
          subtitle: "Block full-day or partial-day leave so generated slots stay accurate.",
        };
      default:
        return {
          eyebrow: "Interview Scheduling Dashboard",
          title: "Production operations dashboard",
          subtitle: "Bookings, schedules, transcripts, summaries, and AI follow-up in one workspace.",
        };
    }
  }, [page, selectedInterview]);
  const paginatedInterviews = useMemo(
    () => paginateItems(interviews, interviewsPage, INTERVIEWS_PER_PAGE),
    [interviews, interviewsPage],
  );
  const paginatedSummaries = useMemo(
    () => paginateItems(interviews, summariesPage, SUMMARIES_PER_PAGE),
    [interviews, summariesPage],
  );
  const paginatedChatSelections = useMemo(
    () => paginateItems(interviews, chatSelectionPage, CHAT_SELECTIONS_PER_PAGE),
    [interviews, chatSelectionPage],
  );
  const paginatedQueue = useMemo(
    () => paginateItems(summaryQueue, queuePage, QUEUE_ITEMS_PER_PAGE),
    [summaryQueue, queuePage],
  );
  const filteredRescheduleGroups = useMemo(
    () => rescheduleSlotsState.groups,
    [rescheduleSlotsState.groups],
  );

  useEffect(() => {
    if ((page === "interviews" || page === "interview-detail" || page === "ai-chat") && interviews.length > 0) {
      const preferredId = getPreferredInterviewId(interviews, selectedInterviewId);
      if (preferredId !== selectedInterviewId) {
        setSelectedInterviewId(preferredId);
      }
    }
  }, [page, interviews, selectedInterviewId]);

  useEffect(() => {
    setInterviewsPage((current) => Math.min(current, Math.max(1, Math.ceil(interviews.length / INTERVIEWS_PER_PAGE))));
    setSummariesPage((current) => Math.min(current, Math.max(1, Math.ceil(interviews.length / SUMMARIES_PER_PAGE))));
    setChatSelectionPage((current) => Math.min(current, Math.max(1, Math.ceil(interviews.length / CHAT_SELECTIONS_PER_PAGE))));
  }, [interviews]);

  useEffect(() => {
    setQueuePage((current) => Math.min(current, Math.max(1, Math.ceil(summaryQueue.length / QUEUE_ITEMS_PER_PAGE))));
  }, [summaryQueue]);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const payload = await requestJson("/dashboard/interviews");
      const items = Array.isArray(payload?.items) ? payload.items : [];
      const resolvedInterviewerId =
        items[0]?.interviewer_id || googleConnection.interviewer_id || DEFAULT_INTERVIEWER_ID;
      setInterviews(items);
      setSelectedInterviewId((current) => getPreferredInterviewId(items, current));
      setAvailabilityForm((current) => ({ ...current, interviewer_id: resolvedInterviewerId }));
      setLeaveForm((current) => ({ ...current, interviewer_id: resolvedInterviewerId }));
      await loadGoogleConnectionStatus(resolvedInterviewerId);
    } catch (loadError) {
      setError(normalizeError(loadError));
    } finally {
      setLoading(false);
    }
  }

  async function loadGoogleConnectionStatus(interviewerIdValue = interviewerId) {
    try {
      const payload = await requestJson(`/auth/google/status?interviewer_id=${interviewerIdValue}`);
      setGoogleConnection({
        connected: Boolean(payload?.connected),
        interviewer_id: payload?.interviewer_id || interviewerIdValue || DEFAULT_INTERVIEWER_ID,
        name: payload?.name || "",
        email: payload?.email || "",
      });
    } catch {
      setGoogleConnection((current) => ({
        ...current,
        connected: false,
        interviewer_id: interviewerIdValue || current.interviewer_id || DEFAULT_INTERVIEWER_ID,
      }));
    }
  }

  async function fetchSlotsForDate(
    dateValue,
    {
      interviewerIdValue = interviewerId,
      includeGoogleBusy = false,
      includePastSlots = dateValue === startOfToday(),
    } = {},
  ) {
    const params = new URLSearchParams({
      date: dateValue,
      include_google_busy: includeGoogleBusy ? "true" : "false",
      include_past_slots: includePastSlots ? "true" : "false",
    });

    return requestJson(
      `/interviewers/interviewer/${interviewerIdValue}/slots?${params.toString()}`,
      { headers: {} },
    );
  }

  async function fetchSlotsForRange(
    dateFrom,
    dateTo,
    {
      interviewerIdValue = interviewerId,
      includeGoogleBusy = false,
      includePastSlots = false,
      maxDays = 30,
    } = {},
  ) {
    const params = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
      include_google_busy: includeGoogleBusy ? "true" : "false",
      include_past_slots: includePastSlots ? "true" : "false",
      max_days: String(maxDays),
    });

    return requestJson(
      `/interviewers/interviewer/${interviewerIdValue}/slots/range?${params.toString()}`,
      { headers: {} },
    );
  }

  function getRangeSpec(baseDateValue, filterKey) {
    const baseDate = new Date(`${baseDateValue}T00:00:00`);
    const start = new Date(baseDate);
    const end = new Date(baseDate);

    switch (filterKey) {
      case "today":
        break;
      case "tomorrow":
        start.setDate(start.getDate() + 1);
        end.setDate(end.getDate() + 1);
        break;
      case "next_available_day":
        end.setDate(end.getDate() + 13);
        break;
      case "this_week":
        end.setDate(end.getDate() + 6);
        break;
      case "next_week":
        start.setDate(start.getDate() + 7);
        end.setDate(end.getDate() + 13);
        break;
      case "next_7_days":
      default:
        end.setDate(end.getDate() + 6);
        break;
    }

    return {
      dateFrom: formatDateInput(start),
      dateTo: formatDateInput(end),
    };
  }

  async function loadNearestSlots(startDateValue) {
    setSlotsLoading(true);
    setSlotMessage("");
    setSlotTone("neutral");

    try {
      for (let offset = 0; offset < 30; offset += 1) {
        const next = new Date(`${startDateValue}T00:00:00`);
        next.setDate(next.getDate() + offset);
        const nextDate = formatDateInput(next);
        const slotList = await fetchSlotsForDate(nextDate);

        if (Array.isArray(slotList) && slotList.length > 0) {
          setSlots(slotList);
          setSlotResolvedDate(nextDate);
          if (offset === 0) {
            setSlotMessage(`Showing slots for ${formatDateLabel(nextDate)}.`);
            setSlotTone("success");
          } else {
            setSlotMessage(
              `No slots were available on ${formatDateLabel(startDateValue)}. Showing the next available day: ${formatDateLabel(nextDate)}.`,
            );
            setSlotTone("warning");
          }
          setSlotsLoading(false);
          return;
        }
      }

      setSlots([]);
      setSlotResolvedDate(startDateValue);
      setSlotMessage(`No slots were found in the next 30 days from ${formatDateLabel(startDateValue)}.`);
      setSlotTone("danger");
    } catch (slotError) {
      setSlots([]);
      setSlotResolvedDate(startDateValue);
      setSlotMessage(normalizeError(slotError));
      setSlotTone("danger");
    } finally {
      setSlotsLoading(false);
    }
  }

  async function loadRescheduleOptionsForInterview(
    interview,
    {
      cancelledRef,
      preferredFilter = rescheduleFilter,
      mode = "auto",
    } = {},
  ) {
    if (!interview) {
      setRescheduleSlotsState({
        loading: false,
        groups: [],
        error: "",
        helperMessage: "",
        fallbackKey: "",
      });
      return;
    }

    setRescheduleSlotsState({
      loading: true,
      groups: [],
      error: "",
      helperMessage: "",
      fallbackKey: "",
    });

    try {
      const interviewDate = new Date(interview.start_time);
      if (Number.isNaN(interviewDate.getTime())) {
        throw new Error("Interview date is invalid for slot lookup.");
      }

      const baseDateValue = formatDateInput(interviewDate);
      const includeGoogleBusy = googleConnection.connected;
      const currentStart = interview.start_time;
      const currentEnd = interview.end_time;
      let groups = [];
      let helperMessage = "";
      let fallbackKey = "";

      async function runSearch(filterKey, maxDays = 30) {
        const { dateFrom, dateTo } = getRangeSpec(baseDateValue, filterKey);
        const rangeResult = await fetchSlotsForRange(dateFrom, dateTo, {
          interviewerIdValue: interview.interviewer_id,
          includeGoogleBusy,
          includePastSlots: filterKey === "today",
          maxDays,
        });

        const mappedGroups = (Array.isArray(rangeResult?.items) ? rangeResult.items : [])
          .map((group) => ({
            date: group.date,
            label: formatDateLabel(group.date),
            slots: (Array.isArray(group.slots) ? group.slots : []).filter(
              (slot) => !(slot.start === currentStart && slot.end === currentEnd),
            ),
          }))
          .filter((group) => group.slots.length);

        return {
          groups: mappedGroups,
          earliestDate: rangeResult?.earliest_available_date || mappedGroups[0]?.date || "",
        };
      }

      if (mode === "search_next_7_days") {
        ({ groups } = await runSearch("next_7_days"));
        fallbackKey = "next_7_days";
      } else if (mode === "show_earliest") {
        ({ groups } = await runSearch("next_available_day"));
        fallbackKey = "next_available_day";
      } else {
        const fallbackPlans = [
          preferredFilter,
          "next_available_day",
          "next_7_days",
          "this_week",
          "next_week",
        ].filter((value, index, array) => array.indexOf(value) === index);

        for (const filterKey of fallbackPlans) {
          const result = await runSearch(filterKey);
          if (result.groups.length) {
            groups = result.groups;
            fallbackKey = filterKey;
            if (filterKey !== preferredFilter) {
              const selectedLabel =
                RESCHEDULE_FILTERS.find((item) => item.key === preferredFilter)?.label?.toLowerCase() ||
                "the selected range";
              helperMessage = result.earliestDate
                ? `No slots available for ${selectedLabel}. Showing next available day: ${formatDateLabel(result.earliestDate)}.`
                : `No slots available for ${selectedLabel}. Showing the next available range.`;
            }
            break;
          }
        }

        if (!groups.length) {
          const expandedResult = await fetchSlotsForRange(
            baseDateValue,
            formatDateInput(new Date(new Date(`${baseDateValue}T00:00:00`).getTime() + 13 * 24 * 60 * 60 * 1000)),
            {
              interviewerIdValue: interview.interviewer_id,
              includeGoogleBusy,
              includePastSlots: false,
              maxDays: 30,
            },
          );

          groups = (Array.isArray(expandedResult?.items) ? expandedResult.items : [])
            .map((group) => ({
              date: group.date,
              label: formatDateLabel(group.date),
              slots: (Array.isArray(group.slots) ? group.slots : []).filter(
                (slot) => !(slot.start === currentStart && slot.end === currentEnd),
              ),
            }))
            .filter((group) => group.slots.length);

          if (groups.length) {
            fallbackKey = "next_7_days";
            helperMessage = `No slots available in the selected range. Showing the next available range starting ${groups[0].label}.`;
          }
        }
      }

      if (cancelledRef?.current) {
        return;
      }

      setRescheduleSlotsState({
        loading: false,
        groups,
        error: "",
        helperMessage,
        fallbackKey,
      });
    } catch (slotError) {
      if (cancelledRef?.current) {
        return;
      }

      setRescheduleSlotsState({
        loading: false,
        groups: [],
        error: normalizeError(slotError),
        helperMessage: "",
        fallbackKey: "",
      });
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleConnected = params.get("google_connected");
    const message = params.get("message");
    const interviewerIdParam = params.get("interviewer_id");
    const nameParam = params.get("name");
    const emailParam = params.get("email");

    if (googleConnected || message || interviewerIdParam || nameParam || emailParam) {
      setNotice({
        message:
          message ||
          (googleConnected === "1"
            ? "Google Calendar connected successfully."
            : "Google connection failed."),
        tone: googleConnected === "1" ? "success" : "danger",
      });
      setGoogleConnection((current) => ({
        connected: googleConnected === "1",
        interviewer_id:
          Number(interviewerIdParam) || current.interviewer_id || DEFAULT_INTERVIEWER_ID,
        name: nameParam || current.name,
        email: emailParam || current.email,
      }));
      window.history.replaceState({}, "", window.location.pathname);
    }

    loadDashboard();
  }, []);

  useEffect(() => {
    if (page === "slots") {
      loadNearestSlots(slotInputDate);
    }
  }, [page, slotInputDate, interviewerId]);

  useEffect(() => {
    if (!selectedInterviewId) {
      return;
    }

    let cancelled = false;

    async function loadInterviewWorkspace() {
      setTranscriptState({ loading: true, data: null, error: "" });
      setSummaryState({ loading: true, data: null, error: "" });
      setChatState({ loading: true, messages: [], error: "" });

      const [transcriptResult, summaryResult, chatResult] = await Promise.allSettled([
        requestJson(`/transcripts/interview/${selectedInterviewId}`),
        requestJson(`/summary/interview/${selectedInterviewId}`),
        requestJson(`/ai-chat/history/${selectedInterviewId}`),
      ]);

      if (cancelled) {
        return;
      }

      if (transcriptResult.status === "fulfilled") {
        setTranscriptState({ loading: false, data: transcriptResult.value, error: "" });
      } else {
        setTranscriptState({
          loading: false,
          data: null,
          error: normalizeError(transcriptResult.reason),
        });
      }

      if (summaryResult.status === "fulfilled") {
        setSummaryState({ loading: false, data: summaryResult.value, error: "" });
      } else {
        setSummaryState({
          loading: false,
          data: null,
          error: normalizeError(summaryResult.reason),
        });
      }

      if (chatResult.status === "fulfilled") {
        setChatState({
          loading: false,
          messages: Array.isArray(chatResult.value?.messages) ? chatResult.value.messages : [],
          error: "",
        });
      } else {
        setChatState({
          loading: false,
          messages: [],
          error: normalizeError(chatResult.reason),
        });
      }
    }

    loadInterviewWorkspace();

    return () => {
      cancelled = true;
    };
  }, [selectedInterviewId]);

  useEffect(() => {
    if (!selectedInterview) {
      setRescheduleForm({ start_time: "", end_time: "" });
      setSelectedRescheduleSlot(null);
      setRescheduleFilter("next_7_days");
      setRescheduleSlotsState({
        loading: false,
        groups: [],
        error: "",
        helperMessage: "",
        fallbackKey: "",
      });
      return;
    }

    setRescheduleForm({
      start_time: selectedInterview.start_time || "",
      end_time: selectedInterview.end_time || "",
    });
    setSelectedRescheduleSlot(null);
    setRescheduleFilter("next_7_days");
  }, [selectedInterview]);

  useEffect(() => {
    if (page !== "interview-detail" || !selectedInterview) {
      return;
    }

    const blockedStatuses = ["declined", "cancelled", "completed"];
    if (blockedStatuses.includes(String(selectedInterview.status || "").toLowerCase())) {
      setRescheduleSlotsState({
        loading: false,
        groups: [],
        error: "",
      });
      return;
    }

    const cancelledRef = { current: false };

    loadRescheduleOptionsForInterview(selectedInterview, { cancelledRef });

    return () => {
      cancelledRef.current = true;
    };
  }, [page, selectedInterview, googleConnection.connected, rescheduleFilter]);

  async function handleGenerateSummary(interviewIdValue) {
    try {
      setSummaryState((current) => ({ ...current, loading: true, error: "" }));
      const summary = await requestJson(`/summary/generate/${interviewIdValue}`, { method: "POST" });
      setSummaryState({ loading: false, data: summary, error: "" });
      await loadDashboard();
    } catch (summaryError) {
      const message = normalizeError(summaryError);
      setSummaryState((current) => ({ ...current, loading: false, error: message }));
      setError(message);
    }
  }

  async function handleRunDemoTranscriptFlow() {
    if (!selectedInterview) {
      return;
    }

    setDemoFlowState({
      loading: true,
      message: "",
      tone: "neutral",
    });

    try {
      const response = await requestJson(`/transcripts/interview/${selectedInterview.id}/demo-flow`, {
        method: "POST",
      });

      await loadDashboard();
      await refreshSelectedInterview(selectedInterview.id);

      const [transcriptResult, summaryResult, chatResult] = await Promise.allSettled([
        requestJson(`/transcripts/interview/${selectedInterview.id}`),
        requestJson(`/summary/interview/${selectedInterview.id}`),
        requestJson(`/ai-chat/history/${selectedInterview.id}`),
      ]);

      if (transcriptResult.status === "fulfilled") {
        setTranscriptState({ loading: false, data: transcriptResult.value, error: "" });
      }
      if (summaryResult.status === "fulfilled") {
        setSummaryState({ loading: false, data: summaryResult.value, error: "" });
      }
      if (chatResult.status === "fulfilled") {
        setChatState({
          loading: false,
          messages: Array.isArray(chatResult.value?.messages) ? chatResult.value.messages : [],
          error: "",
        });
      }

      setDemoFlowState({
        loading: false,
        message: `Demo transcript loaded with ${response.imported_segment_count} segments and summary generated.`,
        tone: "success",
      });
    } catch (demoError) {
      setDemoFlowState({
        loading: false,
        message: normalizeError(demoError),
        tone: "danger",
      });
    }
  }

  function upsertInterview(updatedInterview) {
    if (!updatedInterview?.id) {
      return;
    }

    setInterviews((current) =>
      current.map((item) => (item.id === updatedInterview.id ? { ...item, ...updatedInterview } : item)),
    );
  }

  async function refreshSelectedInterview(interviewIdValue = selectedInterviewId) {
    if (!interviewIdValue) {
      return null;
    }

    const booking = await requestJson(`/booking/${interviewIdValue}`);
    upsertInterview(booking);
    return booking;
  }

  function handleConnectGoogle() {
    const resolvedInterviewerId = interviewerId || googleConnection.interviewer_id || DEFAULT_INTERVIEWER_ID;
    window.location.assign(
      `${GOOGLE_AUTH_BASE_URL}/auth/google/login?interviewer_id=${resolvedInterviewerId}`,
    );
  }

  function openInterviewModal(interviewIdValue) {
    if (!interviewIdValue) {
      return;
    }

    setSelectedInterviewId(interviewIdValue);
    setDetailModalInterviewId(interviewIdValue);
  }

  function openFilterModal(filterKey) {
    setDashboardFilter(filterKey);
    setFilterModalKey(filterKey);
  }

  function closeFilterModal() {
    setFilterModalKey("");
  }

  function closeDetailModal() {
    setDetailModalInterviewId(null);
    setWorkspaceModal("");
  }

  async function handleAskAi(event) {
    event.preventDefault();

    if (!selectedInterview || !chatQuestion.trim()) {
      return;
    }

    setChatSending(true);

    try {
      const response = await requestJson("/ai-chat/ask", {
        method: "POST",
        body: JSON.stringify({
          interview_id: selectedInterview.id,
          question: chatQuestion.trim(),
          requester_email: selectedInterview.interviewer_email,
        }),
      });

      setChatState((current) => ({
        loading: false,
        error: "",
        messages: [
          ...current.messages,
          {
            id: `${selectedInterview.id}-${Date.now()}`,
            question: response.question,
            answer: response.answer,
            created_at: response.created_at,
          },
        ],
      }));
      setChatQuestion("");
    } catch (chatError) {
      setChatState((current) => ({
        ...current,
        error: normalizeError(chatError),
      }));
    } finally {
      setChatSending(false);
    }
  }

  async function handleBookSlot(slot) {
    if (!candidateForm.candidate_name.trim() || !candidateForm.candidate_email.trim()) {
      setBookingState({
        loading: false,
        slotKey: null,
        message: "Enter candidate name and email before booking a slot.",
        tone: "warning",
      });
      return;
    }

    setBookingState({
      loading: true,
      slotKey: slot.start,
      message: "",
      tone: "neutral",
    });

    try {
      const params = new URLSearchParams({
        interviewer_id: String(interviewerId),
        start_time: slot.start,
        end_time: slot.end,
        candidate_name: candidateForm.candidate_name.trim(),
        candidate_email: candidateForm.candidate_email.trim(),
      });

      const bookingResult = await requestJson(`/book?${params.toString()}`, {
        method: "POST",
      });

      const bookingId = bookingResult?.booking?.id;
      if (!bookingId) {
        throw new Error("Booking was created, but booking id was missing.");
      }

      const confirmationResult = await requestJson(`/confirm/${bookingId}`, {
        method: "POST",
      });
      const confirmedInterviewId = confirmationResult?.booking?.id ?? bookingId;

      setBookingState({
        loading: false,
        slotKey: null,
        message: `Booked ${slot.display_start} - ${slot.display_end} for ${candidateForm.candidate_name.trim()}.`,
        tone: "success",
      });
      setNotice({
        message: `Booking confirmed for ${candidateForm.candidate_name.trim()}.`,
        tone: "success",
      });
      setCandidateForm({ candidate_name: "", candidate_email: "" });
      await loadDashboard();
      await loadNearestSlots(slotResolvedDate || slotInputDate);
      setSelectedInterviewId(confirmedInterviewId);
    } catch (bookingError) {
      const errorMessage = normalizeError(bookingError);
      if (
        errorMessage.toLowerCase().includes("held by another candidate") ||
        errorMessage.toLowerCase().includes("slot was just taken") ||
        errorMessage.toLowerCase().includes("temporary slot hold has expired")
      ) {
        await loadNearestSlots(slotResolvedDate || slotInputDate);
      }
      setBookingState({
        loading: false,
        slotKey: null,
        message: errorMessage,
        tone: "danger",
      });
    }
  }

  async function handleShareSlots(event) {
    event.preventDefault();

    const candidateEmails = parseCandidateEmails(shareCandidatesText);
    const effectiveDate = slotResolvedDate || slotInputDate;

    if (!effectiveDate) {
      setShareState({
        loading: false,
        message: "Choose a scheduling date before sharing slots.",
        tone: "warning",
        sharedCount: 0,
        failedCount: 0,
      });
      return;
    }

    if (!candidateEmails.length) {
      setShareState({
        loading: false,
        message: "Enter at least one candidate email to share the slot pool.",
        tone: "warning",
        sharedCount: 0,
        failedCount: 0,
      });
      return;
    }

    setShareState({
      loading: true,
      message: "",
      tone: "neutral",
      sharedCount: 0,
      failedCount: 0,
    });

    try {
      const params = new URLSearchParams({
        interviewer_id: String(interviewerId),
        date: effectiveDate,
      });
      candidateEmails.forEach((email) => params.append("candidate_emails", email));

      const response = await requestJson(`/invite-candidates?${params.toString()}`, {
        method: "POST",
      });

      const sharedCount = Array.isArray(response?.invitations) ? response.invitations.length : 0;
      const failedCount = Array.isArray(response?.failed_invitations) ? response.failed_invitations.length : 0;

      setShareState({
        loading: false,
        message:
          response?.message ||
          (failedCount
            ? `Shared slot options with ${sharedCount} candidates and ${failedCount} delivery warnings.`
            : `Shared slot options with ${sharedCount} candidates.`),
        tone: failedCount ? "warning" : "success",
        sharedCount,
        failedCount,
      });

      if (sharedCount > 0) {
        setShareCandidatesText("");
      }
    } catch (shareError) {
      setShareState({
        loading: false,
        message: normalizeError(shareError),
        tone: "danger",
        sharedCount: 0,
        failedCount: 0,
      });
    }
  }

  async function handleRescheduleSelected(event) {
    event.preventDefault();

    if (!selectedInterview) {
      return;
    }

    if (!selectedRescheduleSlot || !rescheduleForm.start_time || !rescheduleForm.end_time) {
      setActionState({
        loading: false,
        action: "",
        message: "Choose one available slot before rescheduling.",
        tone: "warning",
        retryCalendarSync: false,
      });
      return;
    }

    setActionState({ loading: true, action: "reschedule", message: "", tone: "neutral", retryCalendarSync: false });

    try {
      const params = new URLSearchParams({
        new_start_time: rescheduleForm.start_time,
        new_end_time: rescheduleForm.end_time,
      });

      const response = await requestJson(`/reschedule/${selectedInterview.id}?${params.toString()}`, {
        method: "POST",
      });

      const updatedBooking = response?.booking;
      if (updatedBooking) {
        upsertInterview(updatedBooking);
        setSelectedInterviewId(updatedBooking.id);
        setRescheduleForm({
          start_time: updatedBooking.start_time || "",
          end_time: updatedBooking.end_time || "",
        });
        setSelectedRescheduleSlot(null);
      } else {
        await refreshSelectedInterview(selectedInterview.id);
      }

      await loadRescheduleOptionsForInterview(updatedBooking || selectedInterview, {
        preferredFilter: rescheduleFilter,
      });

      setActionState({
        loading: false,
        action: "",
        message: response?.message || "Interview rescheduled successfully.",
        tone:
          response?.interview_updated && response?.calendar_updated && response?.email_sent
            ? "success"
            : "warning",
        retryCalendarSync: canRetryCalendarSync(response),
      });
      setNotice({
        message: response?.message || "Interview rescheduled successfully.",
        tone:
          response?.interview_updated && response?.calendar_updated && response?.email_sent
            ? "success"
            : "warning",
      });
      await loadDashboard();
      await refreshSelectedInterview(selectedInterview.id);
    } catch (rescheduleError) {
      setActionState({
        loading: false,
        action: "",
        message: normalizeError(rescheduleError),
        tone: "danger",
        retryCalendarSync: false,
      });
    }
  }

  async function handleBookingAction(actionName, interviewIdValue = selectedInterviewId) {
    const targetInterview =
      interviews.find((item) => item.id === interviewIdValue) ||
      (selectedInterview?.id === interviewIdValue ? selectedInterview : null);

    if (!targetInterview) {
      return;
    }

    setActionState({ loading: true, action: actionName, message: "", tone: "neutral", retryCalendarSync: false });

    try {
      const response = await requestJson(`/${actionName}/${targetInterview.id}`, {
        method: "POST",
      });
      const updatedBooking = response?.booking;
      if (updatedBooking) {
        upsertInterview(updatedBooking);
      } else {
        await refreshSelectedInterview(targetInterview.id);
      }

      setActionState({
        loading: false,
        action: "",
        message: response?.message || `Interview ${actionName}d successfully.`,
        tone: actionName === "cancel" || actionName === "decline" ? "warning" : "success",
        retryCalendarSync: false,
      });
      setNotice({
        message: response?.message || `Interview ${actionName}d successfully.`,
        tone: actionName === "cancel" || actionName === "decline" ? "warning" : "success",
      });
      await loadDashboard();
    } catch (actionError) {
      setActionState({
        loading: false,
        action: "",
        message: normalizeError(actionError),
        tone: "danger",
        retryCalendarSync: false,
      });
    }
  }

  async function handleRetryCalendarSync() {
    if (!selectedInterview) {
      return;
    }

    setActionState({
      loading: true,
      action: "retry-calendar-sync",
      message: "",
      tone: "neutral",
      retryCalendarSync: false,
    });

    try {
      const response = await requestJson(`/retry-calendar-sync/${selectedInterview.id}`, {
        method: "POST",
      });
      const updatedBooking = response?.booking;
      if (updatedBooking) {
        upsertInterview(updatedBooking);
        setSelectedInterviewId(updatedBooking.id);
      } else {
        await refreshSelectedInterview(selectedInterview.id);
      }

      setActionState({
        loading: false,
        action: "",
        message: response?.message || "Calendar sync retried.",
        tone: response?.calendar_updated ? "success" : "warning",
        retryCalendarSync: canRetryCalendarSync(response),
      });
      setNotice({
        message: response?.message || "Calendar sync retried.",
        tone: response?.calendar_updated ? "success" : "warning",
      });
      await loadDashboard();
      await refreshSelectedInterview(selectedInterview.id);
    } catch (retryError) {
      setActionState({
        loading: false,
        action: "",
        message: normalizeError(retryError),
        tone: "danger",
        retryCalendarSync: true,
      });
    }
  }

  async function handleAvailabilitySubmit(event) {
    event.preventDefault();
    setAvailabilityState({ saving: true, message: "", tone: "neutral" });

    try {
      await requestJson("/availability/", {
        method: "POST",
        body: JSON.stringify({
          ...availabilityForm,
          interviewer_id: interviewerId,
          slot_duration_minutes: Number(availabilityForm.slot_duration_minutes),
          buffer_minutes: Number(availabilityForm.buffer_minutes),
        }),
      });

      setAvailabilityState({
        saving: false,
        message: "Availability updated successfully.",
        tone: "success",
      });
    } catch (submitError) {
      setAvailabilityState({
        saving: false,
        message: normalizeError(submitError),
        tone: "danger",
      });
    }
  }

  async function handleLeaveSubmit(event) {
    event.preventDefault();
    setLeaveState({ saving: true, message: "", tone: "neutral" });

    try {
      await requestJson("/leave/", {
        method: "POST",
        body: JSON.stringify({
          interviewer_id: interviewerId,
          leave_date: leaveForm.leave_date,
          is_full_day: leaveForm.is_full_day,
          start_time: leaveForm.is_full_day ? null : leaveForm.start_time,
          end_time: leaveForm.is_full_day ? null : leaveForm.end_time,
          reason: leaveForm.reason || null,
        }),
      });

      setLeaveState({
        saving: false,
        message: "Leave saved successfully. Slots will automatically skip this day.",
        tone: "success",
      });

      if (page === "slots") {
        await loadNearestSlots(slotInputDate);
      }
    } catch (submitError) {
      setLeaveState({
        saving: false,
        message: normalizeError(submitError),
        tone: "danger",
      });
    }
  }

  function renderStatCards() {
    return (
      <div style={styles.cardGrid}>
        {dashboardCards.map((card, index) => {
          const Icon = card.icon || FileText;
          return (
            <StatCard
              key={card.key}
              icon={Icon}
              label={card.label}
              value={card.value}
              description={card.description}
              accent={
                index === 0
                  ? "from-emerald-600/10 via-white to-white"
                  : index === 1
                    ? "from-amber-500/10 via-white to-white"
                    : index === 2
                      ? "from-rose-500/10 via-white to-white"
                      : "from-cyan-500/10 via-white to-white"
              }
              ctaLabel={dashboardFilter === card.key ? "Selected" : "Review"}
              selected={dashboardFilter === card.key}
              onClick={() => openFilterModal(card.key)}
            />
          );
        })}
      </div>
    );
  }

  function renderWeeklyScheduleBoard() {
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const scheduleRows = [
      { label: "09 AM", key: 9 },
      { label: "10 AM", key: 10 },
      { label: "11 AM", key: 11 },
      { label: "12 PM", key: 12 },
      { label: "01 PM", key: 13 },
      { label: "02 PM", key: 14 },
      { label: "03 PM", key: 15 },
      { label: "04 PM", key: 16 },
      { label: "05 PM", key: 17 },
    ];

    const entries = interviews.slice(0, 10).map((item) => {
      const date = new Date(item.start_time);
      const dayIndex = date.getDay();
      const mappedDay = dayIndex === 0 ? 6 : dayIndex - 1;
      return {
        id: item.id,
        day: mappedDay,
        hour: date.getHours(),
        status: item.status,
        label: item.candidate_name || "Candidate",
        time: item.display_start_datetime || formatLongDateTime(item.start_time),
      };
    });

    return (
      <div style={styles.scheduleBoard}>
        <div style={styles.scheduleHeaderSpacer} />
        {weekDays.map((day) => (
          <div key={day} style={styles.scheduleHeadCell}>{day}</div>
        ))}
        {scheduleRows.map((row) => (
          <Fragment key={row.key}>
            <div style={styles.scheduleTimeCell}>{row.label}</div>
            {weekDays.map((day, index) => {
              const match = entries.find((entry) => entry.day === index && entry.hour === row.key);
              return (
                <div
                  key={`${row.key}-${day}`}
                  style={{
                    ...styles.scheduleCell,
                    ...(match ? styles.scheduleCellInteractive : null),
                    ...(match ? scheduleCellStatusStyles(match.status, scheduleHoverId === match.id) : null),
                  }}
                  onMouseEnter={match ? () => setScheduleHoverId(match.id) : undefined}
                  onMouseLeave={match ? () => setScheduleHoverId((current) => (current === match.id ? null : current)) : undefined}
                  onClick={match ? () => openInterviewModal(match.id) : undefined}
                >
                  {match ? (
                    <div
                      style={scheduleChipStyles(match.status)}
                      title={`${match.label} · ${match.status}`}
                    >
                      {match.label}
                    </div>
                  ) : null}
                  {match && scheduleHoverId === match.id ? (
                    <div style={styles.scheduleTooltip}>
                      <div style={styles.scheduleTooltipTitle}>{match.label}</div>
                      <div>{match.time}</div>
                      <div>Status: {getInterviewStatusBadgeProps(match).label || humanizeStatus(match.status)}</div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    );
  }

  function renderPagination(currentPage, totalPages, onChange) {
    if (totalPages <= 1) {
      return null;
    }

    return (
      <div style={styles.paginationBar}>
        <button
          type="button"
          style={styles.paginationButton}
          onClick={() => onChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <div style={styles.paginationLabel}>
          Page {currentPage} of {totalPages}
        </div>
        <button
          type="button"
          style={styles.paginationButton}
          onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    );
  }

  function renderDashboardView() {
    const spotlightInterview = selectedInterview || topInterviews[0] || null;
    const transcriptPreview = transcriptState.data?.segments?.slice(0, 3) || [];
    const scheduleLegend = [
      { label: "Confirmed", tone: "success" },
      { label: "Locked", tone: "warning" },
      { label: "Rescheduled", tone: "info" },
      { label: "Cancelled", tone: "danger" },
    ];

    return (
      <div style={styles.pageStack}>
        {notice.message ? <div style={messageStyles(notice.tone)}>{notice.message}</div> : null}

        {renderStatCards()}
        {dashboardFilter ? (
          <div style={styles.dashboardFilterBar}>
            <div style={styles.dashboardFilterText}>
              Showing: {dashboardCards.find((card) => card.key === dashboardFilter)?.label || "Filtered interviews"}
            </div>
            <ActionButton variant="secondary" onClick={() => setDashboardFilter("")}>
              Clear Filter
            </ActionButton>
          </div>
        ) : null}

        <div style={styles.dashboardGrid}>
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>Weekly Schedule</h2>
                <p style={styles.panelSubtitle}>Live view of today’s interview rhythm and weekly placement.</p>
              </div>
            </div>
            {renderWeeklyScheduleBoard()}
            <div style={styles.legendRow}>
              {scheduleLegend.map((item) => (
                <StatusBadge key={item.label} status={item.label.toLowerCase()} tone={item.tone} label={item.label} />
              ))}
            </div>
          </section>

          <section style={styles.sideRail}>
            <article style={styles.railCard}>
              <div style={styles.railTitle}>Transcript & Summary</div>
              {spotlightInterview ? (
                <>
                  <div style={styles.railSubhead}>
                    {spotlightInterview.candidate_name || spotlightInterview.candidate_email}
                  </div>
                  <div style={styles.railMuted}>
                    {spotlightInterview.display_start_datetime || formatLongDateTime(spotlightInterview.start_time)}
                  </div>
                  <div style={styles.railBadgeRow}>
                    <StatusBadge
                      status={getInterviewStatusBadgeProps(spotlightInterview).status}
                      label={getInterviewStatusBadgeProps(spotlightInterview).label}
                    />
                    <StatusBadge status={spotlightInterview.transcript_status} />
                    <StatusBadge status={spotlightInterview.summary_status} />
                  </div>
                  {getProcessingHelperLabel(spotlightInterview) ? (
                    <div style={styles.railMuted}>{getProcessingHelperLabel(spotlightInterview)}</div>
                  ) : null}
                </>
              ) : (
                <EmptyState
                  icon={Rows3}
                  title="No interview selected yet"
                  description="Pick an interview from the queue to preview transcript and summary progress from the dashboard."
                  actionLabel="Open Interviews"
                  onAction={() => setPage("interviews")}
                />
              )}

              <div style={styles.railSection}>
                <div style={styles.railSectionTitle}>Meeting Transcript</div>
                {transcriptPreview.length ? (
                  <div style={styles.previewList}>
                    {transcriptPreview.map((segment) => (
                      <div key={segment.id} style={styles.previewItem}>
                        {segment.transcript_text}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="No transcript available yet"
                    description="Transcript content appears here once post-meeting processing completes."
                    actionLabel="Open Transcript"
                    onAction={() => setPage("transcript")}
                  />
                )}
                {spotlightInterview ? (
                  <ActionButton
                    variant="secondary"
                    onClick={() => {
                      openInterviewModal(spotlightInterview.id);
                      setWorkspaceModal("transcript");
                    }}
                  >
                    View Full Details
                  </ActionButton>
                ) : null}
              </div>

              <div style={styles.railSection}>
                <div style={styles.railSectionTitle}>AI Generated Summary</div>
                {summaryState.data?.summary_text ? (
                  <div style={styles.previewItem}>{summaryState.data.summary_text}</div>
                ) : (
                  <EmptyState
                    icon={Sparkles}
                    title="No summary generated yet"
                    description="Generate a summary after transcript processing to surface decision-ready hiring signals."
                    actionLabel="Open Summaries"
                    onAction={() => setPage("summaries")}
                  />
                )}
                {spotlightInterview ? (
                  <ActionButton
                    variant="secondary"
                    onClick={() => {
                      openInterviewModal(spotlightInterview.id);
                      setWorkspaceModal("summary");
                    }}
                  >
                    View Full Details
                  </ActionButton>
                ) : null}
              </div>
            </article>
          </section>
        </div>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Upcoming Interviews</h2>
              <p style={styles.panelSubtitle}>Operational list with direct visibility into status and meet links.</p>
            </div>
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Candidate</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Date & Time</th>
                  <th style={styles.th}>Interview Status</th>
                  <th style={styles.th}>Transcript</th>
                  <th style={styles.th}>Summary</th>
                  <th style={styles.th}>Meet Link</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {topInterviews.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => openInterviewModal(item.id)}
                    style={item.id === detailModalInterviewId ? styles.selectedRow : styles.tableRowInteractive}
                  >
                    <td style={styles.td}>
                      <div style={styles.personCell}>
                        <div style={styles.personAvatarSmall}>{getInitials(item.candidate_name || item.candidate_email)}</div>
                        <div>
                          <div style={styles.primaryText}>{item.candidate_name || "Unnamed candidate"}</div>
                          <div style={styles.secondaryText}>{item.interviewer_name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>{item.candidate_email}</td>
                    <td style={styles.td}>{item.display_start_datetime || formatLongDateTime(item.start_time)}</td>
                    <td style={styles.td}>
                      <StatusBadge
                        status={getInterviewStatusBadgeProps(item).status}
                        label={getInterviewStatusBadgeProps(item).label}
                      />
                    </td>
                    <td style={styles.td}><StatusBadge status={item.transcript_status} /></td>
                    <td style={styles.td}><StatusBadge status={item.summary_status} /></td>
                    <td style={styles.td}>
                      {item.meeting_link ? (
                        <a href={item.meeting_link} target="_blank" rel="noreferrer" style={styles.inlineLink}>
                          Open Meet
                        </a>
                      ) : (
                        <StatusBadge status="pending" tone="neutral" label="Meet Pending" />
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.compactActions}>
                        <ActionButton variant="secondary" onClick={(event) => { event.stopPropagation(); openInterviewModal(item.id); }}>
                          Review
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {!topInterviews.length && (
                  <tr>
                    <td colSpan={8} style={styles.emptyCell}>
                      <EmptyState
                        icon={CalendarDays}
                        title="No interviews found"
                        description="Once candidates book available slots, this queue will show operational interview records with status and meeting access."
                        actionLabel="Open Slots"
                        onAction={() => setPage("slots")}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    );
  }

  function renderInterviewsView() {
    return (
      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <h2 style={styles.panelTitle}>All Interviews</h2>
            <p style={styles.panelSubtitle}>Review the interview list here, then open a separate detail page for transcript and actions.</p>
          </div>
        </div>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Candidate</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Interview</th>
                <th style={styles.th}>Transcript</th>
                <th style={styles.th}>Summary</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInterviews.items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => openInterviewModal(item.id)}
                  style={item.id === detailModalInterviewId ? styles.selectedRow : styles.tableRowInteractive}
                >
                  <td style={styles.td}>{item.id}</td>
                  <td style={styles.td}>
                    <div style={styles.primaryText}>{item.candidate_name || "Unnamed candidate"}</div>
                    <div style={styles.secondaryText}>{item.candidate_email}</div>
                  </td>
                  <td style={styles.td}>{item.display_start_datetime || formatLongDateTime(item.start_time)}</td>
                  <td style={styles.td}>
                    <StatusBadge
                      status={getInterviewStatusBadgeProps(item).status}
                      label={getInterviewStatusBadgeProps(item).label}
                    />
                  </td>
                  <td style={styles.td}>
                    <StatusBadge status={item.transcript_status} />
                  </td>
                  <td style={styles.td}>
                    <StatusBadge status={item.summary_status} />
                  </td>
                  <td style={styles.td}>
                    <ActionButton
                      variant="secondary"
                      onClick={(event) => {
                        event.stopPropagation();
                        openInterviewModal(item.id);
                      }}
                    >
                      Open Detail
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {renderPagination(paginatedInterviews.currentPage, paginatedInterviews.totalPages, setInterviewsPage)}
      </section>
    );
  }

  function renderInterviewDetailView() {
    const rescheduleDisabledStatuses = ["declined", "cancelled", "completed", "expired"];
    const canReschedule =
      selectedInterview &&
      !rescheduleDisabledStatuses.includes(String(selectedInterview.status || "").toLowerCase());

    return (
      <div style={styles.detailPageStack}>
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Interview Detail</h2>
              <p style={styles.panelSubtitle}>
                {selectedInterview
                  ? `${selectedInterview.candidate_name || selectedInterview.candidate_email} | ${selectedInterview.display_start_datetime || formatLongDateTime(selectedInterview.start_time)}`
                  : "Select an interview from the Interviews page first."}
              </p>
            </div>
            <div style={styles.headerActions}>
              <ActionButton variant="secondary" onClick={() => setPage("interviews")}>
                Back To Interviews
              </ActionButton>
              {selectedInterview && ENABLE_DEMO_TRANSCRIPT_FLOW ? (
                <ActionButton
                  variant="secondary"
                  onClick={handleRunDemoTranscriptFlow}
                  disabled={demoFlowState.loading}
                  data-loading={demoFlowState.loading}
                >
                  {demoFlowState.loading ? "Running Demo Flow..." : "Run Demo Transcript Flow"}
                </ActionButton>
              ) : null}
              {selectedInterview ? (
                <ActionButton
                  onClick={() => handleGenerateSummary(selectedInterview.id)}
                  disabled={summaryState.loading}
                >
                  {summaryState.loading ? "Generating..." : "Generate Summary"}
                </ActionButton>
              ) : null}
            </div>
          </div>

          {!selectedInterview ? (
            <EmptyState
              icon={Users}
              title="No interview selected"
              description="Choose an interview from the Interviews page to review scheduling actions, transcript progress, and summary readiness."
              actionLabel="Open Interviews"
              onAction={() => setPage("interviews")}
            />
          ) : (
            <>
              {demoFlowState.message ? (
                <div style={messageStyles(demoFlowState.tone)}>{demoFlowState.message}</div>
              ) : null}
              <div style={styles.operationsGrid}>
                <div style={styles.operationCard}>
                  <div style={styles.detailTitle}>Booking Overview</div>
                  <div style={styles.summaryMetricRow}>
                    <span>Interview Status</span>
                    <StatusBadge
                      status={getInterviewStatusBadgeProps(selectedInterview).status}
                      label={getInterviewStatusBadgeProps(selectedInterview).label}
                    />
                  </div>
                  <div style={styles.summaryMetricRow}>
                    <span>Meeting Provider</span>
                    <strong>{selectedInterview.meeting_provider || "google_meet"}</strong>
                  </div>
                  <div style={styles.summaryMetricRow}>
                    <span>Processing Status</span>
                    <StatusBadge status={selectedInterview.processing_status} />
                  </div>
                  <div style={styles.summaryMetricRow}>
                    <span>Transcript</span>
                    <StatusBadge status={selectedInterview.transcript_status} />
                  </div>
                  <div style={styles.summaryMetricRow}>
                    <span>Summary</span>
                    <StatusBadge status={selectedInterview.summary_status} />
                  </div>
                  {getProcessingHelperLabel(selectedInterview) ? (
                    <div style={styles.emptyInlineNote}>{getProcessingHelperLabel(selectedInterview)}</div>
                  ) : null}
                  {selectedInterview.meeting_link ? (
                    <a
                      href={selectedInterview.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.inlineLink}
                    >
                      Open Google Meet link
                    </a>
                  ) : (
                    <div style={styles.emptyInlineNote}>Meet link will appear after confirmation or calendar sync.</div>
                  )}
                </div>

                <form style={styles.operationCard} onSubmit={handleRescheduleSelected}>
                  <div style={styles.detailTitle}>Reschedule</div>
                  <div style={styles.currentSlotCard}>
                    <div style={styles.currentSlotLabel}>Current Slot</div>
                    <div style={styles.currentSlotValue}>
                      {selectedInterview.display_start_datetime || formatLongDateTime(selectedInterview.start_time)}
                      {" - "}
                      {selectedInterview.display_end || formatLongDateTime(selectedInterview.end_time)}
                    </div>
                  </div>
                  <div style={styles.sectionCaption}>Choose another available slot</div>
                  {canReschedule ? (
                    <div style={styles.rescheduleFilterRow}>
                      {RESCHEDULE_FILTERS.map((filterOption) => (
                        <button
                          key={filterOption.key}
                          type="button"
                          onClick={() => setRescheduleFilter(filterOption.key)}
                          aria-pressed={rescheduleFilter === filterOption.key}
                          style={
                            rescheduleFilter === filterOption.key
                              ? styles.rescheduleFilterActive
                              : styles.rescheduleFilterButton
                          }
                        >
                          {filterOption.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {!canReschedule ? (
                    <EmptyState
                      icon={Clock3}
                      title="Reschedule unavailable"
                      description="Only active upcoming interviews can be rescheduled from this screen."
                    />
                  ) : rescheduleSlotsState.loading ? (
                    <EmptyState
                      icon={LoaderCircle}
                      title="Loading available slots"
                      description="Checking interviewer availability, leave, existing bookings, and calendar conflicts."
                    />
                  ) : rescheduleSlotsState.error ? (
                    <EmptyState
                      icon={CircleAlert}
                      title="Could not load reschedule slots"
                      description={rescheduleSlotsState.error}
                      actionLabel="Retry"
                      onAction={() =>
                        loadRescheduleOptionsForInterview(selectedInterview, {
                          preferredFilter: rescheduleFilter,
                        })
                      }
                    />
                  ) : filteredRescheduleGroups.length ? (
                    <div style={styles.rescheduleSlotGroups}>
                      {rescheduleSlotsState.helperMessage ? (
                        <div style={styles.rescheduleHelperMessage}>{rescheduleSlotsState.helperMessage}</div>
                      ) : null}
                      {filteredRescheduleGroups.map((group) => (
                        <div key={group.date} style={styles.rescheduleSlotGroup}>
                          <div style={styles.rescheduleDateLabel}>{group.label}</div>
                          <div style={styles.rescheduleSlotGrid}>
                            {group.slots.map((slot) => {
                              const isSelected = selectedRescheduleSlot?.start === slot.start;
                              return (
                                <button
                                  key={slot.start}
                                  type="button"
                                  onClick={() => {
                                    setSelectedRescheduleSlot(slot);
                                    setRescheduleForm({
                                      start_time: slot.start,
                                      end_time: slot.end,
                                    });
                                  }}
                                  aria-pressed={isSelected}
                                  style={isSelected ? styles.rescheduleSlotCardActive : styles.rescheduleSlotCard}
                                >
                                  <span style={styles.rescheduleSlotTime}>
                                    {slot.display_start}
                                  </span>
                                  <span style={styles.rescheduleSlotMeta}>
                                    {slot.display_end} · {slot.timezone}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : rescheduleSlotsState.groups.length ? (
                    <EmptyState
                      icon={CalendarDays}
                      title="No slots available for the selected day."
                      description="Try the next available day or search a wider range."
                      actionLabel="Show Next Available Slot"
                      onAction={() =>
                        loadRescheduleOptionsForInterview(selectedInterview, {
                          preferredFilter: rescheduleFilter,
                          mode: "show_earliest",
                        })
                      }
                    />
                  ) : (
                    <div style={styles.emptyStateStack}>
                      <EmptyState
                        icon={CalendarDays}
                        title="No future availability found"
                        description="No slots are available for the selected range right now. Try the next available day or search a wider range."
                        actionLabel="Show Next Available Slot"
                        onAction={() =>
                          loadRescheduleOptionsForInterview(selectedInterview, {
                            preferredFilter: rescheduleFilter,
                            mode: "show_earliest",
                          })
                        }
                      />
                      <div style={styles.emptyStateActions}>
                        <ActionButton
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            loadRescheduleOptionsForInterview(selectedInterview, {
                              preferredFilter: rescheduleFilter,
                              mode: "search_next_7_days",
                            })
                          }
                        >
                          Search Next 7 Days
                        </ActionButton>
                        <ActionButton
                          type="button"
                          variant="secondary"
                          onClick={() => setRescheduleFilter("next_week")}
                        >
                          Search Next Week
                        </ActionButton>
                      </div>
                    </div>
                  )}
                  {selectedRescheduleSlot ? (
                    <div style={styles.rescheduleSelectionSummary}>
                      Selected: {selectedRescheduleSlot.display_start} - {selectedRescheduleSlot.display_end} on{" "}
                      {formatDateLabel(selectedRescheduleSlot.start.slice(0, 10))}
                    </div>
                  ) : null}
                  <ActionButton
                    type="submit"
                    disabled={actionState.loading || !selectedInterview || !selectedRescheduleSlot || !canReschedule}
                  >
                    {actionState.loading && actionState.action === "reschedule" ? "Updating..." : "Reschedule Interview"}
                  </ActionButton>
                </form>

                <div style={styles.operationCard}>
                  <div style={styles.detailTitle}>Actions</div>
                  <div style={styles.actionRow}>
                    <ActionButton
                      type="button"
                      variant="secondary"
                      className="min-h-[42px] flex-1"
                      onClick={() => handleBookingAction("decline")}
                      disabled={actionState.loading || !selectedInterview}
                    >
                      {actionState.loading && actionState.action === "decline" ? "Declining..." : "Decline"}
                    </ActionButton>
                    <ActionButton
                      type="button"
                      variant="danger"
                      className="min-h-[42px] flex-1"
                      onClick={() => handleBookingAction("cancel")}
                      disabled={actionState.loading || !selectedInterview}
                    >
                      {actionState.loading && actionState.action === "cancel" ? "Cancelling..." : "Cancel"}
                    </ActionButton>
                  </div>
                </div>
              </div>

              {actionState.message ? (
                <div style={styles.actionFeedbackStack}>
                  <div style={messageStyles(actionState.tone)}>{actionState.message}</div>
                  {actionState.retryCalendarSync ? (
                    <div style={styles.actionFeedbackActions}>
                      <ActionButton
                        type="button"
                        variant="secondary"
                        onClick={handleRetryCalendarSync}
                        disabled={actionState.loading || !selectedInterview}
                      >
                        {actionState.loading && actionState.action === "retry-calendar-sync"
                          ? "Retrying..."
                          : "Retry Calendar Sync"}
                      </ActionButton>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div style={styles.detailGrid}>
                <div style={styles.detailCard}>
                  <div style={styles.detailTitle}>Transcript Workspace</div>
                  <div style={styles.emptyBlock}>
                    Transcript review now lives on its own page so this detail screen stays focused on booking actions.
                  </div>
                  <ActionButton onClick={() => setPage("transcript")}>
                    Open Transcript
                  </ActionButton>
                </div>

                <div style={styles.detailCard}>
                  <div style={styles.detailTitle}>Summary Workspace</div>
                  <div style={styles.emptyBlock}>
                    Summary generation and summary review live on the separate Summaries page.
                  </div>
                  <ActionButton onClick={() => setPage("summaries")}>
                    Open Summaries
                  </ActionButton>
                </div>

                <div style={styles.detailCard}>
                  <div style={styles.detailTitle}>AI Chat Workspace</div>
                  <div style={styles.emptyBlock}>
                    Ask transcript-based questions from the dedicated AI Chat page to keep this screen uncluttered.
                  </div>
                  <ActionButton onClick={() => setPage("ai-chat")}>
                    Open AI Chat
                  </ActionButton>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    );
  }

  function renderTranscriptView() {
    return (
      <div style={styles.interviewWorkspace}>
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Transcript Queue</h2>
              <p style={styles.panelSubtitle}>Select an interview from the list and review its transcript on this separate page.</p>
            </div>
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Candidate</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Meet Link</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInterviews.items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedInterviewId(item.id)}
                    style={item.id === selectedInterviewId ? styles.selectedRow : styles.tableRowInteractive}
                  >
                    <td style={styles.td}>
                      <div style={styles.primaryText}>{item.candidate_name || "Unnamed candidate"}</div>
                      <div style={styles.secondaryText}>{item.candidate_email}</div>
                    </td>
                    <td style={styles.td}>{item.display_start_datetime || formatLongDateTime(item.start_time)}</td>
                    <td style={styles.td}>
                      <StatusBadge status={item.transcript_status} />
                    </td>
                    <td style={styles.td}>
                      {item.meeting_link ? (
                        <a href={item.meeting_link} target="_blank" rel="noreferrer" style={styles.inlineLink}>
                          Open Meet
                        </a>
                      ) : (
                        <StatusBadge status="pending" tone="neutral" label="Meet Pending" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderPagination(paginatedInterviews.currentPage, paginatedInterviews.totalPages, setInterviewsPage)}
        </section>

        <section style={styles.detailColumn}>
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>Transcript Detail</h2>
                <p style={styles.panelSubtitle}>
                  {selectedInterview
                    ? `${selectedInterview.candidate_name || selectedInterview.candidate_email} | ${selectedInterview.display_start_datetime || formatLongDateTime(selectedInterview.start_time)}`
                    : "Select an interview to inspect transcript content."}
                </p>
              </div>
              {selectedInterview ? (
                <ActionButton variant="secondary" onClick={() => setPage("interview-detail")}>
                  Open Interview Detail
                </ActionButton>
              ) : null}
            </div>

            {transcriptState.loading ? (
              <EmptyState
                icon={FileText}
                title="Loading transcript"
                description="We are fetching transcript content and aligning the latest interview context."
              />
            ) : transcriptState.data?.segments?.length ? (
              <div style={styles.transcriptList}>
                {transcriptState.data.segments.map((segment) => (
                  <div key={segment.id} style={styles.segmentCard}>
                    <div style={styles.segmentMeta}>
                      <strong>{segment.speaker_label}</strong>
                      <span>{formatSeconds(segment.start_time)} - {formatSeconds(segment.end_time)}</span>
                    </div>
                    <div>{segment.transcript_text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="Transcript unavailable"
                description={transcriptState.error || "Transcript content is not available for this interview yet. This usually resolves after transcript processing completes."}
                actionLabel="Open Interview Detail"
                onAction={() => setPage("interview-detail")}
              />
            )}
          </section>
        </section>
      </div>
    );
  }

  function renderSummariesView() {
    const summaryStrengths = parseMaybeJsonList(summaryState.data?.strengths_list || summaryState.data?.strengths);
    const summaryConcerns = parseMaybeJsonList(summaryState.data?.concerns_list || summaryState.data?.concerns);

    return (
      <div style={styles.interviewWorkspace}>
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Summary Queue</h2>
              <p style={styles.panelSubtitle}>Generate and review AI summaries separately from interview operations.</p>
            </div>
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Candidate</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Transcript</th>
                  <th style={styles.th}>Summary</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSummaries.items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedInterviewId(item.id)}
                    style={item.id === selectedInterviewId ? styles.selectedRow : styles.tableRowInteractive}
                  >
                    <td style={styles.td}>
                      <div style={styles.primaryText}>{item.candidate_name || "Unnamed candidate"}</div>
                      <div style={styles.secondaryText}>{item.candidate_email}</div>
                    </td>
                    <td style={styles.td}>{item.display_start_datetime || formatLongDateTime(item.start_time)}</td>
                    <td style={styles.td}>
                      <StatusBadge status={item.transcript_status} />
                    </td>
                    <td style={styles.td}>
                      <StatusBadge status={item.summary_status} />
                    </td>
                    <td style={styles.td}>
                      <ActionButton
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedInterviewId(item.id);
                          handleGenerateSummary(item.id);
                        }}
                        disabled={summaryState.loading}
                      >
                        {summaryState.loading && selectedInterviewId === item.id ? "Generating..." : "Generate"}
                      </ActionButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderPagination(paginatedSummaries.currentPage, paginatedSummaries.totalPages, setSummariesPage)}
        </section>

        <section style={styles.detailColumn}>
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>Summary Detail</h2>
                <p style={styles.panelSubtitle}>
                  {selectedInterview
                    ? `${selectedInterview.candidate_name || selectedInterview.candidate_email} | ${selectedInterview.display_start_datetime || formatLongDateTime(selectedInterview.start_time)}`
                    : "Select an interview to inspect generated summary output."}
                </p>
              </div>
              {selectedInterview ? (
                <ActionButton
                  onClick={() => handleGenerateSummary(selectedInterview.id)}
                  disabled={summaryState.loading}
                >
                  {summaryState.loading ? "Generating..." : "Generate Summary"}
                </ActionButton>
              ) : null}
            </div>

            {summaryState.loading ? (
              <EmptyState
                icon={WandSparkles}
                title="Preparing summary"
                description="We are generating or refreshing the latest interview summary for this candidate."
              />
            ) : summaryState.data ? (
              <div style={styles.summaryStack}>
                <div style={styles.summaryMetricGrid}>
                  <SummaryMetricCard
                    icon={BarChart3}
                    label="Communication Score"
                    value={summaryState.data.candidate_communication_score ?? "-"}
                  />
                  <SummaryMetricCard
                    icon={Sparkles}
                    label="Sentiment"
                    value={summaryState.data.sentiment_label || "-"}
                    tone="teal"
                  />
                  <SummaryMetricCard
                    icon={Rows3}
                    label="Interruptions"
                    value={summaryState.data.interruption_count ?? "-"}
                    tone="amber"
                  />
                </div>
                <div style={styles.summaryNarrativeCard}>{summaryState.data.summary_text}</div>
                {summaryStrengths.length ? (
                  <div>
                    <div style={styles.listTitle}>Strengths</div>
                    <ul style={styles.list}>
                      {summaryStrengths.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                ) : null}
                {summaryConcerns.length ? (
                  <div>
                    <div style={styles.listTitle}>Concerns</div>
                    <ul style={styles.list}>
                      {summaryConcerns.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="No summary generated yet"
                description={summaryState.error || "Generate a summary once transcript processing is complete to surface strengths, concerns, and signal cards here."}
                actionLabel={selectedInterview ? "Generate Summary" : undefined}
                onAction={selectedInterview ? () => handleGenerateSummary(selectedInterview.id) : undefined}
              />
            )}
          </section>
        </section>
      </div>
    );
  }

  function renderSlotsView() {
    const parsedShareEmails = parseCandidateEmails(shareCandidatesText);

    return (
      <section style={styles.panel}>
        <div style={styles.panelHeaderRow}>
          <div>
            <h2 style={styles.panelTitle}>Available Slots</h2>
            <p style={styles.panelSubtitle}>By default this checks today. If today is on leave or has no availability, the next nearest day is shown automatically.</p>
          </div>
          <input
            type="date"
            value={slotInputDate}
            onChange={(event) => setSlotInputDate(event.target.value)}
            style={styles.input}
          />
        </div>

        {slotMessage ? <div style={messageStyles(slotTone)}>{slotMessage}</div> : null}

        <div style={styles.bookingComposer}>
          <label style={styles.field}>
            <span style={styles.label}>Candidate Name</span>
            <input
              value={candidateForm.candidate_name}
              onChange={(event) =>
                setCandidateForm((current) => ({
                  ...current,
                  candidate_name: event.target.value,
                }))
              }
              placeholder="Enter candidate name"
              style={styles.input}
            />
          </label>
          <label style={styles.field}>
            <span style={styles.label}>Candidate Email</span>
            <input
              type="email"
              value={candidateForm.candidate_email}
              onChange={(event) =>
                setCandidateForm((current) => ({
                  ...current,
                  candidate_email: event.target.value,
                }))
              }
              placeholder="Enter candidate email"
              style={styles.input}
            />
          </label>
        </div>

        {bookingState.message ? <div style={messageStyles(bookingState.tone)}>{bookingState.message}</div> : null}

        <form style={styles.sharedSlotCard} onSubmit={handleShareSlots}>
          <div style={styles.sharedSlotHeader}>
            <div>
              <div style={styles.sharedSlotTitle}>Share Slots with Multiple Candidates</div>
              <div style={styles.sharedSlotText}>
                Send the same slot pool to multiple candidates. The first candidate to lock a slot gets a temporary hold, and others will see it disappear immediately.
              </div>
            </div>
            <div style={styles.sharedSlotMeta}>
              <span style={styles.sharedSlotMetaLabel}>Slot Pool Date</span>
              <span style={styles.sharedSlotMetaValue}>{formatDateLabel(slotResolvedDate || slotInputDate)}</span>
            </div>
          </div>

          <label style={styles.field}>
            <span style={styles.label}>Candidate Emails</span>
            <textarea
              value={shareCandidatesText}
              onChange={(event) => setShareCandidatesText(event.target.value)}
              placeholder={"Enter candidate emails separated by commas or new lines"}
              style={styles.textarea}
              rows={4}
            />
          </label>

          <div style={styles.sharedSlotFootnote}>
            Shared candidates: {parsedShareEmails.length} | First confirmed candidate wins the slot. Temporary holds expire automatically.
          </div>

          {parsedShareEmails.length ? (
            <div style={styles.emailChipRow}>
              {parsedShareEmails.map((email) => (
                <span key={email} style={styles.emailChip}>
                  {email}
                </span>
              ))}
            </div>
          ) : null}

          {shareState.message ? <div style={messageStyles(shareState.tone)}>{shareState.message}</div> : null}

          <div style={styles.sharedSlotActions}>
            <ActionButton type="submit" disabled={shareState.loading}>
              {shareState.loading ? "Sharing Slots..." : "Share Slot Pool"}
            </ActionButton>
          </div>
        </form>

        <div style={styles.slotSummary}>
          <div><strong>Requested day:</strong> {formatDateLabel(slotInputDate)}</div>
          <div><strong>Showing slots for:</strong> {formatDateLabel(slotResolvedDate || slotInputDate)}</div>
        </div>

        {slotsLoading ? (
          <EmptyState
            icon={CalendarDays}
            title="Loading slots"
            description="We are checking interviewer availability, leave rules, and calendar conflicts for the selected day."
          />
        ) : (
          <div style={styles.slotGrid}>
            {slots.map((slot) => (
              <article key={slot.start} style={styles.slotCard}>
                <div style={styles.slotTime}>{slot.display_start} - {slot.display_end}</div>
                <div style={styles.slotMeta}>{slot.timezone}</div>
                <ActionButton
                  onClick={() => handleBookSlot(slot)}
                  disabled={bookingState.loading}
                >
                  {bookingState.loading && bookingState.slotKey === slot.start ? "Booking..." : "Book Slot"}
                </ActionButton>
              </article>
            ))}
            {!slots.length && (
              <EmptyState
                icon={CalendarDays}
                title="No slots available"
                description="Try another day, or update availability and leave settings so booking windows can open up again."
              />
            )}
          </div>
        )}
      </section>
    );
  }

  function renderAvailabilityView() {
    return (
      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>Availability</h2>
        </div>
        <form style={styles.formGrid} onSubmit={handleAvailabilitySubmit}>
          <label style={styles.field}>
            <span style={styles.label}>Start Time</span>
            <input type="time" step="1" value={availabilityForm.start_time} onChange={(event) => setAvailabilityForm((current) => ({ ...current, start_time: event.target.value }))} style={styles.input} />
          </label>
          <label style={styles.field}>
            <span style={styles.label}>End Time</span>
            <input type="time" step="1" value={availabilityForm.end_time} onChange={(event) => setAvailabilityForm((current) => ({ ...current, end_time: event.target.value }))} style={styles.input} />
          </label>
          <label style={styles.field}>
            <span style={styles.label}>Slot Duration</span>
            <input type="number" min="5" max="480" value={availabilityForm.slot_duration_minutes} onChange={(event) => setAvailabilityForm((current) => ({ ...current, slot_duration_minutes: event.target.value }))} style={styles.input} />
          </label>
          <label style={styles.field}>
            <span style={styles.label}>Buffer Minutes</span>
            <input type="number" min="0" max="180" value={availabilityForm.buffer_minutes} onChange={(event) => setAvailabilityForm((current) => ({ ...current, buffer_minutes: event.target.value }))} style={styles.input} />
          </label>
          <label style={styles.field}>
            <span style={styles.label}>Timezone</span>
            <input value={availabilityForm.timezone} onChange={(event) => setAvailabilityForm((current) => ({ ...current, timezone: event.target.value }))} style={styles.input} />
          </label>
          <label style={styles.field}>
            <span style={styles.label}>Time Format</span>
            <select value={availabilityForm.time_format} onChange={(event) => setAvailabilityForm((current) => ({ ...current, time_format: event.target.value }))} style={styles.input}>
              <option value="24h">24h</option>
              <option value="12h">12h</option>
            </select>
          </label>

          <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
            <span style={styles.label}>Working Days</span>
            <div style={styles.toggleRow}>
              {[
                ["monday_enabled", "Mon"],
                ["tuesday_enabled", "Tue"],
                ["wednesday_enabled", "Wed"],
                ["thursday_enabled", "Thu"],
                ["friday_enabled", "Fri"],
                ["saturday_enabled", "Sat"],
                ["sunday_enabled", "Sun"],
              ].map(([key, label]) => (
                <label key={key} style={styles.checkboxLabel}>
                  <input type="checkbox" checked={availabilityForm[key]} onChange={(event) => setAvailabilityForm((current) => ({ ...current, [key]: event.target.checked }))} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {availabilityState.message ? <div style={{ ...messageStyles(availabilityState.tone), gridColumn: "1 / -1" }}>{availabilityState.message}</div> : null}

          <div style={{ gridColumn: "1 / -1" }}>
            <ActionButton type="submit" disabled={availabilityState.saving}>
              {availabilityState.saving ? "Saving..." : "Save Availability"}
            </ActionButton>
          </div>
        </form>
      </section>
    );
  }

  function renderLeaveView() {
    return (
      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>Leave</h2>
        </div>
        <form style={styles.formGrid} onSubmit={handleLeaveSubmit}>
          <label style={styles.field}>
            <span style={styles.label}>Leave Date</span>
            <input type="date" value={leaveForm.leave_date} onChange={(event) => setLeaveForm((current) => ({ ...current, leave_date: event.target.value }))} style={styles.input} />
          </label>
          <label style={styles.checkboxLabel}>
            <input type="checkbox" checked={leaveForm.is_full_day} onChange={(event) => setLeaveForm((current) => ({ ...current, is_full_day: event.target.checked }))} />
            Full day leave
          </label>

          {!leaveForm.is_full_day ? (
            <>
              <label style={styles.field}>
                <span style={styles.label}>Start Time</span>
                <input type="time" step="1" value={leaveForm.start_time} onChange={(event) => setLeaveForm((current) => ({ ...current, start_time: event.target.value }))} style={styles.input} />
              </label>
              <label style={styles.field}>
                <span style={styles.label}>End Time</span>
                <input type="time" step="1" value={leaveForm.end_time} onChange={(event) => setLeaveForm((current) => ({ ...current, end_time: event.target.value }))} style={styles.input} />
              </label>
            </>
          ) : null}

          <label style={{ ...styles.field, gridColumn: "1 / -1" }}>
            <span style={styles.label}>Reason</span>
            <textarea value={leaveForm.reason} onChange={(event) => setLeaveForm((current) => ({ ...current, reason: event.target.value }))} rows={4} style={{ ...styles.input, resize: "vertical" }} />
          </label>

          {leaveState.message ? <div style={{ ...messageStyles(leaveState.tone), gridColumn: "1 / -1" }}>{leaveState.message}</div> : null}

          <div style={{ gridColumn: "1 / -1" }}>
            <ActionButton type="submit" disabled={leaveState.saving}>
              {leaveState.saving ? "Saving..." : "Save Leave"}
            </ActionButton>
          </div>
        </form>
      </section>
    );
  }

  function renderAiChatView() {
    return (
      <div style={styles.interviewWorkspace}>
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Choose Interview</h2>
              <p style={styles.panelSubtitle}>Pick the interview you want to discuss with AI.</p>
            </div>
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Candidate</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Summary</th>
                </tr>
              </thead>
              <tbody>
                {paginatedChatSelections.items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedInterviewId(item.id)}
                    style={item.id === selectedInterviewId ? styles.selectedRow : styles.tableRowInteractive}
                  >
                    <td style={styles.td}>{item.id}</td>
                    <td style={styles.td}>
                      <div style={styles.primaryText}>{item.candidate_name || "Unnamed candidate"}</div>
                      <div style={styles.secondaryText}>{item.candidate_email}</div>
                    </td>
                    <td style={styles.td}>{item.display_start_datetime || formatLongDateTime(item.start_time)}</td>
                    <td style={styles.td}>
                      <StatusBadge status={item.summary_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderPagination(paginatedChatSelections.currentPage, paginatedChatSelections.totalPages, setChatSelectionPage)}
        </section>

        <section style={styles.detailColumn}>
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>AI Chat</h2>
                <p style={styles.panelSubtitle}>
                  {selectedInterview
                    ? `Ask about ${selectedInterview.candidate_name || selectedInterview.candidate_email}.`
                    : "Select an interview to start chatting."}
                </p>
              </div>
            </div>

            {summaryState.data ? (
              <div style={{ ...styles.detailCard, marginBottom: 18 }}>
                <div style={styles.detailTitle}>Current Summary Context</div>
                <div>{summaryState.data.summary_text}</div>
              </div>
            ) : null}

            <SuggestedPrompts
              prompts={AI_PROMPT_SUGGESTIONS}
              onSelect={(prompt) => setChatQuestion(prompt)}
            />

            <form style={styles.chatComposer} onSubmit={handleAskAi}>
              <textarea
                value={chatQuestion}
                onChange={(event) => setChatQuestion(event.target.value)}
                placeholder="Ask AI about this interview..."
                rows={3}
                style={{ ...styles.input, resize: "vertical", minHeight: 96 }}
              />
              <ActionButton
                type="submit"
                disabled={chatSending || !selectedInterview || !selectedInterview.interviewer_email}
              >
                {chatSending ? "Sending..." : "Ask AI"}
              </ActionButton>
            </form>

            {selectedInterview && !selectedInterview.interviewer_email ? (
              <div style={messageStyles("warning")}>Interviewer email is missing, so AI chat cannot be sent for this interview.</div>
            ) : null}

            {chatState.loading ? (
              <EmptyState
                icon={MessageSquareText}
                title="Loading chat history"
                description="We are preparing the previous assistant conversation for this interview."
              />
            ) : chatState.messages.length ? (
              <div style={styles.chatHistory}>
                {chatState.messages.map((message) => (
                  <article key={message.id} style={styles.chatMessage}>
                    <div style={styles.chatQuestion}>{message.question}</div>
                    <div style={styles.chatAnswer}>{message.answer}</div>
                    <div style={styles.chatTime}>{formatBackendAuditDateTime(message.created_at)}</div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={MessageSquareText}
                title="No AI chat history yet"
                description={chatState.error || "Ask your first question to start a transcript-aware conversation for this interview."}
              />
            )}
          </section>
        </section>
      </div>
    );
  }

  function renderDashboardModals() {
    const filterTitle = dashboardCards.find((card) => card.key === filterModalKey)?.label || "Filtered Interviews";
    const activeModalInterview = modalInterview;
    const activeNotes = activeModalInterview ? interviewNotes[activeModalInterview.id] || "" : "";

    return (
      <>
        <ModalShell
          open={Boolean(filterModalKey)}
          title={filterTitle}
          subtitle={`Showing ${filterModalItems.length} interview${filterModalItems.length === 1 ? "" : "s"} for this dashboard filter.`}
          onClose={closeFilterModal}
          width={880}
          zIndex={1200}
        >
          <div style={styles.modalInfoBar}>
            <div style={styles.dashboardFilterText}>Showing: {filterTitle}</div>
            <ActionButton
              variant="secondary"
              onClick={() => {
                setDashboardFilter("");
                closeFilterModal();
              }}
            >
              Clear Filter
            </ActionButton>
          </div>
          <div style={styles.modalList}>
            {filterModalItems.length ? (
              filterModalItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  style={styles.modalListItem}
                  onClick={() => openInterviewModal(item.id)}
                >
                  <div style={styles.modalListHead}>
                    <div>
                      <div style={styles.primaryText}>{item.candidate_name || "Unnamed candidate"}</div>
                      <div style={styles.secondaryText}>{item.candidate_email}</div>
                    </div>
                    <StatusBadge
                      status={getInterviewStatusBadgeProps(item).status}
                      label={getInterviewStatusBadgeProps(item).label}
                    />
                  </div>
                  <div style={styles.modalListMeta}>
                    <span>{item.display_start_datetime || formatLongDateTime(item.start_time)}</span>
                    <span>Transcript: {humanizeStatus(item.transcript_status || "not_started")}</span>
                    <span>Summary: {humanizeStatus(item.summary_status || "not_started")}</span>
                  </div>
                </button>
              ))
            ) : (
              <EmptyState
                icon={Rows3}
                title="No interviews found for this filter"
                description="Try another dashboard card or clear the current filter."
              />
            )}
          </div>
        </ModalShell>

        <ModalShell
          open={Boolean(activeModalInterview)}
          title={activeModalInterview ? activeModalInterview.candidate_name || activeModalInterview.candidate_email : "Interview Detail"}
          subtitle={activeModalInterview ? activeModalInterview.display_start_datetime || formatLongDateTime(activeModalInterview.start_time) : ""}
          onClose={closeDetailModal}
          width={980}
          zIndex={1300}
        >
          {activeModalInterview ? (
            <div style={styles.modalDetailStack}>
              <div style={styles.modalDetailGrid}>
                <div style={styles.modalDetailCard}>
                  <div style={styles.modalSectionTitle}>Interview Snapshot</div>
                  <div style={styles.modalDataRow}><span>Email</span><strong>{activeModalInterview.candidate_email}</strong></div>
                  <div style={styles.modalDataRow}>
                    <span>Interview Status</span>
                    <StatusBadge
                      status={getInterviewStatusBadgeProps(activeModalInterview).status}
                      label={getInterviewStatusBadgeProps(activeModalInterview).label}
                    />
                  </div>
                  <div style={styles.modalDataRow}><span>Transcript Status</span><StatusBadge status={activeModalInterview.transcript_status} /></div>
                  <div style={styles.modalDataRow}><span>Summary Status</span><StatusBadge status={activeModalInterview.summary_status} /></div>
                  <div style={styles.modalDataRow}><span>Meet Link</span>{activeModalInterview.meeting_link ? <a href={activeModalInterview.meeting_link} target="_blank" rel="noreferrer" style={styles.inlineLink}>Open Meet</a> : <StatusBadge status="pending" label="Meet Pending" />}</div>
                </div>
                <div style={styles.modalDetailCard}>
                  <div style={styles.modalSectionTitle}>Notes / Feedback</div>
                  <textarea
                    value={activeNotes}
                    onChange={(event) =>
                      setInterviewNotes((current) => ({
                        ...current,
                        [activeModalInterview.id]: event.target.value,
                      }))
                    }
                    rows={6}
                    placeholder="Capture quick observations or follow-up notes for this interview."
                    style={{ ...styles.textarea, minHeight: 144 }}
                  />
                </div>
              </div>
              <div style={styles.modalActionRow}>
                <ActionButton
                  variant="secondary"
                  onClick={() => {
                    setSelectedInterviewId(activeModalInterview.id);
                    setPage("interview-detail");
                    closeDetailModal();
                    closeFilterModal();
                  }}
                >
                  Reschedule
                </ActionButton>
                <ActionButton
                  variant="danger"
                  onClick={async () => {
                    setSelectedInterviewId(activeModalInterview.id);
                    await handleBookingAction("cancel", activeModalInterview.id);
                  }}
                  disabled={actionState.loading}
                >
                  Cancel
                </ActionButton>
                <ActionButton
                  variant="secondary"
                  onClick={() => activeModalInterview.meeting_link && window.open(activeModalInterview.meeting_link, "_blank", "noopener,noreferrer")}
                  disabled={!activeModalInterview.meeting_link}
                >
                  <ExternalLink size={15} />
                  Open Meet
                </ActionButton>
                <ActionButton
                  variant="secondary"
                  onClick={() => setWorkspaceModal("transcript")}
                >
                  View Transcript
                </ActionButton>
                <ActionButton
                  variant="secondary"
                  onClick={() => setWorkspaceModal("summary")}
                >
                  View Summary
                </ActionButton>
              </div>
            </div>
          ) : null}
        </ModalShell>

        <ModalShell
          open={Boolean(workspaceModal && activeModalInterview)}
          title={workspaceModal === "summary" ? "Summary Details" : "Transcript Details"}
          subtitle={activeModalInterview ? `${activeModalInterview.candidate_name || activeModalInterview.candidate_email} | ${activeModalInterview.display_start_datetime || formatLongDateTime(activeModalInterview.start_time)}` : ""}
          onClose={() => setWorkspaceModal("")}
          width={900}
          zIndex={1400}
        >
          {workspaceModal === "summary" ? (
            summaryState.loading ? (
              <EmptyState icon={LoaderCircle} title="Loading summary" description="Fetching summary insights for this interview." />
            ) : summaryState.data?.summary_text ? (
              <div style={styles.modalWorkspaceStack}>
                <div style={styles.summaryMetricGrid}>
                  <SummaryMetricCard label="Communication" value={summaryState.data.communication_score ?? "-"} />
                  <SummaryMetricCard label="Sentiment" value={summaryState.data.sentiment_score ?? "-"} tone="amber" />
                  <SummaryMetricCard label="Interruptions" value={summaryState.data.interruption_count ?? "-"} tone="teal" />
                </div>
                <div style={styles.summaryNarrativeCard}>{summaryState.data.summary_text}</div>
              </div>
            ) : (
              <EmptyState icon={Sparkles} title="No summary generated yet" description={summaryState.error || "Generate a summary to review it here without leaving the dashboard."} />
            )
          ) : transcriptState.loading ? (
            <EmptyState icon={LoaderCircle} title="Loading transcript" description="Fetching transcript segments for this interview." />
          ) : transcriptState.data?.segments?.length ? (
            <div style={styles.modalTranscriptList}>
              {transcriptState.data.segments.map((segment) => (
                <div key={segment.id} style={styles.segmentCard}>
                  <div style={styles.segmentMeta}>
                    <strong>{segment.speaker_label || "Speaker"}</strong>
                    <span>{segment.start_time_seconds != null ? formatSeconds(segment.start_time_seconds) : "-"}</span>
                  </div>
                  <div>{segment.transcript_text}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={FileText} title="Transcript unavailable" description={transcriptState.error || "Transcript content is not available for this interview yet."} />
          )}
        </ModalShell>
      </>
    );
  }

  if (loading) {
    return <div style={styles.loadingScreen}>Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.errorCard}>
          <h2 style={styles.panelTitle}>Could not load dashboard</h2>
          <p style={styles.panelSubtitle}>{error}</p>
          <ActionButton onClick={loadDashboard}>Retry</ActionButton>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarProfile}>
          <div style={styles.sidebarAvatar}>{getInitials(interviewerName)}</div>
          <div>
            <div style={styles.sidebarName}>{interviewerName}</div>
            <div style={styles.sidebarRole}>
              {googleConnection.connected
                ? `Connected as ${googleConnection.name || interviewerName}`
                : "Interviewer"}
            </div>
          </div>
        </div>
        <nav style={styles.nav}>
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button key={key} style={page === key ? styles.navActive : styles.navButton} onClick={() => setPage(key)}>
              <span style={styles.navIconLabel}>
                <Icon size={16} />
                {label}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <div style={styles.eyebrow}>{pageMeta.eyebrow}</div>
            <h1 style={styles.heroTitle}>{pageMeta.title}</h1>
            <p style={styles.heroSubtitle}>{pageMeta.subtitle}</p>
          </div>
          <div style={styles.headerActions}>
            {googleConnection.connected ? (
              <div style={styles.connectedPill}>
                Connected: {googleConnection.name || interviewerName}
              </div>
            ) : null}
            <ActionButton variant="secondary" onClick={handleConnectGoogle}><LogIn size={16} /> {googleConnection.connected ? "Reconnect Google" : "Connect Google"}</ActionButton>
            <ActionButton variant="secondary" onClick={loadDashboard}><RefreshCcw size={16} /> Refresh</ActionButton>
          </div>
        </header>

        {page === "dashboard" && renderDashboardView()}
        {page === "interviews" && renderInterviewsView()}
        {page === "interview-detail" && renderInterviewDetailView()}
        {page === "transcript" && renderTranscriptView()}
        {page === "summaries" && renderSummariesView()}
        {page === "ai-chat" && renderAiChatView()}
        {page === "slots" && renderSlotsView()}
        {page === "availability" && renderAvailabilityView()}
        {page === "leave" && renderLeaveView()}
      </main>
      {renderDashboardModals()}
    </div>
  );
}

function messageStyles(tone) {
  const palette = {
    success: { background: "#edf7f0", color: "#245545", border: "1px solid #c9dfd0" },
    warning: { background: "#faf5e8", color: "#8a6730", border: "1px solid #e9d5aa" },
    danger: { background: "#fbefec", color: "#a3473d", border: "1px solid #efc7c1" },
    neutral: { background: "#f1f4ed", color: "#356654", border: "1px solid #d9e4d7" },
  };

  return {
    padding: "12px 14px",
    borderRadius: 14,
    fontSize: 14,
    ...palette[tone],
  };
}

function scheduleChipStyles(status) {
  const normalized = String(status || "").toLowerCase();
  const palette =
    normalized === "confirmed"
      ? { background: "#3f7a63", color: "#ffffff" }
      : normalized === "cancelled" || normalized === "declined"
        ? { background: "#bf665d", color: "#ffffff" }
        : normalized === "rescheduled"
          ? { background: "#b9893d", color: "#ffffff" }
          : { background: "#6c7a70", color: "#ffffff" };

  return {
    width: "100%",
    borderRadius: 8,
    padding: "5px 7px",
    fontSize: 11,
    fontWeight: 700,
    border: "none",
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    cursor: "pointer",
    transition: "transform 220ms ease, box-shadow 220ms ease, filter 220ms ease",
    ...palette,
  };
}

function scheduleCellStatusStyles(status, isHovered) {
  const normalized = String(status || "").toLowerCase();
  const borderColor =
    normalized === "confirmed"
      ? "rgba(63, 122, 99, 0.34)"
      : normalized === "cancelled" || normalized === "declined"
        ? "rgba(191, 102, 93, 0.34)"
        : normalized === "rescheduled"
          ? "rgba(126, 91, 181, 0.34)"
          : "rgba(185, 137, 61, 0.32)";

  return isHovered
    ? {
        borderColor,
        boxShadow: "0 14px 28px rgba(15, 23, 42, 0.12)",
        transform: "scale(1.05)",
        zIndex: 2,
      }
    : {
        borderColor,
      };
}

const styles = {
  shell: { minHeight: "100vh", display: "grid", gridTemplateColumns: "260px minmax(0, 1fr)", background: "linear-gradient(180deg, #f7f8f2 0%, #f8fbf6 45%, #ffffff 100%)", color: "#10261f" },
  sidebar: { padding: "18px 18px 28px", borderRight: "1px solid rgba(88, 117, 103, 0.18)", background: "linear-gradient(180deg, #214d3f 0%, #2f6754 100%)", display: "flex", flexDirection: "column", gap: 24, position: "sticky", top: 0, minHeight: "100vh" },
  sidebarProfile: { display: "flex", alignItems: "center", gap: 12, padding: "8px 6px 16px", borderBottom: "1px solid rgba(255,255,255,0.15)" },
  sidebarAvatar: { width: 42, height: 42, borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(135deg, #f8fafc, #cbd5e1)", color: "#1e293b", fontWeight: 800, fontSize: 14 },
  sidebarName: { color: "#ffffff", fontWeight: 800, fontSize: 14 },
  sidebarRole: { color: "rgba(226, 232, 240, 0.82)", fontSize: 12 },
  brand: { fontSize: 30, fontWeight: 900, letterSpacing: "-0.04em", color: "#f8fafc" },
  brandSub: { color: "#94a3b8", marginTop: 10, fontSize: 15, lineHeight: 1.5 },
  nav: { display: "grid", gap: 12 },
  navButton: { border: "none", borderRadius: 12, padding: "12px 14px", textAlign: "left", background: "rgba(255, 255, 255, 0.05)", color: "#e5f2eb", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  navActive: { border: "none", borderRadius: 12, padding: "12px 14px", textAlign: "left", background: "rgba(255,255,255,0.16)", color: "#ffffff", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" },
  navIconLabel: { display: "inline-flex", alignItems: "center", gap: 10 },
  main: { padding: "18px 20px 28px", display: "grid", gap: 18, alignContent: "start" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, paddingBottom: 8, borderBottom: "1px solid #dbe4f0" },
  eyebrow: { color: "#356654", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 800, fontSize: 12, marginBottom: 10 },
  heroTitle: { margin: 0, fontSize: 28, lineHeight: 1.04, letterSpacing: "-0.04em", color: "#173229" },
  heroSubtitle: { margin: "8px 0 0", color: "#5f6d66", fontSize: 14, maxWidth: 820, lineHeight: 1.6 },
  pageStack: { display: "grid", gap: 18 },
  detailPageStack: { display: "grid", gap: 18 },
  overviewHero: { background: "linear-gradient(135deg, #fffdf7 0%, #f6f7ef 58%, #eef5ee 100%)", color: "#10261f", borderRadius: 36, padding: 34, display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(320px, 0.9fr)", gap: 28, boxShadow: "0 28px 60px rgba(54, 84, 70, 0.08)", border: "1px solid rgba(215, 224, 211, 0.95)" },
  overviewLead: { display: "grid", gap: 18, alignContent: "start" },
  overviewTitle: { margin: 0, fontSize: 40, lineHeight: 1.02, letterSpacing: "-0.04em", maxWidth: 680 },
  overviewText: { margin: 0, color: "#5f6d66", fontSize: 17, maxWidth: 620, lineHeight: 1.7 },
  heroRibbon: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 6 },
  heroRibbonCard: { background: "rgba(255, 255, 255, 0.74)", borderRadius: 20, padding: "16px 18px", border: "1px solid rgba(207, 224, 215, 0.9)", boxShadow: "0 10px 24px rgba(137, 157, 145, 0.12)" },
  heroRibbonLabel: { display: "block", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 800, color: "#66756e" },
  heroRibbonValue: { display: "block", marginTop: 10, fontSize: 24, lineHeight: 1.1, color: "#173229" },
  heroMeta: { display: "grid", gap: 18, alignContent: "start", justifyItems: "stretch" },
  heroDate: { alignSelf: "start", justifySelf: "end", fontSize: 14, color: "#47584f", background: "rgba(255, 255, 255, 0.86)", padding: "12px 16px", borderRadius: 999, border: "1px solid rgba(207, 224, 215, 0.85)", boxShadow: "0 8px 18px rgba(137, 157, 145, 0.12)" },
  heroMiniGrid: { display: "grid", gap: 14 },
  heroMiniCard: { background: "rgba(255, 255, 255, 0.88)", borderRadius: 22, padding: 18, border: "1px solid rgba(221, 230, 217, 0.95)", boxShadow: "0 12px 24px rgba(137, 157, 145, 0.12)" },
  heroMiniLabel: { display: "block", fontSize: 13, color: "#66756e" },
  heroMiniValue: { display: "block", fontSize: 30, marginTop: 8, letterSpacing: "-0.03em" },
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 },
  dashboardFilterBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 16,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
  },
  dashboardFilterText: { fontSize: 13, fontWeight: 700, color: "#1d4ed8" },
  statCard: { background: "#fffef9", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, border: "1px solid rgba(221, 230, 217, 0.95)", boxShadow: "0 10px 20px rgba(54, 84, 70, 0.05)" },
  statDot: { width: 38, height: 38, borderRadius: 999, display: "grid", placeItems: "center", flexShrink: 0 },
  statDotInner: { width: 12, height: 12, borderRadius: 999 },
  statTextBlock: { display: "grid", gap: 6 },
  statLabel: { color: "#64748b", fontSize: 12, fontWeight: 700 },
  statValue: { fontSize: 28, fontWeight: 800, marginTop: 0, letterSpacing: "-0.04em" },
  statFootnote: { color: "#94a3b8", fontSize: 11, fontWeight: 700 },
  contentGrid: { display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(360px, 1fr)", gap: 24 },
  dashboardGrid: { display: "grid", gridTemplateColumns: "minmax(0, 1.65fr) 320px", gap: 16, alignItems: "start" },
  sideRail: { display: "grid", gap: 14 },
  railCard: { background: "#fffef9", borderRadius: 12, padding: 14, border: "1px solid #dbe4d8", boxShadow: "0 8px 20px rgba(54, 84, 70, 0.05)", display: "grid", gap: 12 },
  railTitle: { fontSize: 15, fontWeight: 800, color: "#173229" },
  railSubhead: { fontWeight: 700, color: "#0f172a" },
  railMuted: { color: "#64748b", fontSize: 13, lineHeight: 1.6 },
  railBadgeRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  railSection: { display: "grid", gap: 8, padding: 10, borderRadius: 10, background: "#f5f7f1", border: "1px solid #e0e8dd", maxHeight: 320, overflowY: "auto" },
  railSectionTitle: { fontSize: 12, fontWeight: 800, color: "#5f6d66", textTransform: "uppercase", letterSpacing: "0.08em" },
  previewList: { display: "grid", gap: 8 },
  previewItem: { fontSize: 13, lineHeight: 1.5, color: "#4e6058", background: "#ffffff", border: "1px solid #e0e8dd", borderRadius: 10, padding: "10px 12px" },
  chatPromptCard: { display: "grid", gap: 6, background: "#f5f7f1", border: "1px solid #e0e8dd", borderRadius: 10, padding: 10 },
  chatPromptQ: { fontSize: 12, fontWeight: 700, color: "#173229" },
  chatPromptA: { fontSize: 12, color: "#66756e", lineHeight: 1.5 },
  interviewWorkspace: { display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(460px, 1fr)", gap: 24, alignItems: "start" },
  detailColumn: { display: "grid", gap: 24 },
  panel: { background: "rgba(255, 255, 255, 0.96)", borderRadius: 12, padding: 16, border: "1px solid rgba(226, 232, 240, 0.95)", boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)" },
  headerActions: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" },
  connectedPill: { borderRadius: 999, padding: "9px 14px", background: "#ecfdf3", color: "#166534", border: "1px solid #bbf7d0", fontSize: 13, fontWeight: 700 },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 14 },
  panelHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "end", gap: 18, marginBottom: 16, flexWrap: "wrap" },
  panelTitle: { margin: 0, fontSize: 20, lineHeight: 1.08, letterSpacing: "-0.03em", color: "#173229" },
  panelSubtitle: { margin: "6px 0 0", color: "#64748b", lineHeight: 1.5, maxWidth: 720, fontSize: 13 },
  legendRow: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 },
  tableWrap: { overflowX: "auto", overflowY: "auto", maxHeight: 520, borderRadius: 10 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 10px", color: "#64748b", borderBottom: "1px solid #e2e8f0", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", position: "sticky", top: 0, background: "rgba(255,255,255,0.98)", backdropFilter: "blur(10px)", zIndex: 1 },
  td: { padding: "14px 10px", borderBottom: "1px solid #edf2f7", verticalAlign: "top", fontSize: 13 },
  selectedRow: { background: "#f1f7ff", cursor: "pointer" },
  tableRowInteractive: { cursor: "pointer", transition: "background 200ms ease, box-shadow 200ms ease" },
  emptyCell: { padding: 24, textAlign: "center", color: "#64748b" },
  queueList: { display: "grid", gap: 18, maxHeight: 360, overflowY: "auto", paddingRight: 4 },
  queueCard: { padding: 16, borderRadius: 12, background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)", border: "1px solid #dbe7f3", display: "grid", gap: 10 },
  queueTitle: { fontWeight: 800, fontSize: 16 },
  queueText: { color: "#475569" },
  primaryText: { fontWeight: 700, color: "#0f172a" },
  secondaryText: { color: "#64748b", fontSize: 13, marginTop: 4 },
  emptyBlock: { padding: 24, borderRadius: 20, background: "#fbfdff", color: "#64748b", border: "1px dashed #cbd5e1" },
  personCell: { display: "flex", alignItems: "center", gap: 10 },
  personAvatarSmall: { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)", color: "#1e293b", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 11 },
  compactActions: { display: "flex", gap: 8, flexWrap: "wrap" },
  tableButton: { border: "none", borderRadius: 8, padding: "7px 10px", background: "#2563eb", color: "#ffffff", fontWeight: 700, fontSize: 12, cursor: "pointer" },
  tableButtonSecondary: { border: "1px solid #bfdbfe", borderRadius: 8, padding: "7px 10px", background: "#eff6ff", color: "#1d4ed8", fontWeight: 700, fontSize: 12, cursor: "pointer" },
  scheduleBoard: { display: "grid", gridTemplateColumns: "72px repeat(7, minmax(0, 1fr))", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#ffffff" },
  scheduleHeaderSpacer: { background: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  scheduleHeadCell: { padding: "10px 8px", fontSize: 12, fontWeight: 800, color: "#64748b", textAlign: "center", background: "#f8fafc", borderLeft: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" },
  scheduleTimeCell: { padding: "10px 8px", fontSize: 12, fontWeight: 700, color: "#64748b", background: "#f8fafc", borderTop: "1px solid #e2e8f0" },
  scheduleCell: { minHeight: 38, padding: 4, borderLeft: "1px solid #e2e8f0", borderTop: "1px solid #e2e8f0", background: "#ffffff", position: "relative", transition: "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease" },
  scheduleCellInteractive: { cursor: "pointer", border: "1px solid transparent" },
  scheduleTooltip: { position: "absolute", left: "50%", bottom: "calc(100% + 8px)", transform: "translateX(-50%)", minWidth: 168, padding: "8px 10px", borderRadius: 10, background: "rgba(16, 38, 31, 0.96)", color: "#f8fafc", fontSize: 11, lineHeight: 1.45, boxShadow: "0 16px 30px rgba(15, 23, 42, 0.18)", pointerEvents: "none", zIndex: 5 },
  scheduleTooltipTitle: { fontWeight: 800, marginBottom: 4 },
  bookingComposer: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, margin: "18px 0 22px" },
  slotSummary: { display: "flex", gap: 24, flexWrap: "wrap", margin: "18px 0 26px", color: "#334155", padding: "14px 16px", borderRadius: 18, background: "#f8fbff", border: "1px solid #dde8f5" },
  sharedSlotCard: {
    display: "grid",
    gap: 14,
    marginTop: 18,
    marginBottom: 18,
    padding: "16px 18px",
    borderRadius: 18,
    background: "linear-gradient(180deg, #fbfdf9 0%, #f6faf5 100%)",
    border: "1px solid #d9e6dd",
    boxShadow: "0 10px 20px rgba(54, 84, 70, 0.05)",
  },
  sharedSlotHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  sharedSlotTitle: { fontSize: 16, fontWeight: 800, color: "#173229" },
  sharedSlotText: { fontSize: 13, lineHeight: 1.6, color: "#5f6d66", maxWidth: 760 },
  sharedSlotMeta: {
    display: "grid",
    gap: 4,
    minWidth: 180,
    padding: "10px 12px",
    borderRadius: 14,
    background: "#ffffff",
    border: "1px solid #dbe7df",
  },
  sharedSlotMetaLabel: { fontSize: 11, fontWeight: 800, color: "#5f6d66", textTransform: "uppercase", letterSpacing: "0.08em" },
  sharedSlotMetaValue: { fontSize: 13, fontWeight: 700, color: "#173229" },
  textarea: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    fontSize: 14,
    color: "#0f172a",
    boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.03)",
    resize: "vertical",
    minHeight: 110,
    fontFamily: "inherit",
    lineHeight: 1.5,
  },
  sharedSlotFootnote: { fontSize: 12, fontWeight: 600, color: "#5f6d66" },
  emailChipRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  emailChip: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 28,
    padding: "6px 10px",
    borderRadius: 999,
    background: "#ffffff",
    border: "1px solid #d9e6dd",
    color: "#245545",
    fontSize: 12,
    fontWeight: 700,
  },
  sharedSlotActions: { display: "flex", justifyContent: "flex-start" },
  slotGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 },
  slotCard: { padding: 20, borderRadius: 24, background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)", border: "1px solid #dde7f2", display: "grid", gap: 14, boxShadow: "0 14px 28px rgba(148, 163, 184, 0.12)" },
  slotTime: { fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" },
  slotMeta: { marginTop: 6, color: "#64748b" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 },
  field: { display: "grid", gap: 8 },
  label: { fontWeight: 700, color: "#334155" },
  sectionCaption: { fontSize: 13, fontWeight: 700, color: "#5f6d66", marginTop: -4 },
  input: { width: "100%", padding: "14px 16px", borderRadius: 16, border: "1px solid #cbd5e1", background: "#ffffff", fontSize: 15, color: "#0f172a", boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.03)" },
  toggleRow: { display: "flex", gap: 14, flexWrap: "wrap" },
  checkboxLabel: { display: "inline-flex", alignItems: "center", gap: 8, color: "#334155", fontWeight: 600 },
  operationsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, marginBottom: 18 },
  operationCard: { padding: 18, borderRadius: 20, background: "#f8fbff", border: "1px solid #dbe7f3", display: "grid", gap: 12, alignContent: "start" },
  currentSlotCard: {
    padding: "10px 12px",
    borderRadius: 14,
    background: "#ffffff",
    border: "1px solid #dbe7f3",
    display: "grid",
    gap: 3,
  },
  currentSlotLabel: { fontSize: 11, fontWeight: 800, color: "#5f6d66", textTransform: "uppercase", letterSpacing: "0.08em" },
  currentSlotValue: { fontSize: 13, fontWeight: 700, color: "#173229", lineHeight: 1.45 },
  rescheduleSlotGroups: { display: "grid", gap: 12, maxHeight: 308, overflowY: "auto", overflowX: "hidden", paddingRight: 6, scrollbarWidth: "thin" },
  rescheduleFilterRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  rescheduleHelperMessage: {
    padding: "9px 11px",
    borderRadius: 12,
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    fontSize: 12,
    fontWeight: 600,
  },
  rescheduleFilterButton: {
    border: "1px solid #cfe0d7",
    borderRadius: 999,
    padding: "7px 12px",
    background: "#ffffff",
    color: "#173229",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    minHeight: 32,
    transition: "all 160ms ease",
  },
  rescheduleFilterActive: {
    border: "1px solid #2f6f59",
    borderRadius: 999,
    padding: "7px 12px",
    background: "#214d3f",
    color: "#ffffff",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    minHeight: 32,
    boxShadow: "0 8px 16px rgba(47, 111, 89, 0.16)",
    transition: "all 160ms ease",
  },
  rescheduleSlotGroup: { display: "grid", gap: 10 },
  rescheduleDateLabel: { fontSize: 13, fontWeight: 800, color: "#173229" },
  rescheduleSlotGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(138px, 1fr))", gap: 8 },
  rescheduleSlotCard: {
    border: "1px solid #cfe0d7",
    borderRadius: 14,
    padding: "10px 12px",
    background: "#ffffff",
    color: "#173229",
    textAlign: "left",
    cursor: "pointer",
    display: "grid",
    gap: 3,
    minHeight: 60,
    boxShadow: "0 4px 12px rgba(137, 157, 145, 0.08)",
    transition: "all 160ms ease",
  },
  rescheduleSlotCardActive: {
    border: "1px solid #2f6f59",
    borderRadius: 14,
    padding: "10px 12px",
    background: "linear-gradient(135deg, #214d3f, #2f6f59)",
    color: "#ffffff",
    textAlign: "left",
    cursor: "pointer",
    display: "grid",
    gap: 3,
    minHeight: 60,
    boxShadow: "0 10px 20px rgba(47, 111, 89, 0.22)",
    transition: "all 160ms ease",
  },
  rescheduleSlotTime: { fontSize: 13, fontWeight: 800, lineHeight: 1.2 },
  rescheduleSlotMeta: { fontSize: 11, opacity: 0.82, lineHeight: 1.2 },
  rescheduleSelectionSummary: {
    padding: "11px 12px",
    borderRadius: 14,
    background: "#ecfdf3",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontSize: 12,
    fontWeight: 700,
  },
  emptyStateStack: { display: "grid", gap: 12 },
  emptyStateActions: { display: "flex", gap: 10, flexWrap: "wrap" },
  actionRow: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, alignItems: "start" },
  actionFeedbackStack: { display: "grid", gap: 10 },
  actionFeedbackActions: { display: "flex", justifyContent: "flex-start" },
  inlineLink: { color: "#245545", fontWeight: 700, textDecoration: "none" },
  emptyInlineNote: { color: "#64748b", fontSize: 13, lineHeight: 1.5 },
  detailGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 },
  detailCard: { padding: 18, borderRadius: 20, background: "#fbfdff", border: "1px solid #e2e8f0", display: "grid", gap: 12, minHeight: 264 },
  detailTitle: { fontSize: 22, fontWeight: 800 },
  transcriptList: { display: "grid", gap: 12, maxHeight: 520, overflowY: "auto", paddingRight: 4 },
  segmentCard: { padding: 16, borderRadius: 18, background: "#ffffff", border: "1px solid #e2e8f0", display: "grid", gap: 8 },
  segmentMeta: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", color: "#475569", fontSize: 13 },
  summaryStack: { display: "grid", gap: 12, color: "#334155" },
  summaryMetricGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 },
  summaryMetricRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 14, background: "#ffffff", border: "1px solid #e2e8f0", minHeight: 46 },
  summaryNarrativeCard: { padding: 18, borderRadius: 18, background: "linear-gradient(180deg, #ffffff 0%, #f7faf6 100%)", border: "1px solid #d7e3db", lineHeight: 1.7, color: "#334155" },
  listTitle: { fontWeight: 800, marginBottom: 8 },
  list: { margin: 0, paddingLeft: 20, display: "grid", gap: 6 },
  chatComposer: { display: "grid", gap: 14, marginBottom: 18 },
  chatHistory: { display: "grid", gap: 14, maxHeight: 420, overflowY: "auto", paddingRight: 4 },
  chatMessage: { padding: 18, borderRadius: 20, background: "#f8fbff", border: "1px solid #dbe4f0", display: "grid", gap: 8 },
  chatQuestion: { fontWeight: 800, color: "#1d4ed8" },
  chatAnswer: { color: "#334155" },
  chatTime: { color: "#64748b", fontSize: 13 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.44)", display: "grid", placeItems: "center", padding: 24 },
  modalCard: { width: "min(100%, 960px)", maxHeight: "min(88vh, 920px)", overflow: "hidden", borderRadius: 16, background: "#ffffff", border: "1px solid rgba(226, 232, 240, 0.95)", boxShadow: "0 30px 70px rgba(15, 23, 42, 0.22)", display: "grid", gridTemplateRows: "auto minmax(0, 1fr)" },
  modalHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "18px 20px", borderBottom: "1px solid #e2e8f0" },
  modalHeaderText: { display: "grid", gap: 4 },
  modalTitle: { margin: 0, fontSize: 20, fontWeight: 800, color: "#173229" },
  modalSubtitle: { margin: 0, fontSize: 13, lineHeight: 1.6, color: "#64748b" },
  modalCloseButton: { width: 36, height: 36, borderRadius: 10, border: "1px solid #e2e8f0", background: "#ffffff", color: "#475569", display: "grid", placeItems: "center", cursor: "pointer" },
  modalBody: { padding: 20, overflowY: "auto", display: "grid", gap: 16 },
  modalInfoBar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  modalList: { display: "grid", gap: 12 },
  modalListItem: { border: "1px solid #dbe7f3", borderRadius: 14, background: "#fbfdff", padding: "14px 16px", display: "grid", gap: 8, textAlign: "left", cursor: "pointer", transition: "border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease" },
  modalListHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  modalListMeta: { display: "flex", gap: 14, flexWrap: "wrap", color: "#5f6d66", fontSize: 12, fontWeight: 600 },
  modalDetailStack: { display: "grid", gap: 16 },
  modalDetailGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 },
  modalDetailCard: { borderRadius: 14, border: "1px solid #e2e8f0", background: "#fbfdff", padding: 16, display: "grid", gap: 12 },
  modalSectionTitle: { fontSize: 14, fontWeight: 800, color: "#173229" },
  modalDataRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #eef2f7", fontSize: 13, color: "#334155" },
  modalActionRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  modalWorkspaceStack: { display: "grid", gap: 16 },
  modalTranscriptList: { display: "grid", gap: 12, maxHeight: 460, overflowY: "auto", paddingRight: 4 },
  paginationBar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 14, paddingTop: 10, borderTop: "1px solid #e2e8f0" },
  paginationButton: { border: "1px solid #cfe0d7", borderRadius: 10, padding: "8px 12px", background: "#ffffff", color: "#173229", fontWeight: 700, cursor: "pointer" },
  paginationLabel: { color: "#5f6d66", fontSize: 13, fontWeight: 700 },
  primaryButton: { border: "none", borderRadius: 14, padding: "12px 16px", background: "linear-gradient(135deg, #214d3f, #2f6f59)", color: "#ffffff", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 14px 28px rgba(47, 111, 89, 0.22)" },
  secondaryButton: { border: "1px solid #cfe0d7", borderRadius: 14, padding: "11px 14px", background: "rgba(255,255,255,0.95)", color: "#173229", fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 20px rgba(137, 157, 145, 0.12)", display: "inline-flex", alignItems: "center", gap: 8 },
  iconButton: { border: "none", background: "transparent", color: "#5f6d66", fontWeight: 700, cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 },
  dangerButton: { border: "none", borderRadius: 16, padding: "13px 18px", background: "linear-gradient(135deg, #b91c1c, #ef4444)", color: "#ffffff", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 18px 30px rgba(239, 68, 68, 0.24)" },
  loadingScreen: { minHeight: "100vh", display: "grid", placeItems: "center", background: "#eef4fb", padding: 24 },
  errorCard: { background: "#ffffff", borderRadius: 28, padding: 28, border: "1px solid #fecaca", display: "grid", gap: 16, minWidth: 320, textAlign: "center" },
};

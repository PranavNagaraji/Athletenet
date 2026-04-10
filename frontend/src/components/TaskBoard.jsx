import { useState, useMemo } from "react";
import {
  CheckCircle2, Circle, Plus, Trash2, Flag, Calendar,
  Tag, Search, X, ChevronDown, Filter, Loader2, AlertCircle,
  ClipboardList, ArrowUp, ArrowRight, ArrowDown
} from "lucide-react";
import "../pages/club/ClubLayout.css";

/* ── Storage helpers ── */
function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/* ── Constants ── */
const PRIORITIES = [
  { value: "high",   label: "High",   color: "#ef4444", icon: ArrowUp },
  { value: "medium", label: "Medium", color: "#f59e0b", icon: ArrowRight },
  { value: "low",    label: "Low",    color: "#10b981", icon: ArrowDown },
];

const ALL_CATEGORIES = {
  athlete: ["Fitness", "Nutrition", "Recovery", "Tactics", "Mental", "Competition", "Other"],
  coach:   ["Planning", "Sessions", "Performance", "Admin", "Scouting", "Events", "Other"],
};

const FILTERS = ["All", "Active", "Completed", "Overdue"];

/* ── Helpers ── */
function isOverdue(task) {
  if (!task.dueDate || task.done) return false;
  return new Date(task.dueDate) < new Date();
}

function formatDue(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d - today) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: "#ef4444" };
  if (diff === 0) return { label: "Due today", color: "#f59e0b" };
  if (diff === 1) return { label: "Due tomorrow", color: "#f59e0b" };
  return { label: `Due in ${diff}d`, color: "var(--theme-muted)" };
}

const priorityMeta = {
  high:   { color: "#ef4444", badgeClass: "badge-rejected" },
  medium: { color: "#f59e0b", badgeClass: "badge-pending" },
  low:    { color: "#10b981", badgeClass: "badge-accepted" },
};

/* ── Task Row ── */
function TaskRow({ task, onToggle, onDelete }) {
  const due = formatDue(task.dueDate);
  const overdue = isOverdue(task);
  const pm = priorityMeta[task.priority] || priorityMeta.medium;
  const PIcon = PRIORITIES.find(p => p.value === task.priority)?.icon || ArrowRight;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.85rem",
        padding: "0.95rem 1.1rem",
        borderBottom: "1px solid var(--theme-border)",
        transition: "background var(--transition-fast)",
        opacity: task.done ? 0.58 : 1,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "var(--theme-surface-2)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: task.done ? "var(--theme-success)" : "var(--theme-border-strong)",
          padding: 0, marginTop: 2, flexShrink: 0,
          transition: "color var(--transition-fast), transform var(--transition-fast)",
          transform: task.done ? "scale(1.05)" : "scale(1)",
        }}
        aria-label={task.done ? "Mark incomplete" : "Mark complete"}
      >
        {task.done
          ? <CheckCircle2 size={20} style={{ color: "var(--theme-success)" }} />
          : <Circle size={20} />}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{
            fontSize: "0.9rem",
            fontWeight: task.done ? 500 : 700,
            color: task.done ? "var(--theme-muted)" : "var(--theme-text)",
            textDecoration: task.done ? "line-through" : "none",
            lineHeight: 1.4,
            flex: 1,
          }}>
            {task.title}
          </span>

          {/* Priority badge */}
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.2rem",
              padding: "0.18rem 0.5rem",
              borderRadius: "var(--radius-full)",
              background: `${pm.color}14`,
              border: `1px solid ${pm.color}33`,
              color: pm.color,
              fontSize: "0.65rem", fontWeight: 800,
              letterSpacing: "0.06em", textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            <PIcon size={10} /> {task.priority}
          </span>
        </div>

        {task.description && (
          <p style={{
            margin: "0.2rem 0 0", fontSize: "0.8rem",
            color: "var(--theme-muted)", lineHeight: 1.55,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {task.description}
          </p>
        )}

        <div style={{ display: "flex", gap: "0.65rem", marginTop: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
          {task.category && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "0.25rem",
              fontSize: "0.7rem", color: "var(--theme-muted)", fontWeight: 700,
            }}>
              <Tag size={11} /> {task.category}
            </span>
          )}
          {due && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "0.25rem",
              fontSize: "0.7rem", color: due.color, fontWeight: 700,
            }}>
              <Calendar size={11} /> {due.label}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--theme-surface-4)", padding: "0.2rem",
          borderRadius: "var(--radius-sm)", flexShrink: 0,
          transition: "color var(--transition-fast)",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "var(--theme-danger)")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--theme-surface-4)")}
        aria-label="Delete task"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

/* ── Main TaskBoard component ── */
export default function TaskBoard({ storageKey, role, pageTitle, pageSubtitle, eyebrow }) {
  const categories = ALL_CATEGORIES[role] || ALL_CATEGORIES.athlete;

  const [tasks,    setTasks]    = useState(() => load(storageKey));
  const [filter,   setFilter]   = useState("All");
  const [catFilter, setCatFilter] = useState("All");
  const [search,   setSearch]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [msg,      setMsg]      = useState(null);
  const [form, setForm] = useState({
    title: "", description: "", priority: "medium",
    category: categories[0], dueDate: "",
  });

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  /* Persist */
  const persist = (updated) => {
    setTasks(updated);
    save(storageKey, updated);
  };

  /* Create */
  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const task = {
      id: uid(),
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      category: form.category,
      dueDate: form.dueDate || null,
      done: false,
      createdAt: new Date().toISOString(),
    };
    persist([task, ...tasks]);
    setForm({ title: "", description: "", priority: "medium", category: categories[0], dueDate: "" });
    setShowForm(false);
    showMsg("success", "Task added!");
  };

  /* Toggle done */
  const handleToggle = (id) => {
    persist(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  /* Delete */
  const handleDelete = (id) => {
    persist(tasks.filter(t => t.id !== id));
  };

  /* Clear completed */
  const clearCompleted = () => {
    persist(tasks.filter(t => !t.done));
    showMsg("success", "Completed tasks cleared.");
  };

  /* Filtered + sorted */
  const visible = useMemo(() => {
    return tasks
      .filter(t => {
        if (filter === "Active") return !t.done;
        if (filter === "Completed") return t.done;
        if (filter === "Overdue") return isOverdue(t);
        return true;
      })
      .filter(t => catFilter === "All" || t.category === catFilter)
      .filter(t => {
        const q = search.toLowerCase();
        return !q || t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        // Sort: incomplete first, then by priority, then by due date
        if (a.done !== b.done) return a.done ? 1 : -1;
        const po = { high: 0, medium: 1, low: 2 };
        if (po[a.priority] !== po[b.priority]) return po[a.priority] - po[b.priority];
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        return 0;
      });
  }, [tasks, filter, catFilter, search]);

  /* Stats */
  const total     = tasks.length;
  const done      = tasks.filter(t => t.done).length;
  const overdue   = tasks.filter(isOverdue).length;
  const active    = tasks.filter(t => !t.done).length;
  const progress  = total > 0 ? Math.round((done / total) * 100) : 0;

  const statCards = [
    { label: "Total",     value: total,   color: "#f97316" },
    { label: "Active",    value: active,  color: "#3b82f6" },
    { label: "Completed", value: done,    color: "#10b981" },
    { label: "Overdue",   value: overdue, color: "#ef4444" },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-eyebrow">
            <ClipboardList size={10} /> {eyebrow || "Task Management"}
          </div>
          <h1>{pageTitle || "My Tasks"}</h1>
          <p>{pageSubtitle || "Track your goals, drills, and daily objectives."}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add Task
        </button>
      </div>

      <div className="page-body stack-lg">
        {msg && (
          <div className={`alert alert-${msg.type}`}>
            <AlertCircle size={15} /> {msg.text}
          </div>
        )}

        {/* Stats row */}
        <div className="stats-row" style={{ marginBottom: 0 }}>
          {statCards.map(({ label, value, color }) => (
            <div key={label} className="stat-card" style={{ cursor: "default" }}>
              <div className="stat-icon" style={{ background: `${color}1a`, color }}>
                <ClipboardList size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{value}</span>
                <span className="stat-label">{label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="card" style={{ padding: "1rem 1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--theme-text)" }}>
                Overall Progress
              </span>
              <span style={{ fontSize: "1.4rem", fontFamily: "var(--font-heading)", color: "var(--theme-primary)", letterSpacing: "0.02em" }}>
                {progress}%
              </span>
            </div>
            <div className="dashboard-progress">
              <span style={{ width: `${progress}%` }} />
            </div>
            <div style={{ marginTop: "0.4rem", fontSize: "0.74rem", color: "var(--theme-muted)", fontWeight: 600 }}>
              {done} of {total} tasks completed
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* Status filter */}
          <div className="tab-bar">
            {FILTERS.map(f => (
              <button
                key={f}
                className={`tab-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
                {filter === f && (
                  <span className="tab-count">{
                    f === "All" ? total :
                    f === "Active" ? active :
                    f === "Completed" ? done : overdue
                  }</span>
                )}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <div style={{ position: "relative" }}>
            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              style={{
                appearance: "none",
                background: "var(--theme-surface-2)",
                border: "1px solid var(--theme-border-strong)",
                borderRadius: "var(--radius-md)",
                padding: "0.5rem 2rem 0.5rem 0.85rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--theme-text)",
                cursor: "pointer",
              }}
            >
              <option value="All">All categories</option>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown size={13} style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--theme-muted)" }} />
          </div>

          {/* Search */}
          <div className="search-shell" style={{ flex: "1 1 220px", maxWidth: 380 }}>
            <div className="search-shell-icon" style={{ left: "0.8rem" }}>
              <Search size={14} />
            </div>
            <input
              className="search-shell-input"
              style={{ paddingLeft: "2.3rem", paddingTop: "0.55rem", paddingBottom: "0.55rem" }}
              placeholder="Search tasks…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="search-shell-clear" onClick={() => setSearch("")}>
                <X size={13} />
              </button>
            )}
          </div>

          {done > 0 && (
            <button className="btn-ghost btn-sm" onClick={clearCompleted} style={{ marginLeft: "auto" }}>
              Clear completed ({done})
            </button>
          )}
        </div>

        {/* Task list */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {visible.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><ClipboardList size={24} /></div>
              <h3>
                {search ? "No tasks match your search" :
                 filter === "Completed" ? "No completed tasks" :
                 filter === "Overdue" ? "No overdue tasks" :
                 "No tasks yet"}
              </h3>
              <p>
                {search
                  ? `Try a different keyword or clear your search.`
                  : filter === "All"
                  ? "Add your first task to start tracking your goals."
                  : "Tasks matching this filter will appear here."}
              </p>
              {filter === "All" && !search && (
                <button className="btn-primary" style={{ marginTop: "0.5rem" }} onClick={() => setShowForm(true)}>
                  <Plus size={15} /> Add First Task
                </button>
              )}
            </div>
          ) : (
            <div>
              {visible.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create task modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <div className="modal-title">New Task</div>
                <p className="modal-subtitle">Add a goal, drill, or daily objective to track.</p>
              </div>
              <button className="btn-icon" onClick={() => setShowForm(false)}><X size={15} /></button>
            </div>

            <form className="stack-md" onSubmit={handleCreate}>
              {/* Title */}
              <div className="field-group">
                <label className="field-label" htmlFor="task-title">Task *</label>
                <input
                  id="task-title"
                  className="field-input"
                  placeholder="e.g. Complete 5km run, Review match footage…"
                  value={form.title}
                  required
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="field-group">
                <label className="field-label" htmlFor="task-desc">Notes</label>
                <textarea
                  id="task-desc"
                  className="field-textarea"
                  rows={2}
                  placeholder="Optional details or context…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="form-grid form-grid-2">
                {/* Priority */}
                <div className="field-group">
                  <label className="field-label" htmlFor="task-priority">Priority</label>
                  <select
                    id="task-priority"
                    className="field-select"
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  >
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>

                {/* Category */}
                <div className="field-group">
                  <label className="field-label" htmlFor="task-cat">Category</label>
                  <select
                    id="task-cat"
                    className="field-select"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Due date */}
              <div className="field-group">
                <label className="field-label" htmlFor="task-due">Due Date</label>
                <input
                  id="task-due"
                  className="field-input"
                  type="date"
                  value={form.dueDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                />
                <span className="field-hint">Leave empty for tasks without a deadline.</span>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={!form.title.trim()}>
                  <Plus size={15} /> Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

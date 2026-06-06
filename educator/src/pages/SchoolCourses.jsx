// src/pages/educator/SchoolCourses.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  PlayCircle,
  PauseCircle,
  Save,
  Plus,
  X,
  Search,
  Trash2,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { api, getApiError } from "../api/axios";

/* ---------------- Utils ---------------- */
const cn = (...s) => s.filter(Boolean).join(" ");
const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const clamp = (n, a, b) => Math.max(a, Math.min(b, toNum(n)));

const getArrayFrom = (...candidates) => {
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
};

const unwrap = (res) => res?.data ?? res ?? {};

function formatTime(min) {
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h <= 0) return `${r}m`;
  if (r === 0) return `${h}h`;
  return `${h}h ${r}m`;
}

function calcEta(expectedWeeks, progressPct, status) {
  const w = clamp(expectedWeeks, 0, 999);
  const p = clamp(progressPct, 0, 100);

  const totalMin = w ? w * 7 * 60 : 0;
  const doneMin = totalMin ? (totalMin * p) / 100 : 0;
  const remainingMin = Math.max(0, totalMin - doneMin);

  const pausedLike = status === "paused" || status === "pending";
  const doneLike = status === "completed" || p >= 100;

  const etaText = doneLike
    ? "Completed"
    : pausedLike
    ? "Paused"
    : totalMin
    ? `~${formatTime(remainingMin)}`
    : "—";

  const doneWeeks = w ? Math.round((w * p) / 100) : 0;
  const leftWeeks = w ? Math.max(0, w - doneWeeks) : 0;

  return { totalMin, doneMin, remainingMin, etaText, doneWeeks, leftWeeks };
}

function ProgressBar({ value = 0 }) {
  const v = clamp(value, 0, 100);
  return (
    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-sky-300 to-indigo-300"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-white/55 font-extrabold">
        {label}
      </div>
      <div className="mt-1 text-[18px] text-white font-black">{value}</div>
      {sub ? <div className="mt-1 text-[11px] text-white/50 font-semibold">{sub}</div> : null}
    </div>
  );
}

function Pill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-[11px] font-black border transition",
        active
          ? "bg-white/12 border-white/25 text-white"
          : "bg-white/5 border-white/10 text-white/65 hover:bg-white/10"
      )}
    >
      {children}
    </button>
  );
}

function statusBadge(status) {
  switch (status) {
    case "running":
      return { label: "RUNNING", cls: "text-emerald-200 bg-emerald-500/12 border-emerald-400/20" };
    case "paused":
      return { label: "PAUSED", cls: "text-amber-200 bg-amber-500/10 border-amber-400/20" };
    case "completed":
      return { label: "COMPLETED", cls: "text-sky-200 bg-sky-500/10 border-sky-400/20" };
    case "pending":
    default:
      return { label: "PENDING", cls: "text-white/80 bg-white/6 border-white/10" };
  }
}

const extractListDeep = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  return getArrayFrom(
    payload?.items,
    payload?.schools,
    payload?.assignments,
    payload?.courses,
    payload?.data?.items,
    payload?.data?.schools,
    payload?.data?.assignments,
    payload?.data?.courses,
    payload?.result,
    payload?.results,
    payload?.rows,
    payload?.docs,
    payload?.data?.result,
    payload?.data?.results,
    payload?.data?.rows,
    payload?.data?.docs,
    payload?.payload?.items,
    payload?.payload?.schools,
    payload?.payload
  );
};

const normalizeSchool = (s, index = 0) => {
  const id = String(
    s?._id || s?.id || s?.schoolId || s?.school?._id || s?.school?.id || `school-${index}`
  ).trim();

  const name = String(
    s?.name || s?.schoolName || s?.title || s?.school?.name || s?.school?.schoolName || s?.school?.title || `School ${index + 1}`
  ).trim();

  return { ...s, _id: id, name };
};

export default function SchoolCourses() {
  const token = localStorage.getItem("accessToken") || "";

  const [schools, setSchools] = useState([]);
  const [schoolId, setSchoolId] = useState("");
  const [classLevel, setClassLevel] = useState("6");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [err, setErr] = useState("");

  const [editMap, setEditMap] = useState({});
  const [qAssigned, setQAssigned] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [assignOpen, setAssignOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [courseQ, setCourseQ] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [assignWeeks, setAssignWeeks] = useState(8);
  const [assigning, setAssigning] = useState(false);
  const [assignAttempted, setAssignAttempted] = useState(false);

  const fetchSchools = useCallback(async () => {
    if (!token) {
      setSchools([]);
      setSchoolId("");
      setErr("Token missing. Please login again.");
      return;
    }

    try {
      setErr("");

      const res = await api.get("/educator/schools", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });

      const data = unwrap(res);
      const rawList = extractListDeep(data);

      const normalizedList = rawList
        .map((s, index) => normalizeSchool(s, index))
        .filter((s) => s._id && s.name);

      setSchools(normalizedList);
      setSchoolId((prev) => {
        if (prev && normalizedList.some((s) => s._id === prev)) return prev;
        return normalizedList[0]?._id || "";
      });
    } catch (e) {
      console.error("fetchSchools error =", e);
      setErr(getApiError(e, "Failed to load schools"));
      setSchools([]);
      setSchoolId("");
    }
  }, [token]);

  const fetchAssignments = useCallback(async () => {
    if (!schoolId) {
      setItems([]);
      setEditMap({});
      return;
    }

    setLoading(true);

    try {
      setErr("");

      const res = await api.get("/educator/assignments", {
        params: { schoolId, classLevel },
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });

      const data = unwrap(res);
      const list = extractListDeep(data);

      const normalized = list.map((a) => {
        const p = clamp(a?.progressPct, 0, 100);
        let st = String(a?.status || "pending");
        if (st === "active") st = "running";
        if (st === "inactive") st = "paused";
        if (p >= 100) st = "completed";
        return { ...a, status: st, progressPct: p };
      });

      setItems(normalized);

      const next = {};
      for (const a of normalized) {
        next[a._id] = {
          progressPct: clamp(a?.progressPct, 0, 100),
          expectedWeeks: clamp(a?.expectedWeeks, 0, 999),
          status: a?.status || "pending",
        };
      }
      setEditMap(next);
    } catch (e) {
      console.error("fetchAssignments error =>", e);

      const msg = String(getApiError(e, "") || "");
      const status = e?.response?.status;

      if (status === 404 || msg.toLowerCase().includes("route not found")) {
        setItems([]);
        setEditMap({});
        setErr("");
        return;
      }

      setErr(getApiError(e, "Failed to load assigned courses"));
      setItems([]);
      setEditMap({});
    } finally {
      setLoading(false);
    }
  }, [schoolId, classLevel, token]);

  const fetchCourses = useCallback(async () => {
    if (!token) return;

    try {
      const res = await api.get("/courses/mine", {
        params: { classLevel },
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });

      const data = unwrap(res);
      const list = extractListDeep(data);
      setCourses(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("fetchCourses error =>", e);
      setCourses([]);
    }
  }, [token, classLevel]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const patchAssignment = async (assignmentId, body) => {
    setBusyId(assignmentId);
    setErr("");

    try {
      const outgoing = { ...body };

      if (outgoing.status) {
        if (outgoing.status === "running") outgoing.status = "active";
        if (outgoing.status === "paused") outgoing.status = "inactive";
        if (outgoing.status === "pending") outgoing.status = "inactive";
      }

      await api.patch(`/educator/assignments/${assignmentId}`, outgoing, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchAssignments();
    } catch (e) {
      setErr(getApiError(e, "Update failed"));
    } finally {
      setBusyId("");
    }
  };

  const deleteAssignment = async (assignmentId) => {
    const ok = window.confirm("Are you sure you want to delete this assigned course?");
    if (!ok) return;

    setBusyId(assignmentId);
    setErr("");

    try {
      await api.delete(`/educator/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchAssignments();
    } catch (e) {
      setErr(getApiError(e, "Delete failed"));
    } finally {
      setBusyId("");
    }
  };

  const saveAllEdits = async (assignmentId) => {
    const row = editMap[assignmentId] || {};
    const progressPct = clamp(row.progressPct, 0, 100);
    const expectedWeeks = clamp(row.expectedWeeks, 1, 999);

    let status = row.status || "pending";
    if (progressPct >= 100) status = "completed";

    return patchAssignment(assignmentId, { progressPct, expectedWeeks, status });
  };

  const quickSetCompleted = (assignmentId) => {
    setEditMap((p) => ({
      ...p,
      [assignmentId]: { ...(p[assignmentId] || {}), progressPct: 100, status: "completed" },
    }));
    return patchAssignment(assignmentId, { progressPct: 100, status: "completed" });
  };

  const quickResetPending = (assignmentId) => {
    setEditMap((p) => ({
      ...p,
      [assignmentId]: { ...(p[assignmentId] || {}), progressPct: 0, status: "pending" },
    }));
    return patchAssignment(assignmentId, { progressPct: 0, status: "pending" });
  };

  const onToggleRunning = (assignmentId, currStatus) => {
    const next = currStatus === "running" ? "paused" : "running";
    setEditMap((p) => ({
      ...p,
      [assignmentId]: { ...(p[assignmentId] || {}), status: next },
    }));
    return patchAssignment(assignmentId, { status: next });
  };

  const canOpenAssign = Boolean(schoolId && classLevel);

  const openAssign = () => {
    setAssignAttempted(true);
    if (!canOpenAssign) {
      setErr("Please select School and Class first.");
      return;
    }
    setErr("");
    setAssignOpen(true);
    fetchCourses();
  };

  const assignCourse = async () => {
    setAssignAttempted(true);
    if (!schoolId || !classLevel || !selectedCourseId) {
      setErr("Please select School, Class and Course.");
      return;
    }

    setAssigning(true);
    setErr("");

    try {
      await api.post(
        "/educator/assignments",
        {
          schoolId,
          classLevel,
          courseId: selectedCourseId,
          expectedWeeks: clamp(assignWeeks, 1, 999),
          status: "pending",
          progressPct: 0,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAssignOpen(false);
      setSelectedCourseId("");
      setCourseQ("");
      await fetchAssignments();
    } catch (e) {
      setErr(getApiError(e, "Failed to assign course"));
    } finally {
      setAssigning(false);
    }
  };

  const selectedSchool = useMemo(
    () => schools.find((s) => s._id === schoolId),
    [schools, schoolId]
  );

  const filteredCourses = useMemo(() => {
    const q = (courseQ || "").trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => {
      const title = (c?.title?.en || c?.title || "").toString().toLowerCase();
      const cat = (c?.category || "").toString().toLowerCase();
      return title.includes(q) || cat.includes(q);
    });
  }, [courses, courseQ]);

  const summary = useMemo(() => {
    const total = items.length;
    const counts = { pending: 0, running: 0, paused: 0, completed: 0 };

    let avg = 0;
    let remainingMin = 0;

    for (const a of items) {
      const st = a.status || "pending";
      if (counts[st] !== undefined) counts[st] += 1;

      const p = clamp(a.progressPct, 0, 100);
      avg += p;
      const { remainingMin: rm } = calcEta(a.expectedWeeks, p, st);
      remainingMin += rm;
    }

    return {
      total,
      counts,
      avgProgress: total ? avg / total : 0,
      remainingMin,
    };
  }, [items]);

  const visibleItems = useMemo(() => {
    const q = (qAssigned || "").trim().toLowerCase();
    return items
      .filter((a) => (statusFilter === "all" ? true : (a.status || "pending") === statusFilter))
      .filter((a) => {
        if (!q) return true;
        const course = a.course || a.courseId || {};
        const title = (course?.title?.en || course?.title || "").toString().toLowerCase();
        const cat = (course?.category || "").toString().toLowerCase();
        return title.includes(q) || cat.includes(q);
      });
  }, [items, qAssigned, statusFilter]);

  if (!token) {
    return (
      <div className="p-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
          Session missing. Please login again.
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 space-y-4">
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[18px] font-black text-white">Educator • Course Assignment Manager</h2>
            <p className="text-[12px] text-white/65 font-semibold">
              Educator yahin se course assign, status, progress, expected weeks, completion, delete — sab control karega.
              Student UI me Active/Completed automatically show hoga.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Pill active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>All ({summary.total})</Pill>
              <Pill active={statusFilter === "pending"} onClick={() => setStatusFilter("pending")}>Pending ({summary.counts.pending})</Pill>
              <Pill active={statusFilter === "running"} onClick={() => setStatusFilter("running")}>Running ({summary.counts.running})</Pill>
              <Pill active={statusFilter === "paused"} onClick={() => setStatusFilter("paused")}>Paused ({summary.counts.paused})</Pill>
              <Pill active={statusFilter === "completed"} onClick={() => setStatusFilter("completed")}>Completed ({summary.counts.completed})</Pill>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={openAssign}
              className={cn(
                "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[12px] font-black border transition text-white w-full md:w-auto",
                canOpenAssign
                  ? "bg-emerald-500/15 border-emerald-400/25 hover:bg-emerald-500/20"
                  : "bg-white/5 border-white/10 opacity-60 cursor-not-allowed"
              )}
              disabled={!canOpenAssign}
            >
              <Plus className="h-4 w-4" />
              Assign Course
            </button>

            <button
              type="button"
              onClick={fetchAssignments}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[12px] font-black bg-white/10 border border-white/10 hover:bg-white/15 transition text-white w-full md:w-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-white/55 font-extrabold">School</div>

          <select
            value={schoolId}
            onChange={(e) => {
              setSchoolId(e.target.value);
              setAssignAttempted(false);
              setErr("");
            }}
            className="mt-2 w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-3 text-[12px] text-white outline-none"
          >
            <option value="" className="text-black">Select School</option>
            {Array.isArray(schools) &&
              schools.map((s) => (
                <option key={s._id} value={s._id} className="text-black">
                  {s.name}
                </option>
              ))}
          </select>

          <div className="mt-2 text-[11px] text-white/55 font-semibold">
            Schools loaded: <span className="text-white/85 font-black">{schools.length}</span>
          </div>

          {selectedSchool ? (
            <div className="mt-2 text-[11px] text-white/55 font-semibold">
              Selected: <span className="text-white/85 font-black">{selectedSchool.name}</span>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-white/55 font-extrabold">Class</div>
          <select
            value={classLevel}
            onChange={(e) => {
              setClassLevel(e.target.value);
              setAssignAttempted(false);
              setErr("");
            }}
            className="mt-2 w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-3 text-[12px] text-white outline-none"
          >
            {["4", "5", "6", "7", "8", "9", "10", "11", "12"].map((c) => (
              <option key={c} value={c} className="text-black">{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-white/55 font-extrabold">
          Search Assigned Courses
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
            <Search className="h-4 w-4" />
          </div>
          <input
            value={qAssigned}
            onChange={(e) => setQAssigned(e.target.value)}
            placeholder="Search by course name / category…"
            className="w-full rounded-2xl bg-black/25 border border-white/10 px-4 py-3 text-[12px] text-white outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="Assigned" value={summary.total} />
        <Stat label="Running" value={summary.counts.running} />
        <Stat label="Avg Progress" value={`${Math.round(summary.avgProgress)}%`} />
        <Stat label="Remaining Time" value={`~${formatTime(summary.remainingMin)}`} sub="ExpectedWeeks based" />
      </div>

      {err ? (
        <div className="rounded-2xl bg-red-500/10 border border-red-400/20 p-3 text-[12px] text-white/90">
          ⚠️ {err}
        </div>
      ) : null}

      {assignOpen && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm p-3 md:p-6 flex items-end md:items-center justify-center">
          <div className="w-full max-w-2xl rounded-[26px] border border-white/10 bg-[#0b1220] shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <div className="text-white font-black text-[15px]">Assign New Course</div>
                <div className="text-white/60 text-[12px] font-semibold">
                  {selectedSchool?.name || "School"} • Class {classLevel}
                </div>
              </div>
              <button
                onClick={() => setAssignOpen(false)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-white/55 font-extrabold">
                  Choose Course
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    value={courseQ}
                    onChange={(e) => setCourseQ(e.target.value)}
                    placeholder="Search course name / category…"
                    className="w-full rounded-2xl bg-black/25 border border-white/10 px-4 py-3 text-[12px] text-white outline-none"
                  />
                </div>

                <div className="mt-3 max-h-[280px] overflow-auto space-y-2 pr-1">
                  {filteredCourses.length === 0 ? (
                    <div className="text-[12px] text-white/60 font-semibold">No courses found.</div>
                  ) : (
                    filteredCourses.map((c) => {
                      const id = c._id || c.id;
                      const title = c?.title?.en || c?.title || "Untitled";
                      const cat = c?.category || "Course";
                      const selected = selectedCourseId === id;

                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setSelectedCourseId(id)}
                          className={cn(
                            "w-full text-left rounded-2xl border p-3 transition",
                            selected
                              ? "bg-emerald-500/15 border-emerald-400/25"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                        >
                          <div className="text-[10px] uppercase tracking-[0.16em] font-extrabold text-white/55">
                            {cat}
                          </div>
                          <div className="mt-1 text-white font-black text-[13px]">{title}</div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-white/55 font-extrabold">
                  Expected Duration
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={assignWeeks}
                    onChange={(e) => setAssignWeeks(e.target.value)}
                    className="w-full rounded-2xl bg-black/25 border border-white/10 px-4 py-3 text-[12px] text-white outline-none"
                  />
                  <div className="text-[12px] text-white/60 font-semibold whitespace-nowrap">weeks</div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 flex flex-col md:flex-row gap-2 md:justify-end">
              <button
                onClick={() => setAssignOpen(false)}
                className="px-4 py-2.5 rounded-2xl text-[12px] font-black bg-white/10 border border-white/10 hover:bg-white/15 text-white"
              >
                Cancel
              </button>
              <button
                disabled={assigning}
                onClick={assignCourse}
                className={cn(
                  "px-4 py-2.5 rounded-2xl text-[12px] font-black border text-white",
                  "bg-emerald-500/15 border-emerald-400/25 hover:bg-emerald-500/20",
                  "disabled:opacity-60 disabled:cursor-not-allowed"
                )}
              >
                {assigning ? "Assigning..." : "Assign Course"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-3">
        {loading ? (
          <div className="text-[12px] text-white/70 font-semibold">Loading…</div>
        ) : visibleItems.length === 0 ? (
          <div className="text-[12px] text-white/70 font-semibold">
            No assigned courses found for selected school/class.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleItems.map((a) => {
              const course = a.course || a.courseId || {};
              const isBusy = busyId === a._id;

              const local = editMap[a._id] || {};
              const progressPct = clamp(local.progressPct ?? a.progressPct ?? 0, 0, 100);
              const expectedWeeks = clamp(local.expectedWeeks ?? a.expectedWeeks ?? 8, 1, 999);

              let status = local.status ?? a.status ?? "pending";
              if (progressPct >= 100) status = "completed";

              const { etaText, doneWeeks, leftWeeks } = calcEta(expectedWeeks, progressPct, status);
              const badge = statusBadge(status);

              return (
                <div key={a._id} className="rounded-[22px] bg-white/5 border border-white/10 p-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-[11px] text-white/60 font-extrabold tracking-[0.16em] uppercase">
                          {course?.category || "Course"}
                        </div>

                        <div className={cn("text-[11px] font-black px-2.5 py-1 rounded-full border", badge.cls)}>
                          {badge.label}
                        </div>
                      </div>

                      <div className="mt-1 text-[15px] font-black text-white break-words">
                        {course?.title?.en || course?.title || "Untitled"}
                      </div>

                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-2">
                          <div className="text-[10px] text-white/50 font-extrabold uppercase tracking-[0.14em]">Done</div>
                          <div className="text-[12px] font-black mt-0.5 text-white">{expectedWeeks ? `${doneWeeks}w` : "—"}</div>
                        </div>

                        <div className="rounded-2xl bg-white/5 border border-white/10 p-2">
                          <div className="text-[10px] text-white/50 font-extrabold uppercase tracking-[0.14em]">Remaining</div>
                          <div className="text-[12px] font-black mt-0.5 text-white">{expectedWeeks ? `${leftWeeks}w` : "—"}</div>
                        </div>

                        <div className="rounded-2xl bg-white/5 border border-white/10 p-2">
                          <div className="text-[10px] text-white/50 font-extrabold uppercase tracking-[0.14em]">ETA</div>
                          <div className="text-[12px] font-black mt-0.5 text-white">{etaText}</div>
                        </div>

                        <div className="rounded-2xl bg-white/5 border border-white/10 p-2">
                          <div className="text-[10px] text-white/50 font-extrabold uppercase tracking-[0.14em]">Expected</div>
                          <div className="text-[12px] font-black mt-0.5 text-white">{expectedWeeks}w</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                      <button
                        disabled={isBusy || status === "completed"}
                        onClick={() => onToggleRunning(a._id, status)}
                        className={cn(
                          "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[12px] font-black border transition text-white w-full sm:w-auto",
                          "disabled:opacity-60 disabled:cursor-not-allowed",
                          status === "running"
                            ? "bg-white/10 border-white/10 hover:bg-white/15"
                            : "bg-emerald-500/15 border-emerald-400/25 hover:bg-emerald-500/20"
                        )}
                      >
                        {status === "running" ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                        {status === "running" ? "Pause" : "Start"}
                      </button>

                      <button
                        disabled={isBusy}
                        onClick={() => quickSetCompleted(a._id)}
                        className={cn(
                          "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[12px] font-black border transition text-white w-full sm:w-auto",
                          "disabled:opacity-60 disabled:cursor-not-allowed",
                          "bg-sky-500/10 border-sky-400/20 hover:bg-sky-500/15"
                        )}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Complete
                      </button>

                      <button
                        disabled={isBusy}
                        onClick={() => deleteAssignment(a._id)}
                        className={cn(
                          "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[12px] font-black border transition text-white w-full sm:w-auto",
                          "disabled:opacity-60 disabled:cursor-not-allowed",
                          "bg-red-500/10 border-red-400/20 hover:bg-red-500/15"
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-[12px] text-white/75 font-semibold">
                      <span>Progress</span>
                      <span className="text-white font-black">{Math.round(progressPct)}%</span>
                    </div>
                    <ProgressBar value={progressPct} />
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-white/55 font-extrabold tracking-[0.16em] uppercase">
                        Educator Controls
                      </div>

                      <button
                        disabled={isBusy}
                        onClick={() => quickResetPending(a._id)}
                        className={cn(
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-black border transition text-white",
                          "disabled:opacity-60 disabled:cursor-not-allowed",
                          "bg-white/8 border-white/10 hover:bg-white/12"
                        )}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-[10px] uppercase tracking-[0.16em] text-white/55 font-extrabold">Status</div>
                        <select
                          value={status}
                          onChange={(e) =>
                            setEditMap((p) => ({
                              ...p,
                              [a._id]: { ...(p[a._id] || {}), status: e.target.value },
                            }))
                          }
                          className="mt-2 w-full rounded-2xl bg-black/25 border border-white/10 px-4 py-3 text-[12px] text-white outline-none"
                        >
                          <option value="pending" className="text-black">Pending</option>
                          <option value="running" className="text-black">Running</option>
                          <option value="paused" className="text-black">Paused</option>
                          <option value="completed" className="text-black">Completed</option>
                        </select>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-[10px] uppercase tracking-[0.16em] text-white/55 font-extrabold">Expected Weeks</div>
                        <input
                          type="number"
                          min={1}
                          max={999}
                          value={expectedWeeks}
                          onChange={(e) =>
                            setEditMap((p) => ({
                              ...p,
                              [a._id]: { ...(p[a._id] || {}), expectedWeeks: e.target.value },
                            }))
                          }
                          className="mt-2 w-full rounded-2xl bg-black/25 border border-white/10 px-4 py-3 text-[12px] text-white outline-none"
                        />
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-[10px] uppercase tracking-[0.16em] text-white/55 font-extrabold">Progress %</div>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={progressPct}
                          onChange={(e) =>
                            setEditMap((p) => ({
                              ...p,
                              [a._id]: { ...(p[a._id] || {}), progressPct: e.target.value },
                            }))
                          }
                          className="mt-2 w-full rounded-2xl bg-black/25 border border-white/10 px-4 py-3 text-[12px] text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                      <button
                        disabled={isBusy}
                        onClick={() => saveAllEdits(a._id)}
                        className={cn(
                          "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[12px] font-black border transition text-white w-full sm:w-auto",
                          "disabled:opacity-60 disabled:cursor-not-allowed",
                          "bg-white/10 border-white/10 hover:bg-white/15"
                        )}
                      >
                        <Save className="h-4 w-4" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!schoolId && assignAttempted ? (
        <div className="text-[12px] text-white/60 font-semibold">⚠️ Pehle School select karein.</div>
      ) : null}
    </div>
  );
}
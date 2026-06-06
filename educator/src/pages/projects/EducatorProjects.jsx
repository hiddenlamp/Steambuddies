import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Video, FolderKanban, Trash2 } from "lucide-react";
import { api, getApiError } from "../../api/axios";

const cn = (...s) => s.filter(Boolean).join(" ");

export default function EducatorProjects() {
  const nav = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  const toast = location.state?.toast;

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      // ✅ interceptor returns payload directly
      const res = await api.get("/projects/mine"); // baseURL already /api

      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
        ? res.items
        : [];

      setItems(list);
    } catch (e) {
      setItems([]);
      setErr(getApiError(e, "Failed to load projects"));
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (projectId) => {
    const ok = window.confirm("Delete this project? This cannot be undone.");
    if (!ok) return;

    try {
      setErr("");
      setDeletingId(projectId);

      // ✅ assumes backend: DELETE /api/projects/:id
      await api.delete(`/projects/${projectId}`);

      // ✅ optimistic remove
      setItems((prev) => prev.filter((x) => String(x?._id) !== String(projectId)));
    } catch (e) {
      setErr(getApiError(e, "Failed to delete project"));
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="text-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.18em] text-white/55 uppercase">
            Projects
          </p>
          <h2 className="mt-1 text-[18px] md:text-[20px] font-black">
            Manage{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-indigo-300 to-fuchsia-300">
              Video Projects
            </span>
          </h2>
          <p className="mt-1 text-[12px] text-white/65 font-semibold">
            Your published projects will be visible in student Projects page.
          </p>
        </div>

        <button
          type="button"
          onClick={() => nav("/educator/projects/new")}
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-black",
            "bg-white text-slate-950 border border-white hover:opacity-95"
          )}
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {!!toast && (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-[13px] font-semibold text-emerald-100">
          {toast}
        </div>
      )}

      {!!err && (
        <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-[13px] font-semibold text-red-100">
          {err}
        </div>
      )}

      <div className="mt-5">
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-white/70 font-semibold">
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 text-center">
            <div className="inline-flex items-center gap-2 text-white/75 font-black">
              <FolderKanban className="h-5 w-5" />
              No projects yet
            </div>
            <p className="mt-2 text-[12px] text-white/55 font-semibold">
              Click “New Project” to upload your first project.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {items.map((p) => {
              const id = p?._id;
              const busy = deletingId && String(deletingId) === String(id);

              return (
                <div
                  key={id}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[14px] font-black text-white truncate">
                        {p?.title?.en || p?.title?.hi || "Untitled"}
                      </div>
                      <div className="mt-1 text-[12px] text-white/60 font-semibold">
                        {p?.category || "—"} • {p?.duration?.en || p?.duration?.hi || ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="rounded-xl px-2 py-1 text-[11px] font-extrabold border border-white/10 bg-white/5 text-white/70">
                        {p?.status || "draft"}
                      </div>

                      <button
                        type="button"
                        onClick={() => onDelete(id)}
                        disabled={busy}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-[11px] font-extrabold",
                          "border border-red-400/25 bg-red-500/10 text-red-100 hover:bg-red-500/15 transition",
                          busy && "opacity-60 cursor-not-allowed"
                        )}
                        title="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                        {busy ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>

                  {p?.videoUrl ? (
                    <a
                      href={p.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-[12px] font-black text-sky-200 hover:text-sky-100"
                    >
                      <Video className="h-4 w-4" />
                      Open Video
                    </a>
                  ) : (
                    <div className="mt-3 text-[12px] font-semibold text-white/50">
                      No video URL
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

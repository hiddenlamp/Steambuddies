import React, { useState, useEffect } from "react";
import { applyLeave, getMyLeaves } from "../api/leave.api";
import { Calendar, Plus, Clock, CheckCircle, XCircle, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const cn = (...s) => s.filter(Boolean).join(" ");

export default function Leave() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ startDate: "", endDate: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await getMyLeaves();
      if (res.success) {
        setLeaves(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch leaves", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.reason) return alert("Please fill all fields");

    setSubmitting(true);
    try {
      const res = await applyLeave(formData);
      if (res.success) {
        alert("Leave applied successfully! Admin has been notified.");
        setShowForm(false);
        setFormData({ startDate: "", endDate: "", reason: "" });
        fetchLeaves();
      } else {
        alert(res.message || "Failed to apply leave");
      }
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || error?.message || "Failed to apply leave");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === "Approved") return <CheckCircle className="w-4 h-4" />;
    if (status === "Rejected") return <XCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  return (
    <div className="flex flex-col h-full gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 border border-white/10 p-5 rounded-[22px] backdrop-blur-md">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-sky-400" />
            Leave Application
          </h1>
          <p className="text-xs md:text-sm text-white/60 mt-1 font-semibold">
            Apply for new leaves and track your previous requests.
          </p>
        </div>
        
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="bg-white/10 hover:bg-white/15 border border-white/10 text-white px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4 text-sky-400" /> Apply Leave
          </button>
        ) : (
          <button
            onClick={() => setShowForm(false)}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Back to List
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/[0.04] border border-white/10 rounded-[22px] p-6 md:p-8"
            >
              <h2 className="text-lg font-black text-white mb-6">New Leave Request</h2>
              <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Start Date</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/70 uppercase tracking-wider">End Date</label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Reason</label>
                  <textarea
                    required
                    rows="4"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Briefly explain your reason for leave..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 resize-none transition"
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 transition disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Application"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="bg-white/5 border border-white/10 text-white/80 px-8 py-3 rounded-2xl text-sm font-bold hover:bg-white/10 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <div className="bg-white/[0.03] border border-white/10 rounded-[22px] overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center text-white/40 font-semibold animate-pulse">Loading history...</div>
                ) : leaves.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                      <Calendar className="w-8 h-8 text-white/40" />
                    </div>
                    <p className="text-white/80 font-bold text-base">No leave applications found.</p>
                    <p className="text-white/50 text-sm mt-1">When you apply for leave, it will appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-white/80">
                      <thead className="bg-black/20 text-white/50 text-[11px] font-black uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Dates</th>
                          <th className="px-6 py-4">Reason</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Admin Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {leaves.map((leave) => (
                          <tr key={leave._id} className="hover:bg-white/5 transition">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-bold text-white">{new Date(leave.startDate).toLocaleDateString()}</div>
                              <div className="text-xs text-white/40 mt-0.5">to {new Date(leave.endDate).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="max-w-xs truncate text-white/90 font-medium" title={leave.reason}>
                                {leave.reason}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border",
                                leave.status === "Approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                leave.status === "Rejected" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              )}>
                                {getStatusIcon(leave.status)}
                                {leave.status}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="max-w-xs truncate text-white/60 text-xs font-medium" title={leave.adminRemark || "None"}>
                                {leave.adminRemark || "—"}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { applyLeave, getMyLeaves } from "../api/leave.api";
import { Calendar, Plus, Clock, CheckCircle, XCircle } from "lucide-react";

export default function Leave() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
        setShowModal(false);
        setFormData({ startDate: "", endDate: "", reason: "" });
        fetchLeaves();
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to apply leave");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === "Approved") return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === "Rejected") return <XCircle className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-400" /> My Leaves
          </h1>
          <p className="text-sm text-gray-400 mt-1">Apply for leave and track your status</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Apply Leave
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading leaves...</div>
        ) : leaves.length === 0 ? (
          <div className="p-8 text-center text-gray-400">You haven't applied for any leave yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="text-xs uppercase bg-white/5 text-gray-400">
                <tr>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">End Date</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Admin Remark</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave._id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-white">{new Date(leave.startDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium text-white">{new Date(leave.endDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-semibold">
                        {getStatusIcon(leave.status)}
                        <span className={
                          leave.status === "Approved" ? "text-green-500" :
                          leave.status === "Rejected" ? "text-red-500" : "text-yellow-500"
                        }>{leave.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-gray-400" title={leave.adminRemark || "-"}>{leave.adminRemark || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#151521] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Apply for Leave</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-[#0b1020] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-[#0b1020] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Reason</label>
                <textarea
                  required
                  rows="3"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Why do you need leave?"
                  className="w-full bg-[#0b1020] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
                ></textarea>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-50"
                >
                  {submitting ? "Applying..." : "Submit Leave"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

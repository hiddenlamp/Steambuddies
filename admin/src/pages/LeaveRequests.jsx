import React, { useState, useEffect } from "react";
import { getAllLeaves, updateLeaveStatus } from "../api/leave.api";
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

export default function LeaveRequests() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await getAllLeaves();
      if (res.success) {
        setLeaves(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch leaves", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    const adminRemark = window.prompt(`Enter remark for ${status} (optional):`);
    if (adminRemark === null) return; // cancelled

    try {
      const res = await updateLeaveStatus(id, { status, adminRemark });
      if (res.success) {
        setLeaves((prev) =>
          prev.map((l) => (l._id === id ? { ...l, status, adminRemark } : l))
        );
      }
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Failed to update leave status.");
    }
  };

  const getStatusIcon = (status) => {
    if (status === "Approved") return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === "Rejected") return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-400" /> Educator Leave Requests
        </h1>
        <p className="text-gray-400 mt-2 font-medium">Manage and review leave applications from educators.</p>
      </div>

      <div className="bg-[#151521] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-10 text-center text-gray-400 font-semibold animate-pulse">Loading requests...</div>
        ) : leaves.length === 0 ? (
          <div className="p-10 text-center text-gray-400 font-semibold">No leave requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="text-xs uppercase bg-[#0b1020] text-gray-400">
                <tr>
                  <th className="px-6 py-4">Educator</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{leave.educator?.fullName || "Unknown"}</div>
                      <div className="text-xs text-gray-500">{leave.educator?.email}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {new Date(leave.startDate).toLocaleDateString()} <span className="text-gray-500 mx-1">to</span> {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="truncate" title={leave.reason}>{leave.reason}</p>
                      {leave.adminRemark && (
                        <p className="text-xs text-blue-400 mt-1 truncate" title={`Remark: ${leave.adminRemark}`}>Remark: {leave.adminRemark}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        leave.status === "Approved" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                        leave.status === "Rejected" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      }`}>
                        {getStatusIcon(leave.status)}
                        {leave.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {leave.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleStatusChange(leave._id, "Approved")}
                            className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(leave._id, "Rejected")}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

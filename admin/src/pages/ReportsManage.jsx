import React, { useEffect, useState } from "react";
import { getDailyReports } from "../api/reports.api";
import { FileText, Search, MapPin, Users, Lightbulb, Pickaxe, Calendar, User, Eye, X } from "lucide-react";

const BACKEND_URL = "http://localhost:5000";

const formatDateShort = (dateString) => {
  if (!dateString) return "N/A";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(dateString));
};

const formatDateLong = (dateString) => {
  if (!dateString) return "N/A";
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(dateString));
};

export default function ReportsManage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await getDailyReports();
      if (res.data?.ok) {
        setReports(res.data.reports);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (!searchTerm.trim()) return true;
    const sTerm = searchTerm.toLowerCase();
    const schoolMatch = r.schoolName?.toLowerCase().includes(sTerm);
    const educatorMatch = r.educator?.fullName?.toLowerCase().includes(sTerm);
    return schoolMatch || educatorMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            Educator Daily Reports
          </h1>
          <p className="text-gray-400 mt-1">Review school visit reports submitted by educators.</p>
        </div>
        <button 
          onClick={fetchReports}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition flex items-center gap-2"
        >
          {loading ? "Refreshing..." : "Refresh Reports"}
        </button>
      </div>

      {/* Search */}
      <div className="bg-[#1e1e2d] p-4 rounded-xl border border-white/10">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by school or educator name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#151521] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Grid of Reports */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading reports...</div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-10 text-gray-400 bg-[#1e1e2d] rounded-xl border border-white/10">
          No reports found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <div key={report._id} className="bg-[#1e1e2d] border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/50 transition duration-300">
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-white truncate" title={report.schoolName}>{report.schoolName}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-1">
                      <User className="w-4 h-4" />
                      <span>{report.educator?.fullName || "Unknown Educator"}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-lg shrink-0">
                    {formatDateShort(report.visitDate)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-1">
                      <Users className="w-3.5 h-3.5" /> Students
                    </div>
                    <div className="font-bold text-white text-base">{report.studentCount}</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-1">
                      <MapPin className="w-3.5 h-3.5" /> Images
                    </div>
                    <div className="font-bold text-white text-base">{report.images?.length || 0} Photos</div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedReport(report)}
                  className="w-full py-2.5 mt-2 bg-[#2a2a3c] hover:bg-blue-600 hover:text-white text-gray-300 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" /> View Full Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for viewing full report */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e1e2d] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#151521]">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> Report Details
              </h2>
              <button 
                onClick={() => setSelectedReport(null)}
                className="p-1.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Info Block */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-black text-white">{selectedReport.schoolName}</h3>
                    <p className="text-blue-400 font-semibold mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDateLong(selectedReport.visitDate)}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm font-semibold">Educator</span>
                      <span className="text-white font-bold">{selectedReport.educator?.fullName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm font-semibold">Students Reached</span>
                      <span className="text-white font-bold">{selectedReport.studentCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm font-semibold">Classes</span>
                      <span className="text-white font-bold text-right">{selectedReport.classesTaught}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" /> Topic Taught
                    </h4>
                    <p className="text-gray-200 bg-[#151521] p-4 rounded-xl border border-white/5">
                      {selectedReport.topicsTaught}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                      <Pickaxe className="w-4 h-4" /> Project Built
                    </h4>
                    <p className="text-gray-200 bg-[#151521] p-4 rounded-xl border border-white/5">
                      {selectedReport.projectBuilt}
                    </p>
                  </div>
                </div>

                {/* Images Block */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Visit Photos
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {selectedReport.images?.map((imgUrl, i) => (
                      <div key={i} className="rounded-xl overflow-hidden border border-white/10 bg-[#151521]">
                        <img 
                          src={`${BACKEND_URL}${imgUrl}`} 
                          alt={`Visit ${i + 1}`} 
                          className="w-full h-auto object-contain max-h-64"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

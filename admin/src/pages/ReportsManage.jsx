import React, { useEffect, useState, useRef } from "react";
import { getDailyReports } from "../api/reports.api";
import { FileText, Search, MapPin, Users, Lightbulb, Pickaxe, Calendar, User, Eye, X, Download, Image as ImageIcon } from "lucide-react";
import html2pdf from "html2pdf.js";

const BACKEND_URL = String(import.meta.env.VITE_API_BASE_URL || "https://steambuddies.onrender.com").replace(/\/+$/, "");

const formatDateShort = (dateString) => {
  if (!dateString) return "N/A";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(dateString));
};

const formatDateLong = (dateString) => {
  if (!dateString) return "N/A";
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(dateString));
};

const MultiSelectDropdown = ({ label, options, selectedValues, onChange }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (opt) => {
    if (selectedValues.includes(opt)) {
      onChange(selectedValues.filter(v => v !== opt));
    } else {
      onChange([...selectedValues, opt]);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        onClick={() => setOpen(!open)}
        className="w-full bg-[#151521] border border-white/5 rounded-lg py-2.5 px-3 text-sm text-white cursor-pointer flex justify-between items-center h-[42px]"
      >
        <span className="truncate pr-2 font-semibold">
          {selectedValues.length === 0 ? `All ${label}` : `${selectedValues.length} Selected`}
        </span>
        <span className="text-gray-400 text-xs">▼</span>
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-[#0b1020] border border-white/10 rounded-lg shadow-xl p-2 custom-scrollbar">
          {options.map(opt => (
            <label key={opt} className="flex items-start gap-2 p-2 hover:bg-white/5 rounded cursor-pointer text-sm text-white">
              <input 
                type="checkbox" 
                checked={selectedValues.includes(opt)}
                onChange={() => toggleOption(opt)}
                className="mt-1 w-4 h-4 rounded bg-gray-900 border-gray-600 focus:ring-blue-500 focus:ring-2 flex-shrink-0"
              />
              <span className="break-words">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default function ReportsManage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    school: [],
    educator: [],
    className: [],
    month: "",
    year: "",
  });

  const [selectedReport, setSelectedReport] = useState(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingSingle, setGeneratingSingle] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);

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

  // --- Dynamic Option Extraction ---
  const uniqueSchools = [...new Set(reports.map(r => r.schoolName).filter(Boolean))].sort();
  const uniqueEducators = [...new Set(reports.map(r => r.educator?.fullName).filter(Boolean))].sort();
  
  const allParsedClasses = reports.flatMap(r => 
    (r.classesTaught || "").split(",").map(c => c.trim()).filter(Boolean)
  );
  const uniqueClasses = [...new Set(allParsedClasses)].sort();

  const uniqueYears = [...new Set(reports.map(r => {
    const d = new Date(r.visitDate);
    return isNaN(d.getTime()) ? null : d.getFullYear();
  }).filter(Boolean))].sort((a, b) => b - a);

  const monthsList = [
    { value: "0", label: "January" }, { value: "1", label: "February" }, { value: "2", label: "March" },
    { value: "3", label: "April" }, { value: "4", label: "May" }, { value: "5", label: "June" },
    { value: "6", label: "July" }, { value: "7", label: "August" }, { value: "8", label: "September" },
    { value: "9", label: "October" }, { value: "10", label: "November" }, { value: "11", label: "December" }
  ];

  // --- Filtering Logic ---
  const filteredReports = reports.filter((r) => {
    if (searchTerm.trim()) {
      const sTerm = searchTerm.toLowerCase();
      const schoolMatch = r.schoolName?.toLowerCase().includes(sTerm);
      const educatorMatch = r.educator?.fullName?.toLowerCase().includes(sTerm);
      if (!schoolMatch && !educatorMatch) return false;
    }

    if (filters.school.length > 0 && !filters.school.includes(r.schoolName)) return false;
    if (filters.educator.length > 0 && !filters.educator.includes(r.educator?.fullName)) return false;
    
    if (filters.className.length > 0) {
      const cTaught = (r.classesTaught || "").split(",").map(c => c.trim());
      if (!filters.className.some(c => cTaught.includes(c))) return false;
    }

    const d = new Date(r.visitDate);
    if (!isNaN(d.getTime())) {
      if (filters.year && d.getFullYear().toString() !== filters.year) return false;
      if (filters.month && d.getMonth().toString() !== filters.month) return false;
    } else {
      if (filters.year || filters.month) return false;
    }

    return true;
  });

  // --- Group Reports for Summary PDF ---
  const groupedReports = filteredReports.reduce((acc, report) => {
    const school = report.schoolName || "Unknown School";
    if (!acc[school]) acc[school] = [];
    acc[school].push(report);
    return acc;
  }, {});

  // --- PDF Download Functions ---
  const handleDownloadSinglePDF = () => {
    setGeneratingSingle(true);
    
    setTimeout(() => {
      const element = document.getElementById("report-printable-overlay-content");
      if (!element) {
         setGeneratingSingle(false);
         return;
      }
      
      const opt = {
        margin:       0.4,
        filename:     `Report-${selectedReport.schoolName.replace(/\s+/g, '-')}-${formatDateShort(selectedReport.visitDate)}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, windowWidth: 1000 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().set(opt).from(element).save().then(() => {
        setGeneratingSingle(false);
      });
    }, 800); // give it time to render and load images
  };

  const handleDownloadSummaryPDF = () => {
    setGeneratingSummary(true);

    setTimeout(() => {
      const element = document.getElementById("summary-printable-overlay-content");
      if (!element) {
         setGeneratingSummary(false);
         return;
      }

      const opt = {
        margin:       0.4,
        filename:     `Summary_Report_${filters.school.length === 1 ? filters.school[0].replace(/\s+/g, '_') : filters.school.length > 1 ? 'Selected_Schools' : 'All_Schools'}_${new Date().getTime()}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, windowWidth: 1200 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        setGeneratingSummary(false);
      });
    }, 800); // give it time to render
  };

  const handleDownloadImagesPDF = () => {
    setGeneratingImages(true);

    setTimeout(() => {
      const element = document.getElementById("images-printable-overlay-content");
      if (!element) {
         setGeneratingImages(false);
         return;
      }

      const opt = {
        margin:       0.4,
        filename:     `Photos_${filters.school.length === 1 ? filters.school[0].replace(/\s+/g, '_') : filters.school.length > 1 ? 'Selected_Schools' : 'All_Schools'}_${new Date().getTime()}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, windowWidth: 1000 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        setGeneratingImages(false);
      });
    }, 1000); // slightly longer to ensure all images load
  };

  const selectClasses = "w-full bg-[#151521] border border-white/5 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-blue-500 transition font-semibold";
  const optionClasses = "bg-[#0b1020] text-white";

  return (
    <div className="space-y-6 p-4 md:p-10 max-w-7xl mx-auto relative">
      
      {/* FULL-SCREEN OVERLAYS FOR ROBUST PDF CAPTURE */}
      {generatingSummary && (
        <div className="fixed inset-0 z-[99999] bg-white overflow-y-auto">
          {/* Loading Indicator */}
          <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow-xl animate-pulse flex items-center gap-2">
            <Download className="w-5 h-5" /> Generating PDF...
          </div>
          <div className="p-8 text-black w-[1200px] mx-auto bg-white" id="summary-printable-overlay-content">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black uppercase tracking-widest border-b-4 border-black pb-2 inline-block">Educator Summary Report</h1>
              <p className="text-gray-600 font-bold mt-2">
                Generated on {new Date().toLocaleDateString()}
              </p>
            </div>

            {Object.keys(groupedReports).length === 0 ? (
               <p className="text-center text-lg font-bold">No reports found.</p>
            ) : (
              Object.keys(groupedReports).map(school => (
                <div key={school} className="mb-10" style={{ pageBreakInside: 'avoid' }}>
                  <h2 className="text-2xl font-bold bg-gray-200 p-3 border border-black border-b-0 uppercase">{school}</h2>
                  <table className="w-full border-collapse border border-black text-sm">
                    <thead className="bg-gray-100 text-left">
                      <tr>
                        <th className="border border-black p-3 w-[10%]">Month</th>
                        <th className="border border-black p-3 w-[10%]">Date</th>
                        <th className="border border-black p-3 w-[30%]">Topic Covered</th>
                        <th className="border border-black p-3 w-[15%]">Students Reached</th>
                        <th className="border border-black p-3 w-[35%]">Project Built</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedReports[school].map(report => {
                        const dateObj = new Date(report.visitDate);
                        const month = isNaN(dateObj.getTime()) ? "N/A" : dateObj.toLocaleString('en-US', { month: 'short' });
                        const dateStr = isNaN(dateObj.getTime()) ? "N/A" : `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;
                        return (
                          <tr key={report._id}>
                            <td className="border border-black p-3 font-semibold text-center">{month}</td>
                            <td className="border border-black p-3 font-semibold text-center">{dateStr}</td>
                            <td className="border border-black p-3 whitespace-pre-wrap">{report.topicsTaught}</td>
                            <td className="border border-black p-3 font-bold text-center">{report.studentCount}</td>
                            <td className="border border-black p-3 whitespace-pre-wrap">{report.projectBuilt}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {generatingImages && (
        <div className="fixed inset-0 z-[99999] bg-white overflow-y-auto">
          {/* Loading Indicator */}
          <div className="fixed top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg font-bold shadow-xl animate-pulse flex items-center gap-2">
            <ImageIcon className="w-5 h-5" /> Generating Photos PDF...
          </div>
          <div className="p-8 text-black w-[1000px] mx-auto bg-white" id="images-printable-overlay-content">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black uppercase tracking-widest border-b-4 border-black pb-2 inline-block">
                {filters.school.length === 1 ? `Photos: ${filters.school[0]}` : filters.school.length > 1 ? `Photos: Selected Schools` : filters.educator.length === 1 ? `Photos: ${filters.educator[0]}` : "Educator Visit Photos"}
              </h1>
              <p className="text-gray-600 font-bold mt-2">
                Generated on {new Date().toLocaleDateString()}
              </p>
            </div>

            {(() => {
              const allImagesByDateAndClass = {};
              filteredReports.forEach(report => {
                if (!report.images || report.images.length === 0) return;
                const dateObj = new Date(report.visitDate);
                const dateStr = isNaN(dateObj.getTime()) ? "N/A" : `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;
                
                if (!allImagesByDateAndClass[dateStr]) allImagesByDateAndClass[dateStr] = {};
                
                const cTaught = report.classesTaught || "Unknown Class";
                if (!allImagesByDateAndClass[dateStr][cTaught]) allImagesByDateAndClass[dateStr][cTaught] = [];

                report.images.forEach(imgUrl => {
                  allImagesByDateAndClass[dateStr][cTaught].push({ 
                    url: imgUrl, 
                    school: report.schoolName || "Unknown School", 
                    educator: report.educator?.fullName || "Unknown Educator" 
                  });
                });
              });

              const dateKeys = Object.keys(allImagesByDateAndClass).sort((a, b) => {
                const [d1, m1, y1] = a.split('-');
                const [d2, m2, y2] = b.split('-');
                return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
              });

              if (dateKeys.length === 0) {
                return <p className="text-center text-lg font-bold">No photos found.</p>;
              }

              return dateKeys.map(dateStr => (
                <div key={dateStr} className="mb-12" style={{ pageBreakInside: 'avoid' }}>
                  <h2 className="text-2xl font-bold bg-gray-200 p-3 border border-black uppercase mb-6">Date: {dateStr}</h2>
                  {Object.keys(allImagesByDateAndClass[dateStr]).map(className => (
                     <div key={className} className="mb-6 border-l-4 border-gray-400 pl-4 ml-2">
                        <h3 className="text-xl font-bold text-gray-700 mb-4 underline decoration-gray-400 underline-offset-4">Class: {className}</h3>
                        <div className="grid grid-cols-2 gap-6">
                          {allImagesByDateAndClass[dateStr][className].map((imgObj, i) => (
                            <div key={i} className="border border-gray-300 p-2 break-inside-avoid text-center bg-white shadow-sm rounded-lg">
                              <img 
                                src={`${BACKEND_URL}${imgObj.url}`} 
                                crossOrigin="anonymous"
                                alt={`Visit Photo ${i + 1}`} 
                                className="w-full aspect-[4/3] object-cover bg-gray-50 mx-auto border-b border-gray-200 rounded-t-lg"
                                onError={(e) => { 
                                  if (!e.target.src.includes('steambuddies.onrender.com')) {
                                    e.target.src = `https://steambuddies.onrender.com${imgObj.url}`;
                                  } else {
                                    e.target.style.display = 'none'; 
                                  }
                                }}
                              />
                              <p className="py-2 text-sm font-bold text-gray-700">{imgObj.school}</p>
                            </div>
                          ))}
                        </div>
                     </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {generatingSingle && selectedReport && (
        <div className="fixed inset-0 z-[99999] bg-white overflow-y-auto">
          {/* Loading Indicator */}
          <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow-xl animate-pulse flex items-center gap-2">
            <Download className="w-5 h-5" /> Generating PDF...
          </div>
          <div className="p-8 text-black w-[1000px] mx-auto bg-white" id="report-printable-overlay-content">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 inline-block">Educator Visit Report</h1>
            </div>

            <table className="w-full border-collapse border border-black mb-6 text-sm">
              <tbody>
                <tr>
                  <td className="border border-black p-3 font-bold bg-gray-100 w-1/3">School Name</td>
                  <td className="border border-black p-3 font-semibold text-lg">{selectedReport.schoolName}</td>
                </tr>
                <tr>
                  <td className="border border-black p-3 font-bold bg-gray-100">Educator Name</td>
                  <td className="border border-black p-3">{selectedReport.educator?.fullName || "Unknown"}</td>
                </tr>
                <tr>
                  <td className="border border-black p-3 font-bold bg-gray-100">Visit Date</td>
                  <td className="border border-black p-3">{formatDateLong(selectedReport.visitDate)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-3 font-bold bg-gray-100">Students Reached</td>
                  <td className="border border-black p-3">{selectedReport.studentCount}</td>
                </tr>
                <tr>
                  <td className="border border-black p-3 font-bold bg-gray-100">Classes Taught</td>
                  <td className="border border-black p-3">{selectedReport.classesTaught}</td>
                </tr>
                <tr>
                  <td className="border border-black p-3 font-bold bg-gray-100">Topic Taught</td>
                  <td className="border border-black p-3 whitespace-pre-wrap">{selectedReport.topicsTaught}</td>
                </tr>
                <tr>
                  <td className="border border-black p-3 font-bold bg-gray-100">Project Built</td>
                  <td className="border border-black p-3 whitespace-pre-wrap">{selectedReport.projectBuilt}</td>
                </tr>
              </tbody>
            </table>

            {/* Images Block */}
            <div className="break-inside-avoid border border-black p-3">
               <h4 className="font-bold bg-gray-100 p-2 border-b border-black mb-3">Visit Photos</h4>
               <div className="flex flex-wrap gap-4 justify-center">
                 {selectedReport.images?.length > 0 ? (
                   selectedReport.images.map((imgUrl, i) => (
                     <img 
                       key={i}
                       src={`${BACKEND_URL}${imgUrl}`} 
                       crossOrigin="anonymous"
                       alt={`Visit ${i + 1}`} 
                       className="h-48 object-contain border border-gray-300 shadow-sm"
                       onError={(e) => { 
                         if (!e.target.src.includes('steambuddies.onrender.com')) {
                           e.target.src = `https://steambuddies.onrender.com${imgUrl}`;
                         } else {
                           e.target.style.display = 'none'; 
                         }
                       }}
                     />
                   ))
                 ) : (
                   <p className="text-gray-500 italic p-4">No photos uploaded.</p>
                 )}
               </div>
            </div>

            <div className="mt-8 text-center text-xs text-gray-500 border-t border-gray-300 pt-2">
              Generated securely from SteamBuddies Educator Studio
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            Educator Daily Reports
          </h1>
          <p className="text-gray-400 mt-1">Review, filter, and download school visit reports.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleDownloadImagesPDF}
            disabled={filteredReports.length === 0 || filteredReports.every(r => !r.images || r.images.length === 0)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-semibold transition flex items-center gap-2"
          >
            <ImageIcon className="w-5 h-5" /> Export Photos
          </button>
          <button 
            onClick={handleDownloadSummaryPDF}
            disabled={filteredReports.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold transition flex items-center gap-2"
          >
            <Download className="w-5 h-5" /> Export Summary PDF
          </button>
          <button 
            onClick={fetchReports}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition flex items-center gap-2"
          >
            {loading ? "Refreshing..." : "Refresh Reports"}
          </button>
        </div>
      </div>

      {/* Search & Advanced Filters */}
      <div className="bg-[#1e1e2d] p-4 rounded-xl border border-white/10 space-y-4">
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

        {/* Dropdowns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MultiSelectDropdown 
            label="Schools" 
            options={uniqueSchools} 
            selectedValues={filters.school} 
            onChange={v => setFilters({...filters, school: v})} 
          />

          <MultiSelectDropdown 
            label="Educators" 
            options={uniqueEducators} 
            selectedValues={filters.educator} 
            onChange={v => setFilters({...filters, educator: v})} 
          />

          <MultiSelectDropdown 
            label="Classes" 
            options={uniqueClasses} 
            selectedValues={filters.className} 
            onChange={v => setFilters({...filters, className: v})} 
          />

          <select 
            value={filters.month} 
            onChange={e => setFilters({...filters, month: e.target.value})}
            className={selectClasses}
          >
            <option value="" className={optionClasses}>All Months</option>
            {monthsList.map(m => <option key={m.value} value={m.value} className={optionClasses}>{m.label}</option>)}
          </select>

          <select 
            value={filters.year} 
            onChange={e => setFilters({...filters, year: e.target.value})}
            className={selectClasses}
          >
            <option value="" className={optionClasses}>All Years</option>
            {uniqueYears.map(y => <option key={y} value={y} className={optionClasses}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Grid of Reports */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading reports...</div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-10 text-gray-400 bg-[#1e1e2d] rounded-xl border border-white/10">
          No reports found matching the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <div key={report._id} className="bg-[#1e1e2d] border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/50 transition duration-300">
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="overflow-hidden pr-2">
                    <h3 className="font-bold text-lg text-white truncate" title={report.schoolName}>{report.schoolName}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-1">
                      <User className="w-4 h-4" />
                      <span className="truncate">{report.educator?.fullName || "Unknown Educator"}</span>
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

      {/* Modal for viewing full single report */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e1e2d] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#151521]">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> Report Details
              </h2>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleDownloadSinglePDF}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="p-1.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Display Body for UI (Non-printable) */}
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
                      <span className="text-white font-bold">{selectedReport.educator?.fullName || "Unknown"}</span>
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
                    <p className="text-gray-200 bg-[#151521] p-4 rounded-xl border border-white/5 whitespace-pre-wrap">
                      {selectedReport.topicsTaught}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                      <Pickaxe className="w-4 h-4" /> Project Built
                    </h4>
                    <p className="text-gray-200 bg-[#151521] p-4 rounded-xl border border-white/5 whitespace-pre-wrap">
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
                    {selectedReport.images?.length > 0 ? (
                      selectedReport.images.map((imgUrl, i) => (
                        <div key={i} className="rounded-xl overflow-hidden border border-white/10 bg-[#151521]">
                          <img 
                            src={`${BACKEND_URL}${imgUrl}`} 
                            alt={`Visit ${i + 1}`} 
                            className="w-full h-auto object-contain max-h-64"
                            onError={(e) => { 
                              if (!e.target.src.includes('steambuddies.onrender.com')) {
                                e.target.src = `https://steambuddies.onrender.com${imgUrl}`;
                              } else {
                                e.target.style.display = 'none'; 
                              }
                            }}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-gray-400 text-center">
                        No photos uploaded for this visit.
                      </div>
                    )}
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

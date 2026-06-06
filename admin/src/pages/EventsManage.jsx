import React, { useEffect, useState } from "react";
import { Search, Trash2, Edit, Plus, Loader2, Calendar } from "lucide-react";
import { getEvents, createEvent, updateEvent, deleteEvent } from "../api/events.api";

const THEME_COLORS = [
  { value: "indigo", label: "Indigo" },
  { value: "cyan", label: "Cyan" },
  { value: "rose", label: "Rose" },
  { value: "emerald", label: "Emerald" },
  { value: "amber", label: "Amber" },
];

export default function EventsManage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    titleEn: "",
    titleHi: "",
    typeEn: "",
    typeHi: "",
    dateStr: "",
    themeColor: "indigo",
    isActive: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await getEvents();
      if (res.data?.ok) {
        setEvents(res.data.events);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (event = null) => {
    if (event) {
      setEditingId(event._id);
      setFormData({
        titleEn: event.title?.en || "",
        titleHi: event.title?.hi || "",
        typeEn: event.type?.en || "",
        typeHi: event.type?.hi || "",
        dateStr: event.dateStr || "",
        themeColor: event.themeColor || "indigo",
        isActive: event.isActive
      });
    } else {
      setEditingId(null);
      setFormData({
        titleEn: "",
        titleHi: "",
        typeEn: "",
        typeHi: "",
        dateStr: "",
        themeColor: "indigo",
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: { en: formData.titleEn, hi: formData.titleHi },
        type: { en: formData.typeEn, hi: formData.typeHi },
        dateStr: formData.dateStr,
        themeColor: formData.themeColor,
        isActive: formData.isActive
      };

      if (editingId) {
        await updateEvent(editingId, payload);
      } else {
        await createEvent(payload);
      }
      await fetchEvents();
      setIsModalOpen(false);
    } catch (error) {
      alert("Error saving event");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteEvent(id);
      setEvents(events.filter((e) => e._id !== id));
    } catch (error) {
      alert("Error deleting event");
    }
  };

  const filtered = events.filter((e) => 
    e.title?.en.toLowerCase().includes(search.toLowerCase()) ||
    e.title?.hi.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Events & Quizzes
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage upcoming events displayed on the Student Dashboard.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <tr>
                  <th className="px-6 py-4 font-medium">Event Title (EN)</th>
                  <th className="px-6 py-4 font-medium">Event Title (HI)</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Theme</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((evt) => (
                  <tr key={evt._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{evt.title?.en}</td>
                    <td className="px-6 py-4 text-gray-500">{evt.title?.hi || "-"}</td>
                    <td className="px-6 py-4 text-gray-500">{evt.type?.en}</td>
                    <td className="px-6 py-4 font-semibold text-gray-700">{evt.dateStr}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize
                        ${evt.themeColor === 'indigo' ? 'bg-indigo-100 text-indigo-700' : ''}
                        ${evt.themeColor === 'cyan' ? 'bg-cyan-100 text-cyan-700' : ''}
                        ${evt.themeColor === 'rose' ? 'bg-rose-100 text-rose-700' : ''}
                        ${evt.themeColor === 'emerald' ? 'bg-emerald-100 text-emerald-700' : ''}
                        ${evt.themeColor === 'amber' ? 'bg-amber-100 text-amber-700' : ''}
                      `}>
                        {evt.themeColor}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${evt.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {evt.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenModal(evt)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition ml-2"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(evt._id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition ml-2"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No events found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? "Edit Event" : "Create Event"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Title (English) *</label>
                  <input
                    required
                    type="text"
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Science Fair"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Title (Hindi)</label>
                  <input
                    type="text"
                    value={formData.titleHi}
                    onChange={(e) => setFormData({ ...formData, titleHi: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. विज्ञान मेला"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Type (English) *</label>
                  <input
                    required
                    type="text"
                    value={formData.typeEn}
                    onChange={(e) => setFormData({ ...formData, typeEn: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Online, Offline"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Type (Hindi)</label>
                  <input
                    type="text"
                    value={formData.typeHi}
                    onChange={(e) => setFormData({ ...formData, typeHi: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. ऑनलाइन"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date String *</label>
                  <input
                    required
                    type="text"
                    value={formData.dateStr}
                    onChange={(e) => setFormData({ ...formData, dateStr: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 25 Dec"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Theme Color *</label>
                  <select
                    value={formData.themeColor}
                    onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {THEME_COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">Event is Active & Visible</label>
              </div>

            </form>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center min-w-[100px] hover:bg-blue-700"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

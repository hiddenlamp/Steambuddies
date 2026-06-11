import React, { useEffect, useState } from "react";
import { Search, Trash2, Loader2, Presentation, Plus, X, Check, Edit2, Wand2, Copy } from "lucide-react";
import { getAdminUsers, deleteAdminUser, createEducator, updateEducator } from "../api/admin.api";
import api from "../api/auth.api";

export default function EducatorManage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [fullName, setFullName] = useState("");
  const [educatorId, setEducatorId] = useState("");
  const [password, setPassword] = useState("");
  const [assignedSchools, setAssignedSchools] = useState([]);
  
  // Schools List
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    fetchEducators();
    fetchSchools();
  }, [page]);

  const fetchSchools = async () => {
    try {
      const res = await api.get("/schools");
      setSchools(res.data.data || []);
    } catch(err) {
      console.error("Failed to fetch schools", err);
    }
  };

  const fetchEducators = async (query = search) => {
    try {
      setLoading(true);
      const res = await getAdminUsers({ role: "educator", page, limit: 10, search: query });
      setUsers(res.data.data);
      setTotalPages(res.data.meta.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEducators(search);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this educator account?")) return;
    try {
      await deleteAdminUser(id);
      fetchEducators();
    } catch (err) {
      alert("Failed to delete user: " + (err.response?.data?.message || err.message));
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFullName("");
    setEducatorId("");
    setPassword("");
    setAssignedSchools([]);
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setIsEditing(true);
    setCurrentId(user._id);
    setFullName(user.fullName);
    setEducatorId(user.educatorId || "");
    setPassword(""); // Empty password means don't change it
    setAssignedSchools(user.assignedSchools || []);
    setShowModal(true);
  };

  const toggleSchool = (schoolName) => {
    setAssignedSchools(prev => 
      prev.includes(schoolName) 
        ? prev.filter(s => s !== schoolName)
        : [...prev, schoolName]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isEditing && !password) {
       alert("Password is required for new educators");
       return;
    }
    setSaving(true);
    try {
      const payload = {
        fullName,
        educatorId,
        password,
        assignedSchools
      };
      
      if (isEditing) {
        await updateEducator(currentId, payload);
        alert("Educator updated successfully");
      } else {
        await createEducator(payload);
        alert("Educator created successfully");
      }
      setShowModal(false);
      fetchEducators();
    } catch (err) {
       alert("Failed to save educator: " + (err.response?.data?.message || err.message));
    } finally {
       setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            <Presentation className="h-8 w-8 text-indigo-400" />
            Manage Educators
          </h1>
          <p className="text-white/60 font-semibold">View, create and manage educator accounts and their school assignments.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              type="text"
              placeholder="Search educators..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/5 transition text-white"
            />
          </form>
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-2xl transition"
          >
            <Plus className="h-5 w-5" />
            New Educator
          </button>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-white/[0.05] border-b border-white/10 text-white/50 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Educator ID</th>
                <th className="px-6 py-4">Assigned Schools</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white/50 mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center font-semibold text-white/50">
                    No educators found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-white/[0.02] transition">
                    <td className="px-6 py-4 font-semibold">
                      {user.fullName}
                      <div className="text-xs text-white/50 font-normal">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-white/70">
                      {user.educatorId ? (
                        <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-md text-xs font-bold font-mono">
                          {user.educatorId}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.assignedSchools && user.assignedSchools.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {user.assignedSchools.map(sch => (
                            <span key={sch} className="bg-white/10 text-white/80 text-[10px] px-2 py-1 rounded-full whitespace-nowrap">
                              {sch}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/40 italic text-xs">No schools assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl transition"
                          title="Edit User"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex justify-between items-center bg-black/20">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 rounded-xl text-sm font-semibold transition"
            >
              Previous
            </button>
            <span className="text-sm font-semibold text-white/50">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 rounded-xl text-sm font-semibold transition"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-2xl font-black text-white mb-6">
              {isEditing ? "Edit Educator" : "New Educator"}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/70 mb-1">Educator ID</label>
                <div className="flex gap-2">
                  <input
                    required
                    type="text"
                    value={educatorId}
                    disabled={isEditing}
                    onChange={(e) => setEducatorId(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    placeholder="E.g., HL123456"
                  />
                  {!isEditing && (
                    <>
                      <button
                        type="button"
                        onClick={() => setEducatorId(`HL${Math.floor(100000 + Math.random() * 900000)}`)}
                        className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition flex items-center justify-center text-white"
                        title="Generate Random ID"
                      >
                        <Wand2 className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if(educatorId) {
                            navigator.clipboard.writeText(educatorId);
                            alert("Educator ID copied to clipboard!");
                          }
                        }}
                        className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition flex items-center justify-center text-white"
                        title="Copy ID"
                      >
                        <Copy className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
                {!isEditing && (
                  <p className="text-[10px] text-white/40 mt-1">This will also create the email {educatorId || "ID"}@steambuddies.com</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/70 mb-1">
                  Password {isEditing && <span className="text-xs font-normal text-white/40">(Leave blank to keep unchanged)</span>}
                </label>
                <input
                  required={!isEditing}
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  placeholder={isEditing ? "Enter new password..." : "Set a password"}
                />
              </div>

              <div className="pt-2">
                <label className="block text-sm font-semibold text-white/70 mb-2">Assign Schools</label>
                <div className="bg-white/5 border border-white/10 rounded-xl max-h-48 overflow-y-auto p-2 space-y-1">
                  {schools.length === 0 ? (
                    <p className="text-xs text-white/40 p-2 italic">No schools available in database.</p>
                  ) : (
                    schools.map(sch => (
                      <label 
                        key={sch._id} 
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                          assignedSchools.includes(sch.name) ? 'bg-indigo-500/20' : 'hover:bg-white/5'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={assignedSchools.includes(sch.name)} 
                          onChange={() => toggleSchool(sch.name)} 
                        />
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                          assignedSchools.includes(sch.name) 
                            ? "bg-indigo-500 border-indigo-500" 
                            : "border-white/20"
                        }`}>
                          {assignedSchools.includes(sch.name) && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className={`text-sm ${assignedSchools.includes(sch.name) ? "text-indigo-200 font-semibold" : "text-white/70"}`}>
                          {sch.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-xl mt-4 transition flex items-center justify-center"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (isEditing ? "Save Changes" : "Create Educator")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

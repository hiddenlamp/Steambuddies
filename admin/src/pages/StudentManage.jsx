import React, { useEffect, useState } from "react";
import { Search, Trash2, Loader2, GraduationCap } from "lucide-react";
import { getAdminUsers, deleteAdminUser } from "../api/admin.api";

export default function StudentManage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchStudents();
  }, [page]);

  const fetchStudents = async (query = search) => {
    try {
      setLoading(true);
      const res = await getAdminUsers({ role: "student", page, limit: 10, search: query });
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
    fetchStudents(search);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student account?")) return;
    try {
      await deleteAdminUser(id);
      fetchStudents();
    } catch (err) {
      alert("Failed to delete user: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-blue-400" />
            Manage Students
          </h1>
          <p className="text-white/60 font-semibold">View and manage all registered student accounts.</p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
          <input
            type="text"
            placeholder="Search by name, email, school..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/5 transition text-white"
          />
        </form>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-white/[0.05] border-b border-white/10 text-white/50 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">School</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white/50 mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center font-semibold text-white/50">
                    No students found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-white/[0.02] transition">
                    <td className="px-6 py-4 font-semibold">{user.fullName}</td>
                    <td className="px-6 py-4 text-white/70">{user.email}</td>
                    <td className="px-6 py-4 text-white/70">{user.school || "-"}</td>
                    <td className="px-6 py-4 text-white/70">{user.classLevel || "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
    </div>
  );
}

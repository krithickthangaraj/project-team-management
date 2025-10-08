import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/common/Card";
import api from "../../api/axios";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, query]);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/users/");
      setUsers(res.data);
    } catch (e) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (userId, role) => {
    try {
      await api.patch(`/users/${userId}/role`, { role });
      await fetchUsers();
    } catch (e) {
      setError("Failed to update role");
    }
  };

  const toggleActive = async (userId, isActive) => {
    try {
      await api.patch(`/users/${userId}/status`, { is_active: isActive });
      await fetchUsers();
    } catch (e) {
      setError("Failed to update status");
    }
  };

  return (
    <DashboardLayout title="Admin • Users">
      <div className="mb-4">
        <button
          onClick={() => navigate("/admin/dashboard")}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          ← Back to Dashboard
        </button>
      </div>
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users by name or email"
              className="w-full md:w-80 rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={fetchUsers}
              className="rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-900"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                      <td className="px-4 py-3 text-gray-700">{u.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e) => updateRole(u.id, e.target.value)}
                          className="rounded-lg border border-gray-300 px-2 py-1 hover:border-gray-400"
                          disabled={u.role === "admin"}
                          title={u.role === "admin" ? "Cannot change role of the only admin" : "Change role"}
                        >
                          {/* admin option removed to prevent adding another admin */}
                          <option value="owner">owner</option>
                          <option value="member">member</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={u.is_active ? "text-green-600" : "text-gray-400"}>
                          {u.is_active ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_active ? (
                          <button
                            onClick={() => toggleActive(u.id, false)}
                            className="rounded-xl border border-gray-300 px-3 py-1 hover:bg-gray-50 hover:border-gray-400"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleActive(u.id, true)}
                            className="rounded-xl bg-black px-3 py-1 text-white hover:bg-gray-900"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
}



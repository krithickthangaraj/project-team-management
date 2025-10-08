import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/common/Card";
import api from "../../api/axios";

export default function AdminProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [createForm, setCreateForm] = useState({ name: "", description: "", owner_id: 0 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, query]);

  const fetchProjects = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/projects");
      setProjects(res.data);
    } catch (e) {
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchProjects();
      try {
        const ur = await api.get("/users/");
        setOwners((ur.data || []).filter((u) => u.role === "owner"));
      } catch {}
    };
    load();
  }, []);

  const updateProject = async (id, payload) => {
    try {
      await api.put(`/projects/${id}`, payload);
      await fetchProjects();
    } catch (e) {
      setError("Failed to update project");
    }
  };

  const deleteProject = async (id) => {
    if (!confirm("Delete this project? This will remove related tasks and teams.")) return;
    try {
      await api.delete(`/projects/${id}`);
      await fetchProjects();
    } catch (e) {
      setError("Failed to delete project");
    }
  };

  return (
    <DashboardLayout title="Admin • Projects">
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
          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="text-md font-semibold text-gray-900">Create Project</h3>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Project name"
                className="rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Description (optional)"
                className="rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <select
                value={createForm.owner_id || (owners[0]?.id || 0)}
                onChange={(e) => setCreateForm({ ...createForm, owner_id: Number(e.target.value) })}
                className="rounded-xl border border-gray-300 px-3 py-2"
              >
                <option value={0} disabled>Select owner</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>{o.name} ({o.email})</option>
                ))}
              </select>
              <button
                onClick={async () => {
                  try {
                    if (!createForm.name || !createForm.owner_id) return;
                    await api.post("/projects/", {
                      name: createForm.name,
                      description: createForm.description || null,
                      owner_id: createForm.owner_id,
                    });
                    setCreateForm({ name: "", description: "", owner_id: 0 });
                    await fetchProjects();
                  } catch (e) {
                    setError("Failed to create project");
                  }
                }}
                className="rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-900"
              >
                Create
              </button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects by name"
              className="w-full md:w-80 rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={fetchProjects}
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
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-6 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-6 text-center text-gray-500">No projects found</td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 text-gray-700">{p.description || "-"}</td>
                      <td className="px-4 py-3">
                        <select
                          value={p.status}
                          onChange={(e) => updateProject(p.id, { status: e.target.value })}
                          className="rounded-lg border border-gray-300 px-2 py-1"
                        >
                          <option value="active">active</option>
                          <option value="inactive">inactive</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={p.owner_id}
                          onChange={(e) => updateProject(p.id, { owner_id: Number(e.target.value) })}
                          className="rounded-lg border border-gray-300 px-2 py-1 hover:border-gray-400"
                        >
                          {owners.length === 0 && (
                            <option value={p.owner_id}>No owners available</option>
                          )}
                          {owners.map((o) => (
                            <option key={o.id} value={o.id}>{o.name} ({o.email})</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          onClick={() => updateProject(p.id, { name: prompt("New name", p.name) || p.name })}
                          className="rounded-xl border border-gray-300 px-3 py-1 hover:bg-gray-50"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => deleteProject(p.id)}
                          className="rounded-xl bg-red-500 px-3 py-1 text-white hover:bg-red-600"
                        >
                          Delete
                        </button>
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



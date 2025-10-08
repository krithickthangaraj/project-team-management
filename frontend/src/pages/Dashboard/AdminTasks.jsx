import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/common/Card";
import api from "../../api/axios";

export default function AdminTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createForm, setCreateForm] = useState({ title: "", description: "", project_id: 0, assigned_to_id: 0, status: "in_progress" });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      const okQ = !q || t.title.toLowerCase().includes(q);
      const okS = !statusFilter || t.status === statusFilter;
      return okQ && okS;
    });
  }, [tasks, query, statusFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/tasks");
      setTasks(res.data);
    } catch (e) {
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchTasks();
      try {
        const pr = await api.get("/projects");
        setProjects(pr.data || []);
      } catch {}
      try {
        const ur = await api.get("/users/");
        setMembers(ur.data || []);
      } catch {}
      try {
        const tr = await api.get("/teams");
        setTeams(tr.data || []);
      } catch {}
    };
    load();
  }, []);

  // Compute eligible members for the selected project (members of teams under that project)
  const eligibleMembers = React.useMemo(() => {
    if (!createForm.project_id) return [];
    const projectTeams = teams.filter((t) => t.project_id === createForm.project_id);
    const memberIdSet = new Set(projectTeams.flatMap((t) => t.member_ids || []));
    return members.filter((m) => memberIdSet.has(m.id));
  }, [teams, members, createForm.project_id]);

  // If selected assignee is not in eligible members after project change, reset to Unassigned
  useEffect(() => {
    if (
      createForm.assigned_to_id &&
      !eligibleMembers.some((m) => m.id === createForm.assigned_to_id)
    ) {
      setCreateForm((f) => ({ ...f, assigned_to_id: 0 }));
    }
  }, [eligibleMembers]);

  const deleteTask = async (id) => {
    if (!confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${id}`);
      await fetchTasks();
    } catch (e) {
      setError("Failed to delete task");
    }
  };

  return (
    <DashboardLayout title="Admin • Tasks">
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
            <h3 className="text-md font-semibold text-gray-900">Create Task</h3>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="Task title"
                className="rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Description (optional)"
                className="rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <select
                value={createForm.project_id || (projects[0]?.id || 0)}
                onChange={(e) => setCreateForm({ ...createForm, project_id: Number(e.target.value) })}
                className="rounded-xl border border-gray-300 px-3 py-2"
              >
                <option value={0} disabled>Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select
                value={createForm.assigned_to_id || 0}
                onChange={(e) => setCreateForm({ ...createForm, assigned_to_id: Number(e.target.value) })}
                className="rounded-xl border border-gray-300 px-3 py-2"
              >
                <option value={0}>Unassigned</option>
                {eligibleMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                ))}
              </select>
              <button
                onClick={async () => {
                  try {
                    if (!createForm.title || !createForm.project_id) return;
                    await api.post("/tasks", {
                      title: createForm.title,
                      description: createForm.description || null,
                      project_id: createForm.project_id,
                      assigned_to_id: createForm.assigned_to_id || null,
                      status: createForm.status,
                    });
                    setCreateForm({ title: "", description: "", project_id: 0, assigned_to_id: 0, status: "in_progress" });
                    await fetchTasks();
                  } catch (e) {
                    setError("Failed to create task");
                  }
                }}
                className="rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-900"
              >
                Create
              </button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex gap-3 items-center">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks by title"
                className="w-full md:w-80 rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-2"
              >
                <option value="">All statuses</option>
                <option value="in_progress">in_progress</option>
                <option value="completed">completed</option>
                <option value="incomplete">incomplete</option>
              </select>
            </div>
            <button
              onClick={fetchTasks}
              className="rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-900"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Project Id</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Status</th>
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
                    <td colSpan="5" className="px-4 py-6 text-center text-gray-500">No tasks found</td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{t.title}</td>
                      <td className="px-4 py-3 text-gray-700">{t.project_id}</td>
                      <td className="px-4 py-3 text-gray-700">{t.assigned_to_id || "-"}</td>
                      <td className="px-4 py-3 text-gray-700">{t.status}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteTask(t.id)}
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



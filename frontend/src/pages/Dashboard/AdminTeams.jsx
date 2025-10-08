import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/common/Card";
import api from "../../api/axios";

export default function AdminTeams() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [createForm, setCreateForm] = useState({ name: "", project_id: 0, owner_id: 0, member_ids: [] });
  const [viewTeam, setViewTeam] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => t.name.toLowerCase().includes(q));
  }, [teams, query]);

  const fetchTeams = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/teams");
      setTeams(res.data);
    } catch (e) {
      setError("Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchTeams();
      try {
        const pr = await api.get("/projects");
        setProjects(pr.data || []);
      } catch {}
      try {
        const ur = await api.get("/users/");
        setMembers(ur.data || []);
      } catch {}
    };
    load();
  }, []);

  const addMember = async (teamId) => {
    const userId = Number(prompt("User ID to add:"));
    if (!userId) return;
    try {
      await api.post("/teams/add_member", { team_id: teamId, user_id: userId });
      await fetchTeams();
    } catch (e) {
      setError("Failed to add member");
    }
  };

  const removeMember = async (teamId) => {
    const userId = Number(prompt("User ID to remove:"));
    if (!userId) return;
    try {
      await api.post("/teams/remove_member", { team_id: teamId, user_id: userId });
      await fetchTeams();
    } catch (e) {
      setError("Failed to remove member");
    }
  };

  return (
    <DashboardLayout title="Admin • Teams">
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
            <h3 className="text-md font-semibold text-gray-900">Create Team</h3>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Team name"
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
                value={createForm.owner_id || 0}
                onChange={(e) => setCreateForm({ ...createForm, owner_id: Number(e.target.value) })}
                className="rounded-xl border border-gray-300 px-3 py-2"
              >
                <option value={0} disabled>Select owner (optional)</option>
                {members.filter((m) => m.role === "owner").map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                ))}
              </select>
              <button
                onClick={async () => {
                  try {
                    if (!createForm.name || !createForm.project_id) return;
                    await api.post("/teams", {
                      name: createForm.name,
                      project_id: createForm.project_id,
                      owner_id: createForm.owner_id || undefined,
                      member_ids: createForm.member_ids,
                    });
                    setCreateForm({ name: "", project_id: 0, owner_id: 0, member_ids: [] });
                    await fetchTeams();
                  } catch (e) {
                    setError("Failed to create team");
                  }
                }}
                className="rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-900"
              >
                Create
              </button>
            </div>
            <div className="mt-3">
              <label className="text-sm text-gray-600">Add initial members:</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {members.filter((m) => m.role !== "admin").map((m) => {
                  const checked = createForm.member_ids.includes(m.id);
                  return (
                    <label key={m.id} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-1 hover:border-gray-300">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = new Set(createForm.member_ids);
                          if (e.target.checked) next.add(m.id); else next.delete(m.id);
                          setCreateForm({ ...createForm, member_ids: Array.from(next) });
                        }}
                      />
                      <span className="text-sm text-gray-700">{m.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search teams by name"
              className="w-full md:w-80 rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={fetchTeams}
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
                  <th className="px-4 py-3">Project Id</th>
                  <th className="px-4 py-3">Owner Id</th>
                  <th className="px-4 py-3">Members</th>
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
                    <td colSpan="5" className="px-4 py-6 text-center text-gray-500">No teams found</td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                      <td className="px-4 py-3 text-gray-700">{t.project_id}</td>
                      <td className="px-4 py-3 text-gray-700">{t.owner_id}</td>
                      <td className="px-4 py-3 text-gray-700">
                        <div className="flex items-center gap-2">
                          <span>{(t.member_ids || []).length}</span>
                          <button
                            onClick={() => setViewTeam(t)}
                            className="text-sm rounded-lg border border-gray-300 px-2 py-1 hover:bg-gray-50"
                          >
                            View Members
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => addMember(t.id)} className="rounded-xl border border-gray-300 px-3 py-1 hover:bg-gray-50">Add Member</button>
                        <button onClick={() => removeMember(t.id)} className="rounded-xl border border-gray-300 px-3 py-1 hover:bg-gray-50">Remove Member</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {viewTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
              <h4 className="text-lg font-semibold text-gray-900">Team Members • {viewTeam.name}</h4>
              <button onClick={() => setViewTeam(null)} className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">Close</button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-5">
              {(viewTeam.member_ids || []).length === 0 ? (
                <p className="text-sm text-gray-600">No members in this team.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {(viewTeam.member_ids || []).map((id) => {
                    const m = members.find((u) => u.id === id);
                    return (
                      <li key={id} className="py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{m?.name || `User #${id}`}</p>
                            <p className="text-sm text-gray-600">{m?.email || "—"}</p>
                          </div>
                          <span className="text-xs rounded-full border border-gray-200 px-2 py-0.5 text-gray-600">{m?.role || "member"}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="flex justify-end border-t border-gray-200 px-5 py-3">
              <button onClick={() => setViewTeam(null)} className="rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-900">Done</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}



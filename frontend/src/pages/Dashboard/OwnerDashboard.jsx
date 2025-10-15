import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/common/Card";
import api from "../../api/axios";

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({ projects: 0, tasks: 0, teams: 0, members: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activity, setActivity] = useState([]);
  const [projects, setProjects] = useState([]);
  const socketsRef = useRef({});

  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch owner's projects
        const projectsRes = await api.get("/projects");
        setProjects(projectsRes.data);
        
        // Fetch all tasks from owner's projects in parallel
        const allTasks = [];
        if (projectsRes.data.length > 0) {
          try {
            const taskPromises = projectsRes.data.map(project => 
              api.get(`/tasks/project/${project.id}`).catch(e => {
                console.error(`Failed to fetch tasks for project ${project.id}:`, e);
                return { data: [] };
              })
            );
            const taskResults = await Promise.all(taskPromises);
            allTasks.push(...taskResults.flatMap(result => result.data));
          } catch (e) {
            console.error("Failed to fetch tasks:", e);
          }
        }
        
        // Fetch teams
        const teamsRes = await api.get("/teams");
        const ownerTeams = teamsRes.data.filter(team => 
          projectsRes.data.some(project => project.id === team.project_id)
        );
        
        // Calculate metrics
        const completedTasks = allTasks.filter(t => t.status === 'completed').length;
        const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
        const incompleteTasks = allTasks.filter(t => t.status === 'incomplete').length;
        
        if (isMounted) {
          setMetrics({
            projects: projectsRes.data.length,
            tasks: allTasks.length,
            teams: ownerTeams.length,
            members: ownerTeams.reduce((acc, team) => acc + team.member_ids.length, 0)
          });
        }
      } catch (e) {
        if (isMounted) setError("Failed to load metrics");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMetrics();
    return () => {
      isMounted = false;
    };
  }, []);

  // Subscribe to websocket updates for recent activity across projects
  useEffect(() => {
    let cancelled = false;

    const ensureSockets = async () => {
      try {
        const res = await api.get("/projects");
        const projs = res.data || [];
        for (const p of projs) {
          if (cancelled) return;
          if (!socketsRef.current[p.id] || socketsRef.current[p.id].readyState > 1) {
            const base = (import.meta.env.VITE_BACKEND_URL || "http://localhost:8000");
            const wsUrl = base.replace(/^http/, "ws") + `/ws/projects/${p.id}`;
            const ws = new WebSocket(wsUrl);
            ws.onmessage = (evt) => {
              try {
                const msg = JSON.parse(evt.data);
                setActivity((prev) => [{ ts: Date.now(), projectId: p.id, ...msg }, ...prev].slice(0, 10));
              } catch {}
            };
            socketsRef.current[p.id] = ws;
          }
        }
      } catch {}
    };

    // initial
    ensureSockets();
    // periodic refresh to catch newly created projects
    const interval = setInterval(ensureSockets, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      Object.values(socketsRef.current).forEach((ws) => {
        try { ws.close(); } catch {}
      });
      socketsRef.current = {};
    };
  }, []);

  return (
    <DashboardLayout title="Owner Dashboard">
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="My Projects" value={loading ? "-" : String(metrics.projects)} accent="text-purple-600" />
        <StatCard label="Total Tasks" value={loading ? "-" : String(metrics.tasks)} accent="text-purple-600" />
        <StatCard label="Teams" value={loading ? "-" : String(metrics.teams)} accent="text-purple-600" />
        <StatCard label="Members" value={loading ? "-" : String(metrics.members)} accent="text-purple-600" />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={() => navigate("/owner/projects")} className="rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-900">Manage Projects</button>
            <button onClick={() => navigate("/owner/teams")} className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50">Manage Teams</button>
            <button onClick={() => navigate("/owner/tasks")} className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50">View Tasks</button>
            <button onClick={() => navigate("/owner/collaboration")} className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50">Collaboration</button>
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            {activity.length === 0 ? (
              <li className="text-gray-500">No recent activity yet.</li>
            ) : (
              activity.map((a, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <span>
                    [{a.projectId}] {a.event}
                    {a.task_id ? ` • Task #${a.task_id}` : ""}
                    {a.team_id ? ` • Team #${a.team_id}` : ""}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(a.ts).toLocaleTimeString()}</span>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      {/* My Projects Overview */}
      <div className="mt-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Projects</h3>
          <div className="space-y-3">
            {projects.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No projects assigned to you yet.</p>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{project.name}</h4>
                    <p className="text-sm text-gray-600">{project.description || "No description"}</p>
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                      <span className={`px-2 py-1 rounded-full ${
                        project.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {project.status}
                      </span>
                      <span>ID: {project.id}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/owner/projects/${project.id}`)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

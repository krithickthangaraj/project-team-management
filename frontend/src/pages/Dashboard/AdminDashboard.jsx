import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/common/Card";
import api from "../../api/axios";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({ users: 0, projects: 0, teams: 0, tasks: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activity, setActivity] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const socketsRef = useRef({});

  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = async () => {
      setLoading(true);
      setError("");
      try {
        const [metricsRes, projectsRes, tasksRes] = await Promise.all([
          api.get("/admin/metrics"),
          api.get("/projects/"),
          api.get("/tasks/")
        ]);
        
        if (isMounted) {
          setMetrics(metricsRes.data);
          setProjects(projectsRes.data);
          setTasks(tasksRes.data);
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
    <DashboardLayout title="Admin Dashboard">
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Users" value={loading ? "-" : String(metrics.users)} accent="text-purple-600" />
        <StatCard label="Projects" value={loading ? "-" : String(metrics.projects)} accent="text-purple-600" />
        <StatCard label="Teams" value={loading ? "-" : String(metrics.teams)} accent="text-purple-600" />
        <StatCard label="Tasks" value={loading ? "-" : String(metrics.tasks)} accent="text-purple-600" />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={() => navigate("/admin/users")} className="rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-900">Manage Users</button>
            <button onClick={() => navigate("/admin/projects")} className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50">Manage Projects</button>
            <button onClick={() => navigate("/admin/teams")} className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50">Manage Teams</button>
            <button onClick={() => navigate("/admin/tasks")} className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50">View Tasks</button>
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

      {/* Project Progress Overview */}
      <div className="mt-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Progress Overview</h3>
          <div className="space-y-4">
            {projects.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No projects found</p>
            ) : (
              projects.map((project) => {
                const projectTasks = tasks.filter(task => task.project_id === project.id);
                const projectCompleted = projectTasks.filter(task => task.status === 'completed').length;
                const projectTotal = projectTasks.length;
                const progressPercentage = projectTotal > 0 ? Math.round((projectCompleted / projectTotal) * 100) : 0;

                return (
                  <div key={project.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <span className="text-sm text-gray-600">{progressPercentage}% complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{projectCompleted} of {projectTotal} tasks completed</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/common/Card";
import api from "../../api/axios";

export default function OwnerTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", project_id: "", assigned_to_id: "" });

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/projects"),
        api.get("/users/members")
      ]);
      
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
    } catch (e) {
      setError("Failed to load data: " + (e.response?.data?.detail || e.message));
      console.error("Data fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesQuery = task.title.toLowerCase().includes(query.toLowerCase()) ||
                          (task.description && task.description.toLowerCase().includes(query.toLowerCase()));
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesProject = projectFilter === "all" || task.project_id === parseInt(projectFilter);
      
      return matchesQuery && matchesStatus && matchesProject;
    });
  }, [tasks, query, statusFilter, projectFilter]);

  const createTask = async () => {
    if (!newTask.title.trim() || !newTask.project_id) {
      setError("Task title and project are required");
      return;
    }
    
    try {
      await api.post("/tasks", {
        title: newTask.title.trim(),
        description: newTask.description?.trim() || null,
        project_id: parseInt(newTask.project_id),
        assigned_to_id: newTask.assigned_to_id ? parseInt(newTask.assigned_to_id) : null,
        status: "in_progress"
      });
      setNewTask({ title: "", description: "", project_id: "", assigned_to_id: "" });
      setShowCreateTask(false);
      setError("");
      await fetchData();
    } catch (e) {
      setError("Failed to create task: " + (e.response?.data?.detail || e.message));
      console.error("Create task error:", e);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    // Optimistic update - update UI immediately
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, status } : task
      )
    );
    
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      setError("");
    } catch (e) {
      // Revert on error
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: task.status } : task
        )
      );
      setError("Failed to update task status: " + (e.response?.data?.detail || e.message));
      console.error("Update task status error:", e);
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) return;
    
    try {
      await api.delete(`/tasks/${taskId}`);
      setError("");
      await fetchData();
    } catch (e) {
      setError("Failed to delete task: " + (e.response?.data?.detail || e.message));
      console.error("Delete task error:", e);
    }
  };

  const clearError = () => {
    setError("");
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : "Unassigned";
  };

  const getUserEmail = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.email : "";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "incomplete":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Tasks">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Tasks">
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="ml-2 text-red-600 hover:text-red-800 font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <button
          onClick={() => navigate("/owner/dashboard")}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          ← Back to Dashboard
        </button>
      </div>

      <Card>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Task Management</h2>
          <p className="text-gray-600">
            View and manage all tasks across your assigned projects. Create new tasks, update statuses, and track progress.
          </p>
        </div>

        {/* Create Task Form */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Create New Task</h3>
            <button
              onClick={() => setShowCreateTask(!showCreateTask)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {showCreateTask ? "Cancel" : "Create Task"}
            </button>
          </div>

          {showCreateTask && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Task title"
                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Description (optional)"
                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newTask.project_id}
                onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              <button
                onClick={createTask}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Create Task
              </button>
            </div>
          )}

          {showCreateTask && (
            <div className="mt-3">
              <select
                value={newTask.assigned_to_id}
                onChange={(e) => setNewTask({ ...newTask, assigned_to_id: e.target.value })}
                className="w-full md:w-80 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Assign to (optional)</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks..."
            className="rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="incomplete">Incomplete</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {query || statusFilter !== "all" || projectFilter !== "all" 
                  ? "No tasks match your filters" 
                  : "No tasks found"}
              </div>
              {!query && statusFilter === "all" && projectFilter === "all" && (
                <p className="text-sm text-gray-400 mt-2">
                  Create your first task to get started.
                </p>
              )}
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Project: {getProjectName(task.project_id)}</span>
                      <span>Assigned to: {getUserName(task.assigned_to_id)}</span>
                      {getUserEmail(task.assigned_to_id) && (
                        <span className="text-gray-400">({getUserEmail(task.assigned_to_id)})</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                    >
                      <option value="incomplete">Incomplete</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </Card>
    </DashboardLayout>
  );
}
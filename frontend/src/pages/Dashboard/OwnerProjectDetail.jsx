import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/common/Card";
import api from "../../api/axios";

export default function OwnerProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("tasks");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", assigned_to_id: "" });
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const fetchProjectData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch all data in parallel for faster loading
      const [
        projectRes,
        tasksRes,
        membersRes,
        teamsRes,
        usersRes,
        allUsersRes
      ] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/tasks/project/${projectId}`),
        api.get(`/teams/project/${projectId}/members`),
        api.get(`/teams/project/${projectId}`),
        api.get(`/teams/project/${projectId}/available-users`),
        api.get("/users/members")
      ]);

      setProject(projectRes.data);
      setTasks(tasksRes.data);
      setMembers(membersRes.data);
      setTeams(teamsRes.data);
      setAvailableUsers(usersRes.data);
      setAllUsers(allUsersRes.data);
    } catch (e) {
      setError("Failed to load project data");
      console.error("Project data fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const createTask = async () => {
    if (!newTask.title.trim()) {
      setError("Task title is required");
      return;
    }
    
    try {
      await api.post("/tasks", {
        title: newTask.title.trim(),
        description: newTask.description?.trim() || null,
        project_id: parseInt(projectId),
        assigned_to_id: newTask.assigned_to_id ? parseInt(newTask.assigned_to_id) : null,
        status: "in_progress"
      });
      setNewTask({ title: "", description: "", assigned_to_id: "" });
      setShowCreateTask(false);
      setError("");
      await fetchProjectData();
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
      await fetchProjectData();
    } catch (e) {
      setError("Failed to delete task: " + (e.response?.data?.detail || e.message));
      console.error("Delete task error:", e);
    }
  };

  const addMembersToTeam = async () => {
    if (!selectedTeam || selectedUsers.length === 0) {
      setError("Please select both team and at least one user");
      return;
    }
    
    try {
      // Add all selected users to the team
      const addPromises = selectedUsers.map(userId => 
        api.post("/teams/add_member", {
          team_id: parseInt(selectedTeam),
          user_id: parseInt(userId)
        })
      );
      
      await Promise.all(addPromises);
      setSelectedTeam("");
      setSelectedUsers([]);
      setShowAddMember(false);
      setError("");
      await fetchProjectData();
    } catch (e) {
      setError("Failed to add members to team: " + (e.response?.data?.detail || e.message));
      console.error("Add members error:", e);
    }
  };

  const removeMemberFromTeam = async (teamId, userId) => {
    if (!confirm("Are you sure you want to remove this member from the team?")) return;
    
    try {
      await api.post("/teams/remove_member", {
        team_id: teamId,
        user_id: userId
      });
      setError("");
      await fetchProjectData();
    } catch (e) {
      setError("Failed to remove member from team: " + (e.response?.data?.detail || e.message));
      console.error("Remove member error:", e);
    }
  };

  const clearError = () => {
    setError("");
  };

  if (loading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout title="Project Not Found">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Project Not Found</h2>
          <p className="text-gray-600 mt-2">The project you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate("/owner/projects")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Projects
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Project: ${project.name}`}>
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
          onClick={() => navigate("/owner/projects")}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          ← Back to Projects
        </button>
      </div>

      {/* Project Info */}
      <Card className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
            <p className="text-gray-600 mt-1">{project.description || "No description"}</p>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
              <span>Status: <span className={`font-medium ${project.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{project.status}</span></span>
              <span>Tasks: {tasks.length}</span>
              <span>Members: {members.length}</span>
              <span>Teams: {teams.length}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "tasks", label: "Tasks" },
              { id: "members", label: "Members" },
              { id: "teams", label: "Teams" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tasks Tab */}
      {activeTab === "tasks" && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Project Tasks</h3>
            <button
              onClick={() => setShowCreateTask(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Create Task
            </button>
          </div>

          {showCreateTask && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Create New Task</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                  value={newTask.assigned_to_id}
                  onChange={(e) => setNewTask({ ...newTask, assigned_to_id: e.target.value })}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Assign to...</option>
                  {allUsers.map((user) => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  ))}
                </select>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={createTask}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateTask(false);
                    setNewTask({ title: "", description: "", assigned_to_id: "" });
                    setError("");
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tasks found</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span>Assigned to: {task.assigned_to_id ? allUsers.find(u => u.id === task.assigned_to_id)?.name || "Unknown" : "Unassigned"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
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
              ))
            )}
          </div>
        </Card>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Project Members</h3>
            <button
              onClick={() => setShowAddMember(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add Member
            </button>
          </div>

          {showAddMember && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Add Member to Team</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  <div className="text-sm text-gray-600 mb-2">Select Users:</div>
                  {availableUsers.map((user) => (
                    <label key={user.id} className="flex items-center space-x-2 py-1 hover:bg-gray-50 rounded px-1">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id.toString())}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id.toString()]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id.toString()));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{user.name} ({user.email})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={addMembersToTeam}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Add Members ({selectedUsers.length})
                </button>
                <button
                  onClick={() => {
                    setShowAddMember(false);
                    setSelectedTeam("");
                    setSelectedUsers([]);
                    setError("");
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {members.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No members found</p>
            ) : (
              members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{member.name}</h4>
                    <p className="text-sm text-gray-600">{member.email}</p>
                    <p className="text-sm text-gray-500">Team: {member.team_name}</p>
                  </div>
                  <button
                    onClick={() => removeMemberFromTeam(member.team_id, member.id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Teams Tab */}
      {activeTab === "teams" && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Teams</h3>
          <div className="space-y-3">
            {teams.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No teams found</p>
            ) : (
              teams.map((team) => (
                <div key={team.id} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">{team.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">Members: {members.filter(member => member.team_id === team.id).length}</p>
                  <div className="mt-2">
                    <h5 className="text-sm font-medium text-gray-700">Team Members:</h5>
                    <div className="mt-1 space-y-1">
                      {members.filter(member => member.team_id === team.id).map((member) => (
                        <div key={member.id} className="text-sm text-gray-600">
                          • {member.name} ({member.email})
                        </div>
                      ))}
                      {members.filter(member => member.team_id === team.id).length === 0 && (
                        <div className="text-sm text-gray-500 italic">No members in this team</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}

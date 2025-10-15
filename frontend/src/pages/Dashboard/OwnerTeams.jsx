import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/common/Card";
import api from "../../api/axios";

export default function OwnerTeams() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [newTeam, setNewTeam] = useState({ name: "", project_id: "" });
  const [addMemberForm, setAddMemberForm] = useState({ team_id: "", user_ids: [] });

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [teamsRes, projectsRes, usersRes] = await Promise.all([
        api.get("/teams"),
        api.get("/projects"),
        api.get("/users/members")
      ]);
      
      setTeams(teamsRes.data);
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

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(query.toLowerCase()) ||
    projects.find(p => p.id === team.project_id)?.name.toLowerCase().includes(query.toLowerCase())
  );

  const createTeam = async () => {
    if (!newTeam.name.trim() || !newTeam.project_id) {
      setError("Team name and project are required");
      return;
    }
    
    try {
      await api.post("/teams", {
        name: newTeam.name.trim(),
        project_id: parseInt(newTeam.project_id),
        member_ids: []
      });
      setNewTeam({ name: "", project_id: "" });
      setShowCreateTeam(false);
      setError("");
      await fetchData();
    } catch (e) {
      setError("Failed to create team: " + (e.response?.data?.detail || e.message));
      console.error("Create team error:", e);
    }
  };

  const addMembersToTeam = async () => {
    if (!addMemberForm.team_id || addMemberForm.user_ids.length === 0) {
      setError("Please select both team and at least one user");
      return;
    }
    
    try {
      // Add all selected users to the team
      const addPromises = addMemberForm.user_ids.map(userId => 
        api.post("/teams/add_member", {
          team_id: parseInt(addMemberForm.team_id),
          user_id: parseInt(userId)
        })
      );
      
      await Promise.all(addPromises);
      setAddMemberForm({ team_id: "", user_ids: [] });
      setShowAddMember(false);
      setError("");
      await fetchData();
    } catch (e) {
      setError("Failed to add members: " + (e.response?.data?.detail || e.message));
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
      await fetchData();
    } catch (e) {
      setError("Failed to remove member: " + (e.response?.data?.detail || e.message));
      console.error("Remove member error:", e);
    }
  };

  const deleteTeam = async (teamId) => {
    if (!confirm("Are you sure you want to delete this team? This will remove all members from the team.")) return;
    
    try {
      await api.delete(`/teams/${teamId}`);
      setError("");
      await fetchData();
    } catch (e) {
      setError("Failed to delete team: " + (e.response?.data?.detail || e.message));
      console.error("Delete team error:", e);
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
    return user ? user.name : "Unknown User";
  };

  const getUserEmail = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.email : "Unknown Email";
  };

  if (loading) {
    return (
      <DashboardLayout title="Teams">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Teams">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Team Management</h2>
          <p className="text-gray-600">
            Create and manage teams within your projects. Add members to teams and organize your project structure.
          </p>
        </div>

        {/* Create Team Form */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Create New Team</h3>
            <button
              onClick={() => setShowCreateTeam(!showCreateTeam)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {showCreateTeam ? "Cancel" : "Create Team"}
            </button>
          </div>

          {showCreateTeam && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                placeholder="Team name"
                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newTeam.project_id}
                onChange={(e) => setNewTeam({ ...newTeam, project_id: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              <button
                onClick={createTeam}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Create Team
              </button>
            </div>
          )}
        </div>

        {/* Add Member Form */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Add Member to Team</h3>
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {showAddMember ? "Cancel" : "Add Member"}
            </button>
          </div>

          {showAddMember && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={addMemberForm.team_id}
                onChange={(e) => setAddMemberForm({ ...addMemberForm, team_id: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name} ({getProjectName(team.project_id)})</option>
                ))}
              </select>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                <div className="text-sm text-gray-600 mb-2">Select Users:</div>
                {users.map((user) => (
                  <label key={user.id} className="flex items-center space-x-2 py-1 hover:bg-gray-50 rounded px-1">
                    <input
                      type="checkbox"
                      checked={addMemberForm.user_ids.includes(user.id.toString())}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAddMemberForm({ 
                            ...addMemberForm, 
                            user_ids: [...addMemberForm.user_ids, user.id.toString()] 
                          });
                        } else {
                          setAddMemberForm({ 
                            ...addMemberForm, 
                            user_ids: addMemberForm.user_ids.filter(id => id !== user.id.toString()) 
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{user.name} ({user.email})</span>
                  </label>
                ))}
              </div>
              <button
                onClick={addMembersToTeam}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Add Members ({addMemberForm.user_ids.length})
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams by name or project..."
            className="w-full md:w-80 rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Teams List */}
        <div className="space-y-4">
          {filteredTeams.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {query ? "No teams match your search" : "No teams found"}
              </div>
              {!query && (
                <p className="text-sm text-gray-400 mt-2">
                  Create your first team to get started.
                </p>
              )}
            </div>
          ) : (
            filteredTeams.map((team) => (
              <div key={team.id} className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{team.name}</h3>
                    <p className="text-gray-600 mb-3">Project: {getProjectName(team.project_id)}</p>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Team Members ({team.member_ids.length}):</h4>
                      {team.member_ids.length === 0 ? (
                        <p className="text-sm text-gray-500">No members assigned</p>
                      ) : (
                        <div className="space-y-2">
                          {team.member_ids.map((memberId) => (
                            <div key={memberId} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div>
                                <span className="text-sm font-medium text-gray-900">{getUserName(memberId)}</span>
                                <span className="text-sm text-gray-500 ml-2">({getUserEmail(memberId)})</span>
                              </div>
                              <button
                                onClick={() => removeMemberFromTeam(team.id, memberId)}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4 flex flex-col gap-2">
                    <button
                      onClick={() => deleteTeam(team.id)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Delete Team
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
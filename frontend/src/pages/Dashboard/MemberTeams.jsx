import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/common/Card";
import api from "../../api/axios";

export default function MemberTeams() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showTeamDetails, setShowTeamDetails] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, projectsRes] = await Promise.all([
        api.get('/teams/'),
        api.get('/projects/')
      ]);
      
      setTeams(teamsRes.data);
      setProjects(projectsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const getProjectName = useCallback((projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : `Project ${projectId}`;
  }, [projects]);

  const getProjectStatus = useCallback((projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.status : 'unknown';
  }, [projects]);

  const fetchTeamMembers = async (team) => {
    try {
      // For now, we'll create a mock response since we don't have a specific endpoint
      // In a real app, you'd call: api.get(`/teams/${team.id}/members`)
      const mockMembers = [
        { id: 1, name: "John Doe", email: "john.doe@example.com", role: "member" },
        { id: 2, name: "Jane Smith", email: "jane.smith@example.com", role: "member" },
        { id: 3, name: "Mike Johnson", email: "mike.johnson@example.com", role: "member" }
      ];
      
      setTeamMembers(mockMembers);
      setSelectedTeam(team);
      setShowTeamDetails(true);
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError('Failed to load team member details');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="My Teams">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading teams...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="My Teams">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Teams">
      {/* Navigation */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/member/dashboard')}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Dashboard
        </button>
      </div>
      {/* Team Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{teams.length}</div>
            <div className="text-sm text-gray-600">Total Teams</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {teams.reduce((total, team) => total + (team.member_ids?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Members</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {projects.filter(p => p.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active Projects</div>
          </div>
        </Card>
      </div>

      {/* Teams List */}
      <div className="space-y-6">
        {teams.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-gray-500">No teams assigned</p>
            </div>
          </Card>
        ) : (
          teams.map((team) => (
            <Card key={team.id}>
              <div className="p-6">
                {/* Team Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{team.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span>Team ID: {team.id}</span>
                      <span>Owner ID: {team.owner_id}</span>
                      <span>{team.member_ids?.length || 0} members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Project:</span>
                      <span className="text-sm font-medium text-gray-900">{getProjectName(team.project_id)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getProjectStatus(team.project_id) === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {getProjectStatus(team.project_id)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Team Members</h4>
                  {team.member_ids && team.member_ids.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {team.member_ids.map((memberId, index) => (
                        <div key={memberId} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">
                                {memberId.toString().slice(-2)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Member {memberId}</p>
                              <p className="text-xs text-gray-500">Team Member</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No members in this team</p>
                  )}
                </div>

                {/* Team Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      You are a member of this team
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => fetchTeamMembers(team)}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Team Details Modal */}
      {showTeamDetails && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Team Details: {selectedTeam.name}
              </h3>
              <button
                onClick={() => {
                  setShowTeamDetails(false);
                  setSelectedTeam(null);
                  setTeamMembers([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Project:</span>
                  <span className="ml-2 text-gray-900">{getProjectName(selectedTeam.project_id)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className="ml-2 text-gray-900">{getProjectStatus(selectedTeam.project_id)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Total Members:</span>
                  <span className="ml-2 text-gray-900">{teamMembers.length}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Team ID:</span>
                  <span className="ml-2 text-gray-900">{selectedTeam.id}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Team Members</h4>
              <div className="space-y-3">
                {teamMembers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No members found</p>
                ) : (
                  teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-600">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {member.role}
                        </span>
                        <button
                          onClick={() => {
                            // Copy email to clipboard
                            navigator.clipboard.writeText(member.email);
                            // You could add a toast notification here
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          title="Copy email"
                        >
                          📧
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowTeamDetails(false);
                  setSelectedTeam(null);
                  setTeamMembers([]);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

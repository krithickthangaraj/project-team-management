import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/common/Card";
import api from "../../api/axios";

export default function MemberProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, tasksRes] = await Promise.all([
        api.get('/projects/'),
        api.get('/tasks/')
      ]);
      
      setProjects(projectsRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const getProjectProgress = useCallback((projectId) => {
    const projectTasks = tasks.filter(task => task.project_id === projectId);
    const completed = projectTasks.filter(task => task.status === 'completed').length;
    const total = projectTasks.length;
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [tasks]);

  const getProjectTasks = useCallback((projectId) => {
    return tasks.filter(task => task.project_id === projectId);
  }, [tasks]);

  if (loading) {
    return (
      <DashboardLayout title="My Projects">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading projects...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="My Projects">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Projects">
      {/* Navigation */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/member/dashboard')}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Dashboard
        </button>
      </div>
      {/* Project Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{projects.length}</div>
            <div className="text-sm text-gray-600">Total Projects</div>
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
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {projects.filter(p => p.status === 'inactive').length}
            </div>
            <div className="text-sm text-gray-600">Inactive Projects</div>
          </div>
        </Card>
      </div>

      {/* Projects List */}
      <div className="space-y-6">
        {projects.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-gray-500">No projects assigned</p>
            </div>
          </Card>
        ) : (
          projects.map((project) => {
            const progress = getProjectProgress(project.id);
            const projectTasks = getProjectTasks(project.id);
            const taskStatusCounts = {
              completed: projectTasks.filter(t => t.status === 'completed').length,
              inProgress: projectTasks.filter(t => t.status === 'in_progress').length,
              incomplete: projectTasks.filter(t => t.status === 'incomplete').length
            };

            return (
              <Card key={project.id}>
                <div className="p-6">
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
                      <p className="text-gray-600 mb-3">{project.description || 'No description available'}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Project ID: {project.id}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Simple Project Info */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Tasks: {projectTasks.length}</span>
                      <span>Status: {project.status}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}

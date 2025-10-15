import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/common/Card";
import api from "../../api/axios";

export default function MemberDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate statistics with useMemo for performance
  const totalProjects = useMemo(() => projects.length, [projects]);
  const totalTasks = useMemo(() => tasks.length, [tasks]);
  const completedTasks = useMemo(() => tasks.filter(task => task.status === 'completed').length, [tasks]);
  const inProgressTasks = useMemo(() => tasks.filter(task => task.status === 'in_progress').length, [tasks]);
  const incompleteTasks = useMemo(() => tasks.filter(task => task.status === 'incomplete').length, [tasks]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, tasksRes, teamsRes] = await Promise.all([
        api.get('/projects/'),
        api.get('/tasks/'),
        api.get('/teams/')
      ]);
      
      setProjects(projectsRes.data);
      setTasks(tasksRes.data);
      setTeams(teamsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusUpdate = useCallback(async (taskId, newStatus) => {
    // Optimistic update - update UI immediately
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
    
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      setError(null);
    } catch (err) {
      // Revert on error
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: task.status } : task
        )
      );
      console.error('Error updating task status:', err);
      setError('Failed to update task status');
    }
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'incomplete': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'incomplete': return 'Incomplete';
      default: return status;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Member Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Member Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Member Dashboard">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          label="My Projects" 
          value={totalProjects.toString()} 
          accent="text-purple-600" 
        />
        <StatCard 
          label="My Tasks" 
          value={totalTasks.toString()} 
          accent="text-purple-600" 
        />
        <StatCard 
          label="My Teams" 
          value={teams.length.toString()} 
          accent="text-purple-600" 
        />
        <StatCard 
          label="Completed" 
          value={completedTasks.toString()} 
          accent="text-purple-600" 
        />
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <button 
              onClick={() => navigate('/member/tasks')} 
              className="rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-900"
            >
              My Tasks
            </button>
            <button 
              onClick={() => navigate('/member/projects')} 
              className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50"
            >
              My Projects
            </button>
            <button 
              onClick={() => navigate('/member/teams')} 
              className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50"
            >
              My Teams
            </button>
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-gray-900">My Tasks Overview</h3>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            {tasks.length === 0 ? (
              <p className="text-gray-500">No tasks assigned yet.</p>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>Incomplete:</span>
                  <span className="font-medium">{incompleteTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span>In Progress:</span>
                  <span className="font-medium">{inProgressTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span className="font-medium">{completedTasks}</span>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/common/Card";
import api from "../../api/axios";

export default function MemberTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, incomplete, in_progress, completed
  const [updatingTasks, setUpdatingTasks] = useState(new Set());

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasks/');
      setTasks(response.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusUpdate = useCallback(async (taskId, newStatus) => {
    // Prevent multiple updates for the same task
    if (updatingTasks.has(taskId)) return;
    
    setUpdatingTasks(prev => new Set(prev).add(taskId));
    
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
    } finally {
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  }, [updatingTasks]);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'incomplete': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusBadge = useCallback((status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'incomplete': return 'Incomplete';
      default: return status;
    }
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filter === 'all') return true;
      return task.status === filter;
    });
  }, [tasks, filter]);

  const taskStats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    incomplete: tasks.filter(t => t.status === 'incomplete').length
  }), [tasks]);

  if (loading) {
    return (
      <DashboardLayout title="My Tasks">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading tasks...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="My Tasks">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Tasks">
      {/* Navigation */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/member/dashboard')}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Dashboard
        </button>
      </div>
      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{taskStats.incomplete}</div>
            <div className="text-sm text-gray-600">Incomplete</div>
          </div>
        </Card>
      </div>

      {/* Filter and Tasks */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">All Tasks</h3>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
            >
              <option value="all">All Tasks</option>
              <option value="incomplete">Incomplete</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {filter === 'all' ? 'No tasks assigned' : `No ${filter} tasks`}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Project ID: {task.project_id}</span>
                      <span>Task ID: {task.id}</span>
                      <span>Assigned to: {task.assigned_to_id ? 'You' : 'Unassigned'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {getStatusBadge(task.status)}
                    </span>
                      {task.status !== 'completed' && (
                        <select
                          value={task.status}
                          onChange={(e) => handleTaskStatusUpdate(task.id, e.target.value)}
                          disabled={updatingTasks.has(task.id)}
                          className={`text-sm border border-gray-300 rounded-lg px-3 py-1 bg-white hover:bg-gray-50 ${
                            updatingTasks.has(task.id) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="incomplete">Incomplete</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      )}
                      {updatingTasks.has(task.id) && (
                        <span className="text-xs text-gray-500">Updating...</span>
                      )}
                  </div>
                </div>
                
                {task.status === 'completed' && (
                  <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-xs text-green-700">
                      ✓ This task has been completed
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}

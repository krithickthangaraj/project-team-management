import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/common/Card";
import api from "../../api/axios";

export default function OwnerProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const fetchProjects = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/projects");
      setProjects(res.data);
    } catch (e) {
      setError("Failed to load projects");
      console.error("Projects fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(query.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(query.toLowerCase()))
  );

  if (loading) {
    return (
      <DashboardLayout title="My Projects">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading projects...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Projects">
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">My Assigned Projects</h2>
          <p className="text-gray-600">
            These are the projects that have been assigned to you as the owner. 
            You can manage tasks, team members, and project details.
          </p>
        </div>

        <div className="mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects by name or description..."
            className="w-full md:w-80 rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {query ? "No projects match your search" : "No projects assigned to you yet"}
              </div>
              {!query && (
                <p className="text-sm text-gray-400 mt-2">
                  Contact an administrator to get projects assigned to you.
                </p>
              )}
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div key={project.id} className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
                    <p className="text-gray-600 mb-3">{project.description || "No description available"}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {project.status}
                      </span>
                      <span>Project ID: {project.id}</span>
                      <span>Admin ID: {project.admin_id}</span>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">Owner Access</div>
                      <div className="text-xs text-gray-400">
                        Full management rights
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      As the project owner, you can manage tasks, team members, and project details.
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/owner/projects/${project.id}`)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Manage Project
                      </button>
                    </div>
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

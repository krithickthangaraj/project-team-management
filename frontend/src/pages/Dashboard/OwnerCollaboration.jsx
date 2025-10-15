import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/common/Card";
import api from "../../api/axios";

export default function OwnerCollaboration() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const fetchCollaborationProjects = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/projects/collaboration");
      setProjects(res.data);
    } catch (e) {
      setError("Failed to load collaboration projects");
      console.error("Collaboration projects fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborationProjects();
  }, []);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(query.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(query.toLowerCase()))
  );

  if (loading) {
    return (
      <DashboardLayout title="Collaboration">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading collaboration projects...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Collaboration - Other Projects">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Other Projects</h2>
          <p className="text-gray-600">
            View other projects for collaboration context. These are read-only views to help you understand 
            the broader project landscape and potential collaboration opportunities.
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
                {query ? "No projects match your search" : "No other projects available for collaboration"}
              </div>
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
                      <span>Owner ID: {project.owner_id}</span>
                      <span>Admin ID: {project.admin_id}</span>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">Read-Only Access</div>
                      <div className="text-xs text-gray-400">
                        For collaboration context only
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      This project is managed by another owner. You can view it for collaboration context 
                      but cannot make changes.
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // In a real implementation, you might want to show more details
                          alert(`Project: ${project.name}\nStatus: ${project.status}\nDescription: ${project.description || 'No description'}\nOwner ID: ${project.owner_id}\nAdmin ID: ${project.admin_id}`);
                        }}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        View Details
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

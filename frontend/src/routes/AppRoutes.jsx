import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import useAuth from "../hooks/useAuth";

import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import Home from "../pages/Home";
import MemberDashboard from "../pages/Dashboard/MemberDashboard";
import MemberTasks from "../pages/Dashboard/MemberTasks";
import MemberProjects from "../pages/Dashboard/MemberProjects";
import MemberTeams from "../pages/Dashboard/MemberTeams";
import OwnerDashboard from "../pages/Dashboard/OwnerDashboard";
import OwnerProjects from "../pages/Dashboard/OwnerProjects";
import OwnerProjectDetail from "../pages/Dashboard/OwnerProjectDetail";
import OwnerTeams from "../pages/Dashboard/OwnerTeams";
import OwnerTasks from "../pages/Dashboard/OwnerTasks";
import OwnerCollaboration from "../pages/Dashboard/OwnerCollaboration";
import AdminDashboard from "../pages/Dashboard/AdminDashboard";
import AdminUsers from "../pages/Dashboard/AdminUsers";
import AdminProjects from "../pages/Dashboard/AdminProjects";
import AdminTeams from "../pages/Dashboard/AdminTeams";
import AdminTasks from "../pages/Dashboard/AdminTasks";
import NotFound from "../pages/NotFound";

// -------------------- Helpers --------------------
const getDashboardPath = (role) => {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "owner":
      return "/owner/dashboard"; // matches backend
    default:
      return "/member/dashboard";
  }
};

// -------------------- Protected Route --------------------
const ProtectedRoute = ({ user, requiredRole, children }) => {
  const location = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
};

// -------------------- Main Routes Component --------------------
function InnerRoutes() {
  const { user } = useAuth();
  return (
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <Navigate to={getDashboardPath(user.role)} replace />
            ) : (
              <Home />
            )
          }
        />

        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={getDashboardPath(user.role)} replace />
            ) : (
              <Login />
            )
          }
        />

        <Route
          path="/register"
          element={
            user ? (
              <Navigate to={getDashboardPath(user.role)} replace />
            ) : (
              <Register />
            )
          }
        />

        <Route
          path="/member/dashboard"
          element={
            <ProtectedRoute user={user} requiredRole="member">
              <MemberDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/member/tasks"
          element={
            <ProtectedRoute user={user} requiredRole="member">
              <MemberTasks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/member/projects"
          element={
            <ProtectedRoute user={user} requiredRole="member">
              <MemberProjects />
            </ProtectedRoute>
          }
        />

        <Route
          path="/member/teams"
          element={
            <ProtectedRoute user={user} requiredRole="member">
              <MemberTeams />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/dashboard"
          element={
            <ProtectedRoute user={user} requiredRole="owner">
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/projects"
          element={
            <ProtectedRoute user={user} requiredRole="owner">
              <OwnerProjects />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/projects/:projectId"
          element={
            <ProtectedRoute user={user} requiredRole="owner">
              <OwnerProjectDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/teams"
          element={
            <ProtectedRoute user={user} requiredRole="owner">
              <OwnerTeams />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/tasks"
          element={
            <ProtectedRoute user={user} requiredRole="owner">
              <OwnerTasks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/collaboration"
          element={
            <ProtectedRoute user={user} requiredRole="owner">
              <OwnerCollaboration />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute user={user} requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute user={user} requiredRole="admin">
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/projects"
          element={
            <ProtectedRoute user={user} requiredRole="admin">
              <AdminProjects />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/teams"
          element={
            <ProtectedRoute user={user} requiredRole="admin">
              <AdminTeams />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/tasks"
          element={
            <ProtectedRoute user={user} requiredRole="admin">
              <AdminTasks />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
  );
}

export default function AppRoutes() {
  return (
    <Router>
      <AuthProvider>
        <InnerRoutes />
      </AuthProvider>
    </Router>
  );
}

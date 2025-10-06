import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import useAuth from "../hooks/useAuth";

import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import Home from "../pages/Home";
import MemberDashboard from "../pages/Dashboard/MemberDashboard";
import OwnerDashboard from "../pages/Dashboard/OwnerDashboard";
import AdminDashboard from "../pages/Dashboard/AdminDashboard";
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
          path="/owner/dashboard"
          element={
            <ProtectedRoute user={user} requiredRole="owner">
              <OwnerDashboard />
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

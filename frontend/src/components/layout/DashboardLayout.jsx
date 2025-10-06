import React from "react";
import useAuth from "../../hooks/useAuth";

export default function DashboardLayout({ title, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-black text-white flex items-center justify-center font-bold">PT</div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">{title}</h1>
              <p className="text-xs text-gray-500">Signed in as {user?.name || user?.email} • {user?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={logout}
              className="inline-flex items-center rounded-xl bg-red-500 px-4 py-2 text-white font-medium shadow hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}



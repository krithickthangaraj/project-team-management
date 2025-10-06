import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Topbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center text-white font-bold">PT</div>
            <div>
              <div className="text-sm font-semibold">Project Team</div>
              <div className="text-xs text-slate-500">Collaborate — ship faster</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-medium">{user?.name || "Guest"}</span>
              <span className="text-xs text-slate-500">{user?.role ?? "Not signed in"}</span>
            </div>

            <button
              onClick={logout}
              className="px-3 py-2 rounded-lg bg-rose-500 text-white text-sm hover:bg-rose-600 transition"
              title="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

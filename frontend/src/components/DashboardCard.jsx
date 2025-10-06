import React from "react";

export default function DashboardCard({ title, value, hint, icon, children }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transform hover:-translate-y-1 transition">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500">{title}</div>
          <div className="mt-2 text-2xl font-bold">{value}</div>
          {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
        </div>
        {icon && <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center">{icon}</div>}
      </div>
      {children}
    </div>
  );
}

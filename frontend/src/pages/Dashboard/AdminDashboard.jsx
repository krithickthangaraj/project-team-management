import React from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/common/Card";

export default function AdminDashboard() {
  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Users" value="50" accent="text-purple-600" />
        <StatCard label="Teams" value="12" accent="text-purple-600" />
        <StatCard label="System Alerts" value="2 critical" accent="text-purple-600" />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-900">Add User</button>
            <button className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50">Create Team</button>
            <button className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50">System Settings</button>
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>• John created Team Alpha</li>
            <li>• New user invited: alice@example.com</li>
            <li>• System maintenance scheduled</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}

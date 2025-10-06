import React from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/common/Card";

export default function MemberDashboard() {
  return (
    <DashboardLayout title="Member Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="My Teams" value="3" accent="text-gray-600" />
        <StatCard label="Tasks Assigned" value="12 pending" accent="text-gray-600" />
        <StatCard label="Notifications" value="3 new" accent="text-gray-600" />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-900">New Task</button>
            <button className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50">My Teams</button>
            <button className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50">Notifications</button>
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>• Task "Design review" assigned to you</li>
            <li>• You completed "Update docs"</li>
            <li>• New comment on "Sprint plan"</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}

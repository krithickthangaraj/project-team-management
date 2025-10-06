import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <header className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-black text-white flex items-center justify-center font-bold">PT</div>
          <span className="text-lg font-semibold">Project Team</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link to="/login" className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50">Sign in</Link>
          <Link to="/register" className="rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-900">Get started</Link>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl md:text-6xl font-semibold text-gray-900 leading-tight">Lead teams with clarity and speed</h1>
          <p className="mt-4 text-lg text-gray-600">Organize projects, assign tasks, and collaborate in real-time. Role-based dashboards keep everyone focused.</p>
          <div className="mt-8 flex gap-3">
            <Link to="/register" className="rounded-xl bg-black px-5 py-3 text-white font-semibold hover:bg-gray-900">Create free account</Link>
            <Link to="/login" className="rounded-xl border border-gray-300 px-5 py-3 hover:bg-gray-50">Sign in</Link>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="rounded-2xl border border-gray-200 p-4">Fast setup</div>
            <div className="rounded-2xl border border-gray-200 p-4">Team roles</div>
            <div className="rounded-2xl border border-gray-200 p-4">Realtime updates</div>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-black/10 to-gray-600/10 rounded-3xl blur-2xl" />
            <div className="relative rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="mt-3 h-6 w-32 bg-gray-300 rounded" />
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="mt-3 h-6 w-32 bg-gray-300 rounded" />
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="mt-3 h-6 w-32 bg-gray-300 rounded" />
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="mt-3 h-6 w-32 bg-gray-300 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-gray-600 mb-6">Page Not Found</p>
      <Link
        to="/"
        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
      >
        Go Home
      </Link>
    </div>
  );
}

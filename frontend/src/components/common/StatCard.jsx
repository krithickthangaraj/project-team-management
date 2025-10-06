import React from "react";
import Card from "./Card";

export default function StatCard({ label, value, accent = "text-gray-600" }) {
  return (
    <Card>
      <h3 className={`text-sm font-medium ${accent}`}>{label}</h3>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    </Card>
  );
}



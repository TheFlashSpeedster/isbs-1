import React from "react";

export default function TrustCard({ title, detail }) {
  return (
    <div className="glass-panel rounded-2xl p-5 text-center shadow-card">
      <h4 className="text-lg font-semibold text-white">{title}</h4>
      <p className="mt-2 text-sm text-slate-300">{detail}</p>
    </div>
  );
}

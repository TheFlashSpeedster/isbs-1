import React from "react";

export default function StepCard({ step, title, detail }) {
  return (
    <div className="glass-panel rounded-3xl p-6 shadow-card">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-primary-500/20 px-3 py-1 text-xs text-primary-200">
          Step {step}
        </span>
        <div className="h-3 w-3 rounded-full bg-accent-500" />
      </div>
      <h4 className="mt-4 text-lg font-semibold text-white">{title}</h4>
      <p className="mt-2 text-sm text-slate-300">{detail}</p>
    </div>
  );
}

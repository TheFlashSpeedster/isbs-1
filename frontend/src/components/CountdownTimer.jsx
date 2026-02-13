import React, { useEffect, useState } from "react";

function format(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function CountdownTimer({ target }) {
  const [remaining, setRemaining] = useState(() => new Date(target).getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(new Date(target).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="rounded-2xl bg-primary-500/20 px-4 py-2 text-sm font-semibold text-primary-200">
      ETA in {format(remaining)}
    </div>
  );
}

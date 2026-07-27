"use client";

import { useEffect, useState } from "react";

export function TenureProgressBar({ percent }: { percent: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(percent), 50);
    return () => clearTimeout(t);
  }, [percent]);

  return (
    <div className="mt-6">
      <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${width}%`,
            background: "linear-gradient(90deg, #14b8a6, #6366f1, #a78bfa)",
          }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Progress to next work anniversary
      </p>
    </div>
  );
}

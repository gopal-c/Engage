"use client";

import { useEffect, useState } from "react";

export function TenureProgressBar({ percent }: { percent: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(percent), 50);
    return () => clearTimeout(t);
  }, [percent]);

  return (
    <div className="tenure-progress-wrap">
      <div className="tenure-progress-track">
        <div
          className="tenure-progress-fill"
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="tenure-progress-label">Progress to next work anniversary</p>
    </div>
  );
}

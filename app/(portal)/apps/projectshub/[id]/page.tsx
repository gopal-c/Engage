"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProjectDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/apps/projectshub?project=${id}`);
  }, [id, router]);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-pulse text-sm text-ink-400">Redirecting...</div>
    </div>
  );
}

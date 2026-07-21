"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AiResumeUploadPanel } from "@/components/skillshub/ai-resume-upload-panel";
import { hasResumeData } from "@/lib/skillshub/domain";
import type { Profile } from "@/lib/skillshub/types";

export function HrResumeSection({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [updatedAt, setUpdatedAt] = useState(profile.updatedAt);
  const [hasResume, setHasResume] = useState(hasResumeData(profile));
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleUpload(file: File) {
    setIsLoading(true);
    setIsSuccess(false);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/skillshub/employees/${profile.id}/resume`, { method: "POST", body: fd });
      const data = await res.json();
      if (!data.ok) {
        toast.error(data.error ?? "Couldn't extract that resume.");
        return;
      }
      toast.success("Resume extracted — profile fields refreshed below.");
      setHasResume(true);
      if (typeof data.updatedAt === "string") setUpdatedAt(data.updatedAt);
      setIsSuccess(true);
      router.refresh();
    } catch {
      toast.error("Network error — try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AiResumeUploadPanel
      existingResume={hasResume ? { updatedAt } : null}
      onUpload={handleUpload}
      isLoading={isLoading}
      isSuccess={isSuccess}
      onReset={() => setIsSuccess(false)}
    />
  );
}

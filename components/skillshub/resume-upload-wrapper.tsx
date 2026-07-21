"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AiResumeUploadPanel } from "@/components/skillshub/ai-resume-upload-panel";

export function ResumeUploadWrapper({
  endpoint,
  successRedirect,
}: {
  endpoint: string;
  successRedirect?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleUpload(file: File) {
    startTransition(async () => {
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(endpoint, { method: "POST", body: form });
        const data = await res.json();
        if (!data.ok) {
          toast.error(data.error ?? "Upload failed.");
          return;
        }
        setIsSuccess(true);
        toast.success("Profile extracted from resume.");
        if (successRedirect) {
          router.push(successRedirect);
        }
        router.refresh();
      } catch {
        toast.error("Network error — try again.");
      }
    });
  }

  return (
    <AiResumeUploadPanel
      onUpload={handleUpload}
      isLoading={isPending}
      isSuccess={isSuccess}
      onReset={() => setIsSuccess(false)}
    />
  );
}

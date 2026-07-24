"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { ProfileView } from "@/components/skillshub/profile-view";
import { ProfileForm } from "@/components/skillshub/profile-form";
import { AiResumeUploadPanel } from "@/components/skillshub/ai-resume-upload-panel";
import type { Profile, Milestone } from "@/lib/skillshub/types";

type Props = {
  profile: Profile;
  milestones: Milestone[];
  hasResumeData: boolean;
  uploadEndpoint: string;
};

export function MeProfilePage({ profile, milestones, hasResumeData, uploadEndpoint }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [showUpload, setShowUpload] = useState(!hasResumeData);
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleUpload(file: File) {
    startTransition(async () => {
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(uploadEndpoint, { method: "POST", body: form });
        const data = await res.json();
        if (!data.ok) {
          toast.error(data.error ?? "Upload failed.");
          return;
        }
        setIsSuccess(true);
        toast.success("Profile extracted from resume.");
        router.refresh();
      } catch {
        toast.error("Network error — try again.");
      }
    });
  }

  if (!hasResumeData) {
    return (
      <div className="space-y-6">
        <div>
          <p className="eyebrow-indigo mb-3">Get started</p>
          <h1 className="display-xl">Upload your resume.</h1>
          <p className="mt-3 text-lg text-ink-500">
            Upload your resume PDF. Our AI will extract your profile automatically.
          </p>
        </div>
        <AiResumeUploadPanel
          onUpload={handleUpload}
          isLoading={isPending}
          isSuccess={isSuccess}
          onReset={() => setIsSuccess(false)}
        />
      </div>
    );
  }

  if (editing) {
    return (
      <ProfileForm
        profile={profile}
        mode="self"
        onSaved={() => setEditing(false)}
        initialMilestones={milestones}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="display-xl">My Profile</h1>
        <button
          onClick={() => setEditing(true)}
          className="rounded-xl bg-indigo-deep px-5 py-2 text-sm font-medium text-white shadow-2 transition-all hover:bg-indigo-press hover:shadow-3"
        >
          Edit profile
        </button>
      </div>

      <ProfileView profile={profile} canManage={false} editableAvatar />

      {/* Update via Resume — collapsible */}
      <div className="rounded-2xl border border-ink-200/60 bg-ink-0/70 shadow-2 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setShowUpload((o) => !o)}
          className="flex w-full items-center justify-between px-6 py-4 text-left"
        >
          <div>
            <p className="text-sm font-semibold text-ink-800">Update via Resume</p>
            <p className="mt-0.5 text-xs text-ink-500">
              Upload a new resume to overwrite your profile with AI-extracted data
            </p>
          </div>
          <ChevronDown
            className={`size-5 text-ink-400 transition-transform ${showUpload ? "rotate-180" : ""}`}
          />
        </button>
        {showUpload && (
          <div className="border-t border-ink-200/60 px-6 pb-6 pt-4">
            <AiResumeUploadPanel
              onUpload={handleUpload}
              isLoading={isPending}
              isSuccess={isSuccess}
              onReset={() => setIsSuccess(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

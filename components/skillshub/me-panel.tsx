"use client";

import { useState } from "react";
import { ProfileView } from "@/components/skillshub/profile-view";
import { ProfileForm } from "@/components/skillshub/profile-form";
import type { Profile, Milestone } from "@/lib/skillshub/types";

export function MePanel({
  profile,
  milestones,
}: {
  profile: Profile;
  milestones: Milestone[];
}) {
  const [editing, setEditing] = useState(false);

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
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <button
          onClick={() => setEditing(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Edit profile
        </button>
      </div>
      <ProfileView profile={profile} canManage={false} editableAvatar />
    </div>
  );
}

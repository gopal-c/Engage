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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="display-xl">My Profile</h1>
        <button
          onClick={() => setEditing(true)}
          className="rounded-xl bg-indigo-deep px-5 py-2 text-sm font-medium text-white shadow-2 transition-all hover:bg-indigo-press hover:shadow-3"
        >
          Edit profile
        </button>
      </div>
      <ProfileView profile={profile} canManage={false} editableAvatar />
    </div>
  );
}

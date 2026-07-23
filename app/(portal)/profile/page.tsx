"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: string;
  date_of_birth: string | null;
  bio: string | null;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setName(data.user.name);
        setDob(data.user.date_of_birth || "");
        setBio(data.user.bio || "");
      });
  }, []);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        date_of_birth: dob || null,
        bio: bio.trim() || null,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setEditing(false);
      setMessage("Profile updated");
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage("Failed to update profile");
    }
    setSaving(false);
  }

  function cancelEdit() {
    if (!user) return;
    setEditing(false);
    setName(user.name);
    setDob(user.date_of_birth || "");
    setBio(user.bio || "");
  }

  if (!user) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const maxDob = new Date(
    new Date().getFullYear() - 16,
    new Date().getMonth(),
    new Date().getDate(),
  )
    .toISOString()
    .slice(0, 10);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-ink-800">Profile</h1>
        <p className="mt-1 text-ink-500">
          Manage your account details
        </p>
      </div>

      <div className="rounded-xl border border-ink-200/60 bg-ink-0/70 p-6 shadow-2 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <span className="mt-1 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize">
                {user.role}
              </span>
            </div>
          </div>
          {!editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </div>

        <Separator className="my-6" />

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Display Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Date of Birth</label>
              <Input
                type="date"
                value={dob}
                max={maxDob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">About Me</label>
              <Textarea
                rows={4}
                maxLength={500}
                placeholder="Tell us a few lines about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {bio.length}/500
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Display Name</label>
              <p className="mt-1.5 text-sm">{user.name}</p>
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <p className="mt-1.5 text-sm text-muted-foreground">{user.email}</p>
            </div>

            <div>
              <label className="text-sm font-medium">Date of Birth</label>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {user.date_of_birth
                  ? new Date(user.date_of_birth + "T00:00:00").toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Not set"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">About Me</label>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {user.bio || "Not set"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Role</label>
              <p className="mt-1.5 text-sm capitalize text-muted-foreground">
                {user.role}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Member since</label>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {new Date(user.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        )}

        {message && (
          <p className="mt-4 text-sm text-teal-deep">{message}</p>
        )}
      </div>
    </div>
  );
}

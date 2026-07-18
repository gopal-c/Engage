"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setName(data.user.name);
      });
  }, []);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
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

  if (!user) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Profile</h2>
        <p className="mt-1 text-muted-foreground">
          Manage your account details
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
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

        <Separator className="my-6" />

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Display Name</label>
            {editing ? (
              <div className="mt-1.5 flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  maxLength={100}
                />
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setName(user.name);
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="mt-1.5 flex items-center justify-between">
                <p className="text-sm">{user.name}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </Button>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <p className="mt-1.5 text-sm text-muted-foreground">{user.email}</p>
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

        {message && (
          <p className="mt-4 text-sm text-green-600 dark:text-green-400">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Trash2, Search, Eye, EyeOff } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  directory_hidden: boolean;
}

const ROLES = ["employee", "manager", "hr", "admin"] as const;
const ROLE_LEVEL: Record<string, number> = { admin: 40, hr: 30, manager: 20, employee: 10 };

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/users")
      .then((res) => {
        if (res.status === 403) throw new Error("Forbidden");
        return res.json();
      })
      .then((data) => {
        setUsers(data.users ?? []);
        setCurrentUserId(data.currentUserId ?? null);
        setCurrentUserRole(data.currentUserRole ?? null);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const myLevel = ROLE_LEVEL[currentUserRole ?? ""] ?? 0;
  const canManage = myLevel >= ROLE_LEVEL.hr;

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q),
    );
  }, [users, search]);

  async function changeRole(userId: string, role: string) {
    setUpdating(userId);

    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });

    if (res.ok) {
      const data = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: data.user.role } : u)),
      );
      toast.success(`Updated ${data.user.name} to ${data.user.role}`);
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to update role");
    }
    setUpdating(null);
  }

  async function toggleDirectory(userId: string, hidden: boolean) {
    setUpdating(userId);
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, directoryHidden: hidden }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, directory_hidden: hidden } : u)),
      );
      toast.success(hidden ? "Hidden from directory" : "Visible in directory");
    } else {
      toast.error("Failed to update directory visibility");
    }
    setUpdating(null);
  }

  async function confirmDelete() {
    if (!deleteTarget || !deletePassword) return;
    setDeleting(true);

    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: deleteTarget.id, password: deletePassword }),
    });

    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast.success(`Deleted ${deleteTarget.name}`);
      setDeleteTarget(null);
      setDeletePassword("");
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to delete user");
    }
    setDeleting(false);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading users...</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink-800">
          Manage Users <span className="text-ink-400 font-normal">({users.length})</span>
        </h2>
        <div className="relative mt-2 w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Search name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink-200/60 bg-ink-0/70 shadow-2 backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200/60 bg-ink-100/50">
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Joined</th>
              <th className="px-4 py-3 text-center font-medium">Directory</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-400">
                  {search ? "No users match your search." : "No users found."}
                </td>
              </tr>
            )}
            {filtered.map((user) => {
              const initials = user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              const isSelf = user.id === currentUserId;
              const targetLevel = ROLE_LEVEL[user.role] ?? 0;

              return (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.avatar_url ?? undefined}
                          alt={user.name}
                        />
                        <AvatarFallback className="text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {canManage ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={updating === user.id}
                        onClick={() => toggleDirectory(user.id, !user.directory_hidden)}
                        title={user.directory_hidden ? "Hidden from directory — click to show" : "Visible in directory — click to hide"}
                        className={user.directory_hidden ? "text-ink-400" : "text-emerald-600"}
                      >
                        {user.directory_hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </Button>
                    ) : (
                      <span className={user.directory_hidden ? "text-ink-400" : "text-emerald-600"}>
                        {user.directory_hidden ? <EyeOff className="size-4 inline" /> : <Eye className="size-4 inline" />}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {canManage &&
                        ROLES.map((role) => (
                          <Button
                            key={role}
                            size="sm"
                            variant={user.role === role ? "default" : "outline"}
                            disabled={
                              user.role === role ||
                              updating === user.id ||
                              isSelf ||
                              targetLevel >= myLevel ||
                              ROLE_LEVEL[role] > myLevel
                            }
                            onClick={() => changeRole(user.id, role)}
                            className="capitalize"
                          >
                            {role}
                          </Button>
                        ))}
                      {canManage && !isSelf && targetLevel < myLevel && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(user)}
                          className="ml-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Delete user"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeletePassword(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">{deleteTarget?.name}</span> ({deleteTarget?.email})?
              This will remove their account and clean up all related data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="mb-1.5 block text-sm font-medium">Enter your password to confirm</label>
            <Input
              type="password"
              placeholder="Password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && deletePassword) confirmDelete(); }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting || !deletePassword}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

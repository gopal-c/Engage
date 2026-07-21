"use client";

import { useState, useEffect } from "react";
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
import { Trash2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

const ROLES = ["employee", "hr", "admin"] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const isAdmin = currentUserRole === "admin";

  async function changeRole(userId: string, role: string) {
    setUpdating(userId);
    setMessage("");

    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });

    if (res.ok) {
      const data = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: data.user.role } : u))
      );
      setMessage(`Updated ${data.user.name} to ${data.user.role}`);
      setTimeout(() => setMessage(""), 3000);
    } else {
      const data = await res.json();
      setMessage(data.error || "Failed to update role");
    }
    setUpdating(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setMessage("");

    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: deleteTarget.id }),
    });

    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setMessage(`Deleted ${deleteTarget.name}`);
      setTimeout(() => setMessage(""), 3000);
    } else {
      const data = await res.json();
      setMessage(data.error || "Failed to delete user");
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">User Management</h2>
        <p className="mt-1 text-muted-foreground">
          {users.length} registered {users.length === 1 ? "user" : "users"}
        </p>
      </div>

      {message && (
        <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const initials = user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              const isSelf = user.id === currentUserId;

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
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {isAdmin &&
                        ROLES.map((role) => (
                          <Button
                            key={role}
                            size="sm"
                            variant={user.role === role ? "default" : "outline"}
                            disabled={
                              user.role === role || updating === user.id || isSelf
                            }
                            onClick={() => changeRole(user.id, role)}
                            className="capitalize"
                          >
                            {role}
                          </Button>
                        ))}
                      {isAdmin && !isSelf && (
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">{deleteTarget?.name}</span> ({deleteTarget?.email})?
              This will remove their account and clean up all related data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
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

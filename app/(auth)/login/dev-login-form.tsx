"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export function DevLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid credentials.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative rounded-lg border-2 border-dashed border-amber-deep/40 bg-amber-soft p-4">
      <span className="absolute -top-2.5 left-3 bg-amber-soft px-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-deep">
        Development Only
      </span>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="dev-email" className="block text-xs font-medium text-foreground">
            Email or Username
          </label>
          <input
            id="dev-email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border bg-card px-3 py-2 text-sm shadow-1 focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="dev-password" className="block text-xs font-medium text-foreground">
            Password
          </label>
          <input
            id="dev-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border bg-card px-3 py-2 text-sm shadow-1 focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-indigo-deep focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Dev Login"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export function DevLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("hr@demo.com");
  const [password, setPassword] = useState("demo123");
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
    <div className="relative rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-4">
      <span className="absolute -top-2.5 left-3 bg-amber-50 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600">
        Development Only
      </span>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="dev-email" className="block text-xs font-medium text-gray-700">
            Email
          </label>
          <input
            id="dev-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div>
          <label htmlFor="dev-password" className="block text-xs font-medium text-gray-700">
            Password
          </label>
          <input
            id="dev-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Dev Login"}
        </button>
        <p className="text-[10px] text-gray-400">
          hr@demo.com &middot; admin@demo.com &middot; password: demo123
        </p>
      </form>
    </div>
  );
}

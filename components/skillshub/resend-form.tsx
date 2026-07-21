"use client";

import { useState, useTransition } from "react";

export function ResendForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await fetch("/api/skillshub/resend-verification", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email }),
        });
      } catch {
        // generic response regardless
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        If that email needs verifying, check your inbox for a new link.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        required
        placeholder="you@valueaddsofttech.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Sending…" : "Resend verification link"}
      </button>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ApproveRejectButtons({ profileId, profileName }: { profileId: string; profileName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<"approved" | "rejected" | null>(null);

  function submit(status: "approved" | "rejected") {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/skillshub/profiles/${profileId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const data = await res.json();
        if (!data.ok) {
          toast.error(data.error ?? "Action failed.");
          return;
        }
        toast.success(status === "approved" ? "Profile approved." : "Profile rejected.");
        router.refresh();
      } catch {
        toast.error("Network error — try again.");
      } finally {
        setAction(null);
      }
    });
  }

  return (
    <>
      <AlertDialog open={action === "approved"} onOpenChange={(open) => { if (!open) setAction(null); }}>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setAction("approved")}
            className="rounded-lg bg-teal-deep px-3 py-1.5 text-xs font-medium text-white shadow-1 transition-all hover:brightness-110 disabled:opacity-50"
          >
            Approve
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this profile?</AlertDialogTitle>
            <AlertDialogDescription>
              {profileName}&apos;s profile will be marked as approved and visible in the employee directory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => submit("approved")}
              className="bg-teal-deep text-white hover:bg-teal-deep/90"
            >
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={action === "rejected"} onOpenChange={(open) => { if (!open) setAction(null); }}>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setAction("rejected")}
            className="rounded-lg border border-coral-deep/30 bg-coral-soft px-3 py-1.5 text-xs font-medium text-coral-deep shadow-1 transition-all hover:bg-coral-deep hover:text-white disabled:opacity-50"
          >
            Reject
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this profile?</AlertDialogTitle>
            <AlertDialogDescription>
              {profileName}&apos;s profile will be rejected. They will need to resubmit for review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => submit("rejected")}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

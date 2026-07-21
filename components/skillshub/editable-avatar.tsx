"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "@/components/skillshub/profile-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/skillshub/types";

const MAX_LEN  = 700_000;
const TARGET   = 256;
const QUALITY  = 0.85;

async function resizeToSquareJpeg(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error("read-failed"));
    fr.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload  = () => resolve(i);
    i.onerror = () => reject(new Error("load-failed"));
    i.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width  = TARGET;
  canvas.height = TARGET;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-canvas");

  // Center-crop to square, then scale to TARGET*TARGET.
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth  - side) / 2;
  const sy = (img.naturalHeight - side) / 2;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, TARGET, TARGET);

  return canvas.toDataURL("image/jpeg", QUALITY);
}

export function EditableAvatar({
  profile,
  className,
}: {
  profile: Profile;
  className?: string;
}) {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [open, setOpen]       = useState(false);
  const [isSaving,   startSaving]   = useTransition();
  const [isRemoving, startRemoving] = useTransition();

  function pick() {
    fileRef.current?.click();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;
    try {
      const dataUrl = await resizeToSquareJpeg(file);
      if (dataUrl.length > MAX_LEN) {
        toast.error("Image too large — try a smaller photo.");
        return;
      }
      setPreview(dataUrl);
      setOpen(true);
    } catch {
      toast.error("Couldn't read that image.");
    }
  }

  function save() {
    if (!preview) return;
    startSaving(async () => {
      try {
        const res = await fetch("/api/skillshub/me/avatar", {
          method:  "PATCH",
          headers: { "content-type": "application/json" },
          body:    JSON.stringify({ avatar: preview }),
        });
        const data = await res.json();
        if (!data.ok) {
          toast.error(data.error ?? "Couldn't save photo.");
          return;
        }
        toast.success("Profile photo updated");
        setOpen(false);
        setPreview(null);
        router.refresh();
      } catch {
        toast.error("Network error — try again.");
      }
    });
  }

  function remove() {
    startRemoving(async () => {
      try {
        const res = await fetch("/api/skillshub/me/avatar", {
          method:  "PATCH",
          headers: { "content-type": "application/json" },
          body:    JSON.stringify({ avatar: null }),
        });
        const data = await res.json();
        if (!data.ok) {
          toast.error(data.error ?? "Couldn't remove photo.");
          return;
        }
        toast.success("Profile photo removed");
        router.refresh();
      } catch {
        toast.error("Network error — try again.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={pick}
        aria-label="Change profile photo"
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-full outline-none",
          "ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary",
        )}
      >
        <ProfileAvatar
          name={profile.name}
          avatarUrl={profile.avatarUrl}
          className={className ?? "size-16"}
        />
        <span
          aria-hidden
          className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/65 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <Camera className="size-5 text-white" />
          <span className="mt-1 font-mono text-[9px] uppercase tracking-widest text-white">
            Change photo
          </span>
        </span>
      </button>

      {profile.avatarUrl && (
        <button
          type="button"
          onClick={remove}
          disabled={isRemoving}
          className="text-[11px] text-muted-foreground underline-offset-2 transition-colors hover:text-destructive hover:underline disabled:opacity-50"
        >
          {isRemoving ? "Removing…" : "Remove photo"}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      <Dialog
        open={open}
        onOpenChange={(v: boolean) => {
          if (isSaving) return;
          setOpen(v);
          if (!v) setPreview(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update profile photo</DialogTitle>
            <DialogDescription>
              Looks good? Save and it&rsquo;ll show on your profile everywhere.
            </DialogDescription>
          </DialogHeader>

          {preview && (
            <div className="flex justify-center py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Profile preview"
                className="size-32 rounded-full object-cover ring-1 ring-border"
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={isSaving}
              onClick={() => {
                setOpen(false);
                setPreview(null);
              }}
            >
              Cancel
            </Button>
            <Button type="button" disabled={isSaving} onClick={save}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

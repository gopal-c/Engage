"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ResumeUploadForm } from "@/components/skillshub/resume-upload-form";

export function VerifyUploadPanel({
  token,
  alreadyUploaded,
}: {
  token: string;
  alreadyUploaded: boolean;
}) {
  const [uploaded, setUploaded] = useState(alreadyUploaded);

  if (uploaded) {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <CheckCircle2 className="size-5 flex-shrink-0 text-green-600" />
        <p className="text-sm text-muted-foreground">
          {alreadyUploaded
            ? "Resume already uploaded."
            : "Resume uploaded! HR will review your profile shortly."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold">
        While you wait — upload your resume{" "}
        <span className="text-muted-foreground">(optional)</span>
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Uploading now gives HR more context to review your profile sooner. You can also do
        this after you&apos;re approved.
      </p>

      <div className="mt-4">
        <ResumeUploadForm
          endpoint="/api/skillshub/verify-upload"
          extraFields={{ token }}
          heading="Upload your resume"
          lede="PDF only, please."
          submitIdleLabel="Upload resume"
          submitBusyLabel="Extracting…"
          onSuccess={() => {
            toast.success("Resume uploaded! HR will review your profile shortly.");
            setUploaded(true);
          }}
        />
      </div>
    </div>
  );
}

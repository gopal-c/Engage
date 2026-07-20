import { NextResponse } from "next/server";
import { getScheduledSend, updateScheduledSendStatus } from "@/lib/birthdayhub/storage";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const job = await getScheduledSend(params.id);
  if (!job) {
    return NextResponse.json({ error: "Scheduled send not found" }, { status: 404 });
  }
  if (job.status !== "pending") {
    return NextResponse.json(
      { error: `Cannot cancel a job with status '${job.status}'` },
      { status: 409 }
    );
  }
  await updateScheduledSendStatus(params.id, "cancelled");
  return NextResponse.json({ ok: true });
}

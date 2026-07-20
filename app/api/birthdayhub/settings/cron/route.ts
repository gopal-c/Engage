import { NextResponse } from "next/server";

const WORKFLOW_PATH = ".github/workflows/birthday-cron.yml";
const WORKFLOW_FILE = "birthday-cron.yml";

function buildWorkflowYml(cronExpression: string): string {
  const S = "$";
  return [
    "name: Birthday Auto-Send",
    "",
    "on:",
    "  schedule:",
    `    - cron: '${cronExpression}'`,
    "  workflow_dispatch:",
    "",
    "jobs:",
    "  send:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - name: Trigger birthday cron",
    "        run: |",
    `          curl -X GET "${S}{{ secrets.APP_URL }}/api/birthdayhub/cron" \\`,
    `          -H "Authorization: Bearer ${S}{{ secrets.CRON_SECRET }}"`,
    "",
  ].join("\n");
}

export async function POST(req: Request) {
  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPO;

  if (!token || !repo) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN and GITHUB_REPO env vars are not configured" },
      { status: 503 }
    );
  }

  const body = await req.json() as { cronExpression?: string; dispatch?: boolean };

  if (body.dispatch) {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref: "main" }),
      }
    );
    if (!res.ok && res.status !== 204) {
      const detail = await res.text();
      return NextResponse.json({ error: "GitHub dispatch failed", detail }, { status: 500 });
    }
    return NextResponse.json({ ok: true, dispatched: true });
  }

  const { cronExpression } = body;
  if (!cronExpression) {
    return NextResponse.json({ error: "cronExpression is required" }, { status: 400 });
  }

  const githubFileUrl = `https://api.github.com/repos/${repo}/contents/${WORKFLOW_PATH}`;
  const githubHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  const getRes = await fetch(githubFileUrl, { headers: githubHeaders });

  let sha: string | undefined;
  if (getRes.ok) {
    const data = (await getRes.json()) as { sha: string };
    sha = data.sha;
  } else if (getRes.status !== 404) {
    const detail = await getRes.text();
    return NextResponse.json({ error: "Failed to read workflow file from GitHub", detail }, { status: 502 });
  }

  const newContent = buildWorkflowYml(cronExpression);
  const putPayload: Record<string, string> = {
    message: `chore: update birthday cron schedule to ${cronExpression}`,
    content: Buffer.from(newContent, "utf8").toString("base64"),
  };
  if (sha) putPayload.sha = sha;

  const putRes = await fetch(githubFileUrl, {
    method: "PUT",
    headers: githubHeaders,
    body: JSON.stringify(putPayload),
  });

  if (!putRes.ok) {
    const detail = await putRes.text();
    return NextResponse.json({ error: "Failed to update workflow file", detail }, { status: 502 });
  }

  return NextResponse.json({ ok: true, updated: true, cronExpression });
}

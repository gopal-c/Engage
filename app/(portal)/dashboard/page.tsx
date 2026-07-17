import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

const modules = [
  {
    title: "IdeaHub",
    description: "Share and vote on innovative ideas",
    icon: "💡",
    color: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
    href: "/apps/ideahub",
  },
  {
    title: "SkillsHub",
    description: "Track and develop your professional skills",
    icon: "🎯",
    color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
    href: "/apps/skillshub",
  },
  {
    title: "BirthdayHub",
    description: "Celebrate team birthdays and milestones",
    icon: "🎂",
    color: "bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-800",
    href: "/apps/birthdayhub",
  },
];

interface ActivityRow {
  id: string;
  source_app: string;
  event_type: string;
  title: string;
  description: string | null;
  created_at: string;
  user_name: string;
}

const appIcons: Record<string, string> = {
  ideahub: "💡",
  skillshub: "🎯",
  birthdayhub: "🎂",
  engage: "⚡",
};

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default async function DashboardPage() {
  const session = await auth();

  let recentActivity: ActivityRow[] = [];
  try {
    recentActivity = (await sql`
      SELECT af.id, af.source_app, af.event_type, af.title, af.description, af.created_at,
             u.name AS user_name
      FROM engage.activity_feed af
      JOIN auth.users u ON u.id = af.user_id
      ORDER BY af.created_at DESC
      LIMIT 10
    `) as ActivityRow[];
  } catch {
    // table may not exist yet
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">
          Welcome back, {session?.user?.name?.split(" ")[0]}!
        </h2>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s your engagement dashboard
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => (
          <a
            key={mod.title}
            href={mod.href}
            className={`rounded-xl border p-6 ${mod.color} transition-shadow hover:shadow-md`}
          >
            <div className="mb-3 text-3xl">{mod.icon}</div>
            <h3 className="text-lg font-semibold">{mod.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{mod.description}</p>
            <div className="mt-4">
              <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                Coming soon
              </span>
            </div>
          </a>
        ))}
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border bg-card p-3"
              >
                <span className="mt-0.5 text-lg">
                  {appIcons[item.source_app] ?? "⚡"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.user_name} &middot; {timeAgo(item.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

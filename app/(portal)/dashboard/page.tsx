import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { AppCard } from "@/components/app-card";
import { ActivityItem, type ActivityItemData } from "@/components/activity-item";
import Link from "next/link";

const appCards = [
  {
    title: "IdeaHub",
    description: "Share and vote on innovative ideas",
    icon: "💡",
    colorClasses: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
    href: process.env.IDEAHUB_URL || "/apps/ideahub",
    external: !!process.env.IDEAHUB_URL,
  },
  {
    title: "SkillsHub",
    description: "Track and develop your professional skills",
    icon: "🎯",
    colorClasses: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
    href: process.env.SKILLSHUB_URL || "/apps/skillshub",
    external: !!process.env.SKILLSHUB_URL,
  },
  {
    title: "BirthdayHub",
    description: "Celebrate team birthdays and milestones",
    icon: "🎂",
    colorClasses: "bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-800",
    href: process.env.BIRTHDAYHUB_URL || "/apps/birthdayhub",
    external: !!process.env.BIRTHDAYHUB_URL,
  },
];

export default async function DashboardPage() {
  const session = await auth();

  let recentActivity: ActivityItemData[] = [];
  try {
    recentActivity = (await sql`
      SELECT af.id, af.source_app, af.event_type, af.title, af.description, af.created_at,
             u.name AS user_name, u.avatar_url AS user_avatar
      FROM engage.activity_feed af
      JOIN auth.users u ON u.id = af.user_id
      ORDER BY af.created_at DESC
      LIMIT 10
    `) as ActivityItemData[];
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
        {appCards.map((card) => (
          <AppCard key={card.title} {...card} />
        ))}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <Link
            href="/activity"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

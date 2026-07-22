import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { AppCard } from "@/components/app-card";
import { ActivityItem, type ActivityItemData } from "@/components/activity-item";
import Link from "next/link";

async function getBirthdayStats() {
  try {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const todayMMDD = `${currentMonth}-${String(now.getDate()).padStart(2, "0")}`;

    const monthCount = await sql`
      SELECT COUNT(*)::int AS count FROM birthdayhub.employees
      WHERE birthday LIKE ${currentMonth + "-%"}
    `;

    const upcoming = await sql`
      SELECT name, birthday FROM birthdayhub.employees
      ORDER BY
        CASE WHEN birthday >= ${todayMMDD} THEN 0 ELSE 1 END,
        birthday ASC
      LIMIT 1
    `;

    if (upcoming.length === 0) return null;

    const emp = upcoming[0] as { name: string; birthday: string };
    const [mm, dd] = emp.birthday.split("-").map(Number);
    const nextDate = new Date(now.getFullYear(), mm - 1, dd);
    if (nextDate < now) nextDate.setFullYear(now.getFullYear() + 1);
    const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / 86400000);

    return {
      thisMonthCount: (monthCount[0] as { count: number }).count,
      nextName: emp.name,
      daysUntil: daysUntil === 0 ? "Today!" : `${daysUntil}d away`,
    };
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const session = await auth();

  const [birthdayStats, recentActivity] = await Promise.all([
    getBirthdayStats(),
    (async () => {
      try {
        return (await sql`
          SELECT af.id, af.source_app, af.event_type, af.title, af.description, af.created_at,
                 u.name AS user_name, u.avatar_url AS user_avatar
          FROM engage.activity_feed af
          JOIN auth.users u ON u.id = af.user_id
          ORDER BY af.created_at DESC
          LIMIT 10
        `) as ActivityItemData[];
      } catch {
        return [] as ActivityItemData[];
      }
    })(),
  ]);

  const appCards = [
    {
      title: "IdeaHub",
      description: "Share and vote on innovative ideas",
      icon: "💡",
      colorClasses: "bg-amber-soft border-amber-deep/20",
      href: process.env.IDEAHUB_URL || "/apps/ideahub",
      external: !!process.env.IDEAHUB_URL,
    },
    {
      title: "SkillsHub",
      description: "Track and develop your professional skills",
      icon: "🎯",
      colorClasses: "bg-indigo-soft border-indigo/20",
      href: process.env.SKILLSHUB_URL || "/apps/skillshub",
      external: !!process.env.SKILLSHUB_URL,
    },
    {
      title: "BirthdayHub",
      description: "Celebrate team birthdays and milestones",
      icon: "🎂",
      colorClasses: "bg-coral-soft border-coral/20",
      href: "/apps/birthdayhub",
      stat: birthdayStats
        ? { label: "birthdays this month", value: birthdayStats.thisMonthCount }
        : undefined,
      latestItem: birthdayStats
        ? `Next: ${birthdayStats.nextName} (${birthdayStats.daysUntil})`
        : undefined,
    },
  ];

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

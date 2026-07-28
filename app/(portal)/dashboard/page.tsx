import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { AppCard } from "@/components/app-card";
import { ActivityItem, type ActivityItemData } from "@/components/activity-item";
import Link from "next/link";

async function getSkillsHubStats() {
  try {
    const rows = await sql`SELECT COUNT(*)::int AS count FROM skillshub.profiles WHERE status = 'approved'`;
    return { profileCount: (rows[0] as { count: number }).count };
  } catch {
    return null;
  }
}

async function getIdeaHubStats() {
  try {
    const countRows = await sql`SELECT COUNT(*)::int AS count FROM ideahub.ideas`;
    const totalIdeas = (countRows[0] as { count: number }).count;
    const trendingRows = await sql`
      SELECT title FROM ideahub.ideas ORDER BY trending_score DESC, created_at DESC LIMIT 1
    `;
    const trendingTitle = trendingRows.length > 0 ? (trendingRows[0] as { title: string }).title : null;
    return { totalIdeas, trendingTitle };
  } catch {
    return null;
  }
}

async function getBirthdayStats() {
  try {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const todayMMDD = `${currentMonth}-${String(now.getDate()).padStart(2, "0")}`;

    const monthCount = await sql`
      SELECT COUNT(*)::int AS count FROM (
        SELECT email, date_of_birth FROM skillshub.profiles WHERE date_of_birth IS NOT NULL
        UNION
        SELECT email, date_of_birth FROM auth.users WHERE date_of_birth IS NOT NULL
      ) combined
      WHERE to_char(date_of_birth, 'MM') = ${currentMonth}
    `;

    const upcoming = await sql`
      SELECT DISTINCT ON (lower(email)) name, to_char(date_of_birth, 'MM-DD') AS birthday
      FROM (
        SELECT name, email, date_of_birth FROM skillshub.profiles WHERE date_of_birth IS NOT NULL
        UNION ALL
        SELECT name, email, date_of_birth FROM auth.users WHERE date_of_birth IS NOT NULL
      ) combined
      ORDER BY lower(email),
        CASE WHEN to_char(date_of_birth, 'MM-DD') >= ${todayMMDD} THEN 0 ELSE 1 END,
        to_char(date_of_birth, 'MM-DD') ASC
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

  const [birthdayStats, ideaHubStats, skillsHubStats, recentActivity] = await Promise.all([
    getBirthdayStats(),
    getIdeaHubStats(),
    getSkillsHubStats(),
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
      href: "/apps/ideahub",
      stat: ideaHubStats
        ? { label: "ideas shared", value: ideaHubStats.totalIdeas }
        : undefined,
      latestItem: ideaHubStats?.trendingTitle
        ? `Trending: ${ideaHubStats.trendingTitle}`
        : undefined,
    },
    {
      title: "SkillsHub",
      description: "Track and develop your professional skills",
      icon: "🎯",
      colorClasses: "bg-indigo-soft border-indigo/20",
      href: "/apps/skillshub",
      stat: skillsHubStats
        ? { label: "employee profiles", value: skillsHubStats.profileCount }
        : undefined,
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
        <h1 className="text-ink-800">
          Welcome back, <span className="serif-italic">{session?.user?.name?.split(" ")[0]}</span>
        </h1>
        <p className="mt-1 text-ink-500">
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
          <h3 className="text-ink-800">Recent Activity</h3>
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

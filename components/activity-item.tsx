import Link from "next/link";

const appIcons: Record<string, string> = {
  ideahub: "💡",
  skillshub: "🎯",
  birthdayhub: "🎂",
  engage: "⚡",
};

const appLinks: Record<string, string> = {
  ideahub: "/apps/ideahub",
  skillshub: "/apps/skillshub",
  birthdayhub: "/apps/birthdayhub",
  engage: "/dashboard",
};

export interface ActivityItemData {
  id: string;
  source_app: string;
  event_type: string;
  title: string;
  description: string | null;
  created_at: string;
  user_name: string;
  user_avatar?: string | null;
}

export function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function ActivityItem({ item }: { item: ActivityItemData }) {
  return (
    <Link
      href={appLinks[item.source_app] ?? "/dashboard"}
      className="flex items-start gap-3 rounded-xl border border-ink-200/60 bg-ink-0/70 p-3 shadow-1 backdrop-blur-sm transition-all hover:shadow-2 hover:bg-ink-0"
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
      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs capitalize text-muted-foreground">
        {item.source_app}
      </span>
    </Link>
  );
}

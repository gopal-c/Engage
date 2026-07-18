import Link from "next/link";
import { cn } from "@/lib/utils";

interface AppCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  colorClasses: string;
  stat?: { label: string; value: string | number };
  latestItem?: string;
  external?: boolean;
}

export function AppCard({
  title,
  description,
  icon,
  href,
  colorClasses,
  stat,
  latestItem,
  external,
}: AppCardProps) {
  const content = (
    <>
      <div className="mb-3 text-3xl">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {(stat || latestItem) ? (
        <div className="mt-4 space-y-1.5">
          {stat && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          )}
          {latestItem && (
            <p className="text-xs text-muted-foreground truncate">
              {latestItem}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            Coming soon
          </span>
        </div>
      )}
    </>
  );

  const classes = cn(
    "block rounded-xl border p-6 transition-shadow hover:shadow-md",
    colorClasses
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}

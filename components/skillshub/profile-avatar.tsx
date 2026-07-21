import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, var(--brand-coral),  var(--brand-amber))",
  "linear-gradient(135deg, var(--brand-indigo), var(--brand-teal))",
  "linear-gradient(135deg, var(--brand-teal),   var(--brand-amber))",
  "linear-gradient(135deg, var(--brand-indigo), var(--brand-coral))",
];

function gradientFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

type Props = {
  name: string;
  /** A URL or data: URL pulled straight from the DB. `null`/`undefined` -> gradient initials. */
  avatarUrl?: string | null;
  /** Tailwind size class, e.g. "size-10", "size-16". Default size-10 (40px). */
  className?: string;
};

/**
 * Profile avatar — renders the stored avatar_url when present, otherwise
 * shows a gradient + initial fallback. No URL construction logic; reads
 * exactly what the DB provides.
 */
export function ProfileAvatar({ name, avatarUrl, className }: Props) {
  return (
    <Avatar className={cn("size-10 after:hidden", className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
      <AvatarFallback
        className="font-medium text-white"
        style={{ background: gradientFor(name) }}
      >
        {initial(name)}
      </AvatarFallback>
    </Avatar>
  );
}

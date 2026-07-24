"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: string; disabled?: boolean };

const HR_NAV: NavItem[] = [
  { href: "/apps/skillshub/search", label: "AI Search", icon: "🔍" },
  { href: "/apps/skillshub/employees", label: "Directory", icon: "👥" },
  { href: "/apps/skillshub/review", label: "Review", icon: "📋" },
  { href: "/apps/skillshub/onboard", label: "Onboard", icon: "📄" },
];

function employeeNav(approved: boolean): NavItem[] {
  return [
    { href: "/apps/skillshub/home", label: "Home", icon: "🏠" },
    { href: "/apps/skillshub/me", label: "My Profile", icon: "👤", disabled: !approved },
  ];
}

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(href + "/");
}

export function SkillsHubSubNav({
  role,
  approved,
}: {
  role: "hr" | "employee";
  approved?: boolean;
}) {
  const pathname = usePathname();
  const items = role === "hr" ? HR_NAV : employeeNav(approved ?? false);

  return (
    <nav className="mb-6 flex items-center gap-1 self-start overflow-x-auto rounded-full bg-secondary p-1" aria-label="SkillsHub navigation">
      {items.map((item) => {
        const active = isActive(pathname, item.href);

        if (item.disabled) {
          return (
            <span
              key={item.href}
              title="Available once your account is approved"
              className="flex cursor-not-allowed items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground opacity-50"
            >
              <span>{item.icon}</span>
              {item.label}
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

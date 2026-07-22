"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; disabled?: boolean };

const HR_NAV: NavItem[] = [
  { href: "/apps/skillshub/search", label: "AI Search" },
  { href: "/apps/skillshub/employees", label: "Directory" },
  { href: "/apps/skillshub/review", label: "Review Queue" },
  { href: "/apps/skillshub/onboard", label: "Onboard" },
];

function employeeNav(approved: boolean): NavItem[] {
  return [
    { href: "/apps/skillshub/home", label: "Home" },
    { href: "/apps/skillshub/me", label: "My Profile", disabled: !approved },
    { href: "/apps/skillshub/upload", label: "Update Profile", disabled: !approved },
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
    <nav className="mb-6 flex items-center gap-1 border-b border-ink-200/60" aria-label="SkillsHub navigation">
      {items.map((item) => {
        const active = isActive(pathname, item.href);

        if (item.disabled) {
          return (
            <span
              key={item.href}
              title="Available once your account is approved"
              className="cursor-not-allowed px-3 py-2 text-sm text-muted-foreground opacity-50"
            >
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
              "relative px-3 py-2 text-sm transition-colors",
              active
                ? "font-medium text-ink-800"
                : "text-ink-500 hover:text-ink-800",
            )}
          >
            {item.label}
            {active && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-indigo-deep" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

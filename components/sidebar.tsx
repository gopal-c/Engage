"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  GraduationCap,
  Cake,
  Shield,
  Menu,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/apps/ideahub", label: "IdeaHub", icon: Lightbulb },
  { href: "/apps/skillshub", label: "SkillsHub", icon: GraduationCap },
  { href: "/apps/birthdayhub", label: "BirthdayHub", icon: Cake },
];

const hrItems = [
  { href: "/hr", label: "HR Dashboard", icon: Shield },
];

const adminItems = [
  { href: "/admin", label: "Admin", icon: Shield },
];

type LevelData = {
  totalXP: number;
  level: number;
  title: string;
  nextLevelXP: number;
  currentLevelXP: number;
  badges: { badge_key: string; earned_at: string }[];
  allBadges: { key: string; name: string; description: string; icon: string }[];
};

function NavLinks({
  role,
  pathname,
  onNavigate,
}: {
  role?: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              isActive
                ? "text-[#8B7BE8] bg-[rgba(139,123,232,0.08)]"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
            )}
          >
            <Icon className={cn("h-4 w-4", isActive && "text-[#8B7BE8]")} />
            {item.label}
          </Link>
        );
      })}
      {role === "hr" && (
        <>
          <div className="mx-3 my-2 h-px bg-gray-200/60" />
          {hrItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "text-[#8B7BE8] bg-[rgba(139,123,232,0.08)]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive && "text-[#8B7BE8]")} />
                {item.label}
              </Link>
            );
          })}
        </>
      )}
      {role === "admin" && (
        <>
          <div className="mx-3 my-2 h-px bg-gray-200/60" />
          {adminItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "text-[#8B7BE8] bg-[rgba(139,123,232,0.08)]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive && "text-[#8B7BE8]")} />
                {item.label}
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );
}

const BADGE_GRADIENTS = [
  "linear-gradient(150deg, #8B7BE8, #6B5BD6)",
  "linear-gradient(150deg, #7CD3C5, #4FA79A)",
  "linear-gradient(150deg, #FFCB6B, #E3A93F)",
];

function SidebarLevelSection() {
  const [data, setData] = useState<LevelData | null>(null);

  useEffect(() => {
    fetch("/api/xp")
      .then((r) => r.json())
      .then((d) => { if (d.totalXP !== undefined) setData(d); })
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="px-[18px] space-y-3 animate-pulse">
        <div className="h-3 w-24 rounded bg-gray-200" />
        <div className="h-[7px] w-full rounded-full bg-gray-200" />
        <div className="h-3 w-20 rounded bg-gray-200" />
      </div>
    );
  }

  const progress = data.nextLevelXP > data.currentLevelXP
    ? ((data.totalXP - data.currentLevelXP) / (data.nextLevelXP - data.currentLevelXP)) * 100
    : 100;

  const earnedKeys = new Set(data.badges.map((b) => b.badge_key));

  const xpToNext = data.nextLevelXP ? data.nextLevelXP - data.totalXP : 0;
  const nextLevel = data.level + 1;
  const earnedCount = data.badges.length;
  const totalCount = data.allBadges.length;

  return (
    <div style={{ padding: 18 }}>
      <p style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.9px", color: "rgb(110,111,140)", lineHeight: 1 }}>
        Level {data.level} · {data.title}
      </p>

      <div style={{ marginTop: 12, marginBottom: 8, height: 7, borderRadius: 999, background: "rgba(21,22,52,0.08)" }}>
        <div style={{ height: 7, borderRadius: 999, width: `${Math.min(progress, 100)}%`, background: "linear-gradient(90deg, #8B7BE8, #7CD3C5)", transition: "width 0.5s ease" }} />
      </div>

      <p style={{ fontSize: 12.5, color: "rgb(85,86,111)", lineHeight: 1 }}>
        {xpToNext > 0 ? <>{xpToNext} XP to <strong style={{ fontWeight: 600 }}>Level {nextLevel}</strong></> : `${data.totalXP} XP`}
      </p>

      {totalCount > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 14 }}>
          {data.allBadges.map((b, i) => {
            const earned = earnedKeys.has(b.key);
            return (
              <span
                key={b.key}
                title={earned ? b.name : `${b.name} — locked`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 30, height: 30, borderRadius: 999, fontSize: 14, cursor: "default",
                  ...(earned
                    ? { background: BADGE_GRADIENTS[i % BADGE_GRADIENTS.length], color: "#fff" }
                    : { background: "rgba(21,22,52,0.05)", color: "rgb(169,170,188)", filter: "grayscale(1)", opacity: 0.4 }
                  ),
                }}
              >
                {b.icon}
              </span>
            );
          })}
          <span style={{ fontSize: 12, color: "rgb(110,111,140)" }}>{earnedCount}/{totalCount}</span>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col shrink-0 sticky top-0 self-start gap-3 py-4">
      <div
        className="overflow-y-auto py-3"
        style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,.85)", background: "linear-gradient(155deg, rgba(255,255,255,.78), rgba(255,255,255,.54))", backdropFilter: "blur(30px) saturate(180%)", WebkitBackdropFilter: "blur(30px) saturate(180%)" }}
      >
        <NavLinks role={role} pathname={pathname} />
      </div>
      <div
        className="py-3"
        style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,.85)", background: "linear-gradient(155deg, rgba(255,255,255,.78), rgba(255,255,255,.54))", backdropFilter: "blur(30px) saturate(180%)", WebkitBackdropFilter: "blur(30px) saturate(180%)" }}
      >
        <SidebarLevelSection />
      </div>
    </aside>
  );
}

export function MobileSidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <div className="flex h-14 items-center px-5">
          <span className="text-xl font-bold tracking-tight text-ink-800">Engage</span>
        </div>
        <NavLinks role={role} pathname={pathname} onNavigate={() => setOpen(false)} />
        <div className="mx-4 my-4 h-px bg-gray-200/40" />
        <SidebarLevelSection />
      </SheetContent>
    </Sheet>
  );
}

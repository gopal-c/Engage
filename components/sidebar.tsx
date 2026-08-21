"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  GraduationCap,
  Cake,
  Trophy,
  Shield,
  Menu,
  Star,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/apps/ideahub", label: "IdeaHub", icon: Lightbulb },
  { href: "/apps/skillshub", label: "SkillsHub", icon: GraduationCap },
  { href: "/apps/birthdayhub", label: "BirthdayHub", icon: Cake },
  { href: "/apps/skillshub/milestones", label: "Milestones", icon: Trophy },
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
    <nav className="flex flex-col gap-0.5 px-3 py-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              isActive
                ? "bg-indigo-soft text-indigo-press shadow-1"
                : "text-ink-600 hover:bg-ink-100 hover:text-ink-800"
            )}
          >
            <Icon className={cn("h-4 w-4", isActive && "text-indigo-deep")} />
            {item.label}
          </Link>
        );
      })}
      {role === "hr" && (
        <>
          <Separator className="my-2" />
          {hrItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-indigo-soft text-indigo-press shadow-1"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-800"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive && "text-indigo-deep")} />
                {item.label}
              </Link>
            );
          })}
        </>
      )}
      {role === "admin" && (
        <>
          <Separator className="my-2" />
          {adminItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-indigo-soft text-indigo-press shadow-1"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-800"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive && "text-indigo-deep")} />
                {item.label}
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );
}

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
      <div className="px-4 py-3 space-y-2 animate-pulse">
        <div className="h-3 w-20 rounded bg-ink-200" />
        <div className="h-2 w-full rounded bg-ink-200" />
      </div>
    );
  }

  const progress = data.nextLevelXP > data.currentLevelXP
    ? ((data.totalXP - data.currentLevelXP) / (data.nextLevelXP - data.currentLevelXP)) * 100
    : 100;

  const earnedKeys = new Set(data.badges.map((b) => b.badge_key));

  return (
    <div className="px-4 py-3 space-y-3">
      {/* Level badge + info */}
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-soft">
          <Star className="size-4 text-indigo-deep" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-indigo-deep uppercase tracking-wider">
            Level {data.level} · {data.title}
          </p>
          <p className="text-xs text-ink-500">{data.totalXP} XP</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-1.5 rounded-full bg-ink-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-deep to-indigo transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-[9px] text-ink-400 mt-1 text-right">
          {data.totalXP - data.currentLevelXP} / {data.nextLevelXP - data.currentLevelXP} to next
        </p>
      </div>

      {/* Badges */}
      {data.allBadges.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.allBadges.map((b) => {
            const earned = earnedKeys.has(b.key);
            return (
              <span
                key={b.key}
                title={`${b.name}: ${b.description}`}
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-sm cursor-default transition-all",
                  earned
                    ? "bg-indigo-soft"
                    : "bg-ink-100 opacity-40 grayscale"
                )}
              >
                {b.icon}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuickActions({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="px-3 py-2 space-y-0.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400 px-3 mb-1">
        Quick Actions
      </p>
      <Link
        href="/apps/ideahub/submit"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-800 transition-all"
      >
        <Sparkles className="size-4 text-indigo-deep" />
        Submit an Idea
      </Link>
      <Link
        href="/apps/skillshub/milestones"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-800 transition-all"
      >
        <Trophy className="size-4 text-amber-deep" />
        Add a Milestone
      </Link>
      <Link
        href="/apps/birthdayhub"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-800 transition-all"
      >
        <Cake className="size-4 text-coral-deep" />
        BirthdayHub
      </Link>
    </div>
  );
}

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col bg-white/60 backdrop-blur-xl" style={{ borderRight: "var(--t-bar-border)" }}>
      <div className="flex h-14 items-center px-5" style={{ borderBottom: "var(--t-bar-border)" }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-ink-800">Engage</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <NavLinks role={role} pathname={pathname} />
        <Separator className="mx-4 my-1" />
        <SidebarLevelSection />
        <Separator className="mx-4 my-1" />
        <QuickActions />
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
        <div className="flex h-14 items-center px-5" style={{ borderBottom: "var(--t-bar-border)" }}>
          <span className="text-xl font-bold tracking-tight text-ink-800">Engage</span>
        </div>
        <NavLinks role={role} pathname={pathname} onNavigate={() => setOpen(false)} />
        <Separator className="mx-4 my-1" />
        <SidebarLevelSection />
        <Separator className="mx-4 my-1" />
        <QuickActions onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

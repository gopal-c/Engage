"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  GraduationCap,
  Cake,
  Activity,
  User,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/apps/ideahub", label: "IdeaHub", icon: Lightbulb },
  { href: "/apps/skillshub", label: "SkillsHub", icon: GraduationCap },
  { href: "/apps/birthdayhub", label: "BirthdayHub", icon: Cake },
  { href: "/activity", label: "Activity Feed", icon: Activity },
  { href: "/profile", label: "Profile", icon: User },
];

const adminItems = [
  { href: "/admin", label: "Admin", icon: Shield },
];

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
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );
}

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:bg-sidebar">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="text-lg font-bold">
          Engage
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <NavLinks role={role} pathname={pathname} />
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
        <div className="flex h-14 items-center border-b px-4">
          <span className="text-lg font-bold">Engage</span>
        </div>
        <NavLinks role={role} pathname={pathname} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

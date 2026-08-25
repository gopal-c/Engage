"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Shield } from "lucide-react";
import Link from "next/link";

const AVATAR_COLORS = ["#8B7BE8", "#FF9A82", "#7CD3C5", "#FFCB6B", "#6B58D9", "#E87760", "#5BBFB0"];

function nameToColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface UserMenuProps {
  name: string;
  email: string;
  image?: string | null;
  role?: string;
  signOutAction: () => Promise<void>;
}

export function UserMenu({ name, email, image, role, signOutAction }: UserMenuProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarBg = nameToColor(name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-ink-100/50 outline-none">
        <Avatar className="h-8 w-8">
          <AvatarImage src={image ?? undefined} alt={name} />
          <AvatarFallback className="text-xs font-bold text-white" style={{ backgroundColor: avatarBg }}>{initials}</AvatarFallback>
        </Avatar>
        <div className="hidden sm:block text-left">
          <span className="block text-sm font-medium leading-tight text-ink-800">{name}</span>
          {role && (
            <span className="block text-[10px] capitalize leading-tight text-ink-400">{role}</span>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        {role === "hr" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/hr" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                HR Dashboard
              </Link>
            </DropdownMenuItem>
          </>
        )}
        {role === "admin" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={signOutAction} className="w-full">
            <button type="submit" className="flex w-full items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

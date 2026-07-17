import { signOut } from "@/lib/auth";
import { MobileSidebar } from "./sidebar";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";

interface HeaderProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
    role?: string;
  };
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-2">
        <MobileSidebar role={user.role} />
        <span className="text-lg font-bold md:hidden">Engage</span>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <UserMenu
          name={user.name}
          email={user.email}
          image={user.image}
          signOutAction={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        />
      </div>
    </header>
  );
}
